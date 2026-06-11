# SKYLINX PeopleOS — Complete Live-Demo Guide

A click-by-click script for demonstrating the product to reviewers. Follow top-to-bottom; every step says **where to click, what to type, and what should happen**. Hardcoded/demo-only items are called out honestly with suggested answers if asked.

---

## 0. Setup (before the meeting)

```powershell
cd C:\Users\chbha\Desktop\skylinx\HRMS\Hrms
npm install                       # once
npm run db:seed                   # idempotent; creates all demo data + all 4 logins
npm run dev -w @skylinx/api       # API on http://localhost:4000  (prefix /api/v1)
npm run dev -w @skylinx/web       # UI  on http://localhost:3000
```
Open **http://localhost:3000** → redirects to `/login`.
PostgreSQL must be running locally (database `skylinx_peopleos`).

**Credentials**
| Role | Email | Password |
|---|---|---|
| HR_ADMIN | hr.admin@skylinx.local | Skylinx@123 |
| MANAGER | rohan.iyer@skylinx.local | Skylinx@123 |
| EMPLOYEE | kabir.sethi@skylinx.local | Skylinx@123 |
| OWNER (super admin) | skylinxcode@gmail.com | password123 |

The login page has **Quick Access buttons** ("HR Admin", "System Owner") that pre-fill credentials — handy on stage.

---

## 1. HR_ADMIN walkthrough (the main act, ~15 min)

Login as `hr.admin@skylinx.local`.

### 1.1 Dashboard (`/dashboard`)
Loads live admin metrics (headcount, attendance, pending approvals). Point out the left nav = the full module map.

### 1.2 Employee Directory (`/employees`)
- Roster table with all 5 seeded employees. Click **Kabir Sethi** → profile drawer opens (personal, job, bank, documents).
- Click **Edit Profile** → change **Grade** dropdown to *Grade L1* → **Save Profile** → success; drawer reflects new grade. *(This grade drives the expense cap demo below.)*
- **Add Employee** panel: Employee Code `EMP-1006`, First/Last name, email `demo.user@skylinx.local`, joining date today → **Add Employee** → "Employee created" message; table refreshes automatically.
- **Documents**: pick employee, type *Aadhaar*, choose any file → **Add Document** → appears with verification status; **Verify** toggles it.

### 1.3 Attendance & Roster (`/attendance`)
- Top action bar: pick employee → **Check In** → log row appears; **Check Out** completes it.
- **Regularizations** tab: a seeded PENDING request from Kabir ("Biometric failure at entry gate") → click **Approve** → status flips, log corrected.
- **Overtime**: seeded 2.5h pending request → approve.
- **Shifts/Roster**: assign *General Shift* to an employee; bulk-assign also available.

### 1.4 Leave (`/leave`)
- **Apply Leave** toggle opens the form. **Wow-moment #1 (blackout date):** Employee *Kabir Sethi*, any leave type, From/To = **2026-06-25**, days 1, reason "trip" → **Apply Leave** → red banner: date falls in a **leave block list** → request rejected by API. 
- Apply again with a normal date (e.g. 2026-06-18) → success → appears in **Leave Requests** as PENDING.
- **Approve** it → balance decrements (check **Balances** tab) and a **Ledger** entry is written.
- **Leave Settings/Policies**: show leave types, policy assignment, block-list editor.
- **Leave Encashment**: Under the Leave console, employees can request Leave Encashment, which automatically debits their available balance and schedules a payment.
- **Process Accruals**: Click the **Process Accruals** trigger in Leave Settings to simulate earned-leave periodic accruals.

### 1.5 Expenses (`/expenses`)
**Wow-moment #2 (grade cap):** **New Claim** → Employee *Kabir Sethi* (Grade L1, cap ₹5,000), Category *Travel*, Amount **6000** → a live yellow warning appears as you type ("exceeds grade maximum ₹5000"); submit anyway → API returns 400 → red error banner. 
Resubmit with **3500** → success → approve it as manager later, or use **Manager Approve / HR Approve** buttons here to show the two-stage flow → **Reimburse**.

### 1.6 Payroll (`/payroll`)
- **Configurable Tax Slabs**: Go to the **Tax Slabs** tab in the Payroll console. Note the admin-editable tax slab values for both OLD and NEW tax regimes.
- **Payroll Corrections**: Under the **Corrections** tab, add an adjustment/arrear for an employee, which dynamically gets processed in their next payslip.
- **Create Run** for current month → **Calculate** → payslips generate with earnings/deductions (PF/ESI/PT/TDS components calculated from configured tax slabs) → open a payslip → **Lock** the run → **Bank Export**.
- **Gratuity**: Show the auto-computed Gratuity payout under the Gratuity ledger, computed from the configured company gratuity multiplier rules.
- Tax declarations & proofs and benefit claims panels show the compliance depth; `/compliance` has statutory dashboards + exports.

### 1.7 Recruitment (`/recruitment`)
Walk the pipeline left-to-right: **Requisition** (create + approve) → **Job Posting** → **Candidate** → **Application** (move stage) → **Interview** (schedule, submit feedback — consensus HIRE/HOLD/REJECT computed from interviewer votes) → **Offer** with terms.

### 1.8 Training (`/training`) & Travel (`/travel`)
- Training: create program → event → record feedback + result; **skill gap** analysis per employee.
- Travel: create request with itinerary → decide → advance disbursement.

### 1.9 Quick passes (1 min each)
`/insurance` (policy → dependent → claim approve), `/holidays` (add holiday), `/organization` (org chart, change manager), `/approvals` (cross-module inbox), `/analytics` + `/reports` (exports), `/rewards` (recognition + points), `/social` (post, like, comment — SkyNexus feed), `/notifications` (queue an alert), `/assets`, `/support` (ticket + comment), `/security` (audit logs of everything you just did).

### 1.10 Lifecycle clearance & F&F
- Under Employee directory `/employees` -> **Lifecycle** tab.
- Initialize exit separation. Record exit interview.
- Open **Full & Final Settlement**. Select the exiting employee -> note that **Gratuity**, **Leave Encashment Dues**, and **Last Drawn Salary** are automatically loaded as suggestions from their respective modules to pre-fill the settlement.

### 1.11 SaaS & Settings (`/saas`, `/settings`, `/setup`)
- `/saas`: plan catalogue (Basic free / Standard ₹1,749 / Pro ₹3,750), active plan **Pro**, usage meter.
- `/settings`: company profile, **branding** (change primary color → whole UI re-themes live), module toggles, client rules (attendance/leave rules consumed by validations).
- `/setup`: the tenant onboarding wizard.

### 1.12 Logout
Top-right **Logout** → token cleared → back to `/login`.

---

## 2. MANAGER walkthrough (~4 min) — `rohan.iyer@skylinx.local`

1. Dashboard shows **manager-scoped** metrics (his team).
2. `/leave` → Leave Requests → **Approve** a pending request (employee's balance updates).
3. `/attendance` → approve the regularization/overtime requests (if not already).
4. `/expenses` → **Manager Approve** a pending claim.
5. `/travel`, `/training` → decide pending requests.
6. **Boundary demo:** open `/payroll` or `/settings` → panels show permission-denied/empty states; the API returns 403 "Missing required permission". *This is correct RBAC, not an error.*
7. Logout.

## 3. EMPLOYEE walkthrough (~4 min) — `kabir.sethi@skylinx.local`

1. Dashboard = self-service view.
2. `/attendance` → **Check In** (self).
3. `/leave` → apply for leave (self only — employee dropdown is restricted).
4. `/expenses` → New Claim ₹6,000 → live cap warning + 400 (same wow-moment from the employee's seat); resubmit ₹3,500 → success.
5. `/payroll` → views **own payslips** only.
6. **Boundary demo:** `/recruitment`, `/settings` → restricted/empty states with 403s underneath.
7. Logout.

---

## 4. Hardcoded / demo-only items (be ready if asked)

| Item | Reality | Suggested answer |
|---|---|---|
| Seeded demo data | 1 company, 5 employees, 3 grades, plans, holidays etc. come from `seed.ts` | "Seed script gives a reproducible demo tenant; production onboarding runs through the `/setup` wizard and SaaS signup." |
| Bank account encryption | **Implemented (2026-06-11):** account numbers are AES-256 encrypted at rest (same scheme as PAN/PF numbers), API responses return only `accountNumberMasked` (last 4 digits), and the full number is decrypted ONLY inside the payroll bank-export | "Sensitive fields — PAN, PF account, bank account — are AES-256 encrypted at rest and masked in all API responses; the bank file export is the single decryption point, permission-gated and audit-logged." |
| Grade expense caps | L1=₹5,000 / L2=₹15,000 / L3=₹50,000 seeded; editable via Grades admin | "Caps are data, not code — HR can change them." |
| Plan prices & features | Hardcoded catalogue in `saas.service.ts` | "Plan catalogue will move to the Plans table for production billing." |
| Income tax slabs | Fully configurable via UI or seeded defaults | "Tax slabs are fully admin-configurable under the Tax Slabs editor tab in the Payroll console." |
| Email/WhatsApp sending | SMTP commented out in `.env`; WhatsApp provider disabled | "Notification records queue correctly; transports are env-config." |
| OWNER password | `password123` — change before any shared deployment | — |

## 5. What NOT to click live
- **`/performance`** — cycle scaffold exists but the appraisal KRA engine is roadmap; don't deep-dive.
- **Bulk upload** without a prepared CSV.
- **`/saas-admin` company status changes** — suspending the demo company mid-demo locks you out.
- Don't promise **loans** — documented roadmap gap.

## 6. If something breaks live
- API down? `npm run dev -w @skylinx/api`. UI stale? Hard-refresh (Ctrl+Shift+R).
- Reset demo data anytime: `npm run db:seed` (idempotent, safe).
- Evidence backup: if the live app misbehaves, the full screenshot audit in `docs/reference_blueprint/images/` (3 roles × 28 pages + deep flows) proves everything worked.
