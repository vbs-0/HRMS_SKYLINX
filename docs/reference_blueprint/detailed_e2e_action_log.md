# SKYLINX PeopleOS: Detailed E2E Verification & Action Log

This log documents every action, mouse click, text input, visual transition, and system response captured during the comprehensive E2E roles and permissions verification.

---

## 1. HR_ADMIN Audit Log (`hr.admin@skylinx.local`)

### Step 1.1: Authentication & Dashboard
* **Action**: Entered email `hr.admin@skylinx.local` and password `Skylinx@123` into the sign-in form. Clicked the **"Sign In"** button.
* **UI Reaction**: Successful login. Redirected to the primary dashboard (`/`).
* **Visuals Verified**: Metric widgets loaded successfully: Active workforce count (5), Present today (0), Pending leaves (2), Net payroll value (INR 1,04,033), and Approvals (2).
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN/01_dashboard.png`

### Step 1.2: Employee Directory & Grade Configuration
* **Action**: Clicked on the **"Directory"** option in the sidebar navigation.
* **UI Reaction**: Loaded the employee grid showing all active staff.
* **Action**: Opened the profile panel for Kabir Sethi, clicked **"Edit Profile"**, updated the **"Grade"** dropdown to **"Grade L1"**, and clicked **"Save Profile"**.
* **UI Reaction**: Successfully updated employee details in database.
* **Screenshot References**: 
  - `docs/reference_blueprint/images/HR_ADMIN/02_directory.png` (Directory screen)
  - `docs/reference_blueprint/images/HR_ADMIN/03_profile_grade.png` (Kabir Sethi's profile with Grade L1 saved)

### Step 1.3: Attendance Management & regularizations
* **Action**: Navigated to the **"Attendance"** page via the sidebar.
* **UI Reaction**: Displayed the organization attendance logs and rosters.
* **Visuals Verified**: Detailed check-in/out logs table with geolocation maps.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN/04_attendance.png`

### Step 1.4: Leave Sandwich Rule & Block Lists
* **Action**: Navigated to the **"Leave"** page, toggled **"Admin View"**, clicked **"Leave Block Lists"** tab, and added `2026-06-25` as a blackout date. Toggled back to **"HR View"**, clicked **"Apply Leave"**, selected Kabir Sethi, Sick Leave, and entered `2026-06-25` to `2026-06-25`.
* **UI Reaction**: Form submission rejected with red banner: `"Cannot apply for leave on 2026-06-25 as it is a blocked period"`.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN/05_leave_blocked_error.png`

### Step 1.5: Expense Claims Grade Caps Check
* **Action**: Navigated to the **"Expense Payout"** tab. Clicked **"New Claim"**, selected **Kabir Sethi**, category **Travel**, and typed amount `6000`.
* **UI Reaction**: Displayed warning: `"Warning: Amount exceeds employee's grade maximum expense limit of ₹5000."`
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN/06_expense_warning.png`

### Step 1.6: Recruitment & Training Boards
* **Action**: Navigated to the **"Recruitment"** page.
* **UI Reaction**: Loaded candidate status boards and requisition tracking pipelines.
* **Action**: Navigated to **"Training & Skills"** page.
* **UI Reaction**: Loaded designation competencies map and course schedule boards.
* **Screenshot References**:
  - `docs/reference_blueprint/images/HR_ADMIN/07_recruitment.png`
  - `docs/reference_blueprint/images/HR_ADMIN/08_training.png`

### Step 1.7: Travel Desk & Logout
* **Action**: Clicked the **"Travel Desk"** option in sidebar.
* **UI Reaction**: Renders flights/stays itinerary lists.
* **Action**: Clicked the **"Logout"** button on the header.
* **UI Reaction**: Cleared token and redirected to the login screen.
* **Screenshot References**:
  - `docs/reference_blueprint/images/HR_ADMIN/09_travel.png`
  - `docs/reference_blueprint/images/HR_ADMIN/10_logged_out.png`

---

## 2. MANAGER Audit Log (`rohan.iyer@skylinx.local`)

### Step 2.1: Login & Dashboard
* **Action**: Entered email `rohan.iyer@skylinx.local` and password `Skylinx@123` into the login screen. Clicked **"Sign In"**.
* **UI Reaction**: Successfully loaded manager profile. Redirected to the dashboard page (`/`).
* **Visuals Verified**: Metric counters filtered to department scope.
* **Screenshot Reference**: `docs/reference_blueprint/images/MANAGER/01_dashboard.png`

### Step 2.2: Leave Approvals Queue
* **Action**: Clicked on the **"Leave"** navigation link in sidebar.
* **UI Reaction**: Loaded pending leave request queues with Approve and Reject actions.
* **Screenshot Reference**: `docs/reference_blueprint/images/MANAGER/02_leave.png`

### Step 2.3: Expense Approvals Queue
* **Action**: Clicked on the **"Expense Payout"** link in sidebar.
* **UI Reaction**: Loaded pending department claim lists with Approve/Reject actions.
* **Screenshot Reference**: `docs/reference_blueprint/images/MANAGER/03_expenses.png`

### Step 2.4: Recruitment Board (API Verification)
* **Action**: Clicked on the **"Recruitment"** link in sidebar.
* **UI Reaction**: Loaded the Recruitment Workspace, displaying whitelisted 403 API warning since the manager has access to interviewer screens but is blocked from HR admin settings.
* **Screenshot Reference**: `docs/reference_blueprint/images/MANAGER/04_recruitment.png`

---

## 3. EMPLOYEE Audit Log (`kabir.sethi@skylinx.local`)

### Step 3.1: Login & Dashboard
* **Action**: Entered email `kabir.sethi@skylinx.local` and password `Skylinx@123` on login page. Clicked **"Sign In"**.
* **UI Reaction**: Redirected to employee dashboard with self-service panels.
* **Screenshot Reference**: `docs/reference_blueprint/images/EMPLOYEE/01_dashboard.png`

### Step 3.2: Self-Service Leave Application
* **Action**: Clicked on **"Leave"** link, opened **"Apply Leave"** drawer, and selected dates.
* **UI Reaction**: Form opened successfully and populated Kabir's detail limits.
* **Screenshot Reference**: `docs/reference_blueprint/images/EMPLOYEE/02_leave_form.png`

### Step 3.3: Self-Service Claims Cap Enforcement
* **Action**: Navigated to `/expenses`. Opened **"New Claim"** form. Set category to **Travel**, amount to `6000`, and clicked **"Submit Claim"**.
* **UI Reaction**: Showed warning text: `"Warning: Amount exceeds employee's grade maximum expense limit of ₹5000."` On submit, backend returned 400 Bad Request error banner.
* **Screenshot Reference**: `docs/reference_blueprint/images/EMPLOYEE/03_expense_warning.png`

### Step 3.4: Recruitment Page Access Restriction
* **Action**: Navigated to `/recruitment`.
* **UI Reaction**: Displayed empty console state without create or approval options due to lack of `recruitment.read` permissions.
* **Screenshot Reference**: `docs/reference_blueprint/images/EMPLOYEE/04_recruitment_forbidden.png`

### Step 3.5: Logout
* **Action**: Clicked the **"Logout"** button on the top right.
* **UI Reaction**: Token successfully cleared and user redirected back to login screen.
* **Screenshot Reference**: `docs/reference_blueprint/images/EMPLOYEE/05_logged_out.png`
