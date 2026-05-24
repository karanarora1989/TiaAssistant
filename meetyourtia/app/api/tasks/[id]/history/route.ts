import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    const taskId = params.id;

    // Verify task belongs to user
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (!task) {
      return errorResponse('Task not found', 404);
    }

    // Fetch task history
    const { data: history, error } = await supabaseAdmin
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return errorResponse('Failed to fetch history', 500);
    }

    return successResponse({
      history: history || [],
      count: history?.length || 0,
    });

  } catch (error: any) {
    console.error('Task history API error:', error);
    return errorResponse(error.message || 'Failed to fetch task history', 500);
  }
}
