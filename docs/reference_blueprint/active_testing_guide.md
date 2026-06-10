# SKYLINX PeopleOS HRMS: Active Testing Guide & Progress Tracker

This document serves as your operational guide for our **automated testing infrastructure**. It outlines what is already implemented, how to run tests, and the testing checklist for each module to ensure 100% test coverage and track our progress systematically.

---

## 1. What is Already Done (Existing Codebase Status)

We have verified that the monorepo builds cleanly and compiles with zero TypeScript errors. The following core elements are already implemented:

### Database & Seeding
* **Database Engine**: PostgreSQL database `skylinx_peopleos` created locally.
* **Prisma Schema**: Pushed 52 active models representing employees, payroll runs, settings, and social feeds.
* **Seed Script**: Successfully executed. Populates the DB with:
  * 1 Admin User (`admin@skylinx.com` / `Admin@123`)
  * 1 Employee User (`employee@skylinx.com` / `Employee@123`)
  * Default Department, Designation, Location, Company settings, and SaaS billing plans.

### Active API Modules (NestJS)
We verified the following 21 controller endpoints are fully loaded and listening:
* `/auth`: Authentication, OTP, Password Reset, and profile retrieval.
* `/employees`: Employee directory list, detail profiles, and identity document approvals.
* `/attendance`: Check-in coordinates validation, overtime requests, and regularizations.
* `/leave`: Allocation rules, quotas balances, and manager leave approvals.
* `/payroll`: CTC structure creation, monthly runs, net pay generation, and bank file exports.
* `/expenses`: Claim audits, category approvals, and reimbursement releases.
* `/social` & `/rewards`: Feed post, commenting, points rewards logs, and vouchers claim stores.
* `/tickets`: Support ticket creation and Hr comment threads.
* `/settings` & `/saas`: SaaS portal administration, billing logs, and tenant module toggles.

### Testing Infrastructure Setup
* **Test Runner**: Jest configured with `ts-jest` for compilation-free executions in NestJS.
* **Dependencies**: Installed `jest`, `ts-jest`, `@types/jest`, `supertest`, and `@types/supertest`.
* **Config File**: Setup **[jest.config.js](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/jest.config.js)** to automatically scan and match `.spec.ts` files inside `apps/api/src`.
* **Verify Test Run**: Wrote our first unit test **[auth.service.spec.ts](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/api/src/modules/auth/auth.service.spec.ts)** verifying AuthService mocks, which compiles and passes successfully in **4.0s**.

---

## 2. Testing Framework CLI Commands

To run tests in the monorepo, execute these commands from the root directory:

| Command | Target Scope | Description |
| :--- | :--- | :--- |
| `npm run test -w @skylinx/api` | **NestJS API** | Runs all unit and integration test suites. |
| `npm run test:cov -w @skylinx/api` | **NestJS API** | Runs tests and generates a code coverage percentage report. |
| `npx playwright test` | **Next.js Web** | Runs browser-level automated end-to-end user tests. |

---

## 3. Module-by-Module Testing Checklist

As we proceed to implement the missing modules sequentially, we will write and run targeted unit/integration tests for each. Here is the checklist to track:

### Phase 1: Recruitment ATS
* [ ] **Unit Tests**:
  * Verify `JobRequisition` creation and budget limit checking logic.
  * Test candidate status transitions (`SCREENING` ➔ `INTERVIEW` ➔ `OFFER` ➔ `HIRED`).
  * Verify `JobOffer` details match salary structure requirements.
* [ ] **Integration Tests**:
  * `/api/v1/recruitment/requisitions` - Headcount requests approvals.
  * `/api/v1/recruitment/interviews/:id/feedback` - Scorecard evaluations submission.
* [ ] **Verification**:
  * Execute: `npm run test -w @skylinx/api` (Verify Phase 1 test suites pass).

### Phase 2: Shift Roster, Onboarding & Exit Lifecycles
* [ ] **Unit Tests**:
  * Test auto-attendance calculations (determine late-marks and absent tags based on shift grace minutes).
  * Verify full & final salary settlement payout mathematics.
* [ ] **Integration Tests**:
  * `/api/v1/attendance/shifts/assign` - Shift schedules allocation.
  * `/api/v1/employees/onboarding/start` - Task templates triggers.
* [ ] **Verification**:
  * Execute: `npm run test -w @skylinx/api` (Verify Phase 2 test suites pass).

### Phase 3: Payroll Calculations & Indian Statutory Compliance
* [ ] **Unit Tests**:
  * Test EPF (Provident Fund) contribution cap rules (₹15,000 basic wages ceiling limit).
  * Test ESIC gross wages limit rules (₹21,000 threshold).
  * Test Professional Tax (PT) brackets by state.
  * Test Gratuity equations `(15/26 * Basic * Years of Service)`.
  * Test income tax old/new slab computations and Section 87A rebates.
* [ ] **Integration Tests**:
  * `/api/v1/payroll/tax-declarations` - Declarations and attachment proofs uploads.
  * `/api/v1/payroll/runs/:id/calculate` - Net salary component generation.
* [ ] **Verification**:
  * Execute: `npm run test -w @skylinx/api` (Verify Phase 3 compliance math).

### Phase 4: Training & Travel Management
* [ ] **Unit Tests**:
  * Verify course evaluate score calculations and attendee maps.
  * Test cash advances adjustments against travel expense tickets.
* [ ] **Integration Tests**:
  * `/api/v1/training/events` - Enrolments and logs.
  * `/api/v1/travel/requests` - Advance approvals.
* [ ] **Verification**:
  * Execute: `npm run test -w @skylinx/api` (Verify Phase 4 test suites pass).
