# 📋 HRMS Deep Codebase Audit v2 — Fresh Analysis
**Date:** June 13, 2026  
**Scope:** 33 API modules, 55+ frontend components, 8 code searchers, 15+ files read in full  
**Method:** 8 parallel code-search agents sweeping every `.ts`, `.tsx`, `.js` file across `Hrms/apps/api/src/`, `Hrms/apps/web/`, `Hrms/packages/`

---

## 🔴 CRITICAL — Security & Credentials (3 findings)

### C1. Hardcoded Encryption Key in Production Code
**File:** `apps/api/src/common/crypto.util.ts:3`
```ts
const ENCRYPTION_KEY = process.env.OTP_SECRET || "skylinx-peopleos-local-otp-secret-long-enough-32-chars!!!";
```
**Also:** `packages/database/prisma/seed.ts:14` (same key duplicated)
**Impact:** PAN numbers, PF accounts, and bank account numbers are encrypted with this key. If `OTP_SECRET` env var is unset in production, all PII is encrypted with a public, well-known string. **Anyone with repo access can decrypt all employee PANs, PF accounts, and bank details.**
**Severity:** 🔴 CRITICAL — Data breach vector

### C2. Hardcoded Test Passwords in Scratch Files (Committed to Repo)
**Files:** Multiple in `scratch/` directory:
- `scratch/test_reports.js:53` — `"Skylinx@123"`
- `scratch/test_payroll_endpoints.js:11` — `"Skylinx@123"`
- `scratch/test_employees_endpoints.js:11` — `"Skylinx@123"`
- `scratch/run_integration_test.js:53` — `"Skylinx@123"`
- `scratch/update_password.js:6` — `"password123"`
- `smoke-test.js:40` — `"password123"`

**Impact:** Production passwords committed to version control. If the scratch directory isn't in `.gitignore`, these are in the git history permanently.
**Severity:** 🔴 CRITICAL — Credential leak

### C3. Hardcoded Default Passwords in Seed Data
**File:** `packages/database/prisma/seed.ts:9-11`
```ts
const HR_ADMIN_PASSWORD = process.env.HR_ADMIN_PASSWORD || "password123";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "password123";
```
**Impact:** If the seed runs without env vars, admin accounts have trivially guessable passwords.
**Severity:** 🔴 CRITICAL — If seed runs in production

---

## 🔴 CRITICAL — Tenant/Company ID Fallbacks Still Present (4 findings)

### C4. Recruitment Controller: `"default-company"` Fallback (4 endpoints)
**File:** `apps/api/src/modules/recruitment/recruitment.controller.ts:32,39,58,65`
```ts
const companyId = user.tenantId || "default-company";
```
**Impact:** If `user.tenantId` is null/undefined, requests silently fall through to a phantom `"default-company"` tenant, leaking data across tenants or creating orphaned records.
**Severity:** 🔴 CRITICAL — Multi-tenant data isolation breach

### C5. Fallback-Data Contains `company_skylinx` Hardcoded
**File:** `apps/web/lib/fallback-data.ts:177,341`
```ts
{ id: "company_skylinx", name: "PeopleOS", ... }
```
**Impact:** While this is fallback/mock data, it's used as the default company in SaaS console. If the API is unreachable, the frontend shows `company_skylinx` as a real company.
**Severity:** 🟡 MEDIUM — UI confusion, not data leak

### C6. Seed Data: `company_skylinx` Hardcoded Across 8+ Files
**File:** `packages/database/prisma/seed.ts:25,28,1184,1187`  
**Impact:** This is the seed file, so it's acceptable for dev/testing. But if seed runs in production, this becomes the only tenant.
**Severity:** 🟢 LOW (acceptable in seed)

### C7. ECR Challan: `pfWageCeiling` Fallback Still Present
**File:** `apps/api/src/modules/compliance/compliance.service.ts:72`
```ts
const pfCeiling = (pRules.pfWageCeiling as number) || 15000;
```
**Status:** ✅ FIXED — Now reads from Settings → `pRules.pfWageCeiling`  
**Note:** The `|| 15000` is a safe fallback if settings are not yet configured. This is correct behavior.

---

## 🔴 CRITICAL — Financial/Hardcoded Values Analysis (6 findings)

### C8. `ensurePlansSeeded()` Overwrites Admin Changes Every API Call
**File:** `apps/api/src/modules/saas/saas.service.ts:15,496-530`
```ts
async summary(user: AuthenticatedUser) {
    await this.ensurePlansSeeded();  // Called on EVERY summary() and selectPlan() request
    // ...
}
private async ensurePlansSeeded() {
    for (const p of planDetails) {
      await this.prisma.plan.upsert({
        update: {
          monthlyPrice: p.monthlyPrice,  // 1749, 3750, etc.
          // ... ALL fields overwritten
        }
      });
    }
}
```
**Impact:** **Every time** the SaaS console loads or a plan is selected, the DB plan rows are overwritten with hardcoded values. If an admin edits plan pricing in the DB, those changes are immediately reverted on the next page load. This is the **most significant remaining bug** — it makes DB-backed plans impossible.
**Severity:** 🔴 CRITICAL — Admin configuration changes silently destroyed

### C9. SaaS Plan Pricing Triple-Duplicated
Hardcoded prices appear in 3 independent locations:
1. `apps/api/src/modules/saas/saas.service.ts:496-497` — `monthlyPrice: 1749`, `monthlyPrice: 3750`
2. `apps/web/lib/fallback-data.ts:236,251,261,332` — `monthlyPrice: 1749`, `monthlyPrice: 3750`
3. `apps/web/app/signup/page.tsx:44-45` — `Standard: { price: 1749 }`, `Pro: { price: 3750 }`

**Impact:** Any pricing change requires editing 3+ files across backend and frontend. The signup page bypasses the API entirely and uses hardcoded prices.
**Severity:** 🔴 CRITICAL — Triple source of truth, pricing drift guaranteed

### C10. SaaS Console: `"Acme Corp"` Hardcoded in Billing
**File:** `apps/web/components/saas-console.tsx:261,632`
```tsx
Acme Corp<br />
PeopleOS HRMS<br />
```
**Impact:** All generated invoices/quotes show "Acme Corp" as the billing entity regardless of actual company name.
**Severity:** 🟡 MEDIUM — Unprofessional, client-facing

### C11. SaaS Audit Entity ID Uses `skylinx_` Prefix
**File:** `apps/api/src/modules/saas/saas.service.ts:312`
```ts
entityId: `skylinx_${plan.toLowerCase()}_${Date.now()}`
```
**Impact:** Audit logs for plan changes contain "skylinx" in the entity ID even for other tenants. Not a data leak but confusing for multi-tenant audit.
**Severity:** 🟢 LOW

### C12. Professional Tax: Hardcoded `> 15000` Threshold in Frontend
**File:** `apps/web/components/payroll-console.tsx:246`
```ts
const monthlyPt = monthlyCtc > 15000 ? 200 : 0;
```
**Impact:** The auto-calculate helper in the frontend bypasses the admin-configurable PT slabs from settings. If an admin changes PT slabs, the "Auto Calculate" button uses the hardcoded `15000` threshold.
**Severity:** 🟡 MEDIUM — Auto-calc shows wrong values if slabs are customized

### C13. Payslip Breakdown: Hardcoded 50/20/30 Split Fallback
**File:** `apps/web/components/payroll-console.tsx:1496-1500`
```tsx
<span>₹{Math.round(Number(selectedPayslip.grossPay) * 0.50)}</span>  // Basic
<span>₹{Math.round(Number(selectedPayslip.grossPay) * 0.20)}</span>  // HRA
```
**Impact:** When a payslip has no component breakdown, the UI fabricates numbers using 50% Basic, 20% HRA, 30% Allowance. These may not match the actual salary structure. Misleading to employees viewing their payslip.
**Severity:** 🟡 MEDIUM — Misleading payslip data

---

## 🟠 HIGH — Architecture & Code Quality (7 findings)

### H1. Settings System: `DEFAULT_RULES` vs DB Overwrite Race
**File:** `apps/api/src/modules/settings/settings.service.ts`
The `ensurePlansSeeded()` pattern (C8) creates a race condition: DB rules are merged with `DEFAULT_RULES`, but `ensurePlansSeeded()` overwrites the DB on every call. Any admin change made via `updateRules()` is immediately undone.

### H2. Multiple API Base URL Patterns in Frontend
Hardcoded fallback URLs found in **11 frontend files**:
- `apps/web/lib/api.ts:3` — `http://127.0.0.1:4000/api/v1`
- `apps/web/components/app-shell-frame.tsx:82` — same
- `apps/web/components/attendance-console.tsx:313` — same
- `apps/web/components/login-form.tsx:7` — same
- `apps/web/components/payroll-console.tsx:344` — same
- `apps/web/components/employees-console.tsx:355` — same
- `apps/web/components/settings-console.tsx:293` — same
- `apps/web/app/signup/page.tsx:73` — same

**Impact:** If `NEXT_PUBLIC_API_BASE_URL` is not set, all API calls go to `127.0.0.1:4000`. In production this will fail silently. The constant is duplicated 8+ times instead of being in a single config file.
**Severity:** 🟠 HIGH — Deployment risk, DRY violation

### H3. `dangerouslySetInnerHTML` Usage (2 instances)
**Files:**
- `apps/web/components/organization-console.tsx:108` — `<style dangerouslySetInnerHTML={{ __html: ... }}`
- `apps/web/components/policies-console.tsx:270` — `dangerouslySetInnerHTML={{ __html: selectedPolicy.contentHtml }}`

**Impact:** The policies console renders admin-authored HTML content directly into the DOM. If a malicious admin (or XSS in policy creation) injects script tags, they'll execute in the employee's browser.
**Severity:** 🟠 HIGH — XSS risk

### H4. Encryption Key Duplicated Between seed.ts and crypto.util.ts
**Files:** `packages/database/prisma/seed.ts:14` and `apps/api/src/common/crypto.util.ts:3`
Both files define the same `ENCRYPTION_KEY` with the same fallback. If the env var changes, one file might pick up the new value while the other doesn't (if the seed runs in a different process).
**Severity:** 🟠 HIGH — Encryption key inconsistency risk

### H5. `catch (e) {}` Empty Catch Blocks — Silent Failures
**File:** `apps/api/src/modules/employees/employees.service.ts:1008,1017,1026,1050,1063`
Five consecutive empty catch blocks in `getFfSuggestions()`:
```ts
try {
  const gratuityCalc = await this.prisma.gratuity.findFirst({...});
  if (gratuityCalc) { gratuityDues = Number(gratuityCalc.amount); }
} catch (e) {}   // Silent failure — if DB query fails, we silently use wrong gratuity amount

try {
  const encashments = await this.prisma.leaveEncashment.findMany({...});
  encashmentDues = encashments.reduce(...);
} catch (e) {}   // Silent — money calculation silently wrong
```
**Impact:** If any of these DB queries fail, the F&F statement silently uses wrong financial amounts. The employee could be underpaid or overpaid with no error log.
**Severity:** 🟠 HIGH — Silent financial miscalculation

### H6. Recruitment Controller Missing `@CurrentUser()` Decorator
**File:** `apps/api/src/modules/recruitment/recruitment.controller.ts:120,135,142,168,174`
Several endpoints don't use `@CurrentUser()`:
```ts
@Post("candidates")
createCandidate(@Body() body: CreateCandidateDto) { ... }  // No auth context

@Get("candidates")
listCandidates() { ... }  // No auth context

@Post("interviews")
scheduleInterview(@Body() body: CreateInterviewDto) { ... }  // No auth context
```
**Impact:** These endpoints have `@RequirePermissions` but no way to pass user context to the service. The service can't validate tenant ownership.
**Severity:** 🟠 HIGH — Auth context missing, tenant scoping bypassed

### H7. `attendance-console.tsx:317` — Token from Wrong Key
**File:** `apps/web/components/attendance-console.tsx:317`
```ts
Authorization: `Bearer ${localStorage.getItem("token")}`
```
But the session system uses key `"peopleos_access_token"` (defined in `lib/session.ts:3`). This means the geo-attendance upload always sends an undefined/empty token.
**Impact:** Direct file upload from the attendance console will always fail authentication.
**Severity:** 🟠 HIGH — Broken feature

---

## 🟡 MEDIUM — Frontend Hardcodes & Branding (9 findings)

### M1. Login Page: `"Acme Corp"` Alt Text on Logo
**File:** `apps/web/app/login/page.tsx:7`
```tsx
<img src="/skylinx-logo-display.png" alt="Acme Corp" className="..." />
```
**Also in:** `card-generator.tsx:258,281,299` (3 instances)

### M2. SaaS Console: `"Acme Corp"` in Multiple Places
**File:** `apps/web/components/saas-console.tsx:261,632`

### M3. Reference Workspaces: `"Acme Employee"`, `"Acme Corp"`, `"+1-800-555-0199"`
**File:** `apps/web/components/reference-workspaces.tsx:31,41,47,155`

### M4. Dashboard Page: Hardcoded `support@example.com` and Phone Number
**File:** `apps/web/app/dashboard/page.tsx:58,117`
```tsx
<div><strong>Support</strong> support@example.com</div>
<p>For HRMS queries contact support@example.com or call +1-800-555-0199.</p>
```

### M5. Support Console: `"support@example.com"` Hardcoded 6 Times
**File:** `apps/web/components/support-console.tsx:731,776,976`  
**Also:** `apps/web/app/api/send-support-email/route.ts:62-63`

### M6. Settings Console: `"support@example.com"` Fallback
**File:** `apps/web/components/settings-console.tsx:103,616`

### M7. SaaS Controller: `"support@skylinx.com"` Fallback
**File:** `apps/api/src/modules/saas/ssa.controller.ts:42`
```ts
supportEmail: branding.supportEmail || "support@skylinx.com",
```
**Also:** `apps/api/src/modules/settings/settings.service.ts:43` — `supportPhone: "+91-800-SKYLINX"`

### M8. Signup Page: `"skylinx"` as Placeholder
**File:** `apps/web/app/signup/page.tsx:246`
```tsx
placeholder="skylinx"
```

### M9. Logo Fallback Files: `skylinx-logo-display.png` Hardcoded
**Files:** `app-shell-frame.tsx:51,137,194`, `lib/api.ts:53`, `fallback-data.ts:145`
The logo error fallback always points to `skylinx-logo-display.png` or `skylinx-logo.png` instead of the tenant's custom logo.

---

## 🟡 MEDIUM — Operational Defaults Still Hardcoded (5 findings)

### M10. Attendance: `"09:30"` Hardcoded Fallback in 3 Layers
**Files:**
- `settings.service.ts:48` — `shiftStart: "09:30"` (DEFAULT_RULES)
- `attendance.service.ts:743` — `(shift.startTime || attendanceRule.shiftStart || "09:30")`
- `setup-wizard-console.tsx:40` — `shiftStart: "09:30"` (frontend fallback)

**Impact:** If all three layers of fallback are hit, attendance uses 09:30 regardless of settings. The `|| "09:30"` in `attendance.service.ts:743` is a third fallback on top of the already-fallbacked `attendanceRule.shiftStart`. This triple-layer creates drift risk.

### M11. Exit Notice Period: `90` Days Hardcoded as Fallback
**File:** `apps/api/src/modules/employees/employees.service.ts:984`
```ts
const noticeDays = Number(query?.noticeDays) || (isNaN(defaultNoticeDays) ? 90 : defaultNoticeDays);
```
**Impact:** If settings don't have `exitRules.defaultNoticeDays`, the F&F statement silently uses 90 days. The `isNaN` check catches `undefined` but the fallback is still hardcoded.

### M12. Ticket Queue: `"HR Helpdesk"` Default in Settings + 6 Hardcoded References
**File:** `settings.service.ts:120` — `defaultQueue: "HR Helpdesk"`  
**Also in frontend:** `support-console.tsx:82,133,166,195,246,264,894`

### M13. Referral Bonus: `25000` Default
**File:** `apps/web/components/recruitment-console.tsx:1517`
```tsx
<input defaultValue={25000} min={0} required />
```

### M14. Leave Settings: `annualQuota: 30` Default
**File:** `apps/web/components/leave-settings-console.tsx:71,112`
```ts
annualQuota: 30,
```
**Impact:** New leave types default to 30 days annual quota. Not configurable.

---

## 🟢 LOW — Code Quality & Misc (6 findings)

### L1. `console.log`/`console.error` Left in Production Code
**Files:** 49 instances across frontend:
- `support-console.tsx` — 5 instances
- `lifecycle-console.tsx` — 4 instances
- `payroll-console.tsx` — 2 instances
- `saas-console.tsx` — 2 instances
- Many more

### L2. `as any` Type Casts: 111+ Instances in Frontend
The frontend uses `as any` extensively (111 matches), weakening TypeScript's type safety. Examples:
- `employees-console.tsx` — 20+ `useState<any>()` declarations
- `payroll-console.tsx` — 15+ instances
- `leave-console.tsx` — 10+ instances

### L3. `localStorage` Key Inconsistency
The attendance console uses `"token"` (line 317) while the session system uses `"peopleos_access_token"`. This is a **bug** (see H7).

### L4. `nul` File in Root Directory
**File:** `Hrms/nul` — A Windows artifact file (`nul` is the Windows null device).

### L5. Duplicate Frontend API Files
Both `apps/web/lib/api.ts` and `apps/web/lib/client-api.ts` exist with overlapping functionality and duplicated API base URL configuration.

### L6. `@ts-ignore` / `@ts-expect-error` Not Found
Good news — no TypeScript suppression directives found.

---

## 📊 Summary Statistics

| Category | Count | Severity |
|----------|-------|----------|
| 🔴 CRITICAL Security/Credentials | 3 | Must fix now |
| 🔴 CRITICAL Tenant Fallbacks | 2 | Must fix now |
| 🔴 CRITICAL Financial Hardcodes | 3 | Must fix now |
| 🟠 HIGH Architecture/Code | 7 | Should fix soon |
| 🟡 MEDIUM Frontend Branding | 9 | Should fix |
| 🟡 MEDIUM Operational Defaults | 5 | Should fix |
| 🟢 LOW Code Quality | 6 | Nice to fix |
| **TOTAL** | **35** | |

---

## 🎯 Prioritized Fix Order

### Batch 1 — SECURITY & DATA ISOLATION (Immediate)
1. **C1** — Fix encryption key: must require `OTP_SECRET` env var, no fallback
2. **C2** — Add `scratch/` to `.gitignore`, rotate committed passwords
3. **C3** — Remove hardcoded password defaults from seed
4. **C4** — Fix recruitment controller: throw if `tenantId` is missing instead of `"default-company"` fallback
5. **H7** — Fix attendance console token key: `"token"` → `"peopleos_access_token"`

### Batch 2 — SaaS PLAN SYSTEM (Critical Business Logic)
6. **C8** — Remove `ensurePlansSeeded()` auto-overwrite. Only seed if no plans exist (check count first)
7. **C9** — Remove hardcoded prices from signup page (read from `/saas/plans` API)
8. **C10** — Replace `"Acme Corp"` in invoices with dynamic company name

### Batch 3 — FINANCIAL ACCURACY
9. **H5** — Add proper error logging to empty catch blocks in F&F suggestions
10. **C12** — Wire frontend auto-calculate to use admin-configured PT slabs
11. **C13** — Remove fabricated payslip breakdown when components are unavailable

### Batch 4 — CODE QUALITY & BRAND
12. **H2** — Consolidate API base URL into single config file
13. **M1-M9** — Replace all `"Acme Corp"`, `"support@example.com"`, `"skylinx-logo"` with dynamic values from settings
14. **L2** — Gradually replace `as any` with proper types

---

*Generated by deep codebase analysis with 8 parallel search agents across 33 API modules and 55+ frontend components.*
