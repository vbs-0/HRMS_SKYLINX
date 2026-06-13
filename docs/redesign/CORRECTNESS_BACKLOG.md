# Correctness & Security Backlog

> Consolidated from the 9 inventories + 12 section specs. Every item is a **real,
> code-confirmed defect** (not a redesign wish). Severity-ranked; each tagged with
> a suggested owner — **[Claude]** = security/RBAC/payroll/tenant logic (verify by hand),
> **[AG]** = mechanical UI route/DTO mismatch (safe to hand Antigravity, Claude verifies).
> Status: ☐ open · ☑ done. **Reconciled 2026-06-13** against shipped commits.

---

## P0 — Security (exploitable) — ALL CLOSED ✅

- ☑ **Cross-tenant breach via `x-tenant-id` header** — JWT-first, header override owner-only. *`77005f4`.* [Claude]
- ☑ **Public signup granted SUPER_ADMIN** — now grants HR_ADMIN. *`77005f4`.* [Claude]
- ☑ **HR_ADMIN can suspend any tenant** — `updateCompanyStatus` now rejects cross-tenant unless owner. *`saas.service.ts`, S1.* [Claude]
- ☑ **Anonymous grievance leaks identity** — employee stripped + `employeeId="ANON"` when anonymous, in list + detail. *S2, live-verified.* [Claude]
- ☑ **Unverified JWT decode in middleware** — `jwtService.verify` (signature check), not `decode`. *S3, live-verified.* [Claude]
- ☑ **Social post author spoofing** — `authorUserId = user.sub` forced server-side. *S4, live-verified.* [Claude]

## P0 — Tenant isolation — ALL CLOSED ✅

- ☑ **Models missing from Prisma tenant allowlist** — Social*/Grievance/Insurance*/Survey*/AnnouncementRead/PolicyAcknowledgment/Notification/EmployeeDocument/EmployeeBankDetail/promotion/transfer/loan added to `companyModels`. *T1.* [Claude]
- ☑ **Onboarding/Separation templates have no `companyId`** — added `companyId String?` + relation; `prisma db push` run + backfilled. *T3, DB-verified.* [Claude]

## P1 — Functionally broken (UI hits routes that 404 or DTOs that 400)

- ☑ **Surveys create FK-crashes** — Survey(+children) added to allowlist so companyId stamps. *T2.* [Claude]
- ☑ **Regularization approve 404s + no Reject** — route reconciled; Approve+Reject buttons wired & browser-verified. *F1 + `d758dc5`.* [AG]
- ☐ **Grievance resolve 404s + console crashes.** UI PATCHes `/grievance/:id/resolve` with `{resolutionDetails}`; real route is `@Patch(":id")` and the field doesn't exist. Console may also crash on a non-empty list (contract mismatch). (engagement.md §175) [AG]
- ☑ **Custom field create always 400s** — DTO reconciled (`fieldKey`/`fieldType`). *F3, live 201.* [AG]
- ☐ **Recruitment requisition create always 400s.** Backend DTO requires `designationId` + `requestedById`; confirm UI sends them and handles users with no employee record. Blocks staffing-plan budget flow too. (talent.md §104) [AG]
- ☐ **Referral "Mark Hired" throws.** Backend keys off `ApprovalStatus.APPROVED`; if UI sends `"HIRED"` it's not in the enum → Prisma error. Verify UI status value; "Release Bonus" + APPROVED→payroll-bonus branch depend on it. (talent.md §153) [AG]
- ☑ **Employee loans 404** — routes exist with correct `employees.*` permissions. *F9, live 200.* [Claude]
- ☑ **Manager appraisal step unreachable** — `performance.approve` granted appropriately. *F10, live 200.* [Claude]
- ☑ **SaaS Owner console gate broken for everyone** — gate now grants by SUPER_ADMIN/SYSTEM_OWNER role / saas.admin perm (no false `!tenantId` precondition). *F6, `d758dc5`, browser-verified.* [AG→Claude]
- ☑ **Bulk upload UI broken** — real `<input type="file">` added + filename feedback. *F7, `d758dc5`, browser-verified.* [AG→Claude]
- ☑ **Employee edit drops fields** — PATCH now sends firstName/lastName/email (+ addresses/education/family already wired). *F8, `d758dc5`, browser-verified.* [AG→Claude]

## P2 — Dead workflows & data integrity

- ☑ **Documents auto-VERIFY on create** → now defaults PENDING (both create paths). *D1, live-verified.* [Claude]
- ☑ **Insurance claims auto-APPROVED on create** → now PENDING. *D2, live-verified.* [Claude]
- ☑ **Assets self-seed 5 demo rows** → seed block removed + 5 rows purged. *D3, live-verified.* [Claude]
- ☑ **Asset assign silent fallback** → now requires explicit employeeId (400) + validates tenant membership (404). *`44300a4`, live-verified.* [Claude]
- ☑ **Probation confirm always 400s** → CreateEmployeeDto accepts optional enum-validated `status`; create with PROBATION → confirm → ACTIVE works. *`f5f19b7`, live-verified.* [Claude]
- ☑ **Promotion/transfer timeline placeholder names** → service-layer enrichment resolves designation/dept/location names. *`80a3a16`, live-verified.* [Claude]
- ☑ **employer PF always 0** → root cause was SYSTEM-type components (EPF/PT) uncomputed in template-assign; now derives employee PF, employer PF, PT from admin rules. *`fa83520`, live-verified.* [Claude]
- ☑ **Declarations key mismatch** → UI now derives `fyCutoffMonth`/`fyCutoffDay` from the picked `fiscalYearDeadline` on submit, so the admin's deadline drives payroll's cutoff (was silently ignored). *`c076a93`, plumbing live-verified.* [Claude]
- ☐ **Payroll console fake stats** — "Audit State: Verified" hardcoded; "Gross Payout" uses `/12000` (wrong lakh math); wizard step-4 completion client-only, lost on reload. (money.md) [AG]
- ☐ **Company Profile "Locations" stat hardcoded `5`** (`companyStats.locs.length || 5`). (core-hr §54) [AG]
- ☐ **No employee delete/deactivate** endpoint anywhere. (core-hr §1.1) [Claude]
- ☐ **F&F approve / exit endpoints API-only** — no UI buttons. Covered by the planned Exit Management center, but flag until built. (core-hr) [AG]

---

## Hardcode externalization (12-Factor / config audit — see plan file)

- ☐ **Tenant-id fallbacks** — `|| "company_skylinx"` / `"comp_skylinx"` in assets, saas, auth, payroll(×3), organization(×3), holidays, leave, web/session. Replace with throw-on-missing. [Claude]
- ☐ **Brand strings in `lib/fallback-data.ts`** — "SKYLINX *" leaks to customer UI on API failure; letter-template signature; localStorage key. [AG]
- ☐ **Payroll calc constants** — standard deduction, 80C/80D/24b caps, cess, surcharge, TDS slabs, promotion basic/HRA ratios, perf increment % → move to DEFAULT_RULES + read via getPayrollRules(). [Claude]
- ☐ **Dynamic date defaults** — `"2026-06"` state inits + payroll year dropdown → derive from `new Date()`. [AG]
- ☐ **Seed passwords** — externalize to env. [AG] *(partly done — DEMO_PASSWORD already env-gated in seed.ts)*

## Parked (needs user input / separate track)

- ☐ **SMTP/email wiring** — built but dormant (no creds → OTP/password-reset broken). Needs user-supplied secrets; will wire config + test-email button. [user + Claude]
- ☐ **WhatsApp/SMS** — WhatsApp disabled stub; SMS doesn't exist. [later]
- ☐ **UI rebuild execution** — per `00_MASTER_UI_ARCHITECTURE.md` + `99_IMPLEMENTATION_ROADMAP.md`. [separate track]

---

## Remaining execution order (as of 2026-06-13)

1. **P1 still-open** (grievance resolve, requisition, referral) — [AG] mechanical, Claude verifies.
2. **Hardcode externalization** — [Claude] tenant-id fallbacks (highest blast radius) + payroll constants; [AG] brand strings + dates.
3. **P2 data-integrity** — [Claude] probation/timeline/PF/declarations; [AG] payroll stats, locations stat.
4. **SMTP** — once user supplies credentials.

DoD per item: both `tsc` clean, permission map regenerated if routes change, e2e green, live smoke.
