# High-Level Design Document
**Feature:** Chat Interface — CAP-002
**Version:** v1.2
**Date:** 2026-06-16
**Status:** APPROVED
**Approved by:** Software Engineer
**References:** PRD v1.2 | UX v1.2

---

## 1. Overview

Chat interface adds a conversational entry point for task capture. The core task extraction engine (`/api/capture`) is unchanged — chat adds a new API route (`/api/chat`) for the conversational layer, and a new page (`/app/app/chat/page.tsx`) for the UI.

No DB schema changes. No new environment variables.

---

## 2. Component / File Map

| Change | Files Changed | New Files |
|--------|--------------|-----------|
| Chat tab in BottomNav | `components/tia/shared.tsx` | — |
| Chat nav wiring in pages | `app/app/page.tsx`, `app/app/tasks/page.tsx`, `app/app/people/page.tsx` | — |
| Chat API route | — | `app/api/chat/route.ts` |
| Chat UI page | — | `app/app/chat/page.tsx` |

---

## 3. Architecture

### Data Flow

```
User types/speaks
      ↓
[Chat Page — client]
      ↓
POST /api/chat
  { messages: [{role, content}] }
      ↓
buildContext(userId)          ← lib/context.ts
callClaude(systemPrompt, messages)   ← lib/claude.ts
parseClaudeJSON()             ← lib/claude.ts
      ↓
Return { reply, tasks[] }
      ↓
[Chat Page renders reply + task cards]
      ↓ (user taps Save)
POST /api/capture
  { transcript: userMessage, captureMethod: 'text' }
      ↓
Tasks inserted → Brain updated → Agent scheduled
      ↓
✅ Saved
```

---

## 4. API Design

### `POST /api/chat`

**Request:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    reply: string,           // Tia's conversational response
    tasks: Array<{           // empty array if no tasks detected
      title: string;
      context: string;
      received_from: string | null;
      assigned_to: string;
      participants: string[];
      due_date: string;
      due_date_iso: string;
      due_time: string | null;
      time_sensitivity: 'hard' | 'soft' | 'flexible';
      task_domain: 'work' | 'personal';
      entity_type: string | null;
      entity_name: string | null;
      priority: 'high' | 'medium' | 'low';
    }>
  }
}
```

**System prompt behaviour:**
- Loads Soul + Brain context via `buildContext(userId)` (same as all other routes)
- Claude responds in JSON: `{ message: string, tasks: [] }`
- Temperature: 0.7 (conversational)
- Max tokens: 2000

**Reused utilities:**
- `getAuthUserId()` — lib/auth
- `enforceRateLimit()` — lib/rate-limit
- `buildContext()` — lib/context
- `callClaude()` — lib/claude
- `parseClaudeJSON()` — lib/claude
- `successResponse()` / `errorResponse()` — lib/api-handler

**Task saving:**
- Chat page does NOT save tasks — it only extracts them for preview
- User confirms → chat page POSTs to existing `/api/capture` with the user's raw message as `transcript` and `captureMethod: 'text'`
- This reuses all existing logic: task insert, brain update, people upsert, agent scheduling

---

## 5. Frontend Design

### State shape (`app/app/chat/page.tsx`)

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: ExtractedTask[];   // only on assistant messages
  tasksSaved?: boolean;       // true after user confirms save
  userMessageForSave?: string; // the user message that triggered this extraction
}

const [messages, setMessages] = useState<ChatMessage[]>([seedMessage]);
const [inputText, setInputText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [isRecording, setIsRecording] = useState(false);
const [isTranscribing, setIsTranscribing] = useState(false);
```

### Voice recording
Reuses the same MediaRecorder pattern from `app/app/voice/page.tsx`:
- `navigator.mediaDevices.getUserMedia({ audio: true })`
- `MediaRecorder` with `audio/webm;codecs=opus`
- On stop: POST to `/api/transcribe` → get transcript → auto-send as user message

Simplified vs voice page: no waveform visualisation, no timer, no fallback to Web Speech (chat is secondary; if mic fails, user types).

### Auto-scroll
`useRef` on a bottom sentinel element; `useEffect` on `messages` length → `scrollIntoView({ behavior: 'smooth' })`.

### Keyboard (mobile)
Input bar positioned with `fixed bottom-[72px]` (clears BottomNav). On iOS, `window.visualViewport` or `env(keyboard-inset-height)` handles keyboard push-up naturally with the fixed positioning approach.

---

## 6. No DB / Schema Changes
- No new tables
- No migrations
- Conversation history is session-only (React state)

---

## 7. Rollback
Git revert. No DB state to unwind. The only shared change is the BottomNav Chat tab — removing it is a one-line revert.
