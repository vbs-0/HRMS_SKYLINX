# §01 — Information Architecture & Navigation

> Inventory: `inventory/shell.md` (current frame, 33-flat-nav, routes, gating). Master plan §3 (IA groups, personas). Primitives: §02 (Sidebar, Topbar, CommandPalette, Breadcrumbs, PageHeader). Permissions: `inventory/rbac-settings.md`.
> Replaces: the off-canvas single-component shell (`app-shell-frame.tsx`) + flat 33-item ungrouped nav (`nav-items.tsx`).
> Legend: **EXISTS** route present today · **NEW** route to add (shell.md §3: no record-detail routes exist).

---

## 1. Personas → home (master plan §2)
| Persona | Roles | Landing |
|---|---|---|
| Employee (ESS) | EMPLOYEE | `/dashboard` My Day (punch, balances, payslip, my approvals, announcements) |
| Manager | MANAGER | `/dashboard` Team (team attendance, pending approvals, team leave calendar) |
| HR Admin | HR_ADMIN | `/dashboard` HR (headcount/attrition, payroll status, compliance deadlines, queues) |
| CEO/Owner | SUPER_ADMIN | `/dashboard` Company Health (composite index, §09) |
| SaaS Owner | SUPER_ADMIN/`isOwner` | `/saas-admin` tenant console |
Home composition is role-aware (§09); the shell is shared.

## 2. Navigation groups (replaces flat 33; master plan §3)
Grouped, collapsible Sidebar (§02). A group renders only if ≥1 item is permission-visible. Item gate = real `module.action` prefix (rbac-settings); plan overlay = lock affordance (not removal).

| Group | Items → route → nav permission | Personas |
|---|---|---|
| **My Space** | Dashboard `/dashboard` (always) · My Profile `/me` (`employees.read` self) · My Attendance `/attendance` (`attendance.read`) · My Leave `/leave` (`leave.read`) · My Payslips `/payroll/me` (`payroll.read`) · My Declarations `/payroll/me#tax` (`payroll.read`) · My Expenses `/expenses` (`expenses.create`) · My Assets `/assets` (`assets.read`) · My Approvals `/inbox` (§10) | all |
| **Team** | Team Attendance `/attendance#team` (`attendance.read`) · Team Leave `/leave#team` (`leave.read`) · Team Approvals `/inbox` (`leave.approve`∥`attendance.approve`∥`expenses.approve`) · Team Directory `/employees` (`employees.read`) | Manager+ |
| **HR Operations** | Directory `/employees` · Onboarding `/onboarding` · Exits `/exits` · Documents `/documents` · Attendance Admin `/attendance` · Leave Admin `/leave` · Holidays `/holidays` · Org Structure `/organization` (`employees.*`/`organization.*`) | HR_ADMIN |
| **Money** | Payroll `/payroll` · Salary Structures `/payroll/structures` · Components `/payroll/components` · Tax & Declarations `/payroll#tax` · Form 16 `/payroll/me#form16` · Bank Disbursement `/payroll/run/[id]#bank` · Compliance `/compliance` · Expenses Admin `/expenses` (`payroll.*`/`compliance.*`/`expenses.*`) | HR_ADMIN/payroll |
| **Talent** | Performance `/performance` · Recruitment `/recruitment` · Training `/training` · Travel `/travel` · Rewards `/rewards` (`performance.*`/`recruitment.*`/`training.*`/`travel.*`/`rewards.*`) | HR_ADMIN |
| **Company** | Social `/social` · Surveys `/surveys` · Policies `/policies` · Grievance `/grievance` · Helpdesk `/support` · Insurance `/insurance` · Assets `/assets` (mixed; some ALWAYS_VISIBLE today — see §4) | varies |
| **Insights** | Dashboards `/dashboard` · Analytics `/analytics` (`analytics.read`) · Reports `/reports` (`reports.read`) | Manager+ role-scoped |
| **Platform Admin** | Settings `/settings` · Permissions `/settings/permissions` · Users & Access `/settings/users` · Audit Log `/security` · Integrations `/settings/integrations` · Notifications `/notifications` · Subscription & Billing `/saas` · SaaS Owner `/saas-admin` · Setup Wizard `/setup` (`settings.configure`/`saas.*`/owner) | HR_ADMIN/SUPER_ADMIN |

**Nav registry (NEW `lib/nav.ts`)**: each item carries explicit `{href, label, icon, group, permission, badge?}` — kills the href-string-strip + alias map (shell.md §2.4) and the unused `group?`/dead `Link2` import.

## 3. Shell anatomy (replaces `app-shell-frame.tsx`)
```
┌────────────┬───────────────────────────────────────────────┐
│ Sidebar    │ Topbar(64): breadcrumb · ⌘K search · +Quick   │
│ 260 (lg)   │   · 🔔 notifications · theme · avatar menu     │
│ 72 rail(md)├───────────────────────────────────────────────┤
│ drawer(sm) │ PageHeader: h1 + subtitle + context + 1 primary│
│ grouped,   ├───────────────────────────────────────────────┤
│ collapsible│ Content (max-w 1440, pad 24/16) · canvas token │
└────────────┴───────────────────────────────────────────────┘
```
- **Sidebar** (§02): **persistent on desktop** (fix: today off-canvas at all sizes, shell.md §1.1), groups w/ headers, active-item highlight (brand.50 wash + left rail), count badges (Inbox), collapse-to-rail (md, tooltips), drawer (<md). Logo + tenant name (white-label §02 §7).
- **Topbar**: breadcrumb (`Module / Page / Record`); **global search** (⌘K) → **federated** people+pages+records (fix: today employee-only full reload, shell.md §1.2; **NEW `GET /search?q=`** permission-trimmed); **Quick add (+)** menu (permission-filtered: Add person, Apply leave, New claim, New ticket, Start payroll run…); **notification bell** with unread count + drawer (fix: decorative today, shell.md §1.2; §10); theme toggle (§02 §6); **avatar menu** (My profile, My settings, theme, density, sign out — replaces initials-only). Remove the cosmetic HR/Admin role switch (shell.md §0.2) — real role-aware UI replaces it.
- **PageHeader** (§02): h1 + subtitle (today the only chrome) + context chips (fiscal year, scope) + exactly one primary action.
- **Footer**: env badge (non-prod), version, status.

## 4. Fix the ALWAYS_VISIBLE trap (shell.md §2.2, engagement.md §0)
Today 10 hrefs bypass permission filtering → users see pages then 403 on data (social, grievance, surveys, cards, assets, insurance…). Redesign: **nav visibility = real permission** for every item; pages a user can reach always have a working state; if a feature is intentionally all-hands (e.g. policies/surveys for employees) the **seed grants must include the read permission** (rbac-settings A7) rather than bypassing the gate. ForbiddenState (§02) only as a safety net, with "request access" → §07 helpdesk.

## 5. Full sitemap (route → page → permission → plan → §)
| Route | Page | Permission | Plan | § | State |
|---|---|---|---|---|---|
| `/login`,`/signup` | auth | public | — | §12 | EXISTS |
| `/dashboard` | role home | session | Basic | §09 | EXISTS |
| `/inbox` | unified approvals | `approvals.read`∥approver | Standard | §10 | **NEW** (today `/approvals`) |
| `/me` | my profile | `employees.read` self | Basic | §03 | **NEW** |
| `/employees` | directory | `employees.read` | Basic | §03 | EXISTS |
| `/employees/[id]` | profile 360 | `employees.read` | Basic | §03 | **NEW** |
| `/employees/new` | add wizard | `employees.create` | Basic | §03 | **NEW** |
| `/employees/import` | bulk import | `employees.create` | Basic | §03 | **NEW** |
| `/onboarding`,`/onboarding/[id]` | onboarding | `employees.read/update` | Basic | §03 | **NEW** |
| `/exits`,`/exits/[id]` | exit + F&F | `employees.update/approve` | Basic | §03 | **NEW** |
| `/organization` | org structure | `organization.read` | Standard | §03 | EXISTS |
| `/documents` | doc center | `employees.read` | Basic | §03 | EXISTS |
| `/cards` | ID cards | `employees.read` | Standard | §03 | EXISTS |
| `/attendance` | attendance (tabs) | `attendance.read/create` | Basic | §04 | EXISTS |
| `/roster` | shifts & roster | `attendance.read/update` | Basic | §04 | **NEW** (today RosterConsole inline) |
| `/leave` | leave (tabs) | `leave.read/create` | Basic | §04 | EXISTS |
| `/holidays` | holidays | `holidays.read` | Basic | §04 | EXISTS |
| `/payroll` | command center | `payroll.read` | Standard | §05 | EXISTS |
| `/payroll/run/[id]` | run room | `payroll.read` | Standard | §05 | **NEW** |
| `/payroll/structures` | structures+templates | `payroll.configure` | Standard | §05 | **NEW** |
| `/payroll/components` | component configs | `payroll.configure` | Standard | §05 | **NEW** |
| `/payroll/me` | my pay & tax | `payroll.read` self | Standard | §05 | **NEW** |
| `/compliance` | statutory | `compliance.read` | Pro | §05 | EXISTS |
| `/expenses` | expenses | `expenses.read/create` | Standard | §05 | EXISTS |
| `/insurance` | insurance | `insurance.read` | Standard | §07 | EXISTS |
| `/performance` | PMS | `performance.read` | — | §06 | EXISTS |
| `/recruitment`,`/recruitment/jobs/[id]`,`/candidates/[id]` | ATS | `recruitment.read` | Pro¹ | §06 | EXISTS+**NEW** |
| `/training` | training/skills | `training.read` | Standard | §06 | EXISTS |
| `/travel` | travel desk | `travel.read` | Standard | §06 | EXISTS |
| `/rewards` | rewards | `rewards.read` | Pro | §06 | EXISTS |
| `/social` | SkyNexus feed | `social.read` | Standard | §07 | EXISTS |
| `/surveys`,`/surveys/[id]`,`/surveys/[id]/results` | surveys | `surveys.read` | — | §07 | EXISTS |
| `/policies`,`/policies/[id]` | policies | `policies.read` | Pro¹ | §07 | EXISTS+**NEW** |
| `/grievance`,`/grievance/[id]` | grievance | `grievance.read` | Pro¹ | §07 | EXISTS+**NEW** |
| `/support`,`/support/[id]` | helpdesk | `tickets.read` | Basic | §07 | EXISTS+**NEW** |
| `/assets` | assets | `assets.read` | Standard | §07 | EXISTS |
| `/analytics` | analytics | `analytics.read` | Pro | §09 | EXISTS |
| `/reports`,`/reports/[id]` | reports + builder | `reports.read` | Basic | §09 | EXISTS+**NEW** |
| `/notifications`,`/reminders` | notifications + rules | `notifications.read`/`settings.configure` | Standard | §10 | EXISTS |
| `/settings/*` | settings tree | `settings.configure` | Basic | §08 | EXISTS+**NEW subroutes** |
| `/security` | audit/security | `settings.configure` | Pro | §08 | EXISTS |
| `/saas` | billing | `saas.read` | Pro | §08 | EXISTS |
| `/saas-admin` | tenant console | owner | Pro | §08 | EXISTS |
| `/setup` | setup wizard | `settings.configure` | Basic | §12 | EXISTS |
¹ recruitment/policies/grievance default to "Pro" plan only because they're absent from `modulePlanAccess` (shell.md §2.1 note ¹) — **NEW**: add them to the plan map at their intended tier.
**Legacy redirects**: `/approvals`→`/inbox`; keep all current routes 301-aliased so bookmarks survive.

## 6. Command palette (⌘K, NEW — §02)
Sections (rank): **Actions** (permission-filtered verbs: Apply leave, Start payroll run, Add person, Approve pending) → **People** (fuzzy name/code/email → profile) → **Pages** → **Records** (recent + indexed claims/tickets/candidates/runs) → **Help**. Backed by **NEW** federated `GET /search?q=` (permission-trimmed); recents client-cached. Esc layering: palette → drawer → modal.

## 7. Global patterns
- Breadcrumbs from route segments; record crumb uses display name.
- Filters persisted in URL query (`?status=&dept=`); back restores scroll.
- Saved views per table (filters+columns+sort+density; HR can publish org-wide) — **NEW** `GET/POST /views`.
- Unsaved-changes guard on forms; soft re-auth modal on 15-min JWT expiry preserving form state (platform.md §0.1, §12).
- Multi-entity scope switcher chip when >1 location/entity.

## 8. Responsive
Breakpoints sm640/md768/lg1024/xl1280/2xl1536 (reference §5.1). Sidebar: ≥lg persistent 260 · md rail 72 (tooltips) · <md drawer + bottom tab bar for 5 ESS staples (Home, Attendance, Leave, Inbox, Menu). Tables → RecordCards <md. All ESS apply/punch/payslip flows complete at 360px (§11).

## 9. Keyboard map (global, §02 §11)
⌘K palette · `g h` home · `g i` inbox · `g p` people · `g l` leave · `g y` payroll · `c` context-create · `/` focus filter · `j/k` rows · `o/↵` open · `x` select · `a/r` approve/reject (inbox) · `[`/`]` collapse sidebar · `?` shortcut sheet · Esc close top layer.

## 10. Shell resilience
Boot: sidebar+topbar from session cache, content skeleton (never full-screen spinner). Offline banner + retry. Per-region error boundary w/ ref id + report. Stale-JWT (tenantId null) → re-login prompt (platform.md §0.1; §12).

## 11. Backend backlog (this section)
Federated search endpoint; saved-views CRUD; add recruitment/policies/grievance to plan map; server-side nav permission completeness (seed grants for all-hands reads, rbac-settings A7); notification count endpoint (§10).
