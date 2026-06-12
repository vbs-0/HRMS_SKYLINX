# 07 · Blueprint — Payroll, Tax, Form 16 & Compliance (India-first)

Screens: `/pay/payroll`, `/pay/structures`, `/pay/me`, `/pay/expenses`, `/pay/loans`, `/pay/insurance`, `/pay/compliance`. API: `payroll`, `expenses`, `compliance`, `insurance`, `travel` (advances). The deepest blueprint — money screens get maximum rigor: tabular numerals, formula traces, locks, audit everywhere.

---

## 1. `/pay/structures` — Components, templates, assignments

### Tab: Components (`payroll.configure`)
DataTable: code (mono), name, kind (Earning/Deduction/Employer cost), calc (Fixed/% of/Formula), taxable?, PF-wage?, ESI-wage?, PT-wage?, prorate?, arrears-eligible?, visible-on-payslip?, status. Editor drawer: FormulaInput with component-token autocomplete + live test against sample employee; rounding rule; statutory flags grid (the existing config-metadata layer); display order. Guard: editing a component used in published runs → versioned ("applies from next run"), never retroactive silently.

### Tab: Templates
Structure templates (e.g., "Standard 2026 · Grade M2"): ordered component list with rules (Basic = 40% CTC, HRA = 50% Basic metro…), employer costs (PF employer, gratuity provision), validation panel (sum checks vs CTC, minimum-wage floor per state ochre warning). **CtcCalculator** preview: input CTC → full monthly/annual SalaryBreakupTable + in-hand estimate (after PF/PT/TDS estimate per regime).

### Tab: Assignments
Person × template + CTC + effective date (the existing assign flow, polished): bulk assign by grade/dept; pending-effective chips; assignment history per person.

### Tab: Revisions
Revision wizard (also entry from 360): person/set → new CTC or per-component edits → DiffView old/new → effective date (backdate → **arrears auto-computed** preview rows) → approval workflow → letters. Revision register table.

## 2. `/pay/payroll` — Runs

**List:** period cards (serif month title, status chip Draft/In review/Locked/Published/Paid, gross/net totals mono, employees count, anomaly count chip) + `Start payroll run` primary (gated: one active run per period/entity).

### `/pay/payroll/run/[id]` — the Run Room (Stepper across top)

**Gate 0 — Readiness checklist** (auto-checks, each row links to fix): attendance cycle closed ✓ · pending regularizations (n → Inbox) · pending leave affecting period (n) · anomaly penalties posted ✓ · new joiners structure assigned (n missing → Assignments) · exits in period F&F-flagged ✓ · proof-verification cutoff passed (Jan–Mar runs) ✓ · loan EMIs scheduled ✓. "Proceed anyway" requires `payroll.approve` + reason.

**Step 1 — Inputs:** LOP days table (from attendance, editable w/ audit), additional salary items (bonus, incentives, retention payout, one-time deductions — bulk paste/import), reimbursement payouts pulled from approved claims marked pay-via-payroll, salary withholding flags (existing withholding feature: person + reason + release run), off-cycle items.

**Step 2 — Preview & validate:** virtualized register (person rows: gross, each visible component column-pickable, deductions PF/ESI/PT/TDS, LOP impact, net) — every figure clickable → **formula trace popover** (component tree with values & rule citations). Variance lens: vs last month per person (Δ chips, brick >±20% auto-flag list); validation panel: negative-net (brick, block), missing bank (brick), PAN missing w/ TDS (ochre→20% flag rule), ESI crossed threshold mid-year note. Exceptions tab collects all flags; each resolvable inline or excusable w/ reason.

**Step 3 — Review & lock:** summary cards (headcount paid, gross, deductions by family, employer cost, net payout ₹ in serif num-xl + words), approver flow (workflow per doc 10), **Lock** (typed confirm; freezes inputs; unlock = `payroll.configure` + reason, audit).

**Step 4 — Publish & pay:** publish payslips (all/dept-staggered; notification toggle), **bank disbursement file** export (existing feature: format pick per bank template, account debit pick, file preview first 5 rows, checksum totals row, download + mark-as-paid date), payment status tracking (paid/failed rows re-export delta file), GL/journal export (CSV mapping per cost center), register exports (full, PF, ESI, PT, TDS sections).

**Off-cycle runs:** same room, reduced gates, reason-typed (F&F, bonus, correction); linked back to person/exit.

## 3. `/pay/me` — My Pay & Tax (ESS center)

- **Payslips:** list by FY (month, gross, net, Paid chip) → PayslipDocument view (web twin of PDF: letterhead, earnings/deductions tables, YTD column, employer contributions info box, net in words) + Download PDF (password = PAN@DDMM rule note if enabled).
- **My CTC:** current structure breakdown, revision history timeline.
- **Tax center:**
  - **Regime card:** current regime chip + **TaxRegimeCompare** (side-by-side annual computation old vs new with my declarations applied; "You save ₹12,400 in New" sage line); switch action inside declaration window only (window chip shows open/close dates — existing windows feature).
  - **Declarations (Form 12BB journey):** sections 80C (instrument rows + amounts, cap meter ₹1.5L), 80D (self/parents, senior toggles), HRA (rent, landlord PAN if >₹1L/yr, monthly table), home loan 24(b), 80CCD(1B) NPS, LTA, other; per-section save; window-state banner (Open until 31 Jan / Locked); projected monthly TDS recalculates live in side panel ("declaring this lowers June TDS to ₹4,120").
  - **Proof submission** (Jan window): per declaration row → upload proofs (FileUpload), status chips Pending/Verified/Rejected(reason → re-upload); shortfall auto-adjusts Q4 TDS with explainer.
  - **Form 16 downloads:** Form16Card per FY (Part A + Part B merged PDF, signed badge, generated date); previous employer Form 12B intake form (mid-year joiners: prior income + TDS fields → merges into projection).
- **Loans & advances:** my loans (principal, EMI, remaining schedule table), apply for advance/loan (policy caps shown) → approval → disbursal via payroll; early-closure request.
- **Reimbursement claims** shortcut → `/pay/expenses` (my view).

## 4. `/pay/expenses` — Claims & payout (existing grade-cap engine, full UX)

- **Me:** New claim (multi-line: category, date, amount, merchant, receipt per line; mileage type auto-computes km × rate; per-category & grade cap meter inline — exceeds → ochre "needs HR approval" or brick block per policy; advance adjustment picker if travel advance open) → submit → ApprovalTrail. My claims table (status, paid-via chip: Payroll June / Bank transfer).
- **Approver:** Inbox detail shows policy verdicts, receipts gallery (zoom, rotate), category spend YTD context; partial-approve line items w/ reason.
- **Finance/HR:** payout queue (approved claims → batch: add to payroll run OR direct bank file), category admin (categories, limits per grade matrix, receipt-required threshold, mileage rates), claim aging report.

## 5. `/pay/loans` (HR ops view)
Products (name, max ×salary or amount, interest %, max tenure, eligibility grade/tenure), requests queue, active loans book (outstanding, EMI, skip/holiday handling on LOP-heavy months per rule), closure on exit hook (auto-recovery line in F&F), ledger export.

## 6. `/pay/insurance` — Policies & claims (existing module, polished)
Org policies (insurer, policy no., period, premium split employer/employee chip, covered grade map) · enrollments (employee + dependents from family data; missing-data nudge) · ESS card view (InsuranceCard: sum insured, validity, TPA contact, e-card download, covered members) · claims tracker (intimation → docs → TPA → settled timeline per claim) · benefit items admin.

## 7. `/pay/compliance` — Statutory workbenches (HR/Finance)

Layout: left rail of statutes (PF · ESI · PT · LWF · TDS · **Form 16** · Challans & filings · Registers), content per pick. Every workbench: period selector, computed table, validation flags, export in filing format, ChallanCard tracker (due date, amount, paid date+ref, status chips; overdue brick).

- **PF:** monthly ECR preview (UAN, wages, EE 12%, ER split 3.67/8.33 EPS w/ caps) → ECR text file export; missing-UAN exception list; arrear ECR support.
- **ESI:** eligibility monitor (gross ≤ threshold; crossed-mid-period contributions-till-period-end rule surfaced), monthly return export, IP missing list.
- **PT:** state-wise slab tables (editable masters w/ effective dates), monthly/annual per state registration, return exports.
- **LWF:** state applicability + periodicity, deduction preview, payment tracker.
- **TDS (24Q backbone):** monthly TDS computed vs deposited reconciliation, **challan entries** (CIN, BSR, date, amount → map to deductees), quarterly **24Q pack**: Annexure I/II preview tables, validation (PAN invalid list, short-deduction flags), export for FVU preparation; Form 26Q note for contractor payments (future flag).

### 8. Form 16 Center (inside compliance; the full journey)
1. **Eligibility table:** FY pick → all employees with TDS/salary in FY incl. mid-year exits & alumni (token-portal note), PAN status column (invalid = brick, blocks).
2. **Part A:** import TRACES zip (bulk upload → auto-pair by PAN/emp code, unpaired queue with manual match UI) — pairs with doc 05 §9 bulk import.
3. **Part B:** generate from payroll ledger (salary 17(1)/(2)/(3), exemptions sec 10, deductions chapter VI-A from VERIFIED proofs only, regime-aware), per-employee preview (PayslipDocument-style statutory layout), recompute-on-demand with change log.
4. **Sign:** signatory pick (from company profile), DSC/eSign integration slot (file-based PKCS#7 upload supported v1; "signed externally" mark w/ evidence), bulk sign progress bar.
5. **Publish:** merged Part A+B PDFs → employee Documents + `/pay/me` Form16Card + email notify (staggered send); alumni get tokened download links (expiring, audit-logged).
6. **Tracker:** per-employee status pipeline (Eligible → Part A paired → Part B ready → Signed → Published → Downloaded ✓), exception saved-views, deadline banner (15 Jun) with countdown.

- **Registers:** payroll register, PF/ESI/PT registers, S&E formats per state — print-disciplined exports (doc 01 §10).
- **Compliance calendar** feeds Home cards + `/calendar` (ochre milestones) — due-date rules per statute editable (`compliance.configure`).

---

### Money-screen rules (binding, from doc 01)
Tabular numerals everywhere; ₹ right-aligned 2dp Indian grouping; negatives `(1,200.00)` brick in registers; every computed figure offers formula trace; every export stamped (generated-by, timestamp, filter hash) in file footer; locked periods render padlock chip and block edits at API + UI; all overrides require reason → AuditEventRow.

### Permission gates
`payroll.read|create|update|approve|configure|export` split: run room visible read; Lock needs approve; components/templates need configure; bank file & registers need export. ESS sees only `/pay/me` (self scope). Compliance: `compliance.read|export` (+configure for masters). Salary visibility: managers see NO pay data by default (explicit grant only) — enforced in 360 Pay tab + reports.
