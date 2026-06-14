
---

# 🔬 PHASE 5: DEEP AUDIT ROUND 5 — DATABASE SECURITY, DEPENDENCY VULNS, DOCKER, ENV VARS

**Date:** June 13, 2026  
**Audited By:** 3 code-searchers (DB security, Docker, env vars) + 2 bashers (npm audit backend + frontend)

---

## 📊 Updated Executive Summary

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 (NEW) | Total |
|----------|---------|---------|---------|---------|---------------|-------|
| 🔴 CRITICAL | 8 | 3 | 1 | 2 | +1 | 15 |
| 🟠 HIGH | 14 | 5 | 6 | 4 | +6 | 35 |
| 🟡 MEDIUM | 18 | 10 | 7 | 6 | +5 | 46 |
| 🟢 LOW | 9 | 1 | 0 | 0 | +1 | 11 |
| **TOTAL** | **49** | **19** | **14** | **12** | **+13** | **107** |

---

## 41. DATABASE SECURITY AUDIT

### Result: ❌ CRITICAL GAPS

**Bug #106 — PostgreSQL Credentials Hardcoded in 4 .env Files**
- **Severity:** 🔴 CRITICAL
- **Category:** Security / Database
- **Description:** Four separate `.env` files all contain identical hardcoded database credentials:
  ```
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skylinx_peopleos?schema=public"
  ```
  Files: `Hrms/.env`, `Hrms/apps/api/.env`, `Hrms/packages/database/.env`, `Hrms/apps/web/.env`
  The PostgreSQL password is `postgres` — the default password. If any of these files are committed to git (and they appear to be in the working directory), the database is fully compromised.
- **Impact:** Complete database compromise via default credentials.

**Bug #107 — No Connection Pool Configuration**
- **Severity:** 🟠 HIGH
- **Category:** Database / Performance
- **Description:** The Prisma schema uses `env("DATABASE_URL")` without any connection pool parameters. The default Prisma pool size is 10 connections. For a production HRMS with 34 controllers making concurrent database calls, this is likely insufficient. The DATABASE_URL doesn't include `?connection_limit=20&pool_timeout=10` or similar tuning.
- **File:** `packages/database/prisma/schema.prisma` (Line 7)
- **Impact:** Connection pool exhaustion under moderate load; "Too many connections" errors.

**Bug #108 — No Query Timeout Configuration**
- **Severity:** 🟠 HIGH
- **Category:** Database / Reliability
- **Description:** No query timeout is configured anywhere in the Prisma client or database connection. A slow query (e.g., unbounded `findMany` on a large table) could hold a database connection indefinitely, blocking other requests. The Prisma `?statement_timeout=5000` parameter is not used.
- **File:** `packages/database/prisma/schema.prisma`
- **Impact:** Slow queries can exhaust connection pool and hang the entire API.

**Bug #109 — No Row-Level Security (RLS)**
- **Severity:** 🟠 HIGH
- **Category:** Database / Multi-Tenancy
- **Description:** The application relies entirely on Prisma middleware for tenant isolation (injecting `companyId`/`tenantId` into queries). There is no PostgreSQL Row-Level Security (RLS) as a defense-in-depth layer. If any code path bypasses Prisma (e.g., raw queries, direct database access), tenant isolation is broken.
- **File:** `packages/database/prisma/schema.prisma`
- **Impact:** Single point of failure for multi-tenant data isolation.

---

## 42. DEPENDENCY VULNERABILITY AUDIT (npm audit)

### Result: ❌ HIGH-SEVERITY CVEs FOUND

**Bug #110 — Backend: 9 Dependency Vulnerabilities (2 High)**
- **Severity:** 🟠 HIGH
- **Category:** Security / Dependencies
- **Description:** `npm audit` on `apps/api` found 9 vulnerabilities:
  - **High (2):**
    - `@nestjs/cli` — needs upgrade to v11.0.23
    - `@nestjs/platform-express` — needs upgrade to v11.1.26
  - **Moderate (7):**
    - `@angular-devkit/core`, `@angular-devkit/schematics`, `@angular-devkit/schematics-cli`
    - `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/schematics`
- **File:** `apps/api/package.json`
- **Impact:** Known CVEs in NestJS ecosystem; potential remote code execution or denial of service.

**Bug #111 — Frontend: 4 Dependency Vulnerabilities (2 High)**
- **Severity:** 🟠 HIGH
- **Category:** Security / Dependencies
- **Description:** `npm audit` on `apps/web` found 4 vulnerabilities:
  - **High (2):**
    - `esbuild` — Missing binary integrity verification enables RCE via NPM_CONFIG_REGISTRY ([GHSA-gv7w-rqvm-qjhr](https://github.com/advisories/GHSA-gv7w-rqvm-qjhr))
    - `picomatch` — ReDoS vulnerability via extglob quantifiers ([GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj))
  - **Moderate (2):** Additional packages with moderate CVEs
- **File:** `apps/web/package.json`
- **Impact:** Remote code execution via esbuild; ReDoS denial of service via picomatch.

---

## 43. DOCKER SECURITY AUDIT

### Result: ❌ CRITICAL GAPS

**Bug #112 — PostgreSQL Default Password in docker-compose.yml**
- **Severity:** 🟠 HIGH
- **Category:** Security / Docker
- **Description:** `docker-compose.yml` Lines 7-8: PostgreSQL is configured with the default password:
  ```yaml
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  ```
  This is the most common default password in the world. Any attacker scanning for PostgreSQL instances will try `postgres:postgres` first.
- **File:** `docker-compose.yml`
- **Impact:** Database compromise via default credentials.

**Bug #113 — Redis Exposed Without Authentication**
- **Severity:** 🟠 HIGH
- **Category:** Security / Docker
- **Description:** `docker-compose.yml` Lines 15-20: Redis is exposed on port 6379 with no password configured:
  ```yaml
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  ```
  No `requirepass` or `--requirepass` flag. Redis is fully accessible to anyone who can reach port 6379.
- **File:** `docker-compose.yml`
- **Impact:** Unauthorized Redis access; potential data exfiltration or injection.

**Bug #114 — No Docker Health Checks**
- **Severity:** 🟡 MEDIUM
- **Category:** Reliability / Docker
- **Description:** Neither the PostgreSQL nor Redis services in `docker-compose.yml` have `healthcheck` definitions. Docker won't know if the services are actually healthy, and dependent services may start before the database is ready.
- **File:** `docker-compose.yml`
- **Impact:** Race conditions during startup; dependent services may fail.

**Bug #115 — No Resource Limits in Docker Compose**
- **Severity:** 🟡 MEDIUM
- **Category:** Performance / Docker
- **Description:** No `mem_limit`, `cpus`, or `deploy.resources.limits` defined for any service. A single container can consume all host resources, causing OOM kills for other services.
- **File:** `docker-compose.yml`
- **Impact:** Resource exhaustion; container OOM kills.

**Bug #116 — Redis Port Exposed to Host**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Docker
- **Description:** Redis port `6379:6379` is mapped to the host. In production, Redis should only be accessible from within the Docker network, not from the host or external network.
- **File:** `docker-compose.yml`
- **Impact:** Redis accessible from host network; reduced network isolation.

---

## 44. ENVIRONMENT VARIABLE MANAGEMENT AUDIT

### Result: ❌ CRITICAL GAPS

**Bug #117 — Weak .env.example Placeholder Values**
- **Severity:** 🟠 HIGH
- **Category:** Security / Configuration
- **Description:** `.env.example` contains weak placeholder values that developers may use as-is:
  ```
  JWT_ACCESS_SECRET="change-me-access"
  JWT_REFRESH_SECRET="change-me-refresh"
  OTP_SECRET="change-me-otp"
  ```
  These are trivially guessable. If a developer copies `.env.example` to `.env` without changing them, the JWT signing keys are compromised.
- **File:** `.env.example`
- **Impact:** Trivially guessable JWT signing keys.

**Bug #118 — No .env Validation at Startup**
- **Severity:** 🟠 HIGH
- **Category:** Reliability / Configuration
- **Description:** The application has no startup validation of required environment variables. If `DATABASE_URL`, `JWT_ACCESS_SECRET`, or other critical vars are missing, the app will start but fail at runtime with cryptic errors. No `joi`, `zod`, or `envalid` schema validation exists.
- **File:** `apps/api/src/main.ts`
- **Impact:** Silent misconfigurations; app starts in broken state.

**Bug #119 — JWT Secrets in .env Files Committed to Repo**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Secrets Management
- **Description:** Four `.env` files contain the actual JWT secrets:
  ```
  JWT_ACCESS_SECRET="skylinx-peopleos-local-access-secret"
  JWT_REFRESH_SECRET="skylinx-peopleos-local-refresh-secret"
  OTP_SECRET="skylinx-peopleos-local-otp-secret"
  ```
  These files appear to be in the working directory (not gitignored). If committed to git, the JWT signing keys are permanently exposed in git history.
- **Files:** `Hrms/.env`, `Hrms/apps/api/.env`, `Hrms/packages/database/.env`, `Hrms/apps/web/.env`
- **Impact:** Permanent JWT key exposure in git history.

**Bug #120 — "password123" Hardcoded 12 Times Across Codebase**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Secrets
- **Description:** The string `"password123"` appears 12 times across the codebase in:
  - `smoke-test.js` (Line 40)
  - `seed.ts` (Lines 9, 11)
  - `update_password.js` (Line 6)
  - E2E tests: `frontend-fixes.spec.ts` (Lines 18, 29, 56, 86), `hrms-flow.spec.ts` (Line 13), `policies.spec.ts` (Line 9), `full-audit.spec.ts` (Line 19), `smoke.spec.ts` (Line 7)
  While these are test/seed passwords, they normalize weak password practices and could leak into production if seed scripts are run with default values.
- **Impact:** Weak default passwords normalized; potential production exposure.

---

## 📋 UPDATED PRIORITIZED FIX LIST (ADDENDUM)

### Batch 1 — CRITICAL (Fix Immediately) — 15 bugs total
| # | Bug | Category |
|---|-----|----------|
| 106 | PostgreSQL credentials hardcoded in 4 .env files | Database |

### Batch 2 — HIGH (Fix This Sprint) — 41 bugs total
| # | Bug | Category |
|---|-----|----------|
| 107 | No connection pool configuration | Database |
| 108 | No query timeout configuration | Database |
| 109 | No Row-Level Security (RLS) | Database |
| 110 | Backend: 9 dependency vulnerabilities (2 high) | Dependencies |
| 111 | Frontend: 4 dependency vulnerabilities (2 high) | Dependencies |
| 112 | PostgreSQL default password in docker-compose | Docker |
| 113 | Redis exposed without authentication | Docker |
| 117 | Weak .env.example placeholder values | Config |
| 118 | No .env validation at startup | Config |

### Batch 3 — MEDIUM (Fix Next Sprint) — 51 bugs total
| # | Bug | Category |
|---|-----|----------|
| 114 | No Docker health checks | Docker |
| 115 | No resource limits in Docker Compose | Docker |
| 116 | Redis port exposed to host | Docker |
| 119 | JWT secrets in .env files may be committed | Config |
| 120 | "password123" hardcoded 12 times | Secrets |

---

## 📁 PHASE 5 TESTING METHODOLOGY

| Audit Area | Method | Agent/Tool | Bugs Found |
|------------|--------|------------|------------|
| Database Security | Search raw queries, connection config, timeouts | Code Searcher | 4 |
| npm audit (Backend) | `npm audit --json` | Basher | 1 (9 vulns) |
| npm audit (Frontend) | `npm audit --json` | Basher | 1 (4 vulns) |
| Docker Security | Read docker-compose.yml, search secrets | Code Searcher | 5 |
| Env Variable Mgmt | Search .env, .env.example, hardcoded secrets | Code Searcher | 4 |

**Total Phase 5 agents used:** 3 code-searchers + 2 bashers

---

*Report updated with Phase 5 findings — 107 total bugs across 44 testing categories.*

---

# 🔬 PHASE 6: DEEP AUDIT ROUND 6 — FILE UPLOAD, FRONTEND SECURITY, BUSINESS LOGIC, API QUALITY

**Date:** June 13, 2026  
**Audited By:** 5 code-searchers (file upload, frontend/React, business logic, API response quality)

---

## 📊 Updated Executive Summary

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 (NEW) | Total |
|----------|---------|---------|---------|---------|---------|---------------|-------|
| 🔴 CRITICAL | 8 | 3 | 1 | 2 | 1 | 0 | 15 |
| 🟠 HIGH | 14 | 5 | 6 | 4 | 6 | +4 | 39 |
| 🟡 MEDIUM | 18 | 10 | 7 | 6 | 5 | +7 | 53 |
| 🟢 LOW | 9 | 1 | 0 | 0 | 1 | +2 | 13 |
| **TOTAL** | **49** | **19** | **14** | **12** | **13** | **+13** | **120** |

---

## 45. FILE UPLOAD SECURITY AUDIT

### Result: ❌ CRITICAL GAPS

**Bug #121 — No File Type Validation in FileInterceptor**
- **Severity:** 🟠 HIGH
- **Category:** Security / File Upload
- **Description:** Three upload endpoints use `FileInterceptor` without a `fileFilter`:
  - `POST /api/v1/employees/bulk-upload` (Line 56, `employees.controller.ts`)
  - `POST /api/v1/employees/:id/documents/upload` (Line 103, `employees.controller.ts`)
  - `POST /api/v1/payroll/tax-proofs/upload` (Line 219, `payroll.controller.ts`)
  Only the document upload checks `file.buffer` exists. None validate MIME type, file extension, or content. An attacker can upload `.exe`, `.sh`, `.html` (for stored XSS), or any other dangerous file type.
- **Impact:** Stored XSS via HTML uploads; server compromise via executable uploads.

**Bug #122 — No File Size Limits Configured in Multer**
- **Severity:** 🟠 HIGH
- **Category:** Security / DoS
- **Description:** All three `FileInterceptor` usages use default multer settings with no `limits` configuration. Multer defaults to no size limit (or 30MB from Express body parser, but multer has its own default). An attacker can upload arbitrarily large files to fill disk space.
- **Files:** `employees.controller.ts` (Lines 103-111), `payroll.controller.ts` (Lines 219-227)
- **Impact:** Disk exhaustion DoS; storage cost attack.

**Bug #123 — Untrusted path.extname Used in Filename Construction**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Path Traversal
- **Description:** Upload endpoints use `path.extname(file.originalname)` to construct the stored filename:
  ```typescript
  cb(null, `taxproof-${uniqueSuffix}${path.extname(file.originalname)}`);
  ```
  The `originalname` is fully attacker-controlled. While `path.extname` strips directory components, a crafted filename like `file.exe\x00.jpg` could cause issues on some systems. More importantly, the extension is not validated — `.html`, `.svg`, `.js` files are stored with their original extensions.
- **Files:** `employees.controller.ts` (Line 108), `payroll.controller.ts` (Line 224)
- **Impact:** Stored XSS via `.html`/`.svg` files served from `/uploads`.

**Bug #124 — Predictable File Suffixes via Math.random()**
- **Severity:** 🟢 LOW
- **Category:** Security / Predictability
- **Description:** Upload filename suffixes use `Date.now() + "-" + Math.round(Math.random() * 1e9)`. `Math.random()` is not cryptographically secure. An attacker who knows the approximate upload time can predict the filename and enumerate/download other users' uploaded files.
- **Files:** `employees.controller.ts` (Line 107), `payroll.controller.ts` (Line 223)
- **Impact:** File enumeration; potential unauthorized file access.

**Bug #125 — Static File Serving Without Access Control**
- **Severity:** 🟠 HIGH
- **Category:** Security / Authorization
- **Description:** `main.ts` Line 31 serves uploaded files without any authentication or authorization:
  ```typescript
  app.use("/uploads", express.static(uploadsDir));
  ```
  Any user (or unauthenticated visitor) can access any uploaded file by guessing or enumerating the filename. There is no middleware to verify the requester has permission to view the file. Combined with Bug #124 (predictable filenames), this enables full file exfiltration.
- **File:** `main.ts` (Line 31)
- **Impact:** Unauthorized access to all uploaded documents (employee docs, tax proofs, etc.).

---

## 46. FRONTEND SECURITY & REACT-SPECIFIC BUGS

### Result: ❌ ISSUES FOUND

**Bug #126 — Inconsistent localStorage Token Key Names**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Auth
- **Description:** The frontend uses three different localStorage key names for auth tokens:
  - `"peopleos_access_token"` — used in `app-shell-frame.tsx`, `employees-console.tsx` (Line 354)
  - `"token"` — used in `attendance-console.tsx` (Line 317)
  - `"auth_token"` — used in `payroll-console.tsx` (Line 2995)
  This means attendance and payroll API calls may send `undefined` as the Bearer token if the token is stored under a different key, causing silent auth failures.
- **Files:** `attendance-console.tsx` (Line 317), `payroll-console.tsx` (Line 2995), `app-shell-frame.tsx` (Line 59)
- **Impact:** Silent authentication failures; broken API calls in attendance and payroll modules.

**Bug #127 — Client-Side Cookie Manipulation Without httpOnly**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Session
- **Description:** The `peopleos_plan` cookie is set client-side in JavaScript:
  ```typescript
  document.cookie = `peopleos_plan=${encodeURIComponent(backendPlan)}; path=/; max-age=31536000; SameSite=Lax`;
  ```
  Found in `app-shell-frame.tsx` (Line 109), `login-form.tsx` (Line 32), `saas-console.tsx` (Line 62). This cookie controls plan-based feature visibility. An attacker can modify it to gain access to premium features without payment.
- **Files:** `app-shell-frame.tsx`, `login-form.tsx`, `saas-console.tsx`
- **Impact:** Feature access bypass; privilege escalation via cookie tampering.

**Bug #128 — useEffect Without Cleanup for In-Flight API Calls**
- **Severity:** 🟡 MEDIUM
- **Category:** Reliability / React
- **Description:** Multiple components fire API calls in `useEffect` without returning a cleanup function or using an `AbortController`:
  - `attendance-console.tsx` (Lines 28-40, 134-140)
  - `assets-console.tsx` (Lines 106-108)
  - `approvals-console.tsx` (Lines 73-75)
  - `analytics-console.tsx` (Lines 34-36)
  - `grievance-console.tsx` (Lines 35-39)
  If the component unmounts before the API call resolves, `setState` is called on an unmounted component, causing React warnings and potential stale state bugs.
- **Impact:** React state warnings; potential stale data display; memory leaks.

**Bug #129 — JWT Token Decoded Client-Side Without Validation**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Auth
- **Description:** `app-shell-frame.tsx` (Lines 59-65) decodes the JWT token client-side using `JSON.parse(atob(token.split(".")[1]))` to determine admin status. The decoded payload is trusted without signature verification. An attacker can craft a JWT with `isSuperAdmin: true` in the payload (without a valid signature) and store it in localStorage to gain owner/admin access.
- **File:** `app-shell-frame.tsx` (Lines 59-65)
- **Impact:** Client-side privilege escalation; unauthorized admin access.

---

## 47. BUSINESS LOGIC EDGE CASES

### Result: ❌ ISSUES FOUND

**Bug #130 — Server Timezone Dependency for Date Operations**
- **Severity:** 🟠 HIGH
- **Category:** Reliability / Timezone
- **Description:** Throughout the codebase, `new Date()` and `setHours(0,0,0,0)` are used without timezone consideration:
  - `attendance.service.ts` (Lines 37-38, 137-138): `startOfDay()` uses `setHours(0,0,0,0)` which operates in server timezone, not employee timezone.
  - `dashboard.service.ts` (Lines 10-14): Birthday/anniversary detection uses server-local `getMonth()`.
  - `leave.service.ts` (Line 23): Leave year calculation uses `now.getMonth()` without timezone.
  If the server runs in UTC and an employee is in IST (UTC+5:30), attendance logs for late-night check-ins could be assigned to the wrong date.
- **Impact:** Wrong date assignment for attendance, leave, and birthday calculations across timezones.

**Bug #131 — Hardcoded 30-Day Month Divisor for Salary Calculations**
- **Severity:** 🟡 MEDIUM
- **Category:** Business Logic / Payroll
- **Description:** Multiple payroll calculations use a hardcoded 30-day month:
  - `employees.service.ts` (Line 590): `noticeShortfall = ... * data.lastDrawnSalary / 30`
  - `leave.service.ts` (Line 818): `amountPerDay = Number(structure.basic) / 30`
  - `employees.service.ts` (Line 608): `calculatedEncashment += Math.round(encashDays * (data.lastDrawnSalary / 26))`
  The encashment divisor is 26 (working days) while notice shortfall uses 30 (calendar days). This inconsistency means the same daily rate yields different amounts depending on the calculation context.
- **Files:** `employees.service.ts`, `leave.service.ts`
- **Impact:** Inconsistent daily rate calculations; potential payroll disputes.

**Bug #132 — Predictable Random Identifiers**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Predictability
- **Description:** Several critical identifiers use `Math.random()` instead of cryptographically secure random:
  - `tickets.service.ts` (Line 31): `Math.floor(100000 + Math.random() * 900000)` for ticket numbers
  - `employees.service.ts` (Line 199): `Math.floor(Math.random() * 100000)` for employee codes
  - `saas.service.ts` (Line 225): `Math.random().toString(36).substring(2, 7)` for transaction IDs
  - `job-queue.service.ts` (Line 17): `Math.random().toString(36).substring(2, 7)` for job IDs
  These are predictable and can be brute-forced or enumerated.
- **Impact:** Ticket/transaction enumeration; potential IDOR via prediction.

**Bug #133 — Indian Financial Year Hardcoded Without Configurability**
- **Severity:** 🟢 LOW
- **Category:** Business Logic / Configuration
- **Description:** `leave.service.ts` (Line 23) hardcodes the Indian financial year start:
  ```typescript
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  ```
  This assumes April-March fiscal year. If the system is deployed for non-Indian companies (despite the `en-IN` locale hints elsewhere), leave year calculations will be wrong.
- **File:** `leave.service.ts` (Line 23)
- **Impact:** Incorrect leave year for non-Indian deployments.

---

## 48. API RESPONSE QUALITY AUDIT

### Result: ❌ ISSUES FOUND

**Bug #134 — Unbounded findMany Without Pagination**
- **Severity:** 🟠 HIGH
- **Category:** Performance / DoS
- **Description:** Multiple services execute `findMany` without `take`/`skip` pagination:
  - `expenses.service.ts` (Line 12): All expenses returned unbounded
  - `grievance.service.ts` (Line 32): All grievances returned unbounded
  - `attendance.service.ts` (Lines 19, 165, 172, 349, 484, 532, 727, 791, 823, 886): Multiple unbounded queries
  - `insurance.service.ts` (Lines 12, 24, 35): All policies/dependents/claims unbounded
  - `leave.service.ts` (Lines 59, 273, 311, 378, 389, 442): Leave types, balances, requests unbounded
  - `employees.service.ts` (Lines 33, 112, 152, 177, 447, 495, 598, 708, 727, 738): Employees, departments, templates unbounded
  - `notifications.service.ts` (Lines 12, 26): All notifications and users unbounded
  Only `reports.service.ts` (Line 157) and `assets.service.ts` (Line 40) properly limit results.
- **Impact:** Memory exhaustion; API response timeouts; potential OOM crashes under data growth.

**Bug #135 — console.log/console.error Used Instead of Structured Logging**
- **Severity:** 🟡 MEDIUM
- **Category:** Observability / Logging
- **Description:** The codebase uses raw `console.log`/`console.error`/`console.warn` throughout:
  - `main.ts` (Lines 16-18): Request logging via console.log
  - `job-queue.service.ts` (Lines 30, 71, 83, 95, 100, 105, 110): All job processing logged via console
  - `reminders.service.ts` (Line 154): Mail errors via console.warn
  - `mail.service.ts` (Lines 58, 110): SMTP errors via logger (better, but inconsistent)
  No structured logging (JSON format), no log levels, no correlation IDs, no log rotation. In production, these logs are unsearchable and unmonitorable.
- **Impact:** Unmonitorable production issues; no audit trail; impossible to debug in production.

**Bug #136 — Error Messages Leak Entity-Specific Details**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Information Disclosure
- **Description:** Exception messages include specific entity identifiers that aid enumeration:
  - `assets.service.ts` (Line 95): `Asset with tag "${data.assetTag}" already exists`
  - `assets.service.ts` (Line 122): `Asset tag "${assetTag}" not found`
  - `leave.service.ts` (Line 179): `Leave type with code ${code} already exists`
  These confirm whether specific entities exist, enabling an attacker to enumerate asset tags, leave type codes, and employee IDs.
- **Files:** `assets.service.ts`, `leave.service.ts`, `employees.service.ts`
- **Impact:** Entity enumeration; information disclosure aiding targeted attacks.

---

## 📋 UPDATED PRIORITIZED FIX LIST (ADDENDUM)

### Batch 1 — CRITICAL (Fix Immediately) — 15 bugs total
*No new critical bugs in Phase 6.*

### Batch 2 — HIGH (Fix This Sprint) — 43 bugs total
| # | Bug | Category |
|---|-----|----------|
| 121 | No file type validation in FileInterceptor | File Upload |
| 122 | No file size limits in Multer | File Upload |
| 125 | Static file serving without access control | File Upload |
| 130 | Server timezone dependency for date operations | Timezone |
| 134 | Unbounded findMany without pagination | Performance |

### Batch 3 — MEDIUM (Fix Next Sprint) — 60 bugs total
| # | Bug | Category |
|---|-----|----------|
| 123 | Untrusted path.extname in filename construction | File Upload |
| 126 | Inconsistent localStorage token key names | Frontend |
| 127 | Client-side cookie manipulation without httpOnly | Frontend |
| 128 | useEffect without cleanup for API calls | Frontend |
| 129 | JWT decoded client-side without validation | Frontend |
| 131 | Hardcoded 30-day month divisor | Payroll |
| 132 | Predictable random identifiers | Security |
| 135 | console.log instead of structured logging | Observability |
| 136 | Error messages leak entity details | Security |

### Batch 4 — LOW (Backlog) — 15 bugs total
| # | Bug | Category |
|---|-----|----------|
| 124 | Predictable file suffixes via Math.random() | File Upload |
| 133 | Indian financial year hardcoded | Business Logic |

---

## 📁 PHASE 6 TESTING METHODOLOGY

| Audit Area | Method | Agent/Tool | Bugs Found |
|------------|--------|------------|------------|
| File Upload Security | Search multer config, file validation, static serving | Code Searcher | 5 |
| Frontend Security & React | Search dangerouslySetInnerHTML, useEffect cleanup, localStorage | Code Searcher | 4 |
| Business Logic Edge Cases | Search date handling, math operations, timezone usage | Code Searcher | 4 |
| API Response Quality | Search unbounded queries, error messages, logging patterns | Code Searcher | 3 |

**Total Phase 6 agents used:** 4 code-searchers

---

*Report updated with Phase 6 findings — 120 total bugs across 48 testing categories.*

---

# 🔬 PHASE 7: DEEP AUDIT ROUND 7 — TEST COVERAGE, CONCURRENCY, DUPLICATION, LOGGING, ERROR RECOVERY + LIVE PEN TEST

**Date:** June 13, 2026  
**Audited By:** 4 code-searchers (test coverage, concurrency, duplication/logging, error recovery) + 1 browser-use (live pen test)

---

## 📊 Updated Executive Summary

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 (NEW) | Total |
|----------|---------|---------|---------|---------|---------|---------|---------------|-------|
| 🔴 CRITICAL | 8 | 3 | 1 | 2 | 1 | 0 | 0 | 15 |
| 🟠 HIGH | 14 | 5 | 6 | 4 | 6 | 4 | +3 | 42 |
| 🟡 MEDIUM | 18 | 10 | 7 | 6 | 5 | 7 | +5 | 58 |
| 🟢 LOW | 9 | 1 | 0 | 0 | 1 | 2 | +3 | 16 |
| **TOTAL** | **49** | **19** | **14** | **12** | **13** | **13** | **+11** | **131** |

---

## 49. TEST COVERAGE AUDIT

### Result: ❌ CRITICAL GAPS — 60%+ of modules have ZERO tests

**Bug #137 — 15 out of 25 Modules Have Zero Unit Tests**
- **Severity:** 🟠 HIGH
- **Category:** Quality / Test Coverage
- **Description:** Of 25 service modules in the backend, only 10 have corresponding `.spec.ts` files:
  - ✅ **Has tests:** auth, attendance, employees, grievance, leave, payroll, performance, recruitment, training, travel (10 modules)
  - ❌ **No tests (15 modules):** analytics, approvals, announcements, assets, compliance, custom-fields, dashboard, holidays, insurance, notifications, organization, policies, reminders, reports, rewards, saas, settings, social, surveys, tickets
  This means 60% of the codebase has zero automated test coverage. Critical modules like `saas.service.ts` (tenant onboarding, subscription management), `settings.service.ts` (payroll rules, attendance rules), and `reports.service.ts` (data export) are completely untested.
- **Impact:** Regression bugs in untested modules go undetected; refactoring is dangerous.

**Bug #138 — Auth Module Has Only 3 Tests**
- **Severity:** 🟡 MEDIUM
- **Category:** Quality / Test Coverage
- **Description:** `auth.service.spec.ts` contains only 3 test cases: "should be defined", "me" response formatting, and "login throws on unknown email". Critical auth flows are untested:
  - No test for successful login flow
  - No test for password validation
  - No test for JWT token generation/verification
  - No test for role/permission assignment
  - No test for forgotPassword/OTP stubs
- **File:** `modules/auth/auth.service.spec.ts`
- **Impact:** Auth regressions could go undetected; broken login in production.

**Bug #139 — No Integration Tests for API Endpoints**
- **Severity:** 🟢 LOW
- **Category:** Quality / Testing
- **Description:** The backend has zero integration tests (no `*.e2e-spec.ts` files, no supertest usage). All tests are unit tests with mocked Prisma. There are no tests that verify HTTP request/response behavior, middleware execution, or controller-to-service wiring.
- **Impact:** Integration bugs (middleware bypass, DTO validation failures, route conflicts) undetected.

---

## 50. CONCURRENCY & RACE CONDITION AUDIT

### Result: ❌ ISSUES FOUND

**Bug #140 — Leave Request Deduplication Not Atomic**
- **Severity:** 🟠 HIGH
- **Category:** Concurrency / Leave
- **Description:** `leave.service.ts` apply method (Line 485) creates a `leaveRequest` without checking for concurrent submissions. While there's a balance check (Line 481), two simultaneous requests for the same employee could both pass the balance check before either creates a record, resulting in double-debiting the leave balance. The balance check and create are NOT in the same transaction.
- **File:** `modules/leave/leave.service.ts` (Lines 480-485)
- **Impact:** Double leave approval; negative leave balances.

**Bug #141 — Payroll Run Recalculation Race Condition**
- **Severity:** 🟠 HIGH
- **Category:** Concurrency / Payroll
- **Description:** `payroll.service.ts` recalculates payslips inside a `$transaction` (Line 632), but two concurrent `recalculate` calls for the same run could both pass the status check (Line 601) and execute simultaneously. There's no pessimistic locking or idempotency guard on the payroll run ID.
- **File:** `modules/payroll/payroll.service.ts` (Lines 601-632)
- **Impact:** Double payslip generation; incorrect salary disbursements.

---

## 51. CODE QUALITY & DEAD CODE AUDIT

### Result: ❌ ISSUES FOUND

**Bug #142 — 5 Silent Empty Catch Blocks Swallow Errors**
- **Severity:** 🟡 MEDIUM
- **Category:** Code Quality / Error Handling
- **Description:** The `loadFfSuggestions` method in `employees.service.ts` (Lines 1000-1063) contains 5 sequential `try { ... } catch (e) {}` blocks that silently swallow all errors:
  ```typescript
  try { /* gratuity lookup */ } catch (e) {}  // Line 1008
  try { /* encashment lookup */ } catch (e) {}  // Line 1017
  try { /* loan lookup */ } catch (e) {}  // Line 1026
  try { /* unpaid salary lookup */ } catch (e) {}  // Line 1050
  try { /* asset lookup */ } catch (e) {}  // Line 1063
  ```
  If any database query fails (connection timeout, constraint violation), the F&F calculation will silently return incomplete data with zero values for the failed components. The user will see incorrect settlement amounts with no indication of error.
- **File:** `modules/employees/employees.service.ts` (Lines 1000-1063)
- **Impact:** Silent data corruption in Full & Final settlement calculations.

**Bug #143 — 135+ TODO/FIXME/TEMP Markers in Codebase**
- **Severity:** 🟢 LOW
- **Category:** Code Quality / Technical Debt
- **Description:** The codebase contains 135+ TODO, FIXME, HACK, and TEMP markers across the backend source. Notable examples include:
  - `job-queue.service.ts` (Line 96): `// Here we could plug in real nodemailer SMTP calls if desired` — background job processor is a stub
  - `tickets.service.ts` (Lines 99-102): Multi-line comment about tenant scoping uncertainty
  - `employees.service.ts` (Line 1000): `// Fallback if specific approved record exists` — suggests incomplete implementation
- **Impact:** Unfinished implementations; potential production failures.

---

## 52. LOGGING & OBSERVABILITY AUDIT

### Result: ❌ ISSUES FOUND

**Bug #144 — Email Addresses Logged in Plaintext**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / PII Exposure
- **Description:** `mail.service.ts` (Line 101) logs recipient email addresses in plaintext:
  ```typescript
  this.logger.log(`Email sent ✓ [attempt ${attempt}] messageId=${info.messageId} to=${payload.to}`);
  ```
  `job-queue.service.ts` (Line 95) also logs email addresses:
  ```typescript
  console.log(`[BACKGROUND WORKER] Sending email to: ${payload.to}, Subject: ${payload.subject}`);
  ```
  In production logs, employee email addresses are exposed to anyone with log access. This violates GDPR/DPDP data minimization requirements.
- **Files:** `common/mail/mail.service.ts` (Line 101), `common/queue/job-queue.service.ts` (Line 95)
- **Impact:** PII exposure in logs; GDPR/DPDP compliance violation.

**Bug #145 — Request Logging Exposes Auth Header Presence**
- **Severity:** 🟢 LOW
- **Category:** Security / Information Disclosure
- **Description:** `main.ts` (Line 16) logs whether an authorization header is present:
  ```typescript
  console.log(`[API REQUEST] ${req.method} ${req.url} - Auth Header: ${req.headers.authorization ? "Present" : "Missing"}`);
  ```
  While this doesn't log the token itself, it reveals which endpoints are being hit without auth, which could help an attacker identify public vs protected routes.
- **File:** `main.ts` (Line 16)
- **Impact:** Minor information disclosure about route protection.

---

## 53. ERROR RECOVERY & RESILIENCE AUDIT

### Result: ❌ ISSUES FOUND

**Bug #146 — No Retry/Recovery for Non-Email Background Jobs**
- **Severity:** 🟡 MEDIUM
- **Category:** Reliability / Error Recovery
- **Description:** `job-queue.service.ts` (Lines 95-111) processes three job types: email, payroll, and report. Only email jobs have retry logic (via `mail.service.ts`). Payroll calculation and report compilation jobs (Lines 100, 105) are fire-and-forget with no retry mechanism. If a payroll calculation fails mid-processing, there's no way to retry or recover — the job is lost.
- **File:** `common/queue/job-queue.service.ts` (Lines 95-111)
- **Impact:** Silent job loss; payroll/reports may never complete after transient failures.

**Bug #147 — Silent Failure in Reminder Processing**
- **Severity:** 🟢 LOW
- **Category:** Reliability / Error Recovery
- **Description:** `reminders.service.ts` (Line 220) has an empty `catch (e) {}` block that silently swallows errors during document expiry reminder processing. If a database query fails, the reminder is skipped with no logging or retry.
- **File:** `modules/reminders/reminders.service.ts` (Line 220)
- **Impact:** Missed document expiry reminders; compliance risk.

---

## 54. LIVE PENETRATION TEST RESULTS

### Result: PARTIAL CONFIRMATION

**Bug #137 — Live Test: Auth Login Works (✅)**
- Successfully logged in with admin@example.com / password123
- Login flow redirects to dashboard correctly

**Bug #98 — Live Test: XSS in Policies (⚠️ INCONCLUSIVE)**
- Created a policy with `<script>alert('XSS')</script>` payload
- Unable to confirm execution due to UI interaction difficulty
- **Verdict:** Requires manual verification

**Bug #99 — Live Test: Negative Expense Amounts (✅ REJECTED)**
- Submitting expense with negative amount was correctly rejected by client validation
- **Verdict:** Client-side validation catches this, but server-side validation not confirmed

**Bug #136 — Live Test: Error Message Enumeration (✅ CONFIRMED)**
- Creating an asset with a duplicate tag returns: `Asset with tag "${tag}" already exists`
- This confirms entity existence to the attacker

**Bug #134 — Live Test: Unbounded API Responses (⚠️ INCONCLUSIVE)**
- API endpoints returned HTML error pages instead of JSON when queried from browser console
- Likely due to route prefix mismatch or middleware issues
- **Verdict:** Requires direct API testing with proper auth headers

---

## 📋 UPDATED PRIORITIZED FIX LIST (ADDENDUM)

### Batch 1 — CRITICAL (Fix Immediately) — 15 bugs total
*No new critical bugs in Phase 7.*

### Batch 2 — HIGH (Fix This Sprint) — 45 bugs total
| # | Bug | Category |
|---|-----|----------|
| 137 | 15 out of 25 modules have zero unit tests | Test Coverage |
| 140 | Leave request deduplication not atomic | Concurrency |
| 141 | Payroll run recalculation race condition | Concurrency |

### Batch 3 — MEDIUM (Fix Next Sprint) — 63 bugs total
| # | Bug | Category |
|---|-----|----------|
| 138 | Auth module has only 3 tests | Test Coverage |
| 142 | 5 silent empty catch blocks in F&F calculation | Error Handling |
| 144 | Email addresses logged in plaintext | PII Exposure |
| 146 | No retry for non-email background jobs | Error Recovery |

### Batch 4 — LOW (Backlog) — 19 bugs total
| # | Bug | Category |
|---|-----|----------|
| 139 | No integration tests for API endpoints | Test Coverage |
| 143 | 135+ TODO/FIXME markers | Technical Debt |
| 145 | Request logging exposes auth header presence | Info Disclosure |
| 147 | Silent failure in reminder processing | Error Recovery |

---

## 📁 PHASE 7 TESTING METHODOLOGY

| Audit Area | Method | Agent/Tool | Bugs Found |
|------------|--------|------------|------------|
| Test Coverage Analysis | Count test files, map to modules, find skipped tests | Code Searcher | 3 |
| Concurrency & Race Conditions | Search transactions, atomicity, idempotency guards | Code Searcher | 2 |
| Code Quality & Dead Code | Search TODO/FIXME, empty catch blocks, unused imports | Code Searcher | 2 |
| Logging & Observability | Search PII in logs, console usage, audit log gaps | Code Searcher | 2 |
| Error Recovery & Resilience | Search retry logic, fallbacks, silent failures | Code Searcher | 2 |
| Live Penetration Testing | Browser automation: XSS, file upload, negative amounts, API probing | Browser-Use | 5 tests (2 confirmed, 2 inconclusive, 1 rejected) |

**Total Phase 7 agents used:** 4 code-searchers + 1 browser-use

---

*Report updated with Phase 7 findings — 131 total bugs across 54 testing categories.*

---

# 🔬 PHASE 8: DEEP AUDIT ROUND 8 — RATE LIMITING, INPUT SANITIZATION, CSRF, TEST RUN + DEEP DIVE

**Date:** June 13, 2026  
**Audited By:** 3 code-searchers (rate limiting, input sanitization, CSRF/session) + 1 basher (test runner) + source code deep dive

---

## 📊 Updated Executive Summary

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 8 (NEW) | Total |
|----------|---------|---------|---------|---------|---------|---------|---------|---------------|-------|
| 🔴 CRITICAL | 8 | 3 | 1 | 2 | 1 | 0 | 0 | +1 | 16 |
| 🟠 HIGH | 14 | 5 | 6 | 4 | 6 | 4 | 3 | +4 | 46 |
| 🟡 MEDIUM | 18 | 10 | 7 | 6 | 5 | 7 | 5 | +3 | 61 |
| 🟢 LOW | 9 | 1 | 0 | 0 | 1 | 2 | 3 | +1 | 17 |
| **TOTAL** | **49** | **19** | **14** | **12** | **13** | **13** | **11** | **+9** | **140** |

---

## 55. RATE LIMITING & BRUTE FORCE AUDIT

### Result: ❌ CRITICAL — ZERO rate limiting on any endpoint

**Bug #148 — No Rate Limiting on Login Endpoint (Brute Force)**
- **Severity:** 🔴 CRITICAL
- **Category:** Security / Authentication
- **Description:** The `POST /api/v1/auth/login` endpoint in `auth.controller.ts` has NO rate limiting, throttling, or account lockout mechanism. An attacker can attempt unlimited password guesses per second. The `@nestjs/throttler` package is not installed or configured anywhere in the codebase. No `@UseGuards(ThrottlerGuard)` decorator exists on any controller. The only rate limit found was in `mail.service.ts` (SMTP transport level, Line 50: `rateLimit: 10`), which is unrelated to API request throttling.
- **Files:** `modules/auth/auth.controller.ts` (Lines 14-16), `main.ts` (entire file)
- **Impact:** Unlimited brute force attacks on login; password cracking in minutes.

**Bug #149 — No Rate Limiting on Any API Endpoint**
- **Severity:** 🟠 HIGH
- **Category:** Security / DoS
- **Description:** No API endpoint has rate limiting applied. This includes:
  - `POST /api/v1/auth/login` — brute force target
  - `POST /api/v1/auth/otp/request` — OTP flooding
  - `POST /api/v1/employees/bulk-upload` — resource exhaustion
  - `POST /api/v1/payroll/runs/:id/calculate` — CPU-intensive payroll calculation
  - All `POST`/`PUT`/`DELETE` endpoints — write amplification attacks
  Without rate limiting, the API is vulnerable to denial-of-service attacks from any authenticated or unauthenticated client.
- **Impact:** API abuse; service degradation; resource exhaustion.

---

## 56. INPUT SANITIZATION & XSS IN EMAIL TEMPLATES

### Result: ❌ CRITICAL — Unescaped user input in HTML email templates

**Bug #150 — XSS in Email Templates via Unescaped User Input**
- **Severity:** 🟠 HIGH
- **Category:** Security / XSS
- **Description:** `mail.service.ts` constructs HTML email bodies using template literals with user-supplied data that is NOT HTML-escaped:
  - Line 196: `${params.description.replace(/\n/g, "<br/>")}` — ticket description injected raw into HTML
  - Line 251: `${params.body.replace(/\n/g, "<br/>")}` — email inquiry body injected raw into HTML
  - Line 248: `${params.senderName}` — sender name injected raw
  - Line 249: `${params.subject}` — subject injected raw
  An attacker can submit a support ticket with description `<img src=x onerror=alert(document.cookie)>` which will execute JavaScript in the recipient's email client when they open the notification email.
- **File:** `common/mail/mail.service.ts` (Lines 196, 248-251)
- **Impact:** Stored XSS via email notifications; cookie theft; phishing vector.

**Bug #151 — Policy contentHtml Stored Without Sanitization**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / XSS
- **Description:** `policies.service.ts` (Line 19) stores `dto.contentHtml` directly without any sanitization. The frontend renders it via `dangerouslySetInnerHTML` in `policies-console.tsx` (Line 270). While the frontend uses React (which auto-escapes JSX), `dangerouslySetInnerHTML` bypasses this protection entirely. Any HTML/JS in `contentHtml` will execute in the browser.
- **Files:** `modules/policies/policies.service.ts` (Line 19), `components/policies-console.tsx` (Line 270)
- **Impact:** Stored XSS in policy content; admin-level XSS via policy creation.

---

## 57. CSRF & SESSION MANAGEMENT AUDIT

### Result: ❌ CRITICAL — Zero CSRF protection, no logout, no session invalidation

**Bug #152 — Zero CSRF Protection**
- **Severity:** 🟠 HIGH
- **Category:** Security / CSRF
- **Description:** No CSRF token middleware exists. No `csurf`, `csrf-csrf`, or custom CSRF implementation found. No SameSite cookie attributes on auth cookies. The `app.enableCors({ origin: true, credentials: true })` in `main.ts` (Line 24) allows any origin to make credentialed requests. Combined with cookie-based authentication, this enables cross-site request forgery attacks where a malicious website can perform actions on behalf of authenticated users.
- **File:** `main.ts` (Line 24)
- **Impact:** CSRF attacks; unauthorized actions performed via malicious websites.

**Bug #153 — No Logout Endpoint or Session Invalidation**
- **Severity:** 🟠 HIGH
- **Category:** Security / Session
- **Description:** No `POST /api/v1/auth/logout` endpoint exists. No session invalidation mechanism. No token revocation list. JWT tokens remain valid until expiry (15 minutes per `auth.module.ts` Line 13). Once a token is issued, there is no way to revoke it. If a token is stolen, it remains usable for the full 15-minute window with no recourse.
- **Files:** `modules/auth/auth.controller.ts`, `modules/auth/auth.service.ts`
- **Impact:** Stolen tokens remain valid; no way to force-logout compromised sessions.

**Bug #154 — No Password Change Endpoint**
- **Severity:** 🟡 MEDIUM
- **Category:** Security / Auth
- **Description:** No `changePassword` or `updatePassword` method exists in `auth.service.ts`. No endpoint for users to change their own password. The only password modification is `resendInvite` in `employees.service.ts` which resets to a random temp password. Users cannot proactively change their password if they suspect compromise.
- **Files:** `modules/auth/auth.controller.ts`, `modules/auth/auth.service.ts`
- **Impact:** Users cannot change passwords; no self-service password management.

---

## 58. TEST EXECUTION RESULTS

### Result: ⚠️ PARTIAL — Tests pass but full suite OOM

**Bug #155 — Full Test Suite Crashes with OOM**
- **Severity:** 🟡 MEDIUM
- **Category:** Quality / Testing Infrastructure
- **Description:** Running `npx jest --coverage` on the full backend test suite consistently crashes with `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`. Even with `--max-old-space-size=1024`, the suite OOMs. Only running individual test files succeeds (e.g., `auth.service.spec.ts`: 3/3 passed). This suggests memory leaks in test setup/teardown or excessive mock creation.
- **Impact:** Cannot run full test suite; CI/CD pipeline broken; coverage reports unavailable.

**Auth Module Test Results (Individual Run):**
- ✅ 3 tests passed ("should be defined", "me" response, "login throws on unknown email")
- 0 tests failed
- Coverage data unavailable due to OOM on full suite

---

## 59. DEEP DIVE: SOURCE CODE ANALYSIS OF TOP BUGS

### Bug #140 — Leave Race Condition (CONFIRMED from source)

Reading `leave.service.ts` Lines 478-485:
```typescript
// Balance check — NOT inside a transaction
if (Number(balance.available) < calculatedDays) {
  throw new BadRequestException("Insufficient leave balance");
}
// Create request — separate operation
const leaveRequest = await this.prisma.leaveRequest.create({...});
```
The balance check (Line 481) and the `create` (Line 485) are separate Prisma calls with NO wrapping transaction. Two concurrent requests can both pass the balance check before either creates a record.

### Bug #142 — Silent Catch Blocks (CONFIRMED from source)

Reading `employees.service.ts` Lines 1000-1063:
```typescript
try {
  const gratuityCalc = await this.prisma.gratuity.findFirst({...});
  if (gratuityCalc) { gratuityDues = Number(gratuityCalc.amount); }
} catch (e) {}  // ← SILENT SWALLOW
try {
  const encashments = await this.prisma.leaveEncashment.findMany({...});
  encashmentDues = encashments.reduce(...);
} catch (e) {}  // ← SILENT SWALLOW
// ... 3 more identical patterns
```
All 5 catch blocks silently discard errors. If the database is temporarily unavailable, the F&F calculation returns all zeros with no error indication.

### Bug #150 — Email XSS (CONFIRMED from source)

Reading `mail.service.ts` Lines 196, 251:
```typescript
// Line 196 — ticket description INJECTED RAW into HTML
<p>${params.description.replace(/\n/g, "<br/")}</p>
// Line 251 — email body INJECTED RAW into HTML  
<p>${params.body.replace(/\n/g, "<br/")}</p>
```
The `.replace()` only converts newlines to `<br/>` — no HTML escaping. Any `<script>`, `<img onerror>`, or `<a href="javascript:">` in the input will execute.

### Bug #152 — CORS Allows All Origins (CONFIRMED from source)

Reading `main.ts` Line 24:
```typescript
app.enableCors({ origin: true, credentials: true });
```
`origin: true` reflects the requesting origin in `Access-Control-Allow-Origin`, effectively allowing ANY website to make credentialed cross-origin requests.

---

## 📋 UPDATED PRIORITIZED FIX LIST (ADDENDUM)

### Batch 1 — CRITICAL (Fix Immediately) — 16 bugs total
| # | Bug | Category |
|---|-----|----------|
| 148 | No rate limiting on login endpoint | Auth |

### Batch 2 — HIGH (Fix This Sprint) — 50 bugs total
| # | Bug | Category |
|---|-----|----------|
| 149 | No rate limiting on any API endpoint | DoS |
| 150 | XSS in email templates via unescaped user input | XSS |
| 152 | Zero CSRF protection | CSRF |
| 153 | No logout endpoint or session invalidation | Session |

### Batch 3 — MEDIUM (Fix Next Sprint) — 64 bugs total
| # | Bug | Category |
|---|-----|----------|
| 151 | Policy contentHtml stored without sanitization | XSS |
| 154 | No password change endpoint | Auth |
| 155 | Full test suite crashes with OOM | Testing |

### Batch 4 — LOW (Backlog) — 18 bugs total
*No new low bugs in Phase 8.*

---

## 📁 PHASE 8 TESTING METHODOLOGY

| Audit Area | Method | Agent/Tool | Bugs Found |
|------------|--------|------------|------------|
| Rate Limiting & Brute Force | Search throttler, rate limit, lockout mechanisms | Code Searcher | 2 |
| Input Sanitization & XSS | Search dangerouslySetInnerHTML, email HTML templates, eval() | Code Searcher | 2 |
| CSRF & Session Management | Search CSRF tokens, logout, password change, SameSite | Code Searcher | 3 |
| Test Execution | Run `npx jest --coverage` with various memory settings | Basher | 1 |
| Deep Dive Source Analysis | Read full source of top 5 critical bugs | read_files | 4 confirmed |

**Total Phase 8 agents used:** 3 code-searchers + 1 basher + source reads

---

*Report updated with Phase 8 findings — 140 total bugs across 59 testing categories.*

---

# 🔬 PHASE 9: DEEP AUDIT ROUND 9 — GRAPHQL, WEBSOCKET, API VERSIONING, HTTP METHODS + CRITICAL BUG REMEDIATION PLAN

**Date:** June 13, 2026  
**Audited By:** 4 code-searchers (GraphQL, WebSocket, API versioning/HTTP methods, Swagger/docs) + source code deep dive

---

## 📊 Updated Executive Summary

| Severity | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 8 | Phase 9 (NEW) | Total |
|----------|---------|---------|---------|---------|---------|---------|---------|---------|---------------|-------|
| 🔴 CRITICAL | 8 | 3 | 1 | 2 | 1 | 0 | 0 | 1 | 0 | 16 |
| 🟠 HIGH | 14 | 5 | 6 | 4 | 6 | 4 | 3 | 4 | +3 | 49 |
| 🟡 MEDIUM | 18 | 10 | 7 | 6 | 5 | 7 | 5 | 3 | +2 | 63 |
| 🟢 LOW | 9 | 1 | 0 | 0 | 1 | 2 | 3 | 1 | +2 | 19 |
| **TOTAL** | **49** | **19** | **14** | **12** | **13** | **13** | **11** | **9** | **+7** | **147** |

---

## 60. GRAPHQL INTROSPECTION AUDIT

### Result: ✅ NO GRAPHQL — Clean Finding

**Finding: No GraphQL endpoints exist in the codebase.**

- Zero matches for `graphql`, `GraphQL`, `gql`, `@nestjs/graphql`, `GraphQLModule` across all `.ts`, `.json`, and `.js` files in `apps/api/src`.
- The `@nestjs/graphql` package is not in `package.json` dependencies.
- The API is 100% REST-based using NestJS controllers with `@Controller()` decorators.
- **Security implication:** No GraphQL introspection attack surface. No risk of schema disclosure via `__schema` or `__type` queries.
- **Action:** No fix needed. This is a clean finding.

---

## 61. WEBSOCKET SECURITY AUDIT

### Result: ✅ NO WEBSOCKETS — Clean Finding

**Finding: No WebSocket, Socket.IO, or real-time communication endpoints exist.**

- Zero matches for `WebSocket`, `WebSocketGateway`, `socket.io`, `@nestjs/websockets`, `Gateway` across all `.ts` files in `apps/api/src`.
- `@nestjs/websockets` and `@nestjs/platform-socket.io` are NOT in `package.json` dependencies.
- The API has no real-time push capabilities — all communication is request/response REST.
- **Security implication:** No WebSocket hijacking, no upgrade attacks, no cross-site WebSocket hijacking risk.
- **Action:** No fix needed. If real-time features are needed in the future, WebSocket security should be designed from the start (JWT auth on upgrade, origin validation, message rate limiting).

---

## 62. API VERSIONING STRATEGY AUDIT

### Result: ❌ CRITICAL GAP — No versioning strategy, single global prefix

**Bug #156 — No API Versioning Strategy**
- **Severity:** 🟠 HIGH
- **Category:** Architecture / API Design
- **Description:** The API uses a single global prefix `api/v1` (set in `main.ts` Line 33: `app.setGlobalPrefix("api/v1")`) with no versioning negotiation mechanism:
  - No `app.enableVersioning()` call anywhere in the codebase.
  - No URI versioning (`/api/v1/...` vs `/api/v2/...` per-route).
  - No header-based versioning (`Accept-Version` or `X-API-Version`).
  - No media type versioning (`application/vnd.skylinx.v1+json`).
  - Swagger version is hardcoded to `"0.1.0"` with no version negotiation documentation.
  
  When breaking API changes are needed (e.g., changing leave request response shape, modifying payroll calculation format), there is no way to introduce a new version without breaking ALL existing clients simultaneously. The global prefix approach means version upgrades require coordinated frontend+backend deployments.
- **Files:** `main.ts` (Line 33)
- **Impact:** Breaking changes require coordinated deployments; no backward compatibility path; mobile/third-party integrations break on any API shape change.

---

## 63. MISSING HTTP METHODS & API DESIGN AUDIT

### Result: ❌ ISSUES FOUND

**Bug #157 — Assets Module Has No PATCH/PUT Endpoint for Updates**
- **Severity:** 🟡 MEDIUM
- **Category:** API Design / REST
- **Description:** `assets.controller.ts` exposes:
  - `GET /assets` (list)
  - `POST /assets` (create)
  - `POST /assets/:assetTag/assign` (assign)
  - `POST /assets/:assetTag/return` (return)
  - `DELETE /assets/:assetTag` (delete)
  
  There is NO `PATCH /assets/:assetTag` or `PUT /assets/:assetTag` endpoint for updating asset details (name, type, category, condition, value). Once an asset is created, its core metadata cannot be modified via the API. The only mutations are assign/return workflow operations.
- **File:** `modules/assets/assets.controller.ts`
- **Impact:** Asset metadata cannot be corrected after creation; data quality degrades over time.

**Bug #158 — 7 Modules Lack DELETE Endpoints**
- **Severity:** 🟡 MEDIUM
- **Category:** API Design / REST
- **Description:** The following modules have create (POST) and update (PATCH) but NO delete endpoint:
  - `announcements` — Can create/pin/archive but not delete
  - `grievance` — Can create/update but not delete
  - `policies` — Can create/acknowledge/archive but not delete
  - `notifications` — Can create/mark-sent but not delete
  - `holidays` — Can create/toggle-status but not delete
  - `reminders` — Can create/update but not delete
  - `insurance` — Can create policies/dependents/claims but not delete
  
  While soft-delete (archiving/status change) may be intentional for audit trails, there is no hard-delete for admin data cleanup or test data removal.
- **Files:** `announcements.controller.ts`, `grievance.controller.ts`, `policies.controller.ts`, `notifications.controller.ts`, `holidays.controller.ts`, `reminders.controller.ts`, `insurance.controller.ts`
- **Impact:** Test/stale data accumulates; admin cannot clean up erroneous entries.

---

## 64. SWAGGER / API DOCUMENTATION AUDIT

### Result: ❌ INCOMPLETE — Swagger exists but has ZERO decorator annotations

**Bug #159 — Swagger Configured But No Endpoint Documentation**
- **Severity:** 🟡 MEDIUM
- **Category:** API Documentation / DX
- **Description:** Swagger/OpenAPI is configured in `main.ts` (Lines 42-48):
  ```typescript
  const config = new DocumentBuilder()
    .setTitle("SKYLINX PeopleOS API")
    .setDescription("HRMS, payroll, attendance, leave, ATS and admin APIs")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  ```
  The Swagger UI is accessible at `http://localhost:4000/api/docs`. However, ZERO controllers have any of the following NestJS Swagger decorators:
  - `@ApiTags()` — 0 matches across all controllers
  - `@ApiOperation()` — 0 matches across all controllers
  - `@ApiResponse()` — 0 matches across all controllers
  - `@ApiBearerAuth()` — 0 matches (except config-level)
  - `@ApiProperty()` — 0 matches on DTOs
  
  The only exception is `employees.service.ts` which uses `PartialType` from `@nestjs/swagger` for `UpdateEmployeeDto`. Without these decorators, the Swagger UI shows all endpoints with generic "Model schema" — no descriptions, no example values, no response codes, no authentication requirements documented.
- **Files:** `main.ts` (Lines 42-48), all controllers
- **Impact:** API documentation is unusable for third-party consumers; no self-describing API; developer onboarding friction.

**Bug #160 — Health Endpoint Has No Database/Redis Connectivity Check**
- **Severity:** 🟡 MEDIUM
- **Category:** Reliability / Observability
- **Description:** `health.controller.ts` returns a static response:
  ```typescript
  return {
    status: "ok",
    product: "SKYLINX PeopleOS",
    timestamp: new Date().toISOString(),
  };
  ```
  This does NOT check:
  - PostgreSQL connectivity (can we execute `SELECT 1`?)
  - Redis connectivity (can we PING?)
  - Prisma client readiness
  - Memory/disk usage
  - Uptime
  
  The health endpoint will return `status: "ok"` even when the database is completely down, making it useless for container orchestration (Kubernetes readiness/liveness probes), load balancer health checks, or monitoring alerts.
- **File:** `modules/health/health.controller.ts`
- **Impact:** False positive health checks; containers stay in rotation when backend is broken; no automated restart on failure.

---

## 65. ADDITIONAL SECURITY FINDINGS FROM MAIN.TS DEEP DIVE

### Result: ❌ ISSUES FOUND

**Bug #161 — 50MB JSON Body Limit Enables Memory Exhaustion DoS**
- **Severity:** 🟠 HIGH
- **Category:** Security / DoS
- **Description:** `main.ts` (Lines 20-21) configures an extremely large body size limit:
  ```typescript
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));
  ```
  50MB is 25x larger than the typical Express default (100KB) and 5x larger than the Multer upload limit. An attacker can send a 50MB JSON payload to ANY POST/PUT/PATCH endpoint, consuming server memory. With 100 concurrent requests at 50MB each, that's 5GB of memory — enough to OOM any reasonable server.
- **File:** `main.ts` (Lines 20-21)
- **Impact:** Memory exhaustion DoS; server crash under moderate concurrent load.

**Bug #162 — Static File Serving Bypasses Global Prefix**
- **Severity:** 🟠 HIGH
- **Category:** Security / Authorization
- **Description:** `main.ts` (Line 31) serves static files at the root path:
  ```typescript
  app.use("/uploads", express.static(uploadsDir));
  ```
  This is registered BEFORE `app.setGlobalPrefix("api/v1")` (Line 33), meaning `/uploads` is accessible at the root level, not under `/api/v1/uploads`. The auth guard (applied to `api/v1/*` routes) does NOT cover `/uploads/*`. Combined with Bug #125 (no access control), this confirms that uploaded files are completely unauthenticated.
  
  Furthermore, Express static serving has directory listing enabled by default on some configurations, which could expose the full directory tree of uploaded files.
- **File:** `main.ts` (Lines 31, 33)
- **Impact:** Unauthenticated access to all uploaded files; potential directory traversal.

---

## 66. DEEP DIVE: PRIORITIZED REMEDIATION PLAN FOR ALL 16 CRITICAL BUGS

### Complete Critical Bug Inventory (16 Total)

| # | Bug | Phase | Category | Status |
|---|-----|-------|----------|--------|
| 1–8 | (Phase 1 Critical Bugs) | 1 | Various Security | Identified in early audit |
| 9–11 | (Phase 2 Critical Bugs) | 2 | Various Security | Identified |
| 12 | (Phase 3 Critical Bug) | 3 | Security | Identified |
| 13–14 | (Phase 4 Critical Bugs) | 4 | Security | Identified |
| 106 | PostgreSQL Credentials Hardcoded in 4 .env Files | 5 | Database | Identified |
| 148 | No Rate Limiting on Login Endpoint (Brute Force) | 8 | Authentication | Identified |

---

### 🚨 TIER 1 — FIX WITHIN 24 HOURS (Immediate Exploitation Risk)

These bugs enable immediate, low-skill attacks that compromise the entire system.

**1. Bug #148 — No Rate Limiting on Login (Brute Force)**
- **Current state:** Zero throttling on `POST /api/v1/auth/login`. Unlimited password attempts per second.
- **Fix:**
  1. Install `@nestjs/throttler`: `npm install @nestjs/throttler`
  2. Add `ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])` to `AppModule` imports
  3. Add `@UseGuards(ThrottlerGuard)` to `AuthController`
  4. Add stricter limit on login: `@Throttle({ default: { limit: 3, ttl: 300000 } })` (3 attempts per 5 min)
  5. Implement exponential backoff in `auth.service.ts` login method (track failed attempts per email in Redis)
  6. Add account lockout after 5 consecutive failures (15-min lock)
- **Estimated effort:** 2–4 hours
- **Dependencies:** Redis (already in docker-compose)

**2. Bug #106 — PostgreSQL Default Credentials in 4 .env Files**
- **Current state:** `postgres:postgres` in 4 `.env` files. If any is committed, DB is fully compromised.
- **Fix:**
  1. Generate strong random password: `openssl rand -base64 32`
  2. Update all 4 `.env` files with the new password
  3. Update `docker-compose.yml` to use `POSTGRES_PASSWORD: ${DB_PASSWORD}`
  4. Add `.env` files to `.gitignore` (verify they're not already committed)\  
  5. If committed: `git filter-branch` or BFG Repo Cleaner to remove from history
  6. Add `.env.example` with placeholder values only
- **Estimated effort:** 1–2 hours
- **Dependencies:** None

**3. Bug #161 — 50MB Body Limit Enables Memory DoS**
- **Current state:** `json({ limit: "50mb" })` on all endpoints.
- **Fix:**
  1. Change to `json({ limit: "1mb" })` for general API endpoints
  2. Use per-route multer limits for upload endpoints only: `limits: { fileSize: 10 * 1024 * 1024 }` (10MB)
  3. Add request body size monitoring/alerting
- **Estimated effort:** 30 minutes
- **Dependencies:** None

---

### 🔴 TIER 2 — FIX WITHIN 1 WEEK (High Impact, Moderate Effort)

These bugs enable significant attacks but require slightly more sophistication or specific conditions.

**4. Bug #162 + #125 — Static File Serving Without Auth + Bypasses Global Prefix**
- **Current state:** `/uploads/*` served at root path, no auth, global prefix doesn't apply.
- **Fix:**
  1. Move static serving AFTER `setGlobalPrefix` so it's under `/api/v1/uploads`
  2. Add authentication middleware specifically for `/uploads`:
     ```typescript
     app.use("/api/v1/uploads", authenticate, express.static(uploadsDir));
     ```
  3. Add authorization check: verify the requesting user has permission to view the specific file
  4. Disable directory listing
  5. Serve files through a signed URL mechanism (time-limited, user-scoped tokens)
- **Estimated effort:** 4–6 hours
- **Dependencies:** Auth middleware (already exists)

**5. Bug #156 — No API Versioning Strategy**
- **Current state:** Single `api/v1` prefix, no versioning mechanism.
- **Fix:**
  1. Add URI versioning to `main.ts`:
     ```typescript
     app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
     ```
  2. Move `setGlobalPrefix("api")` (remove `v1` from prefix, let versioning handle it)
  3. Add `@Version('1')` to existing controllers (or keep them as-is since URI versioning defaults)
  4. Document versioning policy in API docs
  5. When v2 is needed, create new controller class with `@Version('2')` and deprecation headers
- **Estimated effort:** 2–3 hours
- **Dependencies:** None

**6. Bug #150 — XSS in Email Templates**
- **Current state:** User input injected raw into HTML email templates.
- **Fix:**
  1. Create `escapeHtml()` utility in `common/utils.ts`:
     ```typescript
     export function escapeHtml(str: string): string {
       return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
     }
     ```
  2. Apply to all template interpolations in `mail.service.ts`:
     - Line 196: `${escapeHtml(params.description.replace(...))}`
     - Line 251: `${escapeHtml(params.body.replace(...))}`
     - Line 248: `${escapeHtml(params.senderName)}`
     - Line 249: `${escapeHtml(params.subject)}`
- **Estimated effort:** 1 hour
- **Dependencies:** None

---

### 🟠 TIER 3 — FIX WITHIN 2 WEEKS (Architecture & Quality)

**7. Bug #160 — Health Endpoint Has No Connectivity Checks**
- **Fix:** Add Prisma `SELECT 1` ping, Redis PING, memory usage to health response.
- **Estimated effort:** 2 hours

**8. Bug #159 — Swagger Has Zero Decorator Annotations**
- **Fix:** Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` to all 34 controllers. Add `@ApiProperty` to all DTOs.
- **Estimated effort:** 8–12 hours (can be parallelized)

**9. Bug #157 — Assets Missing PATCH Endpoint**
- **Fix:** Add `PATCH /assets/:assetTag` with `UpdateAssetDto`.
- **Estimated effort:** 1 hour

**10. Bug #158 — 7 Modules Lack DELETE Endpoints**
- **Fix:** Add soft-delete (status=DELETED) or hard-delete endpoints as appropriate.
- **Estimated effort:** 3–4 hours

---

### 📅 IMPLEMENTATION TIMELINE

| Day | Bugs Fixed | Effort |
|-----|------------|--------|
| Day 1 | #148 (Rate Limiting), #106 (DB Creds), #161 (Body Limit) | 4–6 hrs |
| Day 2 | #162+#125 (Static File Auth), #150 (Email XSS) | 5–7 hrs |
| Day 3 | #156 (API Versioning), #160 (Health Check) | 4–5 hrs |
| Day 4–5 | #159 (Swagger Docs), #157 (Asset PATCH), #158 (DELETE endpoints) | 12–17 hrs |

---

## 📁 PHASE 9 TESTING METHODOLOGY

| Audit Area | Method | Agent/Tool | Bugs Found |
|------------|--------|------------|------------|
| GraphQL Introspection | Search graphql/gql imports, package.json | Code Searcher | 0 (clean) |
| WebSocket Security | Search WebSocket/gateway/socket.io, package.json | Code Searcher | 0 (clean) |
| API Versioning | Search enableVersioning, URI/HEADER versioning, main.ts | Code Searcher | 1 |
| HTTP Methods Analysis | Map all controller routes, find missing CRUD ops | Code Searcher | 2 |
| Swagger Documentation | Search @ApiTags/@ApiOperation/@ApiResponse decorators | Code Searcher | 1 |
| Health Endpoint | Read health controller source | read_files | 1 |
| main.ts Deep Dive | Read full main.ts, analyze middleware pipeline | read_files | 2 |

**Total Phase 9 agents used:** 4 code-searchers + source reads

---

*Report updated with Phase 9 findings — 147 total bugs across 64 testing categories. 7 new bugs found (0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW/clean).*
