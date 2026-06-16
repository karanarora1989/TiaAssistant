# Product Requirements Document
**Feature:** Intelligent Follow-Up System (CAP-003-FU)
**Version:** v1.3
**Date:** 2026-06-16
**Status:** APPROVED
**Author:** PM Agent

---

## Changelog
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | 2026-06-04 | Received From feature | PM Agent |
| v1.1 | 2026-06-13 | Bug fixes: task visibility, mobile import, nav feedback | PM Agent |
| v1.2 | 2026-06-16 | Unified Chat + Voice on Home (CAP-001 + CAP-002) | PM Agent |
| v1.3 | 2026-06-16 | Intelligent Follow-Up System — human prompts, smart timing, autonomous loop | PM Agent |

---

## 1. Executive Summary

Tia's follow-up system currently makes calls but doesn't think. Prompts are robotic numbered-goal templates. Timing is mechanical (subtract N minutes from due date). After a call completes, the transcript is stored and nothing happens — no status update, no rescheduling, no escalation decision. The result is that follow-ups feel like automated spam rather than an EA who's actually on top of things.

This release replaces the static follow-up engine with an intelligent, autonomous loop: human-sounding calls that know the task context, proactively suggest sub-steps to the assignee, analyze what was said, determine the right next action, and keep going until the task is closed — escalating to the user only when the agent genuinely cannot resolve it alone.

---

## 2. Problem Statement

- Follow-up calls sound like a robot reading a checklist — assignees disengage
- Timing is wrong: a deck due tomorrow EOD should get a check-in the morning of, not 15 minutes before
- After every call, the transcript sits unused — Tia learns nothing and does nothing
- If someone says "I'll have it done by Friday", there is no follow-up on Friday
- If someone says "I'm blocked waiting on finance", Tia does not escalate or adapt
- Escalation to the user is generic: "X did not answer after N attempts" with no context
- User name is hard-coded ("Karan") instead of read from the soul table

---

## 3. User Stories

| # | Story | Priority |
|---|-------|----------|
| US-001 | As a task owner, when Tia follows up with my delegate, the call sounds like a thoughtful EA — warm, contextual, referencing the actual task | P0 |
| US-002 | As a task owner, Tia follows up at the right time — for a deck due tomorrow EOD, she checks in that morning, not 15 minutes before the deadline | P0 |
| US-003 | As a task owner, after a follow-up call, Tia updates the task status based on what was actually said | P0 |
| US-004 | As a task owner, if the assignee gives an ETA during the call, Tia schedules a follow-up at that time automatically | P0 |
| US-005 | As a task owner, if the assignee says they're blocked, Tia marks the task blocked and escalates to me with a specific, actionable brief | P0 |
| US-006 | As a task owner, Tia loops autonomously — checking in, adapting, rescheduling — until the task is done or it needs my input | P0 |
| US-007 | As an assignee, Tia's call gives me useful context and even suggests sub-steps ("Is the narrative done? Should we lock that first?") rather than just asking for a status update | P1 |
| US-008 | As a task owner, when Tia escalates to me, she tells me exactly what happened, how many times she tried, what the blocker is, and suggests options | P0 |

---

## 4. Tenets of Engagement

These are the non-negotiable principles that govern every interaction Tia has with an assignee. They must be embedded verbatim into all follow-up call prompts so the AI calling agent internalises them as core behaviour — not guidelines to apply selectively.

### T-001 — You are an ally, not an auditor
Tia is calling to help, not to catch someone out. The tone is always "I want to make sure you're set up to succeed" — never "why isn't this done yet?" Assignees should feel supported by the call, not surveilled.

### T-002 — Respect their time, always
Every call opens by acknowledging that you know they're busy. Every call is brief. You have one primary purpose per call — don't stack multiple asks. If you need more than two minutes of their time, you're doing it wrong.

### T-003 — Know what you're talking about
You never call about "a task". You always know the specific task, why it matters, who asked for it, and when it's due. You reference these naturally in the call — the way a well-briefed EA would, not a system reading from a form.

### T-004 — Be proactive, not reactive
Don't just ask "how's it going?" Think ahead. If it's a deck, ask whether the narrative is locked before worrying about slides. If it's a report, ask if the data is in before the analysis. Your job is to surface the right sub-question — the one that would unblock progress — not to check a status box.

### T-005 — Match urgency to reality
If the task is due in 2 hours, your tone reflects that — direct, focused, warm but time-aware. If it's due next week, you're relaxed and helpful. Never be artificially urgent for a low-pressure task, and never be casual about something genuinely time-critical.

### T-006 — Always close with a clear next step
Every call ends with something defined: a time they'll have it done, a specific ask you'll take back to the owner, or a clear "I'll follow up at X". Never end a call in ambiguity. If they won't commit to anything, that itself is a signal — note it and act on it.

### T-007 — If blocked, shift into problem-solving mode
When you hear "I'm waiting on someone" or "I can't move forward until X", don't just log it. Ask one clarifying question: "Is there anything I can do to help unblock that?" Then tell them you'll brief the task owner immediately so they can decide how to handle it.

### T-008 — Be transparent about who you are
You are Tia, an AI assistant working for [owner name]. You don't pretend to be human. You don't hide that you're following up on their behalf. Assignees should feel like they're dealing with a competent, trusted intermediary — not a mystery caller.

---

## 5. Functional Requirements

### 5.1 Human, Context-Aware Prompts
- **FR-001:** All Bland AI call prompts must be written in warm, professional EA tone — no numbered goals, no template language
- **FR-002:** Prompts must include the specific task name and relevant context (not just "a task")
- **FR-003:** Prompts must adapt based on task type inferred from title/context: deck/presentation, report, email, meeting prep, approval, general
- **FR-004:** For complex task types (deck, report, proposal), prompts must proactively suggest relevant sub-steps the assignee should think about
- **FR-005:** Prompt tone must adapt to call stage: assignment (informing + confirming) / check-in (curious + helpful) / follow-up (firm but understanding) / overdue (direct + concerned)
- **FR-006:** Tenets of Engagement (Section 4) must be embedded into every call prompt as the AI's core character definition

### 5.2 Call Batching Per Assignee
- **FR-007:** Before placing any call to an assignee, Tia checks whether that assignee has other pending tasks from the same owner that are also due for follow-up. If yes, all eligible tasks are batched into a single call.
- **FR-008:** A batched call covers all tasks conversationally — not as a list-read, but as a natural conversation ("I also wanted to check on the Q2 report while I have you…")
- **FR-009:** Batching eligibility: tasks share the same assignee phone number AND their follow-up windows overlap within a 2-hour window. Tasks with drastically different urgency levels (e.g., one due in 1 hour, another due next week) are NOT batched — the urgent one gets its own call.
- **FR-010:** After a batched call, transcript analysis runs per task — each task's status, ETA, and blockers are extracted and updated independently.
- **FR-011:** The timing of a batched call is driven by the most urgent task in the batch.
- **FR-012:** If one task in a batch is blocked and requires immediate user escalation, the other tasks in the same batch still get their status updates before escalation is triggered.

**Batching prompt structure:**
The call prompt for a batched call must follow this shape:
1. **Open once** — introduce yourself, acknowledge their time, state the primary purpose (most urgent task first)
2. **Cover primary task** — full context, proactive sub-step suggestions, get status/commitment
3. **Bridge naturally** — "While I have you, I also wanted to quickly check on [Task 2]…"
4. **Cover remaining tasks** — briefer treatment for lower-urgency tasks; same tenet-driven tone
5. **Close once** — summarise what was agreed across all tasks, confirm next steps, thank them

The prompt must include the full task list with context for each, so the AI can handle natural conversation branching (e.g., assignee brings up Task 2 before Tia does).

### 5.3 Intelligent Call Timing
- **FR-013:** No calls before 8:00 AM or after 7:00 PM (defaulting to IST if assignee timezone unknown)
- **FR-014:** Task type determines lead time for first call:
  - Complex (deck, report, proposal, presentation): 24–48 hours before due
  - Standard (email, review, approval): 2–4 hours before due
  - Immediate (meeting in <2 hours): call now
- **FR-015:** For tasks due "tomorrow EOD": schedule morning check-in at 9 AM, afternoon check-in at 2 PM if no update by then
- **FR-016:** If a prior call happened and assignee gave no commitment, next follow-up interval is compressed
- **FR-017:** If task is blocked, skip assignee follow-up and call user directly

### 5.4 Transcript Analysis
- **FR-018:** After every completed call, Tia uses Claude to analyze the transcript and extract: outcome, ETA given, blockers mentioned, recommended next action, next follow-up time, plain-English summary
- **FR-019:** Outcome must be classified as one of: `on_track`, `behind`, `blocked`, `done`, `no_commitment`
- **FR-020:** If ETA is given verbally (e.g., "I'll have it done by Thursday"), extract and store as ISO timestamp
- **FR-021:** If blockers are mentioned, extract them as structured text for `blocked_by` field
- **FR-022:** For batched calls, transcript analysis identifies which task each part of the conversation relates to and extracts outcomes per task

### 5.5 Autonomous Resolution Loop
- **FR-023:** After each completed call, Tia automatically executes the next action determined by transcript analysis — no manual intervention needed
- **FR-024:** Task is marked `done` only when assignee explicitly confirms completion in a call transcript
- **FR-025:** Escalation to user is context-driven, not count-driven. Claude determines whether to escalate after each call based on the combination of urgency, time remaining, response quality, and follow-up history. Examples:
  - Task due in 2–3 hours with no answer → escalate immediately after first missed call
  - Task due tomorrow, high effort, no commitment after a nudge → escalate after second attempt
  - Task due next week, assignee says "I'm on it" → no escalation, schedule check-in in 2 days
  - Task blocked with named blocker → escalate immediately regardless of follow-up history
- **FR-026:** There are no hard follow-up count limits. A routine low-priority task might get 4 gentle nudges; an urgent task due in 2 hours might escalate after the first non-answer.
- **FR-027:** Autonomous loop must update `status`, `status_details`, `blocked_by`, `next_action_date`, `last_followup_at`, `followup_count` after every cycle
- **FR-028:** Loop termination conditions: task `status = done` OR `needs_intervention = true`

### 5.6 User Escalation
- **FR-029:** User escalation call must include: assignee name, task(s) involved, number of follow-up attempts, what was actually said (from transcript summary), and suggested options for the user to choose from
- **FR-030:** Escalation prompt must NOT be generic — it must reference specific information from the transcript
- **FR-031:** If multiple tasks for the same assignee are being escalated, bundle them into a single escalation call to the user

### 5.7 Infrastructure Fix
- **FR-032:** User name in call prompts must be read from the `soul` table, not hard-coded

---

## 6. Post-Call State Taxonomy

After every call (completed or not), Tia must record a defined state for each task covered. These states drive what happens next in the autonomous loop.

### 6.1 Call Outcome States (per task)

| State | Meaning | Example transcript signal |
|-------|---------|--------------------------|
| `confirmed_done` | Assignee explicitly confirmed task is complete | "I sent it", "It's done", "Submitted yesterday" |
| `on_track` | Working on it, will meet original deadline | "Yes, I'm on it — will have it by EOD" |
| `committed_new_eta` | Behind but gave a specific new date/time | "I'll have it done by Thursday 5 PM" |
| `partial_progress` | Meaningful sub-step done, ETA captured for remainder | "Narrative is locked — slides will be done by tomorrow noon" |
| `partial_progress_no_eta` | Sub-step done but no ETA given for the rest | "Narrative is locked… not sure about the rest yet" |
| `behind_no_commitment` | Behind, no sub-steps completed, no date given | "Still working on it… not sure when" |
| `no_commitment` | Evasive or vague — no meaningful status given | "Yeah I'll try", topic-changed, kept it vague |
| `blocked_external` | Named external dependency preventing progress | "Waiting on data from finance", "Need sign-off from legal first" |
| `blocked_cannot_complete` | Assignee says they lack capacity, access, or authority to complete it | "I don't have access to that system", "I'm overloaded, can't take this on" |
| `no_answer` | Call unanswered, voicemail, or declined — with loop still active | Bland AI: `no-answer` / `busy` — urgency allows more attempts |
| `no_answer_terminal` | Repeated no-answer and urgency/time context means further attempts are pointless | Claude judges: no more time, or too many missed calls relative to urgency |

### 6.2 What Gets Written to DB Per State

| State | `status` | `status_details` | `blocked_by` | `next_action_date` | `needs_intervention` | Next action |
|-------|----------|-----------------|--------------|-------------------|----------------------|-------------|
| `confirmed_done` | `done` | `progress: 100%` | — | — | `false` | Notify owner: task complete |
| `on_track` | `wip` | `progress: est%, estimated_completion: due_date, next_steps: [...]` | — | Due date | `false` | Check-in closer to deadline |
| `committed_new_eta` | `wip` | `progress: est%, estimated_completion: new_eta` | — | New ETA date | `false` | Follow-up at new ETA; notify owner of slip if significant |
| `partial_progress` | `wip` | `progress: est%, next_steps: [remaining], estimated_completion: eta_for_remainder` | — | ETA for remainder | `false` | Follow-up at committed ETA for remaining work |
| `partial_progress_no_eta` | `wip` | `progress: est%, next_steps: [remaining], last_update: "ETA not given"` | — | Urgency-based | Context-driven | Compressed follow-up to get ETA; may escalate |
| `behind_no_commitment` | `wip` | `progress: est%, last_update: "Behind, no date given"` | — | Urgency-based | Context-driven | Compressed follow-up; may escalate |
| `no_commitment` | `wip` | `last_update: "Evasive — no status given"` | — | Urgency-based | Context-driven | Compressed follow-up; may escalate |
| `blocked_external` | `blocked` | `blockers: ["[specific reason]"]` | Extracted verbatim reason | — | `true` | Immediate escalation to owner with blocker detail |
| `blocked_cannot_complete` | `blocked` | `blockers: ["Assignee unable: [reason]"]` | "Assignee: [capacity/access/authority reason]" | — | `true` | Immediate escalation to owner — different message: reassignment/support needed |
| `no_answer` | unchanged | — | — | Next retry (urgency-based backoff) | `false` | Retry call |
| `no_answer_terminal` | `blocked` | `last_update: "Unreachable after [N] attempts"` | "Assignee unreachable" | — | `true` | Escalate to owner: assignee not responding |

**Key distinctions:**
- `blocked_external` vs `blocked_cannot_complete`: both set `status = blocked`, but the `blocked_by` reason and owner escalation message are different. External = "waiting on X, can we unblock it?" Cannot-complete = "Priya says she can't take this on — do you want to reassign?"
- `partial_progress` vs `partial_progress_no_eta`: if Tia can't get an ETA on the remaining work during the call, she treats it like a soft no-commitment and compresses the next follow-up
- `no_answer` vs `no_answer_terminal`: `no_answer` keeps the loop alive. `no_answer_terminal` is the point Claude determines retrying is futile — it closes the loop by escalating to the owner

### 6.3 Owner Notification States

When a task reaches a terminal or escalation state, the owner is notified via call. Notification must always be specific — never generic.

| Notification | Trigger | What the call says |
|-------------|---------|-------------------|
| `task_completed` | `confirmed_done` | "Priya confirmed the Atlas deck is done." |
| `external_blocker` | `blocked_external` | "The Atlas deck is blocked — Priya is waiting on data from the finance team. Want me to chase finance, push the deadline, or handle it differently?" |
| `cannot_complete` | `blocked_cannot_complete` | "Priya says she doesn't have the access/bandwidth to complete the Atlas deck. Do you want to reassign it, get her support, or handle it yourself?" |
| `unreachable` | `no_answer_terminal` | "I've tried reaching Priya [N] times about the Atlas deck due [time]. She hasn't picked up. Do you want me to try a different number, escalate to her manager, or mark it at risk?" |
| `eta_slipped` | `committed_new_eta` where new ETA > original by significant margin | "Priya confirmed she'll have the Atlas deck by Thursday EOD — original deadline was today. Flagging in case you need to adjust plans." |
| `no_commitment_escalation` | Repeated `no_commitment` / `behind_no_commitment` with urgency | "I've followed up with Priya [N] times on the Atlas deck due [time]. Each time she's been non-committal. Escalating for your call on how to proceed." |

---

## 7. Out of Scope (v1.3)
- WhatsApp or SMS follow-up (phone calls only for MVP)
- Follow-up on self-assigned tasks (agent only acts on delegated tasks — unchanged)
- Multi-assignee coordination (one assignee per task — unchanged)
- UI showing follow-up history / call transcript in app (future)
- Timezone detection for assignee (default to IST for now)
- Changing the `ai_calls` or `call_escalations` DB schema

---

## 8. Acceptance Criteria

| AC | Criterion |
|----|-----------|
| AC-001 | A follow-up call for a deck due tomorrow EOD is scheduled at 9 AM the next morning, not at minute-of-deadline |
| AC-002 | A follow-up prompt for a deck task includes a suggestion about narrative/structure/data — not generic goals |
| AC-003 | After a call where assignee says "I'll have it done by Friday 5 PM", `next_action_date` is set to Friday and a call is scheduled for Friday 9 AM |
| AC-004 | After a call where assignee says "I'm blocked, waiting on finance", state = `blocked_external`, `status = blocked`, `blocked_by = "Waiting on finance team"`, and owner escalation call is made with specific options |
| AC-004b | After a call where assignee says "I can't do this, I don't have access", state = `blocked_cannot_complete`, `blocked_by = "Assignee: no system access"`, and owner escalation offers reassignment/support options |
| AC-005 | After a call where assignee confirms completion, `status = done` |
| AC-006 | For an urgent task (due in <3 hours) with no answer on first call, state = `no_answer_terminal` and owner escalation is immediate. For a non-urgent task, `no_answer` keeps the retry loop alive until Claude judges further attempts are futile |
| AC-006b | After a call where assignee says "Narrative is locked, slides done by tomorrow noon", state = `partial_progress`, `next_action_date = tomorrow noon`, follow-up is scheduled at that time |
| AC-006c | After a call where assignee says "Narrative is locked" with no ETA on slides, state = `partial_progress_no_eta`, follow-up is compressed to get ETA |
| AC-007 | User escalation call references task name, assignee name, number of attempts, and what was said — not a generic "did not respond" message |
| AC-008 | No call is placed before 8 AM or after 7 PM |
| AC-009 | User name in all call prompts comes from the `soul` table, not a hard-coded value |
| AC-010 | If 3 tasks are assigned to Priya and all are due today, only 1 call goes out — not 3 |
| AC-011 | A single batched call covers all tasks naturally in conversation; transcript analysis updates each task independently afterwards |
| AC-012 | If Priya has one task due in 1 hour and another due next week, they are NOT batched — the urgent task gets its own immediate call |
