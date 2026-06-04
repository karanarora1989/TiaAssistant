# High-Level Design Document
**Feature:** Received From — Task Delegation Source
**Version:** v1.0
**Date:** 2026-06-04
**Status:** APPROVED
**Approved by:** Software Engineer
**References:** PRD v1.0 | UX v1.0

---

## 1. Architecture Overview
This feature is a focused enhancement to the existing task model. No new services or infrastructure are needed. The work spans three layers: (1) a DB schema migration that consolidates two legacy fields into one, (2) backend changes to the capture AI prompt and the task PATCH API, and (3) three frontend changes — TaskCard display, task detail meta section, and capture preview — plus two new reusable components (PeoplePicker, UnresolvedPersonBanner).

---

## 2. System Context Diagram

```
User (Mobile Browser)
        │
        ▼
┌─────────────────────────────────────────┐
│  Next.js Frontend (meetyourtia/)        │
│                                         │
│  Modified:                              │
│  ├── TaskCard.tsx          (display)    │
│  ├── voice/page.tsx        (preview +   │
│  │                          banner)     │
│  └── tasks/[id]/page.tsx   (meta edit)  │
│                                         │
│  New:                                   │
│  ├── PeoplePicker.tsx      (component)  │
│  └── UnresolvedPersonBanner.tsx         │
└──────────┬──────────────────────────────┘
           │  REST API calls
           ▼
┌─────────────────────────────────────────┐
│  API Routes (app/api/)                  │
│                                         │
│  Modified:                              │
│  ├── /api/capture          (AI prompt)  │
│  └── /api/tasks/[id]       (PATCH)      │
│                                         │
│  Unchanged (reused):                    │
│  ├── /api/people           (GET, POST)  │
│  └── /api/transcribe                    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Supabase (PostgreSQL)                  │
│                                         │
│  tasks table:                           │
│  ├── received_from TEXT    ← NEW TYPE   │
│  │   (was TEXT[], now single string)    │
│  └── assigned_from TEXT    ← DEPRECATED │
│      (kept for backward compat,         │
│       not written to in new code)       │
│                                         │
│  people table: unchanged                │
└─────────────────────────────────────────┘
```

---

## 3. Component Breakdown

| Component | Type | Responsibility | New / Modified |
|-----------|------|----------------|----------------|
| `PeoplePicker` | React component | Bottom sheet — search people, select or create | **New** |
| `UnresolvedPersonBanner` | React component | Inline banner below task card for unresolved names | **New** |
| `TaskCard` | React component | Show `received_from` inline on person line | Modified |
| `voice/page.tsx` | Frontend page | Show `received_from` in preview; render banners; pre-fetch people | Modified |
| `tasks/[id]/page.tsx` | Frontend page | Restructure meta section; add Received From row + picker | Modified |
| `lib/supabase.ts` | Type definition | `received_from: string` (was `string[]`); remove `assigned_from` | Modified |
| `/api/capture` | API route | Update Claude prompt; write `received_from` as string | Modified |
| `/api/tasks/[id]` | API route | Accept `received_from` in PATCH body | Modified |
| `RECEIVED_FROM_MIGRATION.sql` | SQL migration | Consolidate schema fields | **New** |

---

## 4. Data Model Changes

### Migration: `received_from TEXT[]` → `TEXT`

```sql
-- Step 1: Add new single-value column
ALTER TABLE tasks ADD COLUMN received_from_new TEXT;

-- Step 2: Populate from best available source
-- Priority: assigned_from first (was the actively-written single-string field),
-- then fall back to first element of old received_from array
UPDATE tasks
SET received_from_new = COALESCE(
  NULLIF(assigned_from, ''),
  received_from[1]   -- Postgres arrays are 1-indexed
);

-- Step 3: Drop old array column, rename new one
ALTER TABLE tasks DROP COLUMN received_from;
ALTER TABLE tasks RENAME COLUMN received_from_new TO received_from;

-- Step 4: Soft-deprecate assigned_from (keep column, stop writing to it)
-- No DROP — backward compatibility with any existing queries that read it.
-- Future: can be dropped in a subsequent migration once confirmed safe.

-- Step 5: Index for people-resolution lookups
CREATE INDEX IF NOT EXISTS idx_tasks_received_from ON tasks(received_from);
```

**Rollback:**
```sql
-- Re-add array column and restore from assigned_from / current received_from
ALTER TABLE tasks ADD COLUMN received_from_old TEXT[];
UPDATE tasks SET received_from_old = CASE
  WHEN received_from IS NOT NULL THEN ARRAY[received_from]
  ELSE NULL
END;
ALTER TABLE tasks DROP COLUMN received_from;
ALTER TABLE tasks RENAME COLUMN received_from_old TO received_from;
```

### TypeScript type change — `lib/supabase.ts`

```typescript
// Before
assigned_from?: string;   // legacy — soft-deprecated
received_from?: string[]; // was array

// After
received_from?: string;   // single string, consolidates both
// assigned_from removed from interface (DB column kept but not exposed)
```

---

## 5. API Contracts

### PATCH `/api/tasks/[id]` — updated
Add `received_from` to the list of patchable fields.

**Request (addition):**
```json
{
  "received_from": "Priya"   // string | null to clear
}
```
**Response:** unchanged — returns updated task object. `received_from` will be present in the task.

No new endpoint needed. People GET/POST (`/api/people`) are reused unchanged.

### POST `/api/capture` — AI prompt updated
Claude extraction prompt gains explicit instruction to extract `received_from` as a single string. See Section 6 (Data Flow) for full prompt delta.

---

## 6. Data Flows

### Flow A: Voice/text capture → received_from extracted
1. User submits transcript to `POST /api/capture`
2. Claude prompt instructs: extract `received_from` = single name of person who delegated this task (look for "X asked me", "per X", "X wants me to", "from X", "X told me"); set to `null` if self-initiated
3. Claude returns JSON task array with `received_from: "Priya"` or `received_from: null`
4. API inserts task with `received_from` as string (or null)
5. API response includes full task objects
6. Frontend (voice page) receives tasks; for each task where `received_from` is set:
   - Checks the pre-fetched People list (passed from parent) for a name match (case-insensitive)
   - If no match: marks that task as `hasUnresolvedPerson: true`
7. Capture preview renders: task preview cards + UnresolvedPersonBanner below each unresolved card

### Flow B: Manual edit via PeoplePicker
1. User on task detail taps "Received From" row or "+ Add received from"
2. `PeoplePicker` renders with `people` prop (pre-fetched by `tasks/[id]/page.tsx` on mount via `GET /api/people`)
3. User selects a person or types a new name
4. On select (existing person): `PATCH /api/tasks/[id]` with `{ received_from: "Priya" }`
5. On add new name: `POST /api/people` with `[{ name: "NewName" }]`, then `PATCH /api/tasks/[id]`
6. Task state updated in frontend; meta section re-renders with new value

### Flow C: Unresolved banner — Add to People
1. Banner rendered below task card with `name="Priya"` prop
2. User taps [Add Priya]
3. `POST /api/people` with `[{ name: "Priya" }]` — existing bulk endpoint
4. Banner component calls `onResolved()` callback → parent removes banner from state
5. Task card `received_from` display now resolves to a linked name (People list re-fetched or updated in state)

---

## 7. New Component Specifications

### `PeoplePicker` (`components/tia/PeoplePicker.tsx`)
```typescript
interface PeoplePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;   // called with selected/new name
  onClear: () => void;                // called when user taps Clear
  currentValue?: string;              // pre-highlights current selection
  people: Person[];                   // pre-fetched, passed by parent
}
```
- Renders as a fixed bottom sheet overlay (z-50)
- Filters `people` prop locally — no API call on each keystroke
- "Add [name]" option calls `POST /api/people` internally, then calls `onSelect`
- No API calls except the optional people-create

### `UnresolvedPersonBanner` (`components/tia/UnresolvedPersonBanner.tsx`)
```typescript
interface UnresolvedPersonBannerProps {
  name: string;
  onResolved: () => void;   // parent removes banner from state
  onSkip: () => void;       // parent removes banner from state (no API call)
}
```
- Manages its own loading state for the Add action
- Calls `POST /api/people` then `onResolved()`
- Skip calls `onSkip()` immediately — no persistence, session-only

---

## 8. Tech Stack Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Bottom sheet implementation | Custom div with fixed positioning + CSS transform | Consistent with existing app patterns; no new library dependency |
| People filtering | Client-side filter on pre-fetched array | People list is small (<100 typically); avoids network round-trip per keystroke |
| Schema consolidation approach | Rename-via-new-column rather than ALTER TYPE | Safer for Supabase — avoids potential lock issues on ALTER TYPE with existing data |
| `assigned_from` handling | Soft-deprecate (keep in DB, remove from TS interface) | Zero risk to existing data; can hard-drop in a future migration |

---

## 9. Non-Functional Design

- **Performance:** No new API calls on the critical capture path; people list pre-fetched once per page load
- **Security:** `received_from` is user-owned data; existing RLS policies on `tasks` table cover it
- **Error handling:** PeoplePicker and Banner both have loading + error states; task PATCH failures revert the UI value
- **Backward compatibility:** `assigned_from` DB column retained; existing rows with data are migrated to `received_from` without loss

---

## 10. Migration & Rollout Plan
- Run `RECEIVED_FROM_MIGRATION.sql` in Supabase SQL editor before deploying code
- No feature flag needed — the field is additive and hidden when null
- Rollback: run rollback SQL, revert code deployment

---

## 11. Files Summary

**New files:**
- `RECEIVED_FROM_MIGRATION.sql`
- `components/tia/PeoplePicker.tsx`
- `components/tia/UnresolvedPersonBanner.tsx`

**Modified files:**
- `lib/supabase.ts`
- `app/api/capture/route.ts`
- `app/api/tasks/[id]/route.ts`
- `components/tia/TaskCard.tsx`
- `app/app/voice/page.tsx`
- `app/app/tasks/[id]/page.tsx`
