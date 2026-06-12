# UX Design Document
**Feature:** Bug Fix + UX Polish Sprint v1
**Version:** v1.1
**Date:** 2026-06-13
**Status:** APPROVED
**Approved by:** Designer
**References:** PRD v1.1

---

## 1. Design Principles
- **Immediate feedback:** Every tap produces a visible response within 50ms
- **No dead ends:** Every error state has a clear next action
- **Trust through visibility:** Users see their data as soon as it's saved

---

## 2. Screen Changes

### SCR-A: Voice Capture Page — post-confirm navigation (Bug 1)
**Change:** `confirmTasks()` navigates to `/app/tasks?view=upcoming` instead of `/app/tasks`

**Before:** User taps "Confirm & Create Tasks" → navigates to `/app/tasks` (today view, empty)
**After:** User taps "Confirm & Create Tasks" → navigates to `/app/tasks?view=upcoming` (all new tasks visible)

No visual change to the capture page itself.

---

### SCR-B: Tasks Page — initial view from URL param (Bug 1)
**Change:** On page load, read `?view=` query param and set as initial view

**Before:** Page always loads with `view = 'today'` regardless of URL
**After:**
- `/app/tasks` → loads with `view = 'today'` (unchanged default)
- `/app/tasks?view=upcoming` → loads with `view = 'upcoming'` (new tasks visible)
- Chip UI unchanged — user can still switch between today/upcoming manually

---

### SCR-C: People Import Page — error handling (Bug 2)
**Change:** Three specific error states replace the single generic error

**Error state 1 — Browser not supported:**
```
┌─────────────────────────────────────┐
│  ⚠️  Your browser doesn't support   │
│  contact import.                     │
│                                      │
│  Enter names manually below.  ↓      │
└─────────────────────────────────────┘
[manual entry section auto-scrolls into view]
```

**Error state 2 — Permission denied:**
```
┌─────────────────────────────────────┐
│  🔒  Contacts access was denied.    │
│                                      │
│  To allow it: Settings → Browser    │
│  → Contacts → Allow                 │
│                                      │
│  Or enter names manually below. ↓   │
└─────────────────────────────────────┘
[manual entry section auto-scrolls into view]
```

**Error state 3 — Generic failure:**
```
┌─────────────────────────────────────┐
│  Contact import failed.             │
│  Enter names manually below. ↓      │
└─────────────────────────────────────┘
[manual entry section auto-scrolls into view]
```

**Auto-fallback behaviour:**
- On any error except AbortError (user cancelled): scroll to and highlight the manual entry textarea
- Manual entry textarea gets focus automatically
- "Import from Contacts" button stays visible but moves below the error (not removed)
- Error banner uses `bg-gold/5 border border-gold/20 rounded-xl` styling (soft, not alarming)

---

### SCR-D: BottomNav — press state + active tab from URL (Bug 3)

**Press state (immediate, < 50ms):**
- On tap: button shrinks slightly `scale-95` + dims `opacity-70`, CSS active pseudo-class
- Returns to normal as soon as navigation starts
- Implementation: `active:scale-95 active:opacity-70` Tailwind classes

**Active tab from URL:**
- Remove `activeTab` local state from all pages
- BottomNav receives `pathname` derived from `usePathname()` hook
- Active tab determined by: `/app` → home, `/app/tasks` → tasks, `/app/people` → people, `/app/chat` → chat
- The gold dot indicator and gold label appear instantly on the correct tab when the page loads

**No other visual changes to BottomNav.**

---

### SCR-E: NavProgress bar — navigation feedback (Bug 3)

**Appearance:**
- Fixed thin bar at the very top of the viewport (above everything, z-60)
- Height: 2px
- Color: gold (`#c9a96e`)
- Does not overlay content — sits above the viewport edge

**Animation sequence:**
1. Navigation starts (user taps) → bar appears at 0% width, animates to ~70% over 400ms (easing: ease-out)
2. Page finishes loading (pathname changes) → bar quickly fills to 100% over 150ms
3. Bar fades out over 200ms → removed from DOM

**Reduced motion:** If `prefers-reduced-motion: reduce`, skip the animation — bar does not appear at all (navigation still works, just no bar)

**Placement:** Mounted in `app/app/layout.tsx` — covers every page under `/app/`

---

## 3. Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| User taps same BottomNav tab they're already on | No navigation fires; no progress bar; tab stays active |
| Capture produces 0 tasks (rare error) | Stays on capture page; no navigation to tasks |
| Contact import: user cancels (AbortError) | No error shown; UI resets to initial import screen silently |
| NavProgress bar: navigation takes < 200ms | Bar fills and fades so fast it's barely visible — correct behaviour |
| NavProgress bar: navigation takes > 3s | Bar stays at ~70% until complete — user knows something is loading |
