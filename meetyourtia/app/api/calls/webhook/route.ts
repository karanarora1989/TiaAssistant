import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { analyzeTaskUrgency } from '@/lib/urgency-detector';
import {
  isAlreadyAnalysed,
  analyzeTranscript,
  persistOutcome,
  scheduleNextAction,
} from '@/lib/follow-up-intelligence';
import { isNoAnswerTerminal, calculateRetryTime } from '@/lib/urgency-detector';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { call_id: blandCallId, status, duration, transcript } = payload;

    console.log('Bland AI webhook received:', { blandCallId, status });

    // Find ALL ai_calls rows sharing this bland_call_id (batch-aware)
    const { data: calls } = await supabaseAdmin
      .from('ai_calls')
      .select('*, tasks(*)')
      .eq('bland_call_id', blandCallId);

    if (!calls || calls.length === 0) {
      console.error('Call not found for Bland ID:', blandCallId);
      return errorResponse('Call not found', 404);
    }

    const costPerMinute = 0.09;
    const cost = ((duration ?? 0) / 60) * costPerMinute;

    const callStatus =
      status === 'completed'
        ? 'completed'
        : status === 'no-answer' || status === 'busy'
        ? 'no_answer'
        : 'failed';

    await supabaseAdmin
      .from('ai_calls')
      .update({
        status: callStatus,
        duration_seconds: duration ?? 0,
        transcript: transcript ?? '',
        completed_at: new Date().toISOString(),
        cost_usd: cost,
      })
      .eq('bland_call_id', blandCallId);

    if (callStatus === 'completed') {
      // Idempotency: skip if already analysed
      const alreadyDone = await isAlreadyAnalysed(calls[0].id);
      if (alreadyDone) {
        return successResponse({ received: true, skipped: true });
      }

      const tasks = calls.map(c => c.tasks).filter(Boolean);

      let analyses;
      try {
        analyses = await analyzeTranscript(transcript ?? '', tasks);
      } catch (err) {
        // Mark all rows as analysis_failed — cron will retry
        await supabaseAdmin
          .from('ai_calls')
          .update({ outcome_state: 'analysis_failed' })
          .eq('bland_call_id', blandCallId);
        console.error('Claude analysis failed:', err);
        return successResponse({ received: true, analysis: 'failed' });
      }

      for (const call of calls) {
        if (!call.tasks) continue;
        const analysis =
          analyses.find((a: any) => a.task_id === call.task_id) ?? analyses[0];
        if (!analysis) continue;

        await persistOutcome(call.id, call.task_id, analysis);
        await scheduleNextAction(
          call.task_id,
          call.user_id,
          call.recipient_phone,
          call.recipient_name,
          analysis
        );
      }
    } else if (callStatus === 'no_answer') {
      for (const call of calls) {
        if (!call.tasks) continue;
        const task = call.tasks;
        const noAnswerCount = (task.followup_count ?? 0) + 1;

        if (isNoAnswerTerminal(task, noAnswerCount)) {
          await supabaseAdmin
            .from('ai_calls')
            .update({ outcome_state: 'no_answer_terminal' })
            .eq('id', call.id);
          await supabaseAdmin
            .from('tasks')
            .update({
              needs_intervention: true,
              blocked_by: `${call.recipient_name ?? 'Assignee'} unreachable — ${noAnswerCount} attempts`,
            })
            .eq('id', call.task_id);
        } else {
          await supabaseAdmin
            .from('ai_calls')
            .update({ outcome_state: 'no_answer' })
            .eq('id', call.id);

          const urgency = analyzeTaskUrgency(task);
          const retryAt = calculateRetryTime(call.attempt_number ?? 0, urgency.urgency);

          await supabaseAdmin.from('ai_calls').insert({
            task_id: call.task_id,
            user_id: call.user_id,
            recipient_phone: call.recipient_phone,
            recipient_name: call.recipient_name,
            call_type: call.call_type,
            call_urgency: urgency.urgency,
            attempt_number: (call.attempt_number ?? 0) + 1,
            scheduled_at: retryAt.toISOString(),
            status: 'scheduled',
          });
        }
      }
    }

    return successResponse({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return errorResponse(error.message ?? 'Webhook processing failed', 500);
  }
}
