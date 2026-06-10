# SKYLINX PeopleOS HRMS: Detailed Module Gap Analysis

This document provides a highly detailed gap analysis and structural overview of the **13 core modules** of the **SKYLINX PeopleOS HRMS** platform, mapping out the current implementation (Prisma models, NestJS API routes, and Next.js frontend pages) against the reference Frappe HRMS codebase (`hrms-16.8.0`).

---

## 1. Authentication & Access Control (RBAC)
* **Category**: Core Infrastructure
* **Status**: **90% Completed**
* **Purpose**: Multi-tenant user signup, secure password hash logins, session validation, OTP token flows, and role-based action permissions.

### Implemented Architecture
* **Prisma Models**:
  * [User](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L74): Custom ID, `email`, `phone`, `passwordHash`, `status` (enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`), `tenantId` (foreign key to `Company`), `employeeId` (unique foreign key to `Employee`).
  * [Role](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L98): `name`, `description`, `isSystemRole` flag, and `tenantId` mapping.
  * [Permission](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L112): `module` name (e.g. `employees`, `payroll`) and `action` name (e.g. `read`, `create`, `update`, `delete`, `approve`).
  * [UserRole](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L123) & [RolePermission](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L133): Join models establishing many-to-many relationships.
  * [OtpToken](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L143): Holds temporary OTP hashes, expirations, and channel types (`EMAIL`, `WHATSAPP`, `SMS`).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/auth](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/auth)
  * Endpoints (`auth.controller.ts`):
    * `POST /auth/login`: Email & password authentication, returns JWT access and refresh tokens.
    * `POST /auth/otp/request`: Generates and emails an OTP using standard nodemailer configs.
    * `POST /auth/otp/verify`: Validates input OTP token, returning user session payload.
    * `POST /auth/forgot-password`: Generates reset token and emails security link.
    * `GET /auth/me`: Retrieves current session data from request JWT headers.
  * Guards: `JwtAuthGuard` and `PermissionsGuard` (enforce `@RequirePermissions` decorator checks).
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/login/page.tsx` rendering `login-form.tsx` with email/password input and a toggle for OTP code inputs.
  * Route: `apps/web/app/signup/page.tsx` for multi-tenant company onboarding registration.

### Gap Analysis & Missing Scope
* **Missing Database Models**: None.
* **Missing Backend Endpoints**:
  * `POST /auth/logout`: Revokes and blacklists session refresh tokens in Redis.
  * `POST /auth/2fa/toggle`: Enforces or disables MFA check on logins.
* **Missing Business Logic**:
  * Integration with Redis cache for JWT blacklist management.
  * Multi-factor authentication verification checking via Authenticator App (TOTP).

---

## 2. Employee Directory & Profiles
* **Category**: Core HR records
* **Status**: **60% Completed**
* **Purpose**: Houses employee demographic data, corporate relationships, bank account details, and mandatory compliance ID uploads.

### Implemented Architecture
* **Prisma Models**:
  * [Employee](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L199): Maps employee demographics: `firstName`, `lastName`, `email`, `phone`, `gender`, `joiningDate`, `employmentType`, `status` (enum: `ACTIVE`, `INACTIVE`, `EXITED`), and organizational links (`departmentId`, `designationId`, `locationId`, `managerId`).
  * [EmployeeDocument](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L248): Holds scanned IDs: `documentType`, `fileUrl`, `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`), and expirations.
  * [EmployeeBankDetail](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L263): Standard financial mapping: `accountHolderName`, `bankName`, `accountNumberEncrypted`, `ifsc`, and `branch`.
  * [Department](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L154): Holds `name`, `code`, and manager assignments.
  * [Designation](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L169): Defines job hierarchy titles and grade links.
  * [Location](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L183): Establishes geographic address mappings.
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/employees](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/employees)
  * Endpoints (`employees.controller.ts`):
    * `GET /employees`: Retrieves list of employees filtered by tenant company.
    * `POST /employees`: Creates a new employee entry.
    * `POST /employees/bulk-upload`: Parses a JSON payload of array data for bulk importing.
    * `GET /employees/:id`: Detailed view including relations.
    * `PATCH /employees/:id`: Updates fields.
    * `POST /employees/:id/documents/upload`: Local disk storage interceptor uploading PDF/images.
    * `PATCH /employees/:id/documents/:documentId/verify`: Admin verification action updates status.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/employees/page.tsx` rendering list displays with search bars and filters.
  * Route: `apps/web/app/employees/[id]/page.tsx` rendering side navigation tabs (Details, Identity Docs, Bank Details, Assets).

### Gap Analysis & Missing Scope
* **Missing Database Models / Columns**:
  * Models: `EmploymentType` and `EmployeeGrade` tables to enforce strict grade caps.
  * Columns: `panNumber` and `providentFundAccount` strings need to be added to `Employee` for statutory filings.
* **Missing Backend Endpoints**:
  * `POST /employees/grades`: Endpoints to create and configure salary and expense limits by grade.
* **Missing Business Logic**:
  * Multi-field encryption for `panNumber` and `providentFundAccount` on save.

---

## 3. Attendance & Shift Roster
* **Category**: Time & Attendance
* **Status**: **30% Completed**
* **Purpose**: Coordinates check-in geofences, daily shift allocations, overtime requests, and late-mark regulations.

### Implemented Architecture
* **Prisma Models**:
  * [Shift](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L275): Configures shifts: `startTime`, `endTime`, `graceMinutes`, and `halfDayMinutes`.
  * [AttendanceRule](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L287): Multi-tenant toggles for GPS checkins, selfie uploads, or biometric locks.
  * [AttendanceLog](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L298): Individual check-ins: `checkInAt`, `checkOutAt`, `checkInLatitude`, `checkInLongitude`, and status (`PRESENT`, `LATE`, `ABSENT`, `HALF_DAY`, `HOLIDAY`).
  * [AttendanceRegularization](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L323): Manager approvals for missing clock times.
  * [OvertimeRequest](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L341): Standard overtime hour submissions.
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/attendance](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/attendance)
  * Endpoints (`attendance.controller.ts`):
    * `POST /attendance/check-in` & `check-out`: Enforces checkin log updates.
    * `POST /attendance/regularizations`: Submits regularization adjustments.
    * `PATCH /attendance/regularizations/:id/approve`: Approves regularizations and modifies log times.
    * `POST /attendance/overtime`: Submits overtime requests.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/attendance/page.tsx` rendering monthly calendars, regularization requests drawer, and the current GPS coordinates map.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `ShiftAssignment`: Maps employee ID to shifts on specific dates.
  * `ShiftRequest`: Shift swap requests between employees.
  * `ShiftSchedule`: Sets up repeating schedule rosters.
  * `ShiftScheduleAssignment`: Links employee groups to schedule patterns.
  * `ShiftLocation`: Specific company branch geofence coordinates.
* **Missing Backend Endpoints**:
  * `POST /attendance/shifts/assign` & `bulk-assign`: Core roster planning inputs.
  * `POST /attendance/shifts/requests`: Submit shift swap workflow.
  * `POST /attendance/shifts/process-auto`: Triggers automatic parsing comparing raw logs to shift start times to log late marks or absent statuses.
  * `POST /attendance/upload`: Endpoint for bulk processing biometric CSV logs.
* **Missing Business Logic**:
  * Daily night scheduler cron job evaluating shift times + grace minutes against checkins.
  * Location-based distance formulas calculating if the employee coordinates are inside the authorized geofence radius.

---

## 4. Leave Management
* **Category**: Time Off
* **Status**: **50% Completed**
* **Purpose**: Configures leave policies, tracks available quotas, processes employee requests, and applies sandwich rules.

### Implemented Architecture
* **Prisma Models**:
  * [LeaveType](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L358): Configures `annualQuota`, `carryForwardAllowed`, and `sandwichRuleEnabled`.
  * [LeaveBalance](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L374): Tracks `openingBalance`, `accrued`, `used`, and `available` for each employee.
  * [LeaveRequest](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L390): Holds requests: `fromDate`, `toDate`, `days` count, and status (`PENDING`, `APPROVED`, `REJECTED`).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/leave](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/leave)
  * Endpoints (`leave.controller.ts`):
    * `GET /leave/types` & `POST /leave/types`: Enforces leave types configurations.
    * `POST /leave/assignments`: Assigns leaves to employees.
    * `GET /leave/balances`: Fetches current employee quotas.
    * `POST /leave/requests`: Applies for time off (calculates days difference).
    * `PATCH /leave/requests/:id/approve` & `reject`: Approves and subtracts balance quotas.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/leave/page.tsx` rendering leave balances cards, request logs, and approval flow tables.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `LeaveBlockList` & `LeaveBlockListDate`: Prevents applying for leave on critical operational days.
  * `LeavePeriod`: Enforces yearly financial calendar frames (e.g. Apr 1 - Mar 31).
  * `LeavePolicy` & `LeavePolicyAssignment`: Groups leave types into policy sets.
  * `LeaveLedgerEntry`: Logs all credit/debit events for audit tracks.
* **Missing Backend Endpoints**:
  * `POST /leave/block-lists`: Admin block lists.
  * `POST /leave/encash`: Computes leave cashout totals for payroll.
* **Missing Business Logic**:
  * **Sandwich Rule calculation**: If holidays or weekend off days fall between two leave request days, they are counted as leaves.
  * Automated leave balance accrual scheduler (runs monthly/quarterly).

---

## 5. Payroll & Indian statutory Compliance
* **Category**: Compensation & Compliance
* **Status**: **20% Completed**
* **Purpose**: High-fidelity monthly salary compilation, TDS slabs estimation, HRA tax exemptions, and Indian compliance integrations (EPF, ESIC, PT, Gratuity).

### Implemented Architecture
* **Prisma Models**:
  * [SalaryStructure](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L410): Holds structure: `effectiveFrom`, `annualCtc`, `basic`, `hra`, `allowances`, and manual statutory amounts.
  * [PayrollRun](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L430): Tracks runs by `month` and `year`.
  * [Payslip](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L446): Final payslips: `grossPay`, `deductions`, `netPay` fields.
  * [PayrollComponent](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L463): Lists component details (e.g., Earning: Basic, Deduction: PF).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/payroll](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/payroll)
  * Endpoints (`payroll.controller.ts`):
    * `POST /payroll/salary-structures`: Saves structures.
    * `POST /payroll/runs`: Creates monthly payroll records.
    * `POST /payroll/runs/:id/calculate`: Loops through company employees, retrieves active structures, calculates deductions, and writes payslip components.
    * `POST /payroll/runs/:id/lock`: Locks payroll run, releasing claims and updating expense stats.
    * `GET /payroll/runs/:id/payslips` & `bank-export`: Outputs bank format files.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/payroll/page.tsx` rendering monthly salary lists, salary structure creator, and run generation wizard.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `EmployeeTaxExemptionDeclaration`: Stores annual investment declarations.
  * `EmployeeTaxExemptionProofSubmission`: Stores files verifying declarations.
  * `IncomeTaxSlab` & `TaxableSalarySlab`: Configures tax brackets.
  * `AdditionalSalary`: Dynamic bonus/arrear values for specific months.
  * `Gratuity` & `GratuityRule`: Gratuity calculation mapping structures.
* **Missing Backend Endpoints**:
  * `POST /payroll/tax-declarations` & `proof-submissions`: Enables employee tax filings.
  * `POST /payroll/additional-salary`: Applies one-time bonuses or deductions.
  * `POST /payroll/gratuity/calculate`: Computes retirement payouts.
* **Missing Business Logic**:
  * **Indian Statutory Formulas**:
    * **EPF (Employees' Provident Fund)**: 12% of Basic Salary (with wage cap limit of ₹15,000).
    * **ESIC (Employee State Insurance)**: 0.75% Employee, 3.25% Employer contribution (limit Gross wage cap ₹21,000).
    * **Professional Tax (PT)**: Custom state slab ranges (e.g., Maharashtra max ₹2,500/year, Karnataka ₹200/month).
    * **Gratuity**: `(15 / 26) * Last Drawn Basic * Years of Service` (after 5-year floor).
    * **Income Tax Regime (Old/New)**: Section 87A rebate and standard deductions.
  * HRA exemption calculation algorithm.

---

## 6. Expense Claims
* **Category**: Finance
* **Status**: **60% Completed**
* **Purpose**: Employee travel/incident expense request pipelines, manager reviews, and payout coordination.

### Implemented Architecture
* **Prisma Models**:
  * [Expense](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L487): Stores claims: `category`, `amount`, `receiptUrl`, `claimDate`, and status (`PENDING`, `APPROVED`, `REJECTED`, `PAID`).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/expenses](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/expenses)
  * Endpoints (`expenses.controller.ts`):
    * `GET /expenses`: Lists employee claims.
    * `POST /expenses`: Creates new expense claim.
    * `PATCH /expenses/:id/approve` & `reject`: Manager approval updates status.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/expenses/page.tsx` rendering expense submit forms and receipt image preview cards.

### Gap Analysis & Missing Scope
* **Missing Database Models**: None.
* **Missing Backend Endpoints**:
  * `GET /expenses/categories/rules`: Retrieves category limits by grade.
* **Missing Business Logic**:
  * Grade caps calculation (rejects claims exceeding configured limits).

---

## 7. Recruitment ATS (Applicant Tracking)
* **Category**: Talent Acquisition
* **Status**: **10% Completed** (Only Database models exist)
* **Purpose**: Headcount requisition approvals, vacancy postings, candidate applications, interview schedulers, scorecards, and offer letters.

### Implemented Architecture
* **Prisma Models**:
  * [JobPosting](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L560): Holds vacancies status, openings, and company link.
  * [Candidate](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L577): Holds candidate demographics and current stage.
  * [JobApplication](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L591): Connects candidate to posting and lists application stage (`SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`).
  * [Interview](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L608): Holds scheduled date, interviewer, and feedback text.
* **Backend NestJS API**:
  * **0% Completed**: No NestJS controllers or services exist.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/recruitment` is an empty router path.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `JobRequisition`: Department manager headcount request.
  * `Interviewer` & `InterviewRound`: Custom interview stage groupings.
  * `InterviewFeedback`: Grid scorecard (ratings 1-5, comment, recommendation).
  * `JobOffer` & `OfferTerm`: Formats salary components and joining terms.
* **Missing Backend Endpoints**:
  * Create `apps/api/src/modules/recruitment` folder.
  * Expose CRUD endpoints: `/requisitions`, `/job-postings`, `/candidates`, `/applications/:id/stage`, `/interviews`, and `/job-offers`.
* **Missing Business Logic**:
  * Headcount budget deduction checking on vacancy creation.
  * Offer letter PDF generator service.
* **Missing Frontend Pages**:
  * Kanban Board for job applicants.
  * Drag-and-drop Interview scheduling and scorecard drawer.

---

## 8. Onboarding & Separation Lifecycle
* **Category**: Talent Operations
* **Status**: **10% Completed** (Only conceptual roadmap)
* **Purpose**: Automates tasks for incoming or outgoing employees (IT setup, asset returns, notice periods, and final payouts).

### Implemented Architecture
* **0% Completed**: No models, NestJS API modules, or frontend routes exist.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `EmployeeOnboardingTemplate` & `EmployeeOnboardingActivity`: Checklist configurations.
  * `EmployeeSeparationTemplate` & `EmployeeSeparationActivity`: Departure checklists.
  * `ExitInterview`: Exiting feedback logs.
  * `FullAndFinalStatement`: notice periods, asset lists, gratuity, and final payments.
* **Missing Backend Endpoints**:
  * Create lifecycle module endpoints to trigger onboarding/exit task assignments.
  * `POST /employees/:id/full-and-final/calculate`: Computes salary dues, recovery offsets, and notice period buyouts.
* **Missing Business Logic**:
  * Automatic onboarding triggers on candidate status `HIRED`.
* **Missing Frontend Pages**:
  * Lifecycle Checklist widgets for employees and HR admins.

---

## 9. Training & Skill Assessments
* **Category**: Talent Development
* **Status**: **10% Completed**
* **Purpose**: Oversees corporate course calendars, tracks feedback, records training results, and manages employee skill maps.

### Implemented Architecture
* **Prisma Models**:
  * [BenefitItem](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L715): Basic placeholder fields.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `TrainingProgram`, `TrainingEvent`, `TrainingFeedback`, `TrainingResult`, `Skill`, `SkillAssessment`, `EmployeeSkillMap`, `DesignationSkill`.
* **Missing Backend Endpoints**:
  * Create training module endpoints to register courses, manage events, and write skill evaluations.
* **Missing Frontend Pages**:
  * Training dashboard showing registered courses and assessment scorecard grids.

---

## 10. Travel Management
* **Category**: Expense Operations
* **Status**: **0% Completed**
* **Purpose**: Coordinates business travel proposals, schedules itineraries, and manages upfront cash advances.

### Implemented Architecture
* **0% Completed**: No models, NestJS routes, or frontend pages exist.

### Gap Analysis & Missing Scope
* **Missing Database Models**:
  * `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`, `PurposeOfTravel`.
* **Missing Backend Endpoints**:
  * Create travel module endpoints to submit, approve travel plans, and record upfront cash payouts.
* **Missing Frontend Pages**:
  * Travel request forms and itinerary cards.

---

## 11. Internal Social Feed & Rewards
* **Category**: Employee Engagement
* **Status**: **80% Completed**
* **Purpose**: Boosts team engagement via company feeds, posts, comments, and redemption vouchers.

### Implemented Architecture
* **Prisma Models**:
  * [SocialPost](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L637) & [SocialLike](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L657) & [SocialComment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L668).
  * [RewardVoucher](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L678) & [RewardLedger](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L690) & [RecognitionReward](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L702).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/social](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/social) and [rewards](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/rewards)
  * Endpoints: Post CRUD, comments, points adjustments, voucher redemptions, and peer recognition.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/social/page.tsx` rendering news feeds and comments.
  * Route: `apps/web/app/rewards/page.tsx` rendering points leaderboard and voucher store.

### Gap Analysis & Missing Scope
* **Missing Database Models**: None.
* **Missing Backend Endpoints**:
  * `POST /social/announcements`: Admin company alerts.
* **Missing Business Logic**:
  * Cron scheduling automatic birthday/work anniversary posts.

---

## 12. Support Helpdesk
* **Category**: Employee Self-Service
* **Status**: **80% Completed**
* **Purpose**: Centralized ticket management queue for internal IT, facilities, and payroll inquiries.

### Implemented Architecture
* **Prisma Models**:
  * [Ticket](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L810): `ticketNumber`, `subject`, `status` (`Open`, `In Progress`, `Closed`), and priority.
  * [TicketComment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L830): Conversational replies.
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/tickets](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/tickets)
  * Endpoints (`tickets.controller.ts`): Ticket CRUD and comments posting.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/support/page.tsx` rendering ticket tables and message panels.

### Gap Analysis & Missing Scope
* **Missing Database Models**: None.
* **Missing Backend Endpoints**: None.
* **Missing Business Logic**:
  * Automated ticket assignment algorithms (distributes open tickets to HR agents based on active load queue).

---

## 13. Settings & SaaS Administration
* **Category**: System Management
* **Status**: **90% Completed**
* **Purpose**: General multi-tenant configurations, billing subscriptions, and audit logs.

### Implemented Architecture
* **Prisma Models**:
  * [ModuleSetting](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L746) & [ClientRule](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L758).
  * [Plan](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L773) & [Subscription](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L785) & [Payment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L799) & [AuditLog](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L726).
* **Backend NestJS API**:
  * Folder: [apps/api/src/modules/settings](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/settings) & [saas](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/saas)
  * Endpoints: Rule configuration, tenant module switches, subscription checks, and audit logging.
* **Frontend Next.js Pages**:
  * Route: `apps/web/app/settings/page.tsx` rendering rules controls, and module toggle screens.
  * Route: `apps/web/app/saas-admin/page.tsx` rendering subscription plan selectors and transaction history.

### Gap Analysis & Missing Scope
* **Missing Database Models**: None.
* **Missing Business Logic**:
  * Billing invoice generator integration and backup crons.

---

## Verification & Execution Guide
To run and manually verify the current codebase:

1. **Docker Services**: Start Postgres and Redis:
   ```bash
   docker-compose up -d
   ```
2. **Database Schema Setup**: Verify model syncing:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
3. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend: [http://localhost:4000](http://localhost:4000)
