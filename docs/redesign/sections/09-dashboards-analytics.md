# §09 — Dashboards, Analytics & Reports

> Inventory: `inventory/platform.md` §5 (analytics), §6 (reports), §7 (dashboard). Primitives: §02 (KpiRow, Charts, DataTable, ProgressRing). Master plan §5.7 (Company Health Dashboard). Personas: §01 §1.
> Permissions: dashboards — `GET /dashboard/admin`=`reports.read`, `/manager`=`attendance.read`, `/employee`=`employees.read`, `/super-admin`=`settings.configure`, `/celebrations`=`employees.read`; analytics — `analytics.read`; reports — `reports.read`, export `reports.export`.
> **Correctness fixes owned here (platform.md):** four role dashboard panels return **identical data** (panel string ignored, §7); cross-tenant leakage (attendanceLog/leaveRequest/payslip unscoped → analytics/dashboard mix all tenants, §5/§7); `monthlyPayroll` is actually all-time gross (§5); fake 4-point "trend" (current values, not series, §5); hardcoded ¾ progress bars in analytics workspace (§5); `pendingCompliance` always ~0 (§7); fake export job (audit row only, no artifact, §6); attendance report capped at 100 logs (§6); custom-builder whitelist duplicated by hand (§6); SkyNexus birthdays fabricated (§7).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. Role dashboards — `/dashboard` (role-aware composition, §01 §1)
**Title** persona greeting · **Roles** session. **Plan** Basic. One route, server-composed widget set per persona; widgets are permission-gated cards on a 12-col grid; user can hide/reorder (NEW pref).

## A1. Employee (ESS) — "My Day"
Greeting band (name, date, shift chip) · **PunchWidget** (shared §04 A1) · **My balances** (LeaveBalanceRing ×3) · **My pay snapshot** (last payslip, YTD, regime — masked until reveal) · **Pending on me** (my requests w/ ApprovalTrail) · **Around me** (team on leave today, upcoming holidays, **real celebrations**) · Announcements (latest 3, pinned) · Policies-to-ack banner · Quick links.
- API EXISTS `GET /dashboard/employee` (**fix**: returns company-wide pendingLeaves not self — scope to employee, §7), `GET /dashboard/celebrations` (real, current-month birthdays/anniversaries — wire here; **fix** SkyNexus fabricated dates §7), `GET /announcements`, `GET /policies`.

## A2. Manager — "Team"
Adds: **Inbox preview** (first 5 approvals + inline A/R → §10), **Team today** (present/absent/leave/WFH counts + late list), **team leave calendar** (2-week, coverage conflicts — market gap blueprint §4), pending reviews/goals. API EXISTS `GET /dashboard/manager`.

## A3. HR Admin — "HR Cockpit"
Adds: org-pulse KpiRow (headcount + joiners/exits, attendance today %, on leave, open positions, attrition, payroll cost), **payroll countdown** (cutoff + gates mini → §05 run room), **compliance next-dues** (ChallanCards → §05 C), lifecycle strips (onboarding/exits/probation-ending), anomaly digest, hiring funnel mini. API EXISTS `GET /dashboard/admin`.

## A4. CEO/Owner — Company Health Dashboard (master plan §5.7; **NEW**)
Composite **health index** with per-signal gauges + trends + drill-down: attrition, attendance health, leave-burnout, engagement proxy (eNPS/recognition), payroll cost trend, hiring velocity. **Signal weights admin-tunable** → **NEW** settings section `companyHealth.weights` + endpoint `GET /dashboard/company-health (settings.configure)`. API EXISTS `GET /dashboard/super-admin` (today identical to others — **fix** to compute real composite, §7).

**Cross-cutting fix (platform.md §7)**: make `metrics(panel)` return panel-specific, tenant-scoped, self-scoped-where-appropriate data; tenant-scope attendanceLog/leaveRequest/payslip aggregates.

---

# B. Analytics — `/analytics`
**Title** "Analytics" · **Roles** `analytics.read`. **Plan** Pro.
Domain dashboard pages (each = KpiRow + 2–4 charts + insight list, all click-through to filtered lists):
- **Workforce**: headcount trend (joiners/exits stacked), attrition % (voluntary/involuntary, by-dept heat), tenure/age mix, diversity, span of control.
- **Attendance & leave**: absenteeism %, late-arrival trend, OT hours, leave utilization vs accrual, LOP days, anomaly volume.
- **Payroll cost**: cost trend (gross/employer-cost), cost per dept/location/cost-center, variance waterfall vs last run, statutory outflow, salary-band distribution.
- **Recruitment**: funnel, time-to-fill, source ROI, offer-acceptance, interviewer load.
- **Performance & learning**: rating distribution vs target, goal completion %, training hours/coverage, skill-gap heat.
- **Engagement**: eNPS trend, survey participation, recognition volume, helpdesk CSAT.
- Global filters (period/entity/dept); every chart has a **data-table toggle** (a11y §11) + PNG/CSV export; insight lines auto-generated.
- **API**: EXISTS `GET /analytics` (single endpoint). **Fixes (platform.md §5)**: tenant-scope attendance/leave/payslip/expense (today cross-tenant); add date-range/month/dept params (today none); `monthlyPayroll` → real monthly (today all-time gross); real time-series for trends (today fake 4-point); chart the data (today trend not even rendered); remove hardcoded ¾ progress bars. **NEW** `GET /analytics/:domain?period&dept&location` with server aggregates (today loads whole tables — scaling hazard §5). Respect data scopes: managers see team cuts; salary analytics need `payroll.read`.
- **States**: skeleton charts; empty "Not enough data yet"; forbidden.

---

# C. Reports — `/reports` (+`/reports/[id]`)
**Title** "Reports" · **Roles** `reports.read`, export `reports.export`. **Plan** Basic.
- **Catalog**: report cards grouped by module w/ live row counts + last-run. Built-ins EXISTS: `GET /reports/employees|attendance|leave|payroll|expenses|compliance`. **Fixes (platform.md §6)**: attendance report capped at 100 logs → paginate/period-filter; hardcoded department filter options (People/Finance/…) → from real depts; payroll/leave/expense have no period filter → add.
- **Runner** `/reports/[id]` (NEW route): parameter panel (period, dept, location, status) → DataTable result (column picker, totals row) → export CSV/XLSX/PDF (print letterhead, §02 §12). **Schedule** (frequency, recipients perm-checked, format) → **NEW** `POST /reports/schedules`; schedules manage tab. **FIX fake export (platform.md §6)**: `POST /reports/export` writes an audit row and returns "queued" but **no worker ever generates anything** → either build the worker (artifact + download) or remove the button and keep client/print export only.
- **Custom builder** `/reports/[id]?custom` (EXISTS `POST /reports/custom` — real, whitelisted models/fields, tenant-scoped, cap 5000): dataset dropdown, status filter, column checkboxes, Generate Preview, CSV export. **Fix**: the model/field whitelist is duplicated by hand in `CUSTOM_MODELS` → **NEW** `GET /reports/custom/schema` so UI reads the whitelist from the API (stay in sync, §6). **Custom report builder + scheduled exports** = market gap (blueprint §4) — this is the surface.
- Every export respects field-level security (salary stripped without perm, §02/§05) + stamps footer (user, time, filters).
- **States**: catalog skeleton; runner empty "Run to preview"; export error + ref.

---

## D. Cross-cutting (this section)
- All KPIs click-through to the filtered list that proves them (no dead numbers).
- No fabricated values anywhere (the recurring inventory sin) — every figure is real + tenant-scoped + period-bounded, or the widget shows EmptyState.
- Mobile: dashboards stack to single column; charts → data tables; reports run desktop-first.
- **Backend backlog**: per-panel + tenant-scoped + self-scoped dashboard metrics; real Company Health composite + tunable weights; analytics domain endpoints w/ aggregates + filters + real trends; report scheduler/worker (or drop fake export); custom-builder schema endpoint; report period filters + uncap attendance; tenant-scope analytics/dashboard/report source models (platform.md §0.2).

## E. Post-critique remediations (98 §D)
- **Tenant-scoping is insufficient alone (D-1):** the cross-tenant fixes here (scope attendanceLog/leaveRequest/payslip aggregates) depend on the §08/§12 TenantMiddleware fix (verify JWT, stop trusting `x-tenant-id`) — model-level scoping is bypassable without it.
- **`pendingApprovals` (D-10):** is a duplicate of `pendingLeaves` today — compute a real approval count.
- **SkyNexus birthday widget:** the fabricated-dates fix belongs to §07 (the social console owns that component); §09 only wires `GET /dashboard/celebrations`. Cross-ref, don't double-own.
- **`companyHealth.weights`:** the tunable signal weights (A4) are registered as a settings control in §08 J2 (`GET /dashboard/company-health`, `settings.configure`).
- **`/analytics/[domain]`** registered in §01; domains are routed pages, not just tabs.
