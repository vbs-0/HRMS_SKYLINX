# SKYLINX PeopleOS — Complete System Reference

**One document covering: tech stack · every module's workflow & features · every API endpoint · the full permission schema · data models.**
Generated from the actual codebase on 2026-06-11.

---

## 1. Tech Stack (complete)

| Layer | Technology | Where |
|---|---|---|
| Backend framework | NestJS 10 (TypeScript, Express adapter) | `apps/api` |
| ORM | Prisma 5.22 (80+ models) | `packages/database/prisma/schema.prisma` |
| Database | PostgreSQL (`skylinx_peopleos`) | `DATABASE_URL` in `.env` |
| Auth | JWT access/refresh (`@nestjs/jwt` + Passport), bcryptjs (cost 12), OTP tokens | `apps/api/src/modules/auth` |
| Multi-tenancy | Prisma middleware injecting `companyId`/`tenantId` per request (AsyncLocalStorage TenantContext) | `apps/api/src/prisma/prisma.service.ts` |
| Validation | class-validator / class-transformer DTOs | `apps/api/src/modules/*/dto` |
| API docs | Swagger (`@nestjs/swagger`) | served by API |
| Security | Helmet, RBAC guards (`Missing required permission` 403s) | `apps/api/src/common` |
| Email | Nodemailer (SMTP config in `.env`, disabled by default) | notifications module |
| File upload | Multer | employee documents |
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS 3.4 + lucide-react | `apps/web` |
| Unit tests | Jest — 9 suites / 49 tests (auth, attendance, employees, payroll, lifecycle, career…) | `apps/api/src/**/*.spec.ts` |
| E2E tests | Playwright — role-journey specs + 3-role × 28-page full audit sweep | `apps/web/e2e/` |
| Monorepo | npm workspaces (`apps/*`, `packages/*`), Node ≥ 20 | root `package.json` |
| Ports | Web **:3000**, API **:4000** (prefix `/api/v1`) | `.env` `PORT=4000`, `NEXT_PUBLIC_API_BASE_URL` |

---

## 2. Roles & Permission Schema

Permissions are `module × action` pairs stored in `Permission`, linked via `RolePermission` (seeded in `packages/database/prisma/seed.ts`). Actions: `read, create, update, approve, configure, export`. The API guard returns **403 "Missing required permission"** when absent; the UI hides/degrades those panels gracefully.

### Matrix (seeded)

| Module | OWNER | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| employees | ALL | read/create/update/approve/configure | read | read, update (self-profile) |
| attendance | ALL | read/create/update/approve | read, approve | create (check-in/out, requests) |
| leave | ALL | read/create/update/approve/configure | read, approve | create (apply) |
| payroll | ALL | read/create/update/approve/configure/export | — | read (own payslips) |
| expenses | ALL | read/create/update/approve | approve | create (claims) |
| holidays | ALL | read/create/update | — | — |
| insurance | ALL | read/create/update/approve | — | — |
| recruitment | ALL | read/create/update/approve/configure | read | — |
| training | ALL | read/create/update/configure | approve | create |
| travel | ALL | read/create/update/configure | approve | create |
| performance | ALL | read/configure | read, approve | read |
| approvals | ALL | read/approve | — | — |
| organization | ALL | read/update | — | — |
| analytics / reports | ALL | read, export | — | — |
| rewards / social | ALL | read/create | — | — (social feed open to all users) |
| notifications | ALL | read/create/update | — | — |
| compliance | ALL | read, export | — | — |
| saas / settings / backup / testing / mobile / assets | ALL | read + configure | — | — |

**Login accounts (all created by `npm run db:seed`):**
| Role | Email | Password |
|---|---|---|
| OWNER (super admin) | manager@example.com | password123 |
| HR_ADMIN | hr.admin@example.com | Skylinx@123 |
| MANAGER | rohan.iyer@example.com | Skylinx@123 |
| EMPLOYEE | kabir.sethi@example.com | Skylinx@123 |

---

## 3. Modules — features, workflow, endpoints, data models

All endpoints are prefixed `http://localhost:4000/api/v1`. Extracted from the controllers on 2026-06-11.

### 3.1 [Authentication & RBAC](05_MODULE_01_AUTHENTICATION_AND_RBAC.md) (`auth`)
**Workflow:** login (email+password) → JWT access token stored client-side → `GET /auth/me` hydrates session; OTP request/verify and forgot-password flows for recovery.
**Endpoints:** `POST /auth/login` · `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/forgot-password` · `GET /auth/me`
**Models:** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `OtpToken`

### 3.2 [Employee Directory & Career Lifecycle](05_MODULE_02_EMPLOYEE_DIRECTORY.md) (`employees`) — UI `/employees`
**Features:** directory, profile CRUD, bulk upload, document upload+verification, grades, employment types, onboarding/separation templates & runs (detailed in **[Module 8: Onboarding & Separation Lifecycle](05_MODULE_08_LIFECYCLE.md)**), exit interviews, Full & Final settlement with asset recovery, Career History (Promotions & Transfers).
**Workflow:** HR creates employee → assigns dept/designation/location/manager/grade → uploads documents → (exit) start separation → exit interview → F&F statement → settle assets. Career: HR initiates promotions/transfers → manager/HR approves → profile gets updated and new active salary structure is applied (revised CTC).
**Endpoints:** `GET/POST /employees`, `POST /employees/bulk-upload`, `GET/PATCH /employees/:id`, `GET /employees/documents`, `POST /employees/:id/documents[/upload]`, `PATCH /employees/:id/documents/:documentId/verify`, `POST/GET /employees/onboarding/templates`, `POST /employees/:id/onboarding/start`, `POST/GET /employees/separation/templates`, `POST /employees/:id/separation/start`, `POST/GET /employees/:id/exit-interview`, `POST/GET /employees/:id/full-and-final`, `GET /employees/:id/ff-suggestions`, `PATCH /employees/full-and-final/assets/:assetId`, `POST /employees/grades`, `GET /employees/grades/:companyId`, `POST /employees/types`, `GET /employees/types/:companyId`, `GET/POST /employees/:id/promotions`, `POST /employees/promotions/:id/decide`, `GET/POST /employees/:id/transfers`, `POST /employees/transfers/:id/decide`
**Models:** `Employee`, `EmployeeDocument`, `EmployeeBankDetail`, `EmployeeGrade`, `EmploymentType`, `EmployeeOnboarding*`, `EmployeeSeparation*`, `ExitInterview`, `FullAndFinalStatement`, `FullAndFinalAsset`, `EmployeePromotion`, `EmployeeTransfer`, `LetterTemplate`

### 3.3 [Attendance & Shift Roster](05_MODULE_03_ATTENDANCE_AND_ROSTER.md) (`attendance`) — UI `/attendance`
**Features:** check-in/out, logs, regularization requests + approval, overtime requests, shift types, single/bulk shift assignment, shift change requests + decisions, schedules, auto-processing.
**Workflow:** employee checks in/out → log created → missed punch? employee raises regularization → manager approves → log corrected. Shifts: HR assigns; employee requests change; manager decides.
**Endpoints:** `GET /attendance/logs`, `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/shifts`, `GET/POST /attendance/regularizations`, `PATCH /attendance/regularizations/:id/approve`, `POST /attendance/overtime`, `POST /attendance/shifts/assign`, `POST /attendance/shifts/bulk-assign`, `POST/GET /attendance/shifts/requests`, `PATCH /attendance/shifts/requests/:id/decide`, `GET /attendance/shifts/assignments`, `POST /attendance/shifts/process-auto`
**Models:** `Shift`, `ShiftAssignment`, `ShiftRequest`, `ShiftSchedule`, `ShiftLocation`, `AttendanceRule`, `AttendanceLog`, `AttendanceRegularization`, `OvertimeRequest`

### 3.4 [Leave Management](05_MODULE_04_LEAVE_MANAGEMENT.md) (`leave`) — UI `/leave`
**Features:** leave types, balances, apply/approve/reject, policies + assignments, ledger entries, block lists (blackout dates), sandwich-rule validation, Leave Encashment requests, Earned-leave Accruals.
**Workflow:** HR defines types & policies → policy assignment grants balances → employee applies (validated against balance, block-list dates, sandwich rule) → manager/HR approves → balance decremented + ledger entry. Encashment: Employee requests encashment of available leave balance → admin/manager approves → balance is decremented and additional salary is credited. Accruals: Admin runs accrual engine to process earned leaves idempotently.
**Endpoints:** `GET/POST /leave/types`, `PATCH /leave/types/:id`, `GET/POST /leave/assignments`, `POST /leave/assignments/delete`, `GET /leave/balances`, `GET/POST /leave/requests`, `PATCH /leave/requests/:id/approve|reject`, `POST /leave/block-lists`, `GET /leave/block-lists/:companyId`, `POST /leave/block-lists/:id/dates`, `GET /leave/ledger/:employeeId`, `POST /leave/policies`, `GET /leave/policies/:companyId`, `POST /leave/policies/assign`, `GET /leave/policies/assignments/:companyId`, `GET/POST /leave/encashments`, `POST /leave/encashments/:id/decide`, `POST /leave/accruals/process`
**Models:** `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeavePolicy`, `LeavePolicyAssignment`, `LeaveLedgerEntry`, `LeaveBlockList`, `LeaveBlockListDate`, `LeaveEncashment`, `LeaveAccrualSchedule`, `CompOffConversion`

### 3.5 [Payroll & Compliance](05_MODULE_05_PAYROLL_AND_COMPLIANCE.md) (`payroll`) — UI `/payroll`
**Features:** salary structures, payroll runs (create → calculate → lock), payslips, bank export, benefit applications/claims, tax exemption declarations + proof submissions with decisions, additional salary; Indian statutory components (PF/ESI/PT/TDS), Gratuity calculations, Payroll Corrections & Arrears, configurable Tax Slabs (OLD/NEW regimes), Retention Bonus approvals generating AdditionalSalary earnings, and Salary Withholding (skips/zero-pays slips, release generates correction arrears).
**Workflow:** HR defines salary structure per employee → creates monthly run → calculate (generates payslips with earnings/deductions including corrections) → review → lock → bank export file.
**Endpoints:** `GET/POST /payroll/salary-structures`, `GET/POST /payroll/runs`, `POST /payroll/runs/:id/calculate`, `POST /payroll/runs/:id/lock`, `GET /payroll/runs/:id/payslips`, `POST /payroll/runs/:id/bank-export`, `POST /payroll/benefits/apply`, `GET /payroll/benefits/applications`, `POST /payroll/benefits/claim`, `GET /payroll/benefits/claims`, `PATCH /payroll/benefits/claims/:id/decide`, `POST /payroll/tax-declarations`, `GET /payroll/tax-declarations/:employeeId`, `POST/GET /payroll/tax-proofs`, `PATCH /payroll/tax-proofs/:id/decide`, `POST/GET /payroll/additional-salary`, `GET/POST /payroll/gratuity-rules`, `GET/POST /payroll/gratuity`, `POST /payroll/gratuity/:id/decide`, `GET/POST /payroll/corrections`, `POST /payroll/corrections/:id/decide`, `GET/POST /payroll/tax-slabs`, `PATCH /payroll/tax-slabs/:id`, `GET/POST /payroll/retention-bonuses`, `PATCH /payroll/retention-bonuses/:id/decide`, `GET/POST /payroll/withholdings`, `POST /payroll/withholdings/:id/release`
**Models:** `SalaryStructure`, `PayrollRun`, `Payslip`, `PayrollComponent`, `AdditionalSalary`, `EmployeeBenefitApplication`, `EmployeeBenefitClaim`, `EmployeeTaxExemptionDeclaration`, `EmployeeTaxExemptionProofSubmission`, `GratuityRule`, `Gratuity`, `PayrollCorrection`, `IncomeTaxSlab`, `RetentionBonus`, `SalaryWithholding`, `EmployeeLoan`, `LoanRepayment`

### 3.6 [Expense Claims](05_MODULE_06_EXPENSE_CLAIMS.md) (`expenses`) — UI `/expenses`
**Features:** claims with category + receipt URL, grade-based caps (live UI warning when amount exceeds the employee's grade `maxExpenseLimit`), two-stage approval (manager → HR), reject, reimburse.
**Workflow:** employee submits claim → if amount > grade cap, backend rejects with 400 + UI warning → manager approves → HR approves → reimbursed.
**Endpoints:** `GET/POST /expenses`, `PATCH /expenses/:id/manager-approve`, `PATCH /expenses/:id/hr-approve`, `PATCH /expenses/:id/reject`, `PATCH /expenses/:id/reimburse`
**Models:** `Expense`, `EmployeeGrade` (cap source), `EmployeeAdvance`

### 3.7 [Recruitment & ATS](05_MODULE_07_RECRUITMENT_ATS.md) (`recruitment`) — UI `/recruitment`
**Features:** requisitions with decision flow, job postings, candidates, applications with stage moves, interviews + multi-interviewer feedback with consensus, offers with terms.
**Workflow:** requisition → approve → posting → candidate → application → stage transitions → interviews → feedback (HIRE/HOLD/REJECT consensus) → offer.
**Endpoints:** `POST/GET /recruitment/requisitions`, `PATCH /recruitment/requisitions/:id/decide`, `POST/GET /recruitment/job-postings`, `POST/GET /recruitment/candidates`, `POST /recruitment/applications`, `PATCH /recruitment/applications/:id/stage`, `GET /recruitment/applications/posting/:postingId`, `POST/GET /recruitment/interviews`, `POST /recruitment/interviews/:id/feedback`, `POST/GET /recruitment/job-offers`, `GET /recruitment/job-offers/:id`
**Models:** `JobRequisition`, `JobPosting`, `Candidate`, `JobApplication`, `InterviewRound`, `Interview`, `Interviewer`, `InterviewFeedback`, `JobOffer`, `OfferTerm`, `StaffingPlan`, `EmployeeReferral`

### 3.8 [Training & Skill Assessments](05_MODULE_09_TRAINING_AND_SKILLS.md) (`training`) — UI `/training`
**Features:** programs, events, enrollment, feedback, results, skill catalogue, skill assessments, designation skill requirements, per-employee skill-gap analysis.
**Endpoints:** `POST/GET /training/programs`, `POST/GET /training/events`, `POST /training/events/:id/feedback`, `POST /training/events/:id/result`, `POST/GET /training/skills`, `POST /training/skills/assess`, `POST /training/designations/skills`, `GET /training/skills/gaps/:employeeId`
**Models:** `TrainingProgram`, `TrainingEvent`, `TrainingFeedback`, `TrainingResult`, `Skill`, `EmployeeSkillMap`, `DesignationSkill`

### 3.9 [Travel Desk](05_MODULE_10_TRAVEL_DESK.md) (`travel`) — UI `/travel`
**Features:** travel requests with manager decision, itineraries, employee advances with disbursement.
**Endpoints:** `POST/GET /travel/requests`, `PATCH /travel/requests/:id/decide`, `POST /travel/requests/:id/itinerary`, `GET /travel/advances`, `PATCH /travel/advances/:id/disburse`
**Models:** `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`

### 3.10 Holidays (`holidays`) — UI `/holidays`
`GET/POST /holidays`, `PATCH /holidays/:id/status` · Model: `Holiday` (MANDATORY/OPTIONAL types)

### 3.11 Insurance (`insurance`) — UI `/insurance`
Policies, dependents, claims with approve/reject. `GET/POST /insurance/policies|dependents|claims`, `PATCH /insurance/claims/:id/approve|reject` · Models: `EmployeeInsurance`, `InsuranceDependent`, `InsuranceClaim`, `BenefitItem`

### 3.12 Performance (`performance`) — UI `/performance`
**Features:** appraisal cycles CRUD, cycle activation and completion, appraisal templates (with KRA weights validation - sum must be 100), appraisal generation for cycles (bulk or selected), employee self-rating (scoped to own record), manager rating (scoped to direct reports), HR cycle completion (which suggests promotions or additional salary adjustments based on final scores), 360-degree employee feedback requests and response submissions.
**Workflow:** HR creates an Appraisal Template and adds KRAs with weights summing to 100 → HR creates an Appraisal Cycle and generates Appraisals for employees → Employee self-rates description/rating (1-5) on assigned template KRAs → Manager rates (1-5) direct report appraisals → HR completes cycle (final score calculated as weighted manager rating sum normalized to 5; scores above configured promotionThreshold suggest a draft promotion or salary structure revision).
**Endpoints:** `GET /performance` · `GET/POST /performance/cycles` · `GET/PATCH/DELETE /performance/cycles/:id` · `POST /performance/cycles/:id/activate` · `POST /performance/cycles/:id/complete` · `GET/POST/PATCH/DELETE /performance/templates` · `GET/POST /performance/appraisals` · `POST /performance/appraisals/create-for-cycle` · `GET /performance/appraisals/:id` · `POST /performance/appraisals/:id/self-rate` · `POST /performance/appraisals/:id/manager-rate` · `POST /performance/appraisals/:id/complete` · `POST/GET /performance/feedback/requests` · `POST /performance/feedback/requests/:id/respond`
**Models:** `AppraisalCycle`, `AppraisalTemplate`, `AppraisalKra`, `Appraisal`, `AppraisalGoal`, `FeedbackRequest`

### 3.13 Approvals (`approvals`) — UI `/approvals`
Cross-module inbox. `GET /approvals`, `POST /approvals/:module/:id/decision`

### 3.14 Organization (`organization`) — UI `/organization`
Org chart + manager reassignment. `GET /organization/chart`, `PATCH /organization/employees/:id/manager` · Models: `Company`, `Department`, `Designation`, `Location`

### 3.15 Dashboards / Analytics / Reports (`dashboard`, `analytics`, `reports`)
Role-specific dashboards: `GET /dashboard/admin|manager|employee|super-admin`. `GET /analytics`. Reports per domain + export: `GET /reports/employees|attendance|leave|payroll|expenses|compliance`, `POST /reports/export`

### 3.16 [Social Feed & Rewards](05_MODULE_11_SOCIAL_AND_REWARDS.md) (`rewards`, `social`) — UI `/rewards`, `/social`
Rewards: `GET /rewards`, `POST /rewards/vouchers|benefits|points|recognitions` · Models: `RewardVoucher`, `RewardLedger`, `RecognitionReward`.
Social (SkyNexus): `GET /social/feed`, `POST /social/posts`, `POST/DELETE /social/posts/:id/like`, `POST /social/posts/:id/comments` · Models: `SocialPost`, `SocialLike`, `SocialComment`

### 3.17 Notifications (`notifications`) — UI `/notifications`
`GET /notifications`, `GET /notifications/recipients`, `POST /notifications`, `PATCH /notifications/:id/sent` (channels: EMAIL / WHATSAPP — WhatsApp provider disabled in dev) · Model: `Notification`

### 3.18 Compliance (`compliance`) — UI `/compliance`
`GET /compliance`, `POST /compliance/export/:type` (PF/ESI/PT/TDS dashboards & exports)

### 3.19 Assets (`assets`) — UI `/assets`
`GET /assets`, `POST /assets/:assetTag/assign`, `POST /assets/:assetTag/return`

### 3.20 [Support Helpdesk](05_MODULE_12_SUPPORT_HELPDESK.md) (`tickets`) — UI `/support`
`POST/GET /tickets`, `GET /tickets/:id`, `POST /tickets/:id/comments`, `PATCH /tickets/:id/status` · Models: `Ticket`, `TicketComment`

### 3.21 [Settings & SaaS Administration](05_MODULE_13_SAAS_AND_SETTINGS.md) (`saas`, `settings`, `security`) — UI `/saas`, `/saas-admin`, `/settings`, `/setup`, `/security`
**Features:** tenant signup, plan catalogue (Basic ₹0 / Standard ₹1,749 / Pro ₹3,750 per month), plan selection, license refresh, invoicing, company status; company profile & branding (logo, primary color applied as CSS var), module toggles, client rules (attendance/leave/permissions rules consumed across the app), audit & system logs.
**Endpoints:** `POST /saas/signup`, `GET /saas`, `GET /saas/logs`, `PATCH /saas/companies/:id/status`, `POST /saas/invoice|license-refresh|select-plan`; `GET /settings/public-profile`, `GET/PATCH /settings/company`, `GET /settings/modules`, `PATCH /settings/modules/:module`, `GET/PATCH /settings/rules`, `GET /settings/logs`; `GET /audit-logs`
**Models:** `Plan`, `Subscription`, `Payment`, `ModuleSetting`, `ClientRule`, `AuditLog`, `ErrorLog`, `SystemLog`
**Plan gating:** `PlanGate` component locks Pro-only modules (e.g. Advanced Analytics) in the UI based on active plan.

### 3.22 Grievance (`grievance`) — UI `/grievance`
**Features:** grievance registration, anonymous reporting, category tagging, manager/admin assignment, resolution tracking, and investigation logs.
**Endpoints:** `POST /grievance` · `GET /grievance` · `GET /grievance/:id` · `PATCH /grievance/:id`
**Models:** `Grievance`

### 3.23 Health (`health`)
`GET /health` — liveness probe.

---

## 4. Cross-cutting behaviors
- **Multi-tenant middleware** auto-scopes queries by `companyId`/`tenantId` per request (and converts `findUnique`→`findFirst` with flattened compound keys — fixed 2026-06-11).
- **403 handling:** restricted roles receive `Missing required permission`; UI degrades gracefully (verified in the 3-role page sweep — these appear as expected console 403s, not crashes).
- **Audit logging:** mutations write `AuditLog` rows (visible at `/security`).
- **Data refresh bus:** UI broadcasts `skylinx:data-refresh` CustomEvents so option lists/tables reload after mutations.
