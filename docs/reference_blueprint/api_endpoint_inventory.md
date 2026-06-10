# API Endpoints Inventory & Route Mapping

This document provides a detailed catalog of the existing API routes inside the Skylinx NestJS backend ([apps/api/src/modules](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules)) and details all missing API endpoints that must be integrated to achieve compatibility with the reference [hrms-16.8.0](file:///c:/Users/chbha/Desktop/skylinx/HRMS/hrms-16.8.0) whitelisted Python logic.

---

## 1. Existing Endpoints vs Missing Endpoints Summary

Your codebase has **88 active HTTP routes** implemented across 24 NestJS controllers. However, there are **213 custom whitelisted backend methods** in the reference codebase. Below is the checklist of missing APIs that must be built:

* [x] Core Authentication Endpoints
* [x] Basic Employee Directory CRUD
* [x] Basic Attendance Check-In/Check-Out
* [x] Basic Leave Request & Approval
* [x] Basic Payroll Run Calculations
* [ ] **Missing**: Recruitment ATS Module APIs
* [ ] **Missing**: Onboarding & Offboarding Lifecycle Workflows
* [ ] **Missing**: Advanced Shift Scheduling & Roster tools
* [ ] **Missing**: Employee Flexible Benefits & Claims APIs
* [ ] **Missing**: Annual Tax Investment Declarations & Proof Audits
* [ ] **Missing**: Employee Training Events & Skill Assessments
* [ ] **Missing**: Corporate Travel Proposals & Booking Itineraries

---

## 2. Detailed API Route Mapping by Module

### A. Recruitment ATS Module (NEW MODULE)
* **API Prefix**: `/api/v1/recruitment`
* **Controller File**: `apps/api/src/modules/recruitment/recruitment.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/requisitions` | `recruitment.create` | `{ departmentId, title, openings, budget, reason }` | `{ id, ticketNumber, status: "PENDING" }` | Request department headcount budget approval. |
| **POST** | `/job-postings` | `recruitment.create` | `{ title, departmentId, locationId, openings, description }` | `{ id, title, status: "OPEN" }` | Open a new job vacancy. |
| **POST** | `/candidates` | `recruitment.create` | `{ fullName, email, phone, resumeUrl, source }` | `{ id, fullName, currentStage: "SCREENING" }` | Add candidate and upload resume. |
| **PATCH** | `/applications/:id/stage` | `recruitment.update` | `{ stage: "INTERVIEW" \| "OFFER" \| "HIRED" }` | `{ id, stage }` | Transition job application stage. |
| **POST** | `/interviews` | `recruitment.update` | `{ applicationId, interviewerEmployeeId, scheduledAt, mode }` | `{ id, status: "SCHEDULED" }` | Schedule candidate interview. |
| **POST** | `/interviews/:id/feedback` | `recruitment.update` | `{ rating, comments, recommendation: "HIRE" \| "REJECT" }` | `{ id, status: "COMPLETED", rating }` | Submit interviewer scorecard. |
| **POST** | `/job-offers` | `recruitment.approve` | `{ applicationId, offeredCtc, joiningDate, offerTerms: [] }` | `{ id, offerLetterUrl, status: "DRAFT" }` | Generate offer letter linked to salary structure. |

---

### B. Employee Onboarding & Offboarding
* **API Prefix**: `/api/v1/employees`
* **Controller File**: `apps/api/src/modules/employees/employees.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/onboarding/templates` | `employees.update` | `{ name, activities: [{ title, department, assigneeId }] }` | `{ id, name }` | Define onboarding checklist templates. |
| **POST** | `/:id/onboarding/start` | `employees.update` | `{ templateId }` | `{ onboardingId, status: "IN_PROGRESS" }` | Trigger hiring onboarding tasks. |
| **POST** | `/:id/separation/start` | `employees.update` | `{ separationDate, reason }` | `{ separationId, status: "IN_PROGRESS" }` | Trigger offboarding tasks. |
| **POST** | `/:id/exit-interview` | `employees.update` | `{ interviewerId, feedback, keysReturned: bool }` | `{ exitInterviewId, status: "SAVED" }` | Log exit interview results. |
| **POST** | `/:id/full-and-final` | `employees.approve` | `{ noticeDaysServed, encashedLeaves, assetDeductions }` | `{ payslipId, grossPay, deductions, netPay }` | Compute final settlement paycheck. |

---

### C. Advanced Shift Scheduling & Rosters
* **API Prefix**: `/api/v1/attendance`
* **Controller File**: `apps/api/src/modules/attendance/attendance.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/shifts/assign` | `attendance.update` | `{ employeeId, shiftId, fromDate, toDate }` | `{ id, employeeId, shiftId }` | Schedule worker shift. |
| **POST** | `/shifts/bulk-assign` | `attendance.update` | `{ employeeIds: [], shiftId, fromDate, toDate }` | `{ success: true, count: N }` | Bulk assign roster schedule. |
| **POST** | `/shifts/requests` | `attendance.read` | `{ requestedShiftId, reason, date }` | `{ id, status: "PENDING" }` | Request shift swap/change. |
| **POST** | `/shifts/process-auto` | `attendance.update` | `{ date }` | `{ status: "COMPLETED", processedRecords: N }` | Process daily biometric raw check-ins. |

---

### D. Flexible Benefits & Indian Tax Declarations
* **API Prefix**: `/api/v1/payroll`
* **Controller File**: `apps/api/src/modules/payroll/payroll.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/benefits/apply` | `payroll.read` | `{ year, components: [{ componentId, amount }] }` | `{ id, status: "PENDING" }` | Submit flexible allowance configuration. |
| **POST** | `/benefits/claims` | `payroll.read` | `{ componentId, amount, receiptUrl }` | `{ id, status: "PENDING" }` | Claim flexible allowances. |
| **POST** | `/tax-declarations` | `payroll.read` | `{ year, regime: "NEW" \| "OLD", items: [] }` | `{ id, status: "PENDING" }` | Declare annual tax exemptions (80C, 80D, HRA). |
| **POST** | `/tax-proofs` | `payroll.read` | `{ declarationId, category, amount, documentUrl }` | `{ id, status: "PENDING" }` | Submit PDF/receipt proofs. |
| **PATCH** | `/tax-proofs/:id/verify` | `payroll.approve` | `{ status: "APPROVED" \| "REJECTED", reason }` | `{ id, status }` | Approve tax exemption receipt. |
| **POST** | `/additional-salary` | `payroll.update` | `{ employeeId, componentId, amount, date, type: "EARNING" \| "DEDUCTION" }` | `{ id, employeeId }` | Award bonus or charge advance. |
| **POST** | `/gratuity/calculate` | `payroll.read` | `{ employeeId }` | `{ yearsOfService, gratuityAmount }` | Calculate final gratuity payout. |

---

### E. Corporate Training & Skill Assessment (NEW MODULE)
* **API Prefix**: `/api/v1/training`
* **Controller File**: `apps/api/src/modules/training/training.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/programs` | `training.create` | `{ title, description, courseOutline }` | `{ id, title }` | Define corporate courses. |
| **POST** | `/events` | `training.create` | `{ programId, trainerName, scheduledFrom, scheduledTo }` | `{ id, status: "SCHEDULED" }` | Schedule classroom session. |
| **POST** | `/events/:id/employees` | `training.update` | `{ employeeIds: [] }` | `{ id, attendeesCount }` | Enroll employees. |
| **POST** | `/events/:id/results` | `training.update` | `{ results: [{ employeeId, status: "PASS" \| "FAIL", feedback }] }` | `{ success: true }` | Log training assessment results. |
| **POST** | `/skills/assess` | `training.update` | `{ employeeId, skillId, rating: 1-5 }` | `{ id, status: "VERIFIED" }` | Grade employee competencies. |

---

### F. Travel Proposals (NEW MODULE)
* **API Prefix**: `/api/v1/travel`
* **Controller File**: `apps/api/src/modules/travel/travel.controller.ts`

| Method | Route Path | Access Permission | Request Payload / Params | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/requests` | `travel.create` | `{ purpose, fromDate, toDate, costEstimate }` | `{ id, status: "PENDING" }` | Apply for travel approval. |
| **POST** | `/requests/:id/itinerary` | `travel.update` | `{ type: "FLIGHT" \| "HOTEL", description, bookingRef }` | `{ id }` | Record itinerary bookings. |
| **POST** | `/requests/:id/advance` | `travel.update` | `{ amount, reason }` | `{ id, amount, status: "PENDING" }` | Request upfront advance payout. |

---

## 3. Reference Utility & Sub-Endpoints (hrms/api)

These routes are grouped in the reference directory `hrms/api/` as general endpoints for employee portal dashboards, attachments, and specific shift-roster calendars:

### A. General Portal Helpers (`hrms/api/__init__.py`)
* **NestJS Alignment**: Should be added as generic helper routes in relevant modules (e.g. `auth`, `notifications`, `attendance`, `leave`, `expenses`).

* `GET /auth/current-user-info` - Returns profile details of the logged-in user.
* `GET /employees/current-employee-info` - Returns core HR metadata for the employee profile.
* `GET /employees/all` - List basic details of all active employees (combines ID and name).
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
* **NestJS Alignment**: Add to `apps/api/src/modules/attendance/attendance.controller.ts`.

* `GET /attendance/rosters/company` - Gets default company context (`get_default_company`).
* `GET /attendance/rosters/events` - Returns roster calendar schedules matching date filters (`get_events`).
* `GET /attendance/rosters/assignments/:id` - Retrieves detailed shift schedule assignments.
* `POST /attendance/rosters/assignments` - Assigns employee schedules (`create_shift_schedule_assignment`).
* `DELETE /attendance/rosters/assignments/:id` - Deletes shift schedule assignments.
* `POST /attendance/rosters/swap` - Processes shift swap logic between two employees (`swap_shift`).
* `POST /attendance/rosters/break` - Pauses/breaks shift schedules for dates (`break_shift`).
* `POST /attendance/rosters/insert` - Force inserts a custom shift on a specific day (`insert_shift`).

