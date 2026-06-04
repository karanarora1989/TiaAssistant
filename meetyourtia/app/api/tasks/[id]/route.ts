import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { updateBrain } from '@/lib/brain-update';
import { successResponse, errorResponse } from '@/lib/api-handler';

// GET single task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      return errorResponse('Task not found', 404);
    }

    return successResponse({ task });
  } catch (error: any) {
    console.error('Task fetch error:', error);
    return errorResponse(error.message || 'Failed to fetch task', 500);
  }
}

// PATCH update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;
    const body = await req.json();

    const {
      status,
      title,
      due_date,
      due_date_iso,
      assigned_to,
      priority,
      blocked_by,
      received_from,
    } = body;

    // Get current task
    const { data: currentTask, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentTask) {
      return errorResponse('Task not found', 404);
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
      last_modified_at: new Date().toISOString(),
    };

    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (due_date !== undefined) updates.due_date = due_date;
    if (due_date_iso !== undefined) updates.due_date_iso = due_date_iso;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (priority !== undefined) updates.priority = priority;
    if (blocked_by !== undefined) updates.blocked_by = blocked_by;
    if (received_from !== undefined) updates.received_from = received_from; // null clears it

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

    // Log history for each changed field
    const historyRows = [];
    for (const [field, newValue] of Object.entries(updates)) {
      if (field === 'updated_at' || field === 'last_modified_at') continue;
      
      const oldValue = currentTask[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        historyRows.push({
          task_id: taskId,
          user_id: userId,
          change_type: 'status_update',
          field_changed: field,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
          source: 'text',
          changed_at: new Date().toISOString(),
        });
      }
    }

    if (historyRows.length > 0) {
      await supabaseAdmin
        .from('task_history')
        .insert(historyRows);
    }

    // Update brain (async)
    updateBrain(userId).catch(console.error);

    return successResponse({ task: updatedTask }, 'Task updated successfully');
  } catch (error: any) {
    console.error('Task update error:', error);
    return errorResponse(error.message || 'Failed to update task', 500);
  }
}
