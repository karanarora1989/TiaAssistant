import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { scheduleCall } from '@/lib/call-scheduler';

/**
 * Toggle agent for a specific person
 * When enabled, all tasks assigned to this person will inherit agent settings
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: personId } = await params;
    const body = await req.json();
    
    const { agent_enabled, agent_call, agent_remind, agent_followup } = body;

    // Verify person belongs to user
    const { data: person } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('id', personId)
      .eq('user_id', userId)
      .single();

    if (!person) {
      return errorResponse('Person not found', 404);
    }

    // Update person's agent settings
    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update({
        agent_enabled,
        agent_call: agent_call ?? true,
        agent_remind: agent_remind ?? true,
        agent_followup: agent_followup ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', personId);

    if (updateError) {
      return errorResponse('Failed to update agent settings', 500);
    }

    // If enabling agent, update all open tasks assigned to this person
    if (agent_enabled) {
      await supabaseAdmin
        .from('tasks')
        .update({
          agent_enabled: true,
          agent_source: 'person', // Inherited from person settings
          agent_call: agent_call ?? true,
          agent_remind: agent_remind ?? true,
          agent_followup: agent_followup ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('assigned_to', person.name)
        .neq('status', 'done')
        .eq('archived', false);
    } else {
      // If disabling, only disable tasks that inherited from person (not manually set)
      await supabaseAdmin
        .from('tasks')
        .update({
          agent_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('assigned_to', person.name)
        .eq('agent_source', 'person')
        .neq('status', 'done')
        .eq('archived', false);
    }

    // Schedule calls for existing tasks when enabling
    if (agent_enabled && person.phone_number) {
      const { data: tasksToSchedule } = await supabaseAdmin
        .from('tasks')
        .select('id, due_date_iso')
        .eq('user_id', userId)
        .eq('assigned_to', person.name)
        .eq('agent_enabled', true)
        .neq('status', 'done')
        .eq('archived', false);

      for (const task of tasksToSchedule ?? []) {
        if (task.due_date_iso) {
          try {
            await scheduleCall({
              taskId: task.id,
              userId,
              recipientPhone: person.phone_number,
              recipientName: person.name,
            });
          } catch (e) {
            console.error(`Failed to schedule call for task ${task.id}:`, e);
          }
        }
      }
    }

    return successResponse({
      agent_enabled,
      phone_missing: agent_enabled && !person.phone_number,
      message: agent_enabled
        ? `Agent enabled for all tasks assigned to ${person.name}`
        : `Agent disabled for ${person.name}`,
    });

  } catch (error: any) {
    console.error('Agent toggle error:', error);
    return errorResponse(error.message || 'Failed to toggle agent', 500);
  }
}
