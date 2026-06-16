import { callClaude, parseClaudeJSON } from './claude';
import { supabaseAdmin } from './supabase';
import { buildAnalysisPrompt } from './prompts/follow-up';
import { enforceTimeWindow } from './urgency-detector';
import type { TranscriptAnalysis, OutcomeState } from './types/follow-up';

const INTERVENTION_STATES: OutcomeState[] = [
  'blocked_external',
  'blocked_cannot_complete',
  'no_answer_terminal',
];

// ── Idempotency guard ─────────────────────────────────────────

export async function isAlreadyAnalysed(callId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('ai_calls')
    .select('outcome_state')
    .eq('id', callId)
    .single();
  return data?.outcome_state != null;
}

// ── Transcript analysis ───────────────────────────────────────

export async function analyzeTranscript(
  transcript: string,
  tasks: any[]
): Promise<TranscriptAnalysis[]> {
  const prompt = buildAnalysisPrompt(transcript, tasks);

  const response = await callClaude(
    'You are a precise JSON extraction engine. Return only valid JSON arrays.',
    [{ role: 'user', content: prompt }],
    { maxTokens: 2048, temperature: 0 }
  );

  return parseClaudeJSON<TranscriptAnalysis[]>(response.content);
}

// ── Persist outcome to DB ─────────────────────────────────────

export async function persistOutcome(
  callId: string,
  taskId: string,
  analysis: TranscriptAnalysis
): Promise<void> {
  await supabaseAdmin
    .from('ai_calls')
    .update({
      outcome_state: analysis.outcome_state,
      call_summary: analysis.call_summary,
    })
    .eq('id', callId);

  const statusDetails = {
    outcome_state: analysis.outcome_state,
    last_update_message: analysis.last_update_message,
    ...(analysis.eta_given ? { estimated_completion: analysis.eta_given } : {}),
  };

  await supabaseAdmin
    .from('tasks')
    .update({
      status_details: statusDetails,
      last_followup_at: new Date().toISOString(),
      ...(analysis.blocked_by ? { blocked_by: analysis.blocked_by } : {}),
      ...(analysis.next_followup_at
        ? { next_followup_at: analysis.next_followup_at }
        : {}),
    })
    .eq('id', taskId);

  await supabaseAdmin.rpc('increment_followup_count', { task_id: taskId });
}

// ── Schedule next action ──────────────────────────────────────

export async function scheduleNextAction(
  taskId: string,
  userId: string,
  recipientPhone: string,
  recipientName: string,
  analysis: TranscriptAnalysis
): Promise<void> {
  if (analysis.outcome_state === 'confirmed_done') {
    await supabaseAdmin
      .from('tasks')
      .update({ status: 'done', agent_enabled: false })
      .eq('id', taskId);
    return;
  }

  if (
    INTERVENTION_STATES.includes(analysis.outcome_state) ||
    analysis.next_action === 'set_intervention'
  ) {
    await supabaseAdmin
      .from('tasks')
      .update({ needs_intervention: true })
      .eq('id', taskId);
    return;
  }

  if (analysis.next_followup_at && analysis.next_action === 'schedule_followup') {
    const scheduledAt = enforceTimeWindow(new Date(analysis.next_followup_at));

    await supabaseAdmin.from('ai_calls').insert({
      task_id: taskId,
      user_id: userId,
      recipient_phone: recipientPhone,
      recipient_name: recipientName,
      call_type: 'followup',
      call_urgency: 'medium',
      attempt_number: 1,
      scheduled_at: scheduledAt.toISOString(),
      status: 'scheduled',
    });

    await supabaseAdmin
      .from('tasks')
      .update({ call_scheduled_at: scheduledAt.toISOString() })
      .eq('id', taskId);
  }
}
