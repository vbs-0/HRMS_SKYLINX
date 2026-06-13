# Blueprint Inventory — Kredily Reference Screens, Parity Status, Market Gaps & Binding Design Specs

> Generated 2026-06-13 from `docs/analysis/KREDILY_PARITY_AUDIT.md`, `docs/reference-recording-map.md`, `docs/reference_blueprint/ui_ux_window_structures.md`, `docs/reference_blueprint/module_implementation_status.md`, `docs/reference_blueprint/project_roadmap_and_mobile_spec.md`, `docs/submission/08_COMPETITOR_PARITY_RESEARCH.md`.
> Purpose: give §01–§12 (a) the **reference screen catalog** Kredily set the bar with, (b) our **parity status** per area, (c) the **market gaps** worth closing, and (d) the **binding reference dimensions / form-field registries / dropdown option lists / gestures** every section spec must reuse for field completeness.
> **Tension resolved:** the reference doc says "preserve the existing shell"; the master plan §1/§4 says "visually distinct from Kredily — hard commercial requirement." Reconciliation: **keep the proven IA + feature parity, adopt a NEW visual identity (§02).** Reference layouts below are used for *field/validation/flow completeness*, never to copy Kredily's look.

---

## 1. Kredily reference screen catalog (the 21 screens)
Source: the screen recording (`reference-recording-map.md`, 8 flows) expanded with the numbered parity tasks cited in commit history (Screen 3 component config, Screens 4/9 F&F + declaration windows, Screen 17 anomaly→LOP, Task 1 salary templates) and the parity audit. Status: **✓ parity** · **◐ partial** · **✗ gap** (per KREDILY_PARITY_AUDIT + the domain inventories). "Redesign §" points at the section spec that owns it.

| # | Kredily reference screen | Our module / state | Parity | Redesign § |
|---|---|---|---|---|
| 1 | **Dashboard** — left module menu, dark top bar (search/date/bell/avatar), company card, task notifications, quick module tiles, announcements, upgrade/referral panels | `/dashboard` (LiveMetrics + DashboardWidgets + quick grid); panels identical per role (platform.md §7) | ◐ | §01, §09 |
| 2 | **Employee profile / company setup** — profile cards, personal/contact/official blocks, setup forms | `/employees` console + drawer (core-hr.md §1); edit drops fields | ◐ | §03 |
| 3 | **Attendance dashboard** — punch widget, today summary | `/attendance` Dashboard tab; 2 overlapping punch widgets, fake rules card (time.md §1-2) | ◐ | §04 |
| 4 | **Attendance logs** — daily log list, filters | AttendanceTable (time.md §2); no server filter/pagination | ◐ | §04 |
| 5 | **Shift / rule controls** — shift defs, grace, roster | RosterConsole (read-only shifts; **no shift CRUD**, time.md §3) | ◐ | §04 |
| 6 | **Regularization & exceptions** | API works; **UI Approve 404s, no Reject, no create UI** (time.md §5) | ◐ | §04 |
| 7 | **Anomaly / penalty (auto-docking)** [Screen 17] | Full anomaly→LOP engine API-only, **zero UI** (time.md §9) | ✗→built API | §04 |
| 8 | **Leave dashboard** — quota cards | leave-console employee view; fake static balances workspace (time.md §4) | ◐ | §04 |
| 9 | **Leave requests + approve/reject** | works; half-day ignored server-side; no self-scope (time.md §4) | ◐ | §04 |
| 10 | **Leave balance & leave rules** | LeaveSettingsConsole; advanced rules **stored but not enforced** (time.md §1) | ◐ | §04 |
| 11 | **Payroll dashboard** — run list, status | payroll-console Run tab; Lock button dead (money.md §1.1) | ◐ | §05 |
| 12 | **Payroll run workflow** [Task 1: salary structure templates] | run lifecycle DRAFT→APPROVED+locked in one calc; templates API-only (money.md §1.1/1.4) | ◐ | §05 |
| 13 | **Salary / payslip logs** | payslip grid + breakdown; **fabricated breakdown when components empty** (money.md §1.2) | ◐ | §05 |
| 14 | **Payroll components config** [Screen 3] | component-configs CRUD UI exists but **catalog has zero runtime effect** (money.md §1.5) | ◐ | §05 |
| 15 | **Statutory & bank export** [bank export final task] | bank file ✓ (money.md §1.16); **PT/TDS/Form16 exports fake** (money.md §2.2) | ◐ | §05 |
| 16 | **IT declaration windows** [Screen 9] | window enforcement built; **UI writes wrong keys** (money.md §1.11, rbac-settings B1) | ◐ | §05 |
| 17 | **F&F / encashment** [Screen 4] | F&F + encashment built; **notice shortfall double-counts**; auto-APPROVED (core-hr.md §1.8) | ◐ | §03, §05 |
| 18 | **Insurance** — policy & claim management | insurance-console; **claims auto-APPROVED → approval UI dead** (engagement.md §7) | ◐ | §07 |
| 19 | **Rewards** — voucher/marketplace, recognition | rewards-dashboard read-only; **no redemption/balance** (talent.md §5) | ◐ | §06 |
| 20 | **ID & Visiting Card designer** — template selector, brand color, preview, print | `/cards` card-generator (implemented first pass, reference-recording-map) | ✓ | §03 |
| 21 | **Profile/company config & settings** — feature switches, statutory rates | settings-console + setup wizard (platform.md §3); ~30 rule keys API-only (rbac-settings B1) | ◐ | §08 |

## 2. Kredily parity audit — the 7 deep-compare areas (KREDILY_PARITY_AUDIT.md)
| # | Area | Kredily | Us | Gap |
|---|---|---|---|---|
| 1 | Salary structure templates | named, formula components (`Basic=CTC*0.5`), multi-type, assign flow | per-employee flat amounts + formula templates (Task 1, formula regex `CTC * n` only) | **was MISSING → partial** |
| 2 | Component metadata config | taxable/limit/override/proof/ESI/CTC flags, applied count, toggle | catalog CRUD exists, **no runtime effect** (Screen 3) | **MISSING (effect)** |
| 3 | Pay register | generate, freeze, preview, email dispatch | run+lock+preview; **no email** | **PARTIAL** |
| 4 | Anomaly / penalty | auto-penalty tracking, grace, HR review list | engine built API-only; **no UI** (Screen 17) | **MISSING (UI)** |
| 5 | F&F encashment | wizard: auto encashment, notice recovery, loan/asset blocks | built but manual inputs, double-count bug, no blockers | **PARTIAL** |
| 6 | Declaration windows | Apr-Dec proofs / Jan-Mar actuals, open/close alerts | window enforced; **key mismatch, no alerts** | **PARTIAL** |
| 7 | Bank export | configurable ICICI/HDFC formats + maker-checker | generic CSV, no per-bank format, no maker-checker | **PARTIAL** |

**Prioritized (P1→P3):** P1 = salary structures/components rules engine, declaration windows; P2 = anomaly auto-tracking UI, F&F automation; P3 = bank formats, payslip email dispatch.

## 3. Module completion baseline (module_implementation_status.md, as of reference audit)
Auth 90 · Directory 60 · Attendance 30 · Leave 50 · Payroll 20 · Expenses 60 · Recruitment 10 · Onboarding/Exit 10 · Training 10 · Travel 0 · Social/Rewards 80 · Helpdesk 80 · Settings/SaaS 90. (Many have since advanced — the domain inventories are the current truth; this is the trajectory the redesign rides.)

## 4. Market gap context (submission/08 competitor research — Kredily/Keka/Zoho/greytHR/Darwinbox/BambooHR)
- **We match/beat market on:** multi-tenant SaaS + plans/billing/branding, AES field encryption, RBAC own-record scoping, configurable PF/ESI/PT/TDS slabs + old/new regime, accrual engine, F&F auto-suggestions, interview conflict detection. The redesign must **not regress** these.
- **High-value gaps to design for (Wave 5+):** surveys/eNPS, salary-revision/increment cycles linked to appraisal, statutory e-file artifacts (PF ECR, 24Q/FVU, PT/LWF challans, Form 12BA), **team leave calendar**, IP-based attendance restriction, **custom report builder + scheduled exports**, **reminders engine** (probation/doc-expiry/birthday), **letter e-signature**, knowledge base + chatbot, disciplinary/PIP, accounting JV export (Tally), salary-advance self-service, 2FA/SSO, webhooks.
- **Mobile/hardware (deferred to Flutter phase, §11):** native apps, selfie/face punch, geofence enforcement, kiosk, biometric device sync, push, offline attendance. Backend is already mobile-ready (stateless JWT REST).

## 5. Binding reference design specs (reuse verbatim for field completeness — ui_ux_window_structures.md)
These are the reference's concrete dimensions, registries, and gestures. The §02 token layer restyles them; the **field lists, validations, and dropdown values below are mandatory completeness checks** for §03–§08 forms.

### 5.1 Grid & dimensions (informs §02 layout, restyled not copied)
- Top nav 64px · sidebar 260px desktop / 72px icon-rail tablet / 0 (overlay drawer) mobile · content max-width 1440px, padding 24/20/16 desktop/tablet/mobile · content card radius 12px, padding 20px.
- **Modals:** standard dialog 600px (full-width+16px margin mobile); large wizard (payroll run) 800px; **detail slide-over drawer** 450px / 100vw mobile, full height.
- Scrollbar: 6px thumb, radius 3px, `rgba(146,148,156,.3)`→`.6` hover. Modal backdrop `rgba(15,23,42,.7)` + `blur(8px)`.

### 5.2 Form field & dropdown registries (mandatory option lists)
- **Leave request (600px modal, 2-col):** Leave Type {Casual, Sick, Earned, Comp-Off, Maternity, Paternity, Leave Without Pay} req · From Date (≥today unless regularization) · To Date (≥From) · Half Day toggle → Half Day Period {First Half | Second Half} · Reason (≤500, counter) · Approver (searchable, active managers). *(NB: time.md §4 — server ignores half-day today; §04 must fix.)*
- **Expense claim (450px drawer):** Category {Business Travel, Food & Meals, Lodging & Hotel, Telephone & Internet, Medical, IT Hardware/Software, Others} · Amount (positive, 2dp, currency prefix) · Currency {INR default, USD, EUR} · Cost Center (searchable dept codes/projects) · Claim Date (≤today) · Description (≤300) · Receipt dropzone (.pdf/.jpg/.jpeg/.png ≤5MB, 120px). *(NB: money.md §3 — categories are free strings today; §05 should formalize.)*
- **Job vacancy (800px modal, 2-col + RTE):** Title (≤100) · Department · Location · Employment Type {Full-Time, Part-Time, Contract, Internship} · Openings (≥1) · Experience {0-1 Entry, 1-3 Junior, 3-5 Mid, 5-8 Senior, 8+ Lead} · Description (rich text).
- **Interview scheduler (600px modal):** Candidate (read-only) · Stage {Screening, Technical 1, Technical 2, Management, HR Fitment} · Interviewer (searchable multi-select) · Date&Time (future) · Mode {Online-Zoom, Online-Teams, In-Person, Telephone} · Meeting Link/Room (URL if online). *(talent.md §2.4 — conflict check ±1h exists.)*
- **Indian tax declaration (accordion):** Old/New regime switch · 80C (cap ₹1,50,000): PPF, ELSS, Life Insurance, Tuition, Home Loan Principal — each with paperclip upload · 80D: Self/Spouse/Children (≤₹25k) + Senior Parents (≤₹50k) · HRA: Monthly Rent + Landlord PAN (regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`) + receipts dropzone · 24(b) Home Loan Interest (≤₹2,00,000). *(money.md §1.11 — the §05 declaration journey.)*

### 5.3 Gestures (inform §11 mobile)
- **Drag shift assign:** dragged block `rotate(2deg)` + `scale(95%)` + opacity `.85` + shadow; target cell green dashed `#2dd36f` + pulse.
- **Swipe (mobile):** row left >70px → red Reject; right >70px → green Approve; >50% width auto-completes; <30% snaps back.

## 6. Design principles (synthesized — master plan §4 + reference + market)
1. **Distinct identity, familiar IA.** New brand hue + neutral ramp + more whitespace/lighter chrome (off `#078ced`); keep the recognizable left-menu + dark-topbar mental model so Kredily-migrating users aren't lost (§01/§02).
2. **Rules-as-data, surfaced.** Every DEFAULT_RULES key (rbac-settings Part B) gets a labeled control — the reference's biggest weakness is hidden config; ours becomes a selling point.
3. **One employee, one record, one approvals inbox** (master plan principles).
4. **Honest states.** Replace every fabricated number / fake breakdown / dead button catalogued in the inventories with real states (loading/empty/error/forbidden) — do not port the reference's (or our current) theater.
5. **Tabular money, audit on every mutation, formula traceability** (master plan §5.3).
6. **Mobile-first ESS flows** (clock-in, leave, payslip, approve, expense-camera, announcement) per §11.
7. **Accessibility AA, white-label theming, dark mode + density** (master plan §4/§6) — beyond what the reference offers.

## 7. Redesign-vs-reference deltas to honor
- Reference is single-tenant-styled; **we are multi-tenant** — every list must be tenant-safe (the inventories flag the unscoped models).
- Reference has no plan gating; **we keep plan tiers** but make locks honest (server-enforced eventually — platform.md §0.3).
- Reference's recording shows demo data; **our redesign forbids fabricated UI** (the recurring inventory sin).
- Reference numbers screens; **we organize by persona + IA group** (master plan §3), mapping each reference screen into the new nav (column "Redesign §" in §1).
