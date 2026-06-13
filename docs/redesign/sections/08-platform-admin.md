# §08 — Platform Admin: Settings, Permissions, Users, Audit, Integrations, SaaS, Billing

> Inventory: `inventory/platform.md` + `inventory/rbac-settings.md` (the authoritative DEFAULT_RULES key map + seed matrix). Primitives: §02 (PermissionMatrix, DataTable, FormField, diff viewer).
> Permissions: `settings.configure` (rules/modules/company/custom-fields/reminders), `saas.{read,configure}`, audit via `settings.configure`. **SUPER_ADMIN bypasses all** (platform.md §0.1).
> **Security fixes owned here (platform.md):** `x-tenant-id` header spoofing + unverified JWT decode in TenantMiddleware (§0.2); Prisma allowlist misses Company/Payment/ErrorLog/Notification → cross-tenant (§0.2/§12.3); HR_ADMIN seeded with `saas.configure` → can suspend any tenant (§0.4/§12.4); self-signup grants SUPER_ADMIN (§4.3); saas-admin owner gate checks wrong role string `super_admin` vs `SUPER_ADMIN` → dead for everyone (§4.5); fake invoice/license/payment (§4); settings audit actor null (§3 quirk 3); declarations/support key bugs + coupons array PATCH trap (§3 quirks 1/2 / rbac-settings B2).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. SETTINGS TREE — `/settings`
**Title** "Settings" · **Roles** `settings.configure` (note: HR_ADMIN has `settings.configure` but **not** `settings.read`, rbac-settings A3 — the read-gate must accept configure). **Plan** Basic.
Two-pane: searchable section rail + content. **Every DEFAULT_RULES key (rbac-settings B1) gets a labeled control with helper text, default badge, and reset-to-default** — the ~30 currently API-only keys are the biggest gap. Every save → `PATCH /settings/rules` (one ClientRule per key) + audit (**fix**: stamp `actorUserId`, today "System", platform.md §3 quirk 3). Per-section "View change history" → Audit explorer (§D) filtered.

| Section | Fields → DEFAULT_RULES keys (defaults) | API | notes |
|---|---|---|---|
| **Company** | name, legalName, logoUrl, address, taxId, workWeek, timezone | EXISTS `GET/PATCH /settings/company` | — |
| **Branding** (live preview) | platformBrand (PeopleOS), clientDisplayName (My Company), primaryColor (#078ced), showPoweredBy (true), **logoDataUrl, linkedinUrl, facebookUrl, xUrl, supportEmail (API-only today)** | `PATCH /settings/rules{branding}` | drives §02 §7 theming |
| **Modules** | toggle 22 `MODULES`; per-module sub-toggles | EXISTS `GET /settings/modules`, `PATCH /settings/modules/:module` (**fix**: `:module` unvalidated — whitelist) | owner-gated card |
| **Attendance** | workWeek, shiftStart/End, graceMinutes, geoAttendance, biometricRequired, overtimeEnabled, **geofenceRadiusMeters (200), penaltyMapping (API-only)** | `PATCH …{attendance}` | also surfaced in §04 A5 |
| **Leave** | approvalFlow, sandwichLeave, carryForward, compOffAllowed, leaveYear | `PATCH …{leave}` | §04 C |
| **Payroll** | salaryStructure, pf/esi/pt/tdsEnabled, payrollLockDay (28), pfEmployee/EmployerRate (12), pfWageCeiling (15000), esiEmployee/EmployerRate (0.75/3.25), esiWageCeiling (21000), **ptSlabs**, **tdsSlabs** | `PATCH …{payroll}` | slab editors §05 C |
| **Tax calc (API-only today)** | standardDeductionNew (75000)/Old (50000), section80CCap (150000), 80DCap (25000), 24bCap (200000), cessPct (0.04), surchargePct (0.10), surchargeThreshold (5000000) | `PATCH …{taxCalc}` | **expose**; move hardcoded rebate thresholds here (money.md §1.10) |
| **Salary structure (API-only)** | basicPct (0.40), hraPct (0.50), defaultTdsPct (0.05), performanceIncrementPct (0.10) | `PATCH …{salaryStructure}` | §05 A3, §06 A5 |
| **Declarations** | windowEnabled, monthlyFromDay (1)/ToDay (10), fyCutoffMonth (1)/Day (31), mandatoryProof | `PATCH …{declarations}` | **FIX key mismatch**: write `fyCutoff*` (UI writes `currentFiscalYearStart`/`fiscalYearDeadline`, platform.md §3 quirk 1) |
| **Bank export (API-only)** | format (GENERIC_CSV), includeHeader (true), narrationPrefix (SALARY) | `PATCH …{bankExport}` | §05 A6 |
| **Approvals** | expenseApproval, documentVerification, payrollApproval (routing strings) | `PATCH …{approvals}` | decorative until §10 workflow engine |
| **Support** | slaHigh/Medium/LowHours (24/48/72), **defaultQueue (HR Helpdesk), ticketPrefix (TKT)** | `PATCH …{support}` | **FIX**: save drops queue/prefix (engagement.md §6) |
| **Documents** | expiryReminderDays (30) | `PATCH …{documents}` | §03/§04 |
| **Performance (API-only)** | scoreMin/Max, ratingExcellent/Good, scoreGoodThreshold, attendanceCompleteThreshold, promotionScoreThreshold, incrementPct | `PATCH …{performance}` | §06 |
| **Exit rules (API-only)** | defaultNoticeDays (90) | `PATCH …{exitRules}` | §03 F&F |
| **Coupons (API-only, bug-trapped)** | array {code, discountPercent} | **NEW** dedicated endpoint (generic PATCH explodes the array, platform.md §3 quirk 2) | §C billing |
| **Custom Fields** | → §03 §9 / `settings/custom-fields` | EXISTS | employee entity |
| **Notifications prefs** | event × channel matrix | → §10 | **NEW** |
| **Localization** | date format, first day, currency, language (en-IN) | **NEW** | layout `lang` fix |
| **Data admin / Integrations** | → §E/§F | mixed | |

**Setup Wizard** (`/setup`) writes the same `company`+`rules` (attendance/leave quotas/permissions matrix) — overlaps settings-console (platform.md §3). Reconcile vocabularies: settings `MODULES` ≠ saas-onboarding keys ≠ plan-access keys (platform.md §3 quirk 5) → **one module registry**.

# B. PERMISSIONS ADMIN — `/settings/permissions` (**NEW — no roles UI/API today**, platform.md §2)
**Roles** `settings.configure`. The role × action grid editor.
- **Roles list**: system roles (SUPER_ADMIN/HR_ADMIN/MANAGER/EMPLOYEE — lock badge, clone-to-customize) + custom roles. Card: name, members, last modified, version.
- **PermissionMatrix editor**: rows = 30 modules, columns = 7 actions (create/read/update/delete/approve/export/configure); tri-state cells; row/column toggle-all; sticky headers; keyboard (arrows + space). **Scope picker** per read/update (Self/Team/Dept/Location/Company — **NEW** backend scope columns; today none). **Field-level security** panel per module (Compensation/Statutory IDs/Bank/Contact/Documents → Hidden/Masked/Read/Edit — drives §02 PII masking). Live impact rail (members affected, diff since open, conflict linter: approve-without-read warn). Save = versioned + rollback.
- **Assignment**: role↔members; per-user overrides w/ expiry. **Delegation** ("delegate my approvals", date range). **View-as simulator** (read-only impersonation, banner, audited).
- **NEW backend**: `GET/POST /roles`, `PATCH /roles/:id/permissions`, `POST /users/:id/roles`, scopes + field-security models. **Drop** the decorative `permissions` ClientRule category + setup-wizard matrix (stored, never enforced, platform.md §3 quirk 4) — or wire them to real grants.
- **Seed re-grants** (rbac-settings A7): performance read/approve/create, travel read/HR-approve, expenses.read for managers, approvals for managers, employee self-reads, social/assets for ESS; **remove `saas.configure` from tenant HR_ADMIN** (platform.md §0.4).

# C. USERS & ACCESS — `/settings/users` (**NEW**)
**Roles** `settings.configure`. User DataTable (email, employee, roles, status, last login). Actions: invite/resend (→ §03 resend-invite), assign roles, deactivate, **sessions/revoke** (→ §D), MFA status (→ §D). EXISTS `GET /auth/me` only today; **NEW** `GET /users`, `PATCH /users/:id` (status/roles).

# D. SECURITY & AUDIT — `/security`
**Roles** `settings.configure`. **Plan** Pro.
- **Audit explorer**: DataTable (time, actor, module, action, entity, before/after **DiffView** drawer, IP). Filters by everything; saved views ("Permission changes 90d", "Payroll overrides", "PII reveals", "Settings changes"); export `settings.configure`. EXISTS `GET /security/audit-logs` (top 100 only → **NEW** pagination/filter; AuditLog is tenant-scoped). System/error logs tabs (owner; today `GET /saas/logs` is cross-tenant, platform.md §4/§12).
- **Auth policy** (**NEW**): password rules, **MFA/2FA (TOTP)** (today "Enable 2FA" button has no handler + OTP endpoints are stubs, platform.md §1/§12 — market gap blueprint §4), session lifetime (15-min JWT, no refresh → add refresh, platform.md §0.1), IP allowlist, login notice. **SSO/SAML** = market gap.
- **Sessions & devices** (**NEW**): active sessions + revoke; suspicious-login feed. (No server logout today — platform.md §1.)
- **Fixes**: replace hardcoded Security Controls cards + dead tab/buttons (platform.md §2); real states not silent-zero on 403.
- **Webhooks** (**NEW**, market gap blueprint §4): endpoint, secret, event picker, delivery log.

# E. DATA ADMINISTRATION — `/settings/data` (**NEW**, master plan §5.6)
**Roles** `settings.configure` / owner. Import center (entity → template → mapper → validation → dry-run → commit; reuse §03 §4 pattern), Export center (field-security-aware, stamped; full-tenant export owner+typed-confirm), Backups (status; restore = support flow), Retention & privacy (DPDP rules, anonymization, data-request handler), Recycle bin (soft-deleted 30d). **NEW** endpoints; today only client-side JSON export in settings (platform.md §3).

# F. INTEGRATIONS & API — `/settings/integrations` (**NEW**, master plan §5.6)
**Roles** `settings.configure`. Cards w/ status (Connected/Not-set-up/Error): **Email (SMTP)** test-send (nodemailer exists, reminders email works — platform.md §8.2); **Biometric devices** (registry, API key, last-sync, field map); **SSO** (SAML/OIDC, test-login, JIT); **WhatsApp** (channel exists in notify DTO but only DB rows created — platform.md §8.1; wire real dispatch); **S3/file storage** (today local `./uploads` — core-hr §1.3); **Accounting export** (Tally JV, blueprint §4); **API keys** (scoped, rotate); **Webhooks** (→ §D); **SkyNexus AI** (net-new — empty module today, platform.md §10). **Calendar (ICS)** feeds.

# G. SUBSCRIPTION & BILLING — `/saas`
**Roles** `saas.read`. **Plan** Pro.
- Current plan card (modules, seats used), plan comparison, quote builder (duration, employee count, add-ons, coupon, GST 18%), **Pay** → `POST /saas/select-plan`, invoice preview, billing events.
- **Fixes (platform.md §4)**: payment is client-trusted amount + fake receipt/card, no gateway → integrate real gateway or label "simulated"; "Queue Invoice"/"Refresh License" are fake audit rows (₹1,749 hardcoded) → real invoice entity or remove; coupons/add-ons affect quote but **never persisted** (select-plan stores plan name only) → persist; hardcoded "Acme Corp"/dates. EXISTS `GET /saas`, `GET /saas/plans|coupons`, `POST /saas/select-plan`.

# H. SaaS OWNER CONSOLE — `/saas-admin`
**Roles** owner (`isOwner`). **FIX BROKEN GATE** (platform.md §4.5): client gate checks `isSuperAdmin`/`saas.admin`/role `super_admin` (lowercase) — none match real `SUPER_ADMIN` → **page dead for everyone**; fix to real role string.
- Tenants table (company, plan, seats, MRR, status, created), tenant room (subscription edit, module flags, payment history, **support-impersonation w/ consent + audit**), plans editor (DB-backed), payments reconciliation, platform health. **Fixes**: revenue bars/CPU/diagnostics hardcoded (platform.md §4.5) → real or remove; **`PATCH /saas/companies/:id/status` lets any HR_ADMIN suspend any tenant** (Company unscoped + HR has saas.configure, platform.md §4/§12) → restrict to platform owner + scope. EXISTS `GET /saas`, `PATCH /saas/companies/:id/status`, `POST /saas/select-plan`. Mojibake `â‚¹` in source → fix.
- **Health**: `GET /health` is static (no DB check, platform.md §11) → **NEW** real liveness/readiness; stop faking diagnostics.

---

## I. Cross-cutting (this section)
- Every toggle states its consequence in one sentence; risky switches (enforce SSO, disable module, shorten retention, suspend tenant) → modal w/ affected counts + typed confirm.
- Settings search indexes every label + helper line.
- All changes versioned or audited (with real actor); history one click away.
- **Highest-impact backend fixes (platform.md §12)**: verify JWT (not decode) + stop trusting `x-tenant-id` blindly; add Company/Payment/ErrorLog/Notification to tenant allowlist; signup grants HR_ADMIN not SUPER_ADMIN; remove saas.configure from tenant HR; JWT refresh; real roles/permissions API (§B); reconcile module vocabularies; declarations/support/coupons key fixes; audit actor stamping; real payment gateway or honest "simulated" labeling.

---

## J. Post-critique remediations (98 §D + §F)

### J1. Workflows — `/settings/workflows` (**resolves the §10→§08 orphan**, critique 98 §F-B5)
The approval-chain **builder UI lives here** (§10 B owns only the runtime engine/resolver). **Roles** `settings.configure`. Per-process chains (Leave, Regularization, OT, Expense, Travel, Loan, Comp revision, Offer, Requisition, Document change, Exit, Payroll lock): trigger conditions (type/amount/grade/dept) → ordered steps (approver type Reporting-manager / Manager's-manager / Role / Named / Dept-head / Cost-center-owner; per-step SLA→escalate, allow-delegate, auto-approve-on-timeout) → post-functions. Validation: unreachable-step linter, self-approval guard, cycle detection. Simulate with a sample request → resolved chain w/ names. Versioned; in-flight requests finish on their started version. **NEW** `GET/POST /workflows`. Until built, the `approvals.*` ClientRule routing strings (rbac B1) stay decorative.

### J2. Company Health settings (**registers the `companyHealth.weights` key**, critique 98 §F-B4/B5)
Add a **Company Health** section to the Settings tree (§A): per-signal weight sliders (attrition, attendance health, leave-burnout, engagement, payroll-cost, hiring-velocity) feeding the §09 A4 composite. **NEW** settings category `companyHealth` (key `weights`) — not in rbac B1 today; add to DEFAULT_RULES. Consumed by **NEW** `GET /dashboard/company-health` (`settings.configure`).

### J3. Register other NEW settings keys
- `attendance.ipAllowlist` (§04 A5 IP-restriction) → add to the Attendance settings row as NEW (not in rbac B1).
- Confirm exact-name keys per rbac B1 elsewhere (declarations `fyCutoff*`, support `defaultQueue`/`ticketPrefix`, taxCalc `cessPct`/`surchargePct`).

### J4. Plan enforcement (**P0 coverage gap**, critique 98 §D-3)
Plan tiers are **cookie-only today (platform.md §0.3)** — every page's "Plan Basic/Standard/Pro" badge is cosmetic, not a security boundary. **Decision required (escalate):** either enforce plan entitlement **server-side** on gated endpoints, or state explicitly in-product that plan is UX-gating only. Do not rely on the nav lock for access control.

### J5. Permissions-matrix fork — **decided** (critique 98 §D-6)
The decorative `permissions` ClientRule category + the Setup-Wizard "Roles & Permissions" matrix are **dropped**; the wizard's Step 8 instead calls the real `/roles` API (§B). Remove the `permissions` ClientRule write from setup (§12 F) so no dead key is written.

### J6. Tenant-scoping is necessary-but-insufficient (critique 98 §D-1/2)
Adding models to the Prisma allowlist (SEC-02) does **not** close cross-tenant access while TenantMiddleware still `decode()`s (not verifies) the JWT and trusts the `x-tenant-id` header (SEC-01). Both must land together; §09/§10 data reads depend on this.

### J7. Remove dead endpoints
- `GET /security/notifications` (cross-tenant, unused — console uses §10 `/notifications/mine`) → remove.
- Wire or remove `GET /notifications/recipients` (API-only) — reuse it for the §10 C2 audience picker or delete.

### J8. MFA ownership
§D owns MFA **policy/enforcement**; §12 D owns MFA **enrollment** (profile). Reciprocal cross-refs added.
