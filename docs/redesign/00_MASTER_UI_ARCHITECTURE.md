# PeopleOS — Master UI Architecture & Redesign Plan

> Status: **living document**. Domain inventories (raw, exhaustive, with file:line refs) live in
> `docs/redesign/inventory/`. This file is the synthesis: product vision, information
> architecture, design language, domain screen plan, and the phased migration roadmap.
> All nine inventories are complete (core-hr, time, money, talent, engagement, platform, **shell**, **rbac-settings**, **blueprint**)
> and all twelve per-screen section specs live in `docs/redesign/sections/` (01–12). Remaining: adversarial critique + `99_IMPLEMENTATION_ROADMAP.md` (§9).

---

## 1. Product vision

PeopleOS is a **white-label, multi-tenant, India-first enterprise HRMS**. The redesign goal is a
**Workday/Keka/Darwinbox-class** product that is visually distinct from Kredily (a hard commercial
requirement — the current UI is too close to sell) while keeping feature parity-or-better.

Three non-negotiable principles, already proven in the codebase and to be preserved:

1. **Rules are data, not code.** Every business value (rates, slabs, thresholds, SLAs, geofence
   radius, leave rules, performance cutoffs) is admin-editable via `SettingsService` / `ClientRule`.
   The UI must expose a labeled control for every one of these keys.
2. **One employee record, many modules.** Attendance, leave, payroll, assets, performance all
   reference the single `Employee` entity — never duplicate.
3. **Approvals & self-service everywhere.** Leave, expense, regularization, anomaly, exit, travel,
   recruitment all share one approval pattern and one inbox; routine actions are pushed to the
   employee (ESS).

---

## 2. Personas & home experiences

| Persona | Role(s) | Home experience |
|---|---|---|
| **Employee (ESS)** | EMPLOYEE | My Day: clock in/out widget (geofence-aware), leave balances, latest payslip, approvals owed to me, announcements/celebrations |
| **Manager** | MANAGER | Team attendance heatmap, pending approvals (leave/regularization/expense), team leave calendar |
| **HR Admin** | HR_ADMIN | Headcount + attrition, payroll run status, compliance deadlines, document/verification queues |
| **CEO / Owner** | SUPER_ADMIN | **Company Health Dashboard** — composite index (attrition, attendance health, leave-burnout, engagement proxy, payroll cost trend, hiring velocity); weights admin-tunable |
| **SaaS System Owner** | SYSTEM_OWNER | Tenant list, plan editor (DB-backed), billing, coupon manager — cross-tenant |

---

## 3. Information architecture (sitemap)

Navigation groups (sidebar), independent of the 33 backend modules:

- **My Space** (all roles): Dashboard, My Profile, My Attendance, My Leave, My Payslips, My Declarations, My Expenses, My Assets, Approvals owed to me
- **Team** (Manager+): Team Attendance, Team Leave, Team Approvals, Team Directory
- **HR Operations** (HR_ADMIN): Employee Directory, Onboarding, Exit Management, Documents, Attendance Admin, Leave Admin, Holidays, Org Structure
- **Money** (HR_ADMIN / payroll perms): Payroll Command Center, Salary Structures, Components, Tax & Declarations, Form 16, Bank Disbursement, Compliance, Expenses Admin
- **Talent** (HR_ADMIN): Performance, Recruitment, Training, Travel, Rewards
- **Company** (HR_ADMIN): Social/Announcements, Surveys, Policies, Grievance, Helpdesk, Insurance, Assets
- **Insights** (Manager+ / role-scoped): Dashboards, Analytics, Reports
- **Platform Admin** (HR_ADMIN / SUPER_ADMIN): Settings, Permissions, Users & Access, Audit Log, Integrations, Notifications, Subscription & Billing, SaaS Owner Console, Setup Wizard

> The **shell inventory** (`inventory/shell.md`) confirms the current route list (`apps/web/app/**/page.tsx`)
> and nav definition; the **§01 spec** carries every route → page → permission → personas → plan tier.

Plan gating (Basic/Standard/Pro) overlays this: locked modules render with an upgrade affordance,
driven by `lib/plan-access.ts`.

---

## 4. Design language (direction)

The full token spec is the dedicated section `sections/02-design-system.md`. Direction decided:

- **Differentiate from Kredily**: move off the current `#078ced` Kredily-adjacent blue as the sole
  identity; adopt a distinct brand hue + a refined neutral ramp, more whitespace, lighter chrome.
- **Tokens by name, not hex** everywhere: `color.brand.primary`, `surface.raised`, `text.muted`,
  semantic `success/warning/danger/info`, elevation scale, spacing scale, radii, motion.
- **White-label runtime theming**: `branding.primaryColor`, `logoDataUrl`, `platformBrand`,
  `clientDisplayName`, `showPoweredBy` flow into CSS variables at load (already partially wired in
  `app-shell-frame.tsx`). Dark mode + density toggle planned.
- **Status pill system** (single source of truth) mapping every status string in the app to a
  semantic color: `ACTIVE/VERIFIED/APPROVED/PAID` → success; `PENDING/DRAFT/OPEN/PROBATION/NOTICE_PERIOD`
  → warning; `REJECTED/EXITED/CONVERTED_LOP` → danger; `INACTIVE/HOLD/REVERTED` → neutral.
- **Component library** rebuilt on `components/ui.tsx` primitives: Button(5), Input/Select/DatePicker/
  TimePicker/FileUpload, Table(dense+comfy), Card, Tabs, Modal/Drawer/Popover, Toast, StatusPill,
  EmptyState, Stepper/Wizard, Timeline, MetricCard, ProgressRing, Calendar/MonthGrid, OrgChart node, Skeleton.

---

## 5. Domain screen plan

Condensed from the completed inventories. Each domain's exhaustive screen spec (every field,
validation, settings-key source, EXISTS/NEW API mapping) is the Phase-2 deliverable; this is the map.

### 5.1 Core HR (inventory: `core-hr.md`)
- **Employee Directory** — table + card views; filters dept/location/status/grade; bulk mail/export/
  delete/confirm-probation/resend-invite; **license seat banner** (X of Y seats). Fix: server-side
  pagination (none today), real export endpoint (CSV is client-side only).
- **Employee Profile** — tabs: Overview, Job, Personal (addresses/education/family), Documents
  (verify + expiry), Bank & Pay (masked + self-service edit + verification pill), Leave & Attendance,
  Assets, Career (promotions/transfers timeline), Access (role/permissions view).
  **Must fix (inventory-confirmed bugs):** edit form silently drops name/code/email + addresses/
  education/family on PATCH; documents auto-VERIFY so the verify queue is decorative; bulk-upload
  drop-zone has no file input.
- **Add Employee wizard** — multi-step (mandatory/optional), pre-onboarding toggle; currently the
  inline panel only captures ~8 fields — wizard must expose the full DTO.
- **Bulk import** — wire the existing Excel endpoint (template download + per-row error report) to UI.
- **Exit Management center** — 7 tabs (active exits, resignation, exit interview, F&F calculator with
  per-leave-type encashment + asset recovery, exit letters with placeholder preview + print, clearance
  checklist, logs). Port friend-fork `exit-console` concepts, restyled.
- **Org Structure** — departments / designations / locations (with map pin + geofence radius) / grades
  / employment types CRUD. **Fix:** onboarding/separation templates have no `companyId` — globally
  shared across tenants (tenant-isolation gap).
- **Custom Fields** admin.

### 5.2 Time — Attendance & Leave (inventory: `time.md`)
- **My Attendance** — clock widget with geofence feedback (radius from `attendance.geofenceRadiusMeters`),
  day timeline, month calendar, regularize flow.
- **Attendance Admin** — logs table; **Anomaly Center** (evaluate day → anomaly list → decide
  approve/override → auto-clock-out runner → month-end convert-to-LOP wizard with affected-employee
  preview); **Penalty Logs** with bulk revert; penalty mapping editor (`attendance.penaltyMapping`).
- **Shifts & Roster** — shift CRUD (grace/half-day), location linking for geofence, assignment calendar.
- **Holidays** — calendar + list, location-scoped, year switcher.
- **My Leave / Leave Approvals / Leave Admin** — balance cards; apply modal with live day calc +
  sandwich preview; single+bulk approval; emergency/backdated grant; **types manager** with full rule
  editor (encashment/notice flags) + delete/deactivate (already built); policies; assignment matrix;
  block lists; accrual runner; carry-forward wizard.

### 5.3 Money — Payroll, Compliance, Expenses (inventory: `money.md`)
- **Payroll Command Center** — month navigator + run lifecycle stepper (Overview → Attendance & LOP →
  Variable & Adhoc → Revisions → Tax → Review → Lock), per-employee drilldown with inline LOP edit,
  salary-on-hold rows.
- **Salary Structures** — assignment view + **template manager** (formula editor `CTC * 0.5` with
  validation, assign wizard with pass/fail dialog — built in Kredily Task 1).
- **Component Configs** — Base/Recurring/Variable/Adhoc sub-tabs with metadata flags + enable toggles (built).
- **Tax & Declarations** — PT + TDS regime tables; employee declaration with window enforcement +
  window-closed state; HR proof review.
- **Form 16 viewer**; **Bank Disbursement** (generate + skipped-employee warning + audit trail — built);
  **Compliance** (PF ECR/ESI/PT challans + filing calendar); **Expenses** (claims + receipt upload,
  categories with sub-categories, bulk approval, payout-to-payroll).
- All money figures: tabular numerals; every mutation shows an audit note.

### 5.4 Talent (inventory: `talent.md`)
- **Performance** (cycles, goals/OKRs, appraisals, 360, calibration, auto-promotion review with
  settings-driven thresholds visible, increment letters), **Recruitment** (job board, requisition,
  candidate kanban, interview scheduling, offer → convert-to-employee), **Training** (catalog,
  enrollment, certificates), **Travel** (request + approval + advances), **Rewards** (points wallet,
  recognition feed, voucher redemption, admin catalog + budget).

### 5.5 Engagement & Ops (inventory: `engagement.md`)
- **Social** (posts, announcements with pin/target), **Surveys** (builder + results + anonymity),
  **Policies** (versioning + acknowledgment chase list), **Grievance** (confidential intake +
  resolution timeline), **Helpdesk** (SLA countdown pills from `support` settings, queue admin),
  **Insurance** (policy cards, dependents, claims + HR review), **Assets** (register, assign/return
  with condition, exit-blocking integration).

### 5.6 Platform & Admin (inventory: `platform.md`)
- **Settings tree** — every `DEFAULT_RULES` section gets a labeled control with helper text + default
  badge + reset: Company, Branding (live preview), Modules toggle, Attendance (incl. geofence radius +
  penalty mapping), Leave, Payroll (PF/ESI/PT slab editors + TDS regime + taxCalc caps + salaryStructure
  ratios + bankExport), Declarations, Approvals routing, Support SLA + queues, Documents, Performance
  thresholds, Coupons, Exit rules.
- **Permissions admin** (role × action grid, custom roles, per-user overrides), **Users & Access**,
  **Audit Log explorer** (filters + diff viewer), **SaaS Owner console** (tenant list, DB-backed plan
  editor, billing, coupons), **Subscription & Billing** (seats vs usage, upgrade quote + GST, invoices),
  **Integrations** (SMTP test-send, WhatsApp, S3, biometric, webhooks), **Notifications center** +
  preferences matrix (event × channel), **Reports builder** (server-side whitelist), **Setup Wizard**
  (first-run: company → locations → departments → leave types → shifts → payroll statutory → invite).

> The **rbac-settings inventory** (`inventory/rbac-settings.md`) is the authoritative seed matrix + DEFAULT_RULES
> key map; **§08** implements every key as a labeled control against it.

### 5.7 Dashboards & Analytics
- Role-specific home dashboards (§2). **Company Health Dashboard** for CEO: composite index with
  per-signal gauges + trends + drill-down; signal weights tunable via a new settings section.

---

## 6. Cross-cutting standards

- **Unified Approvals Inbox** — one surface for all approvable types; tabs by module + "all"; card
  with context preview, approve/reject + reason, bulk select, SLA aging, delegation/OOO.
- **Notifications** — drawer grouped by day, deep links; preferences matrix (email/whatsapp/push/in-app);
  reminder surfaces (doc expiry, probation ending, declaration window, payroll lock approaching).
- **Mobile** — tables→cards, sidebar→bottom nav, modals→sheets; 6 mobile-first flows (clock in/out with
  GPS, apply leave, view payslip, approve, submit expense with camera, read announcement).
- **Accessibility** — WCAG 2.1 AA; focus management for modals/drawers/wizards; SR landmarks per region;
  contrast guaranteed by tokens; reduced-motion.
- **Auth & first-run** — login/OTP/reset; tenant onboarding; employee activation; **stale-JWT
  (tenantId-null) re-login prompt** (a real bug class here); SSO/SCIM + 2FA as proposed new capabilities;
  coherent empty-tenant "set this up" state linking to the Setup Wizard.

---

## 7. Known correctness issues to fix during redesign (from inventories)

These are real, inventory-confirmed — the redesign should not paper over them:

1. **Tenant-isolation gaps**: `EmployeeDocument`, `EmployeeBankDetail`, exit/promotion/transfer/loan
   models and onboarding/separation templates are **not** in the Prisma tenant allowlist — cross-tenant
   leakage on `/employees/documents`, `/employees/queue/verify`. (core-hr §0.2)
2. **Documents auto-VERIFY** on create → verify queue is decorative. (core-hr §1.3)
3. **Employee edit form drops fields** (name/code/email/addresses/education/family never sent). (core-hr §1.1)
4. **Bulk-upload UI broken** (no file input element). (core-hr §1.2)
5. **`email` globally unique across tenants** — confusing cross-tenant collisions. (core-hr §1.1)
6. **No employee delete/deactivate** endpoint; INACTIVE/SUSPENDED unreachable. (core-hr §1.1)
7. Plus the open hardcode-ledger Batch 2 items (SaaS pricing, attendance fallbacks, form defaults).

> Money/time/talent/engagement/platform inventories list their own equivalents — to be consolidated
> into a single "redesign correctness backlog" alongside the section specs.

---

## 8. Build strategy (summary; full plan in `99_IMPLEMENTATION_ROADMAP.md`)

Incremental migration that keeps the **96-check e2e full-audit gate green at every step**:

1. **P0 — Foundation**: token layer (CSS variables), rebuilt `ui.tsx` primitives, shell/nav, status-pill
   system. No behavior change; audit stays green.
2. **P1 — Money paths**: Payroll Command Center, Salary Structures, Bank Disbursement, Compliance,
   Expenses (highest risk → careful review, payroll math untouched).
3. **P2 — Self-service**: ESS dashboard, My Attendance/Leave/Payslip/Expense, unified Approvals Inbox.
4. **P3 — Talent & engagement** consoles.
5. **P4 — Enterprise extras**: Company Health Dashboard, org chart, SSO/SCIM, e-signature, reports builder.

Per-phase Definition of Done: `tsc` clean (api + web), permission map regenerated, e2e green,
destructive walkthrough verification (the leave-types standard).

---

## 9. What remains to complete this architecture set

- [x] 3 inventories: `shell.md`, `rbac-settings.md`, `blueprint.md` — done
- [x] 12 section specs in `docs/redesign/sections/` (01–12, exhaustive per-screen) — done
- [ ] Adversarial critique (coverage / enterprise-parity / consistency) + remediation
- [ ] `99_IMPLEMENTATION_ROADMAP.md` (phased plan, consolidated correctness backlog, risk register, build-vs-review split)

These can be produced incrementally — one domain section per working session keeps cost bounded and
each section reviewable, rather than a single large fan-out.
