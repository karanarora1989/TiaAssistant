# Technical Specification
**Feature:** Received From — Task Delegation Source
**Version:** v1.0
**Date:** 2026-06-04
**Status:** APPROVED
**Approved by:** Software Engineer
**References:** PRD v1.0 | UX v1.0 | HLD v1.0 | Traceability v1.0

---

## 1. Scope Summary
This spec covers the full implementation of the "Received From" field on tasks. It includes a DB migration, type updates, AI prompt changes, two new reusable components, and modifications to four existing files. It does NOT cover multi-delegator support, agent follow-up behavior, or task-list filtering by received_from.

---

## 2. Database Changes

### Migration file: `RECEIVED_FROM_MIGRATION.sql`
```sql
-- Step 1: Add new single-value column
ALTER TABLE tasks ADD COLUMN received_from_new TEXT;

-- Step 2: Populate from best available source
UPDATE tasks
SET received_from_new = COALESCE(
  NULLIF(assigned_from, ''),
  received_from[1]
);

-- Step 3: Swap columns
ALTER TABLE tasks DROP COLUMN received_from;
ALTER TABLE tasks RENAME COLUMN received_from_new TO received_from;

-- Step 4: Index
CREATE INDEX IF NOT EXISTS idx_tasks_received_from ON tasks(received_from);
```
**Run before deploying code. `assigned_from` column is kept (not dropped).**

---

## 3. Implementation Tasks

### TASK-001: Update TypeScript type
- **PRD ref:** FR-002
- **HLD ref:** `lib/supabase.ts` type change
- **File:** `meetyourtia/lib/supabase.ts`
- **Change:** Remove `assigned_from?: string`. Change `received_from?: string[]` → `received_from?: string`.
- **Unit test:** Type-level only — confirm no TS errors after change.
- **DoD:** `tsc --noEmit` passes with no type errors.

### TASK-002: Update capture API — AI prompt + insertion
- **PRD ref:** US-001, FR-001
- **HLD ref:** `/api/capture` prompt update
- **File:** `meetyourtia/app/api/capture/route.ts`
- **Changes:**
  1. In the Claude extraction prompt, replace the current `assigned_from` instruction with:
     ```
     4. received_from - if someone delegated this task to the speaker, their name (single string).
        Look for patterns: "X asked me to", "per X", "X wants me to", "from X", "X told me to",
        "X needs me to", "X requested". If self-initiated, use null.
        This is NOT the same as assigned_to — received_from is who gave the task, assigned_to is who does it.
     ```
  2. In the JSON shape comment, change `"assigned_from": "..."` → `"received_from": "Person Name or null"`
  3. In task insertion (`taskRows` map): replace `assigned_from: task.assigned_from || null` with `received_from: task.received_from || null`. Remove the `received_from: task.received_from || []` line.
  4. In the agent-scheduling block: replace references to `insertedTask.assigned_to` check (already single string — no change needed there).
- **Unit test:** Mock Claude response with `received_from: "Priya"` → confirm task inserted with `received_from = "Priya"` and no `assigned_from` write.
- **DoD:** Capture inserts `received_from` as string; `assigned_from` is never written.

### TASK-003: Update task PATCH API
- **PRD ref:** US-002, FR-003
- **HLD ref:** PATCH `/api/tasks/[id]`
- **File:** `meetyourtia/app/api/tasks/[id]/route.ts`
- **Change:** Add `received_from` to the destructured body fields and the `updates` object builder:
  ```typescript
  const { status, title, due_date, due_date_iso, assigned_to, priority, blocked_by, received_from } = body;
  // ...
  if (received_from !== undefined) updates.received_from = received_from; // null clears it
  ```
- **Unit test:** PATCH with `{ received_from: "Alice" }` → confirm task returned has `received_from: "Alice"`. PATCH with `{ received_from: null }` → confirm field cleared.
- **DoD:** `received_from` is patchable; null clears it; history logged.

### TASK-004: New component — PeoplePicker
- **PRD ref:** US-002, FR-003, FR-008
- **HLD ref:** `PeoplePicker.tsx` spec
- **File:** `meetyourtia/components/tia/PeoplePicker.tsx` (new)
- **Interface:**
  ```typescript
  interface PeoplePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (name: string) => void;
    onClear: () => void;
    currentValue?: string;
    people: Person[];
    title?: string; // defaults to "Select Person" — CTO OBS-002
  }
  ```
- **Behavior:**
  - Fixed overlay: `position: fixed, inset: 0, z-50` with dark backdrop (`bg-black/40`)
  - Sheet panel: `fixed bottom-0 left-0 right-0`, `bg-surface-1`, `rounded-t-2xl`, `p-6`, max-height 65vh, overflow-y-auto
  - Drag handle: `w-10 h-1 bg-border-1 rounded-full mx-auto mb-4`
  - Search input: uses existing `Input` component from `shared.tsx`; filters `people` prop by `name.toLowerCase().includes(query)` and `aliases` array
  - People list: each row is a button, `py-3 border-b border-border-2 text-sm text-text-primary`; active (currentValue match) gets `text-gold font-medium`
  - "Add [name]" row: appears when `query.length > 0` AND no exact match found; calls `POST /api/people` then `onSelect(query)`
  - Footer: `[Clear]` (ghost, left) and `[Cancel]` (ghost, right); Clear calls `onClear()` then `onClose()`
  - Backdrop tap calls `onClose()`
  - `// @deprecated note`: not applicable here, but add comment: `// PeoplePicker is generic — use 'title' prop to customise the sheet heading`
- **Unit test:** Render with 3 people → search "ali" → confirm only matching people shown. Type "Zara" (no match) → confirm "+ Add Zara" appears.
- **DoD:** Component renders, filters, selects, creates new person, and dismisses correctly.

### TASK-005: New component — UnresolvedPersonBanner
- **PRD ref:** US-005, FR-007
- **HLD ref:** `UnresolvedPersonBanner.tsx` spec
- **File:** `meetyourtia/components/tia/UnresolvedPersonBanner.tsx` (new)
- **Interface:**
  ```typescript
  interface UnresolvedPersonBannerProps {
    name: string;
    onResolved: () => void;
    onSkip: () => void;
  }
  ```
- **Behavior:**
  - Container: `-mt-3 mx-0 px-4 py-3 bg-gold/5 border border-gold/20 border-t-0 rounded-b-2xl`
  - Text: `text-xs text-text-secondary` → `"{name} isn't in your People yet."`
  - [Add {name}] button: `text-xs text-gold font-medium`; on click → `POST /api/people [{name}]` → on success call `onResolved()`; show inline spinner during load
  - [Skip] button: `text-xs text-text-ghost ml-3`; on click → `onSkip()`
  - Error state: if POST fails, show `text-overdue-red text-xs` "Couldn't add. Try again."
- **Unit test:** Render with name="Priya" → confirm text, confirm Add triggers POST, confirm onResolved called on success, confirm onSkip called immediately.
- **DoD:** Banner renders, Add creates person, Skip dismisses, errors handled.

### TASK-006: Update TaskCard
- **PRD ref:** US-003, FR-004
- **HLD ref:** `TaskCard.tsx` modified
- **File:** `meetyourtia/components/tia/TaskCard.tsx`
- **Change:** In the "Assigned To & Agent Status" block, extend to show `received_from` on the same line:
  ```tsx
  {(task.assigned_to && task.assigned_to !== 'self') || task.received_from ? (
    <div className="flex items-center gap-2 mb-1 flex-wrap">
      <span className="text-xs text-text-secondary">
        {task.assigned_to && task.assigned_to !== 'self' ? task.assigned_to : 'You'}
      </span>
      {task.received_from && (
        <>
          <span className="text-xs text-text-ghost">·</span>
          <span className="text-xs text-text-muted">from {task.received_from}</span>
        </>
      )}
      {task.agent_enabled && (
        <span className="text-[10px] px-1.5 py-0.5 bg-gold/10 border border-gold/30 rounded text-gold">
          🤖 Agent
        </span>
      )}
    </div>
  ) : null}
  ```
- **Unit test:** Render task with `received_from: "Priya"` → confirm "· from Priya" text present. Render with `received_from: null` → confirm "from" text absent.
- **DoD:** Card shows inline delegation context when set; hidden when null.

### TASK-007: Update voice capture page
- **PRD ref:** US-001, US-003, US-005
- **HLD ref:** `voice/page.tsx` — preview + banners + pre-fetch people
- **File:** `meetyourtia/app/app/voice/page.tsx`
- **Changes:**
  1. Add `received_from?: string` to the `ExtractedTask` interface (remove old `assigned_to` array comment)
  2. Add `people` state: `const [people, setPeople] = useState<Person[]>([])`
  3. On mount (`useEffect([], [])`): fetch `GET /api/people` → `setPeople(data.data.people)`
  4. Add `unresolvedNames` state: `const [unresolvedNames, setUnresolvedNames] = useState<Set<string>>(new Set())`
  5. After capture response sets `extractedTasks`: compute unresolved names:
     ```typescript
     const peopleNames = new Set(people.map(p => p.name.toLowerCase()));
     const unresolved = new Set<string>();
     data.data.tasks.forEach((t: any) => {
       if (t.received_from && !peopleNames.has(t.received_from.toLowerCase())) {
         unresolved.add(t.received_from);
       }
     });
     setUnresolvedNames(unresolved);
     ```
  6. In the capture preview render, below each task card, render `UnresolvedPersonBanner` if task's `received_from` is in `unresolvedNames`:
     ```tsx
     {task.received_from && unresolvedNames.has(task.received_from) && (
       <UnresolvedPersonBanner
         name={task.received_from}
         onResolved={() => setUnresolvedNames(prev => { const s = new Set(prev); s.delete(task.received_from!); return s; })}
         onSkip={() => setUnresolvedNames(prev => { const s = new Set(prev); s.delete(task.received_from!); return s; })}
       />
     )}
     ```
  7. In preview card metadata row, add `received_from` display after owner:
     ```tsx
     <span className="flex items-center gap-1 text-text-secondary">
       <span>👤</span>
       <span>
         {task.assigned_to && task.assigned_to !== 'self' ? task.assigned_to : 'You'}
         {task.received_from && <span className="text-text-muted"> · from {task.received_from}</span>}
       </span>
     </span>
     ```
- **Unit test:** Mock capture response with `received_from: "Priya"` not in people list → confirm banner renders. Mock with name in people list → confirm no banner.
- **DoD:** Preview shows received_from; banners appear only for unresolved names.

### TASK-008: Update task detail page
- **PRD ref:** US-002, US-003, US-004, FR-003, FR-006
- **HLD ref:** `tasks/[id]/page.tsx` — meta section + PeoplePicker
- **File:** `meetyourtia/app/app/tasks/[id]/page.tsx`
- **Changes:**
  1. Add `people` state, fetch on mount: `GET /api/people` → `setPeople(data.data.people)`
  2. Add `pickerOpen` state: `const [pickerOpen, setPickerOpen] = useState(false)`
  3. Replace the existing 2-col meta grid `<Card>` with a stacked layout:
     ```tsx
     <Card className="mb-6 space-y-4">
       {/* Row 1: Due Date + Priority (keep 2-col) */}
       <div className="grid grid-cols-2 gap-4 text-sm">
         <div>
           <p className="text-xs text-text-secondary mb-1">Due Date</p>
           <p className="text-text-primary">{task.due_date || 'No deadline'}</p>
         </div>
         <div>
           <p className="text-xs text-text-secondary mb-1">Priority</p>
           <p className="text-text-primary capitalize">{task.priority}</p>
         </div>
       </div>
       {/* Row 2: Created by */}
       <div className="text-sm border-t border-border-2 pt-4">
         <p className="text-xs text-text-secondary mb-1">Created by</p>
         <p className="text-text-primary">You</p>
       </div>
       {/* Row 3: Owner */}
       {task.assigned_to && (
         <div className="text-sm border-t border-border-2 pt-4">
           <p className="text-xs text-text-secondary mb-1">Owner</p>
           <p className="text-text-primary">
             {task.assigned_to === 'self' ? 'You' : task.assigned_to}
           </p>
         </div>
       )}
       {/* Row 4: Received From */}
       <div className="text-sm border-t border-border-2 pt-4">
         <p className="text-xs text-text-secondary mb-1">Received From</p>
         {task.received_from ? (
           <button
             onClick={() => setPickerOpen(true)}
             className="flex items-center justify-between w-full"
           >
             {/* Link to People profile if person exists */}
             {(() => {
               const match = people.find(p => p.name.toLowerCase() === task.received_from!.toLowerCase());
               return match ? (
                 <span
                   className="text-gold text-sm"
                   onClick={(e) => { e.stopPropagation(); router.push(`/app/people/${match.id}`); }}
                 >
                   {task.received_from}
                 </span>
               ) : (
                 <span className="text-text-primary text-sm">{task.received_from}</span>
               );
             })()}
             <span className="text-text-ghost text-xs">›</span>
           </button>
         ) : (
           <button
             onClick={() => setPickerOpen(true)}
             className="text-xs text-text-muted hover:text-text-secondary transition-smooth"
           >
             + Add received from
           </button>
         )}
       </div>
     </Card>
     ```
  4. Add PeoplePicker below the Card:
     ```tsx
     <PeoplePicker
       isOpen={pickerOpen}
       onClose={() => setPickerOpen(false)}
       title="Received From"
       currentValue={task.received_from}
       people={people}
       onSelect={async (name) => {
         setPickerOpen(false);
         await fetch(`/api/tasks/${taskId}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ received_from: name }),
         });
         fetchTask(); // refresh task state
       }}
       onClear={async () => {
         setPickerOpen(false);
         await fetch(`/api/tasks/${taskId}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ received_from: null }),
         });
         fetchTask();
       }}
     />
     ```
  5. When a new person is added via PeoplePicker's "+ Add" action, the PeoplePicker calls `POST /api/people` internally then `onSelect` — the people state needs to be refreshed. After `fetchTask()`, also call `fetchPeople()` (extract people fetch into a named function).
     — **CTO OBS-003 fix:** After `onSelect`, re-fetch people so the link resolves immediately.
- **Unit test:** Render with task having `received_from: "Priya"` and Priya in people list → confirm gold linked text. Render with unmatched name → confirm plain text. Tap "+ Add received from" → confirm picker opens.
- **DoD:** Meta section shows all rows; picker opens and saves; link resolves to People profile when matched.

---

## 4. API Changes Summary

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/capture` | POST | Claude prompt updated; inserts `received_from` as string |
| `/api/tasks/[id]` | PATCH | Accepts `received_from: string \| null` |
| `/api/people` | GET, POST | Unchanged — reused as-is |

---

## 5. New Files Summary

| File | Purpose |
|------|---------|
| `RECEIVED_FROM_MIGRATION.sql` | DB migration |
| `components/tia/PeoplePicker.tsx` | Generic people picker bottom sheet |
| `components/tia/UnresolvedPersonBanner.tsx` | Inline post-capture banner |

---

## 6. Modified Files Summary

| File | Change |
|------|--------|
| `lib/supabase.ts` | `received_from: string`, remove `assigned_from` |
| `app/api/capture/route.ts` | Prompt + insertion update |
| `app/api/tasks/[id]/route.ts` | Add `received_from` to PATCH |
| `components/tia/TaskCard.tsx` | Inline "from [Name]" display |
| `app/app/voice/page.tsx` | Preview + banner + people pre-fetch |
| `app/app/tasks/[id]/page.tsx` | Meta restructure + PeoplePicker |

---

## 7. Deployment Notes
- Run `RECEIVED_FROM_MIGRATION.sql` BEFORE deploying code
- No env var changes needed
- No feature flag needed
- Rollback: run rollback SQL + revert git commit
