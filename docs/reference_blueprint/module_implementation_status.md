# SKYLINX PeopleOS: Module Implementation & Status Directory

This document provides a detailed breakdown of the 13 core modules of the **SKYLINX PeopleOS HRMS** platform, mapping out the current implementation status (Prisma models, NestJS API files, and Next.js frontend pages) and the remaining development scope.

---

## Module 1: Authentication & Access Control (RBAC)
* **Status**: **90% Completed**
* **Purpose**: Manages secure multi-tenant user authentication, session tokens, OTP generation, and fine-grained permissions.

### Existing Implementation
* **Prisma Models**: [User](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L74), [Role](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L98), [Permission](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L112), [UserRole](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L123), [RolePermission](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L133), [OtpToken](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L143).
* **Backend API**: [auth.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/auth/auth.controller.ts) exposing `/auth/login`, `/auth/otp/request`, `/auth/otp/verify`, `/auth/forgot-password`, `/auth/me`.
* **Frontend Pages**: `/login` (with OTP toggle) and `/signup` routes.

### Remaining Scope
* Add two-factor authentication (2FA) switch in user profile.
* Set up token blacklist validation (for session logouts).

---

## Module 2: Employee Directory & Profiles
* **Status**: **60% Completed**
* **Purpose**: Core records container for work structures, bank details, and personal files.

### Existing Implementation
* **Prisma Models**: [Employee](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L199), [EmployeeDocument](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L248), [EmployeeBankDetail](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L263), [Department](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L154), [Designation](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L169), [Location](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L183).
* **Backend API**: [employees.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/employees/employees.controller.ts) (CRUD list/detail, bulk upload parser, document verify triggers).
* **Frontend Pages**: `/employees` (Directory, add employee modal), `/employees/[id]` (Tabbed profile page).

### Remaining Scope
* **Database**: Create `EmploymentType` and `EmployeeGrade` tables. Add `panNumber` and `providentFundAccount` columns to Employee.
* **Frontend**: Dynamic UI edit switches for Address, Family, and Education lists.

---

## Module 3: Attendance & Shift Roster
* **Status**: **30% Completed**
* **Purpose**: Controls employee checkins (GPS geofencing/biometrics), shift configurations, and manager approvals.

### Existing Implementation
* **Prisma Models**: [Shift](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L275), [AttendanceRule](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L287), [AttendanceLog](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L298), [AttendanceRegularization](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L323), [OvertimeRequest](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L341).
* **Backend API**: [attendance.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/attendance/attendance.controller.ts) (checkin, checkout, regularization, overtime, shift list).
* **Frontend Pages**: `/attendance` (Daily log list, request regularization drawers).

### Remaining Scope
* **Database**: Add `ShiftAssignment`, `ShiftRequest`, `ShiftSchedule`, `ShiftScheduleAssignment`, `ShiftLocation` tables.
* **Backend API**: Auto-attendance processor (runs daily to process raw logs against schedules). Add swap-shift and roster-calendar event endpoints.
* **Frontend**: Drag-and-drop Shift Roster planner dashboard.

---

## Module 4: Leave Management
* **Status**: **50% Completed**
* **Purpose**: Manages leave balances, requests, carry-forward allocations, and corporate leave block lists.

### Existing Implementation
* **Prisma Models**: [LeaveType](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L358), [LeaveBalance](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L374), [LeaveRequest](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L390).
* **Backend API**: [leave.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/leave/leave.controller.ts) (Leave balances, request submission, and manager approvals).
* **Frontend Pages**: `/leave` (Balances cards, history, apply leave modal).

### Remaining Scope
* **Database**: Add `LeaveBlockList`, `LeaveBlockListDate`, `LeavePeriod`, `LeavePolicy`, `LeavePolicyAssignment`, `LeaveLedgerEntry`.
* **Backend API**: Implements sandwich rule (calculates calendar days including holidays), leave encashment calculations, and leave allocation ledger entries.

---

## Module 5: Payroll & Indian statutory Compliance
* **Status**: **20% Completed**
* **Purpose**: The monthly salary engine. Handles base wages, deductions, incentives, tax declarations, and payslips.

### Existing Implementation
* **Prisma Models**: [SalaryStructure](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L410), [PayrollRun](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L430), [Payslip](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L446), [PayrollComponent](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L463).
* **Backend API**: [payroll.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/payroll/payroll.controller.ts) (Salary structure creation, payroll runs, calculate, lock, and bank exports).
* **Frontend Pages**: `/payroll` (Admin run list, execution wizard steps).

### Remaining Scope
* **Database**: Add `TaxExemptionDeclaration`, `TaxExemptionProofSubmission`, `IncomeTaxSlab`, `TaxableSalarySlab`, `AdditionalSalary`, `GratuityRule`, `Gratuity`, `Arrear` models.
* **Backend API**: Indian EPF, ESIC, Professional Tax, and Section 87A rebate calculation services. Tax proof validation, variable additional salary allocations, and HRA exemption formulas.
* **Frontend**: Tax Declaration Accordion & receipt upload drawer.

---

## Module 6: Expense Claims
* **Status**: **60% Completed**
* **Purpose**: Employee expense submissions and reimbursement auditing.

### Existing Implementation
* **Prisma Models**: [Expense](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L487).
* **Backend API**: [expenses.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/expenses/expenses.controller.ts) (Submit claim, manager approval, HR audit, and reimbursement flag).
* **Frontend Pages**: `/expenses` (Claim history lists, receipt dropzone uploader).

### Remaining Scope
* Add expense category rules (e.g. limit caps by employee grade).
* Generate cash advance links to adjust balances automatically.

---

## Module 7: Recruitment ATS (Applicant Tracking)
* **Status**: **10% Completed**
* **Purpose**: Applicant hiring portal. Vacancies, candidate logs, interview pipelines, and offer letters.

### Existing Implementation
* **Prisma Models**: [JobPosting](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L560), [Candidate](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L577), [JobApplication](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L591), [Interview](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L608).
* **Backend API**: *None* (No controller or module exists in `apps/api/src/modules`).
* **Frontend Pages**: `/recruitment` (Empty container router).

### Remaining Scope
* **Database**: Add `JobRequisition`, `Interviewer`, `InterviewRound`, `InterviewFeedback`, `JobOffer`, `OfferTerm`.
* **Backend API**: Create `recruitment` module, controller, and service to support job requisition workflow, scheduler calendars, interviewer feedback scorecards, and salary offer generators.
* **Frontend**: Kanban Board and candidate detail slide-over drawers.

---

## Module 8: Onboarding & Separation Lifecycle
* **Status**: **10% Completed**
* **Purpose**: Checklist task assignments for new hires and exiting employees.

### Existing Implementation
* **Prisma Models**: *None*.
* **Backend API**: *None*.
* **Frontend Pages**: *None*.

### Remaining Scope
* **Database**: Create `EmployeeOnboardingTemplate`, `EmployeeOnboardingActivity`, `EmployeeSeparationTemplate`, `EmployeeSeparationActivity`, `ExitInterview`, `FullAndFinalStatement`, `FullAndFinalAsset`.
* **Backend API**: Create lifecycle triggers when hiring or initiating resignations, and the Full and Final (F&F) payout calculator.
* **Frontend**: Task lists and exit questionnaires.

---

## Module 9: Training & Skill Assessments
* **Status**: **10% Completed**
* **Purpose**: Tracks corporate courses, training events, and employee skill scorecards.

### Existing Implementation
* **Prisma Models**: [BenefitItem](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L715) (generic benefit helper).
* **Backend API**: *None*.
* **Frontend Pages**: *None*.

### Remaining Scope
* **Database**: Create `TrainingProgram`, `TrainingEvent`, `TrainingResult`, `Skill`, `SkillAssessment`, `EmployeeSkillMap`.
* **Backend API**: Create `training` module to register attendees, record course evaluations, and verify skills.
* **Frontend**: Skills directory and course catalog.

---

## Module 10: Travel Management
* **Status**: **0% Completed**
* **Purpose**: Corporate travel proposals and cash advances.

### Existing Implementation
* **Prisma Models**: *None*.
* **Backend API**: *None*.
* **Frontend Pages**: *None*.

### Remaining Scope
* **Database**: Create `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`.
* **Backend API**: Create `travel` module to approve flights, track booking reference logs, and payout cash advances.
* **Frontend**: Travel authorization forms.

---

## Module 11: Internal Social Feed & Rewards
* **Status**: **80% Completed**
* **Purpose**: Boosts employee engagement via company-wide announcements, posts, and rewards.

### Existing Implementation
* **Prisma Models**: [SocialPost](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L637), [SocialLike](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L657), [SocialComment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L668), [RewardVoucher](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L678), [RewardLedger](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L690), [RecognitionReward](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L702).
* **Backend API**: [social.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/social/social.controller.ts) (Feed, post, like/unlike, comments) and [rewards.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/rewards/rewards.controller.ts) (vouchers, benefits, points ledger, recognition).
* **Frontend Pages**: `/social` (News feed cards, likes, comments) and `/rewards` (points, vouchers grid).

### Remaining Scope
* Implement birthday automation cron job (submits anniversary posts to the feed).

---

## Module 12: Support Helpdesk
* **Status**: **80% Completed**
* **Purpose**: Internal ticket queue for IT, payroll, or facilities inquiries.

### Existing Implementation
* **Prisma Models**: [Ticket](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L810), [TicketComment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L830).
* **Backend API**: [tickets.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/tickets/tickets.controller.ts) (Ticket CRUD, post comments, update status).
* **Frontend Pages**: `/support` (My tickets list, open ticket form).

### Remaining Scope
* Add automatic ticket assignment algorithms (allocates tickets to HR agents based on queue loads).

---

## Module 13: Settings & SaaS Administration
* **Status**: **90% Completed**
* **Purpose**: System settings, feature switches, subscription billing, and audit logs.

### Existing Implementation
* **Prisma Models**: [ModuleSetting](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L746), [ClientRule](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L758), [Plan](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L773), [Subscription](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L785), [Payment](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L799), [AuditLog](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma#L726).
* **Backend API**: [settings.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/settings/settings.controller.ts) (Rules settings, enabled modules, audit logger) and [saas.controller.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/saas/saas.controller.ts) (SaaS signup, plan select, company status triggers).
* **Frontend Pages**: `/settings` (Company profiles, toggle module toggles) and `/saas-admin` (subscription billing console).

### Remaining Scope
* Configure daily PostgreSQL backups and restore execution points.
