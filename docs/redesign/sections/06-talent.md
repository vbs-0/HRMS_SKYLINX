# §06 — Talent: Performance, Recruitment, Training/Skills, Travel, Rewards

> Inventory: `inventory/talent.md`. Primitives: §02 (KanbanBoard, ScorecardForm, NineBox, GoalTree, CtcCalculator). Reference forms: `blueprint.md` §5.2 (job vacancy, interview scheduler). Permissions/seed gaps: `inventory/rbac-settings.md` A3–A5.
> Permissions: `performance.{read,create,approve,configure}`, `recruitment.{read,create,update,approve,configure}`, `training.{read,create,update,configure}`, `travel.{read,create,update,approve}`, `rewards.{read,create}`.
> **Seed-gap fixes owned here (talent.md):** EMPLOYEE/MANAGER lack `performance.read` → ESS appraisal 403 (§1.4); nobody has `performance.approve`/`performance.create` → manager-rate & 360 unreachable (§1.4/1.5); requisition UI omits required `designationId` → 400 (§2.1); referral sends invalid enum `HIRED` → bonus path dead (§2.7); offer has no accept/reject lifecycle (§2.5); training.update HR-only, MANAGER `training.approve` is a dead grant (§3.2); travel.read HR-only but approve MANAGER-only → both non-HR consoles error (§4.1); rewards.read HR-only + no redemption (§5). These require **seed re-grant + custom roles** (rbac-settings A7).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. PERFORMANCE — `/performance`
**Title** "Performance" · **Plan** none (always available). **Roles** `performance.read` (self-scoped; **fix seed** to grant employees/managers, talent.md §1.4), `performance.configure` (cycles/templates/finalize), `performance.approve` (manager-rate/calibration — **fix seed**: grant to direct managers).

## A1. Dashboard
KpiRow + readiness cards + Performance Summary Matrix (employee, dept, score %, rating). **Fix** (talent.md §1.1): remove `(index%3)*3` synthetic jitter and hardcoded goals=3 — show real goal counts or hide the column; render the returned audit logs. EXISTS `GET /performance`.

## A2. Cycles — admin
DataTable (name, period, StatusPill Draft→Goal-setting→Check-ins→Review→Calibration→Published→Closed). Cycle wizard: period + population (dept/grade → live count) → template pick → workflow (self→manager→reviewer→HR; 360 on/off; calibration on/off) → timeline (stage deadlines → §10 tasks). Activate/Complete. **NEW UI**: edit + delete cycle (today API-only, talent.md §1.2). EXISTS `GET/POST /performance/cycles`, `GET/PATCH/DELETE …/:id`, `POST …/:id/activate|complete`.

## A3. Templates (KRA)
Create modal: dynamic KRA rows with **live weightage-sum indicator, submit disabled unless =100** (server validates exactly 100, talent.md §1.3). **NEW UI**: edit + delete template (today API-only). EXISTS `GET/POST /performance/templates`, `GET/PATCH/DELETE …/:id`.

## A4. Goals/OKRs — `/performance/goals` (master plan §5.4)
GoalTree (company→dept→mine cascade); ESS add/edit in goal window; quarterly check-in drawer (progress %, On-track/At-risk/Off-track). **NEW** (no goal endpoints distinct from KRA today) `GET/POST/PATCH /performance/goals`. **OKR module** distinct from KRA = market gap (blueprint §4).

## A5. Appraisals (self → manager → HR)
- **My Appraisal** (ESS): list own; "Self Assess" per-KRA (1–5 + required description) when PENDING → weighted self score; status SELF_DONE. EXISTS `POST …/:id/self-rate`. **Fix seed**: grant `performance.read` to EMPLOYEE (today 403, talent.md §1.4).
- **Team Appraisals** (manager): Grade Report (per-KRA rating + comment) when SELF_DONE → MANAGER_DONE. EXISTS `POST …/:id/manager-rate` (enforces `managerId===caller`). **Fix seed**: grant `performance.approve` to managers; **fix** team filter to server-side reports-only (today client-side shows all non-self, talent.md §1.4).
- **HR Finalize**: when MANAGER_DONE → finalScore=managerScore → COMPLETED + **auto-promotion suggestion** (if finalScore ≥ `promotionScoreThreshold` 4.0, revisedCtc ×(1+`incrementPct` 0.10) → EmployeePromotion PENDING, decided in §03). EXISTS `POST …/:id/complete`. **Fix** hardcoded fallbacks `des_hr_manager`/CTC 500000 and UI hardcoded "10%" text (read from settings, talent.md §1.4).
- **Bulk Appraise**: cycle + template modal. **Fix**: expose `employeeIds` subset (today always all, talent.md §1.4). EXISTS `POST /performance/appraisals/create-for-cycle`.
- **Results** tab: read-only self/manager/final table. EXISTS `GET /performance/appraisals` (self-scoped without configure/approve).

## A6. 360 feedback
Request Review (target, reviewer, competencies) → reviewer responds (1–5 per competency + comments). EXISTS `POST /performance/feedback/requests`, `GET …`, `POST …/:id/respond`. **Fixes**: grant `performance.create` to relevant roles (today SUPER_ADMIN-only, talent.md §1.5); **NEW UI to read completed responses** (today never displayed); server-check provider on respond.

## A7. Calibration / 9-box (master plan §5.4; **NEW**)
NineBox grid (performance × potential), drag w/ keyboard alternative, forced-distribution meters, session log (who moved whom + reason), finalize → ratings locked → increment/promotion letters batch (→ §03). **NEW** `GET/POST /performance/calibration`. **Salary revision/increment cycles** linked to scores = market gap (blueprint §4). **PIP** module (plan, checkpoints, confidential) = market gap.

---

# B. RECRUITMENT — `/recruitment`
**Title** "Recruitment" · **Plan** add to map (today defaults Pro, shell.md §2.1). **Roles** `recruitment.{read,create,update,approve,configure}`; interviewers scoped to assigned candidates.

## B1. Requisitions
"Request Headcount" form: title, department, **designation (required — FIX: today omitted → every create 400s, talent.md §2.1)**, openings, justification. Validates vs StaffingPlan vacancy. Approve/Reject (HR). EXISTS `POST /recruitment/requisitions`, `GET …`, `PATCH …/:id/decide`. **Fix**: `requestedById` fails for users without employee record (talent.md §2.1).

## B2. Job postings
Create (reference §5.2: title, department, location, employment type, openings ≥1, experience band, rich-text description; optional approved-requisition link). Job board table (applicants count, status). **NEW**: `PATCH /recruitment/job-postings/:id` to close/edit (today none — CLOSED pill unreachable, talent.md §2.2). EXISTS `POST/GET /recruitment/job-postings`.

## B3. Candidates & pipeline — `/recruitment/jobs/[id]` (NEW route)
**KanbanBoard** stages (Sourced→Screening→Interview L1/L2→Manager→HR→Offer→Hired; Rejected/Withdrawn collapse). Add Candidate (name, email, phone, resume URL, source; optional apply). **Candidate drawer** `/candidates/[id]` (NEW): parsed CV + original pane, timeline, screening answers, scorecards, stage dropdown, schedule interview, create offer (when stage=OFFER). Bulk move + auto-emails (preview). EXISTS `POST /recruitment/candidates`, `GET …`, `POST /recruitment/applications`, `PATCH …/:id/stage`, `GET /recruitment/applications/posting/:postingId`. **Fixes**: stage strings free-form (talent.md §2.3) → constrain enum; candidate global (cross-tenant email collision) → tenant-scope; support multi-application (today only `applications[0]`). **Resume parsing + careers page + job-board distribution** = market gaps (blueprint §4).

## B4. Interviews
Scheduler (reference §5.2: stage, interviewer multi-select, datetime future, mode, link/room). Conflict detection ±1h (EXISTS). **Interviewer cockpit**: my interviews, candidate pack (blind per setting), **ScorecardForm** (1–5 + recommendation Hire/Reject/Hold + comments) → auto-consensus when all submit. EXISTS `POST /recruitment/interviews`, `GET …`, `POST …/:id/feedback`. **NEW UI**: show individual feedback rows (today only consensus, talent.md §2.4).

## B5. Offers
Offer builder (CtcCalculator + joining date; **NEW**: editable terms — today hardcoded "6mo probation/90d notice", talent.md §2.5). **NEW lifecycle**: send → candidate accept/decline (tokened page) → **convert to employee** (→ §03 add-employee + onboarding). Today status DRAFT forever (talent.md §2.5). EXISTS `POST /recruitment/job-offers` (`recruitment.approve`), `GET …[/:id]`. **NEW** `PATCH /recruitment/job-offers/:id` (send/accept/reject/convert).

## B6. Staffing plans & referrals
- Staffing plans: budget vs headcount, vacancies-left. **Fix**: `currentHeadcount` never auto-increments on hire (talent.md §2.6) → **NEW** increment on convert-to-employee. EXISTS `POST /recruitment/staffing-plans`, `GET …/list/:companyId`.
- Referrals: "Refer a Friend" (bonus default ₹25k). **CRITICAL FIX** (talent.md §2.7): UI sends invalid enum `HIRED` → Prisma error → Release Bonus never appears → the APPROVED branch that creates the referrer's AdditionalSalary bonus is unreachable. Use valid `ApprovalStatus` (PENDING→APPROVED→PAID). EXISTS `POST/GET /recruitment/referrals`, `PATCH …/:id/decide`.

---

# C. TRAINING & SKILLS — `/training`
**Title** "Training & Skills" · **Plan** Standard (PlanGate). **Roles** `training.{read,create,update,configure}`.
- **Programs & Events**: create program/event (program, eventName, trainer, start/end, location). **Fix**: event `status` pill renders "undefined" (no status field, talent.md §3.1) — add status or remove pill; **NEW**: event edit/cancel/complete (no PATCH/DELETE today); **NEW**: enrollment/attendee concept + nominations (manager nominate → `training.approve` — **fix** the dead MANAGER grant, talent.md §3.2). EXISTS `POST/GET /training/programs|events`.
- **Assessments & Outcomes**: feedback (rating 1–5) + results (PASSED/FAILED). **NEW UI**: display historical feedback/results (fetched but never shown, talent.md §3.2). EXISTS `POST /training/events/:id/feedback|result`.
- **Skills**: create skill, assess employee (BEGINNER/INTERMEDIATE/EXPERT), map designation skill. **Fix**: designations derived from employees only → use `GET /organization/designations` (talent.md §3.3); add skill catalog table view. EXISTS `POST /training/skills`, `GET …`, `POST /training/skills/assess`, `POST /training/designations/skills`.
- **Skill Gap**: employee selector → gap/met cards (BEGINNER=1/INTERMEDIATE=2/EXPERT=3 vs designation requirement). EXISTS `GET /training/skills/gaps/:employeeId`.
- **LMS depth** (SCORM, certificates, assessments) = market gap (blueprint §4).
- **My Learning** (ESS): enrolled/in-progress/completed + certificate download.

---

# D. TRAVEL DESK — `/travel`
**Title** "Travel Desk" · **Plan** Standard. **Roles** `travel.{read,create,update,approve}`. **Fix seed** (talk.md §4.1): `travel.read` HR-only but `travel.approve` MANAGER-only → seeded EMPLOYEE/MANAGER consoles error; grant read appropriately.
- **Travel requests**: form (employee, purpose, dates, source/dest, est cost, advance). Auto-creates linked EmployeeAdvance if advance>0. Approve/Reject (reject also rejects pending advances). EXISTS `POST /travel/requests`, `GET …`, `PATCH …/:id/decide`.
- **Itineraries**: book item (mode FLIGHT/TRAIN/CAB/BUS/HOTEL, ticket, boarding). **Fix**: API allows adding to PENDING/REJECTED trips (only UI filters) → server-enforce approved-only (talent.md §4.2). EXISTS `POST /travel/requests/:id/itinerary`.
- **Cash advances**: Disburse (PENDING→PAID). **Fix**: can disburse while trip PENDING (no cross-check, talent.md §4.3); **NEW**: payroll integration for advance + post-trip settlement claim (today just stamps row). EXISTS `GET /travel/advances`, `PATCH …/:id/disburse`.

---

# E. REWARDS — `/rewards`
**Title** "Rewards" · **Plan** Pro. **Roles** `rewards.{read,create}`. **Fix seed**: `rewards.read` HR-only → employees get empty page despite recognition being employee-facing (talent.md §5).
- **My wallet** (ESS): points balance, earn history (RewardLedger), redemption catalog (vouchers w/ pointsCost). **NEW redemption flow** (today none — pointsCost/totalPoints exist but no redeem/deduct, talent.md §5.3) `POST /rewards/redeem`.
- **Give recognition**: pick person → badge value → points (within budget) → optional social post. EXISTS `POST /rewards/recognitions` (+ledger entry).
- **Admin**: vouchers/benefits/points CRUD (**fix** generic always-visible-10-field panel → per-action forms, talent.md §5.2); budgets per manager; **NEW** update/delete + voucher status/expiry (today defaults only). EXISTS `GET /rewards`, `POST /rewards/vouchers|benefits|points`.
- Recognition points feed §A1 performance + §07 social feed.

---

## F. Cross-cutting (this section)
- Windows/deadlines (goal-setting, review-due, registration-close) → warning banner + §10 task + reminder.
- Blind rules server-enforced (peer anonymity, interviewer blind feedback, candidate PII masked pre-L1).
- Scorecards/appraisals autosave; submit = lock (unlock `performance.approve` + reason).
- Every list: skeleton/empty/filtered-empty/error+ref/forbidden; mobile RecordCards; kanban keyboard move-to.
- **Backend backlog**: seed re-grants (rbac-settings A7); requisition designationId fix; referral enum fix; offer lifecycle + convert; job-posting close/edit; performance read/approve/create grants + server team-scope + read-360; calibration endpoints; goals endpoints; training event status + enrollment + show outcomes; travel approved-only itinerary + advance/payroll integration; rewards redemption + CRUD; tenant-scope candidate/interview/referral/travel/reward models (talent.md cross-cutting).
