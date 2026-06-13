# Talent Modules Inventory — Performance, Recruitment, Training, Travel, Rewards

Source-of-truth audit (2026-06-12) of API controllers/services and matching web consoles.
API root: `apps/api/src/modules/` · Web root: `apps/web/components/` + `apps/web/app/`.

Conventions used below:
- **Endpoint** = `METHOD path` with the `@RequirePermissions(...)` permission. All endpoints sit behind JWT + `PermissionsGuard` (`apps/api/src/common/auth/permissions.guard.ts:28` — `SUPER_ADMIN` role bypasses ALL permission checks).
- **Seeded role grants** (baseline reality, `packages/database/prisma/seed.ts:131-378`):
  - HR_ADMIN: `*.read` for all 5 modules; `create/update` for recruitment, training, travel, rewards(create only); `approve` for recruitment ONLY; `configure` for performance, recruitment, travel, training.
  - MANAGER: `recruitment.read`, `training.approve`, `travel.approve` — and NOTHING else in these modules.
  - EMPLOYEE: `training.create`, `travel.create` — and NOTHING else in these modules.
- Permissions are DB-driven (Role → RolePermission → Permission, flattened to `module.action` strings at login, `apps/api/src/modules/auth/auth.service.ts:50-51`), so a tenant admin could re-grant via the security console; the gaps below describe the **seeded default**.

### Cross-cutting: tenant isolation status

Prisma middleware (`apps/api/src/prisma/prisma.service.ts:6-13`) auto-stamps/filters `companyId` for only these talent-relevant models: `JobPosting`, `AppraisalCycle`, `AppraisalTemplate`, `Appraisal`, `StaffingPlan`.
**NOT auto-scoped** (queries are global across tenants unless service filters manually): `Candidate`, `JobApplication`, `Interview`, `InterviewRound`, `InterviewFeedback`, `JobOffer`, `JobRequisition` (service filters manually by `user.tenantId`), `EmployeeReferral`, `TrainingProgram`, `TrainingEvent`, `TrainingFeedback`, `TrainingResult`, `Skill`, `EmployeeSkillMap`, `DesignationSkill`, `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`, `RewardVoucher`, `RewardLedger`, `RecognitionReward`, `BenefitItem`, `FeedbackRequest`, `AppraisalKra`, `AppraisalGoal`, `EmployeePromotion`. A redesign must not assume per-tenant data on these lists.

---

## 1. Performance (PMS)

API: `performance.controller.ts` / `performance.service.ts` · Web: `performance-console.tsx` (1375 lines) + static `PerformanceReviewWorkspace` (`reference-workspaces.tsx:376`) · Page: `app/performance/page.tsx` (NO PlanGate — always available).

### 1.1 Summary dashboard
- **Endpoint**: `GET /performance` — `performance.read` (`performance.controller.ts:21-25`).
- **What it returns** (`performance.service.ts:27-103`): per-active-employee derived "score matrix" computed from attendance %, reward points, leave count, plus appraisal `finalScore` if one exists; category readiness blocks (Goals/Attendance/Recognition/Review Ready); last 20 performance audit-log rows.
- **Settings-driven thresholds** via `SettingsService.getPerformanceRules()` (`settings.service.ts:382`): `scoreMin` (default 55), `scoreMax` (100), `ratingExcellent` (4.0), `ratingGood` (3.0), `scoreGoodThreshold` (75), `attendanceCompleteThreshold` (80), `promotionScoreThreshold` (4.0), `incrementPct` (0.10).
- **UI**: "Dashboard" tab — 4 MetricCards, readiness card grid, "Performance Summary Matrix" table (employee, dept, designation, goals x/3, attendance %, recognition pts, score %, rating pill).
- **Quirks**:
  - Score formula includes `(index % 3) * 3` jitter (`performance.service.ts:59`) — synthetic variance, not a real metric.
  - `goals` is hardcoded to `3` if any appraisal exists, `completedGoals` 3-or-0 (`performance.service.ts:68-69`) — the goals column is fake.
  - Summary queries `attendanceLog.findMany()` / `leaveRequest.findMany()` with no filters — full-table loads; and none of those models are tenant-scoped via middleware lists shown above (Employee IS scoped).
  - Audit `logs` are returned by API but never rendered in the console.

### 1.2 Appraisal cycles (CRUD + lifecycle)
- **Endpoints** (`performance.controller.ts:30-70`):
  - `GET /performance/cycles` — `performance.read`
  - `POST /performance/cycles` — `performance.configure`
  - `GET /performance/cycles/:id` — `performance.read` (includes appraisals + employees)
  - `PATCH /performance/cycles/:id` — `performance.configure`
  - `DELETE /performance/cycles/:id` — `performance.configure`
  - `POST /performance/cycles/:id/activate` — `performance.configure` (status → ACTIVE)
  - `POST /performance/cycles/:id/complete` — `performance.configure` (status → COMPLETED)
- **UI** ("Cycles" tab, admin-view only, `performance-console.tsx:478-549`): table of cycles with status pill; "Create Appraisal Cycle" modal (name/start/end, created as DRAFT); row buttons Activate (DRAFT) / Complete Cycle (ACTIVE); COMPLETED shows "Archived" label.
- **API-only (no UI)**: `GET /cycles/:id` detail, `PATCH /cycles/:id` (edit cycle), `DELETE /cycles/:id` — no edit/delete controls exist in the console.
- **Quirks**: cycle status is a free string on the model (`schema.prisma:1820` default "DRAFT"); the UI tab is hidden for non-admin roles, but the visibility check is the client-side `useActiveRole()` "admin" flag, not server roles.

### 1.3 Appraisal templates (KRA templates)
- **Endpoints** (`performance.controller.ts:75-103`):
  - `GET /performance/templates` — `performance.read` (includes `kras`)
  - `POST /performance/templates` — `performance.configure` (validates KRA weightages sum to exactly 100, `performance.service.ts:196-199`)
  - `GET /performance/templates/:id` — `performance.read`
  - `PATCH /performance/templates/:id` — `performance.configure` (transactionally deletes all KRAs and recreates, `performance.service.ts:236-251`)
  - `DELETE /performance/templates/:id` — `performance.configure`
- **UI** ("Templates" tab, admin only, `performance-console.tsx:552-589` + modal `1127-1221`): create modal with dynamic KRA rows, live weightage-sum indicator, submit disabled unless sum == 100. Default seed KRAs prefilled ("Deliverables & Code Quality" 40 / "Team Collaboration" 30 / "Innovation" 30).
- **API-only (no UI)**: template detail, update, delete — templates are create-and-list only in the console.

### 1.4 Appraisals (self → manager → HR finalize flow)
- **Endpoints** (`performance.controller.ts:108-156`):
  - `GET /performance/appraisals` — `performance.read`. Server-side scoping: users WITHOUT `performance.configure`/`performance.approve` see only their own (`performance.service.ts:264-267`).
  - `POST /performance/appraisals/create-for-cycle` — `performance.configure`. Bulk-creates PENDING appraisals + one `AppraisalGoal` per template KRA for all ACTIVE employees (or `employeeIds` subset); skips employees that already have one in the cycle (`performance.service.ts:279-322`).
  - `GET /performance/appraisals/:id` — `performance.read`
  - `POST /performance/appraisals/:id/self-rate` — `performance.read` + requires `user.employeeId`; ownership enforced (`performance.service.ts:344-346`); only from PENDING; weighted self score = Σ(rating × weightage)/100; status → SELF_DONE.
  - `POST /performance/appraisals/:id/manager-rate` — `performance.approve` + requires `user.employeeId`; enforced `appraisal.employee.managerId === caller.employeeId` (`performance.service.ts:379-381`); only from SELF_DONE; status → MANAGER_DONE.
  - `POST /performance/appraisals/:id/complete` — `performance.configure`; only from MANAGER_DONE; `finalScore = managerScore`; status → COMPLETED.
- **Auto-promotion suggestion** (`performance.service.ts:426-449`): on complete, if `finalScore >= (body.incrementThreshold || settings promotionScoreThreshold || 4.0)`, creates an `EmployeePromotion` row with status PENDING and `revisedCtc = activeCTC × (1 + incrementPct)`. Promotion approval/decision lives in the **employees module** (`employees.service.ts:720-830`, surfaced in lifecycle console), not here.
- **UI**:
  - "My Appraisal" tab (employee view, `performance-console.tsx:592-736`): list of own appraisals; "Self Assess" inline form per KRA (1-5 select + required description) when PENDING.
  - "Team Appraisals" tab (`:739-934`): list of others' appraisals; "Grade Report" manager form when SELF_DONE (shows employee self score + notes per KRA); "Finalize (HR)" panel when MANAGER_DONE and admin view — shows self/manager scores, editable "Increment Threshold Score" input (default 4.0), "Complete & Finalize" button.
  - "Results" tab (`:937-990`): read-only table of all appraisals with self/manager/final scores.
  - "Bulk Appraise" header action → modal selecting ACTIVE cycle + template (`:1224-1270`). The modal never sends `employeeIds`, so bulk creation always targets ALL active employees (the API's subset capability is UI-unreachable).
- **CRITICAL permission gaps (seeded roles)**:
  - `performance.read` is granted **only to HR_ADMIN**. Seeded EMPLOYEE and MANAGER roles cannot even list appraisals or open the PMS dashboard — the "My Appraisal" employee flow 403s for the demo employee login.
  - `performance.approve` is granted to **NOBODY** in seed (HR_ADMIN approve list at seed.ts:137 omits performance). SUPER_ADMIN bypasses the guard but has `employeeId = null`, so manager-rate throws "Only direct managers..." (`performance.controller.ts:146-148`). **The manager-rating step is unreachable end-to-end with seeded roles** — appraisals stall at SELF_DONE unless a custom role grants `performance.approve` to the actual direct manager.
  - "Team Appraisals" filtering is client-side only (`appraisals.filter(app => app.employeeId !== currentUser.employeeId)`, `performance-console.tsx:370`); managers see ALL non-self appraisals the API returns, not just their reports.
- **Other quirks**:
  - `completeAppraisal` hardcodes fallback designation `"des_hr_manager"` and fallback CTC `500000` (`performance.service.ts:434-440`) — known hardcode-ledger items.
  - Promotion suggestion sets `fromDesignationId === toDesignationId` — it is an increment suggestion, not an actual designation change.
  - UI text "a 10% CTC increment suggestion will be created" (`performance-console.tsx:821`) hardcodes the 10% even though the API reads `incrementPct` from settings.
  - `finalScore = managerScore` only — self score and 360 feedback have zero weight in the final score.

### 1.5 360-degree feedback
- **Endpoints** (`performance.controller.ts:161-180`):
  - `POST /performance/feedback/requests` — `performance.create` (requestor = person being reviewed, provider = reviewer, `questions` = free JSON; optionally linked to an appraisal)
  - `GET /performance/feedback/requests` — `performance.read` (returns ALL requests, no scoping)
  - `POST /performance/feedback/requests/:id/respond` — `performance.create` (stores `answers` JSON; status → SUBMITTED)
- **UI** ("360 Feedback" tab, `performance-console.tsx:993-1071` + modals `1273-1372`): "Request Review" modal (target employee, reviewer, comma-separated competencies); table of requests; "Submit Review" button appears only when `currentUser.employeeId === providerId`; response modal renders a 1-5 star select per competency + required comments.
- **Permission gap**: `performance.create` is granted to NO seeded role (HR_ADMIN's create list omits performance) — **360 feedback create/respond is SUPER_ADMIN-only by default**, even though the tab renders for everyone who can load the page.
- **Quirks**: no provider-side server check on respond (anyone with `performance.create` can answer any request); `questions`/`answers` are untyped `any` JSON (`feedback.dto.ts:17,22`); submitted answers are never displayed anywhere — there is no UI to read a completed 360 response; `appraisalId` linking exists in the API but the UI only sends it if a `selectedAppraisal` happens to be set (effectively always null from this tab).

---

## 2. Recruitment

API: `recruitment.controller.ts` / `recruitment.service.ts` · Web: `recruitment-console.tsx` (1603 lines) · Page: `app/recruitment/page.tsx` (NO PlanGate). Tabs: Job Openings, Candidates, Requisitions, Interviews, Job Offers, Staffing Plans, Referrals.

### 2.1 Requisitions (headcount approval)
- **Endpoints**:
  - `POST /recruitment/requisitions` — `recruitment.create` (`recruitment.controller.ts:26-34`). companyId from `user.tenantId || "default-company"`. Validates against StaffingPlan remaining vacancy when a plan exists for the dept+designation (`recruitment.service.ts:24-46`).
  - `GET /recruitment/requisitions` — `recruitment.read` (manually filtered by companyId).
  - `PATCH /recruitment/requisitions/:id/decide` — `recruitment.approve` (APPROVED/REJECTED + approvedById + reason).
- **UI**: "Request Headcount" header action + inline form (title, department, openings) (`recruitment-console.tsx:1063-1090`); requisitions table with Approve/Reject buttons shown only when `isHrOrAdmin` (client check on SUPER_ADMIN/HR_ADMIN role names, `:561`).
- **BROKEN (UI-only mismatch)**: `CreateRequisitionDto` requires `designationId` (`recruitment.dto.ts:25-27` `@IsNotEmpty`) but the UI form has **no designation field and never sends it** (`recruitment-console.tsx:308-316`) → every requisition submission from the console fails class-validator with 400. Also `requestedById` is required but sent as `currentUser?.employeeId || undefined` — fails for users without an employee record. Consequence: the staffing-plan budget validation is also dead via UI because requisitions can't be created from it.

### 2.2 Job postings
- **Endpoints**:
  - `POST /recruitment/job-postings` — `recruitment.create`. If `requisitionId` given, requisition must be APPROVED (`recruitment.service.ts:108-119`).
  - `GET /recruitment/job-postings` — `recruitment.read` (includes applications + candidates). `JobPosting` IS tenant-middleware-scoped.
- **UI**: "Create Job Vacancy" inline form (title, department, location, openings, optional approved-requisition link — dropdowns fed from `/organization/departments|designations|locations`); searchable "Job Board Vacancies" table (Job ID short-hash, applicants count, linked requisition, status pill).
- **API-only**: nothing closes/edits a posting — `status` stays "OPEN" forever; there is no `PATCH /job-postings` at all (the UI's CLOSED red pill state is unreachable).

### 2.3 Candidates & applications (pipeline)
- **Endpoints**:
  - `POST /recruitment/candidates` — `recruitment.create`. Dedup by lowercase email — silently returns the existing candidate (`recruitment.service.ts:157-174`).
  - `GET /recruitment/candidates` — `recruitment.read` (global, NOT tenant-filtered).
  - `POST /recruitment/applications` — `recruitment.create` (body `jobPostingId` + `candidateId`, no DTO class; duplicate application → 400).
  - `PATCH /recruitment/applications/:id/stage` — `recruitment.update`. Also syncs `candidate.currentStage` (`recruitment.service.ts:234-238`).
  - `GET /recruitment/applications/posting/:postingId` — `recruitment.read` (includes interviews + feedbacks + offers).
- **UI**: "Add Candidate" inline form (name, email, phone, resume URL, source channel, optional immediate apply-to-posting — fires 2 API calls); searchable ATS table; clicking a row opens the **Candidate Inspector drawer** (`recruitment-console.tsx:845-1058`) with: stage-change dropdown (SCREENING / TECHNICAL_INTERVIEW / MANAGER_ROUND / HR_ROUND / OFFER / HIRED / REJECTED), "Schedule Interview Round" panel, "Create & Issue Job Offer" panel (only when stage == OFFER), resume link, sourcing metadata.
- **API-only (no UI)**: `GET /applications/posting/:postingId` is never called by the console (it uses the candidates list's nested `applications[0]` instead). Multi-application candidates: UI always operates on `applications[0]` only.
- **Quirks**: DTO stage union is `"SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED"` (`recruitment.dto.ts:161`) but UI sends `TECHNICAL_INTERVIEW`, `MANAGER_ROUND`, `HR_ROUND` — passes at runtime because validation is only `@IsString` (TS union is not enforced); stage strings are therefore free-form in the DB. Candidate model is global → same email across tenants collides into one shared candidate record.

### 2.4 Interviews & scorecard feedback
- **Endpoints**:
  - `POST /recruitment/interviews` — `recruitment.update`. Creates/reuses a named `InterviewRound` per application (auto round numbering); **conflict detection**: rejects if any chosen interviewer has another SCHEDULED interview within ±1 hour (`recruitment.service.ts:292-318`); assigns interviewers via `Interviewer` join rows.
  - `GET /recruitment/interviews` — `recruitment.read` (global list, includes candidate/posting/interviewers/feedbacks/round).
  - `POST /recruitment/interviews/:id/feedback` — `recruitment.update`. Upserts per-interviewer scorecard (rating 1-5, comments, recommendation HIRE/REJECT/HOLD); verifies the submitter is an assigned interviewer; **auto-consensus**: when all assigned interviewers have submitted, computes avg rating and consensus string ("REJECT (n reject votes)" / "HIRE (Unanimous)" / "HOLD (Mixed reviews)"), marks interview COMPLETED and the round COMPLETED (`recruitment.service.ts:391-429`).
- **UI**: schedule form lives in the candidate drawer (round name, datetime, mode ONLINE/IN_PERSON/TELEPHONIC, multi-select interviewers); "Interviews" tab table shows consensus text in "Feedback Consensus" column and a "Submit Scorecard" modal (rating stars, recommendation, comments). Scorecard always submits `interviewerEmployeeId = currentUser.employeeId` — if the logged-in user is not one of the assigned interviewers the API 400s ("Interviewer is not assigned").
- **Quirks**: conflict window is hardcoded 1 hour; interview `mode` DTO comment says ONLINE/IN_PERSON but UI also sends TELEPHONIC (free string, fine); individual feedback rows are returned by the API (`feedbacks[]`) but the table only shows the aggregated consensus string.

### 2.5 Job offers
- **Endpoints**:
  - `POST /recruitment/job-offers` — `recruitment.approve` (NOT create) — application must exist; creates offer with status DRAFT + `terms[]` child rows.
  - `GET /recruitment/job-offers` — `recruitment.read`
  - `GET /recruitment/job-offers/:id` — `recruitment.read`
- **UI**: offer form in candidate drawer (CTC + joining date); terms are **hardcoded client-side** to "Probation Period: 6 months" and "Notice Period: 90 days" (`recruitment-console.tsx:402-405`) — the flexible terms API capability has no UI. "Job Offers" tab is a read-only table (ID, candidate, role, CTC, joining, status, created).
- **API-only / dead-ends**: there is no accept/reject/send endpoint — offer status is DRAFT forever (UI's ACCEPTED/REJECTED pill tones are unreachable); `GET /job-offers/:id` unused by UI; no offer-letter document generation.

### 2.6 Staffing plans (headcount budgets)
- **Endpoints**:
  - `POST /recruitment/staffing-plans` — `recruitment.create`. Upsert keyed on (companyId, departmentId, designationId); service takes `data: any` (DTO `CreateStaffingPlanDto` exists with companyId required but is NOT bound to the controller param — `recruitment.controller.ts:155` uses the DTO; companyId comes from the client body!).
  - `GET /recruitment/staffing-plans/list/:companyId` — `recruitment.read`. Path param is overridden by `TenantContext.getTenantId()` when present (`recruitment.service.ts:561`).
- **UI**: "Create Staffing Plan" inline form (department, designation, budgeted headcount, start/end dates — sends `companyId` from local session `getCurrentCompanyId()`); table with budget vs `currentHeadcount` and computed "X vacancies left" pill.
- **Quirks**: `currentHeadcount` defaults 0 and **nothing in the codebase increments it** on hire — vacancy math is static unless updated manually in DB; client supplies companyId on create (middleware does stamp StaffingPlan on create, mitigating).

### 2.7 Employee referrals
- **Endpoints**:
  - `POST /recruitment/referrals` — `recruitment.create` (referrerId, candidate details, jobPostingId, bonusAmount; status PENDING).
  - `GET /recruitment/referrals` — `recruitment.read` (global).
  - `PATCH /recruitment/referrals/:id/decide` — `recruitment.approve`. When status transitions to **APPROVED**, transactionally creates an `AdditionalSalary` ADDITION row ("Referral Bonus: <name>") for the referrer and links it (`recruitment.service.ts:613-643`).
- **UI**: "Refer a Friend" inline form (default bonus prefilled ₹25,000 — hardcoded `recruitment-console.tsx:1509`); table with HR-only action buttons: "Mark Hired" (sends status `"HIRED"`) then "Release Bonus" (sends `"PAID"`).
- **BROKEN (UI/enum mismatch)**: `EmployeeReferral.status` is the Prisma enum `ApprovalStatus { DRAFT PENDING APPROVED REJECTED HOLD PAID }` (`schema.prisma:1777, 2162-2169`) — **"HIRED" is not a valid value**, so "Mark Hired" throws a Prisma enum error at runtime; consequently "Release Bonus" (only rendered when status === "HIRED") never appears, and the `APPROVED` branch that creates the bonus payroll entry is **unreachable from the UI**. The status pill also tests for "HIRED" which can never exist.

---

## 3. Training & Skills

API: `training.controller.ts` / `training.service.ts` · Web: `training-console.tsx` (923 lines) · Page: `app/training/page.tsx` — **PlanGate: requires "Standard" plan**. Tabs: Programs & Events, Assessments & Outcomes, Skills Catalog, Skill Gap Analysis. No ReferenceModuleHeader (plain sub-tabs).

### 3.1 Programs & events
- **Endpoints**:
  - `POST /training/programs` — `training.create` (name + optional description)
  - `GET /training/programs` — `training.read` (includes events)
  - `POST /training/events` — `training.create` (programId, eventName, trainerName, start/end, optional location)
  - `GET /training/events` — `training.read` (includes program, feedbacks+employee, results+employee)
- **UI**: side-by-side "Create Program" and "Schedule Event" forms; events render as cards with program badge, trainer, date, location and a status pill.
- **Quirks**: UI reads `e.status` for the pill (`training-console.tsx:496`) — **`TrainingEvent` has no status field set by the API/DTO**; value is whatever the model defaults to (check schema) or `undefined` → pill renders "undefined" tone red. Events cannot be edited/cancelled/completed (no PATCH/DELETE anywhere). No enrollment/attendee concept — any employee can be given feedback/results for any event.

### 3.2 Feedback & results (outcomes)
- **Endpoints**:
  - `POST /training/events/:id/feedback` — `training.update` (employeeId, rating 1-5, comments) — plain create, duplicates allowed.
  - `POST /training/events/:id/result` — `training.update` (employeeId, status string "PASSED"/"FAILED", comments) — plain create, duplicates allowed.
- **UI**: two forms on "Assessments & Outcomes" tab (event dropdown, employee dropdown, rating stars / PASSED-FAILED select, comments).
- **UI-only gap**: submitted feedback/results are **fetched** (nested in `GET /training/events`) but **never displayed** — no table or list shows historical feedback/results anywhere in the console.
- **Permission gap**: `training.update` is HR_ADMIN only; MANAGER's seeded `training.approve` matches **zero endpoints** in this module (dead grant); EMPLOYEE's `training.create` lets employees create programs/events/skills (likely unintended breadth) but not log outcomes.

### 3.3 Skills catalog & assessment
- **Endpoints**:
  - `POST /training/skills` — `training.create` (name, description)
  - `GET /training/skills` — `training.read`
  - `POST /training/skills/assess` — `training.update`. Upserts `EmployeeSkillMap` (employeeId+skillId unique, proficiency BEGINNER/INTERMEDIATE/EXPERT).
  - `POST /training/designations/skills` — `training.create`. Upserts `DesignationSkill` (requiredProficiency).
- **UI**: three forms ("Create Skill catalog", "Assess Employee Skill", "Map Designation Skill"). Designations dropdown is **derived from employee records** (`training-console.tsx:152-158`) — comment claims "no /organization/designations endpoint exists" but recruitment-console successfully calls `GET /organization/designations` (`recruitment-console.tsx:142`); so designations with no employees can never be mapped here. Skill list/catalog has no table view either — created skills only appear inside dropdowns.
- **Quirk**: proficiency is a free string in DTO (`training.dto.ts:76`) — only the UI constrains to the 3 levels.

### 3.4 Skill gap engine
- **Endpoint**: `GET /training/skills/gaps/:employeeId` — `training.read` (`training.service.ts:152-204`). Compares `DesignationSkill` requirements for the employee's designation vs `EmployeeSkillMap`, level map BEGINNER=1/INTERMEDIATE=2/EXPERT=3; returns `{gaps[], met[]}` with skillName/required/actual ("NONE" when unmapped). Employee without designation → empty result.
- **UI**: "Skill Gap Analysis" tab — employee selector + red gap cards / green met cards.
- **Quirk**: every skill/result/feedback/map write is audit-logged (module "training").

---

## 4. Travel Desk

API: `travel.controller.ts` / `travel.service.ts` · Web: `travel-console.tsx` (614 lines) · Page: `app/travel/page.tsx` — **PlanGate: requires "Standard" plan**. Tabs: Travel Requests, Itinerary Booking, Cash Advances.

### 4.1 Travel requests
- **Endpoints**:
  - `POST /travel/requests` — `travel.create`. Validates employee exists; transactionally creates request (PENDING) and, if `advanceAmount > 0`, a linked `EmployeeAdvance` (PENDING) (`travel.service.ts:16-52`).
  - `GET /travel/requests` — `travel.read` (global; includes employee, itineraries, advances).
  - `PATCH /travel/requests/:id/decide` — `travel.approve`. Body `status` is `@IsEnum(ApprovalStatus)`. On REJECTED, also rejects pending linked advances (`travel.service.ts:77-83`).
- **UI**: left form (employee select — **requester picks any employee**, purpose, dates, source/destination city, est. cost, advance) + "Travel Request Ledger" table with inline ✓/✗ approve/reject icon buttons shown for ANY pending row (no client role check at all — server permission is the only gate).
- **Permission reality**: `travel.approve` = MANAGER + SUPER_ADMIN only (HR_ADMIN cannot approve travel!); `travel.create` = HR_ADMIN + EMPLOYEE; `travel.read` = HR_ADMIN only → **seeded EMPLOYEE can create but cannot list travel requests; seeded MANAGER can approve but cannot list them** — both non-HR roles see an empty/erroring console. Approve buttons render for employees who will always 403.

### 4.2 Itineraries
- **Endpoints**: `POST /travel/requests/:id/itinerary` — `travel.update` (modeOfTravel FLIGHT/TRAIN/CAB/BUS/HOTEL, ticketNumber, boardingAt, details). No list/edit/delete endpoints (itineraries ride along on `GET /travel/requests`).
- **UI**: "Book Itinerary Item" form — request dropdown filtered to APPROVED requests client-side (API does NOT enforce approved status); "Itinerary Directory" cards grouped per trip with a hardcoded "ACTIVE" pill.
- **Quirk**: API allows adding itineraries to PENDING/REJECTED trips (no status check, `travel.service.ts:93-109`); only the UI filter prevents it.

### 4.3 Cash advances
- **Endpoints**:
  - `GET /travel/advances` — `travel.read` (global; includes employee + travelRequest).
  - `PATCH /travel/advances/:id/disburse` — `travel.approve`. PENDING → PAID + paymentDate (`travel.service.ts:123-141`).
- **UI**: "Cash Advances" tab table with "Disburse Cash" button on PENDING rows.
- **Quirks**: advances can be disbursed while the parent travel request is still PENDING (no cross-check); there is no standalone-advance creation endpoint (advances only born from travel requests) yet the UI has a "Standalone Advance" label for null-request rows; no payroll integration — disbursement just stamps the row (unlike referral bonuses which create AdditionalSalary).

---

## 5. Rewards & Benefits

API: `rewards.controller.ts` / `rewards.service.ts` (92 lines — smallest module) · Web: `rewards-dashboard.tsx` + `RewardsActionPanel` (`action-panels.tsx:565-659`) + static `RewardsMarketplaceWorkspace` (`reference-workspaces.tsx:297-321`) · Page: `app/rewards/page.tsx` — **PlanGate: requires "Pro" plan**.

### 5.1 Endpoints (complete list)
- `GET /rewards` — `rewards.read`. Single summary payload: all vouchers, all recognitions (+recipient), all benefits, full points ledger (+employee), computed `totalPoints` (`rewards.service.ts:10-19`).
- `POST /rewards/vouchers` — `rewards.create` (code unique, title, provider, valueAmount, pointsCost).
- `POST /rewards/benefits` — `rewards.create` (title, provider, category, description, optional pointsCost).
- `POST /rewards/points` — `rewards.create`. Appends `RewardLedger` row (points can be negative — `@IsInt` only, no `@Min`; source defaults "HR").
- `POST /rewards/recognitions` — `rewards.create`. Transactionally creates `RecognitionReward` and, if points > 0, a matching ledger entry with source "RECOGNITION" (`rewards.service.ts:53-74`).

### 5.2 UI
- `RewardsDashboard`: read-only — 4 metric cards (total points / voucher / benefit / recognition counts), Vouchers card list, Benefits Marketplace card list, combined "Recognition & Points Ledger" table. Recognitions themselves (title/message) are mapped into state but only the ledger table is rendered.
- `RewardsActionPanel`: single generic form — action select (Recognition / Award Points / Create Voucher / Create Benefit) + a flat field grid (employee, title, message, points, code, provider, category, valueAmount, pointsCost). All 10 inputs are always visible regardless of selected action; no per-action validation (e.g., creating a voucher with empty code passes the form and 400s server-side).
- `RewardsMarketplaceWorkspace`: 4 static info cards with dead "Configure" buttons (no onClick).
- Page header (`app/rewards/page.tsx:19-24`) declares actions "Add Reward / Voucher / Recognize / Announce" with **no onClick handlers** — decorative; tabs "Marketplace / Vouchers / Benefits / Recognition" are static (activeTab fixed to "Marketplace", no onTabChange).

### 5.3 Gaps & quirks
- **No redemption flow at all**: `pointsCost` exists on vouchers/benefits and `totalPoints` is computed, but there is no redeem endpoint, no per-employee balance view, no deduction logic — the "marketplace" is display-only.
- **No update/delete** for vouchers/benefits/recognitions; voucher `status`/`expiresAt` fields exist in schema (`schema.prisma:957-958`) but nothing ever sets them past defaults.
- **Permission gap**: `rewards.read` is HR_ADMIN-only in seed → seeded employees/managers get an empty rewards page (silent catch in `rewards-dashboard.tsx:64`), despite recognitions being an employee-facing concept. `rewards.create` HR_ADMIN only (consistent with admin panel).
- All reward models are tenant-UNscoped (global vouchers/ledger across tenants).
- Rewards data feeds back into Performance summary (recognition points, `performance.service.ts:58`) and social feed may surface recognitions (out of scope here).

---

## Quick matrix: API capability vs UI coverage

| Capability | API | UI | Works end-to-end (seeded roles)? |
|---|---|---|---|
| Perf: cycles create/activate/complete | Y | Y | HR_ADMIN yes |
| Perf: cycle edit/delete, template edit/delete | Y | N (API-only) | — |
| Perf: bulk appraisals for subset of employees | Y (`employeeIds`) | N (always all) | — |
| Perf: employee self-rate | Y | Y | **NO — EMPLOYEE lacks performance.read** |
| Perf: manager-rate | Y | Y | **NO — nobody has performance.approve; SUPER_ADMIN lacks employeeId** |
| Perf: HR finalize + promotion suggestion | Y | Y | HR_ADMIN yes (needs MANAGER_DONE, see above) |
| Perf: 360 request/respond | Y | Y | **NO — nobody has performance.create except SUPER_ADMIN** |
| Perf: view 360 answers | N | N | — |
| Recr: requisition create | Y | **BROKEN — UI omits required designationId** | NO |
| Recr: requisition approve | Y | Y | HR_ADMIN yes |
| Recr: posting create/list | Y | Y | yes |
| Recr: posting close/edit | N | N (pill state unreachable) | — |
| Recr: candidate + application + stage | Y | Y | yes (stage strings free-form) |
| Recr: interview schedule + conflict check + consensus | Y | Y | yes |
| Recr: offer create (custom terms) | Y | UI hardcodes terms | partial |
| Recr: offer accept/reject lifecycle | N | N | — |
| Recr: staffing plan upsert/list | Y | Y | yes (currentHeadcount never auto-updates) |
| Recr: referral decide → bonus payroll entry | Y (on APPROVED) | **BROKEN — UI sends invalid enum "HIRED"** | NO |
| Trn: programs/events create+list | Y | Y | HR_ADMIN yes; EMPLOYEE can also create |
| Trn: feedback/results submit | Y | Y | HR_ADMIN yes |
| Trn: feedback/results VIEW | Y (nested) | N — never rendered | — |
| Trn: skills, assess, designation map, gap engine | Y | Y | yes (designation list derived from employees only) |
| Trv: request + auto-advance | Y | Y | yes (any user picks any employee) |
| Trv: approve/reject | Y | Y | MANAGER only (HR_ADMIN cannot) |
| Trv: itinerary add | Y | Y | yes (API skips approved-status check) |
| Trv: advance disburse | Y | Y | MANAGER only |
| Rwd: voucher/benefit/points/recognition create | Y | Y (generic panel) | HR_ADMIN yes |
| Rwd: summary view | Y | Y | HR_ADMIN only |
| Rwd: redemption / balances / edit / expiry | N | N (decorative buttons) | — |
