# RBAC & Settings Inventory — Seed Permission Matrix + Full DEFAULT_RULES Key Map

> Generated 2026-06-13 from `packages/database/prisma/seed.ts` (roles, permissions, role grants) and `apps/api/src/modules/settings/settings.service.ts` (DEFAULT_RULES + merge/consume helpers) on branch `2.0`.
> This is the authoritative source for §08 (Platform Admin: permissions UI + settings tree) and the **DEFAULT_RULES key every admin-editable control in §03–§09 must name**. Permission strings are `module.action`, actions ∈ `create|read|update|delete|approve|export|configure`.

---

## PART A — RBAC

## A0. Model & enforcement
- Tables: `Role`, `Permission(module, action)`, `RolePermission`, `User`, `UserRole`. At login, roles→permissions are flattened to `module.action` strings into the JWT `permissions[]` (`auth.service.ts:50-51`).
- Enforcement: global `PermissionsGuard` (`apps/api/src/common/auth/permissions.guard.ts:28`). **`SUPER_ADMIN` bypasses ALL checks** (line 30) — it has no explicit grants and needs none.
- **Custom roles are possible** (Role/Permission tables are data) but there is **no roles/permissions admin API or UI** today (platform.md §2 "Gaps") — roles are seed-only. §08 must add the role editor + per-user overrides.
- The `permissions` ClientRule category and the Setup-Wizard "Roles & Permissions" matrix are **display-only and never enforced** (platform.md §3 quirk 4) — do not confuse with real grants.

## A1. System roles (`seed.ts:104-109`)
| id | name | nature |
|---|---|---|
| `role_super_admin` | **SUPER_ADMIN** | Owner; bypasses guard; also treated as platform owner (`isOwner`) by tenant middleware. Self-service signup grants this (platform.md §4.3) — multi-tenancy hole. |
| `role_hr_admin` | **HR_ADMIN** | Operational admin; broad grants (A3). |
| `role_manager` | **MANAGER** | Team approver; narrow grants (A4). |
| `role_employee` | **EMPLOYEE** | Self-service; narrow grants (A5). |

Demo logins: `admin@example.com` (HR_ADMIN), `superadmin@example.com` (SUPER_ADMIN) — password env or `password123`; `manager@example.com` / `employee@example.com` — password env `DEMO_PASSWORD` or `Demo@12345`.

## A2. Permission universe (`seed.ts:119-121`)
**30 modules × 7 actions = 210 permission rows seeded.** Modules: `employees, attendance, leave, payroll, expenses, holidays, insurance, assets, performance, mobile, backup, testing, analytics, saas, approvals, notifications, organization, reports, rewards, settings, social, compliance, recruitment, training, travel, grievance, policies, surveys, tickets, exit`.
- **Phantom modules** (permissions exist, no controller): `mobile, backup, testing, exit`. (`exit` lifecycle is served under `employees.*` in practice; `mobile/backup/testing` are pure grants.)
- **`delete` is granted to NO seeded role** — only SUPER_ADMIN (bypass) can ever hit a `*.delete` route. Every "delete" button in §03–§09 is effectively SUPER_ADMIN-only unless a custom role grants it.

## A3. HR_ADMIN grants (`seed.ts:131-155`)
| Action | Modules granted |
|---|---|
| **read** | all 29 listed (employees, attendance, leave, payroll, expenses, holidays, insurance, assets, performance, mobile, backup, testing, analytics, saas, approvals, notifications, organization, reports, rewards, social, compliance, recruitment, training, travel, grievance, policies, surveys, tickets, exit) — **note `settings.read` is NOT granted** (only `settings.configure`) |
| **create** | employees, attendance, leave, payroll, expenses, holidays, insurance, notifications, rewards, social, recruitment, training, travel, grievance, policies, surveys, tickets, exit |
| **update** | employees, attendance, leave, payroll, expenses, holidays, insurance, notifications, organization, recruitment, training, travel, grievance, policies, surveys, tickets, exit |
| **approve** | leave, attendance, expenses, insurance, recruitment, grievance, exit, **approvals, employees, payroll** |
| **configure** | payroll, mobile, backup, testing, saas, assets, performance, settings, leave, employees, recruitment, travel, training, grievance, policies, surveys, tickets, exit, attendance |
| **export** | payroll, reports, compliance |
| **delete** | — (none) |
- Notable HR_ADMIN holes: no `analytics`/`social`/`organization`/`compliance`/`notifications`/`holidays`/`insurance` **.configure**; no `compliance.create/update` (read+export only); `organization` has update but **not configure**; `performance.approve`/`performance.create` **NOT granted** (talent.md §1.4/1.5 — appraisal manager-rate and 360 are unreachable for HR by seed); `travel.approve` **NOT granted to HR** (talent.md §4.1 — only MANAGER+SUPER_ADMIN approve travel).
- **HR_ADMIN holds `saas.configure`** → can suspend any tenant / switch plans (platform.md §0.4 — security hole to fix, not a feature to surface in §08 for tenant HR).

## A4. MANAGER grants (`seed.ts:328-345`)
`employees.read · attendance.read · attendance.approve · leave.read · leave.approve · expenses.approve · recruitment.read · training.approve · travel.approve · grievance.read · policies.read · surveys.read · surveys.create · surveys.configure · tickets.read · tickets.create`.
- **Missing (so these consoles 403 for managers):** `approvals.read/approve` (managers approve from leave/attendance consoles, not the Inbox — platform.md §9), `reports.read`, `notifications.read`, `analytics.read`, `performance.*`, `social.*`, `payroll.*`, `expenses.read` (can approve but **not list**!), `assets.read`, `insurance.read`, `dashboard` via `reports.read` (manager dashboard endpoint needs `attendance.read` ✓).
- `training.approve` matches **zero endpoints** (talent.md §3.2 — dead grant).

## A5. EMPLOYEE grants (`seed.ts:346-364`)
`employees.read · employees.update · attendance.create · leave.create · payroll.read · expenses.create · training.create · travel.create · grievance.create · grievance.read · policies.read · surveys.read · tickets.read · tickets.create · holidays.read · insurance.read · insurance.create`.
- Consequences: employee **cannot** list their own leave/attendance/expenses (no `*.read` on those — lists are HR-scoped; payroll.read is self-scoped so payslips work); `training.create` lets employees create programs/skills (over-broad, talent.md §3.2); `insurance.create` lets an employee create a policy for anyone (engagement.md §7); **no `performance.read`** → ESS appraisal flow 403s (talent.md §1.4); **no `social.read`** → SkyNexus feed 403s (engagement.md §1); **no `notifications.read`** → cannot read own notifications (platform.md §8.1).

## A6. Seeded matrix (compact: ✓=granted, ◐=partial subset, blank=none; SUPER_ADMIN=all via bypass)
| module | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|
| employees | r c u a cfg | r | r u |
| attendance | r c u a cfg | r a | c |
| leave | r c u a cfg | r a | c |
| payroll | r c u a cfg exp | — | r |
| expenses | r c u a | a | c |
| holidays | r c u | — | r |
| insurance | r c u a | — | r c |
| assets | r cfg | — | — |
| performance | r cfg | — | — |
| organization | r u | — | — |
| recruitment | r c u a cfg | r | — |
| training | r c u cfg | a* | c |
| travel | r c u cfg | a | c |
| grievance | r c u(a) cfg | r | r c |
| policies | r c u(a) cfg | r | r |
| surveys | r c u(a) cfg | r c cfg | r |
| tickets | r c u cfg | r c | r c |
| social | r c u | — | — |
| rewards | r c | — | — |
| notifications | r c u | — | — |
| approvals | r a | — | — |
| analytics | r | — | — |
| reports | r exp | — | — |
| compliance | r exp | — | — |
| saas | r cfg | — | — |
| settings | cfg (no r) | — | — |
| mobile/backup/testing | cfg | — | — |
| exit | r c u a cfg | — | — |
(*MANAGER `training.approve` = dead grant; grievance/policies/surveys use `approve`=`grievance.approve` mapped via the module's update verb.) **delete: none for any role.**

## A7. RBAC redesign mandates (for §08)
1. Build a **role × action grid editor** (create/clone custom roles, per-user overrides) — none exists.
2. Surface scopes (self/team/dept/company) — backend has no scope columns today; treat as NEW.
3. Fix the seed gaps the UI assumes work: `performance.approve`/`performance.create` to managers/reviewers; `travel.approve`/`read` to HR; `expenses.read` to managers; `approvals.read/approve` to managers; `*.read` self-scoped reads for employees (leave/attendance/expenses/notifications/social).
4. Remove `saas.configure` from tenant HR_ADMIN.
5. The `permissions` ClientRule category + setup-wizard matrix are decorative — either wire them to real grants or drop them.

---

## PART B — SETTINGS (DEFAULT_RULES)

## B0. Mechanics (`settings.service.ts`)
- `DEFAULT_RULES` (lines 33-184) is the entire business-rules registry, 16 categories. `mergedRules()` (299-316) = deep-clone of DEFAULT_RULES, overlaid by tenant `ClientRule(category,key,valueJson, status=ACTIVE)` rows.
- Read: `GET /settings/rules` (**any authenticated user** — for branding/plan injection) returns `{...merged, company, activePlan}`. Write: `PATCH /settings/rules` (`settings.configure`) upserts one ClientRule per `(category,key)` in a transaction; whole payload audited (actor null — quirk 3).
- Consumers: `getPayrollRules()` = `{...payroll, taxCalc, declarations, bankExport}` (370-380); `getPerformanceRules()` = `performance` (382-385). Attendance/leave read their own categories directly.
- `MODULES` list for `/settings/modules` toggles = 22 keys (employees…settings) — a **different vocabulary** from plan-access and saas-onboarding (platform.md §3 quirk 5).

## B1. Every DEFAULT_RULES key — value, consumer, current UI status
Status: **UI** = a settings form field exists today · **API-only** = PATCHable, no field · **broken** = UI writes wrong key (see notes).

### `branding` (white-label chrome; consumed by `app-shell-frame.tsx`, `publicProfile`)
| key | default | status |
|---|---|---|
| `platformBrand` | `"PeopleOS"` | UI |
| `clientDisplayName` | `"My Company"` | UI |
| `primaryColor` | `"#078ced"` | UI (but largely unconsumed — shell.md §0.4) |
| `showPoweredBy` | `true` | UI |
| `logoDataUrl` | `""` | API-only |
| `linkedinUrl` / `facebookUrl` / `xUrl` | `""` | API-only |
| `supportEmail` | `"support@example.com"` | API-only |

### `attendance` (consumed by attendance.service: check-in/late/geofence/auto-process; time.md)
| key | default | status |
|---|---|---|
| `workWeek` | `"Monday to Saturday"` | UI |
| `shiftStart` | `"09:30"` | UI |
| `shiftEnd` | `"18:30"` | UI |
| `graceMinutes` | `10` | UI |
| `geoAttendance` | `true` | UI |
| `biometricRequired` | `false` | UI |
| `overtimeEnabled` | `true` | UI |
| `geofenceRadiusMeters` | `200` | **API-only** (no field; powers geofence radius) |
| `penaltyMapping` | `{ABSENT:FULL_DAY, LATE:HALF_DAY, EARLY_EXIT:HALF_DAY, MISSED_PUNCH:HALF_DAY, OUT_TIME:HALF_DAY, SHORT_HOURS:HALF_DAY}` | **API-only** (powers convert-LOP; §04 must add editor) |

### `leave` (consumed by leave.service: day-count, leave year; time.md)
| key | default | status |
|---|---|---|
| `approvalFlow` | `"Manager then HR"` | UI (decorative — no chain engine) |
| `sandwichLeave` | `false` | UI |
| `carryForward` | `false` | UI |
| `compOffAllowed` | `true` | UI |
| `leaveYear` | `"Calendar Year"` | UI (drives Apr/Jan year flip) |
> Per-leave-type rules live in `ClientRule(category="leave_type_settings", key=typeId)` — a **separate** registry (time.md §1), not in DEFAULT_RULES.

### `payroll` (consumed by `getPayrollRules` → payroll.service calculate; money.md)
| key | default | status |
|---|---|---|
| `salaryStructure` | `"Monthly CTC"` | UI (display string) |
| `pfEnabled` / `esiEnabled` / `professionalTaxEnabled` / `tdsEnabled` | `true` | UI |
| `payrollLockDay` | `28` | UI |
| `pfEmployeeRate` / `pfEmployerRate` | `12.0` / `12.0` | UI (rate cards) |
| `pfWageCeiling` | `15000` | UI |
| `esiEmployeeRate` / `esiEmployerRate` | `0.75` / `3.25` | UI |
| `esiWageCeiling` | `21000` | UI |
| `ptSlabs` | `[{upto:10000,monthly:0},{upto:15000,110},{upto:20000,130},{upto:999999,200}]` | UI (editable PT slab table) |
| `tdsSlabs` | 7-band ladder 0→30% (250k/500k/750k/1M/1.25M/1.5M/∞) | UI (editable TDS slab table) |

### `approvals` (decorative routing strings; no chain engine)
| key | default | status |
|---|---|---|
| `expenseApproval` | `"Manager then HR"` | UI |
| `documentVerification` | `"HR"` | UI |
| `payrollApproval` | `"HR Admin"` | UI |

### `permissions` (**stored, NEVER enforced** — platform.md §3 quirk 4)
| key | default |
|---|---|
| `superAdmin` | `["all"]` |
| `hrAdmin` | `["employees","documents","attendance","leave","payroll","reports","settings"]` |
| `manager` | `["dashboard","employees","attendance","leave","approvals","reports"]` |
| `employee` | `["dashboard","attendance","leave","documents","cards"]` |
Status: UI (setup wizard + settings) but **decorative** — real RBAC is the Role tables (Part A).

### `support` (consumed by tickets.service SLA; engagement.md §6)
| key | default | status |
|---|---|---|
| `slaHighHours` / `slaMediumHours` / `slaLowHours` | `24` / `48` / `72` | UI |
| `defaultQueue` | `"HR Helpdesk"` | **API-only** (settings save DROPS it — engagement.md §6) |
| `ticketPrefix` | `"TKT"` | **API-only** (same drop bug) |

### `documents`
| key | default | status |
|---|---|---|
| `expiryReminderDays` | `30` | UI (also overrides reminders offset) |

### `taxCalc` (consumed by payroll TDS; money.md §1.10) — **all API-only**
| key | default |
|---|---|
| `standardDeductionNew` | `75000` |
| `standardDeductionOld` | `50000` |
| `section80CCap` | `150000` |
| `section80DCap` | `25000` |
| `section24bCap` | `200000` |
| `cessPct` | `0.04` |
| `surchargePct` | `0.10` |
| `surchargeThreshold` | `5000000` |

### `salaryStructure` (consumed by promotion/template % math; core-hr.md §1.13) — **all API-only**
| key | default |
|---|---|
| `basicPct` | `0.40` |
| `hraPct` | `0.50` |
| `defaultTdsPct` | `0.05` |
| `performanceIncrementPct` | `0.10` |

### `declarations` (consumed by tax-declaration window enforcement; money.md §1.11)
| key | default | status |
|---|---|---|
| `windowEnabled` | `true` | UI (Tax Declaration Settings form) |
| `monthlyFromDay` / `monthlyToDay` | `1` / `10` | UI |
| `fyCutoffMonth` / `fyCutoffDay` | `1` (Jan) / `31` | UI but **broken**: UI writes `currentFiscalYearStart`/`fiscalYearDeadline` (wrong keys) — both key sets coexist; payroll reads `fyCutoff*` (platform.md §3 quirk 1) |
| `mandatoryProof` | `true` | UI |

### `bankExport` (consumed by bank-file CSV; money.md §1.16) — **all API-only**
| key | default |
|---|---|
| `format` | `"GENERIC_CSV"` |
| `includeHeader` | `true` |
| `narrationPrefix` | `"SALARY"` |

### `performance` (consumed by `getPerformanceRules`; talent.md §1) — **all API-only**
| key | default |
|---|---|
| `scoreMin` / `scoreMax` | `55` / `100` |
| `ratingExcellent` / `ratingGood` | `4.0` / `3.0` |
| `scoreGoodThreshold` | `75` |
| `attendanceCompleteThreshold` | `80` |
| `promotionScoreThreshold` | `4.0` |
| `incrementPct` | `0.10` |

### `coupons` (consumed by SaaS quote; platform.md §4) — **API-only AND bug-trapped**
Default: `[{code:"none",0},{code:"WELCOME10",10},{code:"ANNUAL15",15},{code:"LAUNCH20",20}]`. Editing via PATCH explodes the array into numeric-keyed rows (platform.md §3 quirk 2) — §08 must treat coupon editing as a dedicated endpoint, not the generic rules PATCH.

### `exitRules` (consumed by F&F notice default; core-hr.md §1.8) — **API-only**
| key | default |
|---|---|
| `defaultNoticeDays` | `90` |

## B2. Settings redesign mandates (for §08)
1. **Every key above gets a labeled control** with helper text + default badge + reset-to-default; the 30+ currently API-only keys (penaltyMapping, geofenceRadiusMeters, all of taxCalc/salaryStructure/bankExport/performance/exitRules, branding extras, support queue/prefix) are the biggest gap.
2. Fix the `declarations` key mismatch (write `fyCutoffMonth/Day`), the `support` save dropping queue/prefix, and the `coupons` array PATCH.
3. Stamp `actorUserId` on settings audit rows (currently "System").
4. Reconcile the 3 module vocabularies (settings MODULES / plan-access / saas onboarding).
5. Per-leave-type settings (`leave_type_settings` ClientRule) belong in the Leave Types editor (§04), not the global settings tree.
