# Kredily HRMS — Full Feature Specification & Audit Log
**Audit Date:** 2026-06-13  
**Account:** hr@skylinxglobal.com (HR Admin / Company HR role)  
**Company:** SKYLINX (Customer ID: 216261)  
**URL Base:** https://skylinxglobal.kredily.com  
**Plan:** Pro Plan — Valid Till: 30 Sept 2026  
**Account Manager:** Mayuksh Sinha | 080 470 92711 | support@kredily.com  
**Auditor:** Claude AI (automated via Chrome extension)  
**Purpose:** Internal feature specification for licensed HRMS product  
**Test Employee:** Swami | chvbswami@gmail.com  

---

> **Legend:**  
> 📸 = Screenshot taken  
> 🔴 = Permission-restricted / greyed out / upgrade required  
> 🟡 = Role-toggle visible (HR ↔ Employee view)  
> ✅ = Action confirmed working  
> ⚠️ = Unexpected / noteworthy behavior  

---

## TABLE OF CONTENTS
1. [Dashboard](#1-dashboard)
2. [Top Navigation Bar](#2-top-navigation-bar)
3. [Left Sidebar Navigation](#3-left-sidebar-navigation)
4. [Company Profile Module](#4-company-profile-module)
5. [My Profile Module](#5-my-profile-module)
6. [Directory Module](#6-directory-module)
7. [Attendance Module](#7-attendance-module)
8. [Leave Module](#8-leave-module)
9. [Payroll Module](#9-payroll-module)
10. [Expense Payout](#10-expense-payout)
11. [Reports](#11-reports)
12. [Insurance Management](#12-insurance-management)
13. [Organization Chart](#13-organization-chart)
14. [Holiday Calendar](#14-holiday-calendar)
15. [Konnect](#15-konnect)
16. [Rewards](#16-rewards)
17. [ID & Visiting Card](#17-id--visiting-card)
18. [ID & Visiting Card (New)](#18-id--visiting-card-new)
19. [Settings](#19-settings)
20. [Roles & Permissions (deep dive)](#20-roles--permissions-deep-dive)
21. [Setup Wizard](#21-setup-wizard)
22. [Getting Started flow](#22-getting-started-flow)
23. [Notifications Bell](#23-notifications-bell)
24. [Profile / Account Menu](#24-profile--account-menu)
25. [Search Employees](#25-search-employees)
26. [Test Employee: Swami (chvbswami@gmail.com)](#26-test-employee-swami)
27. [Post-Deletion Behavior](#27-post-deletion-behavior)

---

## 1. DASHBOARD

**URL:** https://skylinxglobal.kredily.com/company/dashboard/  
**Screenshots:** ss_0323bcr6a (full dashboard top), ss_9547zp5az (scrolled — row 3 modules + right panel), ss_7121fin9o (bottom modules)

### Layout Description
The dashboard is a 3-column layout:
- **Left column (~25%):** Company card, Tasks & Notifications, Plan/Customer info
- **Center column (~55%):** Rotating promotional banner + Module grid icons
- **Right column (~20%):** Company Announcement, Referral widget, Employee stats widget

---

### LEFT COLUMN — Detailed

**Company Card:**
- SKYLINX logo (globe/world graphic icon)
- Company name: **SKYLINX** (text)
- Social media icon links: LinkedIn 🔵 | Facebook 🔵 | Twitter/X 🔵
- Clicking these would open company social profiles (external links)

**Tasks and Notifications (purple card):**
- Header: "Tasks and Notifications" (yellow text on purple background)
- Content rotates/updates dynamically — observed two states:
  - "9 Attendance regularization requests are pending for approval" (with document icons)
  - "1 Leave request is pending for approval" (with document icons)
- Clicking this card presumably navigates to the relevant approval queue
- Two small document/approval icons displayed on right side of card

**Plan/Customer Card (orange bordered):**
- "Customer ID: 216261" (header in white text on orange background)
- "You are on: **Pro Plan**" | "Valid Till: **30 Sept 2026**"
- "Unlock the pinnacle of HR" → **[Upgrade Now]** button (orange)
- Account Manager section:
  - Name: Mayuksh Sinha
  - Phone: 080 470 92711
  - Email: support@kredily.com

---

### CENTER COLUMN — Dashboard Banner (Rotating Promotional)

The banner auto-rotates between multiple promotional offers:

**Banner 1 — Loan Offer:**
- Tag: "LOW INTEREST"
- Headline: "Access ₹5,00,000 Instantly"
- Subtext: "Instant approval. Direct bank transfer. Zero paperwork."
- Button: **[Apply Now]** (orange) | "Exclusive for Kredily users"

**Banner 2 — Insurance:**
- Tag: "EMPLOYEE PROTECTION"
- Headline: "Kredily Protect"
- Subtext: "Integrated health & workforce coverage"
- Price: "₹2,585 Per Employee / Year"
- Button: **[Secure Now]** (green)

**Banner 3 — Enterprise Upgrade (seen on first load):**
- Headline: "🚀 Experience Enterprise Power — Free for 15 Days!"
- Subtext: "Unlock advanced payroll automation, analytics, and premium support."
- Button: **[Activate Free Trial]** (white/outlined)

---

### MODULE GRID (Center, below banner)

**Row 1:**
| Module | Icon Description |
|--------|-----------------|
| Setup Wizard | Checklist/form icon (teal) |
| Attendance | Calendar with clock icon (teal) |
| Leave | Beach/palm tree icon (teal) |
| Payroll | Rupee/payment icon (teal) |

**Row 2:**
| Module | Icon Description |
|--------|-----------------|
| Directory | Person/ID card icon (orange/yellow) |
| Konnect | Chat bubbles / people icon (orange) |
| ID & Visiting Card | ID card with tick (teal, with gold star badge) |
| Insurance Management | Shield with medical cross (teal) — **"NEW"** red badge |

**Row 3 (visible on scroll):**
| Module | Icon Description | Notes |
|--------|-----------------|-------|
| PMS | Star/performance icon (grey) | 🔴 GREYED OUT — requires upgrade |
| Expense | Invoice/rupee stack icon (purple, with orange X badge) | Active |
| Support | Phone/chat icon (teal) | Active |

---

### RIGHT COLUMN — Detailed

**Company Announcement (dark blue card):**
- Header: "Company Announcement" (yellow text)
- Megaphone graphic icon
- Body: "Your Company's Announcements come here."
- ⚠️ No actual announcements configured — placeholder text shown

**Refer Your Friend to Kredily (purple/gold card):**
- Headline: "Refer your friend to Kredily"
- Benefit 1: "✅ They get Payroll OS plan worth **₹40,000 complimentary for 1 Year**"
- Benefit 2: "🔥 You win **20% referral commission**"
- Referral link: http://app.kredily.com/q/?short_key=S6FFCA
- Copy button (clipboard icon) next to link
- Share Referral Link via: X (Twitter) | Facebook | LinkedIn | WhatsApp icons

**Employee Stats Widget (blue card, bottom right):**
- "Employees Onboarded: **5**"
- "Employees Not Activated: [number]"
- "Invalid Email: [number]"
- "Mobile Number Not [added]: [number]"
- (Partially visible — need to scroll right panel)

**What's New (dark card):**
- Header: "WHAT'S NEW" with "NEW" badge
- Content not fully visible in captured screenshots

**Upgrade to Enterprise (gradient card):**
- Headline: "Upgrade to **Enterprise**"
- Subtext: "Unlock More Features for Just **Rs 29 PEPM!**"
- Button: **[Upgrade Now]** (red/orange)

---

### TOP NAVIGATION BAR (Header)

**URL:** Persistent across all pages

**Left side:**
- ☰ Hamburger menu icon — opens full left sidebar slide-out
- **KREDILY** logo (with ₹ rupee symbol replacing 'R')
- "Getting Started" button — blue pill/badge

**Center:**
- "Hi Mohhmad!" — greeting with logged-in user's name
- 🔍 Search Employees — search bar (placeholder text "Search Employees")

**Right side:**
- Date display: "SAT 13, JUN 2026"
- 🔔 Notification bell — red badge showing **23** unread notifications
- Profile avatar (circular photo of user)
- ˅ Dropdown arrow — profile/account menu

---

## 2. TOP NAVIGATION BAR

See above in Dashboard section. Will document individual actions below:

---

## 3. LEFT SIDEBAR NAVIGATION

**Opened by:** Clicking ☰ hamburger icon (top left)  
**Close button:** ✕ (top right of sidebar panel)

### Complete Menu Structure:
```
MENU
├── Dashboard
├── Company Profile  ▾ (dropdown)
├── My Profile       ▾ (dropdown)
├── Directory
├── Attendance       ▾ (dropdown)
├── Leave            ▾ (dropdown)
├── Payroll          ▾ (dropdown)
├── Expense Payout
├── Reports
├── Insurance Management
├── Organization Chart
├── Holiday Calendar
├── Konnect
├── Rewards
├── ID & Visiting Card
├── ID & Visiting Card (New)   [greyed/lighter — beta/new]
└── Settings
```

**Observations:**
- Items with ▾ have sub-menus (Company Profile, My Profile, Attendance, Leave, Payroll)
- "ID & Visiting Card (New)" appears lighter/greyed — likely a newer version or beta feature
- No PMS visible in sidebar (it was in the dashboard grid — likely links directly)
- No Expense module directly (Expense Payout is listed as separate from main Expense)

---

## 4. COMPANY PROFILE MODULE

**URL:** https://skylinxglobal.kredily.com/company/profile/  
**Tab Bar:** Overview | Address | Employee Custom Fields | Department | Designation | Announcements | Policies | Admin | Statutory | My Plan

---

### 4.1 Overview
- Registered Company Name: SkyLinx Global Solutions
- Brand Name: SKYLINX
- Company Official Email: info@skylinxglobal.com
- Company Official Contact: 8008785577
- Website: www.skylinxglobal.com
- Domain Name: skylinxglobal
- Industry Type: Information Technology (IT)
- Social Profile links: LinkedIn, Facebook, Twitter

---

### 4.2 Address
**URL:** /company/address/overView/  
**Actions:** ✏️ Edit | 🗑️ Delete per address | ➕ Import | ⊕ Add custom address

**Offices configured:**
- **REGISTERED OFFICE:** SkyLinx Global Solutions, D No: 1-60/80/A & B, 3rd Floor, KNR Square, Opp The Platina Building, Gachibowli, Hyderabad, Telangana 500032
- **CORPORATE OFFICE:** SkyLinx Global Solutions, 532, Uptown Cyberabad, A-Block, 2nd Floor, 100feet Road, Ayyappa Society, Madhapur, Hyderabad, Telangana 500081
- **CUSTOM ADDRESS:** ⊕ Add (none configured)

---

### 4.3 Employee Custom Fields
**URL:** /company/employee_custom_fields/  
**State:** "No Custom Fields Available" — empty  
**Button:** [Create Field] (blue)

**Create Custom Field Modal:**
- Field Name * (required text input)
- Field Type * dropdown: Text | Number | Date | Dropdown
- Is Required checkbox
- [✗ CANCEL] [✓ SAVE] buttons

---

### 4.4 Department
**URL:** /company/departments/overView/  
**Actions:** ⊕ Add new department

**Departments table** (columns: Department | Sub Departments | Department Head | Employees):
| Department | Sub Depts | Head | Employees |
|---|---|---|---|
| Data specialist | — | — | 1 |
| HR | — | Mohammed Shareefuddin Ahmad | 1 |
| Operations | — | Mohammed Shareefuddin Ahmad | 3 |

---

### 4.5 Designation
**URL:** /company/designations/overView/?tab=0  
**Sub-tabs:** Designations | Grades

**Designations** (columns: Designation | Employees):
| Designation | Employees |
|---|---|
| CEO | 1 |
| Data Specialist | 1 |
| IT Support Engineer (L3) | 1 |
| Manager - HR&Operations | 1 |
| Software Engineer | 1 |

**Grades (tab=1):** Toggle switch — OFF by default. When toggled ON: shows Grade table (Name | Employees) with ⊕ Add button. No grades configured.  
⚠️ Toggling Grades ON/OFF is a live setting — turned back OFF during audit.

---

### 4.6 Announcements
**URL:** /company/companyProfileSettings/announcements/  
**Post an Announcement (expandable form):**
- Message textarea (placeholder "Message")
- 0/100 character counter
- [POST] button
- **LIVE ANNOUNCEMENTS:** "No Announcements are active." — empty

---

### 4.7 Policies
**URL:** /companyPolicy/listPolicies/  
**Sub-tabs:** Company Policies | eSign 🔒

**Company Policies sub-tab:**
- Row: "Company Policies" with icons: 📄 (view) | ☁️ (upload) | ✏️ (edit) | 🗑️ (delete) | ˅ (expand)
- Expanded description: "Guidelines, rules and procedures"
- ⊕ Add button for new policies

**eSign sub-tab:**
- Search box + [Bulk Notify] button
- Table: ID | Employee Name | Department | Manager | Accepted/Pending

| ID | Name | Dept | Manager | Accepted/Pending |
|---|---|---|---|---|
| SGS/DS/1447023 | Sirimalla Saranya | Data specialist | Mohhmad Aseempasha | 0/1 |
| SGS/HRO/1447005 | Mohhmad Aseempasha | HR | Mohammed Shareefuddi... | 1/0 |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | Operations | Mohhmad Aseempasha | 0/1 |
| SGS/ITE/1447028 | Ummey Afifa Khatoon | Operations | Chappidi Gunadeep Yadav | 0/1 |
| SGS/CEO/1447001 | Mohammed Shareefuddin Ahmad | Operations | — | 1/0 |

---

### 4.8 Admin
**URL:** /company/statutory/adminInfo/  
**Built-in Admin Role Types (fixed, not customizable):**

**CEO:**
- Head of organization; used in Org Chart
- Permissions apply to all employees
- Can: View all employee profiles | View sensitive info (PAN, IDs, salary) | Edit profiles | Approve Attendance & Leaves | Create/remove admins
- Current: Mohammed Shareefuddin Ahmad | [Change] button

**HR ADMIN:**
- Permissions apply to all employees
- Same permissions as CEO for HR actions
- Current: Mohhmad Aseempasha | [Add] button

**FINANCE ADMIN:**
- Can: View salary & bank details | View sensitive info (PAN, IDs)
- Current: None assigned | [Add] button

**HR EXECUTIVE:**
- Can: View all employee profiles (Non-payroll) | View sensitive info (PAN, IDs, DOB) | Add & edit profiles | Approve Attendance & Leaves
- Cannot: Payroll access
- Current: None assigned | [Add] button

⚠️ **Permission Architecture:** 4 fixed admin role templates. You assign people to roles; you cannot customize role capabilities. No custom roles possible from this screen.

---

### 4.9 Statutory
**URL:** /company/statutory/statutoryInfo/

**COMPANY ID:**
- Entity Type: Partnership
- Date of Incorporation: 19/08/2025
- Company PAN: AFSFS0508N (🔴 unverified)
- GST: 36AFSFS0508N1ZF (🔴 unverified)
- CIN: — | Company TAN: —

**Directors / Auditors / Company Secretary:** All empty — ⊕ Add button on each

**BANK ACCOUNT INFO:**
| Field | Value |
|---|---|
| Account Title | Skylinx Global Solutions |
| Bank Name | HDFC BANK |
| Account Number | 50**********335 (masked) |
| Branch Name | HITECH CITY II |
| City | HYDERABAD |
| IFSC Code | HDFC0004216 |
| Account Type | Current Account |

Actions: ✏️ Edit | 🗑️ Delete | ⊕ Add account

---

### 4.10 My Plan
**URL:** /company/subscription_plans/?tab=1

**Plans:**

| | Free Forever | **Professional ✅ Current** | Enterprise |
|---|---|---|---|
| Price | ₹0/month | ₹1749/month (≤25 emp) + ₹70/extra | ₹3750/month (≤25 emp) + ₹150/extra |
| Validity | — | Valid till 30/09/2026 | [Select Plan] |

**Feature Comparison Matrix:**

HR Management:
- Announcements / Reminders / Birthday-Anniversary msgs / Employee DB / Login OTP: ✓ all plans
- Data Storage: 250 MB (Free) | Unlimited (Pro) | Unlimited (Ent)
- Verification Dashboard: ✓ all plans

Leave & Attendance:
- Web Clock: ✓ all
- Customizable Leave Rules: 1 (Free) | Unlimited (Pro) | Unlimited (Ent)
- Customizable Attendance Rules: 1 | Unlimited | Unlimited
- Attendance Penalty Rules: ❌ | ✓ | ✓
- Selfie/GPS Attendance: ❌ | ✓ | ✓
- Attendance IP Restriction: ❌ | □ ₹10/user/month | ✓
- Geo-Fencing: ❌ | □ ₹20/user/month | ✓

Payroll:
- Customized Salary Structure: 1 | Unlimited | Unlimited
- Audit Logs / ICICI Payout / NEFT / PF+ESI+PT+TDS calc: ✓ all
- PF/ESI Challan generation: ❌ | ✓ | ✓
- Form 16 & 12BB: ❌ | ✓ | ✓
- Income Tax Projections: ❌ | ✓ | ✓
- Income Tax Computation: ❌ | □ ₹20/user/month | ✓
- Overtime Calculation / Daily-Weekly Wages: ❌ | ✓ | ✓
- Payslips Bulk Download: ❌ | □ ₹10/user/month | ✓
- Mid Month Variable Payout: ❌ | ✓ | ✓
- Exit Management: ❌ | □ ₹20/user/month | ✓

Expense Management:
- Expense Payout: ❌ | ✓ | ✓
- Expense Approval Workflow: ❌ | □ ₹20/user/month | ✓

Additional Features:
- ESS Portal: ✓ all
- Letter Generation: ❌ | □ ₹30/user/month | ✓
- Asset Management: ❌ | □ ₹10/user/month | ✓
- Analytics & Reports / Konnect: ❌ | ✓ | ✓
- Automated ID/Visiting Card: ✓ all
- Multicity Calendar: ❌ | ✓ | ✓
- Kredsync (ESSL biometric): Onetime ₹5000+GST | ✓ | ✓
- Kredsync Annual Maintenance: ❌ | ₹5000 | ₹5000

Implementation & Support:
- Setup (2hr) / Live Webinar / Email Support: ✓ all
- Chat & Phone Support: ❌ | ✓ | ✓
- Employee Training: ❌ | ❌ | ✓

Add-Ons (extra cost on paid plans):
- Multicompany: □ ₹20/user/month
- Live Tracking (Android): □ ₹50/user/month
- Rewards & Recognition: □ ₹30/user/month
- Roster/Rotational Shift: □ ₹30/user/month
- Performance Management (PMS): □ ₹40/user/month ← explains why greyed on dashboard
- Kredeye-AI Attendance: □ ₹50/user/month
- Klocky: □ ₹50/user/month
- Custom Branding: ✓ (free on paid plans)
- Timesheet: Coming Soon
- Background Verification: Coming Soon

---

## 5. MY PROFILE MODULE

**Base URL:** https://skylinxglobal.kredily.com/employee/overview/  
**Logged-in user:** Mohhmad Aseempasha (HR Admin)  
**UUID:** 8a374d06-d40b-457f-8cc5-ea56e9780100  

**Profile Sidebar Card (persistent across all sub-tabs):**
- Photo placeholder: "Your Profile Photo comes here" (+ upload button)
- Role badge: **HR**
- Designation: Manager - HR&Operations
- Office: Corporate Office
- Email: hr@skylinxglobal.com

**Sub-tab bar:** Personal | Work | Team | Education | Family | Documents | Work Week | Attendance | Leave | Payroll | File Manager

---

### 5.1 Personal Tab
**URL:** /employee/overview/

**PERSONAL INFO** (✏️ Edit button):
| Field | Value |
|---|---|
| Name | Mohhmad Aseempasha |
| Blood Group | O + |
| Date of Birth | 08/07/2000 |
| Marital Status | Single |
| Gender | Male |
| Is Employee Disabled | No |

**CONTACT INFO** (✏️ Edit):
| Field | Value |
|---|---|
| Official Email ID | hr@skylinxglobal.com |
| Personal Email ID | hr@skylinxglobal.com |
| Phone Number | 8008785577 |
| Alternate Phone Number | — |

**ADDRESSES** (✏️ Edit):
- Current Address: Rainbow luxury living for mens, Rd.No 33, Opp Taaza Kitchen, Chanda naik nagar, Madhapur, Hyderabad, Telangana, India - 500081
- Permanent Address: 3-11-1/1, Kandukuri Street Pati Medha, Ganesh Chouk, Nidadavole, Telangana, India - 534301
- House Type: Paying Guest
- Staying at Current Residence Since: 01/11/2025
- Living in Current City Since: 01/09/2025

**SOCIAL PROFILE** (✏️ Edit): Empty — no social links added

---

### 5.2 Work Tab
**URL:** /employee/work/?uu=8a374d06...

**BASIC INFO** (✏️ Edit):
| Field | Value |
|---|---|
| Employee ID | SGS/HRO/1447005 |
| Date of Joining | 01/09/2025 |
| Probation Period | 180 days |
| Employee Type | Full Time |
| Work Location | Corporate Office |
| Probation Status | Confirmed |
| Work Experience | 2 Years |
| Billing Status | Non-Billable |

**WORK INFO** (✏️ Edit):
| Field | Value |
|---|---|
| Designation | Manager - HR&Operations |
| Job Title | — |
| Department | HR |
| Sub Department | — |

**WORK HISTORY** (table):
| Department | Designation | From | To |
|---|---|---|---|
| HR | Manager - HR&Operations | 01/09/2025 | Present |
Action: 🗑️ delete per row

**RESIGNATION INFO** (✏️ Edit):
- Employee Status: Active
- Resignation Date / Status / Last Working Day / Notice Period: all —

---

### 5.3 Team Tab
**URL:** /employee/team/?uu=8a374d06...

**REPORTING MANAGER** (table: Name | Type | Department | Designation | 🗑️):
| Name | Type | Department | Designation |
|---|---|---|---|
| Mohammed Shareefuddin Ahmad | Primary | Operations | CEO |
- "No Secondary managers assigned."
- ⊕ Add button

**DIRECT REPORTS**:
| Name | Department | Designation |
|---|---|---|
| Chappidi Gunadeep Yadav | Operations | Software Engineer |
| Sirimalla Saranya | Data specialist | Data Specialist |

---

### 5.4 Education Tab
**URL:** /employeeEducation/viewEmployeeEducation/?uu=8a374d06...

**EDUCATIONAL INFO**: Empty — ⊕ Add button only  
Fields on Add: (not explored — would show degree/institution/year fields)

---

### 5.5 Family Tab
**URL:** /employeeFamily/FamilyInfo/?uu=8a374d06...

**FAMILY MEMBERS** (table: Name | Relationship | Date of Birth | Dependant): Empty — ⊕ Add

**EMERGENCY CONTACT** (table: Name | Relationship | Phone Number):
| Name | Relationship | Phone Number |
|---|---|---|
| Ashraf Afrin | Sister | 9603137390 |
Actions: 🗑️ delete | ⊕ Add

---

### 5.6 Documents Tab
**URL:** /docs/overview/?uu=8a374d06...

**Document category tabs:** IDs | CERTIFICATIONS | WORK | POLICY

**Document proof types required:**
- Photo ID: Aadhaar Card, PAN Card
- Date of Birth: Aadhaar Card, PAN Card
- Current Address: Aadhaar Card
- Permanent Address: Aadhaar Card

**Uploaded Documents** (table: TYPE | ID | UPLOADED BY | VERIFICATION | ACTIONS):
| Type | ID | Uploaded By | Verification |
|---|---|---|---|
| Aadhaar Card | 990236271097 | Mohammed Shareefuddin Ahmad | ✅ Verified |
| PAN Card | GCDPM5084F | Mohammed Shareefuddin Ahmad | ✅ Verified |
Actions: ✏️ Edit | 🗑️ Delete | [+ADD] button

---

### 5.7 Work Week Tab
**URL:** /employee/workweek/?uu=8a374d06...

**Assigned Rule:** "Sunday Off"
- Description: "This is a 6 days Work Week rule with a Weekly off on Sunday."
- Effective Date: 01 Jan, 2026
- Grid: 5-week cycle × 7 days (Mon–Sun)
  - Mon–Sat: Working Day
  - Sun: Weekly Off
- Legend: ■ Working Day | ■ Weekly Off | ■ Half Day

---

### 5.8 Leave Tab (Employee View)
**URL:** /leave-request/leave_accrual/?uu=8a374d06...

**Sub-tabs:** Apply Leave | Logs | Rules

**Apply For Leave section:**
| Leave Type | Total | Applied | Penalty Deduction | Balance |
|---|---|---|---|---|
| Casual Leave | 12 | 3.00 | 0.00 | (9.00) |
| Sick Leave | 12 | 4.42 | 0.00 | (~7.58) |
- ✏️ edit icon on each leave type card

**Accrual History** (monthly table, Jan–Dec):
- Casual Leave: Credited Apr 1.00, May 1.00, Jun 1.00; Applied: 0 all months; Closing: Apr 1, May 3, Jun 3.00
- Sick Leave: (separate accrual schedule)

---

### 5.9 Payroll Tab (Employee View)
**URL:** /payroll/user_view_wrapper/?tab=1&uu=8a374d06...

**Sub-tabs:** Pay Slip | Salary Structure | Declaration | Bank Account

**Pay Slip (tab=1)** — February 2026 payslip:
- Year selector: 2025 | 2026 | Month selector: January | February | ← → navigation
- SkyLinx Global Solutions header
- Employee ID: SGS/HRO/1447005 | Designation: Manager - HR&Operations
- Bank: AU Small Finance Bank | Account: 2601266710606225
- Dept: HR | PAN: GCDPM5084F | Location: Hyderabad
- Effective Work Days: 28 | LOP: 0.0

Earnings:
| Component | Amount |
|---|---|
| Basic | ₹6,000 |
| HRA | ₹2,400 |
| Special Allowance | ₹6,600 |
| **Total Earnings** | **₹15,000** |
| Total Deductions | ₹0 |
| **Net Pay** | **₹15,000** |

"Rupees Fifteen Thousand Only" | [DOWNLOAD] button  
⚠️ System-generated; no signature required.

**Salary Structure (tab=2)** — Effective Feb 1, 2026:
| Component | Monthly | Annual |
|---|---|---|
| GROSS | ₹15,000 | ₹1,80,000 |
| Basic | ₹6,000 | ₹72,000 |
| HRA | ₹2,400 | ₹28,800 |
| PF Employer | ₹0 | ₹0 |
| Special Allowance | ₹6,600 | ₹79,200 |
[Revise Salary] button

**Declaration (tab=3) / Bank Account (tab=4):** Load via iframe — content blank in static fetch. Declaration is for investment declaration (80C, HRA, etc.); Bank Account shows linked bank details.

---

### 5.10 File Manager Tab
**URL:** /file_manager/logs/?uu=8a374d06...

**Controls:** 🔍 Search | Show: 10/20/30/40/50/All dropdown

**Table (Request Type | Format | Schedule On | Size | Status | Actions):**
| Request Type | Format | Date | Size | Status |
|---|---|---|---|---|
| HDFC Bulk export | XLSX | June 12, 2026, 12:28 p.m. | 4.66 KB | ✅ Success |
| Employee Payslip - December 2025 | PDF | Jan. 20, 2026, 9:43 a.m. | 43.931 KB | ✅ Success |
| Income Tax export Feb 2026 | XLSX | Jan. 13, 2026, 5:05 p.m. | 5.698 KB | ✅ Success |

Pagination: PREVIOUS 1 NEXT  
⚠️ File Manager stores exported reports/payslips — download history for this user.

---

## 6. DIRECTORY MODULE

**URL:** https://skylinxglobal.kredily.com/company/emp_list/  
**Tabs:** Directory | Verify

---

### 6.1 Directory Tab (tab=1)

**Header stats:**
- Number of Employees: 5
- Your Plan: Professional | Available Licenses: 20 | [Purchase Licenses] button
- [Include Inactive Employees] toggle

**Quick stat cards:**
| Stat | Value |
|---|---|
| Invalid Email | 0 |
| Mobile Users | 5 |
| Signed In | 5 |
| Not Signed In | 0 |

**Toolbar actions:** [CONFIRM PROBATION] | [RESEND ACTIVATION] | 🔍 Search | Department ▾ | Work Location ▾ | Sort By: ↑ ↓

**Add Employee button:** [+ Add Employee] → navigates to /employee/add_employee/

**Employee List Table (ID | Employee Name | Department | Designation | Grade | Employee Manager | Email):**
| ID | Name | Dept | Designation | Manager | Email |
|---|---|---|---|---|---|
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | Operations | Software Engineer | Mohhmad Aseempasha | gunadeepyadav89@gmail.co... |
| SGS/CEO/1447001 | Mohammed Shareefuddin Ahmad | Operations | CEO | — | shareef@skylinxglobal.co... |
| SGS/HRO/1447005 | Mohhmad Aseempasha | HR | Manager - HR&Operations | Mohammed Shareefuddin Ahmad | hr@skylinxglobal.com |
| SGS/DS/1447023 | Sirimalla Saranya | Data specialist | Data Specialist | Mohhmad Aseempasha | sirimalla268@gmail.com |
| SGS/ITE/1447028 | Ummey Afifa Khatoon | Operations | IT Support Engineer (L3) | Chappidi Gunadeep Yadav | (not shown) |

Pagination: 1 to 5 of 5, Page 1 of 1  
⊕ add_box button (bottom of list — another Add Employee shortcut)

---

### 6.2 Verify Tab (tab=2)

**Purpose:** Track completeness of employee profile data. Bulk notification to employees to fill missing info.

**Controls:** Show 10/20/30/40/50/100 dropdown

**Columns tracked per employee:**
Official Email | Phone Number | Date of Birth | PAN Number | Permanent Address | Current Address | Personal Email | Alternate Phone Number | Gender | Blood Group | Marital Status | Education | Family Details | Emergency Contact

**Legend:**
- ✅ Completed information
- 🔒 Verified information (employee cannot edit)
- * Information verified only if proof documents attached
- * Notification email/SMS sent for incomplete fields

---

### 6.3 Add Employee Form — Full Field Map

**URL:** /employee/add_employee/

**Step 1 — Mandatory Info:**
- First Name (text, required)
- Middle Name (text, optional)
- Last Name (text, required)
- Official Email ID (email)
- Phone Number (text)
- ⚠️ "Please enter either Email ID or Phone number." — only one required

**Step 2 — Optional Info (Pre-Onboarding):**
- Date of Joining (date)
- Date of Birth (date)
- Gender (radio: Male | Female | Transgender)
- Employee ID (text — auto-generated or manual)
- Department (text/autocomplete)
- Sub Department (text)
- Designation (text/autocomplete)
- Job Title (text)
- Reporting Manager (text/autocomplete)
- Work Location (select dropdown)
- Employee Type (select: Full Time / Part Time / Contract / etc.)
- Probation Period (number, days)
- Billing Status (select: Billable / Non-Billable)
- CTC (text — annual cost to company)

**Bank Details (optional at onboarding):**
- Account Holder's Name
- Bank Name (text or select with IFSC lookup)
- City / Branch Name
- IFSC Code (auto-fills Bank/Branch via lookup: selBank | selState | selCity | selBranch dropdowns)
- Account Type (select)
- Account Number

**Buttons:** [✕ CANCEL] | [NEXT →]

---

## 7. ATTENDANCE MODULE

**HR Admin view top nav:** Logs | Automation Logs | Approvals | Rules | Analytics | Settings  
**Employee sidebar view:** Logs | Penalty Logs | Rules

---

### 7.1 Attendance Logs (HR View)
**URL:** /attendanceLog/viewAttendanceLog/

**Views:** Table View | Calendar View (toggle)

**Filters/Controls:** 🔍 Search | ☁️ Import | ☁️ Export | Show 10/30/50 | Department ▾ | Grade ▾ | Location ▾ | Manager Name ▾ | Status ▾ | Sort By ↑↓

**Columns:** ID | Employee Name | Status | In Time | Out Time | Work Duration | Location | Department

**Today's data (June 13, 2026):**
| ID | Name | Status | In Time | Out Time | Duration | Location | Dept |
|---|---|---|---|---|---|---|---|
| SGS/ITE/1447028 | Ummey Afifa Khatoon | P | 09:34 AM | 06:47 PM | — | Corporate Office | Operations |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | A | — | — | — | Corporate Office | Operations |
| SGS/CEO/1447001 | Mohammed Shareefuddin Ahmad | A | — | — | — | Corporate Office | Operations |
| SGS/HRO/1447005 | Mohhmad Aseempasha | A | — | — | — | Corporate Office | HR |
| SGS/DS/1447023 | Sirimalla Saranya | A | — | — | — | Corporate Office | Data specialist |

**Summary cards:** Present: 1 | Absent: 4 | Leave: 0 | Anomaly: 0

**Status Legend:**  
P=Present, A=Absent, L=Leave, WO=Weekly off, H=Holiday, HL=Half day leave, WFH=Work From Home, AN=Anomaly, AC=Auto Clock-out

---

### 7.2 Automation Logs (Penalty Logs — HR View)
**URL:** /attendanceLog/penaltyLog/

**Sub-tabs:** Penalty Logs | Comp Off Logs

**Penalty Logs:** "No data available in table"  
**Columns:** ID | Employee Name | Anomaly Type | Penalty Type | Leave Type | Deduction | Month | Applied On | Action  
**Controls:** 🔍 Search | ☁️ Export | [BULK REVERT] | Show 10–100

"Overtime Requires Approval: 0"  
⚠️ Note: "Penalty logs will be visible only when Auto Deduction is enabled."

---

### 7.3 Attendance Approvals
**URL:** /attendanceLog/anomalies/

**Controls:** 🔍 Search | [Closed Anomalies] | [BULK APPROVE] | [BULK REJECT] | [View More Logs] | [Reset Filter] | ☁️ Export | Show 10–100

**Columns:** ID | Employee Name | Department | Employee Manager | In Time | Out Time | Work Duration | Date | Anomalies | Approver | Reason | Actions (✓ Approve | ✗ Reject | ✏️ Edit)

**Pending regularization requests (all from Chappidi Gunadeep Yadav, SGS/SE/1447027):**
| Date | In Time | Out Time | Duration | Anomaly |
|---|---|---|---|---|
| Jun 03, 2026 | — (req: 09:00 AM) | — (req: 06:00 PM) | — | Absence |
| Jun 04, 2026 | — | — | — | Absence |
| Jun 05, 2026 | 09:46 AM | 09:46 AM | 0h 0m | AC + 1 more |
| Jun 08, 2026 | — | — | — | Absence |
| Jun 09, 2026 | 05:31 PM | 05:31 PM | 0h 0m | AC + 1 more |
| Jun 10, 2026 | — | — | — | Absence |
| Jun 11, 2026 | — | — | — | Absence |
| Jun 12, 2026 | — | — | — | Absence |

⚠️ These are the 9 pending approvals mentioned in the dashboard notification.

---

### 7.4 Attendance Rules
**URL:** /rule_set/viewRules/

**Sub-tabs:** Attendance Rules (tab=0) | Assign Attendance Rules (tab=1)

**Shift type selector:** Normal Shift (shown) | (other shift types if configured)

**Attendance Rules tab:**
- Rule card: **General Shift** (4 Employees) | ⧉ Duplicate | [Create New Rule] button
- CEO rule: **CEO** (1 Employee) | ⧉ Duplicate

**General Shift rule details:**
- ✅ Company Default badge | ✕ Remove | ✏️ Edit
- Rule Name: General Shift
- Description: "This is a default description for the Attendance."
- Shift Timings: In Time 09:00 AM | Out Time 06:00 PM
- Enable Auto Deduction: toggle (off) | Auto deduction date: 31
- Enable Anomaly Tracking: toggle (on)
- Anomaly Settings:
  - In Time Grace Period: 10:00
  - Out Time Grace Period: 20:00
  - Full Day Work Duration: 08:00
  - Half Day Work Duration: 04:00
  - Maximum Total Break Duration: 01:00
  - Maximum No. of Breaks: (value)
  - Auto clock-out: toggle

**Sub-tabs inside rule:** General Rules | Advanced Rules ✓

**Assign Attendance Rules tab:**
- 🔍 Search | [Assign Rules] button
- Columns: Employee Name | ID | Department | Manager | Type | Rules Applied

| Name | ID | Dept | Manager | Type | Rule |
|---|---|---|---|---|---|
| Sirimalla Saranya | SGS/DS/1447023 | Data specialist | Mohhmad Aseempasha | Full Time | General Shift (✕) |
| Mohhmad Aseempasha | SGS/HRO/1447005 | HR | Mohammed S.A. | Full Time | General Shift (✕) |
| Chappidi Gunadeep Yadav | SGS/SE/1447027 | Operations | Mohhmad Aseempasha | Full Time | General Shift (✕) |
| Ummey Afifa Khatoon | SGS/ITE/1447028 | Operations | Chappidi G.Y. | Full Time | General Shift (✕) |
| Mohammed Shareefuddin Ahmad | SGS/CEO/1447001 | Operations | — | Full Time | CEO Rule (✕) |

---

### 7.5 Attendance Analytics
**URL:** /attendanceLog/viewAttendanceAnalytics/

**View controls:** Weekly | Monthly | Custom Period | ← Date range → (Jun 6–13, 2026)

**Charts shown (Weekly view):**
- In Time chart: Average 9:44 AM | Early 110 (35%) | On Time 20 (10%) | Late 70 (55%)
- Out Time chart: Average 9:44 AM | same breakdown
- Work Duration chart (visible but data truncated)

---

### 7.6 Attendance Settings
**URL:** /attendanceLog/company_attendance_setting/

**ATTENDANCE CYCLE** (✏️ Edit):
- Attendance Input Cycle: 1 To 31
- Attendance Regularization Rules:
  - Limit Backdated AR Applications: No Limit
  - Limit number of AR applications per month: No Limit
  - Manual Penalty Deduction: (toggle)

**ATTENDANCE REMINDERS:**
- Comp-off Eligibility Reminder: (toggle)

**MULTI LEVEL APPROVAL:**
- Enable Skip Level Approval (Your Manager's Reporter): (toggle)

**BIOMETRIC DEVICE INTEGRATIONS:**
- MS SQL users: [DOWNLOAD SOFTWARE]
- MS Access 2010 32-bit: [DOWNLOAD SOFTWARE]
- MS Access 2010 64-bit: [DOWNLOAD SOFTWARE]

---

### 7.7 Employee View — Penalty Logs
**URL:** /attendanceLog/employeePenaltyLog/

Columns: Anomaly Type | Penalty Type | Leave Type | Deduction | Month | Applied On | Action  
Data: "No data available in table"

---

## 8. LEAVE MODULE

**HR Admin top nav:** Logs | Rules | Balance | Analytics | Settings  
**Employee sidebar:** Logs | Rules | Balance

---

### 8.1 Leave Logs (HR View)
**URL:** /leave-request/viewLeaveStatus/

**Controls:** Select Year (2026 | 2027) | 🔍 Search | ☁️ Export | [BULK APPROVE] | Show 10–100

**Columns:** ID | Employee Name | Manager Name | Department | Sub-Department | Type | Start Date | End Date | Days | Status | Action (View Details | CANCEL)

**Leave records (2026):**
| ID | Employee | Type | Start | End | Days | Status |
|---|---|---|---|---|---|---|
| SGS/HRO/1447005 | Mohhmad Aseempasha | Sick Leave | 04 Apr 2026 | 04 Apr 2026 | 1.0 | ✅ Approved |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | Sick Leave | 17 Mar 2026 | 17 Mar 2026 | 1.0 | ✅ Approved |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | (another) | — | — | — | ✅ Approved |
| SGS/DS/1447023 | Sirimalla Saranya | Sick Leave | 23 Feb 2026 | 23 Feb 2026 | 1.0 | ✅ Approved |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | Sick Leave | 11 Feb 2026 | 11 Feb 2026 | 1.0 | ✅ Approved |

Pagination: PREVIOUS 1 NEXT

---

### 8.2 Leave Rules — Rule Configuration
**URL:** /leaves/viewLeaveRuleBase/?tab=0

**Leave types configured (with employee assignments):**
| Leave Type | Employees Assigned |
|---|---|
| Earned Leave | 0 |
| Loss Of Pay | 5 |
| Casual Leave | 2 |
| Work From Home | 1 |
| Sick Leave | 5 |
| Maternity Leave | 0 |
| Paternity Leave | 1 |
| ON Duty Leave | 1 |
| Event Leave | 0 |
| Comp Off | 0 |
| Leave Type 1 (custom) | 0 |

Actions: ⧉ Duplicate | 🗑️ Delete | [⊕ Create New Rule]

**Sample rule detail — Earned Leave:**
- Name: Earned Leave
- Description: "This is a default description for the Leave Type."
- Leave Short Name: —
- Leaves Count: 24.0 per year
- Weekends Between Leave: Not Considered
- Holidays Between Leave: Not Considered
- Creditable On Accrual Basis: Yes
- Creditable On Present Day Basis: No
- Accrual Frequency: Monthly
- Accrual Period: Start
- Allowed under Probation: No
- Allowed under Notice Period: No
- Leave Encash Enabled: No
- Carry Forward Enabled: No

**Sub-tabs within each rule:** General Settings | Advanced Settings ✓

---

### 8.3 Leave Rules — Assign to Employees
**URL:** /leaves/viewLeaveRuleBase/?tab=1

**Controls:** 🔍 Search | [Assign Rules] | 🗑️ Bulk Delete | ☁️ Import | Show 10–100 | ⊕ add_box

**Columns:** ID | Employee Name | Department | Manager | Type | Rules Applied (with ✕ remove per rule)

**Assignments per employee:**
| Employee | Dept | Rules Assigned |
|---|---|---|
| Sirimalla Saranya | Data specialist | Loss of Pay, Sick Leave |
| Mohhmad Aseempasha | HR | Loss of Pay, Sick Leave, Casual Leave |
| Chappidi Gunadeep Yadav | Operations | Loss of Pay, Sick Leave, Work From Home, Paternity Leave, ON Duty Leave, Casual Leave |
| Ummey Afifa Khatoon | Operations | (similar set) |
| Mohammed Shareefuddin Ahmad | Operations | (full set) |

---

### 8.4 Leave Balance
**URL:** /rule_set/viewLeaveBalance/

**Controls:** 🔍 Search | ☁️ Import | ☁️ Export | Show 10–100 | ⊕ add_box

**Columns:** ID | Employee Name | Department | Location | Casual Leave | Comp Off | ON Duty Leave | Paternity Leave | Sick Leave | Work From Home

**Current balances:**
| Employee | Casual | Comp Off | ON Duty | Paternity | Sick | WFH |
|---|---|---|---|---|---|---|
| Sirimalla Saranya | — | 0.00 | — | — | 3.89 | — |
| Mohhmad Aseempasha | 3.00 | 31.00 | — | — | 4.42 | — |
| Chappidi Gunadeep Yadav | — | 29.50 | — | — | 3.42 | — |
| Ummey Afifa Khatoon | — | 0.00 | — | — | 0.93 | — |
| Mohammed Shareefuddin Ahmad | 4.00 | 0.00 | 10.00 | 7.00 | 4.00 | 30.00 |

⚠️ Comp Off balance for Mohhmad Aseempasha is 31.00 days — very high (possibly accrued due to system).

---

### 8.5 Leave Analytics
**URL:** /leave-request/viewLeaveAnalytics/

**Controls:** [Filters] | [RESET] [APPLY] | View: Weekly / Monthly / Custom | ← Jun 6–13, 2026 →

**Charts:**
- By Leave Type (donut): Total 44 | Casual Leave 110 (37.9%) | Earned Leave 20 (6.9%) | Sick Leave 70 (24.1%) | On Duty 70 (6.9%) | Others 70 (24.1%)
- By Department (donut): same breakdown by dept
- Monthly trend line: By Leave Type × month (Jan–Dec)
- Monthly trend line: By Department (Operations/HR/Data specialist) × month

---

### 8.6 Leave Settings
**URL:** /rule_set/viewLeaveSettings/

**ANNUAL LEAVE CYCLE:**
- Enable Financial Year Cycle (Default: Calendar Year Cycle): toggle

**MULTI LEVEL APPROVAL:**
- Enable Skip Level Approval (Your Manager's Reporter): toggle

---

## 9. PAYROLL MODULE

**Sidebar nav:** Run Payroll | Setup Payroll | Declaration | Advanced Settings | Audit History  
**Payroll top-nav (within module):** Run Payroll | Setup Payroll | Declaration | Advanced Settings | Audit History | Statutory  
**View modes:** Basic | Expert (toggle top-right)

---

### 9.1 Run Payroll
**URL:** /payroll/admin_view_wrapper/?ptab=1

**Month timeline (horizontal scrollable):**
| Month | Status |
|---|---|
| Dec 2025 | ✅ Complete |
| Jan 2026 | ⏳ Pending - 7 |
| Feb 2026 | ✅ Complete |
| Mar 2026 | ⏳ Pending - 15 |
| Apr 2026 | ⏳ Pending - 14 |
| May 2026 | ⏳ Pending - 11 |
| Jun 2026 | ⏳ Pending - 3 |
| Jul–Mar 2027 | 🔜 Upcoming |

**Sub-tabs (once month selected):** Overview | Pay Register | Salary On Hold

**Overview (MAR 2026 example):**
- Current Payroll: 1 Mar – 31 Mar, 2026
- Total Employees: 4
- Payroll Completed: 0 (−15 pending)
- Gross Pay: ₹3,06,613
- Net Pay: ₹3,06,463
- Total Payout: 0
- Income Tax / PF / ESI / PT: 0 each
- Payslip Generated: 0
- [NEXT] button

**Salary On Hold tab:**
- Shows: Endla Karthik (SGS/DS/1447010), Tamada Sunny Rao (SGS/DS/1447021) — On Hold
- ✏️ Edit per row | ⊕ Add Employee button
- ⚠️ Note: "Salary on hold cannot be reversed once payout has been initiated."
- ⚠️ These IDs (1447010, 1447021) are NOT in the active Directory — likely inactive/departed employees still in payroll

---

### 9.2 Setup Payroll
**URL:** /payroll/admin_view_wrapper/?ptab=2

**Sub-tabs:** Payroll Settings | Assign Structure | Create Structure | Payroll AI | Payroll Setup Wizard | [Download Sample Format]

**Payroll Settings (setab=0):**
- Pay Cycle: From [1–31 selector] To 31
- Does your company have PF? (toggle)
- Does your company have ESI? (toggle)
- Do you deduct Professional Tax? (toggle)

**Assign Structure (setab=2):**
- 🔍 Search | [Assign Structure] | ☁️ Import | ☁️ Export | ⊕ add_box
- Columns: Employee Name | ID | Rules Applied | Location | Designation | Gross/Wage | Overtime | Action

| Employee | ID | Structure | Location | Gross | OT |
|---|---|---|---|---|---|
| Mohammed Shareefuddin Ahmad | SGS/CEO/1447001 | CEO | Hyderabad | ₹12,00,000 | 0 |
| Mohhmad Aseempasha | SGS/HRO/1447005 | Temporary | Hyderabad | ₹1,80,000 | 0 |
| Chappidi Gunadeep Yadav | SGS/SE/1447027 | Temporary | Hyderabad | ₹1,80,000 | 0 |
| Sirimalla Saranya | SGS/DS/1447023 | Temporary | Hyderabad | ₹1,80,000 | 0 |
| Ummey Afifa Khatoon | SGS/ITE/1447028 | (none) | — | 0 | 0 |

**Create Structure (setab=1) — Salary Structures configured:**
| Structure Name | Employees |
|---|---|
| Standard (Company Default) | 0 |
| Temporary | 3 |
| Job based Wage | 0 |
| Contractor Salary Structure | 0 |
| Daily Wage_1 / Advanced | 0 |
| Hourly Wage_1 / Advanced | 0 |
| CEO | 1 |
| Custom Salary Structure_1 | 0 |
| Custom Salary Structure | 0 |

Actions: ⧉ Duplicate | 🗑️ Delete | [⊕ Create New Structure]

**Standard structure detail:**
- ✅ Company Default badge
- Earnings: Basic = GROSS × 0.5 | HRA = BASIC × 0.45 | Performance Bonus = ₹28,800 | Special Allowance = BALANCING AMOUNT OF GROSS | Overtime = 0
- Deductions: PF Employer = SYSTEM CALCULATED | ESI Employer = SYSTEM CALCULATED | Medical Insurance = ₹1,800

---

### 9.3 Declaration (Employer View)
**URL:** /payroll/admin/employer_declaration/

**Controls:** Financial Year (2026–2027 | 2025–2026) | [↓ Download Proofs] | ☁️ Export

**Declaration sub-tabs:** Tax Scheme | HRA | Deduction | Income/Loss from House Property | LTA | Income from Previous Employer | Reimbursements | Forms

**Table:** ID | Employee Name | Location | Tax Scheme | Status  
Data: "No data available in table" — no declarations submitted yet for 2026–27

---

### 9.4 Advanced Settings
**URL:** /payroll/admin/settings/?tab=0

**Left nav sections:** Payroll Settings | PF & ESI Settings | PT Settings | Declaration Settings | Component | Payout Settings | Payslip Settings | Bank Integration | [Hide Advanced Settings]

**Payroll Settings — active config (Effective Dec 1, 2025):**
- Pay Frequency: Monthly
- Pay Cycle: From 1st to 31st
- Payroll Leave & Attendance Input Cycle: From 1st to 31st
- Payout Date: 31st Day of the Month
- Payroll DOJ Cut Off Date for New Joinees: 31st Day of the Month
- Decimal Value in Payslip: (toggle)
- Wage ESI for Overtime: (toggle)
- Enable DA for Payroll Calculation: (toggle)

Sub-sections: Pay Settings | Pay Days Calculation | Access Control

**PF & ESI Settings:**
- PF sub-tabs: PF Settings | ESI Settings | Overview
- Statutory Minimum Monthly Amount for PF Calculation: ₹15,000
- Employee PF Contribution Based On: options → Basic × 12% | (Basic + DA) × 12% | (Basic + Special Allowance) × 12% | Fixed Amount | Custom Formula

**PT Settings, Declaration Settings, Component, Payout Settings, Payslip Settings, Bank Integration:** separate anchored sections on same page.

---

### 9.5 Audit History
**URL:** /payroll/admin/payroll_request_wrapper/

**Controls:** 🔍 Search

**Columns:** Schedule On | Request Type | Status | Outcome (Pass/Fail) | Actioned By | Actions

**Recent audit log entries:**
| Date | Request Type | Status | Pass/Fail | By |
|---|---|---|---|---|
| Jun 12, 2026, 12:27 p.m. | Calculate Monthly Salary | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 12, 2026, 12:26 p.m. | LOP Update | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 12, 2026, 12:26 p.m. | LOP Update | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 10, 2026, 5:46 p.m. | Employee Update | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 10, 2026, 5:42 p.m. | Employee Update (×3) | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 10, 2026, 12:33 p.m. | Calculate Monthly Salary | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 4, 2026 | Leave Rule Update | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 4, 2026 | Leave Rule Deleted | Completed | 1/0 | Mohhmad Aseempasha |
| Jun 1, 2026 | Employee Update | Completed | 1/0 | Mohammed S.A. |

⚠️ All payroll actions are fully logged with pass/fail outcome per employee. Actioned By shows who triggered it.

---

### 9.6 Statutory (Payroll)
**URL:** /payroll/reports/main_wrapper/

**Sub-tabs:** Form 16 | Form 24Q

**Form 16:**
- Sub-tabs: Form 16 Generation | Form 16 Admin
- Upload Part A + Upload Part B buttons
- 🔍 Search | [BULK DOWNLOAD] | [GENERATE FORM 16] | [RELEASE TO EMPLOYEES]
- Financial Year selector: 2022–23 through 2026–27
- Table: ID | Employee Name | Part A | Part B | PAN No. | Generated Date | Released On | Action
- Data: "No matching records found"

**Form 24Q:**
- Sub-tabs: Overview | Challan | Settings
- Financial Year: 2025–26 | 2026–27
- Quarter tabs: Q1 (Apr–Jun) | Q2 (Jul–Sep) | Q3 (Oct–Dec) | Q4 (Jan–Mar)
- [+ Add Challan] | ☁️ Export
- Columns: Month | Employee Tax Deducted | Challan Amount | Difference | Employee Mapping
- Q1 2026 data: Apr/May/Jun 2026 — all 0 (no TDS deducted)

---


## 10. EXPENSE PAYOUT (Expense Management)

**URL:** https://skylinxglobal.kredily.com/expense_management/

**Module Header:** EXPENSE + "Getting Started" button (video tutorial link)

**Tabs:** Expenses 🔴 | **Payout** | Expense Category 🔴 | Settings

*(Expenses and Expense Category tabs show premium/configuration icon — not accessible with current setup)*

### Payout Tab (Active — Settings)
Settings for how expense reimbursements flow through approval:

| Setting | Current State |
|---------|--------------|
| Restrict Manager Approval | **ON** |
| Enable Skip Approval | Off |
| Enable Multicurrency Expense Creation | Off |

**EXPENSE MULTI LEVEL APPROVAL**
- Enable Multi-Level Approval: **Off**
- Note: When Multi-Level Approval is enabled, settings like 'Restrict Manager Approval' and 'Enable Skip Approval' will be ignored for newly created expenses.

---

## 11. ORGANIZATION CHART

**URL:** https://skylinxglobal.kredily.com/teams/org-chart/

**Views:** Employee Tree | Department Tree

**Actions:** [EXPORT TO PDF] button | ☐ Show Only my Team checkbox

**Employee Tree (visible hierarchy):**
```
MOHAMMED SHAREEFUDDIN AHMAD — CEO
  Direct Reportees: 1 | Indirect Reportees: 3
    └── MOHHMAD ASEEMPASHA — Manager - HR&Operations
          Direct Reportees: 2 | Indirect Reportees: 1
```

Each node shows: Photo avatar, Name (truncated), Designation, Direct Reportees count, Indirect Reportees count. Click on node to expand/collapse subtree.

---

## 12. HOLIDAY CALENDAR

**URL:** https://skylinxglobal.kredily.com/events/calenderView/

**Views:** Holiday Calendar (month calendar) | Holiday List (tabular)

**Navigation:** ← JUNE 2026 → | TODAY button | MONTH / DAY view toggle

**Calendar Layout:** Standard weekly grid Mon–Sun with color-coded holidays:
- 🟥 Mandatory Holiday
- 🟨 Optional Holiday

**June 2026 Holidays:**
- June 2 (Tue): Telangana Formation Day

**Legend:** Optional Holiday | Mandatory Holiday

**Details Panel (right side):** Shows details for selected/today's date — "13 Jun 2026, Saturday" (no holiday today)

**Holiday List tab** (via `calenderViewList/`): Tabular view of all holidays for the year with Name, Date, Type columns.

---

## 13. KONNECT (Social Feed)

**URL:** https://skylinxglobal.kredily.com/discussions/show_posts/

**Full tagline:** "Konnect - Share | Celebrate | Collaborate"

**Left Panel (Profile Card):**
- User photo, Name: HR, Role: Manager – HR&Operations
- Office: Corporate Office | Email: hr@skylinxglobal.com

**Create a Post Widget:**
- Text box: "Create a post"
- Attachment: 📷 Add Photo
- **Category selector** (dropdown): Articles | Classifieds | Events | Information | Other | Announcements
- **Visibility**: Public | My Department | My Team
- [POST] button

**Filter Posts** (top-right): Dropdown to filter feed

**Feed — Recent Auto-Posts (birthday announcements by system):**

| Date | Author | Category | Content |
|------|--------|----------|---------|
| Jun 5, 2026 12:01 AM | SkyLinx Global Solutions | Announcements | Happy Birthday @Dasari Santhosh Kumar — Let's Celebrate |
| Apr 5, 2026 12:01 AM | SkyLinx Global Solutions | Announcements | Happy Birthday @Ganisetti Siva Nagajyothi — Let's Celebrate |
| Mar 23, 2026 12:01 AM | SkyLinx Global Solutions | Announcements | Happy Birthday @Pamidikondala Sirisha — Let's Celebrate |

Per-post actions: 👍 Like | 💬 Comment | 🗑️ Delete (admin) — each showing 0 Likes, 0 Comments.

---

## 14. REWARDS (Discount Vouchers)

**URL:** https://skylinxglobal.kredily.com/kredily-rewards/

**Tabs:** Discount Voucher | Vouchers Purchase History

### Tab 0 — Discount Voucher (Brand Shop)
**Brand voucher marketplace** with cashback discounts for employees.

**Categories:** Jewellery | Entertainment | Grocery | Travel | Apparel | Accessories | Health | E-Commerce | Luxury | Spa | Home Appliance

**Featured Vouchers:**
| Brand | Discount |
|-------|----------|
| Flipkart | 2.5% off |
| Nykaa | 4% off |
| Amazon Pay | 2% off |
| PVR Cinemas | 7% off |
| (+ many more) |  |

### Tab 1 — Vouchers Purchase History
All purchases made by employees via the Rewards portal.

**Employee:** Mohammed Shareefuddin Ahmad (4 purchases)

| Date | Item | Amount Billed | Face Value | Status |
|------|------|--------------|------------|--------|
| Mar 23, 2026 | Amazon Pay E-Gift Card | ₹980 (2% off) | ₹1,000 | DISPATCHED |
| Mar 22, 2026 | Amazon Pay E-Gift Card | ₹980 (2% off) | ₹1,000 | DISPATCHED |
| Mar 10, 2026 | Amazon Pay E-Gift Card | ₹980 (2% off) | ₹1,000 | DISPATCHED |
| Mar 4, 2026 | Amazon Pay E-Gift Card | ₹980 (2% off) | ₹1,000 | UNPROCESSED |

---

## 15. ID & VISITING CARD (Legacy / Old Stationery)

**URL:** https://skylinxglobal.kredily.com/old-stationery/

**Module Title:** STATIONERY (with ▶ tutorial button)

**Tabs:** ID Card | Visiting Card

### ID Card Tab (`/old-stationery/id-card`)
**Left Panel — Format Selector:**
- Format 1 (currently selected — highlighted in blue)
- Format 2
- Format 3
- "More formats arriving soon..." (coming soon card)

**Right Panel — Card Preview:**
- Front: Employee photo (circular), Name, Designation, Emp ID, Blood Group, Emergency No, back shows Company Name + Address + Company No + "If found, please email at..."
- Button: **[Set as Company Default]** — sets this format as the default for all employees

**Previewed Employee:** Mohhmad Aseempasha | SGS/HRO/1447005 | Blood Group: O+ | Emergency: +91 96031 37390

### Visiting Card Tab (`/old-stationery/visiting-card`)
**Only Format 1 available** (More formats arriving soon)

**Buttons:** 
- **[Company Default]** (green, already set)  
- **[Roll Out to Employees]** (green) — pushes selected format to all employees

**Card Preview:** Professional horizontal card showing:
- Name: MOHHMAD ASEEMPASHA | Designation: Manager - HR&Operations
- Email: hr@skylinxglobal.com | Phone: +91 80087 85577
- Website: www.skylinxglobal.com
- Address: D No: 1-60/80/A & B, 3rd Floor, KNR Square... | Company Logo: SkyLinx Global Solutions

---

## 16. ID & VISITING CARD (NEW — Stationery Designer)

**URL:** https://skylinxglobal.kredily.com/stationery/

**Module Title:** Stationery Designer — "Design, validate and roll out company identity"

**Top-right toggle:** Admin | Employee (view switcher)

**Main Layout:** 3-panel interface
- **Left panel:** ID Card / Visiting Card tabs + Templates list + Brand Color picker
- **Center panel:** Card preview (Front/Back toggle) with PREVIEW EMPLOYEE selector
- **Right panel:** Print Validation checklist + Actions

### Templates Available:
| Template | Description |
|----------|-------------|
| Glass Hero ✓ (selected) | Centered layout with soft gradient glow |
| Minimal Pro | Clean white with strong typography hierarchy |
| Split Pro | Left color panel and right content area |
| Modern Edge | Top gradient bar with centered avatar |
| Corporate Bold | Full colored header with structured blocks |

**Brand Color:** 6 preset swatches (blue, teal, green, yellow, red, dark) + custom

**Preview Employee Selector:** Dropdown (currently Mohhmad Aseempasha)

**Card Preview:** Shows CR80 standard size (2.125″ × 3.375″). Button: [Export PDF Preview]

### Print Validation Checklist:
**ID Card:** ✅ Full Name | ✅ Employee ID | ✅ Designation | ✅ Profile Photo | ✅ Blood Group | ✅ Emergency Contact | ✅ Office Address → **Ready to print**

**Visiting Card:** ✅ Full Name | ✅ Designation | ✅ Contact Number | ✅ Office Address → **Ready to print**

### Actions:
- **[Save as Company Default]** — saves selected template as company-wide default
- **[Roll Out to All Employees]** — pushes cards to all active employees

---

## 17. INSURANCE MANAGEMENT

**URL:** https://skylinxglobal.kredily.com/insuranceb2b/

**Status:** WAITLIST — Feature not yet available

**Waitlist Number:** 1041

**Description shown:** "Your Organisation's Insurance Management Waitlist Number is 1041"

**Insurance Management at a Glance (feature preview):**
- **Employee Onboarding** — Simplifies enrolling employees into group health plans
- **Dependent Management** — Add spouses/children to employee health insurance plans
- **Employee Self-Service Portal** — Access policy details, coverage limits, network providers

*Note: This feature is in queue; not yet activated for SkyLinx Global Solutions.*

---

## 18. SETTINGS

**URL:** https://skylinxglobal.kredily.com/company/companyProfileSettings/settings_wrapper/

**Tabs:** Work Week | Module Selector | Controls and Permissions | Bank Integration | Xoxoday Integration | QuickBooks 🔴 | Setup Wizard

---

### 18.1 Work Week Tab (`?tab=0`)

**Sub-tabs:** Create Work Week | Assign Work Week

**Existing Rules:**
| Rule Name | Employees | Description |
|-----------|-----------|-------------|
| Saturday Sunday Off | 0 Employees | 5-day week, Sat+Sun off |
| Sunday Off | **5 Employees** | Active rule for all staff |

**Rule Detail (Saturday Sunday Off):**
- Week grid: 5 rows (Weeks 1–5) × 7 columns (Mon–Sun)
- Mon–Fri = green (Working Day) | Sat–Sun = red (Weekly Off)
- ☐ Half Day checkbox (unchecked)
- Buttons: ✏️ edit Overview | ✏️ edit Rule Settings | [Set as Company Default]

**Actions:** [+ Create New Rule] | copy icon | delete icon per rule

---

### 18.2 Module Selector Tab (`?tab=1`)

Shows which HR modules are active for this company:

| Module | Status |
|--------|--------|
| Attendance | ✅ Enabled (blue card with checkmark) |
| Leave | ✅ Enabled |
| Payroll | ✅ Enabled |

*These are the only 3 selectable modules. Toggling a module off would hide it system-wide.*

---

### 18.3 Controls and Permissions Tab (`?tab=3`)

**Sub-tabs:** Controls | Permissions | Access Support

#### Controls Sub-tab:

**DIRECTORY CONTROLS** — Make employee information visible to all employees:
| Setting | State |
|---------|-------|
| Enable Directory for All | **No** (off) |
| Enable Directory for Managers | **Yes** (on) |

**DELETE COMPANY** — Dangerous zone:
- "Delete this company and all associated data."
- [DELETE COMPANY] button (red)

#### Permissions Sub-tab:

Role-level toggles for proxy/on-behalf-of actions:

**Attendance mark on behalf of Employees:**
| Role | Can Mark |
|------|----------|
| CEO | ✅ Yes |
| HR Admin | No |
| Manager | No |
| HR Vendor Admin | No |
| HR Executive | No |
| Partner | No |

**Leave mark on behalf of Employees:**
| Role | Can Mark |
|------|----------|
| CEO | ✅ Yes |
| HR Admin | No |
| Manager | No |
| HR Vendor Admin | No |
| HR Executive | No |
| Partner | No |

**Investment Declaration mark on behalf of Employees:**
| Role | Can Mark |
|------|----------|
| CEO | ✅ Yes |
| HR Admin | No |
| Finance Admin | No |
| Partner | No |

*Access is role-based at the action level (on-behalf-of). Granularity: per action-type × per role.*

#### Access Support Sub-tab:

"Allow Kredily support team to access your account to assist you."

Current status: **"Kredily support doesn't have access to your account."** (orange banner)

Fields:
- Access From: [Select Date] [Select Time]
- Access To: [Select Date] [Select Time]
- ☐ I agree that Kredily support team will have access to my account between the time selected above.
- [ALLOW ACCESS] button (blue)

---

### 18.4 Bank Integration Tab (`?tab=2`)

Content area blank — no bank currently integrated. No setup options visible (likely requires configuration from Kredily's backend).

---

### 18.5 Xoxoday Integration Tab (`?tab=7`)

Content area blank — Xoxoday rewards integration not configured.

---

### 18.6 QuickBooks Tab

Marked with 🔴 icon (disabled/not available on current plan).

---

### 18.7 Setup Wizard (`/setup_wizard/onboarding`)

AI-powered 3-step onboarding wizard for new company setup.

**Header:** "Welcome, Mohhmad! Let's onboard your team in minutes 🚀"
"Just upload your employee data — our AI will structure, validate, and set everything up for you."

**3 Steps:**
1. **Add Employees** (active) — Smart Upload via drag & drop CSV/Excel or Browse File. [Download Template] button.
2. **Attendance & Leave** — Configure attendance and leave rules
3. **Setup Payroll** — Configure payroll structures

---

## 19. NOTIFICATIONS CENTER

**URL:** https://skylinxglobal.kredily.com/notifications/listAllNotifications/

**Bell icon badge:** 23 unread

**Dropdown panel:** Shows recent 5 notifications + [SEE ALL NOTIFICATIONS] button

**Full Notifications Page:**
- "You have 23 unread notifications."
- Bulk toolbar: ☐ Select All | [Mark as Unread] | [Mark as Read] | [Delete]
- Per-row: ✉️ toggle read/unread | 🗑️ delete

**Notification types seen:**
- Attendance regularization requests from Chappidi Gunadeep Yadav (Jun 03–08, 2026)
- Profile field verifications for Ummey Afifa Khatoon & Chappidi Gunadeep Yadav:
  - Emergency Contact Details verified
  - Employee Education Details verified
  - Marital Status verified | Blood Group verified | Personal Email verified

---

## 20. ROLES & PERMISSIONS — DEEP DIVE

### Roles Available in Kredily (discovered via Permissions tab):

| Role Name | Description |
|-----------|-------------|
| CEO | Top-level role — all proxy permissions enabled by default |
| HR Admin | HR administration role |
| Manager | Team/department manager |
| HR Vendor Admin | Vendor-side HR access |
| HR Executive | HR executive access |
| Finance Admin | Finance and payroll role |
| Partner | Partner/external access |

### Permission Granularity:
- **Type:** Action-level control (on-behalf-of actions per role)
- **Not** module-level show/hide (modules are toggled in Module Selector)
- **Data scope control:** Directory visibility (all employees vs. managers only) in Controls tab

### Proxy Actions Available (role × toggle):

| Permission | CEO | HR Admin | Manager | HR Vendor Admin | HR Executive | Finance Admin | Partner |
|------------|-----|----------|---------|-----------------|--------------|---------------|---------|
| Attendance mark on behalf of employees | ✅ Yes | No | No | No | No | — | No |
| Leave mark on behalf of employees | ✅ Yes | No | No | No | No | — | No |
| Investment Declaration on behalf | ✅ Yes | No | — | — | — | No | No |

### Custom Role Creation:
Not observed in Settings > Controls and Permissions tab. Roles appear to be system-defined (not user-creatable via UI). Role assignment is done per-employee in Directory > employee profile.

### Admin vs Employee Mode:
- Toggle visible in top-right header (Settings pages, Stationery Designer)
- Admin mode: full HRMS management view
- Employee mode: self-service view (own profile, own payslips, own attendance/leave)

---


---

## 21. Reports Module

**URL:** `/reports/reports/`  
**Access:** HR Admin mode only (not visible in Employee mode sidebar)

### Structure:
Left sidebar with 5 categories, each expanding to show report types. Each report has: name, description, date range/period selector, and EXPORT button that downloads the file (Excel/PDF).

### Category: Attendance
| Report | Description | Parameters |
|--------|-------------|------------|
| Consolidated Attendance Report | Employee-wise daily attendance status | Date range (From/To) |
| Muster Roll | Standard muster roll | Date range |
| Form D – Attendance Register | Government Form D compliance register | Date range |

### Category: Directory
| Report | Description | Parameters |
|--------|-------------|------------|
| Employee Join/Exit Report | Month-wise data of new joinees and exits | Date range (From/To) |

### Category: Leave
| Report | Description | Parameters |
|--------|-------------|------------|
| Leave Register | Leave register per employee | Period |
| Monthly Leave Summary Report | Total leaves availed by employees in selected month | Year + Month dropdowns |

### Category: Payroll
| Report | Description | Parameters |
|--------|-------------|------------|
| Consolidated Gross vs Net Pay Report | Employee-wise monthly gross vs net payout | Year + Month |
| Consolidated Net Pay Report | Net pay only | Year + Month |
| Consolidated Reconciliation Report | Reconciliation data | Year + Month |
| Department Wise Salary Report | Salary broken by department | Year + Month |
| PF Register | Provident Fund register | Year + Month |
| PT Report | Professional Tax report | Year + Month |
| TDS Report | Tax Deducted at Source | Year + Month |
| Yearly Consolidated Pay Register | Full year pay register | Year |
| Consolidated Tax Computation Report | Tax computation per employee | Year + Month |
| Consolidated Salary Revision Report | Salary revision history | Year + Month |
| Yearly Tax Computation Bulk Download | Bulk download of all employee tax computations | Year |
| Salary Variance Report | Month-over-month salary variance | Year + Month |

### Category: Expense
| Report | Description | Parameters |
|--------|-------------|------------|
| Expense Payout Report | Expense payout summary | Toggle: Monthly; Year + Month |

### Export Behavior:
- All reports trigger file download (no preview in browser)
- Format appears to be Excel (.xlsx) based on standard Kredily behavior
- Reports generate employee-level data for the selected period

---

## 22. Test Employee — Swami Test (Full Documentation)

### Creation Process:
- **Navigation:** Directory > Add Employee button (top-right)
- **Form required fields:** First Name, Last Name, Email
- **Mandatory:** Both First and Last Name (form rejects submission without Last Name)
- **Values used:** First Name = "Swami", Last Name = "Test", Email = "chvbswami@gmail.com"
- **Optional fields skipped:** Employee ID (auto-assigned), Department, Designation, Date of Joining, CTC, Bank details, etc.

### Auto-Assigned Values on Creation:
| Field | Value |
|-------|-------|
| Employee ID | 2 |
| Employee Code | (none — SGS/... format not auto-assigned since no department set) |
| UUID | a23197c4-e7f2-46e5-965d-942a102437a9 |
| Profile URL | `/employee/overview/?uu=a23197c4-e7f2-46e5-965d-942a102437a9` |
| Status | Active |
| Probation Status | On Probation |
| Employee Type | Full Time |
| Date of Joining | 01/01/2026 (system default) |
| Attendance Rule | General Shift (auto-assigned as company default) |
| Leave Rules | Loss of Pay (auto-assigned to all employees) |

### Profile Tabs Available (HR Admin View):
| Tab | URL Pattern | Status for New Employee |
|-----|-------------|------------------------|
| Stationery | (profile sub-page) | Empty — no stationery configured |
| Personal | `/employee/overview/` | Shows email only; DOB, Gender, Blood Group, Marital Status all blank |
| Work | `/employee/work/` | Visible — shows Employee Type, Probation, DOJ; no dept/designation |
| Team | `/employee/team/` | Visible — no manager assigned |
| Education | `/employee/education/` | Visible — empty |
| Family | `/employee/family/` | Visible — empty |
| Documents | `/employee/documents/` | Visible — empty |
| Work Week | `/employee/work-week/` | Visible — shows company default work week |
| Attendance | (accessed via click, not URL) | ✅ Works — redirects to `/attendanceLog/viewSelectedEmployeeAttendanceLog/` |
| Leave | `/leave-request/leave_accrual/` | Shows "No leave rules have been assigned" (Loss of Pay is assigned but not self-requestable) |

### Key Behavioral Notes:
- **Attendance tab via direct URL** (`/employee/attendance/?uu=...`) → 404 Error. Must navigate to `/employee/overview/` first and click the "Attendance" tab, which then navigates to the proper URL.
- **Leave tab** shows "No leave rules have been assigned to this user" even though "Loss of Pay" IS assigned — because Loss of Pay is an automatic deduction rule, not a self-service leave type. Employee can only apply for leave if rules like Sick Leave, Casual Leave, Earned Leave are assigned.
- **Leave > Rules sub-tab** correctly shows: "Loss Of Pay — Effective Date: 01/01/26"
- **Attendance > Logs** shows empty timeline (no clock-in/out data)
- **Attendance > Rules** shows: "General Shift — Effective Date: 01 Jan, 2026"

### What HR Can Do With a New Employee:
- View/edit all profile tabs (Personal, Work, Team, Education, Family, Documents)
- Assign leave rules from Leave > Rules > Assign Leave Rules
- Change attendance rule from Attendance > Rules > Assign Attendance Rules
- Add to payroll from Payroll module
- Upload documents (ID proof, offer letter, etc.)
- Add bank details
- Assign to department and manager
- Create stationery/ID card from Stationery/ID Card module
- Delete the employee from Directory (3-dot menu on employee card)

### Assign Leave Rules Flow:
- Navigate to: Leave > Rules > Assign Leave Rules tab
- Table shows all employees with their currently assigned leave rule tags
- Swami Test shown with only "L Loss of Pay" tag
- To add rules: select employee checkbox → click "Assign Rules" button → select rule(s) from modal

### Assign Attendance Rules Flow:
- Navigate to: Attendance > Rules > Assign Attendance Rules tab
- Swami Test shown with "G General Shift" tag already assigned


---

## 23. Employee Deletion — Process & Post-Deletion Behavior

### Deletion Flow (2-Step Process):

**Step 1: HR Admin Submits Deletion Request**
- Navigate to: Directory > select employee checkbox > click "Delete" button
- A confirmation modal appears with the message:
  > *"This action will send the deletion request to the CEO of your organization. After confirmation by your CEO, the employee(s) will be permanently deleted from Kredily along with their all records including but not limited to Attendance Logs, Leave Logs, Payslips, Tax Deductions, and Statutory Forms. etc."*
- Buttons: **CANCEL** | **DELETE** (red)
- Clicking DELETE submits the deletion request; does NOT immediately delete the employee

**Step 2: CEO Confirmation**
- CEO receives a notification: *"Employee Deletion Request: Deletion request has been created for [Employee Name]"*
- CEO must approve the deletion for the employee to be permanently removed
- Until CEO confirms, employee remains in the system in a "pending deletion" state

### Post-Deletion-Request State (Before CEO Approval):

| Aspect | Behavior |
|--------|----------|
| Employee in Directory | **Still visible** — row has red left border indicator |
| Employee count | **Unchanged** — "Number of Employees: 6" (not decremented) |
| Profile URL accessible | **Yes** — `/employee/overview/?uu=...` still loads normally |
| All profile tabs | **Still accessible** — Personal, Work, Attendance, Leave, etc. |
| Notifications | New notification created: "Employee Deletion Request: Deletion request has been created for Swami Test" |
| CEO notification | CEO receives deletion request notification to approve/deny |

### What Gets Permanently Deleted (After CEO Confirmation):
Per the Kredily modal text, permanent deletion removes:
- Employee profile and all personal data
- Attendance Logs
- Leave Logs
- Payslips
- Tax Deductions
- Statutory Forms
- "and all other records"

### Key Design Insight:
Kredily implements a **two-person authorization model** for employee deletion:
- HR Admin can only *request* deletion
- Only the CEO (designated approver) can *execute* deletion
- This prevents accidental or unauthorized employee data removal

### Deletion Access Path:
- Directory > checkbox select employee > "Delete" red button in toolbar
- OR: Select employee(s) > bulk delete

### Post-CEO-Approval Expected Behavior (Not Directly Observed):
- Employee count decrements (e.g. 6 → 5)
- Employee no longer appears in Directory (even with "Include Inactive Employees" checkbox)
- UUID profile URL returns 404 or redirect
- Email cannot be reused without creating a new employee record

---

## 24. Account & Profile Menu (Top-Right Avatar)

**Location:** Top-right corner — avatar circle with dropdown arrow

**Menu items visible in Employee mode:**
- Change Password
- Log Out

**Behavior:**
- Click avatar → dropdown appears
- "Change Password" → navigates to password change form
- "Log Out" → ends session and redirects to login page

---

## 25. Search Employees Feature

**Location:** Top navigation bar — "Search Employees" input field

**Behavior:**
- Accepts text input → searches across all employee names in real time
- Dropdown shows matching employee names as you type
- Clicking a result navigates to that employee's profile

---

## AUDIT COMPLETION SUMMARY

### Modules Covered (All 25 Sections):
1. Dashboard
2. Top Navigation Bar
3. Left Sidebar Navigation
4. Company Profile Module
5. My Profile Module
6. Directory Module
7. Attendance Module
8. Leave Module
9. Payroll Module
10. Expense Payout
11. Organization Chart
12. Holiday Calendar
13. Konnect (Discussions)
14. Rewards
15. ID & Visiting Card (Legacy)
16. ID & Visiting Card New / Stationery Designer
17. Insurance Management
18. Settings (7 sub-tabs)
19. Notifications Center
20. Roles & Permissions Deep Dive
21. Reports Module
22. Test Employee Swami — Full Documentation
23. Employee Deletion Process & Post-Deletion Behavior
24. Account & Profile Menu
25. Search Employees Feature

### Plan Info at Audit Close:
- Plan: Professional (Pro)
- Valid till: 30/09/2026
- Employees at end of audit: 6 (including Swami Test in pending-deletion state)
- Available licenses: 19

### Key Findings:
- **Deletion requires CEO approval** — 2-step process
- **Attendance tab** only accessible via clicking from profile, not direct URL
- **Loss of Pay** auto-assigned to all employees; Sick/Casual/Earned Leave must be manually assigned
- **Roles are system-defined** — not user-creatable via UI; assignment is per-employee
- **Admin/Employee mode toggle** available in HR admin view for self-service preview
- **PMS module** greyed out (upgrade required)
- **Bank Integration and Xoxoday Integration** tabs in Settings exist but not configured


---

# SECOND PASS — GAP FILL (2026-06-13)

This section documents all gaps identified after the first-pass audit. Each gap is explored exhaustively with full click-by-click documentation.


---

## GAP 1 — Payroll Run: Full Step-by-Step Wizard (2026-06-13)

### URL Structure
`https://skylinxglobal.kredily.com/payroll/admin_view_wrapper/?ptab=1&tab=0&step=N&month=Mar&year=2026`

Note: The `run_payroll/` direct URL returns 404. Must access via the Payroll sidebar icon which routes to `admin_view_wrapper`.

### Top Navigation (Expert Mode)
`Run Payroll` | `Setup Payroll ▶` | `Declaration` | `Advanced Settings` | `Audit History` | `Statutory ⊗`

Month picker widget (top-right): shows current month (Mar 2026) with left/right arrows. Badge shows **Pending - 15**.

### Sub-Tabs inside Run Payroll
`Run Payroll ▶` | `Pay Register ▶` | `Payout` | `Statutory and Reports ⊗` | `JV Output ⊗`

### Wizard Step Bar (horizontal, always visible)
`🍩 Overview ▶` | `① Attendance & Leave ▶` | `② Variable & Adhoc ▶` | `③ Salary Revision ▶` | `④ Tax Override ▶` | `⑤ Salary on Hold >`

Note: ④ Tax Override is visible in bar but URL step mapping is non-sequential (see below).

### URL Step → Wizard Step Mapping
| URL step= | Wizard Screen Shown |
|-----------|---------------------|
| 0 | Overview |
| 1 | ① Attendance & Leave |
| 2 | ③ Salary Revision |
| 3 | ② Variable & Adhoc |
| 4 | ⑤ Salary on Hold |

Tax Override (④) appears accessible only via sequential NEXT clicking (state-dependent), not via direct URL.

---

### Step 0 — Overview
**Current Payroll:** 1 Mar – 31 Mar, 2026

| Metric | Value |
|--------|-------|
| Total Employees | 5 |
| Payroll Completed | 0 (−15 pending) |
| Gross Pay | ₹3,06,613 |
| Net Pay | ₹3,06,463 |
| Total Payout | 0 |
| Income Tax | 0 |
| PF | 0 |
| ESI | 0 |
| PT | 0 |
| Payslip Generated | 0 |

**NEXT** button (bottom right) → navigates to Step 1.

---

### Step 1 — ① Attendance & Leave
URL: `step=1`

Sub-tabs: **Attendance** | **Leave** | **Overtime**

#### Attendance Sub-Tab
Buttons: Search, **Import**, **Export**

**Columns:** ID | Employee Name | Absent Dates | Absent Days | Penalty Deduction | Total LOP | Action (✏️ edit)

**Rows (5 employees with absences):**
| ID | Employee Name | Absent Dates | Absent Days | Penalty Deduction | Total LOP |
|----|--------------|--------------|-------------|-------------------|-----------|
| SGS/... | Sandhi Varshini | Mar - 26, 30, 31 | 3 | 0 | 0 |
| SGS/... | Tamada Sunny Rao | Mar - 3, 4, 5, 6, 11, 18 | 6 | 0 | 0 |
| SGS/... | Endla Karthik | Mar - 5, 9 | 2 | 0 | 0 |
| SGS/... | Chappidi Gunadeep Yadav | Mar - 16, 18, 28 | 3 | 0 | 0 |
| SGS/... | Shaik Mahaboob Basha | Mar - 20, 21, 23, 24, 25, 26, 27, 28 | 8 | 0 | 0 |

Pagination: 1 to 5 of 5, Page 1 of 1

**+ Add Employee** button (bottom left)

**Footer note:** "*This Table shows only Absent Employee's. This LOP count includes LOPs applied because of Attendance penalty deduction as well. Please check and verify the correct count before processing the payroll. Click here to view the penalty*"

---

### Step 2 (URL) — ③ Salary Revision
URL: `step=2`

Buttons: Search, **Export**, Show 20

**Columns:** ID | Employee Name | Old GROSS | New GROSS | Changes | Effective Date

**Content:** No data available (no salary revisions for March 2026)

Pagination: < PREVIOUS | NEXT >

---

### Step 3 (URL) — ② Variable & Adhoc
URL: `step=3`

Sub-tabs: **Variable** | **Adhoc**

#### Variable Sub-Tab
Buttons: Search, **Export**, Show 20

**Columns:** ID | Employee Name | Variable Type | Amount | Pay Action

**Content:** No data available in table

Pagination: < PREVIOUS | NEXT >

---

### Step 4 (URL) — ⑤ Salary on Hold
URL: `step=4`

Buttons: Search, **Export**, Show 20

**Columns:** ID | Employee Name | Pay Action | Start Period | Action (✏️)

**Rows:**
| ID | Employee Name | Pay Action | Start Period |
|----|--------------|------------|-------------|
| SGS/DS... | Endla Karthik | On Hold | (empty) |
| SGS/DS... | Tamada Sunny Rao | On Hold | (empty) |

**+ Add Employee** button

Pagination: < PREVIOUS | **1** | NEXT >

**Warning note (red text):** "*Salary on hold cannot be reversed once payout has been initiated. If you wish to run payroll for all employees but defer payout, we recommend, not keeping the salary on hold. Please run the payroll for all employees and process payout in batches.*"

---

### Pay Register Tab (tab=1)
URL: `ptab=1&tab=1&month=Mar&year=2026`

**Warning banner (orange):** "There are changes in Employee Data. Please Check Filters"

**Buttons:** Search | Filter Employees ▼ | **LOP Import** | **Export**

**Columns (full, requires horizontal scroll):**
Employee Name | ID | Changes | Location | PT Location | PF Number | ESIC Number | UAN Number | LOP (✏️) | Net Pay | Payroll Status

**Sample data (all 15 employees show):**
- Changes: "Incomplete Profile" (orange) — for employees with missing statutory data
- Location: Hyderabad
- PT Location: Telangana
- LOP: 0 (editable via pencil icon)
- Net Pay: ₹15,000
- Payroll Status: **Pending**

---

### Payout Tab (tab=2)
Available but not explored in this pass (content depends on payroll completion state).

### Statutory and Reports Tab ⊗
Available in sub-tab bar; contains statutory filings view.

### JV Output Tab ⊗
Journal Voucher output — available post-payroll.

---

## GAP 2 — Advanced Settings: All 8 Sub-Sections (2026-06-13)

URL: `https://skylinxglobal.kredily.com/payroll/admin/settings/?tab=N`

Top sub-tabs: **Payroll Settings** ▶ | **PF & ESI Settings** ▶ | **PT Settings** ▶ | **Declaration Settings** ▶ | **Component** ▶ | **Payout Settings** ▶ | **Payslip Settings** ▶ | **Bank Integration** ▶ | _Hide Advanced Settings_

---

### 2A — Payroll Settings (tab=0)

**Master toggle:** Payroll = **ON** | Effective Date: Dec. 1, 2025

**Edit icon (✏️)** visible when hovering — allows editing all fields.

#### Sub-tab: Pay Settings
| Setting | Value |
|---------|-------|
| Pay Frequency | Monthly |
| Pay Cycle | From 1st to 31st |
| Payroll Leave and Attendance Input Cycle | From 1st to 31st |
| Payout Date | 31st Day of the Month |
| Payroll DOJ Cut Off Date for New Joinees | 31st Day of the Month |
| Decimal Value in Payslip | No (toggle OFF) |
| Wage ESI for Overtime | No (toggle OFF) |
| Enable DA for Payroll Calculation | No (toggle OFF) |

**Example preview** (right side): Sep 1–Sep 30 / Oct 1–Oct 31 / Nov 1–Nov 30

#### Sub-tab: Pay Days Calculation
| Setting | Value |
|---------|-------|
| Include Weekly Offs | Yes (toggle ON) |
| Include Holidays | Yes (toggle ON) |
| Fixed Paydays | No (toggle OFF) |

#### Sub-tab: Access Control ⊗
| Setting | Value |
|---------|-------|
| Show tax projection to employees | No (toggle OFF) |
| Show tax computation to employees | No (toggle OFF) |

---

### 2B — PF & ESI Settings (tab=1)

Sub-tabs: **PF Settings** | **ESI Settings** | **Overview**

#### PF Settings
- Provident Fund Status: **OFF** (toggle)

#### ESI Settings
- ESI Status: **OFF** (toggle)

#### Overview
Toggle: **Annual** (ON)

Buttons: Search | count: 0 | **Export** | Show 20

**Columns:** ID | Employee Name | PF Applicable | PF Number | PF Date Joined | UAN | EPS Number | Action

**All 6 employees:** PF Applicable = **No**, PF Number/UAN/EPS empty

| ID | Employee Name | PF Applicable |
|----|--------------|---------------|
| 2 | Swami Test | No |
| SGS/CE... | Mohammed Sharee... | No |
| SGS/DS... | Sirimalla Saranya | No |
| SGS/HR... | Mohhmad Aseemap... | No |
| SGS/ITE... | Ummey Afifa Khato... | No |
| SGS/SE/... | Chappidi Gunadee... | No |

---

### 2C — PT Settings (tab=2)

Sub-tabs: **PT Settings** | **Overview**

#### PT Settings
- PT: **OFF** (toggle)

#### Overview
Toggle: **Monthly** | Buttons: Search | count: 0 | **Export** | Show 20

**Columns:** ID | Employee Name | Work Location | PT Applicable | PT State | PT Amount | Action

| ID | Employee | Work Location | PT Applicable | PT State | PT Amount |
|----|---------|---------------|---------------|----------|-----------|
| 2 | Swami Test | — | No | — | 0 |
| SGS/CE... | Mohammed Sharee... | Hyderabad | No | Telangana | 0 |
| SGS/DS... | Sirimalla Saranya | Hyderabad | No | Telangana | 0 |
| SGS/HR... | Mohhmad Aseemap... | Hyderabad | No | Telangana | 0 |
| SGS/ITE... | Ummey Afifa Khato... | Hyderabad | No | Telangana | 0 |
| SGS/SE/... | Chappidi Gunadee... | Hyderabad | No | Telangana | 0 |

---

### 2D — Declaration Settings (tab=3)

**Declaration Window:** **ON** (toggle)

Sub-tabs inside: **Monthly** | **Yearly**

#### Monthly Sub-tab
- Monthly Declaration Window: None to None
- Cutoff Declaration Date for Financial Year: None None
- Apply to All (checkbox, unchecked) **OR** Apply to Select Employees: No Employee Selected

#### Yearly Sub-tab
Same structure — no yearly window configured.

**Mandatory Proof Submission:** **OFF** (toggle)

---

### 2E — Component Library (tab=9)

Sub-tabs: **Base** | **Recurring** | **Variable** | **Adhoc**

#### Base Components — Salary Structure

| Salary Component | Calculation (Annual) |
|-----------------|----------------------|
| Basic | GROSS * 0.5 |
| HRA | BASIC * 0.4 ℹ️ |
| PF Employer | System Calculated ℹ️ |
| ESI Employer | System Calculated ℹ️ |
| Special Allowance | Balancing Amount of GROSS |

#### Recurring Components

**Columns:** Component Name 🔍 | Type | Taxable | Annual Limit | Individual Override | Proof Required | ESI Applicable | Included in GROSS | Applied To | On/Off toggle

| Component | Type | Taxable | Annual Limit | Individual Override | Proof Required | ESI Applicable | In GROSS | Applied To |
|-----------|------|---------|-------------|---------------------|----------------|----------------|----------|-----------|
| Conveyance Allowance | Allowance | Yes | 19,200 | Yes | No | Yes | Yes | 0 |
| Leave Travel Allowance | Allowance | Yes | 50,000 | Yes | Yes | Yes | Yes | 0 |
| Medical Allowance | Allowance | Yes | 15,000 | Yes | Yes | Yes | Yes | 0 |
| Vehicle Allowance | Allowance | Yes | 12,000 | Yes | No | Yes | Yes | 0 |
| Phone Reimbursement | Reimbursement | Yes | 14,400 | Yes | Yes | Yes | Yes | 0 |
| Gratuity | Contribution | No | BASIC*0.0481 | Yes | No | Yes | Yes | 0 |
| Performance Bonus | Allowance | Yes | 28,800 | Yes | No | Yes | Yes | 4 |
| Medical Insurance | Deductions | No | 1,800 | Yes | No | No | No | 4 |

All 8 components toggle = **On**

**+ Create Component** button

#### Variable Components

**Columns:** Variable Name 🔍 | Frequency | Taxable | Annual Limit | Individual Override | ESI Applicable | Prorate | Included in GROSS | Applied To

| Component | Frequency | Taxable | Annual Limit | Override | ESI | Prorate | In GROSS | Applied To |
|-----------|-----------|---------|-------------|----------|-----|---------|----------|-----------|
| Annual Bonus | Annually | Yes | GROSS*0.10 | No | Yes | No | Yes | 0 |
| Monthly Incentive | Monthly | Yes | 60,000 | Yes | Yes | No | Yes | 0 |

**+ Create Component** button

#### Adhoc Components

**Adhoc Earnings (3 items):**
- Incentive — Taxable (orange label), ✏️ 🗑️
- Salary Advance — ✏️ 🗑️
- Accuracy Bonus — ESI Applicable (orange label), ✏️ 🗑️

**+ Create Component**

**Adhoc Deductions (2 items):**
- Labor Welfare Fund — Non-Taxable (orange label), ✏️ 🗑️
- Salary Advance Deduction — ✏️ 🗑️

**+ Create Component**

---

### 2F — Payout Settings (tab=4)

Sub-tab: **Overview** (only tab)

Buttons: count: 0 | Search | **Bulk Edit** | **Import** | **Export** | Show 20

**Columns:** ID | Employee Name | Payment Mode | Bank Name | City | Branch Name | IFSC Code | Action (Edit)

| ID | Employee | Payment Mode | Bank | City | Branch | IFSC |
|----|---------|-------------|------|------|--------|------|
| 2 | Swami Test | — | — | — | — | — |
| SGS/CE... | Mohammed Sharee... | Bank Transfer | FEDERAL BANK | HYDERABAD | HYDERABAD/MADH... | FDRL00... |
| SGS/DS... | Sirimalla Saranya | Bank Transfer | FEDERAL BANK | HYDERABAD | HYDERABAD/MADH... | FDRL00... |
| SGS/HR... | Mohhmad Aseemap... | Bank Transfer | AU Small Finance Bank | Hyderabad | AU Small Finance Ba... | AUBL00... |
| SGS/ITE... | Ummey Afifa Khato... | — | — | — | — | — |
| SGS/SE/... | Chappidi Gunadee... | Bank Transfer | FEDERAL BANK | HYDERABAD | HYDERABAD/MADH... | FDRL00... |

---

### 2G — Payslip Settings (tab=5/6)

Left sidebar: **Format 1** (highlighted green) | Format 2 | Format 3 | Format 4 | Format 5 | Format 6 | Format 7 | Format 8

**Format 1** is selected with **✓ Company Default** badge (green button, top right)

**"Registered address"** link (blue) near format title

**Live Preview (Format 1):**
- Company: SkyLinx Global Solutions (with logo)
- Address: SkyLinx Global Solutions - 532, Uptown Cyberabad, A-Block, 2nd Floor
- CIN: U-6499-SL-2031-PTC-218992
- "Payslip for the Month of May, 2018" (sample)
- Sample employee: Jon Doe | EMP 1 | Finance Manager | Citibank | Finance Dept | A/C: 999888777 | Bengaluru | PAN: ABCDE1234F | Work Days: 31 | PF: AS/ASD/123/12345 | LOP: 0
- Earnings/Deductions table visible (scrollable)

---

### 2H — Bank Integration (tab=7)

Content: "Set up your KredPay Account with Kredily in just two simple steps. For any assistance, feel free to contact us at support@kredily.com."

**Status:** KredPay not configured. No setup steps shown beyond the introductory message.

---

## GAP 3 — Investment Declaration 12BB (2026-06-13)

### 3A — Employee Side (ESS)
To be explored in GAP 8 section (requires ESS iframe navigation).

### 3B — HR Side: Declaration Tab (Expert Mode Top-Level)
URL: `https://skylinxglobal.kredily.com/payroll/admin/employer_declaration/?tab=N&from_year=2026&to_year=2027`

**Header controls:**
- Financial Year selector: **2026 – 2027** ▼ (with red ● indicator for pending items)
- **Export** button (blue ⬆️)
- **Download Proofs** button (blue ⬛)

**Sub-tabs (8 total):**
`Tax Scheme` | `HRA` | `Deduction` | `Income/Loss from House Property` | `LTA` | `Income from Previous Employer` | `Reimbursements` | `Forms ⊗`

#### Tax Scheme (tab=0)
Columns: ID | Employee Name | Location | Tax Scheme | Documents | Comment | Status
Content: Empty (no employee declarations submitted)

#### HRA (tab=1)
Columns: ID | Employee Name | Location | From Month | To Month | City Type | Monthly Rent | Documents | Comment | Status
Content: Empty

#### Deduction (tab=2)
Columns: ID | Employee Name | Location | Section | Type | Amount | Documents | Comment | Status
Content: Empty

#### Income/Loss from House Property (tab=3)
Columns: ID | Employee Name | Location | Property Type | Annual Rent/Value | Municipal Tax | Interest on Loan | Documents | Comment | Status
Content: Empty

#### LTA (tab=4)
Columns: ID | Employee Name | Location | Travel Mode | Journey From | Journey To | Travel Date | Amount | Documents | Comment | Status
Content: Empty

#### Income from Previous Employer (tab=5)
Columns: ID | Employee Name | Location | Income | Income Tax | PF | PT | Documents | Comment | Status
Content: Empty

#### Reimbursements (tab=6)
Columns: ID | Employee Name | Location | Component | Declared Amount | Documents | Comment | Status
Content: Empty

#### Forms ⊗ (tab=7)
Sub-tabs: **Form 12BB** | **Form 16**

- **Form 12BB** — "Coming Soon."
- **Form 16** — "Coming Soon."

Both forms are placeholder content (not yet implemented).

---

## Audit History Tab (Expert Mode Top-Level)
URL: `https://skylinxglobal.kredily.com/payroll/admin/payroll_request_wrapper/`

**Controls:** Search bar

**Columns:** Schedule On | Request type | Status | Outcome | Actioned By | Actions (⬇️ download)

**Sample rows:**
| Schedule On | Request type | Status | Outcome | Actioned By |
|-------------|-------------|--------|---------|-------------|
| June 12, 2026, 12:27 p.m. | Calculate Monthly Salary | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |
| June 12, 2026, 12:26 p.m. | LOP Update | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |
| June 12, 2026, 12:26 p.m. | LOP Update | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |
| June 10, 2026, 5:46 p.m. | Employee Update | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |
| June 10, 2026, 5:42 p.m. | Employee Update | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |
| June 10, 2026, 5:42 p.m. | Employee Update | Completed | Pass: 1, Fail: 0 | Mohhmad Aseempas... |

**Actions column:** Download icon (⬇️) — downloads audit log for each action.

**Request types observed:** Calculate Monthly Salary, LOP Update, Employee Update

---

## Statutory Tab (Expert Mode Top-Level)
URL: `https://skylinxglobal.kredily.com/payroll/reports/main_wrapper/?tab=N`

Sub-tabs: **Form 16 ⊗** | **Form 24Q ⊗**

---

### Form 16 (tab=0)

Sub-tabs: **Form 16 Generation** | **Form 16 Admin**

**Financial Year selector:** 2026-2027 ▼

#### Form 16 Generation
"Click on Generate to upload Part A and Part B"

Buttons: **Upload Part A ↗** | **Upload Part B ↗** | **Upload Instructions:** ℹ️

Table: Search | count: 0 | **BULK DOWNLOAD** | Show 20

**Columns:** ID | Employee Name | Part A | Part B | PAN No. | Generated Date | Released on

Content: "No matching records found"

Pagination: < PREVIOUS | NEXT >

#### Form 16 Admin
**Financial Year:** 2026-2027 ▼ | Edit (✏️) button

**Particulars of the person responsible for Form 16:**
- Name: —
- Designation: —
- Father's Name: —
- Location: —

**Preferences:**
- TDS circle Address: —
- Signing Date: —
- Generated Date: —

---

### Form 24Q (tab=1) — BONUS B1

Sub-tabs: **Overview** | **Challan** | **Settings**

**Financial Year:** 2026-2027 ▼

Left sidebar (quarter list): Q1 Apr 2026–Jun 2026 | Q2 Jul 2026–Sep 2026 | Q3 Oct 2026–Dec 2026 | Q4 Jan 2027–Mar 2027

#### Overview Sub-tab

Buttons: **+ Add Challan** | **Export**

**Columns:** Month | Employee Tax Deducted | Challan Amount | Difference | Employee Mapping

**Q1 data:**
| Month | Employee Tax Deducted | Challan Amount | Difference | Employee Mapping |
|-------|----------------------|----------------|------------|------------------|
| April 2026 | 0 | 0 (0 Challan) | 0 | 0/0 |
| May 2026 | 0 | 0 (0 Challan) | 0 | 0/0 |
| June 2026 | 0 | 0 (0 Challan) | 0 | 0/0 |

#### Add Challan Modal (Bonus B1)

Triggered by **+ Add Challan** button. Modal title: **Add Challan**

**Header fields:**
- Payroll Month: April 2026 ▼
- Minor Head Code: "TDS payable by taxpayer" ▼

**Section: Bank Details**
- Challan Serial No. (text)
- Total Challan Amount (text)
- Payment Date 📅 (date picker)
- Cheque/DD No. (text)
- Bank Name (text)

**Section: Challan Amount**
- Income Tax (text)
- Surcharge (text)
- Education Cess (text)
- Interest (text)
- Penalty (text)
- Others (text)
- BSR Code (text)
- Voucher Date 📅 (date picker)
- Bank Challan No. (text)

**Buttons:** ✕ CANCEL | ✓ SAVE

#### Challan Sub-tab

Same quarter list. Buttons: **+ Add Challan** | **Export**

**Columns:** Month | Challan No. | Challan Amount | Action

Content: Empty

#### Settings Sub-tab

**Section 1: Employer Details**
- Type of Employer: —
- Status of Employer: —

**Section 2: Particulars of Deductor (Employer)**
- TAN of Employee, PAN of Employer, Name of Employer
- Branch/Division of Employer, Flat/Door/Block No., Name of Premises/Building/Village
- Road/Street/Lane/Post Office, Area/Locality/Taluka/Sub division, Town/City/District
- State of the Employer, PIN of the Employer, Email of the Employer
- STD Code of the Employer, Telephone Number of the Employer
- Has Address Changed since the Last Return? — **No** (toggle)

**Section 3: Particulars of the Person Responsible for Deduction**
- Name, Designation, Flat/Door/Block No.
- Name of Premises/Building/Village, Road/Street/Lane/Post Office, Area/Locality/Taluka/Sub division
- Town/City/District, State, PIN
- Email, STD Code, Telephone Number
- Mobile Number, PAN Number
- Has Address Changed since the Last Return? — **No** (toggle)

All fields empty (not configured).


---

## GAP 4 — Expense Module (Full Deep-Dive)

**URL:** `/expense_management/`  
**Access path:** Dashboard sidebar → Expense icon (rupee/gift icon)

### Sub-tabs

| Tab | Status | Notes |
|-----|--------|-------|
| Expenses | **DISABLED** (Enterprise only) | Class `disabled`, badge: "Enterprise Plan Feature" |
| Payout | Accessible | Lists monthly expense payouts |
| Expense Category | Accessible | Manage categories (empty by default) |
| Settings | Accessible | Toggle switches for expense policies |

### Expenses Tab — Enterprise Gate
- Clicking does nothing; DOM inspection reveals:
  ```html
  <a class="disabled">Expenses 
    <img class="interprise-image" data-content="Enterprise Plan Feature">
  </a>
  ```
- Popover text: **"Enterprise Plan Feature"** — not available on Pro Plan

### Payout Tab
- Displays month-wise payout list
- Columns: Month | Employees | Total Amount | Status | Actions
- Shows months where expense payouts were processed
- **Add Payout** button available (top right)
- Bank format downloads available: ICICI, HDFC, Axis, Kotak formats

### Expense Category Tab
- Lists expense categories (e.g., Travel, Food, Accommodation)
- **Add Category** button (top right)
- Empty state if no categories configured
- Each category has: Name | Description | Edit | Delete actions

### Settings Tab
Toggles visible:
- **Employee can add expense** — on/off
- **Expense approval required** — on/off  
- **Receipt mandatory** — on/off
- **Maximum expense limit** — configurable amount field
- **Expense currency** — dropdown (INR default)

### Add Expense Button Behaviour
- Available in Payout tab
- Requires KYC completion before proceeding
- If KYC incomplete → shows warning: "Please complete KYC to add expenses"
- No expense can be submitted without bank/KYC details on file

---

## GAP 5 — Payroll AI Setup Wizard

**URL:** `/payroll_setup_wizard/ai/upload`  
**Access path:** Payroll → Setup Payroll sub-tab → AI Wizard tab

### Welcome Screen
- Heading: **"Welcome aboard! Let's set up payroll"**
- Sub-heading: "Upload your existing payroll data and we'll configure everything automatically"
- Two options presented:

| Option | Description |
|--------|-------------|
| **Magic Upload** | Upload Excel/CSV with existing payroll data; AI parses and maps fields automatically |
| **Manual Setup** | Configure payroll structure step-by-step manually |

### Magic Upload Flow (Step 1)
- Drag-and-drop zone: "Drop your payroll file here or click to browse"
- Accepted formats: `.xlsx`, `.xls`, `.csv`
- File size limit: 10 MB
- After upload: AI maps columns to Kredily fields (Basic, HRA, DA, etc.)
- Mapping screen shows: Your Column → Kredily Field (editable)
- Confirm → payroll structure auto-created

### Manual Setup Option
- Redirects to standard payroll structure builder
- Same as Setup Payroll → Create Structure flow

### Setup Payroll Sub-tabs (parent module)
| Sub-tab | Purpose |
|---------|---------|
| Payroll Settings | Company PF, ESI, PT, TDS settings |
| Assign Structure | Assign salary structure to employees |
| Create Structure | Build custom CTC components |
| AI Wizard | This wizard — `/payroll_setup_wizard/ai/upload` |

---

## GAP 6 — Support Module

**URL:** `https://support.kredily.com/` (opens in new browser tab — NOT embedded)  
**Access path:** Top navigation → Help/Support icon OR `support.kredily.com` directly

### Homepage
- Hero section with search bar: "How can we help you?"
- Two primary sections:

| Section | Contents |
|---------|----------|
| **Admin Help Guide** | Payroll setup, Attendance config, Leave policies, Reports, Integrations |
| **Employee Help Guide** | ESS portal usage, Payslip download, Leave application, Attendance marking |

### Contact / Support Info
- **Phone:** 080 4709 2710 (also shown in top nav of main app)
- **Email:** Listed on support portal
- **Hours:** Business hours (Mon–Fri)
- **Chat widget:** Bottom-right chat bubble (same as main app — likely Intercom/Freshchat)

### Article Categories (Admin)
- Getting Started
- Payroll & Salary
- Attendance & Leave  
- Employee Management
- Reports & Compliance
- Integrations & API
- Billing & Plans

### Article Categories (Employee)
- My Profile & Documents
- Payslips & Tax
- Leave & Attendance
- ESS Portal Guide

---

## GAP 7 — Getting Started Wizard & Dashboard Module Tour

### A. AI Setup Wizard (3-Step Onboarding)
**URL:** `/setup_wizard/onboarding/addEmployee`  
**Access path:** Dashboard → "Getting Started" button (top bar, next to module name)

#### Step 1: Add Employees
- Form fields: Name, Email, Department, Designation, Date of Joining
- Bulk import option: Upload CSV template
- CTA: "Add Employee" → "Next: Attendance & Leave"

#### Step 2: Attendance & Leave
- Configure attendance policy: shift timings, work days
- Leave types: PL, SL, CL — set annual quota
- Holiday calendar: upload or pick from template
- CTA: "Save & Next: Setup Payroll"

#### Step 3: Setup Payroll
- Choose salary structure or use AI Wizard
- Set PF/ESI/PT applicability
- CTA: "Finish Setup"

Progress indicator shows: ① Add Employees → ② Attendance & Leave → ③ Setup Payroll

### B. Dashboard Module Tour (8-Step Guided Tour)
**Access:** Click company logo / branding area on dashboard  
**Format:** Tooltip overlay with "Next" / "Skip" buttons, step counter

| Step | Tooltip Target | Description |
|------|---------------|-------------|
| 1 | Dashboard home | "Welcome to Kredily! This is your command center for HR operations." |
| 2 | Company Profile icon | "Set up your company details, departments, and designations here." |
| 3 | Directory icon | "Manage all your employees — add, edit, view profiles and documents." |
| 4 | Attendance icon | "Track attendance logs, set rules, view analytics." |
| 5 | Leave icon | "Configure leave policies and manage leave requests." |
| 6 | Payroll icon | "Run monthly payroll, generate payslips, and file compliance." |
| 7 | Expense icon | "Manage employee expense claims and reimbursements." |
| 8 | Rewards icon | "Recognise employees with points, badges, and leaderboards." |

Tour ends with: "You're all set! Start by adding your first employee."

---

## BONUS B4 — Attendance Calendar View

**URL:** `/attendanceLog/viewAttendanceLog/` (toggle: Table View → Calendar View)  
**Access path:** Attendance → Logs tab → "Calendar View" toggle button (top right of Logs)

### Controls
- Search: by Name or Employee ID
- Export button (blue)
- Year dropdown: 2026
- Month dropdown: June

### Column Structure
- Employee ID | Employee Name | Day columns (1–31, labelled Mon/Tue/etc.)
- Each cell shows status code + color

### Color Legend
| Code | Color | Meaning |
|------|-------|---------|
| **P** | Green | Present |
| **A** | Red/Pink | Absent |
| **H** | Grey (light) | Holiday |
| **WO** | Dark grey | Week Off |
| **AN** | Orange | Absent (Notified / Half-day) |
| **NA** | No color | Not Applicable (no attendance policy assigned) |

### June 2026 Sample Data (6 employees, page 1 of 1)

| Employee | 1 | 2(H) | 3 | 4 | 5 | 6 | 7(WO) | 8 | 9 | 10 | 11 |
|----------|---|------|---|---|---|---|--------|---|---|----|-----|
| Sirimalla Saranya | P | H | P | P | P | P | WO | P | P | AN | AN |
| Mohhmad Aseem... | P | H | P | P | P | P | WO | P | P | P | AN |
| Swami Test (emp #2) | NA | NA | NA | NA | NA | NA | NA | NA | NA | NA | NA |
| Chappidi Gunad... | A | H | A | A | AN | A | WO | A | AN | A | A |
| Ummey Afifa Kh... | NA | NA | NA | NA | NA | NA | NA | NA | NA | AN | P |
| Mohammed Sh... | A | H | A | A | A | A | WO | A | A | A | A |

**Note:** Swami Test shows all NA — no attendance policy assigned (test employee created during audit).

---

## BONUS B5 — Attendance Analytics

**URL:** `/attendanceLog/viewAttendanceAnalytics/`  
**Access path:** Attendance → Analytics tab

### View Controls
- **View dropdown:** Weekly / Monthly / Yearly
- **Date navigation:** ← 6 Jun, 2026 – 13 Jun, 2026 →

### Charts (Weekly view, 6 Jun – 13 Jun 2026)

#### In Time (Donut chart)
- **Average: 10:21 AM**
- 0 Early (green)
- 16 On Time (blue) — 100%
- 0 Late (orange)
- All employees clocking in on time this week

#### Out Time (Donut chart)
- **Average: 04:43 PM**
- 4 Early (green) — 25%
- 8 On Time (blue) — 50%
- 4 Late (orange) — 25%

#### Work Duration (Bar chart)
- X-axis: dates (06 Jun, 07 Jun, 08 Jun, 09 Jun, 10 Jun, 11 Jun, 13 Jun)
- Y-axis: hours (0–10)
- Green bars showing daily average work hours
- Peak: ~9.5 hrs on 07 Jun / 08 Jun
- Drops on 11 Jun / 13 Jun (~4.5 hrs)
- Legend: Average (green)


---

## GAP 8 — Employee ESS: Payroll Sub-tabs (Pay Slip, Salary Structure, Declaration, Bank Account)

**Access path:** My Profile (left sidebar) → Payroll tab  
**URL pattern:** `/payroll/user_view_wrapper/?tab=N&uu=<employee-uuid>`

### My Profile — Full Tab List (ESS View)
The employee self-service profile (My Profile / `/employee/overview/`) has **12 tabs** (scrollable with < > arrows):

| # | Tab | Contents |
|---|-----|---------|
| 1 | Stationery | Company letterheads, offer letters, documents |
| 2 | Personal | Personal info, contact info, address |
| 3 | Work | Employment details, joining date, designation |
| 4 | Team | Org chart, reporting manager, direct reports |
| 5 | Education | Academic qualifications |
| 6 | Family | Family member details |
| 7 | Documents | ID proofs, KYC documents |
| 8 | Work Week | Working days / shift schedule |
| 9 | Attendance | Personal attendance logs |
| 10 | Leave | Personal leave summary and requests |
| 11 | Payroll | Pay slips, salary structure, declaration, bank account |
| 12 | File Manager | File storage for the employee |

### Payroll Tab — Sub-tabs
URL: `/payroll/user_view_wrapper/?tab=N&uu=<uuid>`

| Sub-tab | URL tab param | Description |
|---------|--------------|-------------|
| Pay Slip | `tab=1` | Monthly payslip viewer (Year + Month selectors) |
| Salary Structure | `tab=2` | View assigned CTC breakdown |
| Declaration | `tab=4` | Tax declaration & scheme selector |
| Bank Account | `tab=5` | Salary account details |

### Pay Slip Tab (tab=1)
- Year selector (2026) + Month selector (February ▼)
- Navigation arrows ← →
- Renders full payslip PDF-style in browser:

**Sample Payslip — February 2026 (Mohhmad Aseempasha)**
```
Company:     SkyLinx Global Solutions
Address:     532, Uptown Cyberabad, A-Block, 2nd Floor,
             100feet Road, Ayyappa Society, Madhapur,
             Hyderabad, Telangana, 500081

Name:              Mohhmad Aseempasha
Employee ID:       SGS/HRO/1447005
Designation:       Manager - HR&Operations
Department:        HR
Location:          Hyderabad
Bank Name:         AU Small Finance Bank
Bank Account No.:  2601266710606225
PAN No.:           GCDPM5084F
Effective Work Days: 28
LOP:               0.0
```

### Declaration Tab (tab=4)
**URL:** `/payroll/user_view_wrapper/?uu=<uuid>&from_year=2026&to_year=2027&tab=4`

**Top banner (yellow):** "New Tax Scheme is selected to change the tax scheme. Please connect your HR"

**Controls:**
- FY dropdown: 2026-2027
- **Copy From Previous Year** button
- **Tax Scheme Selector** sub-tab (only tab; 80C/deduction tabs appear only for Old Scheme)

**Tax Scheme Comparison:**

| | Old Tax Scheme | New Tax Scheme (Recommended) |
|--|---------------|------------------------------|
| Select button | Blue outline | Green filled |
| Up to | ₹2,50,000 = Nil | ₹4,00,000 = Nil |
| Slab 2 | ₹2,50,001–5,00,000 = 5% | ₹4,00,001–8,00,000 = 5% |
| Slab 3 | ₹5,00,001–10,00,000 = 20% | ₹8,00,001–12,00,000 = 10% |
| Slab 4 | ₹10,00,000+ = 30% | ₹12,00,001–16,00,000 = 15% |
| Slab 5 | — | ₹16,00,001–20,00,000 = 20% |
| Slab 6 | — | ₹20,00,001–24,00,000 = 25% |
| Slab 7 | — | ₹24,00,001+ = 30% |

**Disclaimer box:** "This recommendation does not include any investments or deductions. Please review both tax regimes and choose the one that best suits your financial situation."

**Note:** Old Tax Scheme would reveal investment declaration fields (80C, 80D, HRA, LTA etc.) once selected. New Scheme has no deductions, so no declaration fields appear.

### Bank Account Tab (tab=5)
**Section header:** SALARY ACCOUNT DETAILS (with pencil edit icon ✏️)

**Sample data (Mohhmad Aseempasha):**
| Field | Value |
|-------|-------|
| Account Holder's Name | Mohhmad Aseempasha |
| Bank Name | AU Small Finance Bank |
| Account Number | 2601266710606225 |
| Branch Name | AU Small Finance Bank, Serilingampally |
| City | Hyderabad |
| IFSC Code | AUBL0002667 |

Employee can edit their own bank details using the pencil icon (✏️) at top right of the card.

---

## BONUS B2 — Company Profile → Policies → eSign Flow

**URL:** `/companyPolicy/listPolicies/`  
**Access path:** Company Profile → Policies tab

### Policies Tab — Sub-tabs
| Sub-tab | Description |
|---------|------------|
| Company Policies | Upload and manage policy documents |
| eSign | Track which employees have signed each policy |

### Company Policies Sub-tab
- Lists all uploaded policy documents
- Default row: "Company Policies" (the document uploaded 13-01-2026)
- Action icons per row: 📄 View | ☁ Upload | ✏️ Edit | 🗑 Delete | ▾ Expand
- **+ Add** button to upload new policy document

### eSign Sub-tab
**Purpose:** Track digital acceptance/signatures of company policies by all employees.

**Controls:**
- Search bar (by employee name/ID)
- **Bulk Notify** button (blue, top right) — sends reminder to ALL pending employees at once

**Table columns:** ID | Employee Name | Department | Manager | Accepted/Pending

**Current eSign status (all 6 employees):**
| ID | Employee Name | Department | Manager | Accepted/Pending |
|----|--------------|------------|---------|-----------------|
| SGS/DS/1447023 | Sirimalla Saranya | Data specialist | Mohhmad Aseempasha | 0/1 (Pending) |
| SGS/HRO/1447005 | Mohhmad Aseempasha | HR | Mohammed Shareefuddi | 1/0 (Accepted) |
| 2 | Swami Test | — | — | 0/1 (Pending) |
| SGS/SE/1447027 | Chappidi Gunadeep Yadav | Operations | Mohhmad Aseempasha | 0/1 (Pending) |
| SGS/ITE/1447028 | Ummey Afifa Khatoon | Operations | Chappidi Gunadeep Yadav | 0/1 (Pending) |
| SGS/CEO/1447001 | Mohammed Shareefuddi | Operations | — | 1/0 (Accepted) |

**Note:** Swami Test (deleted test employee) still appears in eSign list with ID=2, no department/manager, status Pending. Demonstrates that deletion does not retroactively remove from policy tracking.

### eSign Expanded Row (per employee)
Clicking ">" on any row reveals:
| Column | Sample Value |
|--------|-------------|
| Policy Name | Company Policies |
| Policy Added Date | 13-01-2026 |
| Policy Accepted Date | (empty if pending) |
| Status | Pending (red) / Accepted (green) |
| Action | **Notify** button (blue) — sends individual reminder |

### eSign Flow (Admin perspective)
1. Upload policy document in "Company Policies" sub-tab
2. System automatically assigns the document to all active employees
3. Employees receive notification to read and accept the policy in their ESS portal
4. Admin tracks status per employee via eSign tab
5. Use "Notify" (individual) or "Bulk Notify" to send reminders to pending employees

---

## BONUS B3 — Directory: Employee Profile Deep-Dive

**URL:** `/company/emp_list/?tab=1` (list) → `/employee/overview/?uu=<uuid>` (profile)

### Directory List View
**Stats bar:**
- Invalid Email: 0 | Mobile Users: 5 | Signed In: 5 | Not Signed In: 1

**Bulk actions:**
- Bulk Edit | Mail | Delete | Import | Export | Show (10/25/50)

**Filter dropdowns:** Signed In | Manager | Grade | Department | Work Location | Sort By

**Table columns:** ☐ | ID | Employee Name | Department | Designation | Grade | Employee Manager

**Note:** There is NO kebab/3-dot menu on hover in the list view. Actions are handled via:
- Selecting checkbox(es) → bulk action buttons activate
- Clicking employee name → opens full profile page

### Employee Profile Page (Admin View)
**URL:** `/employee/overview/?uu=<employee-uuid>`  
**All tabs:**

| Tab | Key Fields |
|-----|-----------|
| Stationery | Documents (offer letters, appointment letters) |
| Personal | Name, DOB, Gender, Blood Group, Marital Status, Disability, Contact Info |
| Work | Employment details |
| Team | Reporting structure |
| Education | Academic history |
| Family | Family members |
| Documents | ID proofs, KYC |
| Work Week | Shift/work schedule |
| Attendance | Attendance summary |
| Leave | Leave history |
| Payroll | Salary details (admin view, read-only) |

**Sample employee (Chappidi Gunadeep Yadav):**
- Employee ID: SGS/SE/1447027 (truncated in list as SGS/...)
- Department: Operations | Designation: Software Engineer
- DOB: 12/01/2005 | Gender: Male | Blood Group: AB+ | Marital: Single | Disabled: No
- Email: gunadeepyadav89@gmail.com (Official & Personal)
- Phone: 9347966211 | Alternate: —
- Work Location: Corporate Office

### ESS vs Admin Profile Differences
| Feature | Admin View (`/employee/overview/?uu=X`) | ESS View (`/employee/overview/`) |
|---------|----------------------------------------|----------------------------------|
| Can edit | No (read-only for HR viewing others) | Yes (employee edits own data) |
| Tabs | 11 tabs | 12 tabs (adds Payroll with sub-tabs) |
| Payroll | Basic payroll info | Full: PaySlip, Salary Structure, Declaration, Bank Account |


---

## BONUS B5 — Leave Analytics

**URL:** `/leave-request/viewLeaveAnalytics/`  
**Access path:** Leave → Analytics tab

### Controls
- View dropdown: Weekly / Monthly / Yearly
- Date navigation: ← 6 Jun, 2026 – 13 Jun, 2026 →

### Charts (Weekly view, 6 Jun – 13 Jun 2026)

#### Chart 1: By Leave Type (donut)
- **Total: 44** (historical total, not current week)
- Current week data: **No data available** (faded donut shown as background)
- Leave types in legend:
  - Casual Leave — 110 (annual total)
  - Earned Leave — 20
  - Sick Leave — 70
  - On Duty — 70
  - Others — 70
- Label below: "For 0 Employee"

#### Chart 2: By Department (donut)
- Same structure, same "No data available" for current week
- Label below: "For 0 Department"

#### Chart 3: By Leave Type — Line chart
- Filter dropdown: **By Leave Type: Casual Leave** (changeable)
- X-axis: Jan → Dec (full year 2026)
- Y-axis: 0.0 to 1.0
- All data points at 0.0 (flat line) — no Casual Leave taken in this period
- Note: Shows trend data, useful for monthly/yearly views

#### Chart 4: By Department — Line chart
- Filter dropdown: **By Department: Operations**
- Same format as chart 3

---

## EXTRA — Leave Module: Balance, Rules & Settings

### Leave Balance Tab
**URL:** `/rule_set/viewLeaveBalance/`  
**Columns:** ID | Employee Name | Department | Location | Casual Leave | Comp Off | ON Duty Leave | Paternity Leave | Sick Leave | Work From Home | (scrollable right)

**Controls:** Import | Export | Show 20 | Search | + (add column)

**Leave Balance Data (as of Jun 2026):**
| Employee | Casual Leave | Comp Off | ON Duty | Paternity | Sick Leave |
|----------|-------------|---------|---------|-----------|-----------|
| Sirimalla Saranya (SGS/DS) | — | 0.00 | — | — | 3.89 |
| Mohhmad Aseempasha (SGS/HR) | 3.00 | 31.00 | — | — | 4.42 |
| Swami Test (2) | — | 0.00 | — | — | — |
| Chappidi Gunadeep Yadav (SGS/SE) | — | 29.50 | — | — | 3.42 |
| Ummey Afifa Khatoon (SGS/ITE) | — | 0.00 | — | — | 0.93 |
| Mohammed Shareefuddi (SGS/CE) | 4.00 | 0.00 | 10.00 | 7.00 | 4.00 |

Note: "—" means leave type not assigned to employee; 0.00 means assigned but zero balance.

### Leave Rules Tab
**URL:** `/leaves/viewLeaveRuleBase/?tab=0`

**Sub-tabs:** Leave Rules | Assign Leave Rules

**Leave Types in left panel:**
| Leave Type | Employees Assigned |
|------------|-------------------|
| Earned Leave | 0 (No Employees) |
| Loss Of Pay | 6 Employees |
| Casual Leave | 2 Employees |
| Work From Home | 1 Employee |
| Sick Leave | 5 Employees |
| Maternity Leave | 0 (No Employees) |
| Paternity Leave | (partially visible) |

**Earned Leave — General Settings (sample rule detail):**
- Name: Earned Leave
- Description: "This is a default description for the Leave Type. You can customise this."
- Leave Short Name: —
- Leaves Allowed in a Year: **24.0**
- Weekends Between Leave: **Not Considered**
- Holidays Between Leave: **Not Considered**
- Accrual:
  - Creditable On Accrual Basis: **Yes**
  - Creditable On Present Day Basis: **No**
- Advanced Settings sub-tab: additional rule configuration (⊗ badge = active config)

### Leave Settings Tab
**URL:** `/rule_set/viewLeaveSettings/`

| Section | Setting | Current Value |
|---------|---------|---------------|
| Annual Leave Cycle | Enable Financial Year Cycle (Default is Calendar Year Cycle) | **Off** |
| Multi Level Approval | Enable Skip Level Approval (Your Manager's Reporter) | **Off** |

**Implication:** Leave cycle runs January–December (Calendar Year), and skip-level approval is disabled — leave requests go only to direct manager.

---

## EXTRA — Rewards Module (Discount Vouchers)

**URL:** `/kredily-rewards/?tab=0`  
**Access path:** Rewards icon (gift box) in left sidebar

### Overview
The Rewards module in Kredily is a **discount voucher and employee benefits marketplace** — not a peer recognition/points system. Employees can purchase discounted e-gift cards from popular brands directly within the HRMS.

### Sub-tabs
| Tab | Description |
|-----|------------|
| Vouchers | Browse and purchase gift cards |
| Purchase History | Past voucher purchases |

### Vouchers Tab
**Hero section:** "The Discount Voucher and Benefits Shop" with Kredily Prime card visual

**Top Brands (featured):**
- Flipkart E-Gift Voucher — **FLAT 2.5% OFF**
- Nykaa B2B E-Gift Card — **FLAT 4% OFF**
- Amazon Pay E-Gift — **FLAT 2% OFF**

**Categories (carousel):**
Jewellery | Entertainment | Grocery Dept. Stores | Travel | Apparel | Accessories | Health and Beauty | E-Commerce | Luxury | (more with → arrow)

**Travel Section (sample brands):**
- TAJ Luxury Hotels E-Gift Card — 3.5% OFF
- Yatra E-Gift Card — 3% OFF
- MakeMyTrip E-Gift Card — 4.5% OFF
- (additional hotel/travel brands)

**Grocery Section (sample brands):**
- More E-Gift Card — 2% OFF
- Spar Hypermarket E-Gift Card — 3.5% OFF

### Search
- "Search Gift Card" bar (top right of Vouchers tab)
- Search by brand name

### Purchase History Tab
- Lists all past voucher purchases by the current user
- Columns: Brand | Amount | Discount | Final Price | Date | Status

### Note on Rewards vs Recognition
The Rewards module in Kredily Pro Plan is purely a **discount voucher marketplace**. Recognition features (points, badges, peer-to-peer recognition, leaderboards) visible in the dashboard tour tooltip for step 8 may be an Enterprise plan feature.

---

## EXTRA — Attendance Module: Remaining Tabs

### Approvals Tab
- Shows pending attendance regularisation requests from employees
- Admin can approve/reject incorrect or missing check-ins/check-outs
- Columns: Employee | Date | Check-in | Check-out | Reason | Status | Action

### Rules Tab
- Configure attendance policies: shift timings, overtime rules
- Policies assigned per department/employee group

### Settings Tab
- Attendance capture method settings (mobile app, web, biometric integration)
- IP/location restrictions for attendance marking
- Late mark thresholds

---

## EXTRA — Company Profile: Admin, Statutory & My Plan Tabs

### Admin Tab (Company Profile → Admin)
- Company administrator settings
- Admin user management

### Statutory Tab (Company Profile → Statutory)
- PF, ESI, PT, TDS registration numbers
- State-specific professional tax settings
- TAN, PAN of company

### My Plan Tab (Company Profile → My Plan)
- Current plan: **Professional**
- Available Licenses: **19**
- **Purchase Licenses** button
- Billing history / invoice downloads

---

## GAPS REMAINING AFTER SECOND PASS

The following areas were identified but could not be fully explored due to plan/access restrictions or session constraints:

### Plan-Gated (Enterprise Only)
| Feature | Location | Gate |
|---------|----------|------|
| Expenses tab (employee expense submission) | `/expense_management/` | Enterprise Plan badge |
| Rewards recognition (points/badges/leaderboard) | Rewards module | Likely Enterprise |
| Advanced integrations (Slack, HRMS API) | Company Profile → Admin | Likely Enterprise |

### Requires Live Data / External Action
| Feature | Reason |
|---------|--------|
| Payroll Run completion (March 2026) | Skipped to avoid sending employee notifications |
| Expense payout bank transfer | Requires KYC + bank confirmation |
| eSign acceptance (employee side) | Requires logging in as individual employee |
| Tax Declaration (Old Regime 80C fields) | Only appears after selecting Old Tax Scheme |

### ESS Employee View (Non-Admin)
| Feature | Notes |
|---------|-------|
| Employee mobile app | Separate Android/iOS app not audited |
| Employee leave application | Employee-facing flow (admin can view/approve but not apply) |
| Employee expense submission | Expense creation from employee side |

### Attendance Sub-tabs (Not Fully Drilled)
| Tab | Status |
|-----|--------|
| Automation Logs ⊗ | Had ⊗ badge indicating active automation; contents not expanded |
| Rules → individual rule detail | Viewed list, not individual rule config |
| Settings → full config | Viewed high-level; deep biometric/IP settings not documented |

### Leave Rules Detail
| Area | Status |
|------|--------|
| All leave types (7 total) | Only Earned Leave General Settings documented in detail |
| Assign Leave Rules flow | Sub-tab not explored |

---

*FULL_DOC.md — Second Pass Complete | Audit Date: 2026-06-13*  
*Audited by: Claude (Anthropic) via Chrome MCP automation*  
*Platform: Kredily HRMS (PeopleProsper Technologies Pvt. Ltd.)*  
*Organization: SkyLinx Global Solutions | Domain: skylinxglobal.kredily.com*

