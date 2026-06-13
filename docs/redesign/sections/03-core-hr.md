# §03 — Core HR (Directory, Profile, Lifecycle, Org Structure, Custom Fields, ID Cards)

> Inventory: `inventory/core-hr.md` (endpoints, DTOs, quirks). Primitives: §02. Nav/permissions: §01, `inventory/rbac-settings.md`. Reference field registries: `inventory/blueprint.md` §5.2.
> Permissions in play: `employees.{read,create,update,approve,configure}`, `organization.{read,update}`. **`delete` is granted to no seeded role** (rbac-settings A2) → all hard-deletes are SUPER_ADMIN-only unless a custom role grants it; UI shows the control but gate-disables for others.
> Status legend per interaction: **EXISTS `METHOD /path`** = wire to current API · **NEW `METHOD /path` (perm)** = proposed backend. All paths relative to `/api/v1`.
> **Correctness fixes owned here (core-hr.md):** edit-form silent field drop (§1.1), documents auto-VERIFY (§1.3), broken bulk-upload input (§1.2), broken loans UI 404 (§1.16), broken custom-fields panel (§3.3), F&F notice double-count (§1.8), unsettable location lat/long (§2.5), hardcoded letterhead (§1.15), unreachable PROBATION/INACTIVE states (§1.11).

---

## 1. Employee Directory — `/employees`
**Title** "People" · **Breadcrumb** People · **Roles** `employees.read` (HR/MANAGER scoped; EMPLOYEE has read but directory is HR-facing — managers see team, employees redirected to own profile). **Plan** Basic.

### Layout
PageHeader ("People", count chip "218 active", primary **Add person** `employees.create`, secondary **Import**, **Export**) → **seat banner** (X of Y seats, from `GET /employees/license-info` — EXISTS, currently API-only core-hr §1.18) → segment tabs (Active · Probation · Notice period · Exited · All) → DataTable. View toggle: Table | Card grid.

### DataTable
- **Columns** (ColumnPicker): Avatar+Name (sort), Emp code (mono, sort), Designation, Department, Location, Manager, Joined (date, sort), Status (StatusPill), Profile completeness (ProgressRing sm). 
- **Filters** (FilterBar): department, designation, location, grade, employment type, status, gender, joining-date range, manager, "missing data" (no PAN / no bank / no UAN — HR hygiene). 
- **Sort**: name, code, joined, department. **Bulk**: select-all-in-filter → Export · Assign manager (→ §4 manager mapping) · Change department/location (effective-dated modal) · Resend invite · Confirm probation. **Row actions**: Open profile (row click → `/employees/[id]`), ⋯ (Start exit, Generate letter, Resend invite).
- **Pagination**: 25/50/100, "Showing 1–N of M". **NEW backend**: server-side pagination/sort/filter on `GET /employees` (today full-table load, core-hr §1.1) → `GET /employees?page&pageSize&sort&dept&status&q…`.
- **States**: skeleton 8 rows; empty (first-run) "No people yet — add your first teammate" + Add person; filtered-empty + Clear; error + retry + ref; forbidden → ForbiddenState.
- **Mobile**: rows → RecordCard (avatar, name, designation, status, ⋯).

### Interactions / API
| Action | API |
|---|---|
| Load list | EXISTS `GET /employees` (add pagination params — NEW) |
| Export CSV | client CSV today (core-hr §1.1); **NEW `GET /employees/export?format=csv\|xlsx` (`employees.read`/`export`)** server-stamped |
| Seat banner | EXISTS `GET /employees/license-info` |
| Search | global topbar search currently → `/employees?q=` reload (shell.md §1.2); in-table SearchInput is client filter; **NEW** server `q` param |

### Quick-add → Add person wizard (§3). Confirm-probation bulk → §1 profile probation.

---

## 2. Employee Profile 360 — `/employees/[id]` (NEW route; today it's a drawer in `/employees`)
**Title** employee name · **Breadcrumb** People / {Name} · **Roles** `employees.read`; self via `/auth/me employeeId`; field-level masking by role (§02 PII). **My Profile** = `/me` → redirects to own id.

### Header band
Avatar (96, photo from "Profile Photo" doc or initials), name + designation · dept · location · emp code (copyable) · StatusPill (Active/Probation/Notice/Exited). Actions by permission: **Edit** `employees.update`, **Generate letter** `employees.update`, **Start change** (transfer/promotion) `employees.create`, **Start exit** `employees.update`, ⋯ (Resend invite `employees.update`, Confirm probation `employees.approve`, Deactivate — NEW).

### Tabs
| Tab | Contents | API |
|---|---|---|
| **Overview** | DescriptionList: personal (DOB, gender, blood group, marital, emergency contact), contact, addresses[], education[], family[], **custom fields** (§5). PII masked (PAN `••••`, reveal logs audit). | EXISTS `GET /employees/:id` (includes addresses/education/family/bank/balances/structures) |
| **Job** | current position card + **effective-dated history** (promotions/transfers timeline w/ StatusPills); probation card (Confirm/Extend); reporting (manager chip → their profile, direct reports); shift & policy assignments. | EXISTS `GET /employees/:id/promotions`, `GET /employees/:id/transfers` (**NEW**: include from/to relation names — today fall back to placeholders, core-hr §1.13) |
| **Personal** | edit addresses/education/family lists (InlineEdit, add/remove rows). | **FIX** core-hr §1.1: PATCH must actually send these (today dropped). EXISTS `PATCH /employees/:id` (nested arrays wholesale-replaced) |
| **Documents** | per-employee vault: name, category, uploaded, **verify status** (Pending/Verified by+date/Rejected+reason), expiry (warning <30d via `documents.expiryReminderDays`). Upload (FileUpload, 2-step). HR bulk-verify. | EXISTS `POST /:id/documents/upload` then `POST /:id/documents`; **FIX** auto-VERIFY (core-hr §1.3) → create as PENDING; verify EXISTS `PATCH /:id/documents/:docId/verify` (**NEW** add reject path); expiry EXISTS `GET /reminders/upcoming-expiries` |
| **Bank & Pay** | bank (masked acct, IFSC, verification pill, self-service edit); statutory IDs (PAN/UAN/PF — decrypted per perm); current salary structure (SalaryBreakupTable, perm `payroll.read`); last payslips → §05. | EXISTS `PATCH /:id/bank-details` (resets to PENDING); **NEW UI** for `PATCH /:id/bank-details/verify` (today API-only, core-hr §1.4) |
| **Leave & Attendance** | balances rings + ledger excerpt; attendance month heatmap. | EXISTS `GET /leave/balances`, `GET /leave/ledger/:employeeId` (today API-only, time.md §7), attendance logs |
| **Assets** | assigned assets (AssetTag rows), report issue → §07 helpdesk. | EXISTS `GET /assets` (filter by holder) |
| **Career** | promotions + transfers timeline (read) + **create/decide UI** (today API-only, core-hr §1.13/14). | EXISTS create/decide endpoints; **NEW UI** |
| **Access** | login status, role(s), resend invite, sessions (→ §08). | EXISTS `POST /:id/resend-invite` (today API-only; **fix** plaintext temp password in notification, core-hr §1.12) |

### Edit form (drawer or Personal tab) — every field
employeeCode (text, unique per tenant — **NEW** drop global-unique email, core-hr §1.1/§0), firstName/lastName (req), email (email; **NEW** tenant-unique not global), phone, joiningDate (date), gender (select M/F/Other), dateOfBirth (date), bloodGroup (select), maritalStatus (select), panNumber (regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`, encrypted), uan (12 digit), providentFundAccount (encrypted), department/designation/location/grade/employmentType (Combobox), emergencyContactName/Phone, addresses[] / educationHistory[] / familyDetails[] (repeatable). **Errors** inline; **fix**: send code/name/email + nested arrays (today dropped). **Toasts** "Profile updated" / "Couldn't save — {reason} (ref id)". API EXISTS `PATCH /employees/:id`.

### Probation card
**Confirm** `employees.approve` → `PATCH /:id/confirm-probation` (EXISTS; **fix** core-hr §1.11 — nothing sets PROBATION today, so Add-Employee/onboarding must be able to set PROBATION status). **Extend** (months + reason) → letter. Confirm dialog "Confirm {name}'s probation? Status becomes Active." Toast success/fail.

---

## 3. Add Person — `/employees/new` (Wizard, NEW route; today an 8-field inline panel, core-hr §1.1)
**Title** "Add person" · **Breadcrumb** People / Add · **Roles** `employees.create`.
**Wizard steps** (draft autosave; exposes the full DTO, not 8 fields):
1. **Identity** — firstName, lastName, personal email, phone, photo upload.
2. **Job** — employeeCode (auto from numbering series, override), joiningDate, department, designation, grade, location, manager (EmployeePicker), employmentType, **status** (Active / **Pre-onboarding** / **Probation** — fixes unreachable states core-hr §1.11/§0.4), probation months.
3. **Statutory** — PAN (regex), Aadhaar (opt), UAN/PF (opt), ESIC eligible auto-flag by gross, tax regime default.
4. **Compensation** (opt) — salary structure template + CTC (CtcCalculator live preview, → §05) or "decide later".
5. **Access** — create login now / at joining; role pick; resend-invite toggle.
6. **Review & create** → success ("‹Name› added") + next cards: Start onboarding (§4) · Upload documents · Generate letter.
**Validation**: duplicate detection on PAN/email/phone (warn+continue). **API** EXISTS `POST /employees` (auto-seeds LeaveBalance rows + audit, core-hr §1.1). **Toasts** success/fail with ref. **Confirm** none (creation). **Mobile** single-column steps.

---

## 4. Bulk Import — `/employees/import` (drawer/page; **fix broken panel** core-hr §1.2)
**Roles** `employees.create`. Flow: download template → upload CSV/XLSX → column mapper (auto-match) → validation report table (row · error · fix-inline) → dry-run summary ("212 create, 8 update, 3 error") → commit (progress + result file). **Replace the decorative dropzone with a real `<input type=file>`** (FileUpload component). **API**: EXISTS `GET /employees/upload/bulk/template` (template), **prefer** EXISTS `POST /employees/upload/bulk/excel` (seeds leave balances + per-row errors) over the naive `POST /employees/bulk-upload` (skips seeding/audit — core-hr §1.2; deprecate). **States**: per-row error chips; partial-success summary. **Toast** "Imported 212, 3 errors — download report".

---

## 5. Onboarding — `/onboarding`
**Title** "Onboarding" · **Roles** `employees.read`/`create`/`update`. **Plan** Basic.
- **Board** (KanbanBoard) columns = template stages; card = joiner + joining-date countdown + checklist progress. **Runbook** `/onboarding/[id]` (NEW): Stepper of activities (title/description/assignedRole/owner/due-offset/status, attachments). 
- **Templates admin**: create template (dynamic activity rows: title, description, assignedRole) + list.
- **Start onboarding** form (employee + template).
- **API**: EXISTS `GET/POST /employees/onboarding/templates`, `POST /:id/onboarding/start`. **Major fix** (core-hr §1.5): start persists nothing today → **NEW** task-instance model + endpoints `GET/PATCH /employees/:id/onboarding/tasks` (`employees.update`) so the board/runbook track real progress (the "N tasks created" toast is currently misleading). **NEW**: template update/delete; add `companyId` to templates (today global, core-hr §0.2). **States**: empty "No onboarding in progress".

---

## 6. Exit Management — `/exits` (port friend-fork concepts, core-hr §1.6–1.10; master plan §5.1)
**Title** "Exits & Full-and-Final" · **Roles** `employees.update` (init), `employees.approve` (F&F approve). 
- **Initiation**: **Resign** (self-service — **NEW UI**; today API-only core-hr §1.9) `POST /:id/resign` {resignationDate, lastWorkingDay, exitReason, personalEmail} → status NOTICE_PERIOD; or HR termination. 
- **Board** columns: Notice period → Clearances → Exit interview → F&F pending → Settled. 
- **Runbook** `/exits/[id]` (NEW) tabs:
  - **Overview**: dates, reason, notice math, Stepper.
  - **Clearances**: **ClearanceMatrix** (dept × status; assets auto-listed; **NEW** persisted checklist — today separation start just flips status EXITED with no gating, core-hr §1.6).
  - **Exit interview**: form (reason, feedback, interviewer) EXISTS `POST /:id/exit-interview`, `GET …`.
  - **F&F statement**: auto-fill from `GET /:id/ff-suggestions` (EXISTS — gratuity from GratuityRule, leave encashment, loan balances, unpaid salary, unreturned assets, notice shortfall; default notice from `exitRules.defaultNoticeDays`=90, rbac-settings B1). SalaryBreakupTable + MoneyText words; per-asset Returned/Recover-cost/Pending (`PATCH /full-and-final/assets/:id`). **FIX double-count** (core-hr §1.8): notice shortfall must not be both in "Other Recoveries" and sent separately — single source. Generate → `POST /:id/full-and-final`. **Approve** `employees.approve` → `POST /:id/exit-ff/approve` (sets EXITED) — **wire the today-API-only approve** as the explicit step (stop auto-APPROVE on calculate, core-hr §1.8). Confirm dialog "Approve F&F for {name}? Net ₹{X}. This sets status Exited." 
  - **Letters**: relieving + experience generation — **NEW UI** for `POST /:id/exit-letters/relieving|experience` (today API-only, core-hr §1.10); employee downloads from Documents; **fix** hardcoded letterhead → white-label (core-hr §1.15).
- **States**: empty "No exits in progress".

---

## 7. Org Structure — `/organization`
**Title** "Organization" · **Roles** `organization.read` (view), `organization.update` (CRUD). **Plan** Standard.
Tabs: **Org Chart · Departments · Designations · Locations · Grades · Employment Types**.

- **Org Chart**: OrgChartView (recursive cards, collapse, direct/indirect counts), Department view toggle, export PNG/PDF. **Manager mapping** drag-to-reassign (**NEW UI**; panel exists unmounted, core-hr §2.2) → EXISTS `PATCH /organization/employees/:id/manager` (self-report guard). EXISTS `GET /organization/chart` (use its `photoUrl` — UI ignores it today). 
- **Departments** DataTable (name, code, **head** — add field, today no UI core-hr §2.3, parent, headcount): add/edit modal (name, code unique per company, managerEmployeeId EmployeePicker, status), **delete** with confirm "Delete department {name}? Reassign N employees first." — **NEW** soft-delete/reassignment flow (today hard-delete + generic FK error). EXISTS `GET/POST/PATCH/DELETE /organization/departments[/:id]`.
- **Designations** (title, **departmentId** link — add field core-hr §2.4, grade text, status). EXISTS `…/designations`. Note: rename the free-text `grade` to avoid clash with EmployeeGrade (core-hr §2.4 naming hazard).
- **Locations** (name, address, city, state, country, status, **latitude/longitude + geofence radius** — **NEW fields**; today unsettable but powers attendance geofence, core-hr §2.5). Map pin picker. EXISTS `…/locations` (+ **NEW** lat/long in DTO).
- **Grades** (code, maxExpenseLimit — drives expense caps money.md §3.1) + **Employment Types**: **NEW CRUD UI** (today dropdown-only, POST API-only core-hr §1.17). EXISTS `POST /employees/grades`, `GET /employees/grades/:companyId`, `POST/GET /employees/types`.
- **States/each table**: skeleton, empty + "Add the first {entity}", error.

---

## 8. Numbering series, letter templates
- **Letter Templates** (`/organization` tab or `/settings`): editor (type OFFER/APPOINTMENT/RELIEVING/EXPERIENCE, title, body w/ `{{placeholders}}`), preview with employee merge, print → PDF. **Fix** hardcoded letterhead → white-label band (§02 §12). EXISTS `POST /employees/letter-templates`, `GET …/list/:companyId`, `POST …/render`; **NEW** update/delete (today none, core-hr §1.15).
- **Numbering series** (emp code pattern) — **NEW** (today random `EMP{n}` fallback in bulk, core-hr §1.2); §08 owns the masters, surfaced in Add-Employee step 2.

---

## 9. Custom Fields — `/settings/custom-fields` (cross-ref §08; **fix fully-broken panel** core-hr §3.3)
**Roles** `employees.configure` (manage), `employees.read` (view own). Field list (label, fieldKey auto-slug, fieldType TEXT/NUMBER/DATE/SELECT + optionsJson, required, section, show-in-table, show-on-profile). **Fixes**: UI must POST `{label, fieldKey, fieldType, optionsJson, required}` (today sends wrong keys → 400); render `fieldKey`/`fieldType` (today reads `name`/`type`); read values keyed by `id` (today `definitionId` → always blank); engage type-driven inputs; add SELECT options authoring; drop bogus BOOLEAN. Show custom fields on the profile Overview (§2). EXISTS `POST/GET/PUT/DELETE /settings/custom-fields[/:id]`, `GET/PUT /employees/:id/custom-values`. **NEW**: self-service edit of own custom values (today PUT needs configure — perm asymmetry core-hr §3.3).

---

## 10. ID & Visiting Card — `/cards` (reference screen 20, implemented first pass)
**Roles** `employees.read` (own), `employees.configure` (templates). Template gallery, live front/back preview with employee merge, photo crop, brand color (from `branding.primaryColor`), batch generate by department (HR), A4 print sheet + single PDF, QR (vCard) toggle. Keep existing card-generator; restyle to §02; **fix** any hardcoded letterhead/brand → white-label.

---

## 11. Cross-cutting states & a11y (this section)
- Every list: skeleton / empty-first-run / filtered-empty / error+ref / forbidden.
- PII reveal (PAN/Aadhaar/bank) audit-logged with viewer + reason picker for non-self (core-hr §0.3).
- Effective-dated changes show "Scheduled" chips and appear in Career timeline immediately.
- All destructive (delete dept, retire template) preview affected counts + typed confirm.
- Mobile: tables → RecordCards; profile tabs → accordion; wizards single-column.
- Keyboard: row open (↵), drawer Esc, wizard next/back, matrix arrows.

## 12. Backend correctness backlog (consolidated from core-hr.md for this section)
Tenant-scope `EmployeeDocument`/`EmployeeBankDetail`/exit-promotion-transfer-loan models + onboarding/separation templates (add `companyId`); documents PENDING-on-create + reject path; PATCH employee send all fields; tenant-unique (not global) email; employee delete/deactivate endpoint; route + UI for loans list/decide (today 404, core-hr §1.16); persist onboarding/separation task instances; single-source F&F notice shortfall; location lat/long in DTO; server pagination/filter on `GET /employees`; server export endpoint; include relation names on promotion/transfer lists; numbering series.

---

## 13. Post-critique remediations (98 §B)
- **Loans tab (#15):** add a **Loans** tab to Profile 360 (§2) wiring the NEW `GET /employees/loans` + `PATCH /employees/loans/:id/decide` (today both 404; only `POST /employees/loans` exists). EMI auto-recovery already flows in payroll calculate (money.md §1.1).
- **Deactivate action (#14):** name its gate — propose `employees.update` for soft-deactivate vs `employees.delete` (SUPER_ADMIN-only by seed) for hard delete; no deactivate endpoint exists today (NEW). Gate-disable with reason per role.
- **Exit phantom module (#24):** exit endpoints are gated `employees.*` (e.g. `employees.approve` for F&F approve), **NOT** the phantom `exit.*` module (permissions seeded but no controller) — ignore `exit.*` grants when wiring.
- **Verify queue (#18):** wire `GET /employees/queue/verify` to the bulk-verify queue (today the Verification tab reads the unscoped full documents list — wrong dataset + tenant leak).
- **Separation task-instances (#20):** mirror §5's onboarding task-instance model + `companyId` fix for **separation** templates too (today `startSeparation` flips status EXITED with no persisted clearance, and templates are global).
- **Geofence radius ownership (#21):** reconcile to a **per-location** field that overrides the global `attendance.geofenceRadiusMeters` default (§04 A5) — single source, not two competing values.
- **Employees export perm (#12):** the export endpoint uses `employees.read` (avoid a seed change) or add `employees.export` to HR_ADMIN grants; the slash-notation was ambiguous.
- **Custom-fields dual alias (#16):** routes exist under **both** `settings/custom-fields…` and `custom-fields/definitions…` (values under `/employees/:id/custom-values` and `/custom-fields/values/:id`); `permission-map.json` must gate both aliases. Self-service value edit needs `employees.update` (today `employees.configure`).
- **`/me` + `/employees/[id]`** are NEW routes (no current route); add per §01 redirect rule.
