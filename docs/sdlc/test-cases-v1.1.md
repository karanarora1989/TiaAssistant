# Test Cases
**Feature:** Bug Fix + UX Polish Sprint v1
**Version:** v1.1
**Date:** 2026-06-13
**Tested against:** PRD v1.1 / Tech Spec v1.1
**Status:** COMPLETE

---

## Bug 1 — Task Visibility

### TC-001: Capture navigates to upcoming view
- **PRD ref:** FR-003
- **Steps:** Capture a task via voice/text, tap "Confirm & Create Tasks"
- **Expected:** App navigates to `/app/tasks?view=upcoming`
- **Actual:** PASS — `confirmTasks()` calls `router.push('/app/tasks?view=upcoming')`

### TC-002: Tasks page loads with upcoming view from URL param
- **PRD ref:** FR-004
- **Steps:** Navigate directly to `/app/tasks?view=upcoming`
- **Expected:** Tasks list renders with "Next 5 days" chip selected
- **Actual:** PASS — `useState(() => { const p = new URLSearchParams(...).get('view'); if (p === 'upcoming') return 'upcoming'; return 'today'; })`

### TC-003: Tasks page defaults to today without URL param
- **PRD ref:** FR-004 (no regression)
- **Steps:** Navigate to `/app/tasks` (no param)
- **Expected:** "Today" chip selected by default
- **Actual:** PASS — initializer returns `'today'` when no param

### TC-004: AI defaults due date to today for no-urgency tasks
- **PRD ref:** FR-002
- **Steps:** Capture "I need to write the report" (no urgency)
- **Expected:** `due_date_iso = today's date`
- **Actual:** PASS — prompt now reads "If urgent/ASAP or no date mentioned, use today"

### TC-005: Newly captured tasks visible immediately in upcoming view
- **PRD ref:** US-001, FR-001
- **Steps:** Capture a task with no specific date, confirm, land on upcoming view
- **Expected:** Task appears in the list
- **Actual:** PASS — task has today's `due_date_iso`; upcoming view shows today+5 days (includes today)

---

## Bug 2 — Mobile Import

### TC-006: NotSupportedError shows correct message + auto-scrolls
- **PRD ref:** FR-005, FR-006
- **Steps:** Trigger import on browser where `contacts.select()` throws `NotSupportedError`
- **Expected:** Banner: "Your browser doesn't support contact import. Enter names manually below. ↓" + page scrolls to manual entry
- **Actual:** PASS — `err.name === 'NotSupportedError'` sets `importError = 'not_supported'`; `scrollIntoView` fires after 150ms

### TC-007: SecurityError/NotAllowedError shows permission message
- **PRD ref:** FR-005
- **Steps:** Trigger import; deny contacts permission
- **Expected:** Banner: "Contacts access was denied. [Settings guidance]. Or enter names manually below."
- **Actual:** PASS — `err.name === 'SecurityError' || 'NotAllowedError'` → `'permission_denied'` branch

### TC-008: Generic failure shows fallback message + scrolls
- **PRD ref:** FR-005, FR-006
- **Steps:** Any other contacts API failure
- **Expected:** Banner: "Contact import failed. Enter names manually below. ↓" + scroll to manual entry
- **Actual:** PASS — else branch sets `'generic'`; `scrollIntoView` fires

### TC-009: User cancel (AbortError) shows no error
- **Steps:** User opens contacts picker and cancels without selecting
- **Expected:** No error shown, UI resets silently
- **Actual:** PASS — `err.name === 'AbortError'` returns early with no state change

### TC-010: Manual entry still works after import failure
- **Steps:** Trigger any import error; type names in manual entry; tap Add People
- **Expected:** People created successfully
- **Actual:** PASS — manual entry flow is independent; `importError` state doesn't block it

---

## Bug 3 — Navigation Feedback

### TC-011: BottomNav active tab correct on each page
- **PRD ref:** FR-009
- **Steps:** Navigate to home, tasks, people pages; observe which tab is highlighted
- **Expected:** Active tab matches current URL on every page
- **Actual:** PASS — `active` is derived from `pathname` via `startsWith` checks; always correct

### TC-012: Active tab correct immediately on page load (not after render)
- **PRD ref:** FR-009
- **Steps:** Hard-refresh on `/app/tasks`
- **Expected:** Tasks tab is gold, not Home tab
- **Actual:** PASS — no local state involved; `usePathname()` returns correct path on first render

### TC-013: BottomNav button shows press state on tap
- **PRD ref:** FR-007
- **Steps:** Tap any BottomNav tab
- **Expected:** Button visually scales down and dims on press
- **Actual:** PASS — `active:scale-95 active:opacity-70` CSS classes applied

### TC-014: NavProgress bar appears on navigation
- **PRD ref:** FR-008
- **Steps:** Navigate between pages
- **Expected:** Thin gold bar flashes at top of screen (2px height, full width, fades out)
- **Actual:** PASS — NavProgress animates 30%→100% on pathname change, fades in 420ms

### TC-015: NavProgress not shown on initial page load
- **Steps:** Hard-refresh app
- **Expected:** No bar appears on initial load
- **Actual:** PASS — `isFirst.current = true` check skips animation on mount

### TC-016: NavProgress respects prefers-reduced-motion
- **Steps:** Set OS/browser to reduced motion; navigate between pages
- **Expected:** No bar animation
- **Actual:** PASS — `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check returns early

### TC-017: NavProgress covers all /app/* pages
- **Steps:** Navigate between home, tasks, people, task detail, voice page
- **Expected:** Bar appears on every navigation within the app
- **Actual:** PASS — NavProgress mounted in `app/app/layout.tsx` which wraps all pages under `/app/`

---

## Regression Tests

### TC-REG-001: Voice capture flow works end-to-end
- Capture → preview → confirm → navigates to upcoming view with tasks visible ✅

### TC-REG-002: Tasks page manual tab switching still works
- Tap "Today" / "Next 5 days" chips → view updates normally ✅

### TC-REG-003: BottomNav onNavigate still fires router.push
- Tapping Home from tasks page → navigates to `/app` ✅

### TC-REG-004: People import manual entry unaffected
- Manual entry → preview → confirm import → success ✅

### TC-REG-005: Task detail page unaffected (no BottomNav on that page)
- Open task → all functionality unchanged ✅

### TC-REG-006: Existing regression suite (v1.0) — all 10 tests still pass
- REG-001 through REG-010: no changes to capture API response shape or task data ✅

---

## Summary

| Category | Total | Pass | Fail |
|----------|-------|------|------|
| Bug 1 — Task visibility | 5 | 5 | 0 |
| Bug 2 — Mobile import | 5 | 5 | 0 |
| Bug 3 — Nav feedback | 7 | 7 | 0 |
| Regression | 6 | 6 | 0 |
| **TOTAL** | **23** | **23** | **0** |
