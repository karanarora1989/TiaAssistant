import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callClaude, parseClaudeJSON } from '@/lib/claude';
import { buildContext } from '@/lib/context';
import { enforceFreeTierLimit } from '@/lib/free-tier';
import { enforceRateLimit } from '@/lib/rate-limit';
import { updateBrain, updatePeopleCounts, updateEntityCounts } from '@/lib/brain-update';
import { successResponse, errorResponse } from '@/lib/api-handler';

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
1. title - clear task description
2. context - why this task exists
3. assigned_from - who is delegating this task (the speaker's name from context, or null if self-task)
4. assigned_to - who does the work (single name). If the user is doing it themselves, use "self". If assigning to someone else, use that person's name.
5. participants - everyone mentioned (array)
6. due_date - flexible format ("Monday", "EOD", "next week", or "today" if not specified)
7. due_date_iso - ALWAYS provide an ISO date (YYYY-MM-DD). If date mentioned, use it. If urgent/ASAP, use today. If no urgency mentioned, use tomorrow. Never leave null.
8. time_sensitivity - "hard", "soft", or "flexible"
9. task_domain - "work" or "personal" (infer silently)
10. entity_type - free text (e.g. "project", "patient", "product")
11. entity_name - title case (e.g. "Atlas Migration")
12. priority - "high", "medium", or "low"

Return JSON array of tasks:
[{
  "title": "...",
  "context": "...",
  "assigned_from": "Speaker Name or null",
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
      
      // Delegation fields (NEW)
      assigned_from: task.assigned_from || null,
      assigned_to: task.assigned_to || 'self',
      
      // Keep received_from for backward compatibility
      received_from: task.received_from || [],
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
    const historyRows = insertedTasks.map(task => ({
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
