# SKYLINX PeopleOS — Master Feature Inventory & Tech Stack

**Product:** SKYLINX PeopleOS (HRMS)
**Date:** 2026-06-11
**Repository:** `Hrms/` (monorepo) · Reference benchmark: Frappe HRMS v16.8.0 (`hrms-16.8.0/`)

---

## 1. Tech Stack

### Backend — `apps/api`
| Layer | Technology |
|---|---|
| Framework | NestJS 10 (TypeScript, Express platform) |
| ORM / DB access | Prisma 5.22 |
| Auth | JWT (`@nestjs/jwt`, Passport), bcryptjs password hashing (cost 12), OTP tokens |
| Validation | class-validator / class-transformer DTOs |
| API docs | Swagger (`@nestjs/swagger`) |
| Security | Helmet, role/permission guards (RBAC) |
| Email | Nodemailer |
| File upload | Multer |
| Testing | Jest (unit/service specs: auth, attendance, employees, payroll) |

### Frontend — `apps/web`
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS 3.4 |
| Icons | lucide-react |
| E2E testing | Playwright (`apps/web/e2e/`, `playwright.config.ts`) |
| Language | TypeScript 5.7 |

### Data layer — `packages/database`
- Prisma schema with **80+ models** (`packages/database/prisma/schema.prisma`)
- Seed script with demo company, departments, designations, locations, employees, RBAC roles/permissions, and login accounts for all three roles (`packages/database/prisma/seed.ts`)

### Architecture
- npm workspaces monorepo: `apps/api` (REST API, port 3001), `apps/web` (UI, port 3000), `packages/database` (shared Prisma client)
- Multi-tenant ready: `Company`, `Plan`, `Subscription`, `Payment` models (SaaS layer)
- Audit trail: `AuditLog`, `ErrorLog`, `SystemLog` models

---

## 2. Implemented Modules (Backend API + Frontend Console)

| # | Module | API (`apps/api/src/modules/`) | UI page / console | Key capabilities |
|---|---|---|---|---|
| 1 | Authentication & RBAC | `auth`, `security` | `/login`, `/signup`, security-console | JWT login, OTP, roles (HR_ADMIN / MANAGER / EMPLOYEE / OWNER), per-module permissions (read/create/update/approve/configure/export) |
| 2 | Employee Management | `employees` | `/employees`, employees-console, lifecycle-console | Directory, profile CRUD, grades, employment types, documents, bank details, onboarding/separation templates, exit interview, Full & Final settlement |
| 3 | Attendance | `attendance` | `/attendance`, attendance-console, roster-console | Logs, rules, regularization, overtime requests, shifts, shift assignments/requests/schedules, roster planning |
| 4 | Leave | `leave` | `/leave`, leave-console, leave-policy-panel, leave-settings-console | Leave types, balances, requests, policies & assignments, ledger entries, block lists (blackout dates), sandwich rule validation |
| 5 | Payroll | `payroll` | `/payroll`, payroll-console, compliance-dash | Salary structures, payroll runs, payslips, components, additional salary, tax exemption declarations & proof submissions, benefit applications/claims, Indian compliance (PF/ESI/PT/TDS — see compliance docs) |
| 6 | Expenses | `expenses` | `/expenses`, expenses-console | Claims with grade-based auto-approval caps, category limits, approval flow |
| 7 | Recruitment | `recruitment` | `/recruitment`, recruitment-console | Job requisitions, postings, candidates, applications, interview rounds/feedback, offers & offer terms |
| 8 | Training & Skills | `training` | `/training`, training-console | Programs, events, feedback, results, skill maps, designation skills |
| 9 | Travel Desk | `travel` | `/travel`, travel-console | Travel requests, itineraries, employee advances |
| 10 | Holidays | `holidays` | `/holidays`, holiday-console | Holiday calendars |
| 11 | Insurance | `insurance` | `/insurance`, insurance-console | Employee insurance, dependents, claims, benefit items |
| 12 | Performance | `performance` | `/performance`, performance-console | Performance console (see gap analysis for appraisal-cycle depth) |
| 13 | Approvals | `approvals` | `/approvals`, approvals-console | Cross-module approval inbox |
| 14 | Organization | `organization` | `/organization`, organization-console | Company, departments, designations, locations |
| 15 | Analytics & Reports | `analytics`, `reports`, `dashboard` | `/analytics`, `/reports`, `/dashboard` | Live metrics, dashboards, exportable reports |
| 16 | Rewards & Social | `rewards`, `social` | `/rewards`, `/social` | Vouchers, recognition, ledger, social feed (posts/likes/comments) |
| 17 | Notifications | `notifications` | `/notifications` | In-app notifications, email via Nodemailer |
| 18 | Compliance | `compliance` | `/compliance`, compliance-dash | Statutory compliance dashboards & exports |
| 19 | Assets | `assets` | `/assets`, assets-console | Asset assignment / tracking |
| 20 | Tickets / Support | `tickets` | `/support`, support-console | Helpdesk tickets + comments |
| 21 | SaaS Administration | `saas`, `settings` | `/saas`, `/saas-admin`, `/settings`, `/setup` | Plans, subscriptions, payments, module settings, client rules, setup wizard, branding |
| 22 | AI | `ai` | `/ai`, skynexus-console | AI assistant console |
| 23 | Health | `health` | — | API health checks |

---

## 3. Verified by E2E Role Audit (2026-06-11)

Full evidence in `docs/reference_blueprint/` (screenshots in `images/HR_ADMIN/`, `images/MANAGER/`, `images/EMPLOYEE/`; step log in `detailed_e2e_action_log.md`):

- **HR_ADMIN** — login, dashboard, directory, profile edit (grade change), attendance, leave blackout-date rejection, expense grade-cap warning, recruitment, training, travel, logout. ✔
- **MANAGER** — login, dashboard, leave requests, expense approvals, recruitment access boundary (403), logout. ✔
- **EMPLOYEE** — login, dashboard, self-service leave, expense cap warning + backend 400 rejection, recruitment restriction, logout. ✔
- Server logs (`logs/api.log`, `logs/web.log`): no errors/exceptions. Browser console: only two minor a11y warnings (missing `autocomplete`, missing `id/name` on one form field).

---

## 4. Default Demo Credentials (seeded)

| Role | Email | Password |
|---|---|---|
| OWNER (super admin) | skylinxcode@gmail.com | password123 |
| HR_ADMIN | hr.admin@skylinx.local | Skylinx@123 |
| MANAGER | rohan.iyer@skylinx.local | Skylinx@123 |
| EMPLOYEE | kabir.sethi@skylinx.local | Skylinx@123 |

> Note: MANAGER/EMPLOYEE accounts and their role permissions are now created by `db:seed` (fixed 2026-06-11 — previously they had been patched into the database manually during testing).
