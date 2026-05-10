import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

// Cron job to carry over open tasks daily at 00:01
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse('Unauthorized', 401);
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all open tasks with due dates before today
    const { data: tasksToCarryOver, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .eq('archived', false)
      .lt('due_date_iso', today)
      .neq('carried_over', true); // Only tasks not already carried over today

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return errorResponse('Failed to fetch tasks', 500);
    }

    if (!tasksToCarryOver || tasksToCarryOver.length === 0) {
      return successResponse({ 
        message: 'No tasks to carry over',
        count: 0,
      });
    }

    // Update each task
    const updates = tasksToCarryOver.map(task => ({
      id: task.id,
      carried_over: true,
      carry_over_count: (task.carry_over_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }));

    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .upsert(updates);

    if (updateError) {
      console.error('Update error:', updateError);
      return errorResponse('Failed to update tasks', 500);
    }

    // Log history for each task
    const historyRows = tasksToCarryOver.map(task => ({
      task_id: task.id,
      user_id: task.user_id,
      change_type: 'carry_over',
      field_changed: 'carry_over_count',
      old_value: String(task.carry_over_count || 0),
      new_value: String((task.carry_over_count || 0) + 1),
      reason: 'Daily carry-over job',
      source: 'system',
      changed_at: new Date().toISOString(),
    }));

    await supabaseAdmin
      .from('task_history')
      .insert(historyRows);

    return successResponse({
      message: `Carried over ${tasksToCarryOver.length} tasks`,
      count: tasksToCarryOver.length,
    });

  } catch (error: any) {
    console.error('Carry-over job error:', error);
    return errorResponse(error.message || 'Carry-over job failed', 500);
  }
}
