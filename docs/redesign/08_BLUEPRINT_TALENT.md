# 08 · Blueprint — Talent: Recruitment, Performance, Training & Skills

Screens: `/talent/recruitment`, `/talent/performance`, `/talent/training`. API: `recruitment`, `performance`, `training`.

---

## 1. Recruitment (ATS)

### 1.1 Requisitions
Table: req code, title, dept, location, openings, hiring manager, budget range (perm-gated), status (Draft/Pending approval/Open/On hold/Filled/Cancelled), age. New requisition wizard: role basics → headcount & justification (replacement: link exiting employee / new: budget) → JD editor (template library + AI draft assist via SkyNexus, plum) → approval chain (workflow engine) → on approve, "Create job posting" prompt.

### 1.2 Jobs & sourcing
Job posting editor: public description, employment type, experience band, salary range (show/hide on portal toggle), screening questions builder (knock-out rules), apply-form fields config. Channels: internal job board (ESS "Jobs" card + apply/refer), public careers link, **referrals** (ESS refer: upload CV + relationship note → referral bonus tracking chip per policy).

### 1.3 Pipeline `/talent/recruitment/jobs/[id]`
KanbanBoard: stages configurable per job (default Sourced → Screening → Interview L1 → L2 → HR round → Offer → Hired; Rejected/Withdrawn swim-collapse). Card: candidate name, current company/exp, rating stars (avg scorecard), days-in-stage (ochre >7), source chip. Bulk move w/ auto-emails (templated, preview before send). Candidate drawer: profile (parsed CV view + original PDF pane), timeline (every touch), screening answers, **scorecards**, emails thread (BCC ingestion later flag), notes (@mention), duplicate detector (same email/phone across jobs → merge tool).

### 1.4 Interviews
Scheduler: round template (panel, duration, mode, ScorecardForm criteria), panel availability hints (calendar), candidate comms (invite template + self-reschedule token page within window), conflict warnings. **Interviewer cockpit** (`/talent/recruitment/interviews` — what a MANAGER sees): my upcoming interviews (today strip), candidate pack (CV, JD, prior rounds' visible-to-me feedback per blind setting), ScorecardForm: per-criterion anchored 1–5 + verdict (Strong hire → Strong no) + notes; submit-by SLA chip (feedback overdue nudges via Inbox).

### 1.5 Offers
Offer builder: pick candidate → structure template + CTC (CtcCalculator inline; band breach → approval step ochre) → terms (joining date, location, probation, bonus/relocation) → letter merge preview → approval chain → send (tokened candidate page: view + accept/decline + counter-comment; e-sign-ready slot) → on accept: **convert wizard** (creates employee draft + onboarding runbook, doc 05 §5; carries docs over). Offer tracker table w/ expiry chips. Background-verification checklist tab (statuses per check, vendor fields, doc 09 ties).

### 1.6 Recruitment analytics (tab)
Funnel chart per job/dept (conversion %, drop-off), time-to-fill / time-in-stage, source effectiveness, offer-acceptance rate, interviewer load board. Export.

Permissions: `recruitment.read|create|update|approve|configure`; interviewers see only their assigned candidates' packs (interviewer scope, existing 403 boundary kept); salary fields perm-gated within ATS.

## 2. Performance

### 2.1 Cycles admin (`performance.configure`)
Cycle list (FY-H1/H2/Annual; status Draft→Goal setting→Check-ins→Review→Calibration→Published→Closed). Cycle wizard: period & population (dept/grade filters → live count) → template (sections: KRA table w/ weights validating to 100%, competencies set, values; rating scale config 1–5 anchors) → workflow (self → manager → reviewer → HR complete; 360 on/off; calibration on/off) → timeline (stage deadlines → auto Inbox tasks + reminders) → launch (preview-as-employee first).

### 2.2 Goals (`/talent/performance/goals`)
GoalTree: company → dept → my goals cascade (alignment links); goal card: title, KPI metric, target/current (progress bar), weight, due, check-in dots. ESS: add/edit in goal-setting window (manager approve); quarterly check-in drawer (progress %, status chip On track/At risk/Off track, comment). Manager: team goal board, nudge buttons.

### 2.3 Review rooms
- **Self review:** section-by-section form (autosave, evidence attachments, char guidance), submit locks.
- **Manager review:** side-by-side panes (self text left, my rating right per item), per-KRA rating + comment, overall suggestion (system-computed weighted score shown faint — manager can override w/ note), strengths/areas blocks, **suggested actions** (existing HR hooks: increment %, promotion flag, PIP flag, training recs feeding doc 08 §3).
- **360 feedback:** nomination flow (employee proposes peers → manager approves set), short anonymous-to-peer form, aggregated view (themes, blind below n<3).
- **HR completion:** queue of finished reviews → validate, normalize letters trigger.

### 2.4 Calibration (`performance.approve`)
NineBox: drag people across performance × potential grid (keyboard alternative: select + assign-cell menu); guardrails (forced-distribution targets as ochre meters, not hard blocks unless configured); session log (who moved whom, why — required note); finalize → ratings locked → letters batch (increment/promotion via doc 05 §7 engine).

### 2.5 Outcomes & ESS view
My review page: published rating + manager summary, growth plan items (become Inbox tasks), historical ratings sparkline on 360 Performance tab. PIP module: plan template (goals, checkpoints, mentor), confidential flag, outcome record.

## 3. Training & Skills

### 3.1 Catalog & sessions
Program cards (category, mode online/classroom, duration, skills granted, cost-center). Session scheduler: date/venue/trainer (internal employee picker or external vendor), capacity, registration window. **Nominations:** manager nominates (Inbox approve per `training.approve`), self-enroll if open seat policy; waitlist auto-promote.
ESS **My learning:** enrolled (upcoming w/ calendar add), in-progress, completed (certificate download), feedback-due chips.

### 3.2 Delivery & results
Attendance marking sheet (trainer view: roster checklist), assessment results entry (score/pass), feedback form (rating + comments → program score), completion → records on 360 Training tab + skill grants.

### 3.3 Certifications
Register: person, certification, issuer, obtained, **expiry** (ochre <60d, brick lapsed → auto reminder rule), proof file, renewal task generation.

### 3.4 Skill matrix
- **Designation skill maps** (`training.configure`): required skills + target level per designation.
- **Matrix view:** people × skills heat grid (level 0–4 painted tones), gap lens (vs designation map → gap chips), filter by dept/skill; "Plan training" bulk action → creates nominations for gap group.
- ESS self-assessment (manager validates → level confirmed).

### 3.5 Training analytics
Hours per employee/dept, completion %, feedback scores by program/trainer, cost per head, skill-gap closure trend, certification compliance % (audits).

---

### States & rules
- Every window/deadline (goal setting, review due, registration close) = ochre banner + Inbox task + reminder rule.
- Blind rules enforced server-side (peer anonymity, interviewer blind-feedback setting).
- Calibration & scorecards autosave drafts; submit = lock w/ unlock by `performance.approve` + reason.
- Recruitment candidate PII (CV contact) masked for panel until L1 pass if "blind screening" toggled.
