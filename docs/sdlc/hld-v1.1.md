# High-Level Design Document
**Feature:** Bug Fix + UX Polish Sprint v1
**Version:** v1.1
**Date:** 2026-06-13
**Status:** APPROVED
**Approved by:** Software Engineer
**References:** PRD v1.1 | UX v1.1

---

## 1. Overview
All three fixes are purely frontend. No DB schema changes, no new API routes, no new environment variables.

---

## 2. Component / File Map

| Fix | Files Changed | New Files |
|-----|--------------|-----------|
| Bug 1 — Task visibility | `app/api/capture/route.ts`, `app/app/voice/page.tsx`, `app/app/tasks/page.tsx` | None |
| Bug 2 — Mobile import | `app/app/people/import/page.tsx` | None |
| Bug 3 — Nav feedback | `components/tia/shared.tsx`, `app/app/layout.tsx`, `app/app/page.tsx`, `app/app/tasks/page.tsx`, `app/app/people/page.tsx` | `components/tia/NavProgress.tsx` |

---

## 3. Fix Designs

### Fix A — Bug 1: Task Visibility

**Change 1 — Claude prompt (`app/api/capture/route.ts`)**
Line ~50, change the due_date_iso instruction from:
> "If urgent/ASAP, use today. If no urgency mentioned, use tomorrow."
To:
> "If mentioned date exists, use it. If urgent/ASAP or no date mentioned, use today. Never leave null."

This means tasks default to today — they show immediately in the today view AND in upcoming.

**Change 2 — Post-confirm navigation (`app/app/voice/page.tsx`)**
`confirmTasks()` function: change `router.push('/app/tasks')` to `router.push('/app/tasks?view=upcoming')`

**Change 3 — Tasks page reads URL param (`app/app/tasks/page.tsx`)**
Add `useSearchParams` hook. On mount, read `?view=` param:
```typescript
const searchParams = useSearchParams();
const initialView = (searchParams.get('view') as 'today' | 'upcoming') || 'today';
const [view, setView] = useState<'today' | 'upcoming'>(initialView);
```
Wrap the component in a `Suspense` boundary (required by Next.js for `useSearchParams` in pages).

---

### Fix B — Bug 2: Mobile Import

**Change — `app/app/people/import/page.tsx`**

Replace the single catch block with error-type detection:
```typescript
} catch (err: any) {
  if (err.name === 'AbortError') {
    setLoading(false);
    return; // user cancelled — silent
  }
  // Determine specific error message
  if (err.name === 'NotSupportedError' || err.name === 'TypeError') {
    setImportError('not_supported');
  } else if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
    setImportError('permission_denied');
  } else {
    setImportError('generic');
  }
  setLoading(false);
  // Auto-scroll to manual entry
  setTimeout(() => manualEntryRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
}
```

Error state renders a contextual banner above the manual entry section. `importError` replaces the existing `error` string state — values: `null | 'not_supported' | 'permission_denied' | 'generic'`.

Add `manualEntryRef = useRef<HTMLDivElement>(null)` attached to the manual entry container div.

---

### Fix C — Bug 3: Nav Feedback

**Change 1 — BottomNav active tab from URL (`components/tia/shared.tsx`)**

Update `BottomNavProps` and `BottomNav`:
```typescript
// Remove: active: 'home' | 'tasks' | 'people'
// Add:    pathname: string  (passed from parent via usePathname())
```

Derive active tab inside BottomNav:
```typescript
const activeTab = pathname.startsWith('/app/people') ? 'people'
  : pathname.startsWith('/app/tasks') ? 'tasks'
  : pathname.startsWith('/app/chat') ? 'chat'
  : 'home';
```

Add press state to each button:
```typescript
className="... active:scale-95 active:opacity-70"
```

**Change 2 — Remove local activeTab state from all pages**
`app/app/page.tsx`, `app/app/tasks/page.tsx`, `app/app/people/page.tsx`:
- Remove `const [activeTab, setActiveTab] = useState(...)` 
- Add `const pathname = usePathname()`
- Pass `pathname` to `<BottomNav pathname={pathname} />`
- Remove `onNavigate` handler's `setActiveTab` call; keep `router.push()` calls

**Change 3 — NavProgress component (`components/tia/NavProgress.tsx`)**

New client component using `usePathname` and `useEffect`:
```typescript
'use client';
// Watches pathname changes; animates a gold bar from 0→70% on navigation start,
// then 70→100% + fade when pathname settles.
// Uses CSS transitions only — no animation library.
// Respects prefers-reduced-motion: if set, renders nothing.
```

State machine: `idle → loading → completing → idle`
- `idle`: bar not rendered
- `loading`: bar at width 70%, transition 400ms ease-out
- `completing`: bar at width 100%, transition 150ms linear
- After completing: 200ms delay then fade out → back to idle

**Change 4 — Mount in layout (`app/app/layout.tsx`)**
Read this file first, then add `<NavProgress />` as the first child inside the layout wrapper.

---

## 4. No API / DB Changes
Zero changes to any API route response shape (except the Claude prompt tweak in capture).
Zero DB migrations required.

---

## 5. Rollback
Git revert. No DB state to unwind.
