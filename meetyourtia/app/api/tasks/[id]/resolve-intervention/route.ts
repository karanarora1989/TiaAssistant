import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { enforceTimeWindow } from '@/lib/urgency-detector';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: taskId } = await params;

    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id, assigned_to, needs_intervention')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (!task) return errorResponse('Task not found', 404);
    if (!task.needs_intervention) return errorResponse('No active intervention on this task', 400);

    await supabaseAdmin
      .from('tasks')
      .update({ needs_intervention: false, blocked_by: null })
      .eq('id', taskId);

    // Separate people query — tasks has no FK to people
    const { data: person } = task.assigned_to
      ? await supabaseAdmin
          .from('people')
          .select('name, phone_number')
          .eq('user_id', userId)
          .eq('name', task.assigned_to)
          .single()
      : { data: null };

    // Push to next window boundary (enforceTimeWindow from now pushes early-hours to 9am)
    const next9am = enforceTimeWindow(new Date(Date.now() + 60 * 1000));

    if (person?.phone_number) {
      await supabaseAdmin.from('ai_calls').insert({
        task_id: taskId,
        user_id: userId,
        recipient_phone: person.phone_number,
        recipient_name: person.name ?? task.assigned_to,
        call_type: 'followup',
        call_urgency: 'medium',
        attempt_number: 1,
        scheduled_at: next9am.toISOString(),
        status: 'scheduled',
      });

      await supabaseAdmin
        .from('tasks')
        .update({ call_scheduled_at: next9am.toISOString() })
        .eq('id', taskId);
    }

    return successResponse({
      success: true,
      task_id: taskId,
      next_followup_at: person?.phone_number ? next9am.toISOString() : null,
    });
  } catch (error: any) {
    console.error('Resolve intervention error:', error);
    return errorResponse(error.message ?? 'Failed to resolve intervention', 500);
  }
}
