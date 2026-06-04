# UX Design Document
**Feature:** Received From — Task Delegation Source
**Version:** v1.0
**Date:** 2026-06-04
**Status:** APPROVED
**Approved by:** Designer
**References:** PRD v1.0

---

## 1. Design Principles for This Feature
- **Invisible when irrelevant:** The field never clutters the UI when empty — it only appears when it has value
- **Inline, not intrusive:** Delegation context lives on the same line as ownership — no extra rows for simple cases
- **Progressive disclosure:** Full edit capability is one tap away, not always visible
- **Match existing patterns:** Use the app's existing gold/surface palette, bottom sheet modal, and chip patterns

---

## 2. Screen & Page Inventory

| Screen ID | Screen Name | User Story(ies) | Entry Points | Exit Points |
|-----------|-------------|-----------------|--------------|-------------|
| SCR-001 | Task Card (modified) | US-001, US-003 | Tasks list, Home | Task detail |
| SCR-002 | Capture Preview Card (modified) | US-001, US-003 | Voice/Chat capture | Task list (on confirm) |
| SCR-003 | Task Detail — Meta Section (modified) | US-002, US-003, US-004 | Task card tap | Back to tasks |
| SCR-004 | People Picker Bottom Sheet (new) | US-002, US-005 | Tap "Received From" on task detail | Dismisses back to task detail |
| SCR-005 | Unresolved Person Banner (new) | US-005 | Inline below task card after capture | Dismissed after add or skip |

---

## 3. User Flows

### Flow 1: AI extracts "Received From" during voice capture (happy path)
**Trigger:** User records voice note containing delegation language
1. User taps mic on voice page, speaks: "Priya asked me to finalise the deck by Thursday"
2. AI processes transcript via `/api/capture`
3. Task is created with `received_from = "Priya"`
4. Capture preview card shows: title + "👤 You · from Priya" + due date + priority
5. User taps "Confirm & Create Tasks"
6. Navigates to task list
7. Task card shows "👤 You · from Priya" on the person line
8. If "Priya" is NOT in People → inline banner appears below the task card: "Add Priya to your People?"
**End state:** Task saved with delegation context; user prompted to add Priya if needed

### Flow 2: User manually sets "Received From" on task detail
**Trigger:** User opens a task that has no "Received From" set
1. User taps task card → task detail page
2. Meta section shows: Due Date, Priority, Owner — no "Received From" row (hidden)
3. User taps the "＋ Add received from" link below the Owner row
4. People Picker Bottom Sheet slides up
5. User sees search box + scrollable list of existing People
6. User taps a name → sheet dismisses → "Received From" row appears with that name
   OR user types a new name → taps "Add [Name]" → sheet dismisses → row appears
7. Task is saved via PATCH `/api/tasks/[id]`
**End state:** Task detail now shows "Received From: [Name]"

### Flow 3: User edits an existing "Received From"
**Trigger:** User opens task that already has "Received From" set
1. Task detail shows "Received From: Priya" as a tappable row
2. User taps the row
3. People Picker Bottom Sheet slides up with current value pre-highlighted
4. User selects a different person or clears the field
5. Sheet dismisses, row updates immediately
**End state:** "Received From" updated

### Flow 4: Unresolved person — user adds to People
**Trigger:** After capture, "Received From" name not found in People
1. Task card appears in list
2. Inline below the card: "Priya isn't in your People yet. Add her?" [Add] [Skip]
3. User taps [Add] → POST `/api/people` with name "Priya"
4. Banner disappears, "Priya" name on task card becomes a tappable link
**End state:** Priya added to People; task delegation context fully linked

### Flow 5: Self-initiated task — no "Received From"
**Trigger:** User captures a task with no delegation language
1. AI extracts task with `received_from = null`
2. Capture preview card shows: title + "👤 You" (no "· from X")
3. Task card shows: "👤 You" only
4. Task detail has no "Received From" row — shows "＋ Add received from" link instead
**End state:** Clean UI with no empty fields shown

---

## 4. Screen Wireframe Descriptions

### SCR-001: Task Card (modified)
**Change:** Person line updated to show both owner and received-from inline

**Current person line:**
```
👤 John
```

**New person line (when received_from is set):**
```
👤 John  ·  from Priya
```
- "👤 John" — existing owner display (gold text if not self, muted if self/hidden)
- " · " — separator, `text-text-ghost` color
- "from Priya" — `text-xs text-text-muted`, same line, no icon
- If `assigned_to` is "self" AND `received_from` is set:
  ```
  👤 You  ·  from Priya
  ```
- If both are null/self with no received_from: line is hidden entirely (existing behavior)
- Max width: truncate name with ellipsis if combined line overflows

**No other changes to task card layout.**

---

### SCR-002: Capture Preview Card (modified)
**Change:** Add "from [Name]" to the person metadata row in preview

**Current preview row:**
```
👤  Self        📅  Thursday        🔥  High
```

**New preview row (when received_from extracted):**
```
👤  You · from Priya        📅  Thursday        🔥  High
```
- Same `text-xs text-text-secondary` style
- "from Priya" appended after owner name, separated by " · "
- If no received_from: no change to existing display

---

### SCR-003: Task Detail — Meta Section (modified)
**Current meta grid:** 2-column grid: Due Date | Priority | Assigned To

**New meta section layout:**
```
┌─────────────────────────────────────┐
│ Due Date          │ Priority         │
│ Thursday          │ High             │
├───────────────────┴──────────────────┤
│ Created by                           │
│ You                                  │
├──────────────────────────────────────┤
│ Owner                                │
│ [Name or "You"]                      │
├──────────────────────────────────────┤
│ Received From              [tap row] │  ← only when set
│ Priya  ›                             │
├──────────────────────────────────────┤  ← only when NOT set
│ + Add received from                  │  (small, muted link)
└──────────────────────────────────────┘
```

**"Received From" row (when set):**
- Label: `text-xs text-text-secondary` — "Received From"
- Value: `text-sm text-text-primary` — person's name
- If person exists in People: name is `text-gold` and tappable → navigates to `/app/people/[id]`
- If person NOT in People: name is `text-text-primary` (not linked)
- Trailing `›` chevron indicates the whole row is tappable → opens People Picker
- Row is full-width (not in the 2-col grid)

**"+ Add received from" link (when not set):**
- `text-xs text-text-muted` with `+` prefix
- Tapping opens People Picker Bottom Sheet
- Placed below Owner row

**"Created by" row:**
- Always shows "You" (non-interactive, informational only)
- `text-xs text-text-secondary` label, `text-sm text-text-primary` value

---

### SCR-004: People Picker Bottom Sheet (new component)
**Trigger:** Tap "Received From" row or "+ Add received from" on task detail

**Layout:**
```
┌─────────────────────────────────────┐
│  ▬  (drag handle)                   │
│                                      │
│  Received From                       │  ← sheet title
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍  Search people...           │  │  ← search input
│  └────────────────────────────────┘  │
│                                      │
│  YOUR PEOPLE                         │  ← section header (muted caps)
│  ┌────────────────────────────────┐  │
│  │  Priya                         │  │  ← existing person row
│  │  Alice                         │  │
│  │  John                          │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │  ← appears when search has text
│  │  + Add "[typed name]"          │  │     with no matching person
│  └────────────────────────────────┘  │
│                                      │
│  [Clear]                [Cancel]     │  ← footer actions
└─────────────────────────────────────┘
```

**Interactions:**
- Sheet slides up from bottom, 60% screen height, draggable to dismiss
- Search input: auto-focuses on open; filters People list as user types (case-insensitive, matches name and aliases)
- Existing person row: tap → selects, sheet dismisses, field updates
- "+ Add [typed name]": appears when search text finds no match; tap → creates People entry + selects it
- [Clear]: removes current "Received From" value, sheet dismisses
- [Cancel]: dismisses without change
- Background tap: dismisses without change

**States:**
- Empty search: shows full People list sorted by `open_task_count` desc
- Typing with matches: filtered list
- Typing with no matches: list hidden, only "+ Add [name]" shown
- No people in system: shows "No people yet" empty state + "+ Add [typed name]" always visible

**Microcopy:**
- Sheet title: "Received From"
- Search placeholder: "Search people..."
- Section header: "YOUR PEOPLE"
- Add new: `+ Add "[name]"`
- Clear button: "Clear"
- Cancel button: "Cancel"

---

### SCR-005: Unresolved Person Banner (new, inline below task card)
**Trigger:** After capture confirms, task has `received_from` set to a name not found in People

**Layout (inline below the task card it belongs to):**
```
┌─────────────────────────────────────┐
│  Task Card (existing)               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Priya isn't in your People yet.    │
│  [Add Priya]          [Skip]        │
└─────────────────────────────────────┘
```

**Styling:**
- Background: `bg-gold/5`, border: `border border-gold/20`, `rounded-b-2xl` (connects visually to card above)
- Text: `text-xs text-text-secondary`
- [Add Name]: `text-xs text-gold font-medium` button
- [Skip]: `text-xs text-text-ghost` button
- Margin-top: `-mt-2` to visually attach to task card

**Behavior:**
- Appears for each task that has an unresolved received_from
- [Add Name]: POST `/api/people`, banner disappears, name becomes linked on task card
- [Skip]: banner dismissed (localStorage flag or session state — does not reappear this session)
- Banner does NOT appear if user navigates away and comes back (dismissed on navigation)

**Microcopy:**
- Message: "[Name] isn't in your People yet."
- Add button: "Add [Name]"
- Skip button: "Skip"

---

## 5. Navigation & Information Architecture
- No new routes added
- No nav changes
- New component: `PeoplePicker` bottom sheet (reusable)
- New component: `UnresolvedPersonBanner` (inline)
- Task detail meta section restructured from 2-col grid to stacked rows for the new fields

---

## 6. Edge Cases & Error States

| Scenario | Expected UX Behavior |
|----------|---------------------|
| `received_from` name is very long (>20 chars) | Truncate with ellipsis on task card; full name shown on task detail |
| People list is empty (new user) | Bottom sheet shows "No people yet" + search box; "+ Add [name]" always visible |
| Network error when saving "Received From" | Show existing Toast error component; field reverts to previous value |
| AI extracts a name that is a participant, not a delegator | QA test case; prompt tuning should prevent this |
| Capture returns multiple tasks, some with received_from, some without | Banner appears inline only below the tasks that have unresolved names |
| User taps "Add [Name]" in banner but name already exists (race condition) | Upsert silently succeeds; banner dismisses normally |

---

## 7. Accessibility Requirements
- People Picker bottom sheet traps focus when open
- All interactive elements have accessible labels (`aria-label`)
- "Received From" row on task detail has role="button" and keyboard-accessible
- Banner [Add] and [Skip] buttons have sufficient tap target (min 44px height)

---

## 8. Animations & Transitions

| Trigger | Animation | Duration |
|---------|-----------|----------|
| People Picker opens | Slide up from bottom | 250ms ease-out |
| People Picker dismisses | Slide down | 200ms ease-in |
| Banner appears after capture | Fade in | 300ms |
| Banner dismisses (Add/Skip) | Fade out + collapse height | 200ms |

---

## 9. Open UX Questions
| # | Question | Blocking? | Resolution |
|---|----------|-----------|------------|
| UX-Q-001 | Should "Created by: You" always show on task detail, or only for tasks where received_from is also set? | No | Always show — adds context and is consistent |
