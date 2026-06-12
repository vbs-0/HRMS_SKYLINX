# 04 · Blueprint — Home, Inbox & Self-Service

Screens: `/home`, `/inbox`, `/calendar`, My Profile, `/people/cards`, announcements, surveys, social, rewards, SkyNexus AI. API: `dashboard`, `approvals`, `notifications`, `announcements`, `surveys`, `social`, `rewards`, `ai`, `employees` (self).

---

## 1. `/home` — My Desk (role-aware composition)

One route, server-composed widget set per persona; widgets are permission-gated cards on a 12-col grid. User can hide/reorder (persisted).

### 1.1 Employee (ESS) layout
1. **Greeting band** — serif "Good morning, Asha." + date + shift chip ("General · 09:00–18:00") + location.
2. **PunchButton hero** (left, 4 cols) — state machine: Not in → `Check in` (indigo) → working timer → `Check out`; geo/selfie per rule; offline queue note; "Working remotely today?" toggle if policy allows. Below: this week strip (5 `AttendanceDayCell`).
3. **My balances** (4 cols) — 3 `LeaveBalanceRing` (CL/SL/EL) + "Apply leave" secondary; ring tooltip = accrual math.
4. **My pay snapshot** (4 cols) — last payslip chip ("May · ₹84,230 · Paid 31 May"), YTD gross, "Tax regime: New" chip, CTAs: Payslip / My Pay & Tax. Amounts masked until hover-reveal (privacy-by-default on shared screens).
5. **Pending on me** — my requests' statuses (leave/claims/regularization with ApprovalTrail popovers).
6. **Today around me** — team on leave today, upcoming holidays (next 2), celebrations (CelebrationCard: birthdays/anniversaries with "Send wishes" → Social post).
7. **Announcements** (latest 3, pinned first) + **Surveys due** chip + **Policies to acknowledge** (gold banner if pending — blocks nothing but persists).
8. **Quick links** — ID card, Helpdesk, Refer a candidate, Org chart.

### 1.2 Manager adds
- **Inbox preview** (top-right, count chip): first 5 approvals with inline Approve/Reject (A/R keys), "Open Inbox →".
- **Team today** — present/absent/leave/WFH counts + names popover; late arrivals list (anomaly feed).
- **Team leave calendar** (2-week mini) with coverage-conflict gold marks.
- **My team's pending reviews / goals due** (cycle-aware).

### 1.3 HR Admin / Owner adds (HR Cockpit)
- **Org pulse KpiRow:** Headcount (with joiners/exits delta) · Attendance today % · On leave · Open positions · Attrition (12-mo rolling) · Payroll cost (last run).
- **Payroll countdown card** — "June run: 6 days to cutoff" + gates checklist mini (Stepper) → run room.
- **Compliance next-dues** — PF 15 Jul · ESI 15 Jul · TDS 7 Jul · PT 21 Jul as ChallanCards with gold/brick urgency.
- **Lifecycle strips** — Onboarding in progress (n) / Exits in progress (n) / Probation ending this month (n) → boards.
- **Anomaly digest** — yesterday's attendance anomalies, pending regularizations aging >3d.
- **Hiring funnel mini** + offers awaiting acceptance.

## 2. `/inbox` — unified approvals & tasks (replaces `/approvals`)

**Layout:** left filter rail (All · Leave · Attendance · Expenses · Travel · Loans · Payroll · Recruitment offers · Training · Documents · Separations; each with count) · center list · right detail pane (≥xl) or Drawer.

- **List row:** requester Avatar+name, type glyph, one-line summary ("EL · 3 days · 14–16 Jul"), amount if money (₹ mono), age chip (gold >3d, brick >7d), SLA dot.
- **Detail pane:** full request, context block (balances for leave; cap/spend for claims; roster impact for shift), policy verdicts (sandwich/blackout checks shown as chips with pass/fail), attachments viewer, ApprovalTrail (who's before/after me), CommentThread (request clarification → notifies requester), actions: Approve (indigo) / Reject (requires reason) / Forward (delegate w/ note).
- **Bulk:** select-all-in-filter; bulk approve previews list + total amount; per-item failures reported in result toast + list.
- **Tasks tab:** non-approval to-dos assigned to me (onboarding items, clearance items, proof verification batches, survey to take).
- **Empty:** "Inbox zero. Nothing waiting on you." with subtle confetti-free sage check.
- Keyboard: j/k navigate, a/r act, u undo within 8s (server-side soft window where workflow allows).

## 3. `/calendar`

Tabs Me | Team (managers) | Company. Sources toggled in legend: Leave (sage), Holidays (indigo outline), Interviews (slate), Reviews (plum), Payroll milestones (gold), Training (slate), Birthdays (neutral). Month/week views; day peek lists events with deep links; "Add" respects permissions (e.g., HR adds holiday). ICS subscribe per user (read-only feed token).

## 4. My Profile (`/people/[me]` — same 360 as doc 05 §3 with self-permissions)

ESS editable directly: photo, contact, address, emergency contacts, family/dependents (drives insurance), bank (with penny-test status chip if enabled), education/experience, skills self-tag. Edits to **guarded fields** (name, DOB, PAN, Aadhaar, UAN, bank) route through "Request change" → HR approval (Inbox), with document proof upload; pending chip shows on field. Profile completeness ProgressRing with missing-item checklist deep links.

## 5. `/people/cards` — ID & visiting card studio (existing `cards` route, reskinned)

Template gallery (org-controlled themes; Painted Paper default), live preview front/back with employee data merge fields, photo crop tool, batch generate by department (HR), print sheet layout (A4 8-up) + single PDF, QR (vCard) toggle. Permissions: self can view/download own; `employees.configure` manages templates.

## 6. Announcements (`/work/announcements`)

- **Reader:** card feed, pinned first (indigo corner stamp), category chips (General/Policy/Event/Urgent-brick), read receipts ("Seen by 142/220" for HR), reactions optional.
- **Composer (HR):** rich text (headings, lists, image), audience picker (company/location/department/custom set with live count), schedule, pin until date, require-acknowledgment toggle (turns it into tracked task in recipients' Inbox).

## 7. Surveys (`/talent/surveys` for admin; fill-in via Inbox/`/s/[token]`)

- **Admin list:** surveys with status (Draft/Live/Closed), response rate bar, anonymity badge.
- **Builder:** question types (rating 1–5, eNPS 0–10, single/multi choice, text), sections, anonymity setting (locked after launch), audience + schedule + reminders (auto-nudge non-responders), preview-as-employee.
- **Results:** response rate, eNPS gauge (detractor/passive/promoter painted bands), per-question charts, text answers list (anonymized), segment cuts (dept/location/tenure) hidden below n<5 to protect anonymity, export.
- **Fill UX:** one section per screen, progress bar, autosave, "Your responses are anonymous" plum banner when true.

## 8. SkyNexus Social (`/work/social`)

Feed (company/department channels): post composer (text, image, poll, kudos), like/comment (CommentThread), kudos posts render as RewardLedger-linked RecognitionCards, celebrations auto-posts (opt-out per user), moderation tools for HR (remove + reason, audit-logged), report-post flow. Quiet design: no infinite autoplay, batch "new posts" pill.

## 9. Rewards (`/work/rewards`)

- **My wallet:** points balance (serif num-xl), earn history (RewardLedgerRow: source, points, date), redemption catalog (vouchers grid with brand, denomination, points), redeem flow → voucher code reveal + email.
- **Give recognition** (managers/peers per policy): pick person → badge value (Teamwork/Innovation/etc.) → points within monthly budget → optional public post.
- **HR console tab:** budgets per manager, catalog manage, ledger export, anti-abuse caps.

## 10. SkyNexus AI (global drawer, plum)

Invoked from topbar sparkle, palette fallback, or context "Ask AI" buttons. Drawer chat: answers grounded in policies/holidays/leave balance/payslip metadata (existing `ai` module), every answer cites source chip ("Leave Policy v3 §4") deep-linking to the policy reader; suggested prompts contextual to current page ("Why was my June TDS higher?" on payslip). Action proposals render as confirm cards (e.g., drafts a leave application → user reviews → Apply). HR analytics queries gated by user's own permissions; AI never reveals data the session can't read (server-enforced). Conversation history per user; "AI can make mistakes — verify statutory figures" footer on payroll/tax answers.

## 11. Notifications center (`/notifications` → bell drawer + `/admin/settings/notifications` prefs)

Covered in doc 02 §6; reminders module surfaces as "Reminders" tab here for HR: birthday/anniversary/probation-end/doc-expiry/contract-renewal reminder rules (event, lead days, audience, channel).

---

### States & a11y specifics for this blueprint
- Punch hero announces state changes via `aria-live`; geo-denied state offers reason + regularization path.
- Inbox approve/reject optimistic with rollback toast on failure.
- All home widgets ship skeletons; widget errors isolate (card-level ErrorState, never page crash).
- Survey fill fully keyboard/screen-reader navigable; rating groups as radiogroup with labels.
