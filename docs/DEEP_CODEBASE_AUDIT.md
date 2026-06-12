# 🔍 Deep Codebase Audit Report — SKYLINX PeopleOS HRMS

**Generated:** June 12, 2026
**Scope:** Full codebase sweep across `apps/api/src/`, `apps/web/`, `packages/database/prisma/`, `packages/shared/src/`
**Severity Legend:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW / Informational

---

## TABLE OF CONTENTS

1. [CRITICAL — Hardcoded Financial/Policy Values](#1-critical--hardcoded-financialpolicy-values)
2. [CRITICAL — Tenant/Brand Hardcodes](#2-critical--tenantbrand-hardcodes)
3. [CRITICAL — Security-Adjacent Issues](#3-critical--security-adjacent-issues)
4. [HIGH — Misleading Comments & False Settings Claims](#4-high--misleading-comments--false-settings-claims)
5. [HIGH — Inconsistent Dual Computation Paths](#5-high--inconsistent-dual-computation-paths)
6. [MEDIUM — Hardcoded Operational Defaults](#6-medium--hardcoded-operational-defaults)
7. [MEDIUM — Frontend Hardcoded UI Values](#7-medium--hardcoded-ui-values-that-should-be-configurable)
8. [MEDIUM — Dead / Stub Endpoints & Unreachable Code](#8-medium--dead--stub-endpoints--unreachable-code)
9. [LOW — Code Quality & Hygiene Issues](#9-low--code-quality--hygiene-issues)
10. [Acceptable As-Is](#10-acceptable-as-is)

---

## 1. CRITICAL — Hardcoded Financial/Policy Values

These values directly affect money, compliance filings, and employee compensation. They must be read from `SettingsService` / DB.

| # | File | Line(s) | Issue | Impact |
|---|------|---------|-------|--------|
| 1.1 | `employees.service.ts` | 763-785 | **Promotion salary calc uses hardcoded ratios**: `basicPct=0.40`, `hraPct=0.50`, `pfRate=0.12`, `pfWageCeiling=15000`, `esiRate=0.0075`, `esiWageCeiling=21000`, `TDS=0.05` — **never reads from SettingsService** despite the comment saying "defaults match admin-configurable Settings". Comment is misleading. | Promotions create salary structures with wrong ratios if admin changes settings. **Money impact.** |
| 1.2 | `employees.service.ts` | 544, 895-899 | **F&F gratuity uses hardcoded `15/26` formula** with 5-year eligibility threshold. Does NOT read GratuityRule from DB. | Different employees get different gratuity depending on which module computes it. **Legal/compliance risk.** |
| 1.3 | `compliance.service.ts` | 73 | **PF wage ceiling `₹15,000` hardcoded in ECR challan export**: `const epsWages = Number(s.basic) > 15000 ? 15000 : Number(s.basic)` | If admin changes PF ceiling in Settings, payroll obeys but **government filing does not**. Compliance violation. |
| 1.4 | `performance.service.ts` | 421-436 | **Increment threshold `4.0` and increment percentage `1.10` (10%) hardcoded**: `const threshold = data.incrementThreshold \|\| 4.0` then `revisedCtc: currentCtc * 1.10` — comment says "admin-configurable via Settings" but never reads it. | Performance appraisals auto-create promotions with wrong increment %. |
| 1.5 | `attendance.service.ts` | 84 | **Geofence radius `200` meters hardcoded**: `if (distance <= 200)` — not configurable per location or globally. | Admin cannot adjust geofence radius without code change. |
| 1.6 | `saas.service.ts` | 47-78, 498-499 | **All plan pricing hardcoded**: Basic ₹0, Standard ₹1,749, Pro ₹3,750 — duplicated in `ensurePlansSeeded()`, `summary()`, and `billingSummaryForPlan()`. The `ensurePlansSeeded()` function overwrites any admin price changes on every call. | **Pricing cannot be changed by admin.** Even if updated in DB, it gets overwritten. |
| 1.7 | `saas.service.ts` | 180, 184 | **Invoice/license audit logs hardcode `1749`**: `return this.audit(user, "invoice.queue", "PENDING", 1749)` | Audit trail shows wrong amount for Pro plan users. |
| 1.8 | `payroll.service.ts` | 1498-1512 | **Tax calculation slab fallback hardcodes New Regime slabs**: Falls back to hardcoded slabs if DB slabs are empty, rather than requiring admin configuration. | Tax miscalculation if admin forgets to configure slabs. |
| 1.9 | `payroll.service.ts` | 750-751 | **Professional Tax default `₹200` hardcoded** when no PT slabs configured: `professionalTax = grossSalary > num(payrollRules.pfWageCeiling, 15000) ? 200 : 0` | Wrong PT deducted if admin configures different slabs. |
| 1.10 | `payroll.service.ts` | 823, 836, 842 | **Tax cess rate `0.04` (4%) hardcoded** in income tax computation: `const cess = taxLiability * 0.04` instead of reading from `taxCalc.cessPct`. | Cess miscalculation if rate changes. |

---

## 2. CRITICAL — Tenant/Brand Hardcodes

These create data integrity issues in multi-tenant scenarios and wrong branding for white-label customers.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 2.1 | `employees.service.ts` | 170 | **`"clq_default_company"` fallback in bulk upload**: `const companyId = TenantContext.getTenantId() \|\| "clq_default_company"` — employees get wrong tenant. |
| 2.2 | `performance.service.ts` | 105, 193, 285 | **`"comp_skylinx"` fallback ×3**: `companyId = firstCompany?.id \|\| "comp_skylinx"` — appraisal cycles/templates created under wrong company. |
| 2.3 | `recruitment.controller.ts` | 32, 39, 58, 65 | **`"default-company"` fallback ×4**: `const companyId = user.tenantId \|\| "default-company"` — job postings under wrong tenant. |
| 2.4 | `lib/session.ts` | 22, 26, 28 | **`"company_skylinx"` fallback ×3**: Frontend session resolution falls back to hardcoded tenant. |
| 2.5 | `lib/api.ts` | 51-53 | **`"Acme Corp"` / `"SKYLINX"` hardcoded** as fallback company identity in frontend API helper. |
| 2.6 | `support-console.tsx` | 731, 776, 976 | **`support@skylinx.com` hardcoded ×6** across support dashboard — not read from company settings. |
| 2.7 | `app/layout.tsx` | 6-7 | **`"SKYLINX PeopleOS"` hardcoded** as page title and description — white-label customers get wrong branding. |
| 2.8 | `seed.ts` | 29-31 | **Seed data hardcodes `"SKYLINX PeopleOS"`, `"SKYLINX HR Private Limited"`, `"/skylinx-logo.png"`** — expected for seed but must not leak to runtime. |
| 2.9 | `card-generator.tsx` | 258, 281, 299 | **`alt="Acme Corp"` on card images ×3** — wrong alt text for all card templates. |
| 2.10 | `login/page.tsx` | 7 | **`alt="Acme Corp"` on login logo** — wrong alt text. |

---

## 3. CRITICAL — Security-Adjacent Issues

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 3.1 | `saas-console.tsx` | 41-45 | **Coupon codes hardcoded in frontend JS**: `SKYLINX10` (10% off), `ANNUAL15` (15% off), `LAUNCH20` (20% off) — **anyone can read them in browser DevTools**. Must be validated server-side only. |
| 3.2 | `employees.service.ts` | 1212 | **Temp password pattern `Skylinx@XXXX`** predictable — `Skylinx@${Math.floor(1000 + Math.random() * 9000)}` |
| 3.3 | `crypto.util.ts` | 3 | **Fallback encryption key**: `"skylinx-peopleos-local-otp-secret-long-enough-32-chars!!!"` — used if `OTP_SECRET` env var not set. This is a published key in source code. |
| 3.4 | `seed.ts` | 14 | **Same hardcoded encryption key** in seed script. |

---

## 4. HIGH — Misleading Comments & False Settings Claims

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 4.1 | `employees.service.ts` | 760 | Comment says `"defaults match admin-configurable Settings → Payroll"` but the code **never reads settings**. The ratios (0.40, 0.50, 0.12) are hardcoded. |
| 4.2 | `employees.service.ts` | 765 | Comment `"pfWageCeiling from settings"` but uses `15000 * 12` literal. |
| 4.3 | `employees.service.ts` | 785 | Comment `"defaultTdsPct from settings"` but uses `0.05` literal. |
| 4.4 | `performance.service.ts` | 434 | Comment `"admin-configurable via Settings → salaryStructure.performanceIncrementPct"` but code uses `1.10` literal. |
| 4.5 | `payroll.service.ts` | 803 | Comment `"Fallback to old hardcoded slabs if DB slabs are empty"` — acknowledges the problem but leaves it. |

---

## 5. HIGH — Inconsistent Dual Computation Paths

| # | Files | Issue |
|---|-------|-------|
| 5.1 | `employees.service.ts:544` vs `payroll.service.ts:1143-1171` | **Gratuity computed differently**: Employees service uses hardcoded `15/26` with 5yr eligibility. Payroll service reads `GratuityRule` from DB. Same employee, different amount. |
| 5.2 | `employees.service.ts:763-785` vs `payroll.service.ts:698-768` | **Salary structure on promotion vs payroll run**: Promotion creates structure with hardcoded ratios. Payroll run reads from SettingsService. Different outputs. |
| 5.3 | `attendance.service.ts:96` vs `attendance.service.ts:605` vs `attendance.service.ts:730-739` | **3 independent layers** for shift start / grace fallback: `checkIn()` uses `shift.startTime \|\| "09:30"`, `processAutoAttendance()` also uses `"09:30"`, and `evaluateAnomalies()` reads from settings with `"09:30"` fallback. These can drift apart. |

---

## 6. MEDIUM — Hardcoded Operational Defaults

| # | File | Line(s) | Value | Should Be |
|---|------|---------|-------|-----------|
| 6.1 | `attendance.service.ts` | 312-314 | Anomaly penalty mapping: ABSENT→FULL_DAY (1 day), else→HALF_DAY (0.5 day) | Configurable penalty rules |
| 6.2 | `employees.service.ts` | 542 | Exit notice period default `90` days | Read from settings |
| 6.3 | `tickets.service.ts` | 26, 28 | Ticket number format `TKT-random`, default queue `"HR Helpdesk"` | Configurable |
| 6.4 | `payroll-console.tsx` | 115, 232-238, 477, 879 | Form defaults: CTC `₹6L`, basic 50%, HRA 40%, PF 12%, PT ₹200 | Read from settings |
| 6.5 | `compliance-dash.tsx` | 80, 90 | FY default `"2026-2027"`, benefit max `₹25,000` hardcoded | Dynamic / from settings |
| 6.6 | `performance-console.tsx` | 90 | Increment threshold `4.0` hardcoded in state | Read from settings |
| 6.7 | `recruitment-console.tsx` | 404, 991 | Notice period `"90 days"` in offer text | Configurable |
| 6.8 | `recruitment-console.tsx` | 1509 | Referral bonus default `₹25,000` | Configurable |
| 6.9 | `leave-settings-console.tsx` | 812 | Backdated leaves limit default `90` days | Configurable |
| 6.10 | `support-console.tsx` | 82, 133, 166, 195, 246, 264 | Default queue `"HR Helpdesk"` ×6 | Configurable |
| 6.11 | `settings-console.tsx` | 65, 89, 93-94 | PT slab defaults, PF ceiling `₹15,000`, TDS slabs — frontend defaults only (OK for pre-fill, but must sync with backend) | Consistent with backend |

---

## 7. MEDIUM — Hardcoded UI Values That Should Be Configurable

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 7.1 | `saas-console.tsx` | 41-45 | Coupon codes in frontend — move to server-side |
| 7.2 | `app-shell-frame.tsx` | 51, 135, 192 | Logo fallback `/skylinx-logo-display.png` — should use company logo from settings |
| 7.3 | `api.ts` | 51-53 | Fallback company `name: "SKYLINX"`, `legalName: "Acme Corp"` — inconsistent (one is Skylinx, one is Acme) |
| 7.4 | `reference-workspaces.tsx` | 47, 31, 41, 155, 497, 528, 531 | Demo data: `"Acme Employee"`, `"Acme Corp"`, `₹1,749/month` — acceptable for demo but should be conditional |
| 7.5 | `skynexus-console.tsx` | 458 | Placeholder `"Share something with your team at SKYLINX..."` — not configurable |
| 7.6 | `settings-tabs-container.tsx` | 30 | Branding label hardcoded `"SKYLINX"`, note `"Logo locked"` |
| 7.7 | `organization-console.tsx` | 64-77 | Employee avatar URLs hardcoded by employee name (`aarav`, `mehta`, etc.) — should use DB profile photos |
| 7.8 | `signup/page.tsx` | 44-45 | Plan prices `₹1,749` / `₹3,750` hardcoded in frontend signup page |
| 7.9 | `fallback-data.ts` | 236, 251, 261, 332 | Plan prices `1749` / `3750` hardcoded in frontend fallback data |
| 7.10 | `action-panels.tsx` | 447 | Default insurance provider `"SKYLINX Group Health"` hardcoded |

---

## 8. MEDIUM — Dead / Stub Endpoints & Unreachable Code

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 8.1 | `saas.service.ts` | 180, 184 | `createInvoice()` and `refreshLicense()` are stub endpoints that just create audit logs — no actual invoice/license logic |
| 8.2 | `leave-settings-console.tsx` | 879 | `alert("Excel/CSV template assignment import triggered.")` — UI button shows alert instead of real import |
| 8.3 | `employees.service.ts` | 909, 918, 927, 951, 964 | **5 empty `catch (e) {}` blocks** in `getFfSuggestions()` — silently swallows errors from Gratuity, LeaveEncashment, Loan, PayrollRun, and CompanyAsset queries |
| 8.4 | `reminders.service.ts` | 83, 220 | **Empty `catch (e) {}` blocks** — silently ignores errors |
| 8.5 | `organization-console.tsx` | 64-77 | Avatar fallback function `getAvatarUrl()` is a local function with hardcoded name→URL mapping — will never work for real employee data |

---

## 9. LOW — Code Quality & Hygiene Issues

| # | File | Issue |
|---|------|-------|
| 9.1 | `api.ts` vs `fallback-data.ts` | **Inconsistent fallback branding**: `api.ts` says `legalName: "Acme Corp"` while `fallback-data.ts` says `"Your Company Private Limited"` |
| 9.2 | `saas.service.ts` | Plan pricing duplicated in 3 places: `summary()` array (lines 47-78), `ensurePlansSeeded()` (lines 498-499), and `billingSummaryForPlan()` — single source of truth should be DB |
| 9.3 | `payroll-console.tsx` | Line 1487 computes `grossPay * 0.50` for "basic" display but line 1523 computes `deductions * 0.40` for "HRA" display — both wrong formulas for display (should come from salary structure) |
| 9.4 | `compliance.service.ts` | ESI export mock uses `providentFundAccount` as ESI IP number (line 78) — field mismatch |
| 9.5 | `nul` file | `Hrms/nul` — spurious file in project root (Windows artifact) |
| 9.6 | `temp_doc.txt` | `Hrms/temp_doc.txt` — temp file should be gitignored |
| 9.7 | `employees.service.ts` | `bulkUpload()` method (line 170) uses CSV parser while `bulkUploadExcel()` (line 1160+) uses XLSX — two separate upload paths that could be unified |

---

## 10. Acceptable As-Is

These were checked and found acceptable:

- **ID generation formats** (`TXN_`, `JOB_`, `EMP`, `TKT-`): Infrastructure constants, not user-facing config
- **Leave type form defaults** (form pre-fills only, fully editable by admin)
- **Demo/reference workspace content** (`reference-workspaces.tsx`): Clearly demo content
- **SLA fallback values** in settings: Match the DEFAULT_RULES which are overridden by DB
- **Seed data** (`seed.ts`): Intentional demo data, expected to be replaced
- **E2E test emails** (`admin@example.com`): Test fixtures, not production
- **`DEFAULT_RULES` in `settings.service.ts`**: These are proper fallback defaults that get overridden by DB ClientRule rows — this is correct architecture

---

## RECOMMENDED FIX ORDER

### Batch 1 — Critical (Must Fix)
1. **Wire promotion salary calc through SettingsService** (1.1)
2. **Unify gratuity computation** — make employees.service.ts read from GratuityRule DB (1.2)
3. **Read PF ceiling from settings in compliance export** (1.3)
4. **Read performance increment from settings** (1.4)
5. **Make geofence radius configurable** (1.5)
6. **Move SaaS plan pricing to DB** — prevent `ensurePlansSeeded()` from overwriting (1.6, 1.7)
7. **Move coupon codes server-side** (3.1)
8. **Kill all hardcoded tenant fallbacks** (2.1-2.4)
9. **Remove misleading "from settings" comments** or wire them through (4.1-4.5)

### Batch 2 — High / Medium
10. **Unify attendance shift fallback** — single source of truth for shift start/grace (5.3)
11. **Remove empty catch blocks** — add proper error logging (8.3, 8.4)
12. **Fix display formulas in payroll-console.tsx** (9.3)
13. **Replace hardcoded brand strings with company settings** throughout frontend
14. **Make operational defaults configurable** (Section 6)
15. **Fix invoice/license stubs** or remove them (8.1)

---

*This audit was generated by deep codebase analysis using parallel code searchers across all TypeScript, TSX, and JS files in the project.*
