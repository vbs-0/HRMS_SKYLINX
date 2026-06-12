# 10 · Blueprint — Settings, Roles & Permissions, Workflows, Security, SaaS Admin

Screens: `/admin/settings/*`, `/admin/security/*`, `/admin/billing`, `/admin/saas`, `/setup`. API: `settings`, `security`, `saas`, `custom-fields`, `auth`, `organization`. This is the control plane — calm, explicit, every change auditable.

---

## 1. Settings hub (`/admin/settings`)

Two-pane: left section rail (sticky, searchable), right content. Sections:

| Section | Contents |
|---|---|
| **Organization** | Company profile, entities, locations, departments, designations, grades, cost centers, numbering series (doc 05 §4) |
| **Work calendar** | Fiscal year, week-off defaults, business hours (drives SLA), holiday calendar defaults |
| **Roles & permissions** | §3 below |
| **Workflows & approvals** | §4 below |
| **Custom fields** | §5 below |
| **Templates** | Email templates, letter templates, payslip layout, ID card themes — each: list → editor (merge-field palette, preview with sample employee, version history) |
| **Notifications** | Event × channel matrix (org defaults + lock toggles), reminder rules (doc 09 §6), digest settings |
| **Modules** | Module on/off per plan (PlanGate aware): toggling off hides nav + blocks routes w/ upgrade/enable note; per-module sub-toggles (e.g., attendance selfie, leave hourly unit, social feed) |
| **Branding & appearance** | Logo light/dark, accent override (curated palette only — indigo/sage/slate; arbitrary hex disallowed to keep contrast), login page welcome text, default theme/density for new users |
| **Localization** | Date format, first day of week, currency display, language (en-IN now; framework `next-intl` keys from P0) |
| **Data administration** | §6 below |
| **Integrations & API** | §7 below |

Every settings page: change → sticky FormFooter "Save"; saves write `AuditEventRow` (before/after JSON); "View change history" link per section (filtered audit explorer).

## 2. Setup wizard (`/setup`, first-run)

Linear Wizard, resumable, progress in sidebar: 1 Company & logo → 2 Locations & departments (quick-add grids) → 3 Designations & grades → 4 Work week & holiday calendar (pick national preset + edit) → 5 Leave types & policy (sensible India defaults CL12/SL12/EL15 prefilled, editable) → 6 Attendance rule basics → 7 Payroll basics (pay day, PF/ESI/PT registrations, default structure template) → 8 Roles & first invites (HR/manager seats) → 9 Review → Launch ("Your HRMS is ready" + next-step cards). Each step skippable with "Set up later" (lands as gold to-do card on HR Cockpit). Demo-data toggle (load/purge sample set, typed-confirm purge).

## 3. Roles & permissions (`/admin/security/roles`) — the heart of access control

### 3.1 Roles list
System roles (OWNER, HR_ADMIN, MANAGER, EMPLOYEE — lock badge, duplicate-to-customize) + custom roles (e.g., "Payroll Officer", "Recruiter", "Auditor read-only"). Card: name, description, members count, last modified. Actions: Create role (blank or clone), Compare roles (side-by-side matrix diff).

### 3.2 PermissionMatrix editor (role detail)
- **Grid:** rows = modules (employees, attendance, leave, payroll, expenses, recruitment, …all 30+), columns = actions (`read, create, update, delete, approve, configure, export`). Cell = tri-state painted checkbox (granted sage ✓ / denied empty / inherited faint — for clones). Row header click toggles whole module; column header whole action; sticky headers both axes; keyboard: arrows move, space toggles, shift+space row.
- **Scope picker per `read`/`update` grant:** Self · Team (reports-to chain) · Department · Location · Company — chip on the cell, default per role archetype. (Backend: existing scope columns; UI finally exposes them.)
- **Field-level security panel (per module):** sensitive field groups (Compensation, Statutory IDs, Bank, Contact-personal, Documents) → per-role: Hidden / Masked / Read / Edit. Drives PII masking across 360/tables/reports/exports.
- **Live impact rail (right):** members affected count, "What changes" diff list since open, conflict linter (e.g., `approve` without `read` → auto-suggest fix gold; `export` on payroll without compensation-read → warning).
- **Test as (§3.5)** button + Save (versioned: every save = role version with author + timestamp; rollback to version).

### 3.3 Assignment
Role ↔ members tab (add people/departments; multi-role allowed, union-of-grants with deny-nothing model kept from API); per-user **extra grants/blocks** (exception list with expiry date — e.g., auditor gets `payroll.read` for 2 weeks, auto-revokes); assignment changes notify user.

### 3.4 Delegation
"Delegate my approvals" (any approver): delegate person, scope (modules), date range (leave coverage), audit chip on every action taken-as; HR can force-delegate for unplanned absence.

### 3.5 "View as" simulator
Read-only impersonation of a role (or specific user with consent flag per policy): banner "Viewing as Recruiter — actions disabled", lets admins verify nav/fields/buttons; exit returns; every simulation session audit-logged. THE tool that makes permission setup safe.

## 4. Workflow & approval-chain builder (`/admin/settings/workflows`)

- **List:** per process (Leave request, Regularization, OT, Expense claim, Travel, Loan, Comp revision, Offer, Requisition, Document change-request, Exit approval, Payroll lock) — each with active version chip.
- **Builder (vertical step canvas, form-driven not free-DAG):** trigger conditions (type/amount/days/grade/dept rules — e.g., "Expense > ₹10,000 AND grade ≤ M2") → ordered steps (approver type: Reporting manager / Manager's manager / Role (HR_ADMIN) / Named person / Department head / Cost-center owner; per-step: SLA hours → escalate-to, allow-delegate?, auto-approve-on-timeout? gold-flagged) → final actions (notify set, post-functions like "create payroll input"). Condition branches render as parallel labeled lanes (max 3 deep — keeps it form-simple).
- **Validation:** unreachable-step linter, self-approval guard (requester ∈ approvers → auto-skip w/ note), cycle detection.
- **Simulate:** pick sample request (real-shaped form) → shows resolved chain with names ("Asha → Rohan (manager) → Meera (HR)").
- **Versioning:** publish creates v(n); in-flight requests finish on their started version (chip shows which).
- ApprovalTrail everywhere renders from this engine — one mental model.

## 5. Custom fields (`/admin/settings/custom-fields`) (existing module, full studio)

Per entity (Employee, Candidate, Asset, Ticket, Claim…): field list (label, key auto-slug, type: text/number/date/select/multi/checkbox/file/person-link, required?, section placement, visible-to (role sets), editable-by, show-in-table?, include-in-export?). Drag order within section; archive (data kept) vs delete (typed-confirm + export prompt); validation rules (regex/min/max); fields auto-appear in forms, 360 sections, table column pickers, filters, report builder.

## 6. Data administration (`/admin/settings/data`)

- **Import center:** entity pick → CSV/XLSX template download → upload → column mapper (auto-match, saved mappings) → validation report table (row, error, fix-inline grid) → dry-run summary ("212 create, 8 update, 3 error") → commit (background job w/ progress, result file). Entities: employees, balances opening, attendance backfill, salary structures, holidays, assets, candidates.
- **Export center:** entity + filter → respects field-level security → file w/ stamp; **full tenant export** (OWNER, typed-confirm, async + email link).
- **Backups:** schedule status, last snapshots list, restore = support-ticket flow (no self-serve destructive restore).
- **Retention & privacy (DPDP):** retention rules per data class (exited-employee data months, candidate data months, logs), anonymization runner preview→execute, consent text management, employee data-request handler (export-my-data / correction queue).
- **Recycle bin:** soft-deleted records (30d), restore w/ permission.

## 7. Integrations & API (`/admin/settings/integrations`)

Cards grid w/ status chips (Connected sage / Not set up / Error brick): **Biometric devices** (device registry, API key per device, last-sync, field map) · **SSO** (SAML/OIDC config form, metadata upload, test-login button, JIT-provision toggle, enforce-SSO switch w/ break-glass note) · **Email (SMTP)** (existing nodemailer: host/auth test-send) · **Calendar** (ICS feeds out; Google/MS OAuth flag v2.1) · **Accounting export** (GL mapping table: component group → ledger code; Tally XML/CSV) · **Webhooks** (endpoint, secret, event picker, delivery log w/ retries) · **API keys** (scoped to permission sets, last-used, rotate) · **SkyNexus AI** (provider key, data-grounding toggles per module, confidential-module exclusion locked on).

## 8. Security center (`/admin/security`)

- **Authentication policy:** password rules (length/complexity/expiry/reuse), MFA (off/optional/required per role), OTP channel, session lifetime + idle timeout, concurrent session cap, IP allowlist (CIDR rows + "your current IP" helper, lockout-protection check), login-page notice text.
- **Sessions & devices:** active sessions table (user, device, IP, last active) w/ revoke; suspicious-login feed (new device/geo → notify user).
- **Audit explorer:** the system ledger — DataTable (time, actor, module, action, entity link, before/after DiffView drawer, IP); filters by everything; saved views ("Permission changes 90d", "Payroll overrides", "PII reveals"); export (perm `security.export`); retention per §6. System/error logs tabs (existing models) for OWNER.
- **Break-glass:** emergency OWNER access procedure doc + one-time recovery codes management.

## 9. Billing & SaaS

- **`/admin/billing` (tenant):** current plan card (modules included, seats used meter), invoices table (download), payment method, upgrade/downgrade flow (proration preview), usage (storage, employees vs plan cap gold at 90%).
- **`/admin/saas` (platform OWNER only):** tenants table (company, plan, seats, MRR, status, created), tenant room (subscription edit, module flags, payment history, **support-impersonation with tenant-consent token + full audit**), plans & pricing editor (module bundles, caps), payments reconciliation, platform health (signups, churn chips).

---

### UX rules for the control plane
- Every toggle states its consequence in one sentence under the label ("Employees will need an authenticator app at next sign-in").
- Risky switches (enforce SSO, disable module, retention shorten) → Modal with affected counts + typed confirm.
- All lists searchable; all changes versioned or audited; "history" one click away everywhere.
- Settings search (rail top) indexes every label & help line — admins find "grace period" without knowing the section.
