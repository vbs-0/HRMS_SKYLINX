# 98 — Adversarial Critique & Remediation Log

> Method: 5 parallel read-only reviewer agents cross-checked each section spec against its source-of-truth inventory + the actual API controllers/DTOs/seed on branch `2.0`. Each finding = {severity, location, problem, fix}. This doc records **every** finding and its **disposition**; spec edits are applied in follow-up `docs(redesign): remediate …` commits.
> Agent verdict (4 of 5): the specs are "unusually accurate — every EXISTS endpoint and permission string checked matches the inventory." Findings are mostly precision (permission verbs, path prefixes), missing route registrations, dangling cross-refs, and coverage adds. A few real errors (wrong permission verbs, one propagated inventory error) are fixed inline.
> Disposition key: **✅ fixed inline** · **📝 addendum** (added to the spec's remediation note) · **✓ confirmed** (agent verified my spec was already correct — no change) · **➕ roadmap** (added to `99` backlog) · **⏸ deferred** (Wave 5+/product decision).
> Coverage: §03/§04 (agent 2), §05 (agent 1), §06/§07 (agent 3), §08/§09/§10/§12 (agent 4), **§01/§02/§11 + global sweep (agent 5)** — all 5 complete (agent 5 re-ran after a session-limit reset; findings in §F). Remediations applied across §01–§11; dispositions below.

---

## A. §05 Money (agent 1) — 43 findings; highest-value first
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| F11 | P1 | Additional-salary **create** is `payroll.update`, not `payroll.create` (would 403) | ✅ fixed inline |
| F9 | P0→P1 | Gratuity **preview GET** is `payroll.read` (self-scoped), not `payroll.approve` (A5 header over-restricts) | ✅ fixed inline |
| F15 | P1 | Managers hold `expenses.approve` but **not `expenses.read`** → Approvals tab list 403s | ✅ fixed inline + ➕roadmap (UX-30/seed) |
| F1/F7 | P1 | Run endpoints drop `/payroll` prefix in A2; normalize to `/payroll/runs/...` | ✅ fixed inline |
| F2/F3/F4 | P2 | Corrections/gratuity/retention/withholding decide paths shorthand; spell out `…/:id/decide`, `…/:id/release` | 📝 addendum |
| F28 | P1 | New status pills (Draft/In-review/Locked/Published/Paid) have **no API↔UI mapping**; add a status-map table | 📝 addendum + ➕roadmap |
| F33/F34 | P1 | "published-but-correctable" + "off-cycle runs" reference states/endpoints that don't exist (publish + off-cycle are NEW) | 📝 addendum (define POST-LOCK "correctable" window; mark off-cycle NEW) |
| F18 | P1 | `declarations.mandatoryProof` key not surfaced though proof flow depends on it | ✅ fixed inline |
| F25 | P1 | TDS annualization ×12 inflates on one-off bonuses/claims (calculate bug) | ➕roadmap (new ENG item) |
| F30 | P1 | ComplianceDash dissolution: state where its 4 sub-tabs land | 📝 addendum |
| F23/F8 | P1/P2 | Benefits `apply`/`applications` EXISTS (API-only); cite it; link claims↔applications by id not free-text | 📝 addendum |
| F37/F38 | P1 | Enterprise parity: multi-month retro arrears; dedicated F&F settlement workspace (cross-ref §03) | ⏸ deferred (parity) + 📝 cross-ref |
| F12 | P2 | Payroll/expense DELETE is **SUPER_ADMIN-only** (no role has `delete`) — annotate | 📝 addendum |
| F17/F19/F20/F22 | P2 | Use exact settings keys: `cessPct`,`surchargePct`,`performanceIncrementPct`, PF/ESI/PT/TDS rate keys; name `payrollLockDay` as lock cutoff | 📝 addendum |
| F24/F26/F27/F31 | P2 | Reconcile per-slab `surcharge` vs `taxCalc.surchargePct`; ESI IP field mapping; EPS 8.33%/ESI-days hardcodes; readiness presence-only | ➕roadmap |
| F29 | P2 | Bank-file export should require run locked server-side | ➕roadmap |
| F32 | P0(scope) | Cross-file cite ambiguity: loans = **core-hr §1.16**, bank export = money §1.16; disambiguate cross-file refs | ✅ fixed inline |
| F6/F16/F36/F35/F10/F14/F5 | — | **Confirmed accurate** (Form16 route, declarations key mismatch, PT/TDS/Form16 empty exports, bank format, salary-struct perms, tax-slab perms, component DELETE-exists) | ✓ confirmed |
| F39–F43 | P2 | Parity: POI window/partial-approval, loan amortization, input-freeze date, multi-state PT, password-protected payslip PDF + scheduled release | ⏸ deferred (parity) |

## B. §04 Time & §03 Core HR (agent 2) — 25 findings
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | P0 | §04 OT **create** is `attendance.update`, not `attendance.create`; EMPLOYEE lacks it → ESS OT needs server downgrade/grant | ✅ fixed inline + ➕roadmap |
| 23 | P0 | EMPLOYEE lacks `attendance.read`/`leave.read` → "My Attendance/My Leave" ESS tabs **403 + nav hidden**; all "self-scope NEW" depends on a seed grant | ✅ fixed inline (dependency note) + ➕roadmap (rbac A7) |
| 3 | P0 | §04 `DELETE /holidays/:id` mislabeled `holidays.update`; should be `holidays.delete` (SUPER_ADMIN-only by seed) | ✅ fixed inline |
| 14 | P1 | §03 Deactivate action has no perm/endpoint named (no deactivate endpoint exists) | ✅ fixed inline (propose `employees.update` soft / `employees.delete` hard) |
| 16 | P0 | §03 custom-fields **dual route alias** (`settings/custom-fields` + `custom-fields/definitions`; values dual too) — perm-map must gate both | 📝 addendum |
| 2 | P1 | §04 OT body omits required `employeeId` | 📝 addendum |
| 4 | P1 | §04 A6 `/roster` "or /attendance Roster tab" hedge contradicts §01's committed dedicated route | ✅ fixed inline |
| 5/6/12 | P1/P2 | Export perms unheld: `attendance.export`/`leave`/`holidays`/`employees.export` granted to nobody — name perm + add to HR grants or use `*.read` | 📝 addendum + ➕roadmap |
| 7 | P2 | §04 C1/C2 don't restate balances key off `getLeaveYear()` (leave-year unification) | ✅ fixed inline |
| 8 | P1 | §04 surface `GET /leave/policies/assignments/:companyId` (today nested-only) | 📝 addendum |
| 9 | P2 | §04 comp-off: add duplicate-OT guard (one-to-one FK → 2nd conversion 500s) | 📝 addendum |
| 15 | P1 | §03 Loans fix named but homeless — add a Loans tab to Profile 360 wiring NEW list/decide routes | ✅ fixed inline |
| 18 | P1 | §03 wire `GET /employees/queue/verify` (today the tab reads the unscoped full list) | 📝 addendum |
| 20 | P2 | §03 mirror onboarding's task-instance + `companyId` fix for **separation** too | 📝 addendum |
| 21 | P1 | Geofence radius ownership: global `attendance.geofenceRadiusMeters` (§04 A5) vs per-location field (§03 §7) — pick one source | ✅ fixed inline (reconcile to per-location override of global default) |
| 24 | P1 | §03 note: exit endpoints gate `employees.*`, NOT the phantom `exit.*` module (no controller) | ✅ fixed inline |
| 25 | P2 | §04 header mis-homes `documents.expiryReminderDays` (belongs §03) | ✅ fixed inline |
| 13/19 | P2 | §03 `/me` + `/employees/[id]` are NEW (cross-ref §01 redirect rule); name bulk-upload template/excel perms | 📝 addendum |
| 10/17 | — | **Confirmed accurate**: regularize broken-route fix; F&F double-count (verified `lifecycle-console.tsx:137-139/372/1051`); exit-ff/approve = `employees.approve` | ✓ confirmed |
| 11/22 | P2 | Parity: regularization caps, comp-off expiry, shift-swap, WFH-as-request; e-sign/ack, ESS-change maker-checker, org effective-dating, numbering-series collisions | ⏸ deferred (parity) |

## C. §06 Talent & §07 Engagement (agent 3) — verdict "factually strong"
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| T-1 | P1 | **Propagated inventory error**: `TrainingEvent.status` DOES exist (`@default("SCHEDULED")`); the pill renders "SCHEDULED" not "undefined". Real gap = no lifecycle PATCH (edit/cancel/complete) + free-string status | ✅ fixed inline |
| T-9 | P1 | §06 travel fix omits granting **`travel.approve` to HR_ADMIN** (HR currently cannot approve travel at all) | ✅ fixed inline |
| T-2 | P1 | §06 performance fix should re-grant `performance.create`/`approve` to **HR_ADMIN too**, not only managers | ✅ fixed inline |
| E-10 | P1 | `/announcements` is a NEW route §07 introduces but **§01 sitemap never registers it** | ✅ fixed inline (§01) |
| T-3 | P2 | §06 §D typo `talk.md` → `talent.md` | ✅ fixed inline |
| T-12 | P2 | §06 add: weight self + 360 into finalScore (today `finalScore = managerScore` only) | 📝 addendum |
| E-3 | P2 | Manager `surveys.configure` lets any manager view all results / close any survey — governance flag (confirm intended vs scope-to-own) | 📝 addendum + ➕roadmap |
| E-12 | P1 | Policy `contentHtml` XSS — elevate the call-out (currently mid-section) | ✅ fixed inline (severity tag) |
| E-14 | P2 | §07 survey: enforce `startsAt`/`endsAt` window on submit (today status-only) | 📝 addendum |
| E-13 | P2 | Delete legacy unused `social-feed.tsx` | ➕roadmap |
| E-9 | P2 | Confirm `GET /dashboard/celebrations` exists before wiring birthday fix | ✓ confirmed (agent 4 verified it exists) |
| T-4…T-11, E-1…E-8, E-11 | — | **Confirmed accurate**: referral HIRED enum, requisition designationId 400, offer DRAFT-forever, candidate stage free-form, grievance rebuild, survey FK, announcements `pinned`, ticket status UI, insurance auto-approve, assets auto-seed, social/assets ESS seed gaps, routes consistent | ✓ confirmed |

## D. §08/§09/§10/§12 Platform (agent 4) — verdict "unusually accurate"
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| 3 | P0 | **Server-side plan enforcement is uncovered** by all four specs though every page carries plan badges (platform.md §0.3 — plan is cookie-only today) | ✅ fixed inline (§08 cross-cutting) |
| 1/2 | P0 | §09/§10 cite the Prisma-allowlist symptom but not the `x-tenant-id` spoof + `decode()`-not-`verify()` root cause (model-scoping alone is bypassable) | ✅ fixed inline (cross-ref §08/§12) |
| 15 | P1 | §10→§08 "Settings → Workflows" is a **dangling reference** — no Workflows row in the §08 settings tree | ✅ fixed inline (§08) |
| 6 | P1 | `permissions` ClientRule + setup-wizard matrix drop-vs-wire fork **left undecided** across §08/§12; wizard still writes the dead key | ✅ fixed inline (decide: wire wizard Step 8 → `/roles`; drop the ClientRule write) |
| 7 | P1 | `/settings/notifications` (§10 C3) **missing from §01 sitemap**; resolve §08↔§10 ownership | ✅ fixed inline (§01 + ownership note) |
| 9 | P1 | `/analytics/[domain]` implied by §09 but **missing from §01 sitemap** | ✅ fixed inline (§01) |
| 5 | P1 | `permission-map.json` must accept `settings.configure` for `settings.*` GET prechecks (HR_ADMIN has **no `settings.read`**) or HR loses the settings tree client-side | 📝 addendum (§08) + ➕roadmap |
| 4 | P1 | §09 `GET /dashboard/company-health` relabel crisply NEW (reuse/replace EXISTS `/dashboard/super-admin`) | ✅ fixed inline |
| 11/12 | P2 | Wire or remove dead `GET /notifications/recipients` (§10) and dead cross-tenant `GET /security/notifications` (§08) | 📝 addendum |
| 10 | P2 | §09 `pendingApprovals` is a duplicate of `pendingLeaves` — compute real count | 📝 addendum |
| 13 | P2 | §09 defer SkyNexus birthday-widget fix to §07 (avoid two specs owning one component) | ✅ fixed inline |
| 16 | P2 | §09 report scheduler + §10 reminders scheduler should share **one** job-runner substrate (no cron exists today) | 📝 addendum (both) |
| 14 | P2 | MFA double-owned: §08 D (policy/enforcement) + §12 D (enrollment) — add reciprocal cross-refs | 📝 addendum |
| 8 | P1 | §01 sitemap should enumerate `/settings/permissions|users|data|integrations` (today only in nav §2) | ✅ fixed inline (§01) |
| all EXISTS/NEW/perm/security-quirk checks | — | **Confirmed accurate** (every EXISTS path, permission string, NEW label, and all 8 §12 security quirks verified against source) | ✓ confirmed |

## E. Cross-cutting themes (from all 4)
1. **Seed re-grants are load-bearing and under-stated** — multiple "self-scope NEW"/"approval" flows silently depend on rbac A7 grants that don't exist (EMPLOYEE attendance/leave read; HR travel.approve + performance.approve/create; manager expenses.read). Elevated in `99` backlog and the affected specs.
2. **`x-tenant-id` + JWT-verify is the security keystone** — model-level tenant scoping (SEC-02) is insufficient without SEC-01; every data-reading section now cross-refs it.
3. **Plan gating is cosmetic** — make it a server boundary or state it's UX-only (SEC/new roadmap note).
4. **Route registry completeness** — §01 is the canonical sitemap; 6 routes referenced elsewhere were missing and are now added.
5. **Path/permission precision** — full `/payroll/runs/...` prefixes, exact `…/:id/decide` paths, exact DEFAULT_RULES key names, and correct permission verbs matter for an implementation spec; fixed where wrong, addendum'd where shorthand.

## F. §01/§02/§11 + global consistency (agent 5) — complete
Re-run succeeded (verdict: **no P0s** — no permission string violates the action/module universe, no route *conflicts* the sitemap; all issues are omissions/precision). Findings + dispositions:

### Job A — foundation
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| A-a | P1 | §01 sitemap missing `/settings/notifications`, `/settings/workflows`, `/performance/goals`, `/announcements` (referenced as real pages by §06/§07/§10) | ✅ fixed inline (§01 — all added) |
| A-a | P2 | Auth routes `/forgot`,`/reset/[token]`,`/activate/[token]` (§12) absent from sitemap | ✅ fixed inline (§01) |
| A-a | P2 | `/settings/*` wildcard should be explicit subroute rows; `/inbox` Tasks tab + `GET /tasks` unstated | ✅ fixed inline (§01) |
| A-b | P2 | Nav gates for ESS "My Expenses"/"My Assets" contradict the seed unless A7 grants land; §01 didn't flag the dependency like §07 does | ✅ fixed inline (§01 §12 note) |
| **A-c** | **P1** | **§02 component library omits composites referenced elsewhere: NineBox, GoalTree, CommentThread, AssetTag, InsuranceCard** (+ SignaturePad, DiffView, MoneyText, OrgChartView) | ✅ fixed inline (§02 §9 — all 10 added) |
| A-d | P2 | §11 keyboard list omits NineBox-drag + Kanban move-to; OTP login not in the e2e gate; chart series-1 contrast on brand override | ✅ fixed inline (§11 E) |
| A-e | P1 | §02 Drawer "720 wide" not in blueprint (450 only); §02 §4 dropped tablet gutter 20; seed default `branding.primaryColor` `#078ced` silently overrides the new Indigo identity | ✅ fixed inline (§02 — drawer/gutter reconciled; brand seed-default change mandated) |

### Job B — global consistency sweep
| ID | Sev | Finding | Disposition |
|---|---|---|---|
| B1 | — | **Permission reality: no hard violations** — every action ∈ the 7-set, every gate module ∈ the 30 seeded; `saas.admin` only appears as the *broken legacy gate* §08 already flags | ✓ confirmed |
| B2 | P1 | Routes referenced-but-unregistered (same as A-a) | ✅ fixed inline (§01) |
| B3 | P2 | Cross-section boundaries unstated: workflow engine §10 vs builder §08; F&F §03 vs §05; Form 16 §05 B vs C; expense payout ordering; tax-proof single owner | ✅ fixed inline (§05 F + §08 J1 + §10 F set the boundaries) |
| B4 | P2 | Unregistered settings keys `companyHealth.weights` (§09) and `attendance.ipAllowlist` (§04); `incrementPct` duplicated across `performance` + `salaryStructure` categories | ✅ fixed inline (§08 J2/J3 register both; cite `performance.incrementPct`) |
| B5 | P1 | **Orphans**: workflow-builder UI (referenced, specced nowhere) and `companyHealth.weights` control (referenced, specced nowhere); announcements-vs-SkyNexus + letter-e-sign owners unnamed | ✅ fixed inline (§08 J1 owns builder, J2 owns companyHealth; announcements canonical = §07 B entity; e-sign owner = §03/§07 SignaturePad in §02) |

**Net (agent 5):** the two material gaps — §02's missing composites and the orphaned workflow-builder/companyHealth controls — are now closed; all referenced routes are registered; no permission/module violations exist.

---

## G. Remediation summary
- **Inline spec fixes applied** (see `docs(redesign): remediate …` commits): §01 (6 route additions + permission-map note), §03 (loans tab, deactivate perm, exit phantom-module note, geofence ownership, export perm), §04 (OT perm, holiday delete perm, leave-year, roster route, ESS read dependency, header key move), §05 (run prefixes, additional-salary/gratuity perms, expenses.read hole, mandatoryProof, cross-file cite), §06 (TrainingEvent status, travel/performance HR grants, talk.md typo, XSS severity), §08 (Workflows row, plan-enforcement note, permissions-matrix decision, company-health relabel), §09/§10 (x-tenant-id cross-ref, scheduler-substrate note, SkyNexus defer).
- **Addenda** appended per affected spec as a "Post-critique remediations" note for the 📝 items.
- **Roadmap (`99`) updated** with the new ➕ backlog items (TDS annualization, ESI/EPS hardcodes, bank-file lock, surcharge reconcile, seed re-grants elevation, schedulers substrate, social-feed cleanup, permission-map settings.configure).
- **Confirmed-accurate findings** require no change — they validate the specs against source.
