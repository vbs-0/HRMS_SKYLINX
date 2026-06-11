# SKYLINX PeopleOS: System Roles & Permissions Matrix

This document provides a single-source inventory of all default roles, permission modules, and actions mapped within the SKYLINX PeopleOS authorization engine.

---

## 1. System Role Definitions

The system initializes with four core security groups:

1. **`SUPER_ADMIN`**: Global owner. Bypass permissions checks to control the entire tenant, workspace settings, system logs, subscription management, and direct database queries.
2. **`HR_ADMIN`**: Operations supervisor. Holds specialized configurations, reports exports, and setup permissions across all business modules.
3. **`MANAGER`**: Supervisory tier. Possesses read rights for their department, with specialized `approve` rights for leave, attendance corrections, expense claims, and training sign-offs.
4. **`EMPLOYEE`**: Individual contributor. Has self-service access to view and manage their own profile, apply for leaves/travel/claims, register for scheduled trainings, and check personal rosters.

---

## 2. Permission Module & Action Inventory

Permissions are structured in a `<module>.<action>` pattern where actions include:
* `read`: View records, details, and lists.
* `create`: Initiate new forms, requests, and submissions.
* `update`: Modify profiles, update draft statuses.
* `delete`: Remove or archive items.
* `approve`: Decisive action to verify, hold, or accept entries.
* `configure`: Manage master tables, company-wide settings, and parameters.
* `export`: Produce bulk CSV reports and exports.

---

## 3. Permissions Allocation Matrix

| Module | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
| :--- | :---: | :---: | :---: | :---: |
| **`employees`** | All Actions | `read`, `create`, `update`, `configure`, `approve` | `read` (dept) | `read` (self), `update` (limited) |
| **`attendance`** | All Actions | `read`, `create`, `update`, `approve` | `read` (dept), `approve` (corrections) | `read` (self), `create` (check-in/out) |
| **`leave`** | All Actions | `read`, `create`, `update`, `approve`, `configure` | `read` (dept), `approve` | `read` (self), `create` (apply) |
| **`payroll`** | All Actions | `read`, `create`, `update`, `approve`, `configure`, `export` | None | `read` (payslips/self) |
| **`expenses`** | All Actions | `read`, `create`, `update`, `approve` | `read` (dept), `approve` | `read` (self), `create` (claim) |
| **`holidays`** | All Actions | `read`, `create`, `update` | `read` | `read` |
| **`insurance`** | All Actions | `read`, `create`, `update`, `approve` | `read` (dept) | `read` (self), `create` (claim) |
| **`assets`** | All Actions | `read`, `create`, `update`, `configure` | `read` (dept) | `read` (self) |
| **`performance`** | All Actions | `read`, `configure` | `read` (dept), `update` (KPIs) | `read` (self) |
| **`recruitment`** | All Actions | `read`, `create`, `update`, `approve`, `configure` | `read` (interviewer) | None |
| **`training`** | All Actions | `read`, `create`, `update`, `configure` | `read` (dept), `approve` (nominations) | `read` (self), `create` (feedback) |
| **`travel`** | All Actions | `read`, `create`, `update`, `configure` | `read` (dept), `approve` | `read` (self), `create` (request) |
| **`compliance`** | All Actions | `read`, `export` | None | `read` (self) |
| **`settings`** | All Actions | `configure` | None | None |
| **`social`** | All Actions | `read`, `create`, `update` | `read`, `create` | `read`, `create` |

---

## 4. Default HR_ADMIN Seed Permissions List

The following exact permission rows are seeded for the `HR_ADMIN` role:
* **Read (View List/Details)**:
  `employees.read`, `attendance.read`, `leave.read`, `payroll.read`, `expenses.read`, `holidays.read`, `insurance.read`, `assets.read`, `performance.read`, `mobile.read`, `backup.read`, `testing.read`, `analytics.read`, `saas.read`, `approvals.read`, `notifications.read`, `organization.read`, `reports.read`, `rewards.read`, `social.read`, `compliance.read`, `recruitment.read`, `training.read`, `travel.read`
* **Create (Add/Insert)**:
  `employees.create`, `attendance.create`, `leave.create`, `payroll.create`, `expenses.create`, `holidays.create`, `insurance.create`, `notifications.create`, `rewards.create`, `social.create`, `recruitment.create`, `training.create`, `travel.create`
* **Update (Modify/Edit)**:
  `employees.update`, `attendance.update`, `leave.update`, `payroll.update`, `expenses.update`, `holidays.update`, `insurance.update`, `notifications.update`, `organization.update`, `recruitment.update`, `training.update`, `travel.update`
* **Delete (Remove/Archive)**:
  All modules possess a `delete` action (e.g. `employees.delete`, `attendance.delete`, `leave.delete`, `payroll.delete`, `expenses.delete`, `recruitment.delete`, `travel.delete`, `training.delete`) which is globally checked during entity removal. Super Admins bypass checks for delete operations, and HR Admin holds delete permissions across records.
* **Approve (Decisive Action)**:
  `leave.approve`, `attendance.approve`, `expenses.approve`, `insurance.approve`, `recruitment.approve`, `approvals.approve`, `employees.approve`, `payroll.approve`, `travel.approve`
* **Configure (Setup Parameters)**:
  `payroll.configure`, `mobile.configure`, `backup.configure`, `testing.configure`, `saas.configure`, `assets.configure`, `performance.configure`, `settings.configure`, `leave.configure`, `employees.configure`, `recruitment.configure`, `travel.configure`, `training.configure`
* **Export (Bulk Downloads)**:
  `payroll.export`, `reports.export`, `compliance.export`
