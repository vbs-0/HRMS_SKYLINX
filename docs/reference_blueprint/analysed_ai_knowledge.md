# SKYLINX PeopleOS: Master Project Knowledge & Roadmap

This document serves as the unified master reference of the **SKYLINX PeopleOS HRMS** project situation. It compiles all analysis, database schema mappings, API gaps, front-to-back layout interactions, and the implementation guidelines to execute the migration from the reference codebase ([hrms-16.8.0](file:///c:/Users/chbha/Desktop/skylinx/HRMS/hrms-16.8.0)) to our TypeScript monorepo.

---

## 1. Project Overview & Current State

### Tech Stack Architecture
* **Frontend**: Next.js (v15) App Router ([apps/web](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/web))
* **Backend**: NestJS REST API ([apps/api](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api))
* **ORM & Database**: Prisma Client with PostgreSQL ([packages/database](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database))
* **Shared Library**: Common TypeScript interfaces and schemas ([packages/shared](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/shared))

### Active System Metrics
* **Prisma Models**: 52 models implemented in `packages/database/prisma/schema.prisma`.
* **API Endpoints**: 88 active routes implemented across 24 controllers.
* **Frontend Pages**: Page folders prepared under `apps/web/app/` for 30 distinct UI routes.
* **Testing Setup**: Currently, no testing framework (Jest or Playwright) is active in the codebase configurations.
* **SaaS Capabilities**: Tenant isolation is controlled via a custom `TenantMiddleware` matching headers to the `Company` schema.

---

## 2. Reference Codebase Analysis (`hrms-16.8.0`)

The reference codebase is built on the **Frappe Framework** (a Python-based metadata-driven framework):
* **Modules**: Divided into `hr` (Human Resources, 118 DocTypes) and `payroll` (43 DocTypes).
* **Database Models**: Defined as JSON schemas (DocTypes) dynamically converted into MariaDB/Postgres tables by the framework.
* **Logic Hooks**: Exposes business processes via Python controller methods marked with the `@frappe.whitelist()` decorator (213 whitelisted functions found).
* **Mobile Client**: A hybrid Ionic Vue application (`frontend/`) for employee self-service.
* **Shift Roster Client**: A specialized Vite Single Page Application (`roster/`) for drag-and-drop roster grids.

---

## 3. The Gap Analysis: Prisma vs Frappe DocTypes

Our Prisma database schema ([schema.prisma](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma)) must be expanded to match the functional breadth of the reference.

### Implemented vs Missing Model Registry

| Area | Current Prisma Models | Missing Reference Models to Add |
| :--- | :--- | :--- |
| **Core HR & Directory** | `Company`, `Employee`, `Department`, `Designation`, `Location`, `Holiday` | `EmploymentType` (Permanent, Contractor, Intern), `EmployeeGrade` |
| **Recruitment ATS** | `JobPosting`, `Candidate`, `JobApplication`, `Interview` | `JobRequisition`, `Interviewer`, `InterviewRound`, `InterviewFeedback`, `JobOffer`, `OfferTerm` |
| **Employee Lifecycle** | `EmployeeDocument`, `EmployeeBankDetail` | `EmployeeOnboardingTemplate`, `EmployeeOnboardingActivity`, `EmployeeSeparationTemplate`, `EmployeeSeparationActivity`, `ExitInterview`, `FullAndFinalStatement`, `FullAndFinalAsset` |
| **Attendance & Roster** | `AttendanceLog`, `AttendanceRegularization`, `OvertimeRequest`, `Shift` | `ShiftAssignment`, `ShiftRequest`, `ShiftSchedule`, `ShiftScheduleAssignment`, `ShiftLocation` |
| **Travel & Expense** | `Expense` | `TravelRequest`, `TravelItinerary`, `EmployeeAdvance`, `PurposeOfTravel` |
| **Training & Skills** | *None* | `TrainingProgram`, `TrainingEvent`, `TrainingFeedback`, `TrainingResult`, `Skill`, `SkillAssessment`, `EmployeeSkillMap`, `DesignationSkill` |
| **Payroll & Benefits** | `SalaryStructure`, `PayrollRun`, `Payslip`, `PayrollComponent` | `EmployeeBenefitApplication`, `EmployeeBenefitClaim`, `EmployeeTaxExemptionDeclaration`, `EmployeeTaxExemptionProofSubmission`, `IncomeTaxSlab`, `TaxableSalarySlab`, `SalaryWithholdingCycle`, `Gratuity`, `GratuityRule`, `AdditionalSalary`, `Arrear` |

---

## 4. API Endpoint Integration Matrix

We need to add custom business controllers to NestJS to handle calculations, document workflows, and roster engines.

### Summary of New Endpoints by Module
1. **Recruitment ATS (`/api/v1/recruitment`)**:
   * Requisitions requests, Candidate pipeline transitions, Interview scorecards, and Job Offer generation.
2. **Employee Lifecycle (`/api/v1/employees`)**:
   * Onboarding/Separation checklist task status, Exit interviews, and Full & Final settlement calculations.
3. **Attendance & Roster (`/api/v1/attendance`)**:
   * Shift schedules, bulk shift assignments, shift swap requests, and processing biometric raw logs into attendance entries.
4. **Payroll & Indian Compliance (`/api/v1/payroll`)**:
   * Flexible benefits application/claims, annual tax declarations, tax proof uploads (80C, 80D, HRA), and additional salary adjustments.
5. **Training & Skills (`/api/v1/training`)**:
   * Training event schedules, student results, and employee skill matrix scorecards.
6. **Travel (`/api/v1/travel`)**:
   * Travel request approvals, booking itineraries, and travel cash advances.

---

## 5. Indian statutory Compliance Rules

Per CEO approval, the payroll calculations must follow local Indian labour laws:

### EPF (Employees Provident Fund)
* **Basis**: `Basic + Dearness Allowance (DA)`. Capped at **₹15,000** limit.
* **Employee Share**: **12%** of Basis.
* **Employer Share**: **12%** of Basis, divided into:
  * **EPS (Pension)**: **8.33%** (capped at maximum **₹1,250**).
  * **EPF (Provident Fund)**: Balance (**3.67%** + any excess over EPS cap).

### ESIC (Employees State Insurance)
* **Threshold**: Gross Monthly Salary **≤ ₹21,000**.
* **Employee Share**: **0.75%** of Gross Salary.
* **Employer Share**: **3.25%** of Gross Salary.

### PT (Professional Tax)
* **Cap**: Maximum **₹2,500** per year.
* **Maharashtra Slab**: ₹175/mo (Gross ₹7,501-10,000), ₹200/mo (Gross > ₹10,000 for 11 months), and ₹300 for February.
* **Karnataka Slab**: ₹200/mo for Gross > ₹25,000.

### Gratuity Payouts
* **Eligibility**: Min **5 years** of service.
* **Formula**: $\frac{15 \times \text{Last Drawn Basic Wage} \times \text{Years of Service}}{26}$.

### Income Tax (FY 2026-27 / AY 2027-28)
* **New Regime (Section 115BAC)**: Default. Standard deduction of **₹75,000**. Tax slabs: 0-3L (0%), 3-6L (5%), 6-9L (10%), 9-12L (15%), 12-15L (20%), >15L (30%).
* **Old Regime**: Optional. Standard deduction of **₹50,000**. Tax slabs: 0-2.5L (0%), 2.5-5L (5%), 5-10L (20%), >10L (30%).
* **Deductions (Old)**: Section 80C (up to 1.5L), Section 80D (up to 25k/50k), HRA Exemption (minimum of HRA received, Rent Paid minus 10% of basic, or 40%/50% of basic).

---

## 6. UI/UX Design System, Scrolls & Animations

To deliver a premium, responsive employee experience, the frontend implements the following design standards:

> [!IMPORTANT]
> **Design Directive**: All page structures, main dashboard tabs, navigation menus, and home buttons must align with and preserve the existing Next.js UI shell in our codebase. We will prioritize the design of our active frontend because it is more feasible, stable, and visually polished than the reference's hybrid Vue layout. Reference UI details are used solely to specify missing fields, validations, and custom modal inputs.


* **Theme & Colors**: Built using the Ionic HSL color variables. Primary action buttons map to `#3880ff`, success badges to `#2dd36f`, warnings to `#ffc409` (e.g. late checkin), and dangers to `#eb445a` (e.g. rejected expense claims).
* **Page Scrollbars**: Excludes default browser scrollbars. Requires rounded, thin webkit scrollbar thumbs (`width: 6px`) in `--ion-color-medium-tint` and root `scroll-behavior: smooth` transitions.
* **Modal Windows & Popups**: 
  * Center popups use a blur backdrop (`backdrop-filter: blur(4px)`, `rgba(0,0,0,0.5)`) with a zoom transition (`scale(0.95)` to `scale(1)` over `200ms`).
  * Mobile sheet drawers slide up from the bottom of the screen (`translateY(100%)` to `translateY(0)` over `300ms`) with a top handle for drag-to-dismiss gestures.
* **Drag-and-Drop Gestures**:
  * Roster scheduler calendar grids highlight with dashed borders on hover.
  * Dragged cards tilt by **2 degrees** (`rotate(2deg)`) and scale down to feel physically detached.
  * Recruitment Kanban cards support drag-and-drop to swap recruitment stages (e.g. Screening to Interview).
* **Mobile Swipe Actions**: Swiping a request row left triggers a red delete/reject action, and swiping right triggers a green checkmark/approve action.

---

## 7. Detailed Implementation & Execution Roadmap

We will work through the checklist in 4 sequential stages.

### Phase 1: Database Expansion & Recruitment Module
* **Prisma Updates**: Modify `schema.prisma` to add Recruitment models (`JobRequisition`, `Interviewer`, `InterviewRound`, `InterviewFeedback`, `JobOffer`, `OfferTerm`).
* **Regenerate client**: Run `npm run db:generate`.
* **NestJS Module**: Scaffold `apps/api/src/modules/recruitment` with controller, service, and DTOs.
* **Service Logic**: Write candidate stage transitions, interview scorecard metrics, and offer generator.
* **Next.js UI**: Implement recruitment layout grids, candidate detail drawers, and drag-and-drop interview scheduling boards.

### Phase 2: Shift Roster, Onboarding & Separation Workflows
* **Prisma Updates**: Add shift assignment, request, roster schedule, onboarding, separation, and exit interview tables.
* **NestJS Module**: Extend `attendance` module to handle shift roster assignments and auto-attendance calculations. Extend `employees` module to handle onboarding templates and offboarding tasks.
* **Next.js UI**: Create the drag-and-drop Shift Roster grid calendar and onboarding progress timelines.

### Phase 3: Indian Tax Compliance & Flexible Benefits
* **Prisma Updates**: Add tax slabs, benefit claims, declarations, proofs, and additional salary tables.
* **NestJS Module**: Implement the tax deduction engines (PF, ESI, PT) and HRA calculation formulas. Expose endpoints for tax proof uploads and benefits applications.
* **Next.js UI**: Create the tax declaration accordion, HRA rent receipt upload fields, and benefits claim portal.

### Phase 4: Training, Travel Modules & Testing Configuration
* **Prisma Updates**: Add training program, event, result, travel request, and advance payout models.
* **NestJS Modules**: Create `training` and `travel` modules.
* **Testing Setup**: Install Jest/Supertest in `apps/api` and Playwright in `apps/web`. Write unit tests for PF/ESI tax service logic and E2E routing verification for the main employee checkin and leave workflows.

---

## 8. Complete Sub-Endpoints Inventory (hrms/api)

These utility and helper routes exist in the reference codebase under `hrms/api/` and must be mapped to corresponding modules in the NestJS API:

### A. General Portal Helpers (`hrms/api/__init__.py`)
* `GET /auth/current-user-info` - Returns profile details of the logged-in user.
* `GET /employees/current-employee-info` - Returns core HR metadata for the employee profile.
* `GET /employees/all` - List basic details of all active employees.
* `GET /settings/hr-settings` - Retrieves general HR configurations.
* `GET /notifications/unread-count` - Returns unread message count for the dashboard indicator.
* `POST /notifications/mark-read-all` - Marks all notifications as read.
* `GET /notifications/push-status` - Checks if push notifications are configured/enabled.
* `GET /attendance/events` - Retrieves calendar event dates for checkin visualizations (`from_date`, `to_date`).
* `GET /attendance/shift-requests` - List shift swap/allocation requests for approval.
* `GET /attendance/regularization-requests` - List regularization requests.
* `GET /attendance/shifts` - Returns all available shift metadata configurations.
* `GET /leave/applications-list` - Returns leave applications list.
* `GET /leave/balance-map` - Returns a JSON map of leave type and balance details: `{ "Casual Leave": { "allocated": 10, "balance": 5 } }`.
* `GET /leave/holidays/:employeeId` - Retrieve state-wise holidays for the specific employee.
* `GET /leave/approval-details/:employeeId` - Returns leave approver names.
* `GET /leave/types/:employeeId` - Returns eligible leave types based on grade on a specific date.
* `GET /expenses/claims-list` - Returns expense claims list.
* `GET /expenses/summary` - Returns dashboard expense stats (total claimed, pending).
* `GET /expenses/types` - Retrieves expense categories.
* `GET /expenses/approval-details/:employeeId` - Returns designated expense managers.
* `GET /travel/advance-balance` - Returns active cash advance balances.
* `GET /settings/company-currencies` - Retrieves company multi-currency configuration.
* `GET /settings/currency-symbols` - Map of currency codes to symbols.
* `GET /expenses/cost-centers/:companyId` - Returns cost center accounts.
* `GET /attachments` - List uploaded files for a DocType and ID (`dt`, `dn`).
* `POST /attachments/upload` - Base64 file uploader.
* `DELETE /attachments/:filename` - Deletes uploaded receipt/document.
* `GET /attachments/download-pdf` - Generates PDF files on server for offline storage (`_download_pdf`).
* `GET /workflows/:doctype` - Returns approval state transitions (e.g. Draft -> Submitted -> Approved).
* `GET /workflows/permissions/:doctype` - Returns fields writeable by role in the current workflow state.

### B. Roster Scheduling APIs (`hrms/api/roster.py`)
* `GET /attendance/rosters/company` - Gets default company context.
* `GET /attendance/rosters/events` - Returns roster calendar schedules matching date filters.
* `GET /attendance/rosters/assignments/:id` - Retrieves detailed shift schedule assignments.
* `POST /attendance/rosters/assignments` - Assigns employee schedules.
* `DELETE /attendance/rosters/assignments/:id` - Deletes shift schedule assignments.
* `POST /attendance/rosters/swap` - Processes shift swap logic between two employees.
* `POST /attendance/rosters/break` - Pauses/breaks shift schedules for dates.
* `POST /attendance/rosters/insert` - Force inserts a custom shift on a specific day.

---

## 9. Indian Statutory Field & Database Configuration (Seeding)

To support local Indian compliance, the system must implement the following database additions and default seeds:
* **Pre-seeded Salary Components**: Basic, HRA, Arrear, Leave Encashment, Provident Fund (PF), and Professional Tax (PT).
* **Employee Compliance Additions**: `panNumber` (tax matching), `providentFundAccount` (UAN), `ifscCode` (bank transfers), and `micrCode`.
* **Company Profile Links**: Configures links to `basicComponentId`, `hraComponentId`, and `arrearComponentId`.
* **Tax Declaration Forms**: Tracks declared rent, metro-city checkbox, and dynamically calculates eligible HRA tax exemptions.
* **Tax Proof Submissions**: Verifies actual rent receipts, Lease dates, and final eligible HRA exemption amounts.
* **Gratuity Rule Settings**: Seeds `Indian Standard Gratuity Rule` with a minimum service requirement of 5 years and a multiplier slab fraction of `15 / 26` of Basic + DA.
