# SKYLINX PeopleOS Module Functioning Status

Generated: 2026-06-04 10:45 IST

## Changes Made

- Connected Insurance and ATS forms to real database dropdowns for policy, job and application selection.
- Fixed new employee onboarding so leave balances are created automatically for active leave types.
- Changed payroll run creation to use the current month and year instead of the old seeded May 2026 run.
- Changed the main menu to a hamburger-controlled slide-out menu so module links are hidden until the three-line button is clicked.
- Removed the global Run Payroll shortcut from every page; Payroll keeps a working Run Payroll link that jumps to the payroll controls.
- Updated menu navigation so every menu item opens its real module route instead of silently redirecting locked items to SaaS Billing.
- Added database indexes and a company-scoped employee code uniqueness constraint to improve live module reads and prevent duplicate employee codes.
- Added a `ClientRule` database table for client-specific branding, attendance, leave, payroll and approval rules.
- Added `/api/v1/settings/rules` and `/api/v1/settings/logs` so each client can configure rules and review activity logs from Settings.
- Added Settings UI for client branding, attendance rules, leave rules, payroll rules, approval rules, activity logs and settings export.
- Made Support controls functional with mail, phone, WhatsApp, SLA anchor and CSV support report download.
- Removed empty stale Backup, Mobile and Testing route/module folders.
- Verified all kept API module GET endpoints against the local PostgreSQL database.
- Verified representative POST/PATCH actions for employee, attendance, leave, payroll, expenses, holidays, insurance, notifications, social, rewards, ATS, integrations, performance, reports, compliance and SaaS.

## Local Links

- Web app: http://localhost:3000
- API: http://localhost:4000/api/v1

## Local HR Admin Login

```text
hr.admin@example.com
Skylinx@123
```

## Module Working Status

| Module | Web Route | Main API | Status |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | `/api/v1/dashboard/admin` | Working |
| Setup Wizard | `/setup` | `/api/v1/settings/company` | Working |
| Analytics | `/analytics` | `/api/v1/analytics` | Working |
| SaaS Billing | `/saas` | `/api/v1/saas` | Working |
| Approvals | `/approvals` | `/api/v1/approvals` | Working |
| Lifecycle | `/lifecycle` | `/api/v1/lifecycle` | Working |
| Assets | `/assets` | `/api/v1/assets` | Working |
| PMS | `/performance` | `/api/v1/performance` | Working |
| Employees | `/employees` | `/api/v1/employees` | Working |
| Documents | `/documents` | `/api/v1/employees/documents` | Working |
| ID & Visiting Card | `/cards` | `/api/v1/employees` | Working |
| Attendance | `/attendance` | `/api/v1/attendance/logs` | Working |
| Leave | `/leave` | `/api/v1/leave/requests` | Working |
| Holidays | `/holidays` | `/api/v1/holidays` | Working |
| Organization | `/organization` | `/api/v1/organization/chart` | Working |
| Payroll | `/payroll` | `/api/v1/payroll/runs` | Working |
| Compliance | `/compliance` | `/api/v1/compliance` | Working |
| Expenses | `/expenses` | `/api/v1/expenses` | Working |
| Insurance | `/insurance` | `/api/v1/insurance/policies` | Working |
| Integrations | `/integrations` | `/api/v1/integrations` | Working |
| Support | `/support` | mail/phone/report actions | Working |
| Notifications | `/notifications` | `/api/v1/notifications` | Working |
| SkyNexus | `/social` | `/api/v1/social/feed` | Working |
| Rewards | `/rewards` | `/api/v1/rewards` | Working |
| Reports | `/reports` | `/api/v1/reports/employees` | Working |
| Security | `/security` | `/api/v1/audit-logs` | Working |
| Settings | `/settings` | `/api/v1/settings/modules` | Working |
| Recruitment ATS | `/ats` | `/api/v1/ats/jobs` | Working |

## Removed Modules

| Removed Module | Web Result | API Result |
| --- | --- | --- |
| AI Tools | `/ai` returns 404 | `/api/v1/ai` not registered |
| Backup | `/backup` returns 404 | `/api/v1/backup` not registered |
| Mobile App | `/mobile` returns 404 | `/api/v1/mobile` not registered |
| Testing | `/testing` returns 404 | `/api/v1/testing` not registered |

## Verification Completed

```bash
npm run typecheck -w @skylinx/web
npm run typecheck -w @skylinx/api
npm run build -w @skylinx/api
set NEXT_PRIVATE_BUILD_WORKER=1&& npm run build -w @skylinx/web
```

All passed.

Additional live checks:

- Every kept web route returned `200`.
- `/backup`, `/mobile`, `/testing`, and `/ai` returned `404`.
- In-app browser smoke passed for Dashboard, Employees, Attendance, Leave, Payroll, Insurance, ATS, Support, Settings, Security and SaaS.
- New employee creation plus leave request approval was verified after the auto-balance fix.
- Sidebar was verified hidden by default and visible after clicking the hamburger menu.
- Dashboard no longer shows the global Run Payroll button; Payroll shows one Run Payroll action.
- Settings client rules were verified through live API save/read and browser rendering.
