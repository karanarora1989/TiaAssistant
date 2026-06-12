# Product Requirements Document
**Feature:** Bug Fix + UX Polish Sprint v1
**Version:** v1.1
**Date:** 2026-06-13
**Status:** APPROVED
**Author:** PM Agent
**Approved by:** Product Manager

## Changelog
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | 2026-06-04 | Received From feature | PM Agent |
| v1.1 | 2026-06-13 | Bug fixes: task visibility, mobile import, nav feedback | PM Agent |

---

## 1. Executive Summary
Three user-reported issues are breaking core flows: captured tasks are invisible by default, mobile contact import fails silently, and UI interactions give no feedback. This sprint fixes all three with confirmed root causes and no scope ambiguity.

---

## 2. Problem Statements

**Problem A — Tasks not visible after capture:**
Users capture tasks via voice/text and confirm them, but the task list shows empty. The app navigates to the "today" view, but most captured tasks are assigned tomorrow's date by the AI. Users think the capture failed.

**Problem B — Mobile import broken:**
Users on mobile who tap "Import from Contacts" receive a generic error with no guidance. The Contacts API fails silently on unsupported browsers and denied permissions. Users abandon the People setup entirely.

**Problem C — UI interactions feel broken:**
Tapping the People tab, Home tab, or FAB produces no visible response for 1–3 seconds on slow connections. Users tap multiple times, unsure if it worked. The app feels unresponsive and low-quality.

---

## 3. User Personas
All bugs affect the same persona: any Tia user on a mobile device.

---

## 4. User Stories

| # | User Story | Priority | Acceptance Criteria |
|---|------------|----------|---------------------|
| US-001 | As a user who just captured tasks, I want to see them immediately after confirming, so I know the capture worked | P0 | - [ ] After confirming capture, app navigates to a view where all just-captured tasks are visible<br>- [ ] Tasks with no specific urgency default to today's date, not tomorrow's |
| US-002 | As a mobile user, I want clear feedback when contact import fails, so I know what to do next | P0 | - [ ] When Contacts API fails for any reason, a specific error message is shown<br>- [ ] The manual entry mode is automatically activated on failure<br>- [ ] User is never left on a broken screen with no next action |
| US-003 | As a user tapping any navigation element, I want immediate visual feedback that my tap registered, so the app feels responsive | P0 | - [ ] Tapping a BottomNav tab shows instant visual press state (< 50ms)<br>- [ ] A progress indicator appears within 100ms of any navigation action<br>- [ ] The correct tab is highlighted as soon as the destination page loads |

---

## 5. Functional Requirements

### Must Have (P0)
- FR-001: Newly captured tasks are visible to the user immediately after confirmation without requiring any tab switching
- FR-002: AI defaults task due date to **today** (not tomorrow) when no urgency is specified — urgent/ASAP tasks also today
- FR-003: After capture confirmation, app navigates to the upcoming view (next 5 days) ensuring all new tasks are always visible
- FR-004: Tasks page reads the `?view=` URL parameter on load so deep-linked views (e.g. `?view=upcoming`) work correctly
- FR-005: Contact import on mobile shows a specific, actionable error message for: unsupported browser, permission denied, and generic failure
- FR-006: On any contact import failure (except user-cancelled), the UI automatically switches to manual name entry mode
- FR-007: BottomNav buttons show an immediate press state (scale/opacity change) on tap
- FR-008: A thin progress bar appears at the top of the screen during any page navigation and disappears when the page loads
- FR-009: The active BottomNav tab is always derived from the current URL — never from local state

---

## 6. Non-Functional Requirements
- **Performance:** NavProgress bar must appear within 100ms of tap — pure CSS, no API calls
- **Accessibility:** NavProgress bar does not obscure content; respects `prefers-reduced-motion`
- **No regressions:** All existing task, people, and capture flows must continue to work

---

## 7. Out of Scope
- Redesigning the task list or capture flow beyond the navigation fix
- Adding full contact sync or CSV import
- General performance optimisation beyond these three issues

---

## 8. Success Metrics
| Metric | Target |
|--------|--------|
| Users who see their tasks immediately after capture | 100% |
| Mobile import error rate (users stuck with no action) | 0% |
| User-reported "app feels unresponsive" complaints | Eliminated |
