# Correctness & Security Backlog

> Consolidated from the 9 inventories + 12 section specs. Every item is a **real,
> code-confirmed defect** (not a redesign wish). Severity-ranked; each tagged with
> a suggested owner — **[Claude]** = security/RBAC/payroll/tenant logic (verify by hand),
> **[AG]** = mechanical UI route/DTO mismatch (safe to hand Antigravity, Claude verifies).
> Status: ☐ open · ☑ done.

---

## P0 — Security (exploitable)

- ☑ **Cross-tenant breach via `x-tenant-id` header** — middleware read tenant from client header before JWT. *Fixed in `77005f4`.* [Claude]
- ☑ **Public signup granted SUPER_ADMIN** (owner role, bypasses tenant scoping). Now grants HR_ADMIN. *Fixed in `77005f4`.* [Claude]
- ☐ **HR_ADMIN can suspend any tenant.** `PATCH /saas/companies/:id/status` needs `saas.configure`, which seed grants to HR_ADMIN, and `Company` is not tenant-scoped → any tenant admin can set another company's status by id. Fix: gate to owners only, or scope to own tenant. (platform.md §137) [Claude]
- ☐ **Anonymous grievance leaks identity.** `GET /grievance` returns the full employee object even when `anonymous: true`, to any `grievance.read` holder. Fix: strip employee identity when anonymous. (engagement.md) [Claude]
- ☐ **Unverified JWT decode in middleware.** `TenantMiddleware` uses `jwtService.decode` (no signature check) to derive tenant/owner. A forged token could assert `isOwner`. Fix: `verify` not `decode`. (platform.md §327) [Claude]
- ☐ **Social post author spoofing** — create accepts a client-supplied author id. Fix: force author = current user. (engagement.md) [Claude]

## P0 — Tenant isolation (data leakage in real multi-tenant; masked today by single-company seed)

- ☐ **Models missing from Prisma tenant allowlist** → unscoped `findMany` leaks across tenants once there's >1 company:
  `SocialPost/Like/Comment`, `Grievance`, `EmployeeInsurance/InsuranceDependent/InsuranceClaim`, `Survey/SurveyQuestion/SurveyResponse`, `AnnouncementRead`, `PolicyAcknowledgment`, `Notification`, `Company`, `EmployeeDocument`, `EmployeeBankDetail`, exit/promotion/transfer/loan models. (core-hr §0.2, engagement.md, platform.md) [Claude]
- ☐ **Onboarding/Separation templates have no `companyId` column at all** — globally shared across tenants. Needs schema change. (core-hr §0.2) [Claude]

## P1 — Functionally broken (UI hits routes that 404 or DTOs that 400 — feature unusable)

- ☐ **Surveys create FK-crashes.** `surveys.service.ts` hardcodes `companyId: ""` expecting middleware to stamp it, but `Survey` isn't in the allowlist → Postgres FK violation on every `POST /surveys`. Fix: add Survey(+children) to allowlist. (engagement.md) [Claude]
- ☐ **Regularization approve 404s.** UI calls `PATCH /attendance/regularizations/:id/approve`; real route is `PATCH /attendance/regularize/:id`. Also no Reject button exists. (time.md §80) [AG]
- ☐ **Grievance resolve 404s + console crashes.** UI PATCHes `/grievance/:id/resolve` with `{resolutionDetails}` — route & field don't exist; console also crashes rendering a non-empty list (contract mismatch). (engagement.md §175) [AG]
- ☐ **Custom field create always 400s.** UI sends `{name,label,type,required}`; API requires `{fieldKey,fieldType,...}`. (core-hr) [AG]
- ☐ **Recruitment requisition create always 400s.** UI omits required `designationId`; also `requestedById` fails for users with no employee record. Blocks staffing-plan budget flow too. (talent.md §104) [AG]
- ☐ **Referral "Mark Hired" throws.** UI sends status `"HIRED"`, not in `ApprovalStatus` enum → Prisma error; "Release Bonus" + the APPROVED→payroll-bonus branch never reachable. (talent.md §153) [AG]
- ☐ **Employee loans 404.** UI calls `GET /employees/loans/list/all` + `PATCH /employees/loans/:id/decide`; neither route exists → list permanently empty, EMI never flows to payroll/F&F. (core-hr §1.17) [Claude]
- ☐ **Manager appraisal step unreachable.** `performance.approve` granted to nobody in seed; SUPER_ADMIN bypasses guard but has `employeeId=null` so manager-rate throws. Appraisals stall at SELF_DONE. Fix: grant `performance.approve` appropriately. (talent.md §75) [Claude]
- ☐ **SaaS Owner console gate broken for everyone.** Client checks lowercase `super_admin` / nonexistent `isSuperAdmin` / `saas.admin`; real role is `SUPER_ADMIN` → "Owner Credentials Required" shown to all. (platform.md §160) [AG]
- ☐ **Bulk upload UI broken** — decorative drop-zone, no `<input type="file">`; handler always errors. Excel endpoint + template have no UI. (core-hr §1.2) [AG]
- ☐ **Employee edit drops fields** — drawer binds name/code/email + addresses/education/family but `handleSaveProfile` never sends them. (core-hr §1.1) [AG]

## P2 — Dead workflows & data integrity (works but logically wrong)

- ☐ **Documents auto-VERIFY on create** → verify queue is decorative; no reject path. (core-hr §1.3) [Claude]
- ☐ **Insurance claims auto-APPROVED on create** → approval UI only ever works on the one seeded PENDING row. (engagement.md §234) [Claude]
- ☐ **Assets self-seed 5 demo rows when empty** → register can never be empty; deleting all + refresh resurrects mock data; new tenant fabricates inventory. (engagement.md §259) [Claude]
- ☐ **Asset assign silent fallback** to "first active employee" when none supplied. (engagement.md) [Claude]
- ☐ **Probation confirm always 400s** — nothing ever sets status PROBATION (create defaults ACTIVE); INACTIVE/PRE_ONBOARDING also unreachable. (core-hr §1.12) [Claude]
- ☐ **Promotion/transfer timeline shows placeholder names** — list endpoints don't `include` the from/to designation/grade relations. (core-hr) [Claude]
- ☐ **employer PF always 0** in template-assign (name-keyword match never maps it). (money.md) [Claude]
- ☐ **Declarations key mismatch** — UI writes `currentFiscalYearStart`/`fiscalYearDeadline`; DEFAULT_RULES defines `fyCutoffMonth`/`fyCutoffDay`. Both coexist in ClientRule; reconcile to what payroll reads. (platform.md §119) [Claude]
- ☐ **Payroll console fake stats** — "Audit State: Verified" hardcoded; "Gross Payout" uses `/12000` (wrong lakh math); wizard step-4 completion is client-only, lost on reload. (money.md) [AG]
- ☐ **Company Profile "Locations" stat hardcoded `5`** (`companyStats.locs.length || 5`). (core-hr §54) [AG]
- ☐ **No employee delete/deactivate** endpoint anywhere. (core-hr §1.1) [Claude]
- ☐ **F&F approve / exit endpoints API-only** — no UI buttons (resign, exit letters, F&F approve). Covered by the planned Exit Management center, but flag until built. (core-hr) [AG]

---

## Suggested execution order

1. **P0 security** (the 4 open ones) — Claude, immediately; small and exploitable.
2. **P0 tenant isolation** — Claude; one focused pass adding models to the Prisma allowlist + the templates schema change. Highest blast radius before you onboard a 2nd tenant.
3. **P1 broken features** — batch the **[AG]** route/DTO fixes into one Antigravity prompt (regularize route, grievance resolve, custom-field DTO, requisition designationId, referral enum, owner-console gate, bulk-upload input, employee-edit save); Claude takes the **[Claude]** ones (surveys allowlist, loans routes, performance.approve seed).
4. **P2** — clean up dead workflows; several disappear naturally during the UI rebuild.

Each fix follows the project DoD: both `tsc` clean, permission map regenerated if routes change, e2e green, live smoke per the leave-types standard.
