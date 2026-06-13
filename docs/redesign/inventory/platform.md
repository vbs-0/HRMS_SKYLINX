# Platform Inventory — Auth, Security, Settings, SaaS, Analytics, Reports, Dashboard, Notifications/Reminders, Approvals, AI, Health

> Generated 2026-06-12 from source on branch `2.0`. All API paths are prefixed `**/api/v1**` (`apps/api/src/main.ts:34`). Swagger lives at `/api/docs`.
> Conventions used below: **API-only** = endpoint exists, no UI calls it. **UI-only** = control rendered but backed by nothing (hardcoded/simulated). Permission strings are `module.action` checked by `PermissionsGuard` (`apps/api/src/common/auth/permissions.guard.ts`); **SUPER_ADMIN bypasses all permission checks** (line 30).

---

## 0. Cross-cutting plumbing (read this first)

### 0.1 Auth & guard pipeline
- Global guards: `JwtAuthGuard` then `PermissionsGuard` registered as `APP_GUARD` (`apps/api/src/modules/app.module.ts:86-95`). Everything is JWT-protected unless `@Public()`.
- JWT: HS256, secret `JWT_ACCESS_SECRET` (falls back to literal `"dev-access-secret"` — `auth.module.ts:12`), **15-minute expiry** (`auth.module.ts:13`), **no refresh token endpoint anywhere**. After 15 min every API call 401s and the web client redirects to /login.
- JWT payload (`AuthenticatedUser`): `sub`, `email`, `employeeId`, `tenantId`, `roles[]`, `permissions[]` (`auth.service.ts:54-61`). The web app decodes this payload client-side everywhere (`lib/permissions.ts`, settings-console, skynexus-console, saas-admin-page-content) — payload shape is a de-facto public contract.

### 0.2 Tenant scoping (the single most important platform mechanic)
- `TenantMiddleware` (`apps/api/src/common/tenant.middleware.ts`) builds an AsyncLocalStorage store per request: `tenantId` comes **first from the `x-tenant-id` request header**, only falling back to the JWT; `isOwner` is true when decoded roles include SUPER_ADMIN/SYSTEM_OWNER. **The token is `decode()`d, not verified, in this middleware** (line 23) — and the header is trusted blindly. Any authenticated user can point `x-tenant-id` at another tenant. Known security quirk.
- `PrismaService.$use` middleware (`apps/api/src/prisma/prisma.service.ts`) auto-injects `companyId`/`tenantId` filters into reads/writes/creates, **but only for an allowlist of models**:
  - `companyId` models: Department, Designation, Location, **Employee**, Shift, AttendanceRule, LeaveType, PayrollRun, Holiday, JobPosting, ModuleSetting, ClientRule, ReminderRule (via "companyId" overwrite on create — see 8.2), CompanyPolicy, Announcement, etc.
  - `tenantId` models: User, Role, **AuditLog**, Ticket, Subscription.
  - **NOT scoped**: `AttendanceLog`, `LeaveRequest`, `Payslip`, `Expense`, `Notification`, `InsuranceClaim`, `AttendanceRegularization`, `ErrorLog`, `SystemLog`, `Payment`, `Plan`, `Company`. Any service that queries these without an explicit `employee.companyId` filter is **cross-tenant** (several below are).
  - Scoping is skipped entirely when `isOwner` is true.
  - `findUnique` is silently rewritten to `findFirst` with flattened compound keys (lines 49-67) — surprising but works.
- Frontend mirror: `lib/permission-map.json` + `lib/permissions.ts` pre-check GETs against `@RequirePermissions` (regenerated via `scripts/generate-permission-map.js`); owners (`SUPER_ADMIN`/`SYSTEM_OWNER`) pass everything client-side too.

### 0.3 Plan gating (white-label SaaS access control)
- The web plan gate is **cookie-based**: `peopleos_plan` cookie written at login (`login-form.tsx:32`) and on plan change (`saas-console.tsx:70-72`); server components read it via `lib/plan-server.ts` in `PlanGate` (`components/plan-gate.tsx`). The plan→module map is hardcoded client-side in `lib/plan-access.ts` (Basic: dashboard/employees/documents/attendance/leave/holidays/reports/settings/support; Standard adds cards/organization/payroll/expenses/insurance/notifications/social/approvals/assets/performance; Pro adds compliance/security/rewards/analytics/saas).
- **There is no server-side plan enforcement on API endpoints** — plan gating is purely cosmetic (cookie + nav hiding + PlanGate lock screens). API access is governed only by permissions.
- Server-side source of truth for the active plan is `ModuleSetting(companyId, module="subscription").settingsJson.activePlan`, defaulting to **"Standard"** when absent (`auth.service.ts:69-74`, `settings.service.ts:265-270`, `saas.service.ts:272-278`).

### 0.4 Seeded role → permission matrix (packages/database/prisma/seed.ts)
- Permissions exist for 30 modules x 7 actions (`seed.ts:119-121`). Note: permissions exist for modules with no controller (mobile, backup, testing, exit).
- **HR_ADMIN** (seed.ts:131-155): read on ~29 modules incl. `analytics.read`, `saas.read`, `reports.read`, `notifications.read`; `settings.configure`, `saas.configure`, `payroll.configure/approve/export`, `reports.export`, `approvals.approve`, etc.
- **MANAGER** (seed.ts:328-345): employees.read, attendance.read/approve, leave.read/approve, expenses.approve, recruitment.read, training/travel.approve, grievance/policies/surveys/tickets read+some. **No `approvals.read`, no `reports.read`, no `notifications.read`, no `analytics.read`, no `settings.configure`** — so the Approvals console, Reports console, Notifications console, Analytics console and admin dashboard endpoint all 403 for managers.
- **EMPLOYEE** (seed.ts:346-364): employees.read/update, attendance.create, leave.create, payroll.read, expenses.create, insurance read/create, holidays.read, tickets, etc. Same exclusions as manager plus more.
- Demo accounts: HR admin `admin@example.com`, super admin `superadmin@example.com` (password env or `password123`); `manager@example.com` / `employee@example.com` (password `Demo@12345`).

---

## 1. Auth module (`apps/api/src/modules/auth`)

### Endpoints
| Method/Path | Permission | Status |
|---|---|---|
| POST `/auth/login` | @Public | **Real.** bcrypt compare, loads roles→permissions, signs 15m JWT, resolves `activePlan` from ModuleSetting, updates `lastLoginAt`, writes `auth.login` audit log. Returns `{accessToken, tokenType, expiresIn:900, user, activePlan}` (`auth.service.ts:19-101`). |
| POST `/auth/otp/request` | @Public | **Stub.** Echoes the request DTO back: `response("auth","otp.request", data)` (`auth.service.ts:103-105`). No OTP generated, nothing sent, nothing stored. |
| POST `/auth/otp/verify` | @Public | **Stub.** Echoes input. Never issues a token (`auth.service.ts:107-109`). |
| POST `/auth/forgot-password` | @Public | **Stub.** Echoes input. No email, no reset token (`auth.service.ts:111-113`). |
| GET `/auth/me` | any authenticated | Returns the decoded JWT payload verbatim (`auth.service.ts:115-117`). |

### UI
- `components/login-form.tsx` (used by `app/login/page.tsx`): email+password only. Stores token via `lib/session`, writes `peopleos_plan` cookie, routes to /dashboard.
- `components/auth-actions.tsx`: Login/Logout button (clears token client-side; **no server-side session invalidation exists**).
- **No OTP UI, no "forgot password" link anywhere in the web app** (grep over `app/login` + login-form returns nothing). The three stub endpoints are **API-only AND functionally fake**.
- Marketing claims contradict reality: SaaS plan matrix advertises "Login using OTP" on every plan (`saas.service.ts:63`); security console card says "2FA / OTP — OTP login endpoints and token expiry controls: Active" (`security-console.tsx:35`); security page header has an "Enable 2FA" button with **no onClick** (`app/security/page.tsx:19`). All UI-only.

### Quirks
- `login` does not check tenant `Company.status` — a SUSPENDED tenant's users can still log in and use the API (suspension via SaaS admin only flips the Company row).
- Failed logins are not audited; no lockout/rate limiting.
- `expiresIn: 900` is hardcoded in the response; actual expiry comes from JwtModule (`15m` — consistent today, two sources of truth).

---

## 2. Security module (`apps/api/src/modules/security`)

### Endpoints
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/security/audit-logs` | `settings.configure` | Last 100 `AuditLog` rows w/ actor+employee (`security.service.ts:9-20`). No explicit tenant filter in the service, but AuditLog **is** in the Prisma tenant allowlist, so non-owners get tenant-scoped rows; owners see all tenants. No pagination/filter/search params. |
| GET `/security/notifications` | `settings.configure` | Last 50 `Notification` rows. **Notification is NOT tenant-scoped by the Prisma middleware** → cross-tenant rows for any tenant admin. **API-only**: the security console actually calls `/notifications` instead (see below). Effectively dead code. |

### UI — `components/security-console.tsx` (page `app/security/page.tsx`, Pro plan gate)
- Loads `/security/audit-logs` into a 5-column audit table (Module/Action/Entity/Actor/Date) and `/notifications` (the notifications-module endpoint, permission `notifications.read`) into an "Alerts" metric.
- "Security Controls" card grid (2FA/OTP, Audit Logs, Payroll Encryption, Document Security, Activity Tracking) is a **hardcoded array** (`security-console.tsx:34-40`) with static Active/Configured pills — pure UI-only theater.
- Page header tabs ("Controls", "Roles", "Audit Logs", "Data Security") are static — `activeTab="Controls"` with no onTabChange; the action buttons (Enable 2FA / Roles / Audit / Encrypt) have no handlers (`app/security/page.tsx:16-23`).
- `SecurityAdminWorkflowWorkspace` (`reference-workspaces.tsx:487-501`) is three static info cards.
- Imports `fallbackAuditLogs`/`fallbackNotifications` from `lib/fallback-data` only as TypeScript row types; tables start empty and silently swallow fetch errors (`catch(() => undefined)`) — on permission failure the console renders zeros, not an error.

### Gaps
- No roles/permissions management UI or API (roles are seed-only; there is no `/roles` controller).
- No audit-log filtering, export, retention, or pagination (top 100 only).
- No session management, IP allowlisting, password policy — despite the plan matrix selling "Attendance IP restriction" etc.

---

## 3. Settings module (`apps/api/src/modules/settings`)

### Endpoints (`settings.controller.ts`)
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/settings/public-profile` | @Public | Company + branding rules; safe defaults when no tenant context (`settings.service.ts:279-296`). Used for white-label chrome before login. |
| GET `/settings/company` | `settings.configure` | Company row for current tenant. |
| PATCH `/settings/company` | `settings.configure` | Updates name/legalName/logoUrl/address/taxId/workWeek/timezone (DTO `UpdateCompanyDto`). Audited. |
| GET `/settings/modules` | `settings.configure` | Returns the fixed 22-module list (`MODULES` const, `settings.service.ts:8-31`) merged with `ModuleSetting` rows; missing rows are synthesized as `enabled:true`. |
| PATCH `/settings/modules/:module` | `settings.configure` | Upserts `ModuleSetting {enabled, settingsJson}`. **`:module` is unvalidated** — any string creates a row. Audited. |
| GET `/settings/rules` | **any authenticated user** (deliberate, for branding/plan injection — controller comment line 41) | Returns DEFAULT_RULES merged with tenant `ClientRule` rows + `company` + `activePlan`. Has stale-JWT fallback that re-resolves tenant via userId (`resolveTenantId`, lines 200-214). |
| PATCH `/settings/rules` | `settings.configure` | Upserts one `ClientRule` row per (category, key) in a transaction; whole payload audited (`settings.service.ts:318-349`). |
| GET `/settings/logs` | `settings.configure` | Last 100 audit logs filtered to modules settings/auth/employees/attendance/leave/payroll/expenses/insurance, tenant-scoped. |

### DEFAULT_RULES categories (`settings.service.ts:33-184`) — the platform's entire business-rules registry
`branding` (platformBrand, clientDisplayName, logoDataUrl, social URLs, showPoweredBy, primaryColor, supportEmail), `attendance` (workWeek, shift times, grace, geofence, penaltyMapping), `leave`, `payroll` (PF/ESI/PT/TDS toggles + rates + ceilings + slab arrays, payrollLockDay), `approvals` (routing strings), `permissions` (role→module arrays — **display-only; NOT consumed by PermissionsGuard**), `support` (SLAs, ticketPrefix), `documents` (expiryReminderDays), `taxCalc` (std deductions, 80C/80D/24b caps, cess/surcharge), `salaryStructure` (basicPct, hraPct, defaultTdsPct, performanceIncrementPct), `declarations` (window days, fyCutoffMonth/Day, mandatoryProof), `bankExport` (format, header, narrationPrefix), `performance` (score/rating thresholds), `coupons` (array of {code, discountPercent}), `exitRules` (defaultNoticeDays).
Payroll/performance engines consume these via `getPayrollRules()` / `getPerformanceRules()` (lines 369-385).

### UI — `components/settings-console.tsx` (1,174 lines, page `app/settings/page.tsx`)
- **Company Profile** form → PATCH `/settings/company`.
- **Client Rules & Branding** mega-form → PATCH `/settings/rules`, covering: branding (4 fields), attendance (7), leave (5), payroll config + PF/ESI rate cards + **editable PT slab table** and **editable TDS slab table** (add/remove rows), approvals routing (3 text fields), support SLAs (3), documents expiryReminderDays.
- **Tax Declaration Settings** form (separate save w/ confirm dialog) → PATCH `{declarations}`.
- **Organization Structure** card: inline create-only lists for departments/designations/locations (calls the *organization* module: GET/POST `/organization/departments|designations|locations`). No edit/delete here.
- **Plan Access Settings** + **Module Controls** cards: **owner-only** (client-side JWT role check, line 312). Module toggles → PATCH `/settings/modules/:module`; lock/Upgrade states computed from the client-side plan map, not the API.
- **Settings & Activity Logs** table ← GET `/settings/logs` (top 12 shown).
- Utility cards: "Data Export" downloads the loaded JSON client-side; "Data Import" just links to /employees.
- Uses a custom `silentFetch` that skips fetches the JWT can't pass and never redirects (lines 290-304); non-admins see fallback company data.
- A second editor exists: **Setup Wizard** (`app/setup/page.tsx` → `components/setup-wizard-console.tsx`) writes the same `/settings/company` + `/settings/rules` (attendance, leave incl. earnedLeave/sickLeave/casualLeave quotas, `permissions` role matrix) — overlapping with settings-console but with different field sets. Also `organization-settings-console.tsx` and `leave-settings-console.tsx` write other rule categories (out of scope here but same PATCH).

### API-only (no UI)
- Rule categories `taxCalc`, `salaryStructure`, `bankExport`, `performance`, `coupons`, `exitRules`, branding extras (logoDataUrl, social URLs, supportEmail), attendance `penaltyMapping`/geofence — **PATCHable via API only; no form fields anywhere**.
- GET `/settings/public-profile` — consumed by app chrome, not by any settings screen.

### Known quirks
1. **Declarations key mismatch**: the UI writes `currentFiscalYearStart`/`fiscalYearDeadline` (settings-console.tsx:485-492) but DEFAULT_RULES defines `fyCutoffMonth`/`fyCutoffDay`/`mandatoryProof` (settings.service.ts:152-159). Both key sets end up coexisting in ClientRule; consumers must check which one payroll actually reads.
2. **Coupons are fragile**: `updateRules` does `Object.entries` over each category value; arrays (coupons) would be exploded into numeric-keyed ClientRule rows ("0","1",...), and `mergedRules` would then spread them into an **object**, breaking `Array.isArray` consumers (saas-console falls back to "No Coupons"). Works today only because nothing ever PATCHes `coupons`. Editing coupons = API-only and effectively bug-trapped.
3. `updateRules`' audit log writes `tenantId` implicitly via Prisma middleware but inside the same transaction sets no `actorUserId` (settings.service.ts:335-343) — settings-change audit rows show actor "System".
4. The `permissions` rule category (and the Setup Wizard "Roles & Permissions" matrix) is stored and re-displayed but **never enforced** — real permissions live in Role/Permission tables seeded once.
5. `MODULES` list (settings) ≠ module keys enabled by SaaS onboarding (`directory`, `support`...) ≠ plan-access keys in the web — three diverging module vocabularies (see 4.6).

---

## 4. SaaS module (`apps/api/src/modules/saas`)

### Endpoints (`saas.controller.ts`)
| Method/Path | Permission | Notes |
|---|---|---|
| POST `/saas/signup` | @Public | Full tenant onboarding (4.3). |
| GET `/saas` | `saas.read` | Mega summary (4.2). |
| GET `/saas/coupons` | @Public | Returns `mergedRules().coupons` + branding supportEmail (controller lines 31-44). NB: public + tenantless ⇒ always DEFAULT_RULES coupons (WELCOME10/ANNUAL15/LAUNCH20). |
| GET `/saas/plans` | @Public | Seeds-then-returns the 3 Plan rows (Basic ₹0/5 emp, Standard ₹1,749/25 emp/+₹70, Pro ₹3,750/25 emp/+₹150) (`saas.service.ts:488-519`). |
| GET `/saas/logs` | `saas.read` | Last 50 `ErrorLog` + 50 `SystemLog`. **Neither model is tenant-scoped → global logs visible to any tenant HR admin.** **API-only** — no UI calls it. |
| PATCH `/saas/companies/:id/status` | `saas.configure` | Sets `Company.status` to arbitrary string. **Company is not tenant-scoped** → a tenant HR_ADMIN (who is seeded with `saas.configure`!) can suspend any other tenant by id. |
| POST `/saas/invoice` | `saas.configure` | **Fake**: writes a `saas/invoice.queue` audit row with hardcoded amount 1749 (`saas.service.ts:158-160`). No invoice entity. |
| POST `/saas/license-refresh` | `saas.configure` | **Fake**: audit row only, amount 1749 (`saas.service.ts:162-164`). |
| POST `/saas/select-plan` | `saas.configure` | Real-ish: validates plan; for paid plans requires client-supplied `paymentMethod`+`amount>0` (**no gateway — amount is trusted from the client**); upserts `Subscription` (1-year expiry), creates `Payment` row with synthetic `TXN_...` id and status COMPLETED, sets `ModuleSetting subscription.activePlan`, then bulk-enables/disables ModuleSettings per plan tier (`saas.service.ts:166-270`). |

### 4.2 GET `/saas` summary payload (`saas.service.ts:14-156`)
- Owners see all companies; tenants see their own (explicit `isOwner` branch).
- Returns: tenant counts, activePlan (+limit/usage%), `plans[]` from DB, **hardcoded `planMatrix` (45 feature rows, Kredily-style)** and **hardcoded `planAddOns` (10 rows)** (lines 58-116), computed `billingSummary` (GST 18%), `companies[]`, `entitlements[]` (ModuleSettings), `billingEvents[]` derived from saas-module audit logs.
- Quirk: `usagePercent` divides by plan employee limit; `billingSummaryForPlan` computes `extraEmployees` as `max(0, plan.employees - plan.employees)` = always 0 (lines 280-285) — server-side billing summary never bills extra seats; the web recomputes it properly client-side.

### 4.3 POST `/saas/signup` onboarding (`saas.service.ts:325-472`)
Creates: Company (id = lowercased companyCode), EMP001 employee, admin User, attaches **global SUPER_ADMIN role** (creates it if missing), Subscription (1 yr), Payment (COMPLETED, client-supplied amount), ModuleSettings, audit log. Quirks:
- Every self-service signup admin becomes **SUPER_ADMIN** — which bypasses *all* permission checks and is treated as platform owner (`isOwner`) by the tenant middleware ⇒ signup tenants see cross-tenant data wherever `isOwner` branches exist (e.g. GET `/saas` companies list, unscoped Prisma middleware). Major multi-tenancy hole.
- Enables module keys `directory`, `documents`, ... (lines 434-450) which don't match the settings `MODULES` vocabulary (`employees`, ...) — onboarding entitlements and the settings module list disagree.
- Roles are global (no tenantId on SUPER_ADMIN role row).

### 4.4 UI — `components/saas-console.tsx` (page `app/saas/page.tsx` → `saas-page-content.tsx`)
- Loads GET `/saas` + GET `/saas/coupons`. Renders: metric row; **"My Plan" Kredily-style plan comparison table** (3 plan cards + 45-row feature matrix); **Add-Ons table**; **Plan Summary quote builder** (duration 1-3 yrs, employee count, 6 hardcoded client-side add-ons at ₹20-50/user/mo (`quoteAddOns`, lines 32-39), coupon dropdown from `/saas/coupons`, GST 18%); **Billing Summary + "Pay ₹X"** → POST `/saas/select-plan` (then writes plan cookie and reloads); **Invoice Preview** (print + HTML download); Companies table; Module Entitlements grid; Billing Events table.
- "Queue Invoice" / "Refresh License" buttons → the fake POST `/saas/invoice` / `/saas/license-refresh`.
- **Simulated bits**: payment receipt is generated client-side (`SKY-PAY-...`, line 317); "Valid till 30/09/2026" hardcoded (line 388); Billed From "Acme Corp" + phone "+1-800-555-0199" hardcoded (lines 266-268, 637-640); selected add-ons & coupon affect the quote/charged amount but are **never persisted** — select-plan only stores plan name.
- Receipt text admits it: "Use this receipt for internal tracking until payment gateway verification is connected" (line 613).

### 4.5 UI — `components/saas-admin-page-content.tsx` (page `app/saas-admin/page.tsx`, "SaaS Control Room")
- Owner gate decodes JWT and checks `isSuperAdmin === true` OR permission `saas.admin` OR role `super_admin` (**lowercase**, lines 62-67). The real role string is `SUPER_ADMIN` and neither `isSuperAdmin` nor a `saas.admin` permission exists ⇒ **the gate fails for actual super admins; page shows "Owner Credentials Required" for everyone**. Broken client gate (API would still authorize per `saas.read`).
- Dashboard tab: MRR/ARR from billingEvents; revenue breakdown bars **hardcoded at 65%/35%**; "Live Server Diagnostics" CPU 14.2% / 512MB **hardcoded** — UI-only. Billing event log table is real.
- Tenants tab: company table with Suspend/Activate → PATCH `/saas/companies/:id/status` (real).
- Encoding note: the file contains mojibake (`â‚¹` for ₹) — literal corrupted rupee signs in source.

### 4.6 UI — `app/signup/page.tsx` (public, 4-step wizard)
Step 1 plan select (prices hardcoded client-side, matching seeds); step 2 org+admin details; step 3 **simulated card payment** (prefilled `4111 •••• •••• 1111`, `12/29`, CVC `321` — lines 38-40, nothing validated, amount = hardcoded plan price); step 4 success → /login. Calls POST `/saas/signup` only. Does **not** use `/saas/plans` or `/saas/coupons` (coupon endpoint's stated purpose, "SaaS frontend needs coupons without authentication during signup", is currently unused by signup).

---

## 5. Analytics module (`apps/api/src/modules/analytics`)

### Endpoint
- GET `/analytics` — permission `analytics.read` — the module's **only** endpoint. Computes from full-table reads: headcount, attendanceRate (PRESENT+LATE / all logs), leaveApprovalRate, monthlyPayroll (sum gross of **all payslips ever**), payrollNet, pendingExpenses, annualCtc; department/location breakdowns; 3 canned "insights"; a fake 4-point "trend" (it's current values, not a time series); 2 "risk" counters (`analytics.service.ts:9-75`).

### Quirks
- **Partial tenant isolation**: `employee.findMany` is auto-scoped (Employee allowlisted) but `attendanceLog/leaveRequest/payslip/expense.findMany()` are **not** → rates and payroll totals mix all tenants' data.
- No date-range, month, or filter params at all; "monthlyPayroll" is actually all-time gross.
- Loads entire tables into memory (no aggregate queries) — scaling hazard.

### UI — `components/analytics-console.tsx` (page `app/analytics/page.tsx`, Pro gate)
Read-only: 3 metric cards, Executive Insights cards, Department Mix & Location Mix bar lists, Workforce/Payroll cards, Risk Signals. A "Live HRMS Data" pill. `AnalyticsWorkflowWorkspace` strip cards have **hardcoded ¾-width progress bars** (`reference-workspaces.tsx:503-522`). No controls, no export, no drill-down — the trend array from the API isn't even charted.

---

## 6. Reports module (`apps/api/src/modules/reports`)

### Endpoints (`reports.controller.ts`)
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/reports/employees` | `reports.read` | Directory rows (code/name/dept/designation/location/status); tenant-scoped explicitly. |
| GET `/reports/attendance` | `reports.read` | **Last 100 logs only** (take:100) + present/late/absent counts; scoped via `employee.companyId`. |
| GET `/reports/leave` | `reports.read` | All leave requests + pending/approved counts. |
| GET `/reports/payroll` | `reports.read` | All payslips + gross/deductions/net totals. |
| GET `/reports/expenses` | `reports.read` | All expenses + total amount + pending count. |
| GET `/reports/compliance` | `reports.read` | Per-employee PF/ESI/PT/TDS from `SalaryStructure` + payroll run count. |
| POST `/reports/export` | `reports.export` | **Fake**: writes an `export.queue` audit row (`format:"xlsx", status:"QUEUED"`) and returns `{status:"queued", auditId}`. **No worker exists; nothing is ever generated** (`reports.service.ts:23-38`). |
| POST `/reports/custom` | `reports.read` | **Real custom report builder** (`reports.service.ts:40-187`): whitelisted models (employee, attendanceLog, leaveRequest, payslip, expense) + whitelisted fields per model; only `where.status` filtering allowed; non-employee models auto-join employee code/name; explicitly tenant-scoped; hard cap `take ≤ 5000`; dates flattened to YYYY-MM-DD; returns `{headers, rows, total}`. |

All six canned reports are explicitly tenant-scoped in the service (defensive — they'd be unscoped otherwise since their models aren't in the Prisma allowlist).

### UI — `components/reports-console.tsx` (page `app/reports/page.tsx`)
- Tabs: Employees / Attendance / Leaves / Payroll / Expenses / Compliance / **Custom Builder**.
- Six clickable report template cards w/ live row counts (fires all 6 GETs on mount); per-report preview tables; client-side search + status + department filters (department dropdown options are hardcoded: People/Finance/Engineering/Sales/Operations — line 524-529 — will not match arbitrary tenants).
- **"Download Excel" is client-side CSV** built from filtered preview rows; "Print PDF" = `window.print()`. The "Trigger Export Job" button calls the fake POST `/reports/export` and shows "queued" + audit id — the user can never retrieve that export.
- **Custom Builder tab** (UI mirror of POST `/reports/custom`): dataset dropdown, status filter, column checkboxes (the model/field whitelist is duplicated in `CUSTOM_MODELS`, lines 87-151 — must stay in sync with the API whitelist by hand), Generate Preview (first 10 rows shown), full CSV export client-side.
- Quirk: attendance report only ever covers the latest 100 logs, so "Total Records" for attendance is misleading; payroll/leave/expense reports have no period filter.

---

## 7. Dashboard module (`apps/api/src/modules/dashboard`)

### Endpoints
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/dashboard/admin` | `reports.read` | Same payload as all panels. |
| GET `/dashboard/manager` | `attendance.read` | idem |
| GET `/dashboard/employee` | `employees.read` | idem |
| GET `/dashboard/super-admin` | `settings.configure` | idem |
| GET `/dashboard/celebrations` | `employees.read` | Birthday + joining-anniversary list for the **current month** (not "today"), sorted by day (`dashboard.service.ts:38-94`). |

### Quirks
- **The four role panels return identical data** — `metrics(panel)` ignores the panel string except to echo it (`dashboard.service.ts:9-36`): employeeCount, presentToday, pendingLeaves, payrollNetPay (sum of **all** payslips ever), pendingCompliance (count of audit rows `module=compliance, action="pending"` — almost certainly always 0), pendingApprovals (duplicate of pendingLeaves).
- Tenant isolation is partial: employee.count scoped via middleware; **attendanceLog.count, leaveRequest.count, payslip.aggregate are unscoped** → cross-tenant numbers for every dashboard.
- No per-employee scoping for the employee panel — an employee sees company-wide pendingLeaves etc.

### UI
- `components/dashboard-widgets.tsx`: Celebrations card (GET `/dashboard/celebrations`), Pinned Announcements (GET `/announcements`, filter `isPinned`, top 3), Policies Awaiting Acknowledgment (GET `/policies`). All real.
- The main dashboard page additionally uses `live-metrics.tsx`/role panels (out of scope for this doc but the metrics come from the endpoints above).
- skynexus social console renders its own "Upcoming Birthdays" widget with **fabricated dates** (round-robin "Today"/"Tomorrow"/"June 12"... assigned by array index — `skynexus-console.tsx:134-146`) instead of calling `/dashboard/celebrations`. UI-only fake.

---

## 8. Notifications + Reminders

### 8.1 Notifications module (`apps/api/src/modules/notifications`)
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/notifications` | `notifications.read` | **All** Notification rows, no take limit, newest first. Notification model unscoped → cross-tenant. |
| GET `/notifications/recipients` | `notifications.read` | Active users + employee join (User model IS tenant-scoped). **API-only** — no UI calls it (the send panel uses fixed audiences). |
| POST `/notifications` | `notifications.create` | Resolves recipients: explicit `userId`, audience `"HR"` (HR_ADMIN+SUPER_ADMIN users), else **all active users**; creates one Notification per user (status PENDING); audits broadcast (`notifications.service.ts:34-68`). **Creates DB rows only — no email/WhatsApp/push is actually dispatched, regardless of channel.** |
| PATCH `/notifications/:id/sent` | `notifications.update` | Marks SENT + sentAt, audited. Manual — there is no sender worker. |

UI:
- `components/notifications-console.tsx` (page `app/notifications/page.tsx`, Standard plan): tabs Queue/Email/Push/Templates. Queue table = `NotificationsTable` (`live-tables.tsx:884+`) ← GET `/notifications`, client-side channel/status/search filtering, per-row "mark sent" → PATCH `:id/sent`. **Templates tab is a hardcoded 4-template array** (`notifications-console.tsx:10-39`) — no template CRUD or API. `NotificationsWorkflowWorkspace` = 3 static "Channel ready" cards (UI-only).
- `NotificationSendPanel` (`action-panels.tsx:468-515`, rendered on the notifications page): audience (ALL/HR) + channel (EMAIL/WHATSAPP/IN_APP/PUSH) + title/body → POST `/notifications`. Channel choice is cosmetic (rows only).
- Seeded permissions: only HR_ADMIN (+SUPER_ADMIN) hold `notifications.read` → employees/managers cannot open their own notification feed; **there is no "my notifications" endpoint** at all (in-app rows created by reminders are unreadable by their recipients).

### 8.2 Reminders module (`apps/api/src/modules/reminders`) — document expiry engine
| Method/Path | Permission | Notes |
|---|---|---|
| POST `/reminders` | `settings.configure` | Creates `ReminderRule {event, daysOffset, channel, templateSubject, templateBody, enabled}`; `companyId` deliberately set `""` and overwritten by the Prisma tenant middleware (`reminders.service.ts:18` comment). |
| GET `/reminders` | `settings.configure` | List rules (tenant-scoped via middleware). |
| PATCH `/reminders/:id` | `settings.configure` | Update/toggle rule. |
| POST `/reminders/process` | `settings.configure` | **Manually-triggered processor — there is no cron/scheduler anywhere in the API.** For each enabled rule: DOCUMENT_EXPIRY → finds employee documents expiring exactly `offset` days out (offset overridable by ClientRule `documents.expiryReminderDays`), dedupes via `ReminderLog` per doc/day, creates IN_APP Notification for the employee (status SENT), sends a real email via `MailService` when channel EMAIL/BOTH, notifies the manager in-app, logs to ReminderLog (`reminders.service.ts:56-195`). |
| GET `/reminders/upcoming-expiries` | `employees.read` | Documents expiring within the configured window (default 30d), tenant-scoped explicitly. Consumed by `employees-console.tsx:103`. |

Quirks:
- **BIRTHDAY rule type is dead code**: `else if (rule.event === "BIRTHDAY") { const today = new Date(); }` — declares a variable and does nothing (`reminders.service.ts:188-190`). The UI offers BIRTHDAY / WORK_ANNIVERSARY / LEAVE_BALANCE / PROBATION_END events (`app/(dashboard)/reminders/page.tsx:156-162`) — **only DOCUMENT_EXPIRY does anything**; the other four are accepted, stored, counted in `processedCount`, and silently no-op.
- `processReminders` iterates rules across **all tenants visible to the caller**; when run by a SUPER_ADMIN (isOwner ⇒ no scoping) it processes every tenant — fine as a job, surprising as a button.
- `processedCount` counts rules, not reminders sent — UI message "Processed N reminder rules" is honest but easy to misread.
- Reminder UI page: `/reminders` (nav label "Reminders"): rule cards w/ enable toggle, "Process Now" button, create form (subject/body support `{{name}}` placeholders that nothing substitutes). Tucked under `(dashboard)` route group, mapped to module `notifications` for nav gating (`app-shell-frame.tsx:157`).

---

## 9. Approvals module (`apps/api/src/modules/approvals`) — cross-module inbox

### Endpoints
| Method/Path | Permission | Notes |
|---|---|---|
| GET `/approvals` | `approvals.read` | Unified inbox: merges **leave requests + attendance regularizations only** into `{total, pending, approved, rejected, modules[], items[]}` (`approvals.service.ts:11-59`). Pending = status in PENDING/DRAFT/ACTIVE. |
| POST `/approvals/:module/:id/decision` | `approvals.approve` | body `{decision: approve\|reject}`. Handles **five** modules: `leave` (status+decidedAt), `attendance` (transactional: creates/updates AttendanceLog from requested check-in/out, marks PRESENT, source REGULARIZATION), `expenses` (status + hrApprovedBy), `insurance` (claim status+decidedBy), `payroll` (run status+processedBy). Audited (`approvals.service.ts:61-145`). |

### Quirks
- **Inbox vs decide asymmetry**: expenses/insurance/payroll are decidable here but never appear in GET `/approvals` — those queues live in their own consoles. The approvals UI summary cards say it covers "leave requests, attendance logs, expenses, insurance claims, and payroll runs" but the table can only ever show Leave + Attendance.
- **No tenant scoping**: LeaveRequest/AttendanceRegularization/Expense/InsuranceClaim aren't in the Prisma allowlist and the service adds no companyId filter → the inbox aggregates **all tenants**, and `decide` will happily approve another tenant's record by id.
- No approver-chain logic: any holder of `approvals.approve` decides anything in one step; the `approvals` ClientRule routing strings ("Manager then HR") are decorative.
- Approving leave here does **not** deduct leave balances (no balance logic in this path) — check the leave module for the real flow.
- Seeded MANAGER lacks `approvals.read`/`approvals.approve` (only HR_ADMIN/SUPER_ADMIN have them) — managers approve from the leave/attendance consoles instead, not from this inbox.

### UI — `components/approvals-console.tsx` (page `app/approvals/page.tsx`, Standard gate)
- Tabs Pending/Approved/Rejected/**Escalated** (Escalated filters status `HOLD`, which no API ever sets → permanently empty, hardcoded "0" stat).
- KPI cards, module filter cards (**only a "Leaves" card is rendered**, line 355-357 — attendance items can't be module-filtered), search, table with Inspect/Approve/Reject, "Approve Bulk" (fires N parallel decision POSTs for everything pending in view).
- **"Inspect" modal shows fabricated detail text** per module — hardcoded reason "Personal family gathering. Travel tickets verified...", fake receipt filename `receipt_tax_invoice.png`, fixed shift "9:30 AM - 6:30 PM", "Dental implant treatment...", "5 Active Employees calculated" (lines 178-287). None of this comes from the record. UI-only simulation.
- `ApprovalsWorkflowWorkspace` strip: 4 static info cards.

---

## 10. AI module

- `apps/api/src/modules/ai/` is an **empty directory** — no module, controller, service, or registration in `app.module.ts`. There is **zero AI functionality in the codebase** (no LLM SDKs in either app).
- "SkyNexus" (`components/skynexus-console.tsx`, route `/social`) is **not AI** — it is the internal social feed (posts/likes/comments/announcements/recognition/birthdays) backed by the `social` module (`/social/feed`, `/social/posts`, like/comment endpoints). Plan matrix markets it as "SkyNexus employee social network".
- The only other "ai" traces: setup wizard filters a hypothetical `"ai"` module key out of module settings (`setup-wizard-console.tsx:133`), and a SaaS quote add-on key `attendance-ai` ("Advanced Attendance System", `saas-console.tsx:38`) which is just a priced label.
- **For the redesign: treat AI as net-new; nothing to preserve.**

---

## 11. Health module (`apps/api/src/modules/health`)

- GET `/health` — `@Public()` — returns `{status:"ok", product:"SKYLINX PeopleOS", timestamp}` (`health.controller.ts`). Static; **does not check DB connectivity**. No UI consumes it (the saas-admin "Live Server Diagnostics" card fakes its numbers instead of calling this). No liveness/readiness split.

---

## 12. Summary tables for the redesign

### Fake / simulated surfaces (do not assume these work)
| Surface | Reality |
|---|---|
| OTP login, OTP verify, forgot password | Echo stubs; no UI either |
| "Enable 2FA" button, Security Controls cards | No handlers / hardcoded |
| POST `/reports/export` + "Trigger Export Job" | Audit row only, no artifact ever |
| POST `/saas/invoice`, `/saas/license-refresh` | Audit rows w/ hardcoded ₹1,749 |
| SaaS payment (console + signup) | Client-trusted amounts, fake receipt/card, no gateway |
| Approvals "Inspect" modal details | Hardcoded narrative text |
| Approvals "Escalated" tab | Filters a status that never exists |
| Reminder events other than DOCUMENT_EXPIRY | Stored but no-op |
| Notification channels EMAIL/WHATSAPP/PUSH via POST `/notifications` | DB rows only; only reminders actually email |
| Dashboard pendingCompliance, per-role panels | Always ~0; all four panels identical |
| saas-admin server diagnostics, revenue bars | Hardcoded numbers |
| SkyNexus "Upcoming Birthdays" | Fabricated dates |
| Notification "Templates" tab | Hardcoded array, no CRUD |
| `permissions` client-rule category / setup-wizard role matrix | Stored, never enforced |

### API-only (no UI)
GET `/security/notifications`; GET `/saas/logs`; GET `/notifications/recipients`; PATCH rule categories `taxCalc`/`salaryStructure`/`bankExport`/`performance`/`coupons`/`exitRules`/branding-extras; GET `/auth/me`; GET `/health`; OTP/forgot-password stubs.

### Highest-impact platform quirks for any redesign
1. `x-tenant-id` header spoofing + unverified JWT decode in TenantMiddleware.
2. Prisma tenant-scoping allowlist misses AttendanceLog/LeaveRequest/Payslip/Expense/Notification/Company/ErrorLog → cross-tenant leakage in analytics, dashboards, approvals inbox/decide, notifications list, saas logs, company status PATCH.
3. Self-service signup grants SUPER_ADMIN (= owner = bypass everything).
4. HR_ADMIN is seeded with `saas.configure` → can suspend arbitrary companies and switch plans.
5. Plan gating is a client cookie; no server enforcement.
6. 15-minute JWT with no refresh.
7. saas-admin owner gate checks the wrong role string (`super_admin` vs `SUPER_ADMIN`) — page is dead for everyone.
8. Three diverging module vocabularies (settings MODULES, saas onboarding keys, web plan-access keys).
9. Declarations rule keys differ between UI and API defaults.
10. Recipients of in-app notifications have no endpoint to read them (notifications.read is admin-only and there's no "mine" filter).
