# Product Requirements Document
**Feature:** Unified Chat + Voice Interface (CAP-001 + CAP-002)
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
| v1.2 | 2026-06-16 | Unified Chat + Voice on Home (CAP-001 + CAP-002) | PM Agent |

---

## 1. Executive Summary
The home page is a dead welcome card. Voice is buried behind a FAB. There is no text input. This sprint merges CAP-001 (UX Polish) and CAP-002 (Chat Interface) into a single unified home experience: a ChatGPT-style conversation screen where users type or speak to Tia without switching pages.

---

## 2. Problem Statement
- Home page is static — no interaction, no value on load
- Voice capture requires FAB → separate page (2 taps minimum)
- No text input exists anywhere in the app
- Two separate input modes (voice page, text) feel disconnected

---

## 3. User Stories
| # | Story | Priority |
|---|-------|----------|
| US-001 | As a user, I open the app and see a live conversation with Tia where I can type or speak immediately | P0 |
| US-002 | As a user, I tap the mic button, speak my task, and Tia extracts it without leaving the home screen | P0 |
| US-003 | As a user, I type a message and Tia responds conversationally with extracted tasks inline | P0 |
| US-004 | As a user, I tap "Save tasks" on inline task cards and they are saved in one tap | P0 |
| US-005 | As a user, I can see my conversation history on screen to know what's been captured | P0 |

---

## 4. Functional Requirements
- FR-001: Home (`/app`) shows a ChatGPT-style conversation area with Tia's seed greeting on load
- FR-002: Fixed input bar at bottom: text field (expandable, max 4 lines) + mic button + send button
- FR-003: Mic: tap to start → pulsing indicator + timer → tap to stop → transcribes → sends as message
- FR-004: Text: type → Enter or send → sends as message
- FR-005: Tia responses = left-aligned bubbles; user messages = right-aligned bubbles
- FR-006: When Tia extracts tasks, they appear as inline cards below her reply
- FR-007: "Save [N] task(s)" button → POST `/api/capture` → ✅ confirmation with Tasks link
- FR-008: Conversation history lives in React state (session-only; no DB persistence in v1.2)
- FR-009: BottomNav = 3 tabs: Home | Tasks | People (Chat tab removed)
- FR-010: `/app/chat` page removed; `/app/voice` kept but unlinked

---

## 5. Out of Scope
- Audio waveform visualisation
- Chat history DB persistence
- Cross-session memory of conversation
