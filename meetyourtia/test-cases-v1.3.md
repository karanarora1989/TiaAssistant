# Test Cases — v1.3 Intelligent Follow-Up System

**Version:** 1.3  
**Date:** 2026-06-17  
**Author:** QA Agent  
**Status:** Ready for Gate 5

---

## Scope

Tests cover all net-new and modified code in v1.3. Existing pre-v1.3 behavior (voice capture, task creation, people picker, task history) is out of scope.

---

## TC-001: `enforceTimeWindow` — IST time-window enforcement

**File:** `lib/urgency-detector.ts`

| ID | Input | Expected | Rationale |
|----|-------|----------|-----------|
| 001-A | 10:30 AM IST (within window) | Returns same date unchanged | 8–19 IST is the allowed window |
| 001-B | 7:00 PM IST (exactly 19:00) | Pushes to next day 9 AM IST | `hours >= 19` branch |
| 001-C | 7:59 PM IST (inside window, edge) | Returns same date | 18:59 IST < 19:00, still inside |
| 001-D | 2:00 AM IST (pre-window) | Pushes to 9 AM same day | `hours < 8` branch; same day since not yet 19 |
| 001-E | Exactly midnight IST | Pushes to 9 AM same day | `hours < 8` branch |
| 001-F | 8:00 AM IST exactly | Returns same date | Boundary inclusive |

**Manual verification:** Compute UTC equivalents (subtract 5.5h). For 001-B: IST 7 PM = UTC 13:30 → output should be next-day UTC 03:30 (= 9 AM IST).

---

## TC-002: `isNoAnswerTerminal` — terminal escalation thresholds

**File:** `lib/urgency-detector.ts`

| ID | `hoursUntilDue` | `noAnswerCount` | Expected | Rule |
|----|-----------------|-----------------|----------|------|
| 002-A | 1.5 | 1 | `true` | ≤2h + count≥1 |
| 002-B | 2.0 | 1 | `true` | Boundary: ≤2h exact + count≥1 |
| 002-C | 2.1 | 1 | `false` | >2h, count=1 doesn't trigger ≤6 rule |
| 002-D | 5.9 | 2 | `true` | ≤6h + count≥2 |
| 002-E | 6.0 | 2 | `true` | Boundary: ≤6h exact + count≥2 |
| 002-F | 6.0 | 1 | `false` | ≤6h but count=1 — only rule ≤2h triggers at 1 |
| 002-G | 48 | 4 | `true` | count≥4 regardless of due date |
| 002-H | 48 | 3 | `false` | count=3 with no date urgency |
| 002-I | no `due_date_iso` | 4 | `true` | hoursUntilDue defaults 999, count=4 rule |
| 002-J | no `due_date_iso` | 3 | `false` | 999h, count=3 — no rule fires |

---

## TC-003: `calculateInitialCallTime` — intelligent first-call timing

**File:** `lib/urgency-detector.ts`

| ID | `due_date_iso` | Task title | Expected timing |
|----|----------------|------------|-----------------|
| 003-A | 1.5h from now | "Submit expense report" | ~5 min from now (≤2h branch) |
| 003-B | 4h from now | "Review slides" | Due - 2h (≤6h branch) |
| 003-C | 18h from now | "Send email to client" | Next 9 AM IST |
| 003-D | 36h from now | "Prepare deck for investor" | Due - 24h (complex keyword) |
| 003-E | 36h from now | "Submit form" | Due - 4h (non-complex, >24h) |
| 003-F | null | "Call Priya" | ~30 min from now, time-window enforced |
| 003-G | 1h from now (past enforced) | Any | +5 min from now (past-time guard) |

**For all cases:** Output must be within 8 AM–7 PM IST. If natural time falls outside, `enforceTimeWindow` must shift it.

---

## TC-004: `calculateRetryTime` — urgency-driven retry intervals

**File:** `lib/urgency-detector.ts`

| ID | urgency | attemptNumber | Expected interval |
|----|---------|---------------|-------------------|
| 004-A | `critical` | 0 | 10 min |
| 004-B | `critical` | 3 | 30 min |
| 004-C | `high` | 1 | 30 min |
| 004-D | `medium` | 2 | 120 min |
| 004-E | `low` | 0 | 60 min |
| 004-F | `low` | 5 (overflow) | 480 min (clamped to index 3) |

**For all cases:** Output time must pass through `enforceTimeWindow` — cannot fall outside IST 8–19.

---

## TC-005: `groupByAssignee` — batch grouping with urgency gate

**File:** `lib/call-scheduler.ts`

| ID | Input | Expected output |
|----|-------|-----------------|
| 005-A | 2 calls, same phone+user, both due in 5h | 1 group of 2, sorted by due asc |
| 005-B | 2 calls, same phone+user: one due in 1h, one due in 8h | Splits into 2 groups: urgent=[1h task], normal=[8h task] |
| 005-C | 2 calls, same phone+user: one due in 1h, one due in 4h | No split (4h not >6h), 1 group sorted asc |
| 005-D | 3 calls, same phone+user: 1h, 4h, 10h | Split: urgent=[1h], normal=[4h, 10h] |
| 005-E | 2 calls, different phones, same user | 2 separate groups of 1 each |
| 005-F | 2 calls, same phone, different user_id | 2 separate groups (key = phone::user) |
| 005-G | task is null (orphaned call) | Group still created; null-guard in executeGroup handles it |

---

## TC-006: Webhook — completed call, full analysis flow

**File:** `app/api/calls/webhook/route.ts`

**Setup:** POST to `/api/calls/webhook` with `{ call_id, status: 'completed', duration, transcript }`

| ID | Scenario | Expected DB state |
|----|----------|-------------------|
| 006-A | Normal completed call, single task | `ai_calls.outcome_state` set; `tasks.status_details` updated; `tasks.last_followup_at` updated; new `ai_calls` row scheduled if `next_action = schedule_followup` |
| 006-B | Webhook fires twice for same `bland_call_id` | Second call returns `{ skipped: true }` — idempotency guard; no double analysis |
| 006-C | Batch call (2 tasks same `bland_call_id`) | Both `ai_calls` rows updated; Claude JSON matched by `task_id` or first element; both tasks get `persistOutcome` + `scheduleNextAction` |
| 006-D | Claude API throws during analysis | All rows get `outcome_state = 'analysis_failed'`; response is HTTP 200 `{ analysis: 'failed' }` (not 500) |
| 006-E | `call.tasks` is null (orphaned) | Row skipped with `continue` — no crash |
| 006-F | status = 'no-answer' (Bland format) | Maps to `callStatus = 'no_answer'`; retry scheduled |
| 006-G | status = 'busy' | Also maps to `no_answer` |
| 006-H | `blandCallId` not found in `ai_calls` | Returns 404 |

**Outcome state routing (`scheduleNextAction`):**

| ID | `outcome_state` | Expected action |
|----|-----------------|-----------------|
| 006-I | `confirmed_done` | `tasks.status = 'done'`, `agent_enabled = false` |
| 006-J | `blocked_external` | `tasks.needs_intervention = true` |
| 006-K | `blocked_cannot_complete` | `tasks.needs_intervention = true` |
| 006-L | `no_answer_terminal` | `tasks.needs_intervention = true` |
| 006-M | `on_track` + `schedule_followup` | New `ai_calls` row inserted with `enforceTimeWindow` applied |
| 006-N | `no_action` | No new row; task not changed |

---

## TC-007: Webhook — no-answer flow

**File:** `app/api/calls/webhook/route.ts`

| ID | Scenario | Expected |
|----|----------|----------|
| 007-A | No-answer, `followup_count=0`, due in 8h | Retry scheduled; `outcome_state = 'no_answer'` |
| 007-B | No-answer, `followup_count=1`, due in 1.5h | `isNoAnswerTerminal` returns true → `needs_intervention = true`; `outcome_state = 'no_answer_terminal'` |
| 007-C | No-answer, `followup_count=3`, due in 24h | count+1=4 → terminal |
| 007-D | Retry scheduled time | Passes through `calculateRetryTime` → `enforceTimeWindow`; within IST window |

---

## TC-008: `resolve-intervention` route

**File:** `app/api/tasks/[id]/resolve-intervention/route.ts`

| ID | Scenario | Expected |
|----|----------|----------|
| 008-A | Task has `needs_intervention=true`, assignee has phone | Clears `needs_intervention`; inserts new `ai_calls` row; `tasks.call_scheduled_at` updated |
| 008-B | Task has `needs_intervention=false` | Returns 400 "No active intervention" |
| 008-C | Task not found or wrong user | Returns 404 |
| 008-D | Assignee name not in `people` table | No call inserted (silently skips); clears intervention flag only |
| 008-E | Next call time falls outside IST window | `enforceTimeWindow` shifts it to next 9 AM IST |
| 008-F | Unauthenticated request | `getAuthUserId()` throws → 401/500 |
| 008-G | People query uses `name + user_id` filter (not a join) | Verified by absence of FK dependency — query returns correct person |

---

## TC-009: `AgentControl` component — 4 states

**File:** `components/tia/AgentControl.tsx`

| ID | Task shape | Expected state | Expected UI |
|----|-----------|----------------|-------------|
| 009-A | `agent_enabled=false` | `disabled` | Toggle off; no body section |
| 009-B | `agent_enabled=true`, `followup_count=0` | `enabled_no_calls` | Toggle on; shows `call_scheduled_at` formatted |
| 009-C | `agent_enabled=true`, `followup_count=2` | `enabled_active` | Toggle on; outcome badge + last update + next followup |
| 009-D | `agent_enabled=true`, `needs_intervention=true` | `needs_intervention` | Toggle disabled; gold banner; "Mark resolved" + "View task →" |

**State transitions:**

| ID | Action | Expected |
|----|--------|----------|
| 009-E | Toggle on (from `disabled`) | POST `/api/tasks/{id}/agent` with `agent_enabled: true`; `onUpdate()` called on success |
| 009-F | Toggle from `needs_intervention` | No-op (guard in `handleToggle`) |
| 009-G | "Mark resolved" — server 500 | Error message shown (`setError`); `onUpdate()` NOT called |
| 009-H | "Mark resolved" — server 200 | `onUpdate()` called; no error shown |
| 009-I | `OUTCOME_BADGE` for `confirmed_done` | Not in map — fallback renders raw state string |

---

## TC-010: Tasks page — client-side filtering

**File:** `app/app/tasks/page.tsx`

| ID | Scenario | Expected |
|----|----------|----------|
| 010-A | Tasks fetched once on mount | Single API call to `/api/tasks?view=upcoming&status=open`; no re-fetch on day change |
| 010-B | Task with `due_date_iso = today` | Appears under today's day strip selection |
| 010-C | Task with `due_date_iso = tomorrow` | Hidden when "Today" selected; appears when "Tue" selected |
| 010-D | Task with no `due_date_iso` | Appears only when "Today" is selected |
| 010-E | Task with `needs_intervention=true` | Appears in "Needs attention" section regardless of selected day |
| 010-F | `needs_intervention` task + day filter | NOT filtered by day (excluded from `dayTasks` filter entirely) |
| 010-G | `?category=work` in URL | Only `task_domain=work` tasks shown in dayTasks |
| 010-H | `?people=Priya,Amit` in URL | Only tasks with `assigned_to` matching either name shown |
| 010-I | Filter button shows count | `category=work&people=Priya` → count=2, badge shows "Filters · 2" |
| 010-J | Empty state when 0 dayTasks AND 0 needsAttention | EmptyState renders with "All clear" |
| 010-K | 0 dayTasks but needsAttention > 0 | `null` rendered for dayTasks section (no empty state) |

---

## TC-011: `executeGroup` — null primaryTask guard

**File:** `lib/call-scheduler.ts`

| ID | Scenario | Expected |
|----|----------|----------|
| 011-A | `group.calls[0].task = null` | All callIds updated to `status='failed'`; function returns early without crash |
| 011-B | `group.calls[0].task` exists | Normal execution path |

---

## TC-012: `isAlreadyAnalysed` — idempotency guard

**File:** `lib/follow-up-intelligence.ts`

| ID | DB state | Expected |
|----|----------|----------|
| 012-A | `ai_calls.outcome_state = 'on_track'` | Returns `true` |
| 012-B | `ai_calls.outcome_state = null` | Returns `false` |
| 012-C | `ai_calls.outcome_state = 'analysis_failed'` | Returns `true` (non-null) — won't re-run; cron must clear this to retry |

**Note on 012-C:** `analysis_failed` is treated as "already analysed" by the idempotency check. A separate retry mechanism (not yet implemented) would need to clear `outcome_state` to allow re-analysis. This is acceptable for v1.3 scope.

---

## TC-013: DayStrip rendering

**File:** `app/app/tasks/page.tsx` (`buildDays`)

| ID | Scenario | Expected |
|----|----------|----------|
| 013-A | Today's strip entry | Label = "Today", `iso` = current date in `YYYY-MM-DD` |
| 013-B | Day 1 (tomorrow) | Label = weekday abbreviation (e.g., "Tue"), `iso` = tomorrow |
| 013-C | Strip has exactly 5 buttons | `buildDays()` generates 5 entries |
| 013-D | Selected day highlighted | `bg-[#151008] border-gold/30 text-gold` applied to selected ISO |
| 013-E | Non-selected day | `bg-surface-1 border-border-2 text-text-primary` |

---

## TC-014: `AgentControlWrapper` — dead file check

**File:** `app/app/tasks/[id]/AgentControlWrapper.tsx`

| ID | Scenario | Expected |
|----|----------|----------|
| 014-A | Search for imports of `AgentControlWrapper` | Zero references — file is unused |

---

## Regression Test — Existing Flows

| ID | Flow | Expected unchanged |
|----|------|--------------------|
| R-001 | Voice capture → task creation | Unaffected — no changes to voice or task-create routes |
| R-002 | Self-assigned task | `isSelf=true` → no agent toggle rendered in TaskCard or AgentControl |
| R-003 | Task detail page — voice update | Voice update widget still functional |
| R-004 | Task detail page — quick actions | Status buttons still functional |
| R-005 | Task detail page — follow-up history | `GET /api/tasks/{id}/calls` returns last 7 completed calls |
| R-006 | People page | Unaffected |
| R-007 | Filters page (`/app/tasks/filters`) | People fetched from DB; category + people apply correctly via URL params |
| R-008 | Escalation route | `soul.user_name` used in escalation call prompt; fallback to `'your manager'` |
| R-009 | Schedule-calls cron | Calls `groupByAssignee` → `executeGroup` per group; no regression in batch dispatch |
| R-010 | `call-now` route | Re-fetches pending call, runs `executeGroup` — same result as cron path |

---

## Environment Preconditions

Before any test that touches the database:

1. `V1_3_FOLLOW_UP_INTELLIGENCE.sql` migration has been run on the target Supabase project
2. `soul.user_name` column exists and is populated for the test user
3. `ai_calls.outcome_state` column exists with CHECK constraint
4. `tasks.next_followup_at TIMESTAMPTZ` column exists
5. `increment_followup_count(task_id UUID)` Postgres function exists
6. `BLAND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_API_KEY` all set in environment

---

## Known Acceptable Gaps (v1.3)

| Gap | Notes |
|-----|-------|
| `analysis_failed` retry | No automated re-retry of Claude analysis failures; manual re-trigger required for now |
| No E2E test harness | Project has no Playwright or Cypress setup; all tests are manual |
| `OUTCOME_BADGE` duplication | Map duplicated in `TaskCard.tsx` and `AgentControl.tsx`; acceptable for v1.3, extract in v1.4 |
| Tasks with no due date disappear on non-today tabs | Product decision, not a bug |
