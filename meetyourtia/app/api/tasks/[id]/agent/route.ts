import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { scheduleCall } from '@/lib/call-scheduler';
import { clerkClient } from '@clerk/nextjs/server';

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
      .select('*')
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
    if (agent_enabled && agent_call && task.assigned_to && task.due_date_iso) {
      let recipientPhone = '';
      let recipientName = task.assigned_to;

      if (task.assigned_to === 'self') {
        // Get user's phone number from Clerk metadata
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          recipientPhone = user.publicMetadata?.phone_number as string || '';
          recipientName = user.firstName || 'You';
        } catch (error) {
          console.error('Failed to get user phone:', error);
        }
      } else {
        // Get person's phone number
        const { data: person } = await supabaseAdmin
          .from('people')
          .select('phone_number')
          .eq('user_id', userId)
          .eq('name', task.assigned_to)
          .single();

        recipientPhone = person?.phone_number || '';
      }

      if (recipientPhone) {
        try {
          await scheduleCall({
            taskId: task.id,
            userId: userId,
            recipientPhone: recipientPhone,
            recipientName: recipientName
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
