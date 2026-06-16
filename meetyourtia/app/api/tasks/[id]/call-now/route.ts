import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { groupByAssignee, executeGroup, getPendingCalls } from '@/lib/call-scheduler';
import { successResponse, errorResponse } from '@/lib/api-handler';

/**
 * Immediately trigger the scheduled call for a task, bypassing the cron queue.
 * Useful for testing and for retrying failed calls.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;

    // Find the most recent scheduled or failed call for this task
    const { data: call, error } = await supabaseAdmin
      .from('ai_calls')
      .select('id, status, recipient_name, scheduled_at')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .in('status', ['scheduled', 'failed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !call) {
      return errorResponse('No scheduled call found for this task. Enable the agent first.', 404);
    }

    // Reset to scheduled so executeCall picks it up
    await supabaseAdmin
      .from('ai_calls')
      .update({ status: 'scheduled' })
      .eq('id', call.id);

    // Re-fetch with task data so groupByAssignee can work
    const pending = await getPendingCalls();
    const forThisCall = pending.filter((c: any) => c.id === call.id);
    if (forThisCall.length > 0) {
      const groups = groupByAssignee(forThisCall);
      for (const group of groups) await executeGroup(group);
    }

    return successResponse({
      call_id: call.id,
      recipient: call.recipient_name,
    }, `Call triggered for ${call.recipient_name}`);

  } catch (error: any) {
    console.error('Call-now error:', error);
    return errorResponse(error.message || 'Failed to trigger call', 500);
  }
}
