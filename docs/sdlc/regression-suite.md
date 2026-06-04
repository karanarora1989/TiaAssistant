# Regression Suite
> APPEND-ONLY. Do not remove entries. Mark outdated tests as [DEPRECATED] but keep them.

---
## Added in v1.0 — Received From (Task Delegation Source) — 2026-06-04

### REG-001: Voice capture with delegation language sets received_from
- Transcript: "X asked me to do Y"
- Expected: task.received_from = "X", not null

### REG-002: Voice capture without delegation language has null received_from
- Transcript: "I need to do Y"
- Expected: task.received_from = null

### REG-003: Task card shows "· from [Name]" when received_from is set
- Render TaskCard with received_from = "Priya"
- Expected: "from Priya" text visible on card

### REG-004: Task card hides person line when assigned_to is self AND received_from is null
- Render TaskCard with assigned_to = "self", received_from = null
- Expected: no person line rendered

### REG-005: Task detail "Received From" row hidden when null, shows link when set
- received_from = null → "+ Add received from" shown
- received_from = "Alice" (in People) → gold linked text

### REG-006: PATCH /api/tasks/[id] with received_from updates DB field
- PATCH { received_from: "Alice" } → task.received_from = "Alice"
- PATCH { received_from: null } → task.received_from = null

### REG-007: PeoplePicker filters client-side without API calls per keystroke
- Open picker with 5 people; type "ali" → only matching people shown; network tab shows no new requests

### REG-008: UnresolvedPersonBanner disappears after Add (no reappear same session)
- Banner shown → tap Add → banner gone → navigate away and back → banner does not return

### REG-009: Existing task capture (no delegation) creates tasks normally
- Regression: capture still works with received_from = null

### REG-010: Task history logs received_from changes
- PATCH received_from → history entry with field_changed = "received_from"
