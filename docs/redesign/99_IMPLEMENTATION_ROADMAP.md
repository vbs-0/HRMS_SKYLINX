# 99 — Implementation Roadmap, Correctness Backlog, Risk Register

> Turns the spec set (9 inventories + 12 section specs + master architecture) into an executable program. Expands master plan §8. Companion to the per-section "backend backlog" footers — **consolidated here** as master §7 requires.
> **Operating model:** two lanes — **docs lane** (this redesign set, branch `2.0` docs/) and **code lane** (another agent, implementing). This file is the contract the code lane pulls from. Every backlog item has an ID (`SEC-`/`UX-`/`ENG-`/`PAR-`), a source ref, and the owning section.
> **Prime directive (master plan §8):** keep the 96-check e2e full-audit gate **green at every step**; payroll math untouched until explicitly reworked under review.

---

## 1. Phases & Definition of Done

Each phase ships behind incremental migration (rebuilt primitives + flag where risky). **Per-phase DoD (the leave-types standard):** `tsc` clean (api + web) · permission map regenerated (`scripts/generate-permission-map.js`) · e2e green · destructive-walkthrough verified · axe serious/critical = 0 on touched pages.

### P0 — Foundation (no behavior change; audit stays green)
- Token layer (`app/tokens.css` light/dark/compact) + tailwind preset (§02 §14); self-host fonts; theme + density + no-flash script.
- Rebuilt `components/ui/*` primitives (§02 §8) + `components/domain/*` shells; `lib/status-map.ts` (§02 §2.3); `lib/nav.ts` registry (§01 §2).
- New shell: grouped collapsible Sidebar, Topbar (breadcrumb + federated search + quick-add + bell + theme + avatar), PageHeader, CommandPalette (§01 §3/§6).
- **Gate:** legacy screens keep working on the new primitives (visual reskin only); kit has Storybook + axe.

### P1 — Money paths (highest risk → careful review; payroll math reviewed line-by-line)
- §05 Run Room lifecycle rework (`UX-01`), Structures+Templates, Components, Tax/Declarations (`UX-09`), Form 16 (`UX-02`), Proofs (`UX-03`), Bank Disbursement, Compliance workbenches (`UX-05`), Expenses (`UX-16`).
- **Gate:** parity checklist vs every current payroll screen; register exports byte-compared vs legacy; lock/unlock audit asserted in e2e; formula-trace popover doubles as manual verification.

### P2 — Self-service & approvals
- §09 role dashboards (`UX-22`), §03 Profile 360 + Directory + Add-Employee wizard (`UX-08`,`UX-11`,`UX-12`), §04 My Attendance/Leave (`UX-06`,`UX-07`,`UX-21`), §10 unified Inbox (`ENG-01`) + notifications (`ENG-11`,`ENG-12`).
- **Gate:** ESS + Manager can live entirely in v2; the role-audit e2e suites (`docs/reference_blueprint/`) pass on v2 routes.

### P3 — Talent & engagement consoles
- §06 Performance/Recruitment/Training/Travel/Rewards (`UX-15`,`UX-17`,`PERF gaps`), §07 Social/Surveys/Policies/Grievance/Helpdesk/Insurance/Assets (`UX-13`,`UX-14`,`UX-18`,`UX-19`,`UX-20`,`SEC-11`).
- **Gate:** grievance console rebuilt against real API; interviewer/committee scope tests pass; every legacy console has a v2 home.

### P4 — Platform, admin & enterprise extras
- §08 Settings tree (all DEFAULT_RULES keys), **Permissions admin** (`ENG-13` roles API+grid+scopes+field-security), Workflow engine (`ENG-01`), Users/Audit/Integrations/SaaS/Billing; §09 Company Health + Analytics + Reports builder (`UX-24`); §12 auth hardening.
- **Gate:** permission-change e2e (create role → verify nav/fields/API 403 align); audit rows asserted for every settings mutation; security items SEC-01…SEC-14 closed.

### P5 — Polish & flip
- WCAG 2.1 AA pass (§11), perf budgets, mobile bottom-tab ESS flows, print suite, microcopy/empty-state sweep, ⌘K records search. Flip flag default-on; delete legacy consoles after 2 stable weeks; legacy routes 301 permanently (§01 §5).

**Sequencing dependencies:** P0 blocks all. `UX-01` (run lifecycle) blocks `UX-02`/`UX-03`/corrections. `ENG-13` (roles/scopes) blocks the §08 permission UI + field-level masking used in §03/§05. `ENG-01` (workflow) underpins §10 ApprovalTrail. Tenant-scope fixes (`SEC-02`) should land before/with any list that reads an unscoped model.

---

## 2. Consolidated correctness & security backlog

> One ranked list merged from every section footer + the inventories' "biggest quirks." Severity: **P0** security/data-integrity · **P1** UI exists-but-broken/lies · **P2** missing capability. Source = inventory ref. Each is a code-lane work item; the redesign section is where its UX lives.

### 2.1 Security & data-integrity (P0)
| ID | Item | Source | Section |
|---|---|---|---|
| SEC-01 | TenantMiddleware trusts `x-tenant-id` header + **decodes (not verifies)** JWT → any user can target another tenant | platform §0.2/§12.1 | §08/§12 |
| SEC-02 | Prisma tenant-allowlist misses AttendanceLog, LeaveRequest, LeaveBalance/Ledger, Payslip, Expense, Notification, Company, Payment, Plan, ErrorLog, SystemLog, EmployeeDocument/BankDetail, exit/promotion/transfer/loan, SocialPost, Grievance, EmployeeInsurance/Dependent/Claim, Survey/Question/Response, Candidate/Interview/Referral, Travel, Reward → cross-tenant leakage | all inventories §0.2 | all |
| SEC-03 | Onboarding/separation templates have **no `companyId`** → globally shared across tenants | core-hr §0.2 | §03 |
| SEC-04 | Self-signup grants **SUPER_ADMIN** (= owner-bypass + isOwner) | platform §4.3 | §12 |
| SEC-05 | HR_ADMIN seeded with `saas.configure` → can suspend any tenant / switch plans | platform §0.4 | §08 |
| SEC-06 | `saas-admin` owner gate checks `super_admin` (wrong case) → page dead for real owners | platform §4.5 | §08 |
| SEC-07 | Login ignores `Company.status` → SUSPENDED tenant users still log in | platform §1 | §12 |
| SEC-08 | No failed-login audit, no lockout/rate-limit | platform §1 | §12 |
| SEC-09 | 15-min JWT, no refresh, no server logout/revocation | platform §0.1 | §12 |
| SEC-10 | OTP request/verify + forgot-password are echo stubs but marketed "active" | platform §1 | §12 |
| SEC-11 | Policy `contentHtml` rendered via `dangerouslySetInnerHTML` → stored XSS | engagement §4 | §07 |
| SEC-12 | Resend-invite embeds plaintext temp password in notification | core-hr §1.12 | §03/§12 |
| SEC-13 | Grievance GET returns employee identity **even when anonymous** | engagement §5 | §07 |
| SEC-14 | SaaS payment = client-trusted amount, fake card/receipt, no gateway | platform §4.6 | §08/§12 |
| SEC-15 | `email` globally `@unique` across tenants → cross-tenant collisions | core-hr §1.1 | §03 |
| SEC-16 | Settings audit rows written with null actor ("System") | platform §3 q3 | §08 |

### 2.2 Broken-UX — exists but fails or lies (P1)
| ID | Item | Source | Section |
|---|---|---|---|
| UX-01 | `calculate` jumps DRAFT→APPROVED+locked → Lock button, Corrections-create, PENDING state all dead | money §1.1/1.6 | §05 |
| UX-02 | Form 16 UI route `/payroll/form16/:id` ≠ API `/payroll/:id/form16` → 404 | money §1.15 | §05 |
| UX-03 | IT-proof upload uses relative URL + wrong token key → fails | money §1.12 | §05 |
| UX-04 | Payslip breakdown **fabricates** 50/20/30 split when components empty | money §1.2 | §05 |
| UX-05 | Compliance PT/TDS/Form16 exports emit **empty files** but log GENERATED | money §2.2 | §05 |
| UX-06 | Regularization Approve hits wrong route (404); no Reject; no create UI | time §5 | §04 |
| UX-07 | Two overlapping punch widgets; one posts hardcoded `shift_general` → 400 | time §1 | §04 |
| UX-08 | Employee edit form silently drops name/code/email + addresses/education/family on PATCH | core-hr §1.1 | §03 |
| UX-09 | Declarations UI writes `currentFiscalYearStart`/`fiscalYearDeadline`; payroll reads `fyCutoff*` | money §1.11 | §05/§08 |
| UX-10 | Documents auto-VERIFY on create → verify queue decorative; no reject | core-hr §1.3 | §03 |
| UX-11 | Bulk-upload panel renders no `<input type=file>` → always errors | core-hr §1.2 | §03 |
| UX-12 | Custom-fields panel reads/writes wrong keys throughout → create 400s, values never display | core-hr §3.3 | §03 |
| UX-13 | Grievance console wholly incompatible (400 submit, 404 resolve, crashes on first row) | engagement §5 | §07 |
| UX-14 | Survey create FK-fails (companyId never stamped); builder is a "coming soon" toast | engagement §3 | §07 |
| UX-15 | Requisition create omits required `designationId` → every create 400s | talent §2.1 | §06 |
| UX-16 | Expense create sets APPROVED immediately → skips approval chain | money §3.1 | §05 |
| UX-17 | Referral sends invalid enum `HIRED` → bonus-payroll path unreachable | talent §2.7 | §06 |
| UX-18 | Ticket status-update has no UI caller → tickets uncloseable | engagement §6 | §07 |
| UX-19 | Insurance claims auto-APPROVED → approval UI dead | engagement §7 | §07 |
| UX-20 | Assets GET re-seeds 5 demo rows on empty tenant | engagement §8 | §07 |
| UX-21 | Half-day leave silently dropped server-side (whole-day recount) | time §4 | §04 |
| UX-22 | 4 dashboard panels return identical data; cross-tenant aggregates | platform §7 | §09 |
| UX-23 | Loans list/decide UI calls routes that don't exist → 404, table always empty | core-hr §1.16 | §03/§05 |
| UX-24 | "Trigger Export Job" → audit row only, no artifact ever generated | platform §6 | §09 |
| UX-25 | SaaS "Queue Invoice"/"Refresh License" = fake audit rows (hardcoded ₹1,749) | platform §4 | §08 |
| UX-26 | F&F double-counts notice shortfall (in recoveries + sent separately) | core-hr §1.8 | §03 |
| UX-27 | Announcements dashboard widget filters `isPinned` (API returns `pinned`) → never renders | engagement §2 | §07/§09 |
| UX-28 | Support settings save drops `defaultQueue`/`ticketPrefix` | engagement §6 | §07/§08 |
| UX-29 | Seed: nobody has `performance.approve`/`create`; employees lack `performance.read` → self/manager/360 unreachable | talent §1.4/1.5 | §06 |
| UX-30 | Seed: `travel.read` HR-only but `travel.approve` MANAGER-only → both consoles error; ESS lacks social/assets/rewards reads | talent §4/§5, engagement §1/§8 | §06/§07 |
| UX-31 | Fabricated UI to delete: approvals "Inspect" narrative, SkyNexus birthdays, analytics ¾ bars, saas diagnostics, fake payslip %s, `(totalGross/12000)L` stat | platform §4/§7/§9, money §1 | §05/§08/§09 |

### 2.3 Missing engines / capabilities (P2)
| ID | Item | Source | Section |
|---|---|---|---|
| ENG-01 | Approval workflow engine (routing strings decorative; one-step decide; no chain) | platform §9 | §10/§08 |
| ENG-02 | Anomaly→LOP engine has **zero UI** (evaluate/decide/auto-clock-out/convert) | time §9 | §04 |
| ENG-03 | Shift CRUD (create/edit/delete + ShiftLocation links) | time §3 | §04 |
| ENG-04 | Holiday edit/delete | time Holidays | §04 |
| ENG-05 | Leave accrual-schedule CRUD (Process Accruals no-ops without it) | time §6 | §04 |
| ENG-06 | Onboarding/separation task-instance persistence (start flips status only) | core-hr §1.5/1.6 | §03 |
| ENG-07 | Offer accept/reject/convert-to-employee lifecycle | talent §2.5 | §06 |
| ENG-08 | 9-box calibration + goals/OKR endpoints | talent §1, master §5.4 | §06 |
| ENG-09 | Reminders: implement BIRTHDAY/WORK_ANNIVERSARY/LEAVE_BALANCE/PROBATION_END (only DOCUMENT_EXPIRY works) + placeholder substitution + scheduler | platform §8.2 | §10 |
| ENG-10 | `GET /notifications/mine` + unread count + mark-read (recipients can't read own) | platform §8.1 | §10 |
| ENG-11 | Real channel dispatch (EMAIL/WHATSAPP/PUSH are DB-rows-only) | platform §8.1 | §10/§08 |
| ENG-12 | Notification preferences matrix (event × channel) | master §6 | §10 |
| ENG-13 | Roles/permissions admin API+UI; scopes (self/team/dept/company); field-level security | platform §2 | §08 |
| ENG-14 | Component-config runtime effect (catalog ignored by calculate) — Kredily Screen 3 | money §1.5 | §05 |
| ENG-15 | Salary-template formula evaluator beyond `CTC * n` | money §1.4 | §05 |
| ENG-16 | Per-bank disbursement formats (ICICI/HDFC) + maker-checker | money §1.16 | §05 |
| ENG-17 | Statutory file artifacts: PF ECR refine, Form 24Q/FVU, PT/LWF challan, Form 12BA | money §2.2, blueprint §4 | §05 |
| ENG-18 | Rewards redemption flow + per-employee balance | talent §5.3 | §06 |
| ENG-19 | Server-side pagination/sort/filter on all big lists (every console full-loads today) | all inventories | §02/§03/§05/§09 |
| ENG-20 | Real server export endpoints (today client CSV) + report scheduler/worker | platform §6, multiple | §09 |
| ENG-21 | Federated search, saved views, scope switcher (shell features) | §01 | §01 |
| ENG-22 | Location lat/long + geofence radius settable via API/UI (powers geofencing) | core-hr §2.5 | §03/§04 |
| ENG-23 | Employee delete/deactivate; reach unreachable statuses (PROBATION/PRE_ONBOARDING/INACTIVE) | core-hr §1.11/§4.3 | §03 |
| ENG-24 | Schedulers (auto-attendance, auto-clock-out, accruals, reminders, birthdays) — all manual today | time/platform | §04/§10 |
| ENG-25 | AI module is an empty directory — net-new if pursued | platform §10 | future |

### 2.4 Enterprise-parity (market gaps, blueprint §4) — Wave 5+ (`PAR-`)
Surveys/eNPS (UX-14 builds the surface) · team leave calendar · salary-revision/increment cycles linked to appraisal · IP-based attendance restriction · custom report builder + scheduled exports (ENG-20) · reminders engine (ENG-09) · letter e-signature · knowledge base + HR chatbot · disciplinary/PIP · accounting JV export (Tally) · salary-advance self-service · **2FA/TOTP + SSO** (SEC-09 adjacent) · webhooks. *(Deferred to native phase: selfie/face punch, biometric device sync, kiosk, offline attendance, push — backend already mobile-ready.)*

---

## 3. Risk register
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Payroll/compliance math regression during rework (UX-01, ENG-14) | Med | **High** | Byte-compare register/bank exports vs legacy; formula-trace popover as manual check; lock/unlock audit asserted in e2e; review payroll PRs line-by-line; do not change math + UI in the same PR |
| Tenant-isolation fix (SEC-02) breaks legitimate reads | Med | High | Add models to allowlist incrementally with per-endpoint e2e; owner-bypass preserved; contract tests per role fixture |
| 30k LOC of console micro-features lost in rewrite | High | Med | Per-module parity checklist extracted from the inventory before rewrite (in PR description); legacy kept runnable until P5 |
| Permission UI ↔ API drift (ENG-13) | Med | Med | Single `lib/permissions.ts` + regenerated `permission-map.json`; contract test hits API with role fixtures, asserts UI gate map |
| Scope creep from the 60-item backlog | High | Med | Severity-gated: P0 security in P1/P4, P1 broken-UX with its section, P2 engines only when their screen lands; PAR items explicitly Wave 5+ |
| Two-lane (docs/code) divergence | Med | Med | This file is the single contract; section specs are frozen references; code lane cites backlog IDs in commits |
| Audit-green gate flakiness blocks progress | Low | Med | Fix-forward; never merge red; destructive-walkthrough per phase |
| White-label contrast failures (§02 §7) | Low | Low | CI contrast check on derived brand scale; auto-adjust/reject failing tenant colors |

---

## 4. Build-vs-review split (master §8 "Antigravity-vs-review")
- **Mechanical (agent-buildable, light review):** token layer + primitives (§02); table/form migrations from `live-tables.tsx`/`action-panels.tsx` to `DataTable`/`FormField`; route scaffolding + breadcrumbs; status-pill map adoption; empty/loading/error states; nav registry; reskins with no logic change (P0); wiring already-correct API-only endpoints to new UI (e.g. anomaly engine ENG-02, leave ledger, promotion/transfer create/decide).
- **Careful human review (paired/served, deep review):** anything in §2.1 SECURITY; payroll lifecycle + math (UX-01, ENG-14/15/16/17); RBAC/scopes/field-security (ENG-13); tenant-scoping (SEC-02); workflow engine (ENG-01); F&F (UX-26); declaration/tax windows; bank/disbursement; data import/export + retention.
- **Product decision needed (escalate, don't guess):** real payment gateway vs "trial/no-charge" (SEC-14); whether to keep plan-gating server-enforced; AI module scope (ENG-25); which statutory file formats ship first (ENG-17).

## 5. Tracking & DoD recap
- Track by backlog ID; each code-lane PR references the IDs it closes + the section spec it implements + the inventory quirk it fixes.
- **Launch DoD (master plan §8 + §11 a11y gate):** every §01 route live · zero legacy consoles imported · all six states on every list/form · SEC-01…16 closed · WCAG 2.1 AA recorded · perf budgets green 7 days · 4-persona role e2e green · this file + section specs updated to "as-built."
