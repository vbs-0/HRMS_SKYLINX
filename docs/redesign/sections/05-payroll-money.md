# §05 — Money: Payroll, Tax, Form 16, Compliance, Expenses

> Inventory: `inventory/money.md`. Primitives: §02 (MoneyInput, SalaryBreakupTable, PayslipDocument, FormulaInput, formula-trace Popover). Settings keys: `inventory/rbac-settings.md` Part B (`payroll.*`, `taxCalc.*`, `salaryStructure.*`, `declarations.*`, `bankExport.*`). Reference tax-declaration form: `blueprint.md` §5.2. Kredily parity: `blueprint.md` §2 (P1 items live here).
> Permissions: `payroll.{read,create,update,approve,configure,export}`, `compliance.{read,export}`, `expenses.{read,create,update,approve}`. **Self-scoping**: payroll lists scope to own rows when JWT lacks `payroll.approve` (money.md §0); employees see only `/pay/me`.
> **Money rules (binding, §02 §2/§3.3):** tabular numerals, ₹ Indian grouping, negatives in danger+parens, every figure → formula-trace popover, every mutation → audit note, locked periods read-only.
> **Correctness fixes owned here (money.md):** calculate jumps DRAFT→APPROVED+locked (Lock button, Corrections create, PENDING all dead — §1.1/1.6); fabricated payslip breakdown (§1.2); Form 16 broken route (§1.15); IT-proof upload broken URL+token (§1.12); PT/TDS/Form16 exports emit empty files (§2.2); component configs have zero runtime effect (§1.5); template formula regex only `CTC*n` (§1.4); auto-approve-on-create for expenses/benefits/declarations (§3.1/1.13/1.11); compliance double-counts structures (§2.1); dead `handleAutoCalculate`, `(totalGross/12000)L` stat (§1.1/1.3).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. PAYROLL COMMAND CENTER — `/payroll`
**Title** "Payroll" · **Roles** `payroll.read` (self-scoped), ops need `payroll.create/update/approve/configure/export`. **Plan** Standard.
Replaces the 14-tab console (money.md §1) with: **Runs** (list→run room), **Structures**, **Components**, **Tax**, **Compliance** (→ §C), plus ESS **My Pay** (→ §B). Month navigator in header.

## A1. Runs list — `/payroll`
DataTable of `PayrollRun`: period (month/year), StatusPill (Draft/In-review/Locked/Published/Paid), gross/net totals (MoneyText), employee count, anomaly count. Primary **Start payroll run** `payroll.create` (one active run per period/entity). 
- **Fix stats**: replace hardcoded "Audit State: Verified" and the wrong `(totalGross/12000)L` lakh math (money.md §1.1).
- API EXISTS `GET /payroll/runs`, `POST /payroll/runs` (**fix**: upsert silently returns old run for an existing month — surface "run exists" instead, money.md §1.1).

## A2. Run Room — `/payroll/run/[id]` (NEW route; Stepper) — **the core fix** (money.md §1.1)
**Rework the lifecycle so it's a real multi-step gate**, not a one-shot calculate that instantly locks:
**Step 0 Readiness checklist** (auto-checks, each links to fix): attendance cycle closed · pending regularizations (n → §04) · pending leave in period · anomaly penalties posted · joiners missing structure (n → A3) · exits F&F-flagged · proof-verification cutoff passed (Jan–Mar) · loan EMIs scheduled. "Proceed anyway" needs `payroll.approve` + reason.
**Step 1 Inputs**: LOP days table (from PenaltyLog CONVERTED_LOP, editable w/ audit), additional salary (bonus/incentive/one-time — bulk paste), reimbursement payouts (approved claims marked pay-via-payroll), salary-withholding flags, off-cycle items.
**Step 2 Preview & validate**: virtualized register (person rows: gross, component columns, PF/ESI/PT/TDS, LOP, net) — **every figure → formula-trace popover** (component tree + rule citation; this also serves as manual verification, money.md §1.2). Variance lens vs last month (Δ chips, danger >±20%). Validation panel: negative-net (block), missing bank (block), PAN-missing-with-TDS (warn→20% rule), ESI mid-year crossing. Exceptions tab; resolve inline or excuse w/ reason.
**Step 3 Review & lock**: summary cards (headcount, gross, deductions by family, employer cost, net in MoneyText + words); approver flow (§10 workflow); **Lock** (typed confirm; freezes inputs). Unlock = `payroll.configure` + reason + audit.
**Step 4 Publish & pay**: publish payslips (all / dept-staggered; notification toggle — **NEW** email dispatch, Kredily P3 blueprint §2); bank file (→ A6); payment status tracking (paid/failed → re-export delta); GL/journal export (**NEW** Tally JV, blueprint §4); register exports (full/PF/ESI/PT/TDS).
- **API** EXISTS `POST /runs/:id/calculate` (**rework**: stop setting APPROVED+lockedAt at end so it's re-runnable until Lock, money.md §1.1), `POST /runs/:id/lock` (wire as Step 3 — today always 400s after calculate). Off-cycle runs (F&F/bonus/correction): same room, reduced gates, reason-typed.
- **States**: per-step skeleton; exceptions empty = green "Ready to lock".

## A3. Salary Structures — `/payroll/structures`
**Roles** `payroll.read` (self-scoped), `payroll.configure`.
- **Per-employee structures**: DataTable (employee, effectiveFrom, annual CTC/Basic/HRA/Allowances/PF/ESI/PT/TDS — all **annual**). "Configure CTC" modal (MoneyInput fields). **Fix**: "Modify" POSTs a new row without deactivating the old → multiple ACTIVE accumulate (money.md §1.3) → **NEW** `PATCH/DELETE /payroll/salary-structures/:id` + single-ACTIVE invariant. Remove dead `handleAutoCalculate` (money.md §1.3). EXISTS `GET/POST /payroll/salary-structures`.
- **Templates** (formula-based, Kredily Task 1, blueprint §2): cards w/ component formulas + **Assign** (multi-select employees, effective date, pass/fail result). **NEW UI for create/edit/delete** (today API-only, money.md §1.4) using **FormulaInput** (live test). **Fix**: assign formula regex only matches `CTC * n` → broaden evaluator; employer PF never populated (always 0) → fix mapping. EXISTS `GET /payroll/templates`, `POST/PATCH/DELETE` (API-only), `POST /payroll/templates/:id/assign`.
- **CtcCalculator** preview (input CTC → monthly/annual SalaryBreakupTable + in-hand estimate using `salaryStructure.basicPct`/`hraPct`/`defaultTdsPct`, rbac-settings B1). **Revisions**: revision wizard (new CTC/per-component → DiffView → effective date → backdate arrears preview → approval → letter). 

## A4. Component Configs — `/payroll/components`
**Roles** `payroll.configure`. Full CRUD (category BASE/RECURRING/VARIABLE/ADHOC, kind ALLOWANCE/REIMBURSEMENT/DEDUCTION, flags taxable/annualLimit/individualOverride/proofRequired/esiApplicable/includedInCtc/enabled). EXISTS `GET/POST/PATCH/DELETE /payroll/component-configs` (+ **add Delete button**, money.md §1.5). **MAJOR FIX (Kredily Screen 3, blueprint §2)**: catalog has **zero runtime effect** today — `calculate()` must actually consume `taxable`/`annualLimit`/`esiApplicable`/`includedInCtc`/`proofRequired` (money.md §1.5). Without this the screen is decorative.

## A5. Gratuity / Retention / Withholding / Corrections / Additional Salary — `/payroll` (Adjustments tabs)
**Roles** create `payroll.create`, decide/list `payroll.approve`, withholding release `payroll.update`.
- **Gratuity**: pick employee → **Compute preview** (wire EXISTS `GET /payroll/gratuity/:employeeId/calculate` — today API-only, money.md §1.9) → create → settlements ledger w/ Approve/Reject. Formula `monthlyBasic×multiplier×completedYears` from `GratuityRule` (default 5y, 15/26). **NEW**: gratuity-rule CRUD UI (today seed-only); **NEW**: pay decided gratuity through payroll (today record-only). EXISTS `GET/POST /payroll/gratuity`, `PATCH …/:id/decide`.
- **Retention bonus**: create + decide (approve → AdditionalSalary ADDITION). EXISTS `POST/GET /payroll/retention-bonuses`, `PATCH …/:id/decide`.
- **Salary withholding**: create (from/to/reason) + **Release** (→ auto ARREAR corrections next run). EXISTS `POST/GET /payroll/withholdings`, `POST …/:id/release` (**fix**: release-arrear blocked if any manual arrear exists, money.md §1.8).
- **Corrections**: ledger w/ Approve/Reject. **CRITICAL FIX** (money.md §1.6): create always 400s because every run is instantly locked → depends on A2 lifecycle rework (allow corrections against published-but-correctable runs). Types ARREAR/BONUS_ADJUSTMENT/DEDUCTION_REVERSAL. EXISTS `GET/POST/PATCH /payroll/corrections`.
- **Additional salary**: ADDITION/DEDUCTION ledger (immediate, no approval). EXISTS `POST/GET /payroll/additional-salary`. **NEW**: edit/delete (today permanent).

## A6. Bank Disbursement — `/payroll/run/[id]` Step 4 (or tab)
**Roles** `payroll.approve`. Preview table (name/code/net/bank/IFSC) + pre-flight **skipped list** (missing/unverified bank → "excluded, Download anyway?" modal) → download CSV. EXISTS `GET /payroll/runs/:id/bank-file`, `GET …/bank-file/skipped`. **Fix/NEW (Kredily P3, blueprint §2)**: per-bank formats (ICICI/HDFC) + maker-checker (today generic CSV only); columns use `bankExport.format/includeHeader/narrationPrefix` (rbac-settings B1 — **expose these keys**, today API-only). Export audit-logged (EXISTS).

---

# B. MY PAY & TAX (ESS) — `/payroll/me`
**Roles** `payroll.read` (self-scoped). **Plan** Standard.
- **Payslips**: list by FY (month, gross, net, Paid chip) → **PayslipDocument** (web twin of PDF: letterhead, earnings/deductions, YTD, employer contributions, net in words) + Download PDF. **FIX**: never invent breakdown — if a payslip has no components, show "Breakdown unavailable" not the fabricated 50/20/30 split (money.md §1.2). **NEW** payslip PDF endpoint + per-payslip GET (today refetches whole run, money.md §1.2). EXISTS `GET /payroll/runs/:id/payslips`.
- **My CTC**: SalaryBreakupTable + revision timeline.
- **Tax center**:
  - **Regime card** + **TaxRegimeCompare** (old vs new annual w/ declarations applied). Switch inside window only (window chip).
  - **Declarations (Form 12BB journey, reference §5.2)**: Old/New switch; 80C rows (PPF/ELSS/Life/Tuition/Home-loan-principal, cap ₹1.5L from `taxCalc.section80CCap`) each with proof paperclip; 80D (self ≤₹25k / senior parents ≤₹50k, `section80DCap`); HRA (rent + Landlord PAN regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` + receipts); 24(b) (≤₹2L, `section24bCap`). Live projected-TDS side panel. **Window enforcement** from `declarations.*` (windowEnabled/monthlyFromDay/ToDay/fyCutoffMonth/Day) — **FIX the key mismatch** (UI writes `currentFiscalYearStart`/`fiscalYearDeadline`; payroll reads `fyCutoff*`, money.md §1.11 / rbac-settings B1). EXISTS `POST /payroll/tax-declarations`, `GET …/:employeeId` (**fix**: enforce self-scope on submit — controller comment claims it but doesn't, money.md §1.11; stop one-record-per-employee overwriting prior FY → **NEW** key by employee+FY).
  - **Proof submission**: per-row upload → status Pending/Verified/Rejected(reason→re-upload). **FIX broken upload** (money.md §1.12): use API base (not relative URL) + correct token key `peopleos_access_token` (not `auth_token`); send real employeeId. Section casing: `Other` vs `other` matcher (fix). HR review queue (Approve/Reject + remarks) → recompute (**fix destructive overwrite** of declared value, money.md §1.12). EXISTS `POST /payroll/tax-proofs[/upload]`, `GET`, `PATCH …/:id/decide`. **Consolidate the two competing proof UIs** (ComplianceDash vs payroll tab) into one.
  - **Form 16**: Form16Card per FY (Part A+B, download). **FIX broken route** (money.md §1.15): UI calls `GET /payroll/form16/:employeeId`, API is `GET /payroll/:employeeId/form16` — align (also in permission-map). **Fix**: regime/exemptions ignored (hardcoded NEW) → honor declaration; TDS component-type match. EXISTS `GET /payroll/:employeeId/form16`. **NEW (statutory artifacts, blueprint §4)**: TRACES Part A pairing, signed PDF, bulk publish, Form 12BA.
- **Loans & advances**: my loans + apply. **FIX** (core-hr §1.16): loans list/decide routes don't exist → **NEW** `GET /employees/loans/list`, `PATCH /employees/loans/:id/decide`; EMI auto-recovery already flows in calculate (money.md §1.1). **Salary-advance self-service** = market gap (blueprint §4).
- **Benefits (FBP)**: claim flow EXISTS `POST /payroll/benefits/claim`, list/decide; **NEW UI** for applications/limits (today API-only) + **enforce annualMax** (today unenforced, money.md §1.13); fix "paid" vs "approved" (post-payout no-op).

---

# C. COMPLIANCE — `/compliance` + Tax Slabs
**Roles** `compliance.read`, `compliance.export`; tax slabs `payroll.configure`. **Plan** Pro.
- **Compliance summary**: 4 metric cards + readiness checks + employee register. **FIX** (money.md §2.1): `configuredEmployees` counts ALL structures (no ACTIVE filter, no de-dup) → inflated; totals use annual columns mislabeled monthly — relabel/fix. EXISTS `GET /compliance`.
- **Statutory workbenches** (left rail PF · ESI · PT · TDS · LWF · Form 16 · Challans · Registers). Each: period selector, computed table, validation flags, export in filing format, **ChallanCard** tracker (due date, amount, paid date+ref, StatusPill; overdue danger). EXISTS `POST /compliance/export/:type`. **FIX (money.md §2.2)**: only `pf` (ECR) and `esi` are implemented; **`pt`, `tds`, `form16` emit empty files but log GENERATED** → either implement or disable the buttons. Exports use annual structures not run data → **NEW**: derive from payroll-run/payslip data (challan-grade). **NEW statutory file formats (blueprint §4)**: PF ECR (exists, refine), Form 24Q/FVU, PT/LWF challans, Form 12BA.
- **Compliance calendar**: due-date lanes (PF/ESI/PT/TDS) feeding §09 + Home; "Add filing obligation". **NEW** `compliance.configure` due-date rules.
- **Tax Slabs** — `/payroll` (Tax Slabs tab): per-regime (NEW/OLD) slab table (from/to/rate). EXISTS `GET/POST /payroll/tax-slabs`, **add Delete UI** (today API-only, money.md §1.10). Verify multi-tenant intent (slabs currently global). `taxCalc.*` caps (standardDeductionNew/Old, 80C/80D/24b, cess, surcharge, surchargeThreshold) — **expose these API-only keys** (rbac-settings B1); rebate thresholds currently hardcoded (NEW≤7L/OLD≤5L) → move to settings.

---

# D. EXPENSES — `/expenses`
**Title** "Expenses" · **Roles** `expenses.read` (**fix**: not self-scoped — everyone sees all, money.md §3.1 → **NEW** self-scope for employees), `expenses.create`, `expenses.approve`, `expenses.update` (reimburse). **Plan** Standard.
- **My claims (ESS)**: New Claim (reference §5.2 drawer 450px): Category (Business Travel/Food & Meals/Lodging/Telephone & Internet/Medical/IT Hardware/Others — **NEW**: formalize categories, today free strings + mismatched static lists, money.md §3.2), Amount (MoneyInput, 2dp), Currency (INR/USD/EUR), Cost Center, Claim Date (≤today), Description (≤300), **Receipt dropzone** (.pdf/.jpg/.png ≤5MB — **NEW** real upload; today URL text input, money.md §3.1). Grade-cap meter inline (warn/block vs `grade.maxExpenseLimit`). 
- **CRITICAL FIX** (money.md §3.1): `create` sets APPROVED immediately → skips approval chain → **NEW**: create as PENDING so the two-stage flow works.
- **Approvals**: Manager-approve (PENDING→HOLD), HR-approve (→APPROVED), Reject. EXISTS `PATCH /expenses/:id/manager-approve|hr-approve|reject`. **NEW**: enforce manager≠HR and approver-manages-employee (today same perm, no checks, money.md §3.3).
- **Payout**: Reimburse (APPROVED→PAID) EXISTS `PATCH /expenses/:id/reimburse`, OR auto via payroll run (money.md §1.1) — **document/enforce ordering** to avoid double path (§3.4). Category admin (limits per grade matrix, receipt-required threshold, mileage) — **NEW**. Server export — **NEW** (today client CSV).
- EXISTS `GET/POST /expenses`. **States**: Approvals tab empty today (auto-approve) — will populate after fix.

---

## E. Cross-cutting (this section)
- Self-scoping made consistent (payroll heuristic vs expenses/gratuity/additional-salary, money.md §0/§3.3): employees see only own across all money screens.
- Locked period → padlock chip, read-only at API + UI; all overrides reason+audit.
- Every export stamped (user, timestamp, filter hash) in file footer.
- Managers see **no** salary data by default (no grant) — enforce in §03 Pay tab + reports.
- Mobile: payslip viewer + download; expense camera capture (reference §5.3); run room desktop-first (HR).
- **Backend backlog**: rework run lifecycle (don't auto-lock on calculate); component-config runtime effect; Form 16 route + TRACES; proof upload fix; PT/TDS/Form16 real exports from run data; per-bank file formats + maker-checker; expense PENDING-on-create + categories + receipt upload + self-scope; gratuity-rule CRUD + payout; loans list/decide routes; declarations key fix + per-FY records; benefit annualMax enforcement; payslip PDF/GET endpoints; expose taxCalc/bankExport/salaryStructure settings keys.
