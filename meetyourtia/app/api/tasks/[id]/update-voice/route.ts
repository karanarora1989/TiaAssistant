import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callClaude, parseClaudeJSON } from '@/lib/claude';
import { buildContext } from '@/lib/context';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    const taskId = params.id;
    const body = await req.json();
    const { transcript } = body;

    if (!transcript || transcript.trim().length === 0) {
      return errorResponse('Transcript is required', 400);
    }

    // Fetch current task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      return errorResponse('Task not found', 404);
    }

    // Build context
    const context = await buildContext(userId);

    // Extract update intent
    const intentPrompt = `You are Tia, an AI assistant. The user wants to update a task.

${context}

Current task:
- Title: ${task.title}
- Due date: ${task.due_date} (${task.due_date_iso})
- Status: ${task.status}
- Assigned to: ${task.assigned_to || 'self'}

User said: "${transcript}"

Extract the update intent and return JSON:
{
  "action": "reschedule" | "complete" | "cancel" | "reassign" | "block",
  "reason": "user's reason for the update",
  "updates": {
    // For reschedule:
    "due_date": "friendly format",
    "due_date_iso": "YYYY-MM-DD",
    
    // For reassign:
    "assigned_to": "person name",
    
    // For block:
    "blocked_by": "blocking reason",
    
    // For cancel:
    "archived": true
  }
}

Return ONLY valid JSON, no markdown.`;

    const response = await callClaude(
      'You are an expert at extracting task update intents from natural language.',
      [{ role: 'user', content: intentPrompt }],
      { maxTokens: 1000, temperature: 0.3 }
    );

    const intent = parseClaudeJSON<any>(response.content);

    // Build update object
    const updates: any = {};
    let changeType = intent.action;
    let fieldChanged = '';
    let oldValue = '';
    let newValue = '';

    switch (intent.action) {
      case 'reschedule':
        updates.due_date = intent.updates.due_date;
        updates.due_date_iso = intent.updates.due_date_iso;
        fieldChanged = 'due_date';
        oldValue = task.due_date_iso;
        newValue = intent.updates.due_date_iso;
        break;

      case 'complete':
        updates.status = 'done';
        fieldChanged = 'status';
        oldValue = task.status;
        newValue = 'done';
        break;

      case 'cancel':
        updates.status = 'done';
        updates.archived = true;
        updates.status_details = { cancelled: true, cancel_reason: intent.reason };
        fieldChanged = 'status';
        oldValue = task.status;
        newValue = 'cancelled';
        changeType = 'status_update';
        break;

      case 'reassign':
        updates.assigned_to = intent.updates.assigned_to;
        fieldChanged = 'assigned_to';
        oldValue = task.assigned_to;
        newValue = intent.updates.assigned_to;
        break;

      case 'block':
        updates.status = 'blocked';
        updates.blocked_by = intent.updates.blocked_by;
        fieldChanged = 'status';
        oldValue = task.status;
        newValue = 'blocked';
        break;

      default:
        return errorResponse('Unknown action', 400);
    }

    updates.updated_at = new Date().toISOString();

    // Update task
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Task update error:', updateError);
      return errorResponse('Failed to update task', 500);
    }

    // Log history
    await supabaseAdmin
      .from('task_history')
      .insert({
        task_id: taskId,
        user_id: userId,
        change_type: changeType,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue,
        reason: intent.reason,
        source: 'voice',
        changed_at: new Date().toISOString(),
      });

    return successResponse({
      task: updatedTask,
      intent,
    }, `Task ${intent.action}d successfully`);

  } catch (error: any) {
    console.error('Voice update error:', error);
    return errorResponse(error.message || 'Failed to process voice update', 500);
  }
}
