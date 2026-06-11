# Module 8 Specs: Onboarding & Separation Lifecycle

This document provides a comprehensive technical reference for the **Onboarding & Separation Lifecycle** module of SKYLINX PeopleOS HRMS, covering database models, backend NestJS controllers, frontend Next.js pages, role permissions, and end-to-end data flows.

---

## 1. Functional Purpose & Business Logic

The Lifecycle module orchestrates employee entries and exits, handling tasks lists, asset returns, exit interviews, and final settlements:

1.  **Onboarding Activities**:
    *   HR Admins create `EmployeeOnboardingTemplate` models (grouped by Department or Designation).
    *   Upon hiring, starting onboarding initializes individual tasks (`EmployeeOnboardingActivity`) mapped to owner roles (e.g. IT for laptops, HR for benefits setup).
    *   Once initialized, the candidate's profile is registered, moving their status from `INACTIVE` to `ACTIVE` upon task completion.
2.  **Separation Workflows**:
    *   Triggered when an employee resigns or is terminated.
    *   HR assigns an `EmployeeSeparationTemplate` to generate exit checklist activities (e.g., key cards return, credentials deactivation, final review).
3.  **Exit Surveys**:
    *   Captures feedback, reason for leaving, and exit date (`ExitInterview` model). Mapped to an interviewer from the company's employee listing.
4.  **Full & Final (F&F) Statements**:
    *   Compiles final payments and recoveries.
    *   **Auto-Suggestions Engine**: The API `/api/v1/employees/:id/ff-suggestions` fetches:
        *   Approved Gratuity amounts (calculated dynamically if tenure $\ge$ 5 years).
        *   Approved Leave Encashment values.
        *   Outstanding Loan balances.
    *   **Calculation Loop**: Calculates final dues by adding unpaid salary, gratuity, and leave encashment, then subtracting recovery costs (unreturned assets or outstanding loans) to yield the `netPayable` sum.
    *   **Asset Check-In**: Assets mapped during F&F (`FullAndFinalAsset` model) must be marked `RETURNED`. If marked `DAMAGED` or `LOST`, recovery costs are automatically appended to the deductions list.

### Dropdown Linkages & Connection Completion
*   **Source Fields**: 
    *   **Start Onboarding Form**: Fetches onboarding templates from `/api/v1/employees/onboarding/templates`.
    *   **Start Separation Form**: Fetches separation templates from `/api/v1/employees/separation/templates`.
    *   **Exit Interview Form**: Fetches interviewer listings (from active directory).
    *   **F&F Calculator Panel**: Automatically fetches suggest parameters (gratuity, encashments, outstanding loans).
*   **Dropdown Administration**:
    *   Templates (Checklist activities and roles assignments) are configured in the Lifecycle Settings page (`/settings/lifecycle`), writing to `EmployeeOnboardingTemplate` and `EmployeeSeparationTemplate` tables.
    *   Any changes made in these settings are instantly populated in the dropdown menus of the lifecycle console.

---

## 2. Detailed Schema & Database Mappings

The lifecycle module uses the following models in `packages/database/prisma/schema.prisma`:

*   **`EmployeeOnboardingTemplate`**:
    *   `id` (String CUID, Primary Key)
    *   `name` (String, e.g. "Engineering Onboarding")
    *   `departmentId` (String CUID, Optional)
    *   `designationId` (String CUID, Optional)
    *   `status` (String, Default: "ACTIVE")
*   **`EmployeeOnboardingActivity`**:
    *   `id` (String CUID, Primary Key)
    *   `templateId` (String CUID, Foreign Key to `EmployeeOnboardingTemplate.id`)
    *   `title` (String, e.g. "Configure Laptop")
    *   `description` (String, Optional)
    *   `assignedRole` (String, e.g. "IT_ADMIN")
*   **`EmployeeSeparationTemplate`**:
    *   `id` (String CUID, Primary Key)
    *   `name` (String, e.g. "Standard Exit Checklist")
    *   `status` (String, Default: "ACTIVE")
*   **`EmployeeSeparationActivity`**:
    *   `id` (String CUID, Primary Key)
    *   `templateId` (String CUID, Foreign Key to `EmployeeSeparationTemplate.id`)
    *   `title` (String, e.g. "Revoke Slack Access")
    *   `description` (String, Optional)
    *   `assignedRole` (String, e.g. "IT_ADMIN")
*   **`ExitInterview`**:
    *   `id` (String CUID, Primary Key)
    *   `employeeId` (String CUID, Foreign Key to `Employee.id`, Unique)
    *   `interviewerEmployeeId` (String CUID, Foreign Key to `Employee.id`, Optional)
    *   `exitDate` (DateTime)
    *   `reasonForLeaving` (String)
    *   `feedback` (String, Optional)
    *   `status` (String, Default: "PENDING")
*   **`FullAndFinalStatement`**:
    *   `id` (String CUID, Primary Key)
    *   `employeeId` (String CUID, Foreign Key to `Employee.id`, Unique)
    *   `exitDate` (DateTime)
    *   `resignationDate` (DateTime)
    *   `noticeDays` (Int, Default: 90)
    *   `lastDrawnSalary` (Decimal)
    *   `gratuityDues` (Decimal, Default: 0)
    *   `encashmentDues` (Decimal, Default: 0)
    *   `recoveryDues` (Decimal, Default: 0)
    *   `netPayable` (Decimal)
    *   `status` (Enum: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`)
*   **`FullAndFinalAsset`**:
    *   `id` (String CUID, Primary Key)
    *   `statementId` (String CUID, Foreign Key to `FullAndFinalStatement.id`)
    *   `assetName` (String)
    *   `serialNumber` (String, Optional)
    *   `returnedStatus` (String, Default: "PENDING") // PENDING, RETURNED, DAMAGED, LOST
    *   `recoveryCost` (Decimal, Default: 0)

---

## 3. NestJS API Controllers & Services

*   **Folder Location**: `apps/api/src/modules/employees`
*   **Controller**: `employees.controller.ts` (Lifecycle integration endpoints)
*   **Endpoints**:
    *   `POST /api/v1/employees/onboarding/templates`: Creates onboarding templates.
    *   `POST /api/v1/employees/:id/onboarding/start`: Selects candidate profile, initializes tasks, sets candidate status to `ACTIVE`.
    *   `POST /api/v1/employees/separation/templates`: Creates separation templates.
    *   `POST /api/v1/employees/:id/separation/start`: Initializes separation tasks, updates employee status to `EXITED`.
    *   `POST /api/v1/employees/:id/exit-interview`: Logs exit interview records.
    *   `GET /api/v1/employees/:id/ff-suggestions`: Fetches approved Gratuity, approved Leave Encashments, and outstanding Loan Balances to suggest F&F values.
    *   `POST /api/v1/employees/:id/full-and-final`: Submits calculated F&F statement, creating asset return slots.
    *   `PATCH /api/v1/employees/full-and-final/assets/:assetId`: Updates asset status (returned/lost/damaged) and computes recovery costs.

---

## 4. Next.js UI Screens & Multi-Role View Mappings

*   **Files**:
    *   `apps/web/app/employees/[id]/page.tsx` (exits tab)
    *   `apps/web/components/lifecycle-console.tsx`

### A. HR Admin View
*   **Access Requirements**: Role `HR_ADMIN` or `OWNER` with `employees.update`, `employees.approve`.
*   **UI Controls**:
    *   `Start Onboarding` / `Start Separation` buttons: Launches checklists modals.
    *   `Log Exit Interview` button: Opens exit survey form.
    *   `Open F&F Calculator` button: Loads parameters, queries suggestions, allows custom adjustments, and generates final payouts.
    *   `Verify Return` buttons inside F&F assets inventory checklist.

### B. Manager View
*   **Access Requirements**: Role `MANAGER` with `employees.read`.
*   **UI Controls**:
    *   Can view pending onboarding/separation task lists assigned to their subordinates.
    *   Can mark department-assigned onboarding tasks as resolved.
    *   Cannot calculate F&F statements or edit exit parameters.

### C. Employee View
*   **Access Requirements**: Role `EMPLOYEE` with self-scope permissions.
*   **UI Controls**:
    *   Sees personal onboarding dashboard. Can mark self-tasks (e.g. "Signed Policy Handbook") as completed.
    *   Completes exit interview questionnaire upon separation.
    *   Cannot view F&F statement structures or modify asset recovery costs.

---

## 5. End-to-End Cycle Flowchart

This flowchart outlines the complete employee lifecycle from entry onboarding to exit separation:

```mermaid
flowchart TD
    A[Candidate: Accepted Offer] --> B[HR Admin: Opens Directory, Clicks Add Employee]
    B -->|Submit Profile| C(DB: Insert Employee status = INACTIVE)
    C --> D[HR Admin: Click Start Onboarding]
    D -->|Select Template| E(API: POST /api/v1/employees/:id/onboarding/start)
    E -->|Copy Activities| F(DB: Create onboarding activity checklist logs)
    E -->|Update Profile| G(DB: Update employee status = ACTIVE)
    F -->|Task List| H[Employee & Assigned Roles: Mark checklist tasks completed]
    
    Note over H, I: Active Tenure (Employee works at the company)
    
    I[Employee Resigns / HR terminates] --> J[HR Admin: Click Start Separation]
    J -->|Select Separation Template| K(API: POST /api/v1/employees/:id/separation/start)
    K -->|Generate Checklist| L(DB: Create exit task checklists)
    K -->|Update Profile| M(DB: Update employee status = EXITED)
    
    M --> N[HR Admin: Clicks Submit Exit Interview]
    N -->|Input survey details| O(API: POST /api/v1/employees/:id/exit-interview)
    
    O --> P[HR Admin: Clicks Calculate F&F]
    P -->|Query Dues API| Q(API: GET /api/v1/employees/:id/ff-suggestions)
    Q -->|Suggest values| R[Calculate Gratuity, Leave Encashments, Outstanding Loans]
    R -->|Confirm statement| S(API: POST /api/v1/employees/:id/full-and-final)
    S -->|Create Recovery Records| T(DB: Insert FullAndFinalStatement & FullAndFinalAssets list)
    
    T --> U[HR Admin / IT: Click Verify Return next to asset items]
    U -->|Status = DAMAGED / LOST| V(API: PATCH /api/v1/employees/full-and-final/assets/:assetId)
    V -->|Deductions updated| W(DB: Update FullAndFinalStatement recoveryDues & netPayable)
    U -->|Status = RETURNED| X(DB: Update FullAndFinalAsset status = RETURNED)
    
    W & X --> Y[HR Admin: Clicks Approve Settlement]
    Y -->|Settle dues| Z(DB: Update FullAndFinalStatement status = APPROVED)
```
