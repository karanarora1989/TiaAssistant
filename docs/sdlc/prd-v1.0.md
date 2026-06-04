# Product Requirements Document
**Feature:** Received From — Task Delegation Source
**Version:** v1.0
**Date:** 2026-06-04
**Status:** APPROVED
**Author:** PM Agent
**Approved by:** Product Manager

## Changelog
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | 2026-06-04 | Initial PRD | PM Agent |

---

## 1. Executive Summary
Tasks in Tia are sometimes self-initiated and sometimes delegated by another person. Currently, there is no way for users to see — at a glance — who gave them a task. This feature adds a "Received From" field to every task: a single person who delegated the task to the user. The field is extracted automatically by AI during voice and text capture, and can also be set or edited manually. It is informational only and links to the People tab when the person exists there.

---

## 2. Problem Statement
**Current state:** When a user captures a task like "Priya asked me to send the quarterly report by Friday," Tia creates the task but there is no structured way to record that Priya was the source of this task. The context lives only in the transcript field.

**Pain point:** The user loses track of accountability context. They can't quickly see which tasks are self-initiated vs. delegated, and can't remember who to report back to when a task is done.

**Desired state:** Every task can optionally have a "Received From" person. The AI infers this from natural language automatically. The user can also set or edit it manually. The field is displayed on the task card and task detail, and links to the person's profile in the People tab.

---

## 3. User Personas

### Primary User: Individual Contributor / Manager
- **Context:** Uses Tia to capture tasks from meetings, calls, Slack, and in-person conversations
- **Technical level:** Non-technical
- **Key need:** When capturing "Priya asked me to do X," wants Tia to automatically understand that Priya is the source, not an assignee, and show that context on the task

---

## 4. User Stories

| # | User Story | Priority | Acceptance Criteria |
|---|------------|----------|---------------------|
| US-001 | As a user, I want Tia to automatically extract who gave me a task during voice or text capture, so that I don't have to set it manually every time | Must Have (P0) | - [ ] When user says "John asked me to send the report," "Received From" is set to "John" after capture<br>- [ ] When user says "I need to call the doctor," "Received From" is empty (self-initiated)<br>- [ ] Extraction works for both voice and text/chat capture |
| US-002 | As a user, I want to manually set or edit the "Received From" person on a task, so that I can correct AI errors or add it when not captured automatically | Must Have (P0) | - [ ] Task detail page has an editable "Received From" field<br>- [ ] Tapping the field lets me search People or type a new name<br>- [ ] Saving updates the task immediately |
| US-003 | As a user, I want to see who gave me a task directly on the task card and task detail, so that I have the context without opening anything extra | Must Have (P0) | - [ ] Task cards show "From: [Name]" when Received From is set<br>- [ ] Task detail shows "Received From" as a labeled row<br>- [ ] Task cards with no Received From show nothing (field is hidden when empty) |
| US-004 | As a user, if the "Received From" person is already in my People tab, I want their name to link to their profile, so that I can quickly see all context about that person | Should Have (P1) | - [ ] On task detail, if the name matches a person in People, it is a tappable link<br>- [ ] Tapping navigates to `/app/people/[id]` |
| US-005 | As a user, if the "Received From" person is NOT in my People tab, I want to be prompted to add them, so that my People list stays complete | Should Have (P1) | - [ ] After capture, if Received From name is not found in People, a banner appears: "Add [Name] to your People?"<br>- [ ] Tapping "Add" creates a People entry with that name<br>- [ ] Tapping "Skip" dismisses without adding |

---

## 5. Functional Requirements

### Must Have (P0)
- FR-001: AI extraction — during capture (voice and text), if the transcript contains delegation language ("X asked me to", "X wants me to", "per X", "X told me to", "from X"), extract the delegator as `received_from`
- FR-002: `received_from` stores a single person's name (string), not an array
- FR-003: Task detail page allows manual set/edit of `received_from` via a people-picker or free text
- FR-004: Task card shows "From: [Name]" when `received_from` is set; hides the field when empty
- FR-005: `received_from` is distinct from `assigned_to` (owner) — a task can have both

### Should Have (P1)
- FR-006: On task detail, `received_from` name links to People profile if a match exists
- FR-007: After capture, if `received_from` is set and name not found in People, show an "Add to People?" banner
- FR-008: People-picker in the manual edit flow searches existing People by name

---

## 6. Non-Functional Requirements
- **Performance:** Received From extraction adds no perceptible latency to capture (it is part of the existing Claude extraction call)
- **Accuracy:** Target: AI correctly identifies Received From in 100% of tasks where delegation language is present
- **Accessibility:** All new UI elements meet existing app standards
- **Devices:** Mobile-first (same as rest of app)

---

## 7. Out of Scope
- Received From as an array (multiple delegators) — deferred to future version
- Tia following up with the "Received From" person on behalf of the user — deferred
- "Received From" driving notifications or agent behavior — deferred
- Filtering tasks by "Received From" in the task list — deferred

---

## 8. Success Metrics
| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| AI correctly identifies "Received From" when delegation language is present | 0% (field not shown) | 100% | Manual QA: test 10 representative voice/text inputs with delegation language |
| Tasks with "Received From" set are correctly displayed on card and detail | 0% | 100% | QA regression test |

---

## 9. Dependencies
- People table exists and is populated (already the case)
- Existing `/api/capture` route handles task creation (already the case)
- Task detail page exists at `/app/tasks/[id]` (already the case)

---

## 10. Open Questions
| # | Question | Owner | Status |
|---|----------|-------|--------|
| Q-001 | Should `received_from` replace `assigned_from` in the schema, or are they separate concepts? | PM + SE | Resolved: use `received_from` as a single string (simplify from current array to string); `assigned_from` is legacy — map to same field |

---

## 11. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI misidentifies participants as "received from" | Medium | Medium | Specific prompt instructions to distinguish delegation from participation |
| Schema change breaks existing data | Low | High | Migration safely converts existing `received_from[]` array to string (take first element) |
