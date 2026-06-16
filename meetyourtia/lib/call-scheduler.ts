import { supabaseAdmin } from './supabase';
import { blandAI } from './bland-ai';
import {
  analyzeTaskUrgency,
  calculateInitialCallTime,
  calculateRetryTime,
  isNoAnswerTerminal,
} from './urgency-detector';
import { buildFollowupPrompt } from './prompts/follow-up';
import type { BatchGroup, FollowupContext } from './types/follow-up';

// ── Schedule a new call when agent is first enabled ───────────

interface ScheduleCallParams {
  taskId: string;
  userId: string;
  recipientPhone: string;
  recipientName: string;
}

export async function scheduleCall(params: ScheduleCallParams) {
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', params.taskId)
    .single();

  if (!task) throw new Error('Task not found');

  const callTime = calculateInitialCallTime(task);

  await supabaseAdmin
    .from('tasks')
    .update({ call_scheduled_at: callTime.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.taskId);

  const { data: callRecord } = await supabaseAdmin
    .from('ai_calls')
    .insert({
      task_id: params.taskId,
      user_id: params.userId,
      recipient_phone: params.recipientPhone,
      recipient_name: params.recipientName,
      call_type: 'followup',
      call_urgency: analyzeTaskUrgency(task).urgency,
      attempt_number: 1,
      scheduled_at: callTime.toISOString(),
      status: 'scheduled',
    })
    .select()
    .single();

  return callRecord;
}

// ── Group pending calls by assignee (for batching) ────────────

export function groupByAssignee(calls: any[]): BatchGroup[] {
  const groups = new Map<string, BatchGroup>();

  for (const call of calls) {
    const key = `${call.recipient_phone}::${call.user_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        userId: call.user_id,
        recipientPhone: call.recipient_phone,
        recipientName: call.recipient_name,
        calls: [],
      });
    }
    groups.get(key)!.calls.push({ callId: call.id, task: call.tasks });
  }

  const result: BatchGroup[] = [];

  for (const group of groups.values()) {
    if (group.calls.length === 1) {
      result.push(group);
      continue;
    }

    const hoursUntilDue = (task: any) =>
      task?.due_date_iso
        ? (new Date(task.due_date_iso).getTime() - Date.now()) / (1000 * 60 * 60)
        : 999;

    // Urgency gate: split if any task due <3h and any task due >6h
    const urgent = group.calls.filter(c => hoursUntilDue(c.task) <= 3);
    const normal = group.calls.filter(c => hoursUntilDue(c.task) > 6);

    if (urgent.length > 0 && normal.length > 0) {
      result.push({ ...group, calls: urgent });
      result.push({ ...group, calls: normal });
    } else {
      group.calls.sort((a, b) => hoursUntilDue(a.task) - hoursUntilDue(b.task));
      result.push(group);
    }
  }

  return result;
}

// ── Execute a batch group ─────────────────────────────────────

export async function executeGroup(group: BatchGroup): Promise<void> {
  const callIds = group.calls.map(c => c.callId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const blandApiKey = process.env.BLAND_API_KEY;
  if (!appUrl || !blandApiKey) {
    const missing = [!appUrl && 'NEXT_PUBLIC_APP_URL', !blandApiKey && 'BLAND_API_KEY']
      .filter(Boolean)
      .join(', ');
    await supabaseAdmin
      .from('ai_calls')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .in('id', callIds);
    throw new Error(`Missing required env vars: ${missing}`);
  }

  const { data: soul } = await supabaseAdmin
    .from('soul')
    .select('tia_voice_name, user_name')
    .eq('user_id', group.userId)
    .single();

  const ownerName = soul?.user_name ?? 'your manager';
  const voiceName = (soul?.tia_voice_name ?? 'Maya').toLowerCase();

  const primaryTask = group.calls[0].task;
  if (!primaryTask) {
    await supabaseAdmin.from('ai_calls').update({ status: 'failed' }).in('id', callIds);
    return;
  }

  const { data: callHistory } = await supabaseAdmin
    .from('ai_calls')
    .select('outcome_state, call_summary, completed_at')
    .eq('task_id', primaryTask.id)
    .eq('status', 'completed')
    .not('outcome_state', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(3);

  const hoursUntilDue = primaryTask.due_date_iso
    ? (new Date(primaryTask.due_date_iso).getTime() - Date.now()) / (1000 * 60 * 60)
    : 999;

  const context: FollowupContext = {
    ownerName,
    callHistory: (callHistory ?? []) as any,
    batchedTasks:
      group.calls.length > 1
        ? group.calls.slice(1).map(c => ({
            id: c.task.id,
            title: c.task.title,
            context: c.task.context,
            due_date_iso: c.task.due_date_iso,
            priority: c.task.priority,
          }))
        : undefined,
    hoursUntilDue,
    isOverdue: hoursUntilDue < 0,
  };

  const prompt = buildFollowupPrompt(primaryTask, context);

  await supabaseAdmin
    .from('ai_calls')
    .update({ status: 'calling', initiated_at: new Date().toISOString() })
    .in('id', callIds);

  try {
    const result = await blandAI.makeCall({
      phone_number: group.recipientPhone,
      task: prompt,
      voice: voiceName,
      webhook: `${appUrl}/api/calls/webhook`,
      metadata: {
        call_ids: callIds,
        task_ids: group.calls.map(c => c.task.id),
        user_id: group.userId,
      },
    });

    await supabaseAdmin
      .from('ai_calls')
      .update({ bland_call_id: result.call_id })
      .in('id', callIds);
  } catch (error: any) {
    await supabaseAdmin
      .from('ai_calls')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .in('id', callIds);
    throw error;
  }
}

// ── Schedule retry for no-answer call ────────────────────────

export async function scheduleRetry(callId: string) {
  const { data: call } = await supabaseAdmin
    .from('ai_calls')
    .select('*, tasks(*)')
    .eq('id', callId)
    .single();

  if (!call) throw new Error('Call not found');

  const task = call.tasks;
  const urgency = analyzeTaskUrgency(task);
  const attemptNumber = call.attempt_number ?? 0;
  const retryAt = calculateRetryTime(attemptNumber, urgency.urgency);

  await supabaseAdmin.from('ai_calls').insert({
    task_id: task.id,
    user_id: call.user_id,
    recipient_phone: call.recipient_phone,
    recipient_name: call.recipient_name,
    call_type: call.call_type,
    call_urgency: urgency.urgency,
    attempt_number: attemptNumber + 1,
    scheduled_at: retryAt.toISOString(),
    status: 'scheduled',
  });

  return retryAt;
}

// ── Get calls due for execution ───────────────────────────────

export async function getPendingCalls() {
  const now = new Date().toISOString();
  const { data: calls } = await supabaseAdmin
    .from('ai_calls')
    .select('*, tasks(*)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(20);
  return calls ?? [];
}
