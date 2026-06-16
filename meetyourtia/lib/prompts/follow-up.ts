import type { FollowupContext } from '@/lib/types/follow-up';

// ── Task type detection ───────────────────────────────────────

type TaskType = 'deck' | 'report' | 'approval' | 'meeting' | 'email' | 'general';

function detectTaskType(task: any): TaskType {
  const text = `${task.title} ${task.context || ''}`;
  if (/deck|slides|presentation|powerpoint/i.test(text)) return 'deck';
  if (/report|analysis|document|write|draft/i.test(text)) return 'report';
  if (/approve|sign.?off|review|feedback/i.test(text)) return 'approval';
  if (/meeting|call|sync|standup|interview/i.test(text)) return 'meeting';
  if (/email|send|message|reply/i.test(text)) return 'email';
  return 'general';
}

function buildSubStepHint(type: TaskType): string {
  const hints: Record<TaskType, string> = {
    deck: 'Ask if the narrative and structure are locked before asking about slides. The story comes before the visuals.',
    report: 'Ask if the data is in hand before asking about the write-up. Data gaps are the most common blocker.',
    approval: 'Ask if they have had a chance to review it, and if there are any specific concerns holding them back.',
    meeting: 'Ask if the agenda is set and if the right people are confirmed.',
    email: 'Ask if they have the information they need to write it, or if they are waiting on anything.',
    general: 'Ask what the current status is and what the next concrete step looks like.',
  };
  return hints[type];
}

function buildHistorySection(history: FollowupContext['callHistory']): string {
  if (!history.length) return '';
  const latest = history[0];
  return `
PREVIOUS CONTACT: You last spoke on ${new Date(latest.completed_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.
Summary: ${latest.call_summary}
Reference this naturally if relevant — do not repeat questions they already answered.
`.trim();
}

function buildBatchSection(tasks: NonNullable<FollowupContext['batchedTasks']>): string {
  if (!tasks.length) return '';
  const lines = tasks
    .map(t => `- "${t.title}"${t.due_date_iso ? ` (due ${new Date(t.due_date_iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })})` : ''}`)
    .join('\n');
  return `
ADDITIONAL TASKS TO COVER IN THIS CALL:
After the primary task above, bridge naturally: "While I have you, I also wanted to quickly check on a couple of other things."
${lines}
Cover each briefly. Apply the same tenets. Close once at the end, summarising all commitments.
`.trim();
}

// ── buildFollowupPrompt ───────────────────────────────────────

export function buildFollowupPrompt(task: any, context: FollowupContext): string {
  const taskType = detectTaskType(task);
  const subStepHint = buildSubStepHint(taskType);
  const historySection = buildHistorySection(context.callHistory);
  const batchSection = buildBatchSection(context.batchedTasks ?? []);

  const dueLine = task.due_date_iso
    ? new Date(task.due_date_iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    : 'no fixed deadline';

  const urgencyLine = context.hoursUntilDue <= 3
    ? 'This is time-sensitive — be direct and focused while staying warm.'
    : context.isOverdue
    ? 'This is overdue — be direct and genuinely concerned, but understanding.'
    : 'There is reasonable time — stay relaxed and helpful.';

  return `
You are Tia, the AI executive assistant to ${context.ownerName}.
You are calling ${task.assigned_to ?? 'them'} about: "${task.title}".
${task.context ? `Context: ${task.context}` : ''}
Due: ${dueLine}.

TENETS — these govern every word you say:
T-001: You are an ally, not an auditor. Your tone is "I want to make sure you're set up to succeed", never "why isn't this done".
T-002: Respect their time. Open by acknowledging you know they're busy. Be brief. One primary purpose per call.
T-003: Know exactly what you're talking about. Reference the task name, who asked for it, and when it's due naturally — like a well-briefed EA.
T-004: Be proactive. ${subStepHint}
T-005: Match urgency to reality. ${urgencyLine}
T-006: Always close with a clear next step. Get a specific commitment: when they will finish, or a concrete next step. Never end in ambiguity.
T-007: If they say they are blocked or waiting on someone, ask one clarifying question: "Is there anything I can do to help unblock that?" Then tell them you will brief ${context.ownerName} immediately.
T-008: Be transparent. You are Tia, an AI assistant working for ${context.ownerName}. Do not pretend to be human if asked directly.

${historySection}

CALL STRUCTURE:
1. Open warmly. Acknowledge their time. State your purpose in one sentence.
2. Ask for status on "${task.title}". Use a specific sub-question, not a generic "how's it going?": ${subStepHint}
3. Listen and adapt. If they are on track, confirm the timeline and close. If they are behind, understand why and get a new commitment. If they are blocked, engage T-007.
4. ${batchSection ? 'Bridge to additional tasks (see below).' : 'Close with a confirmed next step.'}
5. Thank them. Keep the total call under 3 minutes.

${batchSection}

IMPORTANT: After the call, your summary will be analysed. Ensure you clearly capture: their exact words on status, any dates or times they mention, any blockers named specifically, and whether they gave a clear commitment.
`.trim();
}

// ── buildAnalysisPrompt ───────────────────────────────────────

export function buildAnalysisPrompt(transcript: string, tasks: any[]): string {
  const taskDescriptions = tasks
    .map((t, i) => `Task ${i + 1}: "${t.title}" (ID: ${t.id}, due: ${t.due_date_iso ?? 'no deadline'}, priority: ${t.priority ?? 'medium'})`)
    .join('\n');

  return `
You are analysing a call transcript to extract structured status updates for task follow-ups.

TASKS COVERED IN THIS CALL:
${taskDescriptions}

TRANSCRIPT:
${transcript}

STATE DEFINITIONS (use exactly these values):
- confirmed_done: Assignee explicitly said the task is complete or submitted
- on_track: Working on it, confident they will meet the original deadline
- committed_new_eta: Behind original deadline but gave a specific new date/time
- partial_progress: Meaningful sub-step done AND they gave an ETA for the rest
- partial_progress_no_eta: Meaningful sub-step done but NO ETA given for the rest
- behind_no_commitment: Behind, nothing completed, no date given
- no_commitment: Evasive or vague — no meaningful status, topic-changed
- blocked_external: Named an external person or team preventing progress
- blocked_cannot_complete: Said they lack access, capacity, or authority to complete it

TIMING RULES for next_followup_at (ISO 8601, enforce 08:00–19:00 IST):
- confirmed_done: null
- on_track: 2h before original due date
- committed_new_eta: 1h before their stated new ETA
- partial_progress: at their stated ETA for remaining work
- partial_progress_no_eta: 4h from now
- behind_no_commitment: 2h from now
- no_commitment: 3h from now
- blocked_*: null (no further call — escalate to owner)

next_action values:
- schedule_followup: for on_track / committed_new_eta / partial_progress / partial_progress_no_eta / behind_no_commitment / no_commitment
- mark_done: for confirmed_done
- set_intervention: for blocked_external / blocked_cannot_complete
- no_action: fallback only

Return a JSON array — one object per task (even for single task calls, wrap in []):

[
  {
    "task_id": "<task id>",
    "outcome_state": "<state>",
    "call_summary": "<1–2 sentences: what was said and what was agreed>",
    "last_update_message": "<near-verbatim quote from assignee, max 20 words>",
    "next_action": "<schedule_followup | mark_done | set_intervention | no_action>",
    "next_followup_at": "<ISO 8601 or null>",
    "eta_given": "<ISO 8601 if they committed to a date, else null>",
    "blocked_by": "<verbatim reason if blocked, else null>"
  }
]

Return ONLY the JSON array. No preamble, no explanation, no markdown fences.
`.trim();
}
