import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { scheduleCall } from '@/lib/call-scheduler';

/**
 * Toggle agent for a specific task
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;
    const body = await req.json();
    
    const { agent_enabled, agent_call, agent_remind, agent_followup } = body;

    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('*, people!inner(phone_number)')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (!task) {
      return errorResponse('Task not found', 404);
    }

    // Update agent settings
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({
        agent_enabled,
        agent_source: 'manual', // User manually set this
        agent_call: agent_call ?? true,
        agent_remind: agent_remind ?? true,
        agent_followup: agent_followup ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      return errorResponse('Failed to update agent settings', 500);
    }

    // If enabling agent and call is enabled, schedule call
    if (agent_enabled && agent_call && task.assigned_to && task.assigned_to !== 'self') {
      // Get person's phone number
      const { data: person } = await supabaseAdmin
        .from('people')
        .select('phone_number')
        .eq('user_id', userId)
        .eq('name', task.assigned_to)
        .single();

      if (person?.phone_number && task.due_date_iso) {
        try {
          await scheduleCall({
            taskId: task.id,
            userId: userId,
            recipientPhone: person.phone_number,
            recipientName: task.assigned_to
          });
        } catch (error) {
          console.error('Failed to schedule call:', error);
          // Don't fail the request if scheduling fails
        }
      }
    }

    return successResponse({ 
      agent_enabled,
      message: agent_enabled ? 'Agent enabled for this task' : 'Agent disabled for this task'
    });

  } catch (error: any) {
    console.error('Agent toggle error:', error);
    return errorResponse(error.message || 'Failed to toggle agent', 500);
  }
}
