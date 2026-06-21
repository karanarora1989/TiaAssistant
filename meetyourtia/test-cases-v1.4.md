# Test Cases v1.4 — Home Dashboard

**Feature:** Home Dashboard + Chat Page Migration + Capture Bottom Sheet  
**Date:** 2026-06-21  
**Build:** clean ✓ (28 routes, 0 TS errors)

---

## TC-01: Home Dashboard loads for authenticated user

**Route:** `/app`  
**Steps:**
1. Sign in with a valid account
2. Navigate to `/app`

**Expected:**
- Greeting header renders: "Good [morning/afternoon/evening], [firstName]"
- Date line renders below: e.g. "Saturday, 21 Jun"
- "QUICK ACTIONS" section visible with 3 cards: Create Task, View Tasks, My People
- FAB shows `+` icon (not 🎙)
- BottomNav shows Home tab active (gold dot + gold label)

---

## TC-02: Greeting time-of-day logic

**Steps:** Access `/app` at different times of day (or mock `getHours()`)

| Device time | Expected greeting |
|---|---|
| 06:00 | Good morning |
| 11:59 | Good morning |
| 12:00 | Good afternoon |
| 16:59 | Good afternoon |
| 17:00 | Good evening |
| 23:30 | Good evening |

---

## TC-03: Greeting with no firstName

**Setup:** Clerk user has no `firstName` and no `fullName`  
**Expected:** Renders "Good morning" (no comma, no trailing space)

---

## TC-04: Stats bar hidden when zero tasks

**Setup:** User has no open tasks  
**Expected:** Stats bar row not rendered — no empty pills, no zero counts

---

## TC-05: Stats bar shows task count chip

**Setup:** User has 3 open tasks due today (no overdue)  
**Expected:**
- "3 tasks today" chip visible (neutral styling)
- No overdue chip
- Tapping chip navigates to `/app/tasks`

---

## TC-06: Stats bar shows overdue chip

**Setup:** User has 2 tasks with `due_date_iso` before today, 0 due today  
**Expected:**
- "2 overdue" chip visible (red styling)
- No "tasks today" chip
- Tapping chip navigates to `/app/tasks`

---

## TC-07: Stats bar singular/plural copy

**Setup:** 1 task today, 1 overdue  
**Expected:** "1 task today" (not "1 tasks"), "1 overdue"

---

## TC-08: Loading skeleton

**Setup:** Throttle network to slow 3G  
**Expected:**
- Two skeleton lines for greeting (w-48, w-32)
- Two skeleton pills for stats
- Three skeleton rows for nav cards
- No Needs Attention or Today's Tasks skeletons

---

## TC-09: Fetch error state

**Setup:** Block `/api/tasks` request (e.g. network offline)  
**Expected:**
- Error card visible: "Couldn't load your dashboard. Check your connection and try again."
- "Try again" link visible and tappable
- Greeting still renders (Clerk data available)
- Quick Actions cards still render
- Stats bar hidden
- Needs Attention and Today's Tasks hidden

---

## TC-10: Retry after error

**Steps:**
1. Block network → load page (error state)
2. Restore network → tap "Try again"

**Expected:** Dashboard refreshes, tasks load, error card disappears

---

## TC-11: Quick Actions — View Tasks

**Steps:** Tap "View Tasks" nav card  
**Expected:** Navigates to `/app/tasks`

---

## TC-12: Quick Actions — My People

**Steps:** Tap "My People" nav card  
**Expected:** Navigates to `/app/people`

---

## TC-13: Quick Actions — Create Task opens sheet

**Steps:** Tap "Create Task" nav card  
**Expected:**
- Capture Bottom Sheet slides up from bottom
- Scrim overlay visible
- Sheet contains: drag handle, "CAPTURE" label, Voice card, Chat card, Cancel button

---

## TC-14: FAB `+` opens sheet

**Steps:** Tap the `+` FAB  
**Expected:** Same Capture Bottom Sheet as TC-13

---

## TC-15: Capture Sheet — Voice option

**Steps:**
1. Open sheet (via FAB or Create Task)
2. Tap Voice card

**Expected:**
- Sheet closes
- Navigates to `/app/voice`

---

## TC-16: Capture Sheet — Chat option

**Steps:**
1. Open sheet
2. Tap Chat card

**Expected:**
- Sheet closes
- Navigates to `/app/chat`

---

## TC-17: Capture Sheet — Cancel

**Steps:**
1. Open sheet
2. Tap Cancel button

**Expected:** Sheet closes, stays on `/app`

---

## TC-18: Capture Sheet — Scrim tap dismisses

**Steps:**
1. Open sheet
2. Tap the dark scrim area (outside the sheet)

**Expected:** Sheet closes, stays on `/app`

---

## TC-19: Needs Attention section — hidden when none

**Setup:** No tasks with `needs_intervention = true`  
**Expected:** "NEEDS ATTENTION" section label and cards not rendered

---

## TC-20: Needs Attention section — shows all intervention tasks

**Setup:** 3 tasks with `needs_intervention = true`  
**Expected:**
- "NEEDS ATTENTION" section label visible
- All 3 TaskCards rendered (no truncation)
- Each card taps to `/app/tasks/[id]`

---

## TC-21: Today's Tasks — hidden when none

**Setup:** No tasks due today (or all tasks are intervention tasks)  
**Expected:** "TODAY'S TASKS" section label and cards not rendered

---

## TC-22: Today's Tasks — shows max 3

**Setup:** 5 tasks due today (non-intervention)  
**Expected:**
- "TODAY'S TASKS" section visible
- Exactly 3 TaskCards rendered
- "See all 5 tasks →" link visible below the cards

---

## TC-23: Today's Tasks — no "See all" when ≤3

**Setup:** 2 tasks due today (non-intervention)  
**Expected:**
- 2 TaskCards rendered
- No "See all" link

---

## TC-24: "See all" link navigates to Tasks

**Steps:** Tap "See all N tasks →"  
**Expected:** Navigates to `/app/tasks`

---

## TC-25: Tasks due today don't include intervention tasks in count

**Setup:** 2 tasks due today with `needs_intervention = true`, 1 task due today without  
**Expected:**
- Needs Attention section shows 2 cards
- Today's Tasks section shows 1 card
- Stats bar: "1 task today" (intervention tasks excluded)

---

## TC-26: Overdue tasks excluded from today's count

**Setup:** 2 tasks with `due_date_iso` = yesterday  
**Expected:**
- Stats bar: "2 overdue" chip (red)
- No "tasks today" chip
- Overdue tasks do NOT appear in Today's Tasks section

---

## TC-27: Chat page accessible at `/app/chat`

**Steps:** Navigate to `/app/chat`  
**Expected:**
- Full chat interface renders identically to old `/app`
- Seed message: "Hi! What's on your plate today — type or speak."
- Text input + mic + send button visible
- BottomNav Home tab active (gold)

---

## TC-28: Chat page — send a message

**Steps:**
1. Navigate to `/app/chat`
2. Type "remind me to call Raj tomorrow" and send

**Expected:**
- User bubble appears
- Loading dots appear
- Tia reply appears with extracted task card
- "Save 1 task" button visible

---

## TC-29: Chat page — BottomNav Home tab returns to dashboard

**Steps:**
1. Navigate to `/app/chat`
2. Tap Home tab in BottomNav

**Expected:** Navigates to `/app` (Home Dashboard)

---

## TC-30: BottomNav active state on `/app/chat`

**Steps:** Navigate to `/app/chat`  
**Expected:** Home tab shows gold dot + gold label (not Tasks or People)

---

## TC-31: BottomNav active state on `/app`

**Steps:** Navigate to `/app`  
**Expected:** Home tab active (gold dot + gold label)

---

## TC-32: BottomNav active state on `/app/tasks`

**Steps:** Navigate to `/app/tasks`  
**Expected:** Tasks tab active, Home tab inactive

---

## TC-33: Tasks page — FAB still goes to voice (no sheet)

**Steps:** Navigate to `/app/tasks`, tap FAB  
**Expected:** Navigates to `/app/voice` (not a bottom sheet)

---

## TC-34: People page — FAB still goes to voice (no sheet)

**Steps:** Navigate to `/app/people`, tap FAB  
**Expected:** Navigates to `/app/voice` (not a bottom sheet)

---

## TC-35: Old `/app` URL still works (no redirect needed)

**Steps:** Navigate directly to `/app`  
**Expected:** Home Dashboard loads (not the old chat interface)

---

## TC-36: Regression — task capture via voice still works

**Steps:**
1. Go to `/app` → tap `+` → tap Voice → complete voice capture
2. Return to `/app`

**Expected:** New task appears in Today's Tasks (after re-fetch on mount)

---

## TC-37: Regression — task detail accessible from dashboard

**Steps:** Tap a TaskCard in Today's Tasks or Needs Attention  
**Expected:** Navigates to `/app/tasks/[id]` task detail page

---

## TC-38: Regression — chat task save still works

**Steps:**
1. Navigate to `/app/chat`
2. Capture a task, tap "Save N tasks"

**Expected:** Tasks saved, "✅ Saved — View in Tasks →" confirmation appears

---

## Summary

| Category | Count |
|---|---|
| Home Dashboard loading & greeting | TC-01 to TC-10 |
| Stats bar | TC-04 to TC-07 |
| Quick Actions | TC-11 to TC-13 |
| Capture Bottom Sheet | TC-13 to TC-18 |
| Needs Attention | TC-19 to TC-20 |
| Today's Tasks | TC-21 to TC-26 |
| Chat page (`/app/chat`) | TC-27 to TC-30 |
| BottomNav active states | TC-30 to TC-32 |
| Regression | TC-33 to TC-38 |
| **Total** | **38 test cases** |
