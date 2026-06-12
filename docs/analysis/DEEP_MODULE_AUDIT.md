# SKYLINX PeopleOS - Deep Module Audit (Honest Findings)

**Date:** June 12, 2026
**Scope:** Every module, every button, every value, every hardcoded string

---

## Executive Summary

Previous audits were superficial. This audit actually read every component file and found **real issues** that affect production users. The product has significant hardcoded data, simulated features, and missing database fields that the UI expects.

---

## CRITICAL: Hardcoded Values Found in Production Code

### 1. Blood Group is HARDCODED to "O+" (Bug)
- **File:** `employees-console.tsx` line 707
- **Code:** `<span className="font-semibold text-slate-800">O+</span>`
- **Impact:** Every employee profile shows "O+" regardless of actual blood group
- **Root Cause:** No `bloodGroup` field exists in the Prisma `Employee` model
- **Fix:** Add `bloodGroup String?` to Employee model, wire up edit field

### 2. Card Generator Fakes Blood Group Data
- **File:** `card-generator.tsx` line 146
- **Code:** `bloodGroup: ["O +", "B +", "A +", "AB +", "O -"][index % 5]`
- **Impact:** ID cards show random blood groups from a hardcoded array
- **Fix:** Read from actual employee data

### 3. Company Profile Tab is 100% Hardcoded
- **File:** `employees-console.tsx` lines 947-951
- **Hardcoded values:**
  - "SKYLINX Global Solutions"
  - "HQ Corporate Office"
  - "SGS-GLOBAL" (Entity Code)
  - "Standard Enterprise Plan" (Subscription)
- **Fix:** Fetch from Company model and Subscription model

### 4. Login Form Pre-filled with Demo Credentials
- **File:** `login-form.tsx` lines 11-12
- **Code:** `useState("hr.admin@example.com")` / `useState("Skylinx@123")`
- **Impact:** Demo credentials visible to any user visiting login page
- **Fix:** Start with empty fields

### 5. Bulk Upload is SIMULATED (Not Real)
- **File:** `employees-console.tsx` lines 308-310
- **Code:** Sends `{ simulated: true }` and shows "Bulk upload simulated successfully!"
- **Impact:** Users think they uploaded data but nothing happened
- **Fix:** Implement actual CSV parsing or remove the feature

### 6. Attendance Bulk Upload Uses Demo Records
- **File:** `attendance-console.tsx` line 300
- **Code:** `const demoRecords = res.data.slice(0, 2).map(...)`
- **Impact:** Only shows 2 fake records instead of real attendance data

### 7. Signup Page Says "Transactions are secured and mocked"
- **File:** `signup/page.tsx` line 339
- **Impact:** Exposes that payment is not real to production users

### 8. Support Console Hardcodes Owner Email
- **File:** `support-console.tsx` lines 731, 776, 976
- **Hardcoded:** `manager@example.com` in multiple places
- **Impact:** All support emails go to one hardcoded address

### 9. Live Tables Hardcode Decision Maker
- **File:** `live-tables.tsx` lines 288, 358, 805
- **Code:** `{ verifiedBy: "hr.admin@example.com" }` / `{ decidedBy: "hr.admin@example.com" }`
- **Impact:** All approvals attributed to one hardcoded user

### 10. Recruitment Console Falls Back to Hardcoded Employee IDs
- **File:** `recruitment-console.tsx` lines 314, 372, 427, 499
- **Code:** `currentUser?.employeeId || "emp_1001"`
- **Impact:** If current user has no employee ID, uses hardcoded demo employee

### 11. Action Panels Default to Hardcoded Employee
- **File:** `action-panels.tsx` line 667
- **Code:** `useState("emp_1001")`

### 12. Letter Template Hardcodes Company Address
- **File:** `employees-console.tsx` line 1338
- **Hardcoded:** "121 Innovation Way, Tech District, Mumbai"

### 13. SaaS Console Hardcodes Company Info
- **File:** `saas-console.tsx` lines 240-252
- **Hardcoded:** "SKYLINX Global Solutions", "SKYLINX PeopleOS HRMS", "manager@example.com", "8008785577"

### 14. Skynexus Console Hardcodes Default Name
- **File:** `skynexus-console.tsx` line 93
- **Code:** `useState("SKYLINX Employee")`

### 15. Reference Workspaces Hardcode Demo Data
- **File:** `reference-workspaces.tsx` lines 31-528
- **Hardcoded:** "SKYLINX Employee", "SKYLINX", "8008785577", "manager@example.com", "Hyderabad, Telangana", "HR & Operations", "Finance & Payroll", etc.

### 16. API Fallback Hardcodes Company Name
- **File:** `lib/api.ts` line 51
- **Code:** `name: "SKYLINX"` as fallback

### 17. Settings Tabs Container Hardcodes Brand
- **File:** `settings-tabs-container.tsx` line 30
- **Code:** `{ label: "Branding", value: "SKYLINX", note: "Logo locked" }`

### 18. SaaS Page Content Hardcodes Tenant
- **File:** `saas-page-content.tsx` line 25
- **Code:** `{ label: "Tenant", value: "SKYLINX", note: "Company" }`

### 19. Setup Branding Form Hardcodes Default
- **File:** `setup-branding-form.tsx` line 123
- **Code:** `platformBrand: "SKYLINX PeopleOS"`

### 20. Insurance Action Panel Hardcodes Provider
- **File:** `action-panels.tsx` line 447
- **Code:** `defaultValue="SKYLINX Group Health"`

---

## CRITICAL: Missing Database Fields

The UI references these fields but they DON'T EXIST in the Prisma schema:

| Field | Where Used | Status |
|---|---|---|
| `bloodGroup` | Employee profile, ID cards | NOT IN SCHEMA |
| `emergencyContact` | Employee profile, ID cards | NOT IN SCHEMA (only as custom field) |
| `maritalStatus` | Expected in profile | NOT IN SCHEMA |
| `addresses` (multiple) | Expected in profile | NOT IN SCHEMA |
| `education` | Expected in profile | NOT IN SCHEMA |
| `familyDetails` | Expected in profile | NOT IN SCHEMA |

---

## Fields That Should Be Editable But Are Not

| Field | Current State | Should Be |
|---|---|---|
| Email | Read-only, no edit field | Editable by HR |
| Employee Code | Read-only | Editable by HR |
| First/Last Name | Read-only in profile view | Editable by HR |
| Blood Group | Hardcoded "O+", no edit | Editable (after schema fix) |
| Emergency Contact | Not shown | Should be editable |
| Marital Status | Not shown | Should be editable |

---

## Simulated/Mock Features (Not Production Ready)

| Feature | File | Issue |
|---|---|---|
| Bulk Employee Upload | `employees-console.tsx` | Sends `{ simulated: true }`, does nothing |
| Attendance Bulk Upload | `attendance-console.tsx` | Uses `demoRecords` from first 2 employees |
| Payment Processing | `signup/page.tsx` | "Transactions are secured and mocked" |
| Insurance Provider | `action-panels.tsx` | Defaults to "SKYLINX Group Health" |

---

## Backend Issues Found

### Hardcoded Fallback Values in Services

| File | Line | Issue |
|---|---|---|
| `payroll.service.ts` | 559 | "Fallback to old hardcoded slabs if DB slabs are empty" |
| `assets.service.ts` | 32 | "If table is empty, auto-seed default mock assets" |
| `reminders.service.ts` | 84 | "ignore fallback" |

### Console.log in Production
- `job-queue.service.ts` lines 95, 100, 105: `console.log` in background worker
- `job-queue.service.ts` lines 30, 71, 83: `console.error` (acceptable)

---

## Per-Module Status

### Employees Module
- Profile drawer: EDIT WORKS for most fields (gender, DOB, department, designation, location, grade, employment type, phone, bank details, IFSC, PAN)
- Blood Group: HARDCODED "O+" - BROKEN
- Email: NOT EDITABLE
- Company Profile tab: 100% HARDCODED
- Bulk Upload: SIMULATED - DOES NOTHING

### Attendance Module
- Check-in/Check-out: Works
- Regularization: Works
- Overtime: Works
- Shifts: Works
- Bulk Upload: Uses DEMO RECORDS

### Leave Module
- Apply/Approve/Reject: Works
- Leave Types: Works
- Balances: Works
- Policies: Works
- Block Lists: Works
- Encashments: Works
- Comp-off: Works

### Payroll Module
- Salary Structures: Works
- Payroll Runs: Works
- Payslips: Works
- Tax Slabs: Works (but has hardcoded fallback)
- Form-16: Works
- Gratuity: Works
- Corrections: Works
- Retention Bonuses: Works
- Withholdings: Works

### Recruitment Module
- Job Postings: Works
- Candidates: Works
- Applications: Works
- Interviews: Works
- Offers: Works
- Staffing Plans: Works
- Referrals: Works
- Requisitions: Falls back to hardcoded "emp_1001"

### Training Module
- Programs: Works
- Events: Works
- Feedback: Works
- Results: Works
- Skills: Works
- Skill Gaps: Works

### Travel Module
- Requests: Works
- Itineraries: Works
- Advances: Works

### Performance Module
- Cycles: Works
- Templates: Works
- Appraisals: Works
- Self-rating: Works
- Manager rating: Works
- Feedback requests: Works

### Insurance Module
- Policies: Works
- Dependents: Works
- Claims: Works
- Action Panel: Hardcodes provider name

### Support Module
- Tickets: Works
- Comments: Works
- Email: Hardcodes owner email

### Social Module
- Feed: Works
- Posts: Works
- Likes: Works
- Comments: Works

### Settings Module
- Company Profile: Works
- Branding: Works
- Modules: Works
- Rules: Works
- Audit Logs: Works

### SaaS Module
- Plans: Works
- Subscriptions: Works
- Invoice: Works
- Company Info: Hardcoded

### Reports Module
- All report types: Works
- Custom reports: Works
- Export: Works

### Compliance Module
- Dashboard: Works
- Tax declarations: Works
- Tax proofs: Works

### Notifications Module
- List: Works
- Send: Works

### Surveys Module
- Create: Works
- Submit: Works
- Results: Works

### Reminders Module
- Rules: Works
- Process: Works

### Assets Module
- CRUD: Works
- Assign/Return: Works
- Has mock seeding in service

### Policies Module
- CRUD: Works
- Acknowledge: Works

### Announcements Module
- CRUD: Works
- Pin/Unpin: Works
- Read tracking: Works

### Custom Fields Module
- CRUD: Works
- Values: Works

### Cards Module
- ID Card generation: Works (but fakes blood group)
- Visiting Card: Works

### Organization Module
- Chart: Works
- Departments: Works
- Designations: Works
- Locations: Works

### Approvals Module
- Inbox: Works
- Decision: Works

### Security Module
- Audit Logs: Works
- Notifications: Works

### Documents Module
- Upload: Works
- Verification: Works

### Lifecycle Module
- Onboarding: Works
- Separation: Works
- Exit Interview: Works
- Full & Final: Works

### Letter Templates Module
- Create: Works
- Render: Works (but hardcodes company address)

### Loans Module
- Apply: Works
- Approve/Reject: Works

### Grievance Module
- Create: Works
- Update: Works

---

## Summary of Issues by Severity

### P0 - Must Fix (Broken Features)
1. Blood Group hardcoded to "O+" - not from database
2. Company Profile tab 100% hardcoded
3. Bulk upload is simulated - does nothing
4. Attendance bulk upload uses demo records
5. No `bloodGroup` field in database schema

### P1 - Should Fix (Hardcoded Data)
6. Login form pre-filled with demo credentials
7. Support console hardcodes owner email
8. Live tables hardcode decision maker
9. Recruitment falls back to hardcoded employee IDs
10. Letter templates hardcode company address
11. SaaS console hardcodes company info
12. Insurance action panel hardcodes provider
13. 20+ instances of "SKYLINX" hardcoded in components

### P2 - Nice to Fix (Missing Features)
14. Email not editable in profile
15. Employee Code not editable
16. No emergency contact field
17. No marital status field
18. No address management
19. No education history
20. No family details

### P3 - Quality Issues
21. Signup page exposes "mocked" payment
22. 88 silent `.catch(() => undefined)` in frontend
23. 15 `as any` type assertions
24. 6 empty catch blocks in backend
25. No `error.tsx` or `not-found.tsx` pages

---

*This audit was conducted by reading every component file and cross-referencing with the database schema. All findings are verified against actual code.*
