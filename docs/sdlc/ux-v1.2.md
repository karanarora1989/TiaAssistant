# UX Design Document
**Feature:** Chat Interface — CAP-002
**Version:** v1.2
**Date:** 2026-06-16
**Status:** APPROVED
**Approved by:** Designer
**References:** PRD v1.2 | Roadmap CAP-002

---

## 1. Design Principles
- **Conversational feel:** Message bubbles, not forms. Tia is a person you talk to.
- **Capture without friction:** One message in, task saved. No redirect, no confirm screen.
- **Voice parity:** Mic button on the input bar so voice users aren't forced to type.

---

## 2. Screen: Chat Page (`/app/chat`)

### Layout
```
┌─────────────────────────────────────┐
│  Chat with Tia              [TopBar] │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────┐       │
│  │ 👋 Hi! What's on your   │ ← Tia │
│  │ plate today — type or    │       │
│  │ speak.                   │       │
│  └──────────────────────────┘       │
│                                     │
│       ┌──────────────────────────┐  │
│       │ Priya asked me to send   │ ←│ User
│       │ the Q2 deck by EOD       │  │
│       └──────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Got it! Found 1 task:        │ ← │ Tia
│  │                              │   │
│  │  ┌────────────────────────┐  │   │
│  │  │ 📋 Send Q2 deck        │  │   │
│  │  │ From: Priya            │  │   │
│  │  │ Due: Today  • High     │  │   │
│  │  └────────────────────────┘  │   │
│  │  [Save 1 task]               │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────┐       │
│  │ ✅ Saved! View in Tasks  │ ← Tia │
│  └──────────────────────────┘       │
│                                     │
├─────────────────────────────────────┤
│  ┌──────────────────────┐ [🎤] [→]  │
│  │ Type a message...    │           │
│  └──────────────────────┘           │
├─────────────────────────────────────┤
│  🏠   ✓   👥   💬              ← Nav│
└─────────────────────────────────────┘
```

---

## 3. Component Specs

### 3.1 TopBar
- Title: "Chat with Tia"
- No right action
- Uses existing `TopBar` component from `shared.tsx`
- No back button (chat is a top-level tab, not a drill-down)

### 3.2 Message Bubbles

**Tia bubbles (left-aligned):**
- Background: `bg-surface-1`
- Border: `border border-border-2`
- Border radius: `rounded-2xl rounded-tl-sm` (flat top-left corner)
- Max width: `max-w-[80%]`
- Text: `text-sm text-text-primary leading-relaxed`
- Avatar: no avatar (keeps UI clean)

**User bubbles (right-aligned):**
- Background: `bg-gold/10`
- Border: `border border-gold/20`
- Border radius: `rounded-2xl rounded-tr-sm` (flat top-right corner)
- Max width: `max-w-[80%]`
- Text: `text-sm text-text-primary`
- Alignment: `ml-auto`

**Loading bubble (Tia thinking):**
- Same style as Tia bubble
- Content: three animated dots `● ● ●` pulsing with `animate-pulse`
- Appears immediately after user sends; replaced by real reply

---

### 3.3 Task Preview Cards (inside Tia bubble)

Shown below Tia's message text when `tasks.length > 0` and tasks not yet saved.

```
┌────────────────────────────────────┐
│ 📋  Send Q2 deck to Priya          │
│     Due: Today  ·  High  ·  Self   │
└────────────────────────────────────┘
```

- Background: `bg-surface-2 rounded-xl p-3`
- Title: `text-sm font-medium text-text-primary`
- Metadata row: `text-xs text-text-muted` — Due / Priority / Assigned to
- Multiple tasks: stacked vertically with `gap-2`

**Save button:**
- Below the task card(s)
- Label: "Save 1 task" or "Save N tasks"
- Style: `Button` component, `gold` variant
- On click: calls `/api/capture` → shows loading state on button → replaces cards with success message

**Success state (replaces cards + button):**
```
✅ Saved! [View in Tasks →]
```
- Text: `text-sm text-text-secondary`
- Link: `text-gold underline` → navigates to `/app/tasks?view=upcoming`

---

### 3.4 Input Bar

Fixed to bottom, above BottomNav (`bottom-[72px]` to clear nav height).

```
┌──────────────────────┐ [🎤] [→]
│ Type a message...    │
└──────────────────────┘
```

**Text field:**
- Placeholder: "Type a message..."
- Style: `bg-surface-3 border border-border-2 rounded-xl px-4 py-3 text-text-primary`
- Grows with content (`min-h`, auto-resize) up to 4 lines max
- On Enter (desktop): sends message (Shift+Enter for newline)

**Mic button:**
- Icon: 🎤 (default) / 🔴 pulsing (recording)
- Style: `w-10 h-10 rounded-full flex items-center justify-center`
- Default: `bg-surface-2 text-text-muted`
- Recording: `bg-gold/20 text-gold` with a subtle pulse animation
- Tap to start / tap to stop recording
- While transcribing: shows spinner instead of icon; input disabled

**Send button:**
- Icon: → (arrow right)
- Style: `w-10 h-10 rounded-full bg-gold flex items-center justify-center text-surface-0`
- Disabled (opacity 40%) when input is empty or loading
- Active: `text-surface-0 bg-gold`

---

## 4. Interaction States

| State | Tia bubble | Input bar | Send button |
|-------|-----------|-----------|-------------|
| Idle / seed | Greeting shown | Enabled | Disabled (empty) |
| User typed | — | Enabled | Enabled |
| Sent / waiting | Loading dots | Disabled | Disabled |
| Reply received (no tasks) | Text reply | Enabled | Disabled |
| Reply received (with tasks) | Text + task cards + Save button | Enabled | Disabled |
| Save tapped | Save button → spinner | Enabled | Disabled |
| Saved | ✅ Saved message | Enabled | Disabled |
| Recording | — | Disabled (replaced by "Recording...") | Disabled |
| Transcribing | — | Disabled (replaced by spinner) | Disabled |
| API error | "Something went wrong. Try again." bubble | Enabled | Disabled |

---

## 5. Navigation

**BottomNav Chat tab:**
- Icon: 💬
- Label: "Chat"
- Active indicator: gold dot above icon + gold label text (consistent with other tabs)
- Position: 4th tab (after People)

**From other pages:**
- All 3 pages using BottomNav wire `chat` tab to `router.push('/app/chat')`

---

## 6. Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| User sends empty message | Send button disabled; no action |
| API call fails | Tia bubble shows: "Something went wrong — tap to retry" |
| No tasks found in message | Tia replies conversationally without task cards |
| Multiple tasks in one message | All tasks shown as stacked cards; "Save N tasks" button |
| User taps Save, API fails | Button returns to "Save N tasks"; error shown below button |
| Session ends (page refresh) | Conversation cleared; seed greeting shown again |
| Keyboard covers input on mobile | Input bar stays above keyboard (handled by `pb-safe` / viewport units) |
