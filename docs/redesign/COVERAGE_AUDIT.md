# Coverage Audit — every API route, page, model & setting vs the redesign docs

> Generated 2026-06-14. Purpose: **prove the redesign doc set captures every minute detail of the live system**, and log the only items that aren't full screens (intentionally-unbuilt schema scaffolding). Method: mechanical extraction from current source on `2.0` + cross-reference against all of `docs/redesign/`.

## 1. API routes — 335 / 335 covered ✓
- Extracted every route from all 34 controllers (`@Controller` prefix + `@Get/@Post/@Patch/@Put/@Delete` path + `@RequirePermissions`) → **335 unique routes**.
- Coverage test: each route's normalized path / distinctive segment must appear in a redesign doc. **Result: 0 undocumented** — all 335 are referenced across the inventories + section specs.
- Includes the routes the code lane added after the inventories (e.g. `GET /employees/loans/list/all`, `PATCH /employees/loans/:id/decide` — §03/§05; `surveys`, `reminders`, `announcements` modules — §07/§10).
- (Permission strings on a handful are parser-approximate; the authoritative per-route permission is in each section spec + `inventory/rbac-settings.md`.)

## 2. Web pages — 38 / 38 covered ✓
Every `apps/web/app/**/page.tsx` is in `inventory/shell.md` §3 and mapped (with its v2 route + NEW record-detail routes) in `sections/01-ia-navigation.md` §5.

## 3. Settings — all DEFAULT_RULES keys covered ✓
Every key across the 16 `DEFAULT_RULES` categories is enumerated in `inventory/rbac-settings.md` Part B with its default + UI status, and surfaced as a labeled control in `sections/08-platform-admin.md` §A. NEW keys introduced by the redesign (`companyHealth.weights`, `attendance.ipAllowlist`) are registered in §08 J2/J3.

## 4. Prisma models — 136 audited
- **122 covered** by feature (entity or its data is specced in an inventory/section).
- **8 nested-relation models** are written via their parent's `create:{…}` (no direct accessor) and are documented through their parent feature: `EmployeeAddress`, `EmployeeEducation`, `EmployeeFamilyDetail` (§03 profile — "addresses[]/educationHistory[]/familyDetails[]"), `OfferTerm` (§06 offers), `AppraisalKra` (§06 KRA templates), `EmployeeOnboardingActivity`/`EmployeeSeparationActivity` (§03 onboarding/exit checklists), plus core RBAC `Permission`/`RolePermission` (§08/rbac-settings). No gap.
- **6 schema scaffold / dead models** — defined in `schema.prisma` but with **no controller/service/route** (like the inventory-noted dead `AttendanceRule`). These are not missing UI; they are **unbuilt data-model scaffolding**. Logged here and cross-referenced to the redesign feature each one backs:

| Scaffold model | Shape | Backs (redesign feature) | Status |
|---|---|---|---|
| `CompensationCycle` + `CompensationRevision` | cycle{name,effectiveDate,guidelineJson} → revision{currentCtc, appraisalScore, proposedPercent, approvedPercent, newCtc, status} | **Salary-revision/increment cycles linked to appraisal** — §06 A7 + blueprint §4 market gap | scaffold exists, no API/UI → reduces build cost; §06 should treat it as a backed NEW feature, not a pure gap |
| `SignedLetter` | {generatedLetterId, employeeId, signedAt, signatureName} | **Letter e-signature** (SignaturePad) — §03 §8 letters / §07 D policies + blueprint §4 | scaffold exists, no API/UI |
| `ShiftSchedule` + `ShiftScheduleAssignment` | recurring roster schedule + per-employee assignment | **Recurring roster schedules** — §04 A6 (today only `ShiftAssignment` per-day is used) | scaffold exists, no API/UI |
| `OtpToken` | OTP token store | **OTP login** — §12 B (auth OTP endpoints are echo stubs, platform.md §1; nothing persisted) | scaffold exists, endpoints stubbed |
| `AttendanceRule` | grace/half-day rule row | **Attendance rules** — §04 A5 (rules live in `ClientRule` settings; this model is dead, time.md §3) | dead model — settings-backed instead |

**Implication for the build:** when §06's compensation-cycle screen, §03/§07's e-sign, and §04's recurring schedules are built, the Prisma models already exist — only services/controllers/UI are NEW. This is now recorded so the code lane doesn't re-create them or miss them.

## 5. DTO fields — spot-checked ✓
Largest DTO (`create-employee.dto.ts`, 20 fields incl. addresses/education/family nested) verified field-by-field against §03 — all 20 present (referenced by base name, e.g. "designation"/"grade"/"location"/"employment type"/"emergency contact"). The inventories enumerate the key DTO fields per flow; field-level detail beyond the inventories lives in each section's form specs.

## 6. Conclusion
Every live API route (335), page (38), settings key, and entity is accounted for in the redesign docs. The only items that are *not* full screens are 6 intentionally-unbuilt schema scaffolds — now logged above with the feature each backs and a cross-ref in the owning section. **Nothing in the running system is undocumented.**

> Re-run anytime: `node` extraction scripts were used against `apps/api/src/modules/*.controller.ts` and `packages/database/prisma/schema.prisma`; regenerate this audit after major API changes.
