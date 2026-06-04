import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callClaude, parseClaudeJSON } from '@/lib/claude';
import { buildContext } from '@/lib/context';
import { enforceFreeTierLimit } from '@/lib/free-tier';
import { enforceRateLimit } from '@/lib/rate-limit';
import { updateBrain, updatePeopleCounts, updateEntityCounts } from '@/lib/brain-update';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { scheduleCall } from '@/lib/call-scheduler';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    
    // Rate limiting
    await enforceRateLimit(userId);
    
    // Free tier check
    await enforceFreeTierLimit(userId);
    
    const body = await req.json();
    const { transcript, captureMethod = 'voice' } = body;

    if (!transcript || transcript.trim().length === 0) {
      return errorResponse('Transcript is required', 400);
    }

    // Build context from Brain + Soul
    const context = await buildContext(userId);

    // Task extraction prompt
    const extractionPrompt = `You are Tia, an AI executive assistant. Extract task(s) from this voice note.

${context}

Voice note: "${transcript}"

Extract ALL tasks mentioned. For each task, determine:
1. title - The actual deliverable/outcome (e.g., "MFR deck to be completed", NOT "Follow up with John")
2. context - why this task exists
3. received_from - if someone delegated this task to the speaker, their single name (string).
   Look for patterns like: "X asked me to", "per X", "X wants me to", "from X", "X told me to",
   "X needs me to", "X requested that I". Use null if self-initiated.
   This is NOT the same as assigned_to — received_from is who gave the task, assigned_to is who does it.
4. assigned_to - who does the work (single name). If the user is doing it themselves, use "self". If assigning to someone else, use that person's name.
5. participants - everyone mentioned (array)
6. due_date - Just the date in friendly format ("Today", "Tomorrow", "Monday", "May 25")
7. due_time - Separate time if mentioned ("10:00 AM", "3:30 PM", or null if not specified)
8. due_date_iso - ALWAYS provide an ISO date (YYYY-MM-DD). If date mentioned, use it. If urgent/ASAP, use today. If no urgency mentioned, use tomorrow. Never leave null.
9. time_sensitivity - "hard", "soft", or "flexible"
10. task_domain - "work" or "personal" (infer silently)
11. entity_type - free text (e.g. "project", "patient", "product")
12. entity_name - title case (e.g. "Atlas Migration")
13. priority - "high", "medium", or "low"

Return JSON array of tasks:
[{
  "title": "...",
  "context": "...",
  "received_from": "Person Name or null",
  "assigned_to": "Person Name or self",
  "participants": [],
  "due_date": "today",
  "due_date_iso": "2026-05-15",
  "time_sensitivity": "hard",
  "task_domain": "work",
  "entity_type": "project",
  "entity_name": "Project Name",
  "priority": "high"
}]

Return ONLY valid JSON array, no markdown.`;

    const response = await callClaude(
      'You are an expert at extracting structured task data from natural language.',
      [{ role: 'user', content: extractionPrompt }],
      { maxTokens: 2000, temperature: 0.3 }
    );

    const tasks = parseClaudeJSON<any[]>(response.content);

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return errorResponse('No tasks found in the transcript', 400);
    }

    // Insert tasks into database
    const taskRows = tasks.map(task => ({
      user_id: userId,
      title: task.title,
      transcript,
      context: task.context || null,
      
      assigned_to: task.assigned_to || 'self',
      received_from: task.received_from || null,
      participants: task.participants || [],
      
      due_date: task.due_date || 'today',
      due_date_iso: task.due_date_iso || new Date().toISOString().split('T')[0],
      time_sensitivity: task.time_sensitivity || 'flexible',
      task_domain: task.task_domain || 'work',
      entity_type: task.entity_type || null,
      entity_name: task.entity_name || null,
      priority: task.priority || 'medium',
      
      // Updated status (NEW)
      status: 'not_started',
      status_details: {},
      
      // Follow-up fields (NEW)
      next_action_date: null,
      followup_count: 0,
      needs_intervention: false,
      
      capture_method: captureMethod,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(taskRows)
      .select();

    if (insertError) {
      console.error('Task insertion error:', insertError);
      return errorResponse('Failed to save tasks', 500);
    }

    // Insert task history for each task
    const historyRows = insertedTasks.map((task: any) => ({
      task_id: task.id,
      user_id: userId,
      change_type: 'created',
      field_changed: 'status',
      old_value: null,
      new_value: 'open',
      reason: 'Task created from capture',
      source: captureMethod,
      changed_at: new Date().toISOString(),
    }));

    await supabaseAdmin
      .from('task_history')
      .insert(historyRows);

    // Update people and entities (async, non-blocking)
    for (const task of tasks as any[]) {
      if (task.participants && task.participants.length > 0) {
        for (const person of task.participants) {
          // Upsert person
          await supabaseAdmin
            .from('people')
            .upsert({
              user_id: userId,
              name: person,
              last_mentioned: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,name',
            });
          
          // Update counts
          updatePeopleCounts(userId, person).catch(console.error);
        }
      }

      if (task.entity_name) {
        // Upsert entity
        await supabaseAdmin
          .from('entities')
          .upsert({
            user_id: userId,
            entity_name: task.entity_name,
            entity_type: task.entity_type || 'project',
            last_mentioned: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,entity_name',
          });
        
        // Update counts
        updateEntityCounts(userId, task.entity_name).catch(console.error);
      }
    }

    // Check agent settings and schedule calls
    for (const insertedTask of insertedTasks) {
      try {
        // Check if task is assigned to someone
        if (insertedTask.assigned_to && insertedTask.assigned_to !== 'self' && insertedTask.due_date_iso) {
          // Get person's agent settings
          const { data: person } = await supabaseAdmin
            .from('people')
            .select('agent_enabled, agent_call, phone_number')
            .eq('user_id', userId)
            .eq('name', insertedTask.assigned_to)
            .single();

          if (person?.agent_enabled && person?.agent_call && person?.phone_number) {
            // Inherit agent settings from person
            await supabaseAdmin
              .from('tasks')
              .update({
                agent_enabled: true,
                agent_source: 'person',
                agent_call: person.agent_call
              })
              .eq('id', insertedTask.id);

            // Schedule the call
            await scheduleCall({
              taskId: insertedTask.id,
              userId: userId,
              recipientPhone: person.phone_number,
              recipientName: insertedTask.assigned_to
            });

            console.log(`Agent call scheduled for task ${insertedTask.id} to ${insertedTask.assigned_to}`);
          }
        }
      } catch (error) {
        console.error(`Failed to schedule call for task ${insertedTask.id}:`, error);
        // Don't fail the whole request if scheduling fails
      }
    }

    // Update brain (async, non-blocking)
    updateBrain(userId).catch(console.error);

    return successResponse({
      tasks: insertedTasks,
      count: insertedTasks.length,
    }, `${insertedTasks.length} task(s) captured successfully`);

  } catch (error: any) {
    console.error('Capture error:', error);
    return errorResponse(error.message || 'Failed to capture task', 500);
  }
}
