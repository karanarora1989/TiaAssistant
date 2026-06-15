# UX Design Document
**Feature:** Unified Chat + Voice Interface
**Version:** v1.2
**Date:** 2026-06-16
**Status:** APPROVED
**References:** PRD v1.2

---

## 1. Screen: Home (`/app`)

### Layout
```
┌─────────────────────────────────────┐
│  Tia                                │  ← Top bar, no back button
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 👋 Hi! What's on your plate  │  │  ← Tia seed bubble (left)
│  │ today — type or speak.        │  │
│  └───────────────────────────────┘  │
│                                     │
│        ┌─────────────────────────┐  │
│        │ Atlas review with Priya │  │  ← User bubble (right)
│        │ by Friday               │  │
│        └─────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Got it. One task:             │  │  ← Tia bubble
│  │  ┌─────────────────────────┐  │  │
│  │  │ ● Review Atlas w/Priya  │  │  │  ← Inline task card
│  │  │   Fri · Medium · Self   │  │  │
│  │  └─────────────────────────┘  │  │
│  │  [Save 1 task]                │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│ ┌───────────────────────┐ [🎤] [→] │  ← Input bar
│ │ Message Tia...        │          │
│ └───────────────────────┘          │
├─────────────────────────────────────┤
│  🏠          ✓          👥          │  ← 3-tab BottomNav
└─────────────────────────────────────┘
```

---

## 2. Component Specs

### Bubbles
- **Tia:** `bg-surface-1 border border-border-2 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[82%]`
- **User:** `bg-gold/10 border border-gold/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%] ml-auto`
- **Loading:** Tia bubble with 3 dots `animate-pulse`, staggered 150ms

### Task Cards (inside Tia bubble)
- `bg-surface-2 rounded-xl p-3` — priority dot + title + metadata (due · priority · owner)
- Save button: gold, full width
- After save: `✅ Saved — View in Tasks →` gold link

### Input Bar
- `fixed bottom-[72px]` — sits above BottomNav
- Textarea: auto-resize, max 4 lines, placeholder "Message Tia..."
- Mic: `w-10 h-10 rounded-full` — idle neutral, recording gold+pulse, transcribing spinner+timer
- Send: `w-10 h-10 rounded-full bg-gold` — disabled when empty or loading

---

## 3. States
| State | Mic | Field | Send |
|-------|-----|-------|------|
| Idle | 🎤 neutral | Enabled | Disabled |
| Recording | 🎤 gold pulse + `0:12` | `Recording... 0:12` | Disabled |
| Transcribing | ⏳ spinner | `Transcribing...` | Disabled |
| Loading reply | — | Disabled | Disabled |
| Error | — | Enabled | Per content |

---

## 4. Edge Cases
| Scenario | Behaviour |
|----------|-----------|
| Mic denied | Silent fail; typing still works |
| API error | Tia bubble: "Something went wrong — please try again." |
| No tasks in message | Tia replies conversationally; no cards |
| Page refresh | Conversation resets to seed greeting |
