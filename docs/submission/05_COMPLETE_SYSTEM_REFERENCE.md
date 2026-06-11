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
| Unit tests | Jest — 8 suites / 43 tests (auth, attendance, employees, payroll…) | `apps/api/src/**/*.spec.ts` |
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
| performance | ALL | read/configure | — | — |
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
| OWNER (super admin) | skylinxcode@gmail.com | password123 |
| HR_ADMIN | hr.admin@skylinx.local | Skylinx@123 |
| MANAGER | rohan.iyer@skylinx.local | Skylinx@123 |
| EMPLOYEE | kabir.sethi@skylinx.local | Skylinx@123 |

---

## 3. Modules — features, workflow, endpoints, data models

All endpoints are prefixed `http://localhost:4000/api/v1`. Extracted from the controllers on 2026-06-11.

### 3.1 Authentication (`auth`)
**Workflow:** login (email+password) → JWT access token stored client-side → `GET /auth/me` hydrates session; OTP request/verify and forgot-password flows for recovery.
**Endpoints:** `POST /auth/login` · `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/forgot-password` · `GET /auth/me`
**Models:** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `OtpToken`

### 3.2 Employees (`employees`) — UI `/employees`
**Features:** directory, profile CRUD, bulk upload, document upload+verification, grades, employment types, onboarding/separation templates & runs, exit interviews, Full & Final settlement with asset recovery.
**Workflow:** HR creates employee → assigns dept/designation/location/manager/grade → uploads documents → (exit) start separation → exit interview → F&F statement → settle assets.
**Endpoints:** `GET/POST /employees`, `POST /employees/bulk-upload`, `GET/PATCH /employees/:id`, `GET /employees/documents`, `POST /employees/:id/documents[/upload]`, `PATCH /employees/:id/documents/:documentId/verify`, `POST/GET /employees/onboarding/templates`, `POST /employees/:id/onboarding/start`, `POST/GET /employees/separation/templates`, `POST /employees/:id/separation/start`, `POST/GET /employees/:id/exit-interview`, `POST/GET /employees/:id/full-and-final`, `PATCH /employees/full-and-final/assets/:assetId`, `POST /employees/grades`, `GET /employees/grades/:companyId`, `POST /employees/types`, `GET /employees/types/:companyId`
**Models:** `Employee`, `EmployeeDocument`, `EmployeeBankDetail`, `EmployeeGrade`, `EmploymentType`, `EmployeeOnboarding*`, `EmployeeSeparation*`, `ExitInterview`, `FullAndFinalStatement`, `FullAndFinalAsset`

### 3.3 Attendance (`attendance`) — UI `/attendance`
**Features:** check-in/out, logs, regularization requests + approval, overtime requests, shift types, single/bulk shift assignment, shift change requests + decisions, schedules, auto-processing.
**Workflow:** employee checks in/out → log created → missed punch? employee raises regularization → manager approves → log corrected. Shifts: HR assigns; employee requests change; manager decides.
**Endpoints:** `GET /attendance/logs`, `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/shifts`, `GET/POST /attendance/regularizations`, `PATCH /attendance/regularizations/:id/approve`, `POST /attendance/overtime`, `POST /attendance/shifts/assign`, `POST /attendance/shifts/bulk-assign`, `POST/GET /attendance/shifts/requests`, `PATCH /attendance/shifts/requests/:id/decide`, `GET /attendance/shifts/assignments`, `POST /attendance/shifts/process-auto`
**Models:** `Shift`, `ShiftAssignment`, `ShiftRequest`, `ShiftSchedule`, `ShiftLocation`, `AttendanceRule`, `AttendanceLog`, `AttendanceRegularization`, `OvertimeRequest`

### 3.4 Leave (`leave`) — UI `/leave`
**Features:** leave types, balances, apply/approve/reject, policies + assignments, ledger entries, block lists (blackout dates), sandwich-rule validation.
**Workflow:** HR defines types & policies → policy assignment grants balances → employee applies (validated against balance, block-list dates, sandwich rule) → manager/HR approves → balance decremented + ledger entry.
**Endpoints:** `GET/POST /leave/types`, `PATCH /leave/types/:id`, `GET/POST /leave/assignments`, `POST /leave/assignments/delete`, `GET /leave/balances`, `GET/POST /leave/requests`, `PATCH /leave/requests/:id/approve|reject`, `POST /leave/block-lists`, `GET /leave/block-lists/:companyId`, `POST /leave/block-lists/:id/dates`, `GET /leave/ledger/:employeeId`, `POST /leave/policies`, `GET /leave/policies/:companyId`, `POST /leave/policies/assign`, `GET /leave/policies/assignments/:companyId`
**Models:** `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeavePolicy`, `LeavePolicyAssignment`, `LeaveLedgerEntry`, `LeaveBlockList`, `LeaveBlockListDate`

### 3.5 Payroll (`payroll`) — UI `/payroll`
**Features:** salary structures, payroll runs (create → calculate → lock), payslips, bank export, benefit applications/claims, tax exemption declarations + proof submissions with decisions, additional salary; Indian statutory components (PF/ESI/PT/TDS — see `docs/reference_blueprint/indian_tax_compliance.md`).
**Workflow:** HR defines salary structure per employee → creates monthly run → calculate (generates payslips with earnings/deductions) → review → lock → bank export file.
**Endpoints:** `GET/POST /payroll/salary-structures`, `GET/POST /payroll/runs`, `POST /payroll/runs/:id/calculate`, `POST /payroll/runs/:id/lock`, `GET /payroll/runs/:id/payslips`, `POST /payroll/runs/:id/bank-export`, `POST /payroll/benefits/apply`, `GET /payroll/benefits/applications`, `POST /payroll/benefits/claim`, `GET /payroll/benefits/claims`, `PATCH /payroll/benefits/claims/:id/decide`, `POST /payroll/tax-declarations`, `GET /payroll/tax-declarations/:employeeId`, `POST/GET /payroll/tax-proofs`, `PATCH /payroll/tax-proofs/:id/decide`, `POST/GET /payroll/additional-salary`
**Models:** `SalaryStructure`, `PayrollRun`, `Payslip`, `PayrollComponent`, `AdditionalSalary`, `EmployeeBenefitApplication`, `EmployeeBenefitClaim`, `EmployeeTaxExemptionDeclaration`, `EmployeeTaxExemptionProofSubmission`

### 3.6 Expenses (`expenses`) — UI `/expenses`
**Features:** claims with category + receipt URL, grade-based caps (live UI warning when amount exceeds the employee's grade `maxExpenseLimit`), two-stage approval (manager → HR), reject, reimburse.
**Workflow:** employee submits claim → if amount > grade cap, backend rejects with 400 + UI warning → manager approves → HR approves → reimbursed.
**Endpoints:** `GET/POST /expenses`, `PATCH /expenses/:id/manager-approve`, `PATCH /expenses/:id/hr-approve`, `PATCH /expenses/:id/reject`, `PATCH /expenses/:id/reimburse`
**Models:** `Expense`, `EmployeeGrade` (cap source), `EmployeeAdvance`

### 3.7 Recruitment (`recruitment`) — UI `/recruitment`
**Features:** requisitions with decision flow, job postings, candidates, applications with stage moves, interviews + multi-interviewer feedback with consensus, offers with terms.
**Workflow:** requisition → approve → posting → candidate → application → stage transitions → interviews → feedback (HIRE/HOLD/REJECT consensus) → offer.
**Endpoints:** `POST/GET /recruitment/requisitions`, `PATCH /recruitment/requisitions/:id/decide`, `POST/GET /recruitment/job-postings`, `POST/GET /recruitment/candidates`, `POST /recruitment/applications`, `PATCH /recruitment/applications/:id/stage`, `GET /recruitment/applications/posting/:postingId`, `POST/GET /recruitment/interviews`, `POST /recruitment/interviews/:id/feedback`, `POST/GET /recruitment/job-offers`, `GET /recruitment/job-offers/:id`
**Models:** `JobRequisition`, `JobPosting`, `Candidate`, `JobApplication`, `InterviewRound`, `Interview`, `Interviewer`, `InterviewFeedback`, `JobOffer`, `OfferTerm`

### 3.8 Training & Skills (`training`) — UI `/training`
**Features:** programs, events, enrollment, feedback, results, skill catalogue, skill assessments, designation skill requirements, per-employee skill-gap analysis.
**Endpoints:** `POST/GET /training/programs`, `POST/GET /training/events`, `POST /training/events/:id/feedback`, `POST /training/events/:id/result`, `POST/GET /training/skills`, `POST /training/skills/assess`, `POST /training/designations/skills`, `GET /training/skills/gaps/:employeeId`
**Models:** `TrainingProgram`, `TrainingEvent`, `TrainingFeedback`, `TrainingResult`, `Skill`, `EmployeeSkillMap`, `DesignationSkill`

### 3.9 Travel Desk (`travel`) — UI `/travel`
**Features:** travel requests with manager decision, itineraries, employee advances with disbursement.
**Endpoints:** `POST/GET /travel/requests`, `PATCH /travel/requests/:id/decide`, `POST /travel/requests/:id/itinerary`, `GET /travel/advances`, `PATCH /travel/advances/:id/disburse`
**Models:** `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`

### 3.10 Holidays (`holidays`) — UI `/holidays`
`GET/POST /holidays`, `PATCH /holidays/:id/status` · Model: `Holiday` (MANDATORY/OPTIONAL types)

### 3.11 Insurance (`insurance`) — UI `/insurance`
Policies, dependents, claims with approve/reject. `GET/POST /insurance/policies|dependents|claims`, `PATCH /insurance/claims/:id/approve|reject` · Models: `EmployeeInsurance`, `InsuranceDependent`, `InsuranceClaim`, `BenefitItem`

### 3.12 Performance (`performance`) — UI `/performance`
`GET /performance`, `POST /performance/cycle` (cycle scaffold; full appraisal/KRA engine is a roadmap item — see gap analysis)

### 3.13 Approvals (`approvals`) — UI `/approvals`
Cross-module inbox. `GET /approvals`, `POST /approvals/:module/:id/decision`

### 3.14 Organization (`organization`) — UI `/organization`
Org chart + manager reassignment. `GET /organization/chart`, `PATCH /organization/employees/:id/manager` · Models: `Company`, `Department`, `Designation`, `Location`

### 3.15 Dashboards / Analytics / Reports (`dashboard`, `analytics`, `reports`)
Role-specific dashboards: `GET /dashboard/admin|manager|employee|super-admin`. `GET /analytics`. Reports per domain + export: `GET /reports/employees|attendance|leave|payroll|expenses|compliance`, `POST /reports/export`

### 3.16 Rewards & Social (`rewards`, `social`) — UI `/rewards`, `/social`
Rewards: `GET /rewards`, `POST /rewards/vouchers|benefits|points|recognitions` · Models: `RewardVoucher`, `RewardLedger`, `RecognitionReward`.
Social (SkyNexus): `GET /social/feed`, `POST /social/posts`, `POST/DELETE /social/posts/:id/like`, `POST /social/posts/:id/comments` · Models: `SocialPost`, `SocialLike`, `SocialComment`

### 3.17 Notifications (`notifications`) — UI `/notifications`
`GET /notifications`, `GET /notifications/recipients`, `POST /notifications`, `PATCH /notifications/:id/sent` (channels: EMAIL / WHATSAPP — WhatsApp provider disabled in dev) · Model: `Notification`

### 3.18 Compliance (`compliance`) — UI `/compliance`
`GET /compliance`, `POST /compliance/export/:type` (PF/ESI/PT/TDS dashboards & exports)

### 3.19 Assets (`assets`) — UI `/assets`
`GET /assets`, `POST /assets/:assetTag/assign`, `POST /assets/:assetTag/return`

### 3.20 Tickets / Support (`tickets`) — UI `/support`
`POST/GET /tickets`, `GET /tickets/:id`, `POST /tickets/:id/comments`, `PATCH /tickets/:id/status` · Models: `Ticket`, `TicketComment`

### 3.21 SaaS & Settings (`saas`, `settings`, `security`) — UI `/saas`, `/saas-admin`, `/settings`, `/setup`, `/security`
**Features:** tenant signup, plan catalogue (Basic ₹0 / Standard ₹1,749 / Pro ₹3,750 per month), plan selection, license refresh, invoicing, company status; company profile & branding (logo, primary color applied as CSS var), module toggles, client rules (attendance/leave/permissions rules consumed across the app), audit & system logs.
**Endpoints:** `POST /saas/signup`, `GET /saas`, `GET /saas/logs`, `PATCH /saas/companies/:id/status`, `POST /saas/invoice|license-refresh|select-plan`; `GET /settings/public-profile`, `GET/PATCH /settings/company`, `GET /settings/modules`, `PATCH /settings/modules/:module`, `GET/PATCH /settings/rules`, `GET /settings/logs`; `GET /audit-logs`
**Models:** `Plan`, `Subscription`, `Payment`, `ModuleSetting`, `ClientRule`, `AuditLog`, `ErrorLog`, `SystemLog`
**Plan gating:** `PlanGate` component locks Pro-only modules (e.g. Advanced Analytics) in the UI based on active plan.

### 3.22 Health (`health`)
`GET /health` — liveness probe.

---

## 4. Cross-cutting behaviors
- **Multi-tenant middleware** auto-scopes queries by `companyId`/`tenantId` per request (and converts `findUnique`→`findFirst` with flattened compound keys — fixed 2026-06-11).
- **403 handling:** restricted roles receive `Missing required permission`; UI degrades gracefully (verified in the 3-role page sweep — these appear as expected console 403s, not crashes).
- **Audit logging:** mutations write `AuditLog` rows (visible at `/security`).
- **Data refresh bus:** UI broadcasts `skylinx:data-refresh` CustomEvents so option lists/tables reload after mutations.
