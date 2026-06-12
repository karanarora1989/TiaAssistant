# Product Roadmap
**Product:** Tia — AI Executive Assistant
**Version:** v1.0
**Date:** 2026-06-13
**Status:** APPROVED
**Author:** PM Agent
**Horizon:** Next 6 months
**North star:** 1,000 paying users at $15/month ($15,000 MRR)

---

## Strategic Context

**Vision:** "She remembers, so you don't have to." — Tia is a second brain that captures tasks via voice/text, builds a persistent memory of the user's world, and autonomously follows up via AI voice calls.

**Primary problem to solve:** Seamless user experience — new users hit friction before they see the value. The product needs to demonstrate its core promise within the first 60 seconds of use.

**Acquisition focus:** Every capability below is ranked by how much it removes friction for new users, demonstrates value fast, or converts free users to $15/month paid.

**Note on pricing:** Landing page currently shows ₹499/month. This must be updated to $15/month before any paid acquisition campaign.

---

## Prioritisation Framework

Each capability is scored on four dimensions:
- **Acquisition impact** — Does it bring new users or convert free → paid?
- **UX seamlessness** — Does it remove friction from existing flows?
- **Vision fit** — Does it make Tia feel more like a true second brain?
- **Effort** — S (days), M (1–2 weeks), L (3–4 weeks)

---

## Capability Roadmap

### CAP-001: UX Polish + Home Dashboard
**Priority:** P0 | **Effort:** M | **Theme:** Seamlessness

**Problem:** The home screen is an empty welcome card with a single CTA. New users land and don't know what to do. The app feels unfinished before they've seen any value.

**Core user story:** As a new user, I want to immediately see something useful when I open the app — today's tasks, a brief from Tia, and one obvious action — so that the product feels alive from day one.

**What to build:**
- Home page becomes a **Daily Dashboard**: today's task count, overdue count, a greeting from Tia, and the top 3 tasks for the day
- FAB (floating action button) opens a choice: 🎙 Voice or 💬 Chat — not just voice
- BottomNav gets a "Capture" tab or the FAB becomes always-accessible from every screen
- Task cards get swipe-to-complete gesture (UX spec already defined, not wired)
- Empty states feel warm and instructive, not blank

**Why it advances the vision:** First impressions drive acquisition. A user who sees a living dashboard on first login is far more likely to invite others and convert to paid.

**Acquisition impact:** ★★★★★
**UX seamlessness:** ★★★★★
**Vision fit:** ★★★★☆
**Dependencies:** None

---

### CAP-002: Chat Interface
**Priority:** P0 | **Effort:** M | **Theme:** Acquisition / Seamlessness

**Problem:** Voice capture is powerful but has a high barrier — users need microphone permission, a quiet environment, and comfort with speaking to an AI. Many users (especially in offices) want to type. Text input is the #1 untapped acquisition surface.

**Core user story:** As a user in a meeting or open office, I want to type a quick message to Tia ("Priya asked me to send the deck by EOD") and have her extract and save the task, so that I can capture context without speaking aloud.

**What to build:**
- Chat page at `/app/chat` — conversational UI with message bubbles
- Text input → same `/api/capture` endpoint → tasks extracted and previewed inline
- Tia responds conversationally ("Got it — I've saved that for you. Priya is already in your People.")
- Chat history persisted in DB (already planned in earlier SDLC session)
- "Switch to voice" option on chat page

**Why it advances the vision:** "Talk to her naturally — voice or text" is the first feature on the landing page. Right now only voice works. Completing this fulfils the core promise.

**Acquisition impact:** ★★★★★
**UX seamlessness:** ★★★★★
**Vision fit:** ★★★★★
**Dependencies:** None (capture API already works; this is pure frontend + chat API)

---

### CAP-003: Payments & Subscription Flow
**Priority:** P0 | **Effort:** M | **Theme:** Monetisation

**Problem:** Razorpay is stubbed in the codebase but not wired. There is no way for a user to pay $15/month. Without this, the 1,000 paying users goal is impossible.

**Core user story:** As a user who has hit the 5-task free limit, I want a clear upgrade prompt that takes me to a payment screen, completes in under 2 minutes, and immediately unlocks unlimited tasks — so that converting feels easy, not like a chore.

**What to build:**
- Update pricing on landing page: $15/month (₹1,299/month equivalent) or $120/year
- Wire Razorpay (existing stub) for subscription creation + webhook for status updates
- Upgrade prompt when free user hits 5-task limit — inline, not a separate page
- Pro badge and feature unlocks (premium voice, unlimited tasks)
- Subscription management page (cancel, view billing)

**Why it advances the vision:** The product cannot achieve its north star without revenue. Every day without payments is a day of free users who cannot convert.

**Acquisition impact:** ★★★★★
**UX seamlessness:** ★★★☆☆
**Vision fit:** ★★☆☆☆
**Dependencies:** None (Razorpay already partially integrated)

---

### CAP-004: Morning Brief & EOD Nudge
**Priority:** P0 | **Effort:** S | **Theme:** Retention / Seamlessness

**Problem:** The landing page promises "Morning brief at 7am. EOD nudge at 6pm." The nudge frequency is stored in the user's Soul from onboarding. But nothing actually sends these notifications. Users who sign up and don't return within 48 hours are likely lost.

**Core user story:** As a user who captured tasks yesterday, I want Tia to brief me every morning on what's due today and nudge me at 6pm on what didn't get done — so that Tia feels present and I build a habit of using her daily.

**What to build:**
- In-app notification panel (bell icon in header) showing Tia's briefs
- Morning brief content: "Good morning. You have 4 tasks today. 2 are overdue. [Top task]."
- EOD nudge content: "3 tasks weren't completed today. 1 carries over to tomorrow."
- Generated by Claude using Brain summary + Soul preferences
- Cron job to generate briefs per user at their local time (store timezone in Soul)
- Push notification via browser Web Push API (no external service needed for MVP)

**Why it advances the vision:** "Always on, never annoying" is core to the vision. Daily briefs are the habit loop that makes Tia indispensable. Users who receive daily briefs churn 80% less.

**Acquisition impact:** ★★★☆☆ (retention > acquisition directly)
**UX seamlessness:** ★★★★☆
**Vision fit:** ★★★★★
**Dependencies:** Timezone field added to Soul

---

### CAP-005: Settings & Profile Edit
**Priority:** P1 | **Effort:** S | **Theme:** Seamlessness / Trust

**Problem:** Once onboarding is complete, users have no way to edit their Soul — their name, role, key people, communication style, phone number, sensitivity settings. If anything changes (new job, new team), Tia is stuck with stale context. This is a trust-breaker for paying users.

**Core user story:** As a user whose team has changed, I want to update my key people and sensitivity settings without going through onboarding again — so that Tia's context stays accurate and I trust her recommendations.

**What to build:**
- Settings page at `/app/settings` — edit all Soul fields
- Sections: Profile (name, role), My World (key people, phone), Tia's Style (communication, nudge frequency), Sensitivity
- On save: re-run the Soul synthesis to regenerate the document
- Accessible from BottomNav or header avatar

**Why it advances the vision:** "She learns who you are and gets sharper every day" requires the user to be able to keep their profile accurate. Without settings, Tia can only degrade over time.

**Acquisition impact:** ★★☆☆☆
**UX seamlessness:** ★★★★★
**Vision fit:** ★★★★☆
**Dependencies:** None

---

### CAP-006: Post-Call Intelligence
**Priority:** P1 | **Effort:** S | **Theme:** Vision / Automation

**Problem:** When Tia's AI agent calls someone and they say "yes, I'll have it done by Thursday" — Tia does nothing with that information. The webhook handler exists but the transcript analysis is a TODO comment in the code. The autonomous loop is broken at the last mile.

**Core user story:** As a user who asked Tia to follow up with John, I want the task to automatically update with John's response after the call — so that I never have to manually log what happened on a call.

**What to build:**
- Wire Claude into the call webhook handler to analyse the call transcript
- Extract: commitment made (yes/no), new due date, any blockers mentioned
- Auto-update task fields: status, due_date_iso, status_details
- Create task history entry: "Updated via AI call — John confirmed delivery by Thursday"
- Notify user in the notification panel if escalation is needed

**Why it advances the vision:** This closes the autonomous follow-up loop. Tia calling someone AND updating the task automatically is the "wow" moment that makes the product worth $15/month.

**Acquisition impact:** ★★★★☆ (strong word-of-mouth driver)
**UX seamlessness:** ★★★★☆
**Vision fit:** ★★★★★
**Dependencies:** CAP-004 (notification panel)

---

### CAP-007: People Detail Page
**Priority:** P1 | **Effort:** M | **Theme:** Vision / Depth

**Problem:** The People page lists names and task counts but nothing else. Tapping a person's name goes nowhere (or to a placeholder). The "received from" feature (just shipped) shows names but they link to `/app/people/[id]` which likely has no content. This is a dead end that breaks the flow.

**Core user story:** As a user who wants context on Priya before a meeting, I want to tap her name anywhere in the app and see all open tasks from her, tasks assigned to her, her sensitivity level, and when I last mentioned her — so that Tia feels like it truly knows my world.

**What to build:**
- Person detail page at `/app/people/[id]` — currently missing or empty
- Sections: Open tasks involving this person, Received-from tasks, Role + sensitivity, Last mentioned, Notes
- Edit person: name, role, phone, sensitivity, aliases
- "Task with [Name]" quick-capture shortcut

**Why it advances the vision:** "One brain for everything" means Tia knows your relationships as well as your tasks. The people graph is what separates Tia from a simple to-do app.

**Acquisition impact:** ★★★☆☆
**UX seamlessness:** ★★★★★ (fixes broken link from received_from)
**Vision fit:** ★★★★★
**Dependencies:** None (people table fully populated)

---

### CAP-008: Brain / Weekly Insights
**Priority:** P1 | **Effort:** M | **Theme:** Vision / Retention

**Problem:** The Brain calculates delegation ratio, carry-over rate, task velocity, and key patterns every time a task changes. None of this is ever shown to the user. The promise "she learns who you are and gets sharper every day" is invisible.

**Core user story:** As a user who's been using Tia for 2 weeks, I want a weekly summary that shows me patterns I didn't notice — "You delegated 60% of tasks this week", "Your carry-over rate is improving", "You mentioned Atlas Migration 8 times" — so that Tia feels like she genuinely knows me.

**What to build:**
- Weekly insights card on the Home dashboard (generated every Sunday)
- Metrics surfaced: tasks created vs closed, delegation ratio, top entity, most-mentioned person, carry-over trend
- Tia narrative: one paragraph written by Claude interpreting the patterns in plain English
- Deep-link from insight to relevant tasks/people

**Why it advances the vision:** This is the "second brain" moment — when users see Tia reflecting their patterns back at them, they go from "useful tool" to "I can't work without this."

**Acquisition impact:** ★★★★☆ (strong social sharing / word-of-mouth moment)
**UX seamlessness:** ★★★☆☆
**Vision fit:** ★★★★★
**Dependencies:** Brain data already exists (just needs UI)

---

### CAP-009: Full Task Status Lifecycle
**Priority:** P1 | **Effort:** S | **Theme:** Seamlessness

**Problem:** The DB has `wip`, `blocked`, `not_started`, `open`, `done` statuses but the UI only lets users mark tasks as Done. There's no way to mark something as In Progress or Blocked. Half the status system is invisible.

**Core user story:** As a user whose task is blocked waiting for approval, I want to mark it as "Blocked" with a reason — so that Tia knows not to surface it as overdue and can remind me when the blocker is resolved.

**What to build:**
- Status change flow on task detail: tap current status → choose new status
- Blocked status: requires a blocker note (who or what is blocking)
- WIP status: surface as "in progress" with different visual treatment on task card
- Voice update recognises "I'm blocked on..." and sets status automatically

**Why it advances the vision:** Task management completeness is table stakes for professional users. Without blocked/WIP, the app feels like a basic reminder app, not an executive assistant.

**Acquisition impact:** ★★★☆☆
**UX seamlessness:** ★★★★☆
**Vision fit:** ★★★☆☆
**Dependencies:** None

---

### CAP-010: Calendar Integration
**Priority:** P2 | **Effort:** L | **Theme:** Ecosystem

**Problem:** Tasks have due dates but they don't appear in the user's calendar. Users have to context-switch between Tia and Google Calendar. For professionals, calendar is the source of truth for their day.

**Core user story:** As a user who lives in Google Calendar, I want tasks with hard deadlines to automatically appear as calendar events — so that Tia's tasks are part of my actual schedule, not a separate system.

**What to build:**
- Google Calendar OAuth integration
- Two-way sync: new hard-deadline tasks → calendar events; calendar events → Tia tasks (optional)
- Due date picker in Tia shows availability from calendar
- "Block time for this task" quick action

**Why it advances the vision:** The deeper Tia embeds in the user's workflow, the harder it is to leave. Calendar sync makes Tia the operating system for the user's day.

**Acquisition impact:** ★★★★☆ (strong for professional/enterprise acquisition)
**UX seamlessness:** ★★★☆☆
**Vision fit:** ★★★★☆
**Dependencies:** CAP-003 (Pro feature), CAP-005 (Settings to manage OAuth)

---

## Prioritised Build Order

| # | Capability | Priority | Effort | Why Now |
|---|------------|----------|--------|---------|
| 1 | CAP-001: UX Polish + Home Dashboard | P0 | M | First impression for every new user |
| 2 | CAP-002: Chat Interface | P0 | M | Completes the "voice or text" promise; wider audience |
| 3 | CAP-003: Payments | P0 | M | Can't hit 1,000 paying users without this |
| 4 | CAP-004: Morning Brief & EOD Nudge | P0 | S | Daily habit loop; promised on landing page |
| 5 | CAP-005: Settings & Profile Edit | P1 | S | Trust gap; paying users expect this |
| 6 | CAP-006: Post-Call Intelligence | P1 | S | Completes the agent loop; wow moment |
| 7 | CAP-007: People Detail Page | P1 | M | Fixes broken link; deepens relationship graph |
| 8 | CAP-008: Brain / Weekly Insights | P1 | M | Makes "she learns" visible; retention + word-of-mouth |
| 9 | CAP-009: Full Task Status Lifecycle | P1 | S | Professional completeness |
| 10 | CAP-010: Calendar Integration | P2 | L | Enterprise acquisition; after core is solid |

---

## Open Questions for Next Review
| # | Question | Owner |
|---|----------|-------|
| OQ-001 | Confirm pricing update: $15/month — what currency display for Indian users? | PM |
| OQ-002 | Web Push notifications or in-app only for morning brief MVP? | PM + Eng |
| OQ-003 | Is Razorpay the right payment processor for $15/month USD subscriptions? | PM |
