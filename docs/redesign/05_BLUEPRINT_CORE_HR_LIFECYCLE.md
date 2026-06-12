# 05 · Blueprint — Core HR & Employee Lifecycle

Screens: `/people` (directory), `/people/new`, `/people/[id]` (Employee 360), `/people/org-chart`, `/people/onboarding`, `/people/exits`, `/people/documents`, organization masters. API: `employees`, `organization`, `custom-fields`, parts of `documents`/`policies`/`payroll` (F&F).

---

## 1. `/people` — Directory

- **Header:** "People" + count chip ("218 active") + primary `Add person` (`employees.create`) + Import (doc 10 data center) + Export.
- **Segments (tabs):** Active · Probation · Notice period · Exited · All. Saved views below (e.g., "Engineering · Bangalore").
- **FilterBar:** department, designation, location, grade, employment type (FT/PT/Contract/Intern), status, gender, joining date range, manager, "missing data" (no PAN, no bank, no UAN — HR hygiene filter), custom fields.
- **DataTable columns (configurable):** Avatar+Name (+pronouns opt) · Emp code (mono) · Designation · Department · Location · Manager · Joined · Status chip · Profile completeness ring (sm).
- **Row click →** Drawer peek (photo, key info, quick actions: View 360, Start exit, Generate letter) · "Open full profile" → 360.
- **Bulk:** assign manager, change department/location (effective-dated modal), export, send announcement, generate ID cards.
- **Grid toggle:** photo-card grid for culture/people-browsing mode.

## 2. `/people/new` — Add person (Wizard)

Steps: 1) Identity (name, personal email, phone, photo) → 2) Job (emp code auto from numbering series w/ override, joining date, department, designation, grade, location, manager, employment type, probation months, shift, attendance & leave policy, holiday calendar — all defaulted from department/grade mapping) → 3) Compensation (structure template pick + CTC input → live SalaryBreakupTable preview; or "decide later") → 4) Statutory (PAN, Aadhaar, UAN/PF opt, ESIC if eligible auto-flag by gross, PT state, tax regime default) → 5) Access (create login now/at joining, role pick, modules visible preview) → 6) Review & create → success screen: "Asha added" + next-step cards (Start onboarding · Upload documents · Generate offer/appointment letter).
Draft autosaves; duplicate detection on PAN/email/phone with merge-or-continue prompt.

## 3. `/people/[id]` — Employee 360 (THE record page)

**Header band:** photo (96), serif name + designation · dept · location · emp code (copyable) · status chip (Active/Probation/Notice/Exited) · manager chip → their 360 · quick actions by permission: Edit, Generate letter, Start transfer/promotion, Start exit, Reset password, More (⋯: deactivate login, merge record, audit trail).

**Tabs (lazy-loaded, permission-trimmed):**

| Tab | Contents |
|---|---|
| **Overview** | DescriptionList: personal (DOB, gender, blood group, marital, addresses, emergency contacts), contact, family & dependents table (relation, DOB, insurance-covered chip), education, experience, languages, custom fields section. ESS-editable per doc 04 §4; PII masked per role (Aadhaar `•••• 1234`, reveal logs audit event). |
| **Job** | Current position card + **effective-dated history table** (position, dept, manager, location, grade, type; each row = event with letter link); probation card (ends date, confirm/extend actions → §5); reporting (manager, dotted-line, direct reports list); shift & policies assignments (attendance rule, leave policy, holiday calendar — change = effective-dated). |
| **Pay** | (perm `payroll.read` or self-limited) Current structure SalaryBreakupTable, CTC history graph, revision events (DiffView old→new), bank details (masked acct, IFSC, status), statutory IDs (PAN/UAN/ESIC/PRAN), loans summary, last 6 payslips links, tax regime + declaration status chip → `/pay/me` (self). |
| **Time** | Attendance month heatmap, leave balances rings + ledger excerpt, regularization history, shift calendar. |
| **Documents** | Per-employee doc vault: categories (Identity, Education, Experience, Offer & letters, Payroll/Form 16, Other); table: name, category, uploaded, **verify status** (pending/verified ✓ by+date/rejected+reason), expiry date with gold <30d chip; upload (FileUpload), bulk verify (HR); letters generated to this employee appear here automatically. |
| **Assets** | Assigned assets (AssetTag rows: code, type, condition, since), history, "Report issue" → Helpdesk prefilled. |
| **Performance** | Cycle results timeline, current goals tree, 360 received summary (perm-gated). |
| **Training** | Enrollments, completions, certifications (+expiry), skill map vs designation requirement (gap chips). |
| **Timeline** | Unified event stream (joined, confirmed, promoted, revised, leave milestones, rewards, exit) — the narrative spine; filterable. |
| **Access** | (HR/admin) Login status, role(s), extra permissions, sessions (revoke), MFA status, "View as" preview link (doc 10 §3.5). |

## 4. Organization masters (`/admin/settings/organization` + `/people/org-chart`)

- **Company profile:** legal name, brand name, logo (light/dark variants), CIN/PAN/TAN/GSTIN, PF code, ESI code, PT registrations per state, registered & comms addresses, signatories (name, designation, signature image — used on letters/Form 16), fiscal year, currency.
- **Entities & locations:** legal entities table; locations (address, state→drives PT/LWF, holiday calendar default, geo-fence radius for punch).
- **Departments:** TreeTable (nest allowed), head, parent, cost center code, headcount; merge/retire with reassignment wizard.
- **Designations:** title, level/band, grade map, skill map link; **Grades:** code, range (min/mid/max CTC), expense caps link, leave policy default.
- **Cost centers**, **Employment types**, **Numbering series** (EMP-/CAND-/TKT- patterns with preview).
- **Org chart** (`/people/org-chart`): OrgChartView from reporting lines; toggle department view; vacancy nodes (open requisitions ghost cards → recruitment); export.

## 5. Onboarding (`/people/onboarding`)

- **Board:** KanbanBoard columns = template stages (e.g., Offer accepted → Docs → Provisioning → Day 1 → Week 1 → Confirmed-start); card: candidate/joiner, joining date countdown chip (brick if overdue items), checklist progress bar.
- **Runbook `/people/onboarding/[id]`:** Stepper of stages; each stage = OnboardingChecklist items (owner: HR/IT/Manager/Buddy/Employee, due offset like "J-3", status, attachments); blockers raise Inbox tasks to owners; "Convert to employee" gate validates statutory minimums.
- **Preboarding portal `/welcome/[token]`** (no login): warm Painted Paper welcome page — offer summary, doc upload requests (PAN, Aadhaar, photos, bank proof, education), forms (personal details → prefill profile), policy previews, day-1 info (address, time, buddy contact). Progress saves; HR sees inflow live.
- **Templates admin:** per department/grade checklists, item library, owners, offsets.

## 6. Probation & confirmation

Probation widget on Job tab + HR list view (filter "Probation ending ≤30d"). Actions: **Confirm** (effective date → status flips, confirmation letter auto-draft, optional increment hook) · **Extend** (months + reason → letter) · **Initiate exit**. Manager gets review task in Inbox at P-14d (configurable reminder rule).

## 7. Transfers, promotions, revisions (effective-dated change engine)

"Start change" from 360 → Wizard: change type (Transfer location/dept · Promotion · Role change · Manager change · Compensation revision) → effective date → new values (only deltas) → comp change optional step (new CTC → DiffView per component, arrears auto-note if backdated) → approvals (workflow per doc 10 §4) → letter generation (template merge) → scheduled apply on effective date (visible as "Upcoming change" chip on 360 until then; cancellable with permission).

## 8. Exits & Full-and-Final (`/people/exits`)

- **Initiation:** employee (ESS "Resign" with reason + last-working-day proposal per notice rule) or HR (termination/absconding/retirement — reason codes). Notice computation card: policy days, served, shortfall → recovery or waiver (approval).
- **Board:** columns Notice period → Clearances → Exit interview → F&F pending → Settled & closed. Card: person, LWD countdown, clearance dots.
- **Runbook `/people/exits/[id]`:**
  - **Overview:** dates (resignation, acceptance, LWD), reason, notice math, status Stepper.
  - **Clearances:** ClearanceMatrix — rows per dept (Manager: handover; IT: assets+access; Finance: advances/loans; Admin: ID card; HR: docs): owner, status, remarks, asset return integration (auto-lists assigned assets; condition on return), each clearance = Inbox task.
  - **Exit interview:** structured form (reasons ranked, would-return, comments) + interviewer notes; analytics feed (attrition reasons chart in Insight).
  - **F&F statement:** auto-draft pulling — last salary proration, **leave encashment** (balance × rate per policy), gratuity (if ≥4y240d; calculator popover shows formula 15/26 × years), bonus/retention dues, recoveries (notice shortfall, loans outstanding EMI closure, asset damages), TDS on settlement; SalaryBreakupTable style statement + MoneyText words; Approve (`payroll.approve`) → pay via off-cycle run or bank file → mark Settled.
  - **Letters:** relieving + experience letter generation (templates merge LWD, tenure, designation); employee download from their Documents.
  - **Access end:** login auto-disable on LWD 23:59 (override window for handover), shown on Access tab.
- **Alumni:** exited profiles read-only, Form 16 & payslip access portal token (post-exit tax season access — doc 07 §8).

## 9. `/people/documents` — org Document & Letter center

- **Tabs: Employee documents** (org-wide table: employee, doc, category, verify status, expiry; bulk verify; expiring-soon saved view) · **Letter templates** (rich editor with merge-field palette `{{employee.name}} {{job.designation}} {{pay.ctc_words}}`, letterhead preview, versioning) · **Generate** (template × audience picker → batch preview → generate PDFs → deliver to employee Documents + optional email) · **Acknowledgments** (policy/letter ack tracking table) · **Bulk import** (zip upload mapped by emp code, e.g., signed Form 16 Part A files — pairs with doc 07 §8).

---

### Cross-cutting states
- Every people list/table ships skeleton, first-run empty ("Add your first teammate"), filtered-empty, error w/ ref.
- Effective-dated edits always show "Scheduled" chips and appear in Timeline immediately.
- All destructive flows (retire department, delete template) preview affected counts and require typed confirm when >0 affected.
- PII reveals (Aadhaar/PAN/bank) audit-logged with viewer + reason picker for non-self views.
