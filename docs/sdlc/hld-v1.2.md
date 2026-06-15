# High-Level Design Document
**Feature:** Unified Chat + Voice Interface
**Version:** v1.2
**Date:** 2026-06-16
**Status:** APPROVED
**References:** PRD v1.2 | UX v1.2

---

## 1. Overview
All capture logic consolidated into the home page. No new API routes. No DB changes.

---

## 2. Data Flow
```
User types / speaks
      ↓
app/app/page.tsx (home)
      ├── Text → POST /api/chat → {reply, tasks[]} → render bubbles + cards
      └── Mic → MediaRecorder → POST /api/transcribe → text → POST /api/chat
                                                                    ↓
                                                          [Save] → POST /api/capture
                                                                    ↓
                                                          ✅ Saved confirmation
```

---

## 3. File Changes
| Action | File |
|--------|------|
| REWRITE | `app/app/page.tsx` — unified chat+voice home |
| DELETE | `app/app/chat/page.tsx` |
| MODIFY | `components/tia/shared.tsx` — remove Chat tab |
| MODIFY | `app/app/tasks/page.tsx` — remove chat onNavigate |
| MODIFY | `app/app/people/page.tsx` — remove chat onNavigate |

## 4. Unchanged (reused)
- `app/api/chat/route.ts`
- `app/api/transcribe/route.ts`
- `app/api/capture/route.ts`
- `app/app/voice/page.tsx` (kept, unlinked)

## 5. No DB / Schema / Env changes
