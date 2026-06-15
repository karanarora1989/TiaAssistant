# Product Requirements Document
**Feature:** Chat Interface — CAP-002
**Version:** v1.2
**Date:** 2026-06-16
**Status:** APPROVED
**Author:** PM Agent
**Approved by:** Product Manager

## Changelog
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | 2026-06-04 | Received From feature | PM Agent |
| v1.1 | 2026-06-13 | Bug fixes: task visibility, mobile import, nav feedback | PM Agent |
| v1.2 | 2026-06-16 | Chat Interface (CAP-002) | PM Agent |

---

## 1. Executive Summary

Tia currently only captures tasks via voice. This shuts out users in offices, meetings, or quiet environments. Chat interface is the #1 untapped acquisition surface: users who can type "Priya asked me to send the deck by EOD" and have Tia extract and save the task instantly. This fulfils the core product promise: "voice or text, your choice."

---

## 2. Problem Statement

**Problem:** Voice capture requires microphone permission, a quiet environment, and comfort with speaking to an AI. A significant portion of target users (PMs in open offices, doctors between consultations) cannot or will not use voice as their primary capture mode. Without text input, they churn.

**Root cause:** The app has no text input path to the task capture engine. `/api/capture` already accepts text transcripts — there is no UI for it.

---

## 3. User Personas

**Primary:** PM in an open office who needs to capture a task mid-meeting without speaking aloud.
**Secondary:** Doctor between consultations who has 30 seconds to log a follow-up task.

---

## 4. User Stories

| # | User Story | Priority | Acceptance Criteria |
|---|------------|----------|---------------------|
| US-001 | As a user in a meeting, I want to type a task to Tia and have her extract and save it, so I can capture context without speaking | P0 | - [ ] Text input on chat page sends to Claude for extraction<br>- [ ] Extracted tasks appear as inline cards in chat<br>- [ ] User can confirm to save with one tap |
| US-002 | As a user who prefers speaking, I want a mic button on the chat page so I can dictate instead of type | P0 | - [ ] Mic button on chat input bar<br>- [ ] Voice transcribed and sent as user message<br>- [ ] Full voice→extract→save flow works from chat |
| US-003 | As a user, I want Tia to respond conversationally so the interaction feels natural, not like filling a form | P0 | - [ ] Tia replies with a natural-language message<br>- [ ] When tasks are found, she acknowledges them warmly<br>- [ ] When no tasks found, she responds helpfully |
| US-004 | As a user who captured tasks via chat, I want to save them with one tap so the friction is minimal | P0 | - [ ] "Save [N] task(s)" button appears below Tia's reply<br>- [ ] One tap saves all extracted tasks<br>- [ ] Saved tasks immediately appear in /app/tasks |
| US-005 | As a user, I want to access chat from the bottom nav so it feels like a first-class feature | P0 | - [ ] Chat tab (💬) appears in BottomNav on all pages<br>- [ ] Tapping Chat navigates to /app/chat |

---

## 5. Functional Requirements

### Must Have (P0)
- **FR-001:** Chat page at `/app/chat` with message bubble UI (user right, Tia left)
- **FR-002:** Text input field + send button; Enter key sends on desktop
- **FR-003:** Mic button on input bar; tap to start recording, tap again to stop; transcribes and auto-sends
- **FR-004:** Every message goes to `/api/chat` which calls Claude with full conversation history + user context (Soul + Brain)
- **FR-005:** Claude returns a JSON object: `{message, tasks[]}` — tasks populated only when user mentions actionable work items
- **FR-006:** When `tasks.length > 0`, show inline task preview cards below Tia's message with title, assigned_to, due_date, priority
- **FR-007:** "Save [N] task(s)" button under task cards; on tap, calls `/api/capture` with the user's message as transcript
- **FR-008:** On successful save, cards replace with "✅ Saved — [link to Tasks]"
- **FR-009:** Tia sends a seed greeting on page load (no API call needed): "Hi! What's on your plate today — type or speak."
- **FR-010:** Chat tab (💬) added to BottomNav; active on `/app/chat`
- **FR-011:** Conversation history held in React state for the session (no DB persistence in v1.2)

### Nice to Have (P1 — defer to v1.3)
- Chat history persisted in DB across sessions
- "Switch to voice" shortcut on chat page
- FAB on Home page opens a Voice/Chat choice modal

---

## 6. Non-Functional Requirements
- **Latency:** Tia's reply appears within 3s on a standard connection (Claude call + context build)
- **Responsiveness:** Chat input is mobile-first; keyboard does not obscure input bar
- **Error handling:** API failure shows an inline error message in Tia's bubble; user can retry
- **No regressions:** All existing voice capture, task, and people flows unchanged

---

## 7. Out of Scope (v1.2)
- DB persistence of chat history
- FAB choice modal (Voice vs Chat) — deferred to CAP-001
- Tia initiating conversation (push notifications, morning brief)
- Multi-session memory of chat content

---

## 8. Success Metrics
| Metric | Target |
|--------|--------|
| Chat tasks captured per DAU | ≥ 1 task/day/active user |
| Chat→save conversion rate | ≥ 60% (user sees task card and taps Save) |
| Voice capture sessions drop-off after chat launch | < 20% (chat supplements, doesn't replace) |
