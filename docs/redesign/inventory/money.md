# Money Modules Inventory — Payroll, Compliance, Expenses

> Source-of-truth audit for the UI redesign. Generated 2026-06-12 from:
> - API: `apps/api/src/modules/payroll/*`, `apps/api/src/modules/compliance/*`, `apps/api/src/modules/expenses/*`
> - Web: `apps/web/components/payroll-console.tsx` (3,261 lines, mounted at `/payroll`),
>   `apps/web/components/compliance-dash.tsx` (embedded inside payroll console "Statutory & Tax" tab),
>   `apps/web/components/compliance-console.tsx` (mounted at `/compliance`),
>   `apps/web/components/expenses-console.tsx` + `live-tables.tsx` `ExpensesTable` + `action-panels.tsx` `ExpenseClaimPanel` (mounted at `/expenses`)
>
> Conventions used below:
> - **API-only** = endpoint exists, no UI control calls it.
> - **UI-only / fake** = UI element exists but is decorative, hardcoded, or hits a non-existent route.
> - All API routes are under the global prefix `/api/v1`. Tenant isolation is enforced by Prisma middleware
>   (`apps/api/src/prisma/prisma.service.ts:36-84`) for models that carry `companyId`/`tenantId`; child models
>   (Payslip, SalaryStructure, Expense, etc.) are scoped through their employee/company relations.
> - "Employee self-scoping" in payroll is keyed on the **absence of `payroll.approve`** in the JWT
>   (`payroll.service.ts:35` and repeated): any user lacking that permission sees only rows where
>   `employeeId === user.employeeId`.

---

## 1. PAYROLL (`/payroll`, controller: `payroll.controller.ts`, service: `payroll.service.ts`)

The payroll console has **14 tabs**: Payroll Run, Payslips, Bank Export, Statutory & Tax (= ComplianceDash),
Salary Setup, Templates, Retention Bonus, Salary Withholding, Corrections, Gratuity, Tax Slabs,
IT Declaration & Proofs, Form 16, Components (`payroll-console.tsx:460`).

### 1.1 Payroll Runs lifecycle (create → calculate → lock)

| Endpoint | Method/Path | Permission |
|---|---|---|
| List runs | GET `/payroll/runs` | `payroll.read` |
| Create run | POST `/payroll/runs` | `payroll.create` |
| Calculate | POST `/payroll/runs/:id/calculate` | `payroll.update` |
| Lock | POST `/payroll/runs/:id/lock` | `payroll.approve` |

**Behavior (service):**
- `createRun` is an **upsert** on `(companyId, month, year)` with `update: {}` — re-creating an existing month silently returns the old run unchanged (`payroll.service.ts:274-290`). Status starts `DRAFT`.
- `calculate` (`payroll.service.ts:557-986`) rejects locked/APPROVED runs; iterates all ACTIVE employees with an ACTIVE salary structure effective on or before the 1st of the run month. Per employee it composes:
  - Earnings: monthly Basic/HRA/Allowances (annual structure values ÷ 12, rounded), approved expenses in-month ("Expense Payout"), AdditionalSalary ADDITIONs in-month, APPROVED benefit claims in-month, APPROVED corrections (with `targetRunId` null or this run — corrections get stamped with this run id at `payroll.service.ts:717-726`).
  - Deductions: Employee PF (admin-configurable rate/ceiling from Settings payroll rules, default 12% on basic capped at ₹15,000), ESI (0.75%/3.25% default, only if gross ≤ ₹21,000 ceiling), Professional Tax (admin `ptSlabs`; fallback ₹200 if gross > pfWageCeiling — note the code comments say "use esiWageCeiling" but actually uses `pfWageCeiling`, `payroll.service.ts:750-752`), TDS (see 1.10), AdditionalSalary DEDUCTIONs, loan EMIs (auto-deducted from APPROVED loans with balance, creates `LoanRepayment` rows and decrements balances; prior repayments for the run are reversed first to make recalc idempotent, `payroll.service.ts:599-612`), Loss-of-Pay from `penaltyLog` rows with status `CONVERTED_LOP` (lopDays/calendar-days × monthly earnings).
  - **Salary Withholding**: if an ACTIVE withholding overlaps the month, full net pay is moved into deductions and netPay = 0, recorded as a "Salary Withholding" component (`payroll.service.ts:853-866, 913`).
  - Side effects: payslips upserted with status APPROVED; payslip components rebuilt (deleteMany + createMany); APPROVED expenses in-month flipped to **PAID** with `reimbursedAt`; benefit-claim "update to PAID" is a **no-op** (sets APPROVED → APPROVED, `payroll.service.ts:948-958`).
- **CRITICAL WORKFLOW QUIRK:** `calculate` finishes by setting the run to `status: APPROVED` **and `lockedAt: new Date()`** (`payroll.service.ts:963-970`). Consequences:
  1. A run can only ever be calculated **once** (recalc throws "Locked payroll runs cannot be recalculated").
  2. Run status `PENDING` is **never produced by the API**, so the UI "Lock Payroll" button (enabled only when `status === "PENDING"`, `payroll-console.tsx:652`) is **dead** and the 4-step wizard's "Audit & Finalize" step can never be the active step.
  3. POST `/runs/:id/lock` always 400s ("already locked") after calculate → **effectively API-dead** too.
  4. Payroll **corrections can never be created** (see 1.6).
- `lock` (when reachable) approves run + all payslips and marks in-month APPROVED expenses PAID — duplicating what calculate already did.

**UI (Payroll Run tab):** run month/year creation modal (month dropdown defaults to "6"/June hardcoded, year = current±), run selector dropdown with status pill, Calculate Salary / Lock Payroll / Bank CSV Export buttons, payslip table with per-row "View Breakdown". 4-step wizard cards are clickable but mostly set hint messages.
**UI-only / fake:** header stat "Audit State: Verified / Compliance ready" is hardcoded (`payroll-console.tsx:494`); "Gross Payout" stat computes `₹(totalGross/12000)L` — mathematically wrong for lakhs (`payroll-console.tsx:493`); wizard step-4 completion (`bankExported`) is client state lost on reload.

### 1.2 Payslips & components

| Endpoint | Method/Path | Permission |
|---|---|---|
| Payslips for run | GET `/payroll/runs/:id/payslips` | `payroll.read` |

- Employees (no `payroll.approve`) get only their own payslip. Bank details sanitized via `sanitizeBankDetail` (`payroll.service.ts:1042-1045`).
- **UI:** "Payslips" tab card grid + breakdown modal (earnings/deductions split by `PayrollComponent.type`), "Print Payslip" = `window.print()`.
- **Fake fallback:** if a payslip has no components, the breakdown modal **invents** numbers: Basic = 50% of gross, HRA 20%, Special 30%; PF 40% of deductions, ESI 10%, PT 10%, TDS 40% (`payroll-console.tsx:1484-1537`). A redesign must not preserve this.
- No payslip PDF endpoint; no per-payslip GET endpoint (UI refetches the whole run's list to open one slip, `payroll-console.tsx:424-436`).

### 1.3 Salary structures (per-employee CTC)

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/salary-structures` | `payroll.read` (self-scoped for employees) |
| Create | POST `/payroll/salary-structures` | `payroll.configure` |

- All money fields are **annual**; DTO `payroll.dto.ts:3-51`. No update/delete/deactivate endpoint — "Modify" in UI just POSTs a new row; the old row is **not** deactivated by this path (only template-assign deactivates, see 1.4), so multiple ACTIVE structures can accumulate; `calculate` picks latest by `effectiveFrom`.
- **UI:** "Salary Setup" tab table + "Configure CTC" modal (employee, effectiveFrom, annual CTC/basic/HRA/allowances/PFs/ESI/PT/TDS).
- **Dead UI code:** `handleAutoCalculate()` (`payroll-console.tsx:228-256`) implements client-side hardcoded statutory estimates (50% basic, 12% PF, ESI ≤21k, PT 200, ad-hoc TDS) but **no button ever calls it**.

### 1.4 Salary structure TEMPLATES (formula-based)

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/templates` | `payroll.read` |
| Create | POST `/payroll/templates` | `payroll.configure` — **API-only (no UI)** |
| Update | PATCH `/payroll/templates/:id` | `payroll.configure` — **API-only (no UI)** |
| Delete | DELETE `/payroll/templates/:id` | `payroll.configure` — **API-only (no UI)** |
| Assign | POST `/payroll/templates/:id/assign` | `payroll.configure` |

- Template = `{ name, description, status, components: [{name, type EARNING/DEDUCTION, calcType FIXED/FORMULA, formula?, amount?}] }`. Create/update accept `body: any` — **no DTO validation**.
- `assignTemplate` (`payroll.service.ts:152-255`): per employee, requires an existing ACTIVE structure with `annualCtc > 0` (otherwise added to `failed[]` with reason); evaluates formulas with a **regex that only supports the exact shape `CTC * <number>`** (`payroll.service.ts:196`) — anything else silently computes 0; maps components into the fixed structure columns by **name keyword matching** (`basic`, `hra`, `tds`, `pf`/`provident`, `esi`, `tax`/`professional` — everything else → allowances; note employer PF is never populated, always 0, `payroll.service.ts:203-219, 236`); transactionally deactivates old ACTIVE structures and creates the new one. Returns `{passed, failed, count}`.
- **UI:** "Templates" tab — read-only cards showing component formulas + "Assign" modal (multi-select employees, effective date, passed/failed result screen). **No UI to create, edit, or delete templates** — they must be seeded or API-driven.

### 1.5 Payroll component configs (metadata catalog)

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/component-configs` | `payroll.read` |
| Create | POST `/payroll/component-configs` | `payroll.configure` |
| Update | PATCH `/payroll/component-configs/:id` | `payroll.configure` |
| Delete | DELETE `/payroll/component-configs/:id` | `payroll.configure` |

- Metadata flags per component: `category` (BASE/RECURRING/VARIABLE/ADHOC), `kind` (ALLOWANCE/REIMBURSEMENT/DEDUCTION), `taxable`, `annualLimit`, `individualOverride`, `proofRequired`, `esiApplicable`, `includedInCtc`, `enabled` (`component-config.dto.ts`).
- **UI:** "Components" tab — full CRUD modal with all checkboxes, Enable/Disable toggle via PATCH `{enabled}`. **Delete endpoint exists but UI has no Delete button** (only Edit + Enable/Disable).
- **MAJOR GAP:** component configs are a **pure catalog** — nothing in `calculate()` or anywhere else reads them. `taxable`, `annualLimit`, `proofRequired`, `esiApplicable`, `includedInCtc` have **zero runtime effect** on payroll math. `ToggleComponentConfigDto` is defined and imported but no toggle endpoint exists (dead DTO).

### 1.6 Payroll corrections (arrears / adjustments)

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/corrections` | `payroll.approve` |
| Create | POST `/payroll/corrections` | `payroll.create` |
| Decide | PATCH `/payroll/corrections/:id/decide` | `payroll.approve` (defaults `decidedByUserId` to current user) |

- Types: `ARREAR`, `BONUS_ADJUSTMENT`, `DEDUCTION_REVERSAL` (all treated as EARNING additions in calculate, amount ≥ 0). Optional `targetRunId`; approved corrections with null target get swept into the next calculated run and stamped.
- **CRITICAL:** `createCorrection` rejects payslips whose run is locked/APPROVED (`payroll.service.ts:1245-1247`) — but since `calculate` locks every run instantly (1.1), **every payslip always belongs to a locked run → manual correction creation always 400s.** The only corrections that ever exist are auto-created APPROVED ones from withholding release (1.8). The Corrections UI form is effectively non-functional against current backend behavior.
- **UI:** "Corrections" tab — form (target payslip dropdown **loads payslips of the newest run only**, `payroll-console.tsx:1756-1764`), type/amount/reason; ledger with Approve/Reject buttons on PENDING rows.

### 1.7 Retention bonuses

| Endpoint | Method/Path | Permission |
|---|---|---|
| Create | POST `/payroll/retention-bonuses` | `payroll.create` |
| List | GET `/payroll/retention-bonuses` | `payroll.read` (self-scoped for employees) |
| Decide | PATCH `/payroll/retention-bonuses/:id/decide` | `payroll.approve` |

- Approval creates an `AdditionalSalary` ADDITION named "Retention Bonus - {reason}" dated `bonusDate`, which the run for that month picks up (`payroll.service.ts:1337-1360`). One-shot decide (400 if already decided).
- **UI:** "Retention Bonus" tab — create form + ledger with Approve/Reject on PENDING.

### 1.8 Salary withholding

| Endpoint | Method/Path | Permission |
|---|---|---|
| Create | POST `/payroll/withholdings` | `payroll.create` |
| List | GET `/payroll/withholdings` | `payroll.read` (self-scoped for employees) |
| Release | POST `/payroll/withholdings/:id/release` | `payroll.update` |

- Active withholding zeroes net pay during calculate (1.1). `release` flips status to RELEASED and, for **every** "Salary Withholding" payslip component the employee ever had, creates an auto-APPROVED `ARREAR` correction for the next run — skipping payslips that already have **any** ARREAR correction (`payroll.service.ts:1424-1442`; a legit manual arrear would block the release arrear).
- **UI:** "Salary Withholding" tab — form (from/to dates, reason) + ledger with "Release" button on ACTIVE rows.

### 1.9 Gratuity

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/gratuity` | `payroll.approve` (employees **cannot** see own records) |
| Calculate preview | GET `/payroll/gratuity/:employeeId/calculate` | `payroll.read` (self-scoped) — **API-only (no UI)** |
| Create | POST `/payroll/gratuity` | `payroll.create` |
| Decide | PATCH `/payroll/gratuity/:id/decide` | `payroll.approve` |

- Formula: `monthlyBasic(=annual basic/12) × multiplier × completedYears` (rounds half-up to nearest year), eligible only if `years ≥ minYears`. `minYears`/`multiplier` come from `gratuityRule` per company, defaults 5y and 15/26 (`payroll.service.ts:1167-1175`).
- **GAP:** `CreateGratuityRuleDto` exists (`new-features.dto.ts:4-15`) but **no endpoint exposes gratuity-rule CRUD** — rules are DB-seed-only.
- Decided gratuity is **not** paid through payroll (no AdditionalSalary/payslip linkage) — approval is record-keeping only.
- **UI:** "Gratuity" tab — pick employee → "Compute Dues" (POST create, no preview step) + settlements ledger with Approve/Reject. The GET preview endpoint is unused by UI.

### 1.10 Income tax slabs

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/payroll/tax-slabs` | `payroll.read` |
| Create | POST `/payroll/tax-slabs` | `payroll.configure` |
| Delete | DELETE `/payroll/tax-slabs/:id` | `payroll.configure` — **API-only (no UI delete button)** |

- Slabs are per `regime` (NEW/OLD), `fromAmount`/`toAmount?`/`ratePercent`/`surcharge` (surcharge stored, **never used in calculate**). They are global rows — **no `companyId` on the model usage here**, so slabs are shared (verify multi-tenant intent before redesign).
- Used by `calculate` TDS: annual gross = `grossSalary × 12` (NB: gross includes one-off bonuses/benefit claims/corrections, so a one-time payment inflates the annualization), standard deduction & 80C/80D/24b caps from Settings `taxCalc` (defaults 75k/50k/1.5L/25k/2L), **rebate thresholds hardcoded** (NEW ≤7L, OLD ≤5L taxable = zero tax, `payroll.service.ts:789`), 4% cess hardcoded, ÷12 monthly. If DB slabs are empty it falls back to **hardcoded FY-24-style slab ladders** (`payroll.service.ts:802-839`). Employees without a tax declaration get `structure.tds / 12` flat (`payroll.service.ts:845-847`).
- **UI:** "Tax Slabs" tab — add form (regime/from/to/rate; no surcharge input) + read-only ledger. No delete, no edit.

### 1.11 Tax declarations (regime + exemptions) with window enforcement

| Endpoint | Method/Path | Permission |
|---|---|---|
| Submit/Upsert | POST `/payroll/tax-declarations` | `payroll.update` |
| Get by employee | GET `/payroll/tax-declarations/:employeeId` | `payroll.read` (403 if employee requests another's) |

- **One declaration per employee** (upsert keyed on `employeeId` alone — a new FY overwrites the prior FY's record, `payroll.service.ts:389-411`). Status auto-`APPROVED` on submit — no HR review step for the declaration itself.
- **Window enforcement** (`payroll.service.ts:362-387`): if Settings → Payroll → declarations `windowEnabled`, submission allowed only between `monthlyFromDay`–`monthlyToDay` of each month, plus an FY-tail cutoff (`fyCutoffMonth`/`fyCutoffDay`, only enforced when both cutoff and today fall in Jan–Mar). Violations → 400 with explanatory message. Window settings are editable in `settings-console.tsx` (~line 880-906), not in the payroll console.
- **Controller note:** despite the comment "Employees may only submit their own declaration — scope enforced in service" (`payroll.controller.ts:201`), `submitTaxDeclaration` **does not check** `user.employeeId` vs `data.employeeId` — any holder of `payroll.update` can submit for anyone.
- **UI:** ComplianceDash → "Tax Declarations" sub-tab: employee picker, FY dropdown (hardcoded `2026-2027` / `2025-2026`), regime select, 80C/80D/24/Other inputs (only shown for OLD regime), live "Current Active Declaration" panel. NEW-regime info text hardcodes "₹75,000 standard deduction".

### 1.12 Tax proof submissions (IT proofs)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Upload file | POST `/payroll/tax-proofs/upload` (multipart) | `payroll.read` — saves to `./uploads`, returns `{fileUrl}` |
| Create proof | POST `/payroll/tax-proofs` | `payroll.read` (employee may only submit own — enforced, `payroll.service.ts:428-433`) |
| List | GET `/payroll/tax-proofs` | `payroll.read` (self-scoped for employees) |
| Decide | PATCH `/payroll/tax-proofs/:id/decide` | `payroll.approve` (status + `hrRemarks`, sets `decidedAt`) |

- After every decision, `updateDeclarationFromProofs` recomputes each section on the declaration: if any APPROVED proof exists for a section, the declared amount is **destructively overwritten** with `min(declared, Σ approved actuals)` — the original declared value is lost (`payroll.service.ts:486-526`).
- **TWO competing UIs:**
  1. ComplianceDash → "Proof Submissions" sub-tab (HR-oriented): employee picker, FY text input, section select (NB sends `"Other"` capitalized while the recompute matcher expects lowercase `"other"` — capital-O proofs never roll up into `otherExemptions`), declared/actual amounts, **file URL as plain text input** (no upload), ledger with Approve/Reject.
  2. Payroll console → "IT Declaration & Proofs" tab (`ITDeclarationProofsTab`, `payroll-console.tsx:2919+`): section-status cards (Declared/Proof Pending/Verified/Rejected), real file-upload form, verification queue with Approve/Reject + remarks. **THIS UPLOAD PATH IS BROKEN:** it does a raw `fetch("/api/v1/payroll/tax-proofs/upload")` — a **relative URL** that hits the Next.js origin (no rewrite exists in `next.config.mjs`) instead of the API base — and reads the token from `localStorage.getItem("auth_token")` while the real key is `peopleos_access_token` (`session.ts:3`). Also, the subsequent proof POST sends `employeeId: proofs[0]?.employeeId ?? ""` ("will be overridden by server scope" — **the server does not override**; for a user with zero prior proofs this submits an empty employeeId, `payroll-console.tsx:2996`).

### 1.13 Flexible benefits (FBP)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Apply (set limit) | POST `/payroll/benefits/apply` | `payroll.configure` — auto-status APPROVED |
| List applications | GET `/payroll/benefits/applications` | `payroll.read` (self-scoped) — **API-only (no UI)** |
| Claim | POST `/payroll/benefits/claim` | `payroll.update` — status PENDING |
| List claims | GET `/payroll/benefits/claims` | `payroll.read` (self-scoped) |
| Decide claim | PATCH `/payroll/benefits/claims/:id/decide` | `payroll.approve` |

- APPROVED claims are added to gross pay in the claim month's run as "Flexible Benefits Claimed" (1.1). The post-payout status update is a no-op (stays APPROVED, never PAID — `payroll.service.ts:948-958`), so claim state cannot distinguish "approved" from "paid".
- **GAP:** `annualMax` from the benefit application is **never enforced** against claims — you can approve claims past the limit; applications and claims are linked only by free-text `benefitName`.
- **UI:** ComplianceDash → "Flexible Benefits" sub-tab: "Approve Benefit Limit" form (hardcoded benefit heads: Medical Reimbursement / LTA / Car Maintenance), "Claim Flexible Benefit" form (same heads, amount/date/receipt URL), claims queue with Approve/Reject. **No view of configured limits/applications anywhere** (list endpoint unused).

### 1.14 Additional salary (ad-hoc bonus / recovery)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Create | POST `/payroll/additional-salary` | `payroll.update` |
| List | GET `/payroll/additional-salary` | `payroll.approve` (employees cannot see own entries) |

- Type ADDITION or DEDUCTION; takes effect in the run covering `date`. No approval workflow, no edit/delete — entries are immediate and permanent.
- **UI:** ComplianceDash → "Additional Salary" sub-tab: form + read-only records table.

### 1.15 Form 16 (annual tax summary)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Get | GET `/payroll/:employeeId/form16` | `payroll.read`; service additionally restricts to self OR role HR_ADMIN/SUPER_ADMIN (`payroll.service.ts:1453-1457`) |

- FY start month from Settings (`fiscalYearStartMonth`, default 4); sums payslip `grossPay` + TDS components across FY months; recomputes liability from Settings `tdsSlabs` (NEW regime **hardcoded** — declaration regime/exemptions ignored), surcharge >₹50L @10%, 4% cess; returns refund/due vs TDS deducted. The `comp.type === "TDS"` check never matches (components are stored type DEDUCTION) — the name-contains-"tds" fallback is what works (`payroll.service.ts:1491`).
- **BROKEN UI ROUTE:** the Form 16 tab fetches **`GET /payroll/form16/:employeeId`** (`payroll-console.tsx:2704`; same wrong shape in `apps/web/lib/permission-map.json:255`) but the controller route is **`/payroll/:employeeId/form16`** (`payroll.controller.ts:404`). Segment order differs → the UI call 404s. The polished Form 16 printable panel (Part A/B/C, refund banner, print button) is effectively **UI-only against a mismatched route**. Fix = one-line path change on either side.

### 1.16 Bank disbursement file export + skipped list

| Endpoint | Method/Path | Permission |
|---|---|---|
| Download CSV | GET `/payroll/runs/:id/bank-file` | `payroll.approve` — `Content-Disposition: bank-transfer-MMM-YYYY.csv` |
| Skipped list | GET `/payroll/runs/:id/bank-file/skipped` | `payroll.approve` |

- CSV columns: Beneficiary Name, Account Number (AES-decrypted), IFSC, Amount (netPay 2dp), Narration (`{narrationPrefix from Settings, default "SALARY"} MMM YYYY`); only payslips with `bankDetails.verificationStatus === "VERIFIED"`; rows CSV-escaped; export audit-logged (`payroll.service.ts:1057-1090`).
- Skipped = APPROVED payslips with missing/unverified bank details, with reason strings.
- **API quirk:** export filters on payslip status APPROVED but **does not require the run to be locked** — only the UI gates the button on run status APPROVED.
- **UI:** "Bank Export" tab preview table (name/code/net/bank/IFSC) + download button; pre-flight calls the skipped endpoint and shows a "Missing Bank Details — excluded — Download Anyway?" modal (`payroll-console.tsx:315-364, 1348-1394`). Bank-file download uses a raw `fetch` with the correct token/base (unlike the proof upload).

---

## 2. COMPLIANCE (`/compliance`, controller: `compliance.controller.ts`, service: `compliance.service.ts`)

Tiny module — 2 endpoints. UI = `compliance-console.tsx` at `/compliance` (distinct from the ComplianceDash embedded in payroll).

### 2.1 Compliance summary dashboard

| Endpoint | Method/Path | Permission |
|---|---|---|
| Summary | GET `/compliance` | `compliance.read` |

- Returns: activeEmployees, configuredEmployees (= count of **all** salary structures — **no ACTIVE filter and no de-dup**, so employees with historical structures are double-counted and totals inflate, `compliance.service.ts:15-19, 24-32`), payrollRuns count, totals {pf, esi, professionalTax, tds} summed from **annual** structure columns (labels in UI don't say annual), per-employee rows with `form16Status = tds > 0 ? READY : NOT_REQUIRED`, and 5 readiness "checks" (PF/ESI/PT/TDS/Form16 → READY iff total > 0).
- **UI:** 4 metric cards, Compliance Center check cards, Employee Compliance Register table. Initial state from `emptyCompliance` (zeros), live data fills in; `fallbackCompliance` is only used as a TS type.

### 2.2 Statutory exports (PF ECR / ESI / PT / TDS / Form16)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Export | POST `/compliance/export/:type` | `compliance.export` |

- **Implemented for only 2 of the 5 UI buttons:**
  - `pf`: PF ECR text format (`UAN#~#Name#~#Gross#~#EPFWages#~#EPSWages#~#EDLIWages#~#EE#~#EPS#~#ER#~#NCP#~#Refunds`) over ACTIVE structures; UAN fallback `"000000000000"`; EPS = 8.33% **hardcoded**; PF wage ceiling from Settings (`compliance.service.ts:70-89`). Uses annual structure values (not monthly run data) — figures are **not** challan-grade.
  - `esi`: CSV `IP_Number,IP_Name,Days,Wages,Reason_Code` — IP number taken from **`providentFundAccount`** (code comment admits "Assuming ESI IP"), days hardcoded 30, wages = annual basic+hra+allowances (`compliance.service.ts:90-98`).
  - `pt`, `tds`, `form16`: **NOT implemented** — payload stays `""`, yet the export is audit-logged as GENERATED and the UI happily downloads an **empty file** (`compliance-console.tsx:76` renders all five buttons; **3 of 5 are fake**).
- **No PT challan generation exists anywhere** despite PT being calculated in payroll runs. Exports are never derived from actual payroll-run/payslip data — only from salary structures.

---

## 3. EXPENSES (`/expenses`, controller: `expenses.controller.ts`, service: `expenses.service.ts`)

UI = `expenses-console.tsx` at `/expenses` with tabs Claims / Approvals / Receipts / Reimbursement, all backed by `ExpensesTable` (`live-tables.tsx:332-458`) + `ExpenseClaimPanel` (`action-panels.tsx:143-264`).

### 3.1 Claims

| Endpoint | Method/Path | Permission |
|---|---|---|
| List | GET `/expenses` | `expenses.read` |
| Create | POST `/expenses` | `expenses.create` |

- **CRITICAL:** `create` sets `status: ApprovalStatus.APPROVED` immediately (`expenses.service.ts:41`) — every new claim **skips the entire manager→HR approval chain** and is instantly eligible for payroll payout (1.1 sweeps APPROVED claims into the month's payslip and marks them PAID). The whole approvals machinery below is therefore **dormant in practice**: no claim is ever PENDING unless created by seed/API with a different status.
- Hard validation: claim amount vs `employee.grade.maxExpenseLimit` → 400 with message (`expenses.service.ts:26-32`). The claim panel mirrors this with a **soft client-side warning** fetched from `/employees/:id` grade (`action-panels.tsx:158-195`).
- **List is not self-scoped** — any holder of `expenses.read` sees the entire company's claims (contrast with payroll's employee scoping). No pagination, no server-side filters; search/month/status filtering is client-side only.
- **UI:** "New Claim" panel — employee select, category select, amount, claim date, receipt URL (plain URL input; **no file upload** for receipts anywhere in expenses), submit.

### 3.2 Categories

- **No category entity/endpoints exist.** `category` is a free string in the DTO (`expense.dto.ts:7-8`); the UI hardcodes 5 options: Travel, Meals, Fuel, Client Visit, Office Supplies (`action-panels.tsx:235-242`). The "Expense Categories" card in `ExpensePayoutWorkspace` (Travel/Food/Office/Medical with policy notes) is **pure static decoration** (`reference-workspaces.tsx:336-338`) and doesn't even match the claim form's option list.

### 3.3 Approvals (two-stage) & rejection

| Endpoint | Method/Path | Permission | Valid from-status |
|---|---|---|---|
| Manager approve | PATCH `/expenses/:id/manager-approve` | `expenses.approve` | PENDING → **HOLD** |
| HR approve | PATCH `/expenses/:id/hr-approve` | `expenses.approve` | PENDING or HOLD → APPROVED |
| Reject | PATCH `/expenses/:id/reject` | `expenses.approve` | anything except PAID/REJECTED → REJECTED |

- Status `HOLD` is overloaded to mean "manager-approved, awaiting HR". `decidedBy` free-text from the client (UI sends current user's email/sub, `live-tables.tsx:361`); both approver fields stored (`managerApprovedBy`, `hrApprovedBy`). All transitions audit-logged with old/new JSON.
- Same `expenses.approve` permission gates both stages — there is **no enforcement that manager ≠ HR** or that the approver manages that employee.
- **UI:** "Approvals" tab shows PENDING ("Approve (Manager)") and HOLD ("Approve (HR)") rows + Reject — but because of the auto-APPROVE quirk (3.1) this tab is **almost always empty**. The header stat "Pending Claims" counts PENDING+HOLD.

### 3.4 Payout / reimbursement

| Endpoint | Method/Path | Permission |
|---|---|---|
| Reimburse | PATCH `/expenses/:id/reimburse` | `expenses.update` | APPROVED → PAID, sets `reimbursedAt` |

- **Two competing payout paths:** (a) manual Reimburse button ("Reimbursement" tab, APPROVED rows), and (b) payroll `calculate`/`lock` auto-marks the month's APPROVED claims PAID **and adds them to the payslip's gross** (1.1). If HR reimburses manually first, the claim is PAID before the run and excluded from payroll — by accident this prevents double-pay, but the intended ordering is nowhere enforced or documented.
- **UI:** "Receipts" tab = claims that have a receiptUrl (link out only); "Export" header action builds a CSV **client-side** from GET `/expenses` (no API export); `ExpensePayoutWorkspace` (workflow steps / categories / payout-status cards) is entirely static.

---

## 4. Cross-cutting facts for the redesign

1. **Permission verbs in play:** `payroll.read|create|update|approve|configure`, `compliance.read|export`, `expenses.read|create|update|approve`. The web client pre-gates GETs via `apps/web/lib/permission-map.json` + `apiFetch` (skips requests the JWT can't pass, `client-api.ts:36-41`).
2. **Run-state model the UI assumes (DRAFT→PENDING→APPROVED) does not exist server-side** — calculate jumps DRAFT→APPROVED+locked. Any redesigned run screen must either fix the service or drop the Lock step and the Corrections create-form.
3. **Self-scoping is inconsistent:** payroll lists scope employees to own rows via the `payroll.approve` heuristic; expenses and additional-salary/gratuity lists do not (additional-salary & gratuity lists simply require approve-level permission; expenses list shows everything to everyone with read).
4. **Auto-approve-on-create pattern** appears three times: expense claims (3.1), benefit applications (1.13), tax declarations (1.11) — none of these have a review queue despite the UI implying one.
5. **Single-screen consoles**: everything is client-rendered from full unpaginated lists; no server pagination, sorting, or filtering anywhere in these three modules.
6. **Known-broken UI to not carry over:** Form 16 fetch path (1.15), IT-proof file upload (1.12), Lock Payroll button (1.1), Corrections create form (1.6), fake payslip-breakdown percentages (1.2), PT/TDS/Form16 export buttons (2.2), dead `handleAutoCalculate` (1.3), `(totalGross/12000)L` stat (1.1).
