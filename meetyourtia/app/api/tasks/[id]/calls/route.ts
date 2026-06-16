import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;

    // Verify task belongs to user
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (!task) return errorResponse('Task not found', 404);

    const { data: calls } = await supabaseAdmin
      .from('ai_calls')
      .select('id, outcome_state, call_summary, completed_at, status, attempt_number')
      .eq('task_id', taskId)
      .in('status', ['completed', 'no_answer'])
      .not('outcome_state', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(7);

    return successResponse({ calls: calls ?? [] });
  } catch (error: any) {
    return errorResponse(error.message ?? 'Failed to fetch call history', 500);
  }
}
