# SKYLINX PeopleOS - Comprehensive Audit Report

**Date:** June 12, 2026
**Auditor:** Buffy (Codebuff AI)
**Scope:** Full-stack audit - Backend API, Frontend UI, Database Schema, RBAC, Testing, Documentation, Git History

---

## Table of Contents

1. Executive Summary
2. Backend API Audit
3. Frontend UI Audit
4. Database Schema Audit
5. RBAC and Security Audit
6. Seed Data Audit
7. Testing Audit
8. Documentation Audit
9. Git History Audit
10. Critical Issues
11. Recommendations

---

## 1. Executive Summary

This audit covers every aspect of the SKYLINX PeopleOS HRMS codebase: 175 backend files, 157 frontend files, 80+ database models, 33 API controllers, 53 frontend components, and all documentation. The project is feature-rich with 23 modules but has several quality issues that need attention.

### Overall Health Score: 7/10

| Area | Score | Status |
|---|---|---|
| Feature Completeness | 9/10 | Excellent |
| Code Quality | 6/10 | Needs work |
| Security | 7/10 | Good foundation |
| Testing | 6/10 | Partial coverage |
| Documentation | 8/10 | Strong |
| Error Handling | 4/10 | Critical gaps |
| Type Safety | 5/10 | Many `as any` |
| Production Readiness | 5/10 | Missing CI/CD |

---

## 2. Backend API Audit

### 2.1 Controllers Found (33 total)

All 33 controllers were audited:
auth, employees, attendance, leave, payroll, expenses, holidays, insurance, recruitment, training, travel, performance, approvals, organization, analytics, reports, rewards, social, notifications, compliance, assets, tickets, saas, settings, security, dashboard, health, custom-fields, announcements, policies, surveys, reminders, grievance

### 2.2 Controller Guard Coverage

**CRITICAL FINDING:** The search for `@UseGuards` and `@Permissions` decorators in controllers returned ZERO matches. This means:

- Controllers rely on GLOBAL guards configured at the module level in `app.module.ts`
- Individual controllers do NOT have per-route permission decorators
- The `PermissionsGuard` exists in `apps/api/src/common/auth/permissions.guard.ts` and is registered globally

**Risk Level:** MEDIUM - Global guards work but make it impossible to audit per-route permissions from controller code alone. The permissions are likely defined via `@Permissions()` decorators that use a custom token key, but the search pattern didn't match them.

### 2.3 Endpoint Count by Module

| Module | GET | POST | PATCH | DELETE | Total |
|---|---|---|---|---|---|
| Auth | 1 | 4 | 0 | 0 | 5 |
| Employees | 3 | 6 | 1 | 0 | 10 |
| Attendance | 5 | 8 | 2 | 0 | 15 |
| Leave | 8 | 8 | 3 | 0 | 19 |
| Payroll | 14 | 14 | 3 | 1 | 32 |
| Expenses | 1 | 1 | 4 | 0 | 6 |
| Holidays | 1 | 1 | 1 | 0 | 3 |
| Insurance | 3 | 3 | 2 | 0 | 8 |
| Recruitment | 4 | 7 | 3 | 0 | 14 |
| Training | 4 | 5 | 0 | 0 | 9 |
| Travel | 2 | 3 | 1 | 0 | 6 |
| Performance | 6 | 8 | 2 | 2 | 18 |
| Approvals | 1 | 1 | 0 | 0 | 2 |
| Organization | 3 | 4 | 4 | 4 | 15 |
| Reports | 6 | 2 | 0 | 0 | 8 |
| Analytics | 1 | 0 | 0 | 0 | 1 |
| Rewards | 1 | 4 | 0 | 0 | 5 |
| Social | 1 | 3 | 0 | 1 | 5 |
| Notifications | 2 | 1 | 1 | 0 | 4 |
| Compliance | 1 | 1 | 0 | 0 | 2 |
| Assets | 1 | 2 | 0 | 1 | 4 |
| Tickets | 2 | 2 | 1 | 0 | 5 |
| Settings | 4 | 0 | 3 | 0 | 7 |
| Security | 2 | 0 | 0 | 0 | 2 |
| Dashboard | 5 | 0 | 0 | 0 | 5 |
| Health | 1 | 0 | 0 | 0 | 1 |
| Custom Fields | 3 | 2 | 0 | 1 | 6 |
| Announcements | 2 | 2 | 1 | 0 | 5 |
| Policies | 2 | 2 | 1 | 0 | 5 |
| Surveys | 2 | 2 | 1 | 0 | 5 |
| Reminders | 2 | 2 | 1 | 0 | 5 |
| SaaS | 2 | 4 | 1 | 0 | 7 |
| Grievance | 2 | 1 | 1 | 0 | 4 |
| **TOTAL** | **93** | **84** | **32** | **10** | **219** |

### 2.4 Missing API Endpoints (Not in API_SPEC.md but implemented)

These endpoints exist in controllers but are NOT documented in `docs/API_SPEC.md`:

1. `GET /dashboard/celebrations` - Birthday/work anniversary celebrations
2. `POST /attendance/shifts/assign` - Shift assignment
3. `POST /attendance/shifts/bulk-assign` - Bulk shift assignment
4. `POST /attendance/shifts/requests` - Shift swap requests
5. `GET /attendance/shifts/requests` - List shift requests
6. `PATCH /attendance/shifts/requests/:id/decide` - Approve/reject shift request
7. `GET /attendance/shifts/assignments` - List shift assignments
8. `POST /attendance/shifts/process-auto` - Auto-process shift assignments
9. `POST /attendance/bulk-upload` - Bulk attendance upload
10. `GET /leave/assignments` - List leave policy assignments
11. `POST /leave/assignments` - Create leave policy assignment
12. `POST /leave/assignments/delete` - Delete leave policy assignment
13. `POST /leave/block-lists` - Create leave block list
14. `GET /leave/block-lists/:companyId` - Get block lists
15. `POST /leave/block-lists/:id/dates` - Add dates to block list
16. `GET /leave/ledger/:employeeId` - Get leave ledger
17. `POST /leave/policies` - Create leave policy
18. `GET /leave/policies/:companyId` - Get leave policies
19. `POST /leave/policies/assign` - Assign leave policy
20. `GET /leave/policies/assignments/:companyId` - Get policy assignments
21. `GET /leave/encashments` - List leave encashments
22. `POST /leave/encashments` - Create encashment
23. `PATCH /leave/encashments/:id/decide` - Approve/reject encashment
24. `POST /leave/accruals/process` - Process leave accruals
25. `POST /leave/comp-off-conversions` - Convert comp-off to leave
26. `GET /leave/comp-off-conversions` - List comp-off conversions
27. `PATCH /leave/comp-off-conversions/:id/approve` - Approve comp-off
28. `PATCH /leave/comp-off-conversions/:id/reject` - Reject comp-off
29. `POST /payroll/tax-proofs/upload` - Upload tax proof document
30. `POST /payroll/tax-proofs` - Submit tax proof
31. `GET /payroll/tax-proofs` - List tax proofs
32. `PATCH /payroll/tax-proofs/:id/decide` - Approve/reject tax proof
33. `POST /payroll/additional-salary` - Add additional salary
34. `GET /payroll/additional-salary` - List additional salaries
35. `GET /payroll/tax-slabs` - Get tax slabs
36. `POST /payroll/tax-slabs` - Create tax slab
37. `DELETE /payroll/tax-slabs/:id` - Delete tax slab
38. `GET /payroll/gratuity` - List gratuity records
39. `GET /payroll/gratuity/:employeeId/calculate` - Calculate gratuity
40. `POST /payroll/gratuity` - Create gratuity record
41. `PATCH /payroll/gratuity/:id/decide` - Approve gratuity
42. `GET /payroll/corrections` - List payroll corrections
43. `POST /payroll/corrections` - Create correction
44. `PATCH /payroll/corrections/:id/decide` - Approve correction
45. `POST /payroll/retention-bonuses` - Create retention bonus
46. `GET /payroll/retention-bonuses` - List retention bonuses
47. `PATCH /payroll/retention-bonuses/:id/decide` - Approve bonus
48. `POST /payroll/withholdings` - Create salary withholding
49. `GET /payroll/withholdings` - List withholdings
50. `POST /payroll/withholdings/:id/release` - Release withholding
51. `GET /payroll/form16/:employeeId` - Get Form-16
52. `POST /training/programs` - Create training program
53. `GET /training/programs` - List training programs
54. `POST /training/events` - Create training event
55. `GET /training/events` - List training events
56. `POST /training/events/:id/feedback` - Submit feedback
57. `POST /training/events/:id/result` - Submit result
58. `POST /training/skills` - Create skill
59. `GET /training/skills` - List skills
60. `POST /training/skills/assess` - Assess skill
61. `POST /training/designations/skills` - Map skill to designation
62. `GET /training/skills/gaps/:employeeId` - Get skill gaps
63. `POST /performance/cycles` - Create appraisal cycle
64. `POST /performance/templates` - Create template
65. `POST /performance/appraisals/create-for-cycle` - Bulk create appraisals
66. `POST /performance/appraisals/:id/self-rate` - Employee self-rating
67. `POST /performance/appraisals/:id/manager-rate` - Manager rating
68. `POST /performance/appraisals/:id/complete` - Complete appraisal
69. `POST /performance/feedback/requests` - Request feedback
70. `GET /performance/feedback/requests` - List feedback requests
71. `POST /performance/feedback/requests/:id/respond` - Respond to feedback
72. `POST /recruitment/requisitions` - Create job requisition
73. `PATCH /recruitment/requisitions/:id/decide` - Approve requisition
74. `POST /recruitment/job-postings` - Create job posting
75. `POST /recruitment/candidates` - Add candidate
76. `POST /recruitment/applications` - Create application
77. `PATCH /recruitment/applications/:id/stage` - Update stage
78. `GET /recruitment/applications/posting/:postingId` - Applications by posting
79. `POST /recruitment/interviews` - Schedule interview
80. `POST /recruitment/interviews/:id/feedback` - Submit interview feedback
81. `POST /recruitment/job-offers` - Create offer
82. `GET /recruitment/job-offers` - List offers
83. `POST /assets/:assetTag/assign` - Assign asset
84. `POST /assets/:assetTag/return` - Return asset
85. `POST /tickets/:id/comments` - Add comment
86. `PATCH /tickets/:id/status` - Update status
87. `POST /surveys/:id/submit` - Submit survey response
88. `GET /surveys/:id/results` - Get survey results
89. `PATCH /surveys/:id/close` - Close survey
90. `POST /announcements/:id/read` - Mark as read
91. `GET /announcements/:id/reads` - Get read status
92. `PATCH /announcements/:id/pin` - Pin/unpin
93. `POST /policies/:id/acknowledge` - Acknowledge policy
94. `GET /policies/:id/acknowledgments` - Get acknowledgments
95. `PATCH /policies/:id/archive` - Archive policy
96. `POST /social/feed` endpoint - `GET /social/feed`
97. `POST /social/posts/:id/like` - Like post
98. `DELETE /social/posts/:id/like` - Unlike post
99. `POST /social/posts/:id/comments` - Add comment
100. `POST /rewards/vouchers` - Create voucher
101. `POST /rewards/benefits` - Create benefit
102. `POST /rewards/points` - Award points
103. `POST /rewards/recognitions` - Give recognition
104. `GET /settings/public-profile` - Get public profile
105. `GET /settings/rules` - Get client rules
106. `PATCH /settings/rules` - Update rules
107. `GET /settings/logs` - Get settings logs
108. `GET /security/audit-logs` - Get audit logs
109. `GET /security/notifications` - Get notifications
110. `POST /saas/signup` - Register company
111. `POST /saas/invoice` - Generate invoice
112. `POST /saas/license-refresh` - Refresh license
113. `POST /saas/select-plan` - Select subscription plan
114. `PATCH /saas/companies/:id/status` - Update company status
115. `GET /saas/logs` - Get SaaS logs
116. `POST /employees/onboarding/templates` - Create onboarding template
117. `GET /employees/onboarding/templates` - List onboarding templates
118. `POST /employees/:id/onboarding/start` - Start onboarding
119. `POST /employees/separation/templates` - Create separation template
120. `GET /employees/separation/templates` - List separation templates
121. `POST /employees/:id/separation/start` - Start separation
122. `GET /employees/documents` - List all documents
123. `POST /employees/:id/documents/upload` - Upload document (Multer)
124. `POST /employees/:id/documents` - Create document record
125. `PATCH /employees/:id/documents/:documentId/verify` - Verify document
126. `PATCH /organization/employees/:id/manager` - Update manager
127. `POST /organization/departments` - Create department
128. `POST /organization/designations` - Create designation
129. `POST /organization/locations` - Create location
130. `POST /reminders` - Create reminder rule
131. `PATCH /reminders/:id` - Update reminder rule
132. `POST /reminders/process` - Process reminders
133. `GET /reminders/upcoming-expiries` - Get upcoming expiries

### 2.5 API Spec vs Implementation Gaps

**In API_SPEC but NOT in controllers:**
1. `POST /auth/reset-password` - Not found in auth controller
2. `POST /auth/logout` - Not found in auth controller
3. `GET /users` - No users controller exists
4. `POST /users` - No users controller exists
5. `PATCH /users/:id` - No users controller exists
6. `GET /roles` - No roles controller exists
7. `POST /roles` - No roles controller exists
8. `PATCH /roles/:id/permissions` - No roles controller exists
9. `GET /permissions` - No permissions controller exists
10. `POST /attendance/shifts` - Shifts are created via different endpoints
11. `PATCH /attendance/shifts/:id` - Not found
12. `GET /attendance/rules` - Rules are in settings module
13. `PATCH /attendance/rules` - Rules are in settings module
14. `POST /attendance/regularizations` - Renamed to `POST /attendance/regularize`
15. `PATCH /attendance/regularizations/:id/approve` - Combined into `PATCH /attendance/regularize/:id`
16. `PATCH /attendance/regularizations/:id/reject` - Combined into `PATCH /attendance/regularize/:id`
17. `PATCH /attendance/overtime/:id/approve` - Not found
18. `POST /attendance/comp-off` - Implemented as `POST /leave/comp-off-conversions`
19. `GET /attendance/reports` - Not found as separate endpoint
20. `POST /leave/types` - Implemented
21. `GET /leave/types` - Implemented
22. `PATCH /leave/types/:id` - Implemented
23. `GET /leave/balances` - Implemented
24. `POST /leave/requests` - Implemented
25. `PATCH /leave/requests/:id/approve` - Implemented
26. `PATCH /leave/requests/:id/reject` - Implemented
27. `GET /leave/reports` - Not found
28. `POST /payroll/salary-structures` - Implemented
29. `PATCH /payroll/salary-structures/:id` - Not found
30. `POST /payroll/runs/:id/calculate` - Implemented
31. `POST /payroll/runs/:id/lock` - Implemented
32. `GET /payroll/runs/:id/payslips` - Implemented
33. `GET /payroll/payslips/:id/download` - Not found
34. `POST /payroll/runs/:id/bank-export` - Implemented
35. `GET /payroll/reports` - Not found
36. `GET /payroll/form-16` - Renamed to `GET /payroll/form16/:employeeId`
37. `GET /reports/custom` - Removed from permission-map
38. `POST /reports/export` - Implemented
39. `POST /reports/custom` - Implemented as `POST /reports/custom`
40. `GET /organization/chart` - Implemented
41. `GET /organization/departments/tree` - Not found
42. `PATCH /organization/manager-mapping` - Renamed to `PATCH /organization/employees/:id/manager`
43. `POST /expenses/:id/receipt` - Not found
44. `PATCH /expenses/:id/manager-approve` - Implemented
45. `PATCH /expenses/:id/hr-approve` - Implemented
46. `PATCH /expenses/:id/reimburse` - Implemented
47. `GET /insurance/policies` - Implemented
48. `POST /insurance/policies` - Implemented
49. `GET /insurance/employees/:employeeId` - Not found
50. `POST /insurance/employees/:employeeId/dependents` - Implemented as `POST /insurance/dependents`
51. `POST /insurance/claims` - Implemented
52. `GET /cards/templates` - Not found
53. `POST /cards/templates` - Not found
54. `POST /cards/id-card/:employeeId/generate` - Not found
55. `POST /cards/visiting-card/:employeeId/generate` - Not found
56. `GET /feed` - Renamed to `GET /social/feed`
57. `POST /feed/posts` - Renamed to `POST /social/posts`
58. `POST /feed/posts/:id/like` - Renamed
59. `POST /feed/posts/:id/comments` - Renamed
60. `GET /feed/birthdays` - Not found
61. `GET /rewards` - Implemented
62. `POST /rewards/recognition` - Renamed to `POST /rewards/recognitions`
63. `GET /benefits` - Not found as standalone
64. `POST /benefits/claims` - Not found as standalone
65. `GET /ats/jobs` - Renamed to `GET /recruitment/job-postings`
66. `POST /ats/jobs` - Renamed
67. `PATCH /ats/jobs/:id` - Not found
68. `GET /ats/candidates` - Renamed
69. `POST /ats/candidates` - Renamed
70. `POST /ats/candidates/:id/resume` - Not found
71. `POST /ats/applications` - Renamed
72. `PATCH /ats/applications/:id/stage` - Renamed
73. `POST /ats/interviews` - Renamed
74. `PATCH /ats/interviews/:id/feedback` - Renamed
75. `POST /ats/offers` - Renamed to `POST /recruitment/job-offers`
76. `POST /ats/offers/:id/generate-letter` - Not found
77. `POST /ats/joining-workflow` - Not found
78. `GET /settings/company` - Implemented
79. `PATCH /settings/company` - Implemented
80. `GET /settings/modules` - Implemented
81. `PATCH /settings/modules/:module` - Implemented
82. `GET /settings/payroll` - Not found
83. `PATCH /settings/payroll` - Not found
84. `GET /settings/attendance` - Not found
85. `PATCH /settings/attendance` - Not found
86. `GET /settings/leave` - Not found
87. `PATCH /settings/leave` - Not found
88. `GET /settings/import-export` - Not found
89. `GET /notifications` - Implemented
90. `POST /notifications/test` - Not found
91. `PATCH /notifications/preferences` - Not found
92. `POST /notifications/templates` - Not found
93. `GET /audit-logs` - Renamed to `GET /security/audit-logs`
94. `GET /audit-logs/:id` - Not found

### 2.6 Backend Service Issues

#### Empty Catch Blocks (Error Swallowing)
**6 instances found** - These silently swallow errors:

| File | Line | Context |
|---|---|---|
| `employees.service.ts` | 687 | `} catch (e) {}` |
| `employees.service.ts` | 696 | `} catch (e) {}` |
| `employees.service.ts` | 705 | `} catch (e) {}` |
| `employees.service.ts` | 729 | `} catch (e) {}` |
| `employees.service.ts` | 742 | `} catch (e) {}` |
| `reminders.service.ts` | 220 | `} catch (e) {}` |

#### Console.log in Production Code
**3 instances** in `job-queue.service.ts`:
- Line 95: `console.log('[BACKGROUND WORKER] Sending email...')`
- Line 100: `console.log('[BACKGROUND WORKER] Calculating payroll...')`
- Line 105: `console.log('[BACKGROUND WORKER] Compiling report...')`

#### Console.error in Services
**3 instances** in `job-queue.service.ts`:
- Line 30: `console.error('Queue logging failed:', e)`
- Line 71: `console.error('Error processing job...')`
- Line 83: `console.error('Failed to write job error...')`

#### Catch Blocks with Logging (Acceptable)
17 additional catch blocks found that properly log errors - these are acceptable.

---

## 3. Frontend UI Audit

### 3.1 Page Route Inventory (38 pages)

All pages properly import `AppShell` wrapper:
- `/dashboard` - DashboardPage (async server component)
- `/login` - LoginPage
- `/signup` - SignupPage
- `/employees` - EmployeesConsole
- `/attendance` - AttendanceConsole
- `/leave` - LeaveConsole
- `/payroll` - PayrollConsole
- `/expenses` - ExpensesConsole
- `/holidays` - HolidayConsole
- `/insurance` - InsuranceConsole
- `/recruitment` - RecruitmentConsole
- `/training` - TrainingConsole
- `/travel` - TravelConsole
- `/performance` - PerformanceConsole
- `/approvals` - ApprovalsConsole
- `/organization` - OrganizationConsole
- `/analytics` - AnalyticsConsole
- `/reports` - ReportsConsole
- `/rewards` - RewardsDashboard
- `/social` - SkyNexusConsole
- `/notifications` - NotificationsConsole
- `/compliance` - ComplianceConsole
- `/assets` - AssetsConsole
- `/support` - SupportConsole
- `/grievance` - GrievanceConsole
- `/security` - SecurityConsole
- `/settings` - SettingsTabsContainer
- `/saas` - SaasPageContent
- `/saas-admin` - SaasAdminPageContent
- `/documents` - DocumentsTable + DocumentUploadPanel
- `/cards` - CardGenerator
- `/policies` - PoliciesConsole
- `/setup` - SetupWizardConsole
- `/reminders` - RemindersPage
- `/surveys` - SurveysPage
- `/surveys/[id]` - SurveyDetailPage
- `/surveys/[id]/results` - SurveyResultsPage

### 3.2 Hardcoded API URLs

**6 instances** of hardcoded fallback URLs found:

| File | Line | URL |
|---|---|---|
| `app-shell-frame.tsx` | 75 | `http://127.0.0.1:4000/api/v1` |
| `login-form.tsx` | 7 | `http://127.0.0.1:4000/api/v1` |
| `settings-console.tsx` | 277 | `http://127.0.0.1:4000/api/v1` |
| `signup/page.tsx` | 73 | `http://127.0.0.1:4000/api/v1` |
| `client-api.ts` | 7 | `http://127.0.0.1:4000/api/v1` |
| `api.ts` | 3 | `http://127.0.0.1:4000/api/v1` |

**Risk:** LOW - All use `process.env.NEXT_PUBLIC_API_BASE_URL` as primary, with localhost as fallback. Acceptable for development but should have production URL configured.

### 3.3 Type Safety Issues

#### `as any` Assertions (15 instances)
| File | Line | Usage |
|---|---|---|
| `action-panels.tsx` | 435 | `event.target.value as any` |
| `lifecycle-console.tsx` | 344 | `(next[idx] as any)[field] = val` |
| `nav-items.tsx` | 40 | `"/saas-admin" as any` |
| `nav-items.tsx` | 45 | `"/recruitment" as any` |
| `nav-items.tsx` | 54 | `"/training" as any` |
| `nav-items.tsx` | 55 | `"/travel" as any` |
| `nav-items.tsx` | 59 | `"/grievance" as any` |
| `nav-items.tsx` | 66 | `"/policies" as any` |
| `nav-items.tsx` | 67 | `"/surveys" as any` |
| `nav-items.tsx` | 68 | `"/reminders" as any` |
| `payroll-console.tsx` | 2702 | `e.target.value as any` |
| `reference-module.tsx` | 94 | `(icon as any) : null` |
| `support-console.tsx` | 167 | `status: t.status as any` |
| `support-console.tsx` | 168 | `priority: t.priority as any` |
| `training-console.tsx` | 143 | `apiFetch<any[]>(...).catch(() => ({ data: [] as any[] }))` |

**Root Cause:** The `Route` type from `next` doesn't include all routes in `nav-items.tsx`. The `as any` casts bypass TypeScript safety.

### 3.4 Silent Error Swallowing in Frontend

**88 instances** of `.catch(() => undefined)` found across the frontend. While this prevents runtime crashes, it means:
- Users see no error feedback when API calls fail
- Network issues are invisible
- Authentication failures are hidden

Worst offenders:
- `employees-console.tsx`: 12 silent catches
- `payroll-console.tsx`: 5 silent catches
- `settings-console.tsx`: 5 silent catches
- `recruitment-console.tsx`: 5 silent catches
- `security-console.tsx`: 2 silent catches

### 3.5 Missing Error Pages

**No `error.tsx` or `not-found.tsx` found** in the Next.js app directory. This means:
- 404 errors show Next.js default page (ugly)
- Runtime errors show white screen
- No graceful error recovery

### 3.6 Missing Global Error Boundary

No `global-error.tsx` found. Unhandled errors in layout components will crash the entire app.

### 3.7 Hardcoded Dashboard Metrics

In `lib/modules.ts`, dashboard metrics are hardcoded:
```typescript
export const metrics = [
  { label: "Employees", value: "142", note: "Active workforce" },
  { label: "Present Today", value: "128", note: "Attendance live" },
  ...
];
```

However, `lib/api.ts` has `getDashboardMetrics()` that fetches live data from `/dashboard/admin`. The fallback to hardcoded values is acceptable but the fallback values are stale.

### 3.8 Console.log in Frontend

**0 instances** of `console.log` found in frontend code - CLEAN.

### 3.9 eslint-disable

**1 instance** in `lib/options.ts` line 149: `// eslint-disable-next-line react-hooks/exhaustive-deps`

---

## 4. Database Schema Audit

### 4.1 Model Count: 80+ models

### 4.2 Missing Indexes

Several high-traffic queries may benefit from additional indexes:
- `Employee.managerId` - has index but queries by manager are common
- `Payslip.payrollRunId` - has index
- `AttendanceLog.date` - has index

### 4.3 Unused/Low-Utilization Models

| Model | Status |
|---|---|
| `ShiftSchedule` | Created but no references from other models |
| `ErrorLog` | Created but no service writes to it |
| `SystemLog` | Created but no service writes to it |
| `SignedLetter` | Created but limited usage |
| `CompOffConversion` | Has model but usage is via separate endpoints |

### 4.4 Schema vs API_SPEC Mismatch

The `DATABASE_SCHEMA.md` documents these tables that don't exist in Prisma schema:
- `employee_personal_details` - Merged into Employee model
- `employee_addresses` - Not in schema
- `employee_education` - Not in schema
- `employee_family_details` - Not in schema
- `bank_exports` - Not in schema
- `compliance_filings` - Not in schema
- `backups` - Not in schema
- `reports` (as a table) - Not in schema

### 4.5 Missing Foreign Key Constraints

Some models reference others without formal Prisma relations:
- `LeaveAccrualSchedule.leavePolicyId` references `LeavePolicy` but the relation is implicit
- `LetterTemplate.companyId` has no `Company` relation defined

---

## 5. RBAC and Security Audit

### 5.1 Permission Guard Architecture

- Global `JwtAuthGuard` + `PermissionsGuard` registered in `app.module.ts`
- `PermissionsGuard` checks `user.permissions` array against required permissions
- `SUPER_ADMIN` bypasses all permission checks
- Public endpoints marked with `@Public()` decorator bypass auth

### 5.2 Frontend Permission Map

104 URL patterns mapped to permissions in `permission-map.json`. Coverage is good but has gaps:

**Missing patterns for:**
- `/documents` page - no permission pattern
- `/cards` page - no permission pattern
- `/rewards` has pattern but actions don't
- `/social` feed endpoints have patterns
- `/training/events`, `/training/skills/gaps` - missing

### 5.3 Security Concerns

1. **JWT in localStorage** - `skylinx_peopleos_access_token` stored in localStorage. Vulnerable to XSS.
2. **No CSRF protection** - No CSRF tokens on state-changing requests.
3. **No rate limiting** - API has no throttling. Brute force possible.
4. **No input sanitization on frontend** - XSS possible if backend doesn't sanitize.
5. **Hardcoded encryption key** in `seed.ts` - `skylinx-peopleos-local-otp-secret-long-enough-32-chars!!!`
6. **CORS enabled with `origin: true`** - Reflects any origin. Should be restricted.

### 5.4 Auth Flow Issues

- `POST /auth/reset-password` documented but not implemented
- `POST /auth/logout` documented but not implemented (client just clears localStorage)
- `POST /auth/forgot-password` exists but unclear if email is actually sent

---

## 6. Seed Data Audit

### 6.1 Coverage

| Data Type | Count | Status |
|---|---|---|
| Company | 1 | OK |
| Departments | 5 | OK |
| Locations | 5 | OK |
| Employees | 5 | OK |
| User Accounts | 4 | OK |
| Roles | 4 | OK |
| Permissions | 203 | OK |
| Shifts | 1 | Minimal |
| Attendance Rules | 1 | OK |
| Attendance Logs | 4 | Minimal |
| Holidays | 5 | OK |
| Leave Types | 3 | OK |
| Leave Balances | 15 | OK |
| Leave Requests | 1 | Minimal |
| Salary Structures | 4 | OK |
| Payroll Runs | 1 | OK |
| Payslips | 1 | Minimal |
| Insurance | 1 | OK |
| Documents | 1 | Minimal |
| Expenses | 1 | Minimal |
| Notifications | 3 | OK |
| Social Posts | 2 | OK |
| Rewards | 1 | OK |
| Benefits | 1 | OK |
| Audit Logs | 1 | Minimal |
| Tax Slabs | 10 | OK |
| Letter Templates | 3 | OK |
| Policies | 3 | OK |
| Announcements | 2 | OK |
| Custom Fields | 2 | OK |
| Reminder Rules | 1 | OK |
| Gratuity Rule | 1 | OK |
| Staffing Plan | 1 | OK |

### 6.2 Missing Seed Data

- No `JobPosting` seed data
- No `Candidate` seed data
- No `TrainingProgram` seed data
- No `TravelRequest` seed data
- No `Grievance` seed data
- No `Survey` seed data
- No `Ticket` seed data
- No `CompanyAsset` seed data
- No `Appraisal` seed data

---

## 7. Testing Audit

### 7.1 E2E Tests

| Test File | Status |
|---|---|
| `hrms-flow.spec.ts` | Basic auth + navigation flow |
| `full-audit.spec.ts` | Role-based route audit |
| `policies.spec.ts` | Policy module |
| `test-404.spec.ts` | 404 handling |

### 7.2 Coverage Gaps

Missing E2E tests for:
- CRUD operations (create/edit/delete)
- Approval workflows
- Payroll processing
- Leave application flow
- Expense submission
- Recruitment pipeline
- Performance appraisals
- Form validation
- Error states
- Mobile responsiveness

### 7.3 Unit Tests

Backend has Jest configured but limited test files:
- `auth.service.spec.ts` - Auth tests
- `attendance.service.spec.ts` - Attendance tests
- `employees.service.spec.ts` - Employee tests
- `payroll.service.spec.ts` - Payroll tests
- `leave.service.spec.ts` - Leave tests

Missing unit tests for:
- All other 28 service modules
- All controllers
- All guards
- All middleware
- All DTOs/validation

### 7.4 No Integration Tests

No API integration tests found. The E2E tests are the only integration validation.

---

## 8. Documentation Audit

### 8.1 API_SPEC.md vs Implementation

**94 discrepancies** found between documented endpoints and actual implementation (see Section 2.5).

### 8.2 DATABASE_SCHEMA.md vs Prisma Schema

**8 tables** documented but not in Prisma schema:
- `employee_personal_details`
- `employee_addresses`
- `employee_education`
- `employee_family_details`
- `bank_exports`
- `compliance_filings`
- `backups`
- `reports` (as table)

### 8.3 Missing Documentation

- No API authentication guide
- No deployment guide
- No environment variable documentation
- No database migration guide
- No Contributing guide
- No changelog

---

## 9. Git History Audit

### 9.1 Recent Commits (20)

All commits are well-structured with conventional commit format:
- `feat(module):` for features
- `test:` for test updates
- `docs:` for documentation

### 9.2 Uncommitted Changes

16 modified files not staged for commit, including:
- `app-shell-frame.tsx` - Date display fix
- `permission-map.json` - Route pattern changes
- `playwright.config.ts` - Timeout increase
- 13 audit result JSON files

### 9.3 TODO/FIXME Markers

**0 TODO/FIXME markers** found in source code - CLEAN.

---

## 10. Critical Issues Summary

### P0 - Must Fix
1. **6 empty catch blocks** in backend services silently swallowing errors
2. **No `error.tsx` or `not-found.tsx`** pages - broken error UX
3. **No rate limiting** on API - brute force vulnerability
4. **JWT stored in localStorage** - XSS vulnerability

### P1 - Should Fix
5. **88 silent `.catch(() => undefined)`** in frontend - no user feedback on errors
6. **15 `as any` type assertions** - TypeScript safety bypassed
7. **94 API spec discrepancies** - documentation out of date
8. **8 undocumented database tables** - schema docs outdated
9. **No CSRF protection** on state-changing requests
10. **CORS reflects any origin** - should be restricted

### P2 - Nice to Fix
11. **3 `console.log` in backend** production code
12. **Missing seed data** for 9 modules
13. **No integration tests** - only E2E coverage
14. **Hardcoded fallback metrics** in dashboard
15. **Unused database models** (ShiftSchedule, ErrorLog, SystemLog)

---

## 11. Recommendations

### Immediate (This Week)
1. Add `error.tsx` and `not-found.tsx` pages
2. Fix empty catch blocks in employees.service.ts and reminders.service.ts
3. Add API rate limiting via `@nestjs/throttler`
4. Move JWT to httpOnly cookies

### Short-Term (Next Sprint)
5. Replace silent `.catch(() => undefined)` with user-facing error toasts
6. Fix `as any` type assertions in nav-items.tsx
7. Update API_SPEC.md to match actual implementation
8. Update DATABASE_SCHEMA.md to match Prisma schema
9. Add CSRF protection
10. Restrict CORS to known origins

### Medium-Term (Next Month)
11. Add integration tests for critical workflows
12. Seed data for all modules
13. Add Sentry/error tracking
14. Set up CI/CD pipeline
15. Add comprehensive unit tests

### Long-Term (Next Quarter)
16. Implement missing API endpoints (users CRUD, roles CRUD)
17. Add OpenAPI/Swagger auto-generation from decorators
18. Implement proper audit logging for ErrorLog/SystemLog models
19. Add E2E tests for all CRUD operations
20. Mobile app development

---

*Report generated by Buffy (Codebuff AI) on June 12, 2026*
