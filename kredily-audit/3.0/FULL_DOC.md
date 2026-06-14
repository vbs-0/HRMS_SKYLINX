# Kredily HRMS — Third Pass Audit
**Date:** 2026-06-14  
**Auditor:** Claude (Anthropic) via Chrome MCP  
**Organization:** SkyLinx Global Solutions  
**Domain:** skylinxglobal.kredily.com  

## THIRD PASS — FINAL GAPS (2026-06-14)

---

## GAP A — Tax Declaration: Old Regime — All Sections

**Access path:** Admin → Payroll → Employee (Mohhmad Aseempasha / hr@skylinxglobal.com) → Declaration tab  
**Tax scheme for this audit:** Old Tax Scheme (approved via Admin API, then restored to New Tax Scheme after documentation)  
**Employee UUID:** `8a374d06-d40b-457f-8cc5-ea56e9780100`  
**FY:** 2026-2027  
**Status during audit:** Declaration Window NOT open ("Declaration Window is not yet open. Please contact your HR.")

---

### GAP A.1 — Overview Tab (Old Regime)

**URL:** `/payroll/user_view_wrapper/?uu=8a374d06...&from_year=2026&to_year=2027&tab=4`

**Page header elements:**
- FY selector dropdown: `2026 - 2027 ▼`
- Tax scheme badge (top right): `Old Tax Scheme` (clickable — opens scheme selector modal in eligible state)
- Button: `Copy From Previous Year` (blue)

**Summary table columns:** Section | Declared Amount | Status

**Summary rows visible in Overview:**
| Section | Declared Amount | Status |
|---------|-----------------|--------|
| Deductions | 0 | No Entry Yet |
| Income From Previous Employer | 0 | No Entry Yet |
| Reimbursements | 0 | No Entry Yet |
| House Property | — | No Entry Yet |
| House Rent Allowance | — | No Entry Yet |
| LTA | — | No Entry Yet |

**Income Tax Slabs — Old Tax Regime (shown at bottom of Overview):**
| Income Range | Tax Rate |
|--------------|----------|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% on income above ₹2,50,000 |
| ₹5,00,001 – ₹10,00,000 | ₹12,500 + 20% above ₹5,00,000 |
| Above ₹10,00,001 | ₹1,12,500 + 30% above ₹10,00,000 |

---

### GAP A.2 — Deduction Tab → Section 80C Sub-tab

**Sub-tabs inside Deduction:** `Section 80C` | `Other Exemptions`

**Section 80C fields (14 investment categories):**

| # | Category | Notes |
|---|----------|-------|
| 1 | Life Insurance Premium (LIC) | Free input |
| 2 | Fixed Deposits (5-Year, Tax Saving) | Free input |
| 3 | ELSS / Tax Saving Mutual Funds | Free input |
| 4 | ULIP (Unit Linked Insurance Plan) | Free input |
| 5 | EPF (Employee Provident Fund) | System-generated / auto-populated |
| 6 | PPF (Public Provident Fund) | Free input |
| 7 | NSC (National Savings Certificate) | Free input |
| 8 | Home Loan Principal Repayment | Free input |
| 9 | Pension Fund (80CCC) | Free input |
| 10 | Children's Tuition Fees | Free input |
| 11 | Sukanya Samriddhi Account | Free input |
| 12 | NABARD Rural Bonds | Free input |
| 13 | Other Deductions under 80C | Free input |
| 14 | VPF (Voluntary Provident Fund) | Free input |

**Aggregate deduction limit:** ₹1,50,000 (combined 80C + 80CCC + 80CCD(1))  
**All values:** ₹0 / blank (declaration window closed)

---

### GAP A.3 — Deduction Tab → Other Exemptions Sub-tab

**17 exemption sections:**

| # | Section | Allowed Deduction |
|---|---------|-------------------|
| 1 | 80EEA — Interest on Affordable Housing Loan | ₹1,50,000 |
| 2 | 80CCD-1B — Additional NPS Contribution | ₹50,000 |
| 3 | 80CCD-2 — Employer's NPS Contribution | As per salary |
| 4 | 80CCG — Rajiv Gandhi Equity Savings Scheme | ₹25,000 |
| 5 | 80D — Self & Family (Medical Insurance) | ₹25,000 |
| 6 | 80D — Parents (Medical Insurance) | ₹25,000 |
| 7 | 80D — Parents Senior Citizen | ₹50,000 |
| 8 | 80DD — Disability (dependent) | ₹75,000 / ₹1,25,000 severe |
| 9 | 80DDB — Specified Disease Treatment | ₹40,000 / ₹1,00,000 senior |
| 10 | 80E — Interest on Education Loan | Actual interest paid |
| 11 | 80G — Donations to Eligible Funds | 50% or 100% as applicable |
| 12 | 80GG — Rent Paid (no HRA component) | ₹60,000 p.a. max |
| 13 | 80GGC — Donation to Political Parties | Actual amount |
| 14 | 80TTA — Interest on Savings Account | ₹10,000 |
| 15 | 80U — Disability (self) | ₹75,000 / ₹1,25,000 severe |
| 16 | Others (miscellaneous) | Free input |
| 17 | Additional field | Free input |

**All values:** ₹0 / blank

---

### GAP A.4 — House Rent Tab

**State:** ALL BLANK — employee has no HRA salary component + declaration window closed

**Fields present (visible but inactive):**
- City type: Metro / Non-Metro (radio buttons)
- Monthly rent paid (₹ numeric)
- Landlord name (text)
- Landlord PAN (text, 10-char alphanumeric)
- Rental period: From date → To date (date pickers)
- `+ Add Period` button (for multiple rental periods)

---

### GAP A.5 — House Property Tab

**State:** ALL BLANK

**Fields present:**
- Property type: Self-Occupied / Let-Out / Deemed Let-Out (radio)
- Annual rent received (₹)
- Municipal taxes paid (₹)
- Interest on housing loan (₹)
- Pre-construction interest (₹)
- Co-owner toggle + co-owner details

---

### GAP A.6 — LTA Tab (Leave Travel Allowance)

**State:** ALL BLANK

**Fields present:**
- Travel mode: Air / Rail / Road (radio)
- Journey From (text)
- Journey To (text)
- Amount claimed (₹)
- Travel date(s) (date picker)
- Family members travelling (count / numeric)
- LTA block year eligibility note (informational text)

---

### GAP A.7 — Income from Previous Employer Tab

**State:** ALL BLANK / "No Entry Yet"

**Fields present:**
- Previous employer name (text)
- PAN of previous employer (text)
- Employment period: From date → To date
- Gross salary from previous employer (₹)
- Professional tax paid (₹)
- TDS deducted by previous employer (₹)
- PF contribution by previous employer (₹)
- Perquisites value (₹)

---

### GAP A.8 — Reimbursements Tab

**State:** ALL BLANK / "No Entry Yet"

**Behaviour:** Shows salary components tagged as "Reimbursement" type in salary structure  
**Fields per component:**
- Component name (read-only, system label)
- Claim amount (₹ numeric)
- Upload proof (file attachment input)
- Notes / description (text)

---

### GAP A.9 — Forms Tab

**Sub-tabs:** `Form 12BB` | `Form 16`

**Form 12BB:**
- Statutory declaration form, auto-populated from declared values
- Shows: employee name, PAN, employer details, all declared investment amounts
- Declaration statement: "I, [employee name], hereby declare that the particulars given above are true to the best of my knowledge and belief"
- Signature field (digital acknowledgment)
- Actions: Print / Download buttons

**Form 16:**
- Displays: "No document available"
- Populates after year-end TDS certificate is issued

---

### GAP A.10 — Admin Declaration Page (Bonus Discovery)

**URL:** `/payroll/admin/employer_declaration/?tab=6&from_year=2026&to_year=2027`

**Tabs on Admin Declaration page:**
1. Tax Scheme  
2. HRA  
3. Deduction  
4. Income/Loss from House Property  
5. LTA  
6. Income from Previous Employer  
7. Reimbursements  
8. Forms  

**Tax Scheme tab — table columns:** ID | Employee Name | Location | Tax Scheme (dropdown) | Status

**Approval UI (HTML):**
- Approve radio: `id="radioYestaxScheme{uuid}"` value="Approve" — `<label class="greenLabel">` wrapper
- Reject radio: `id="radioNotaxScheme{uuid}"` value="Disapprove" — `<label class="redLabel">` wrapper
- Both inputs `visibility:hidden`; jQuery `.change()` fires the API call

**API endpoint:** `POST /payroll/declaration/admin_action_on_declaration/`  
**Payload:**
```json
{
  "action": "Approve",
  "uuid": "<employee-uuid>",
  "declaration_type": "taxScheme",
  "from_year": "2026",
  "to_year": "2027",
  "tax_scheme": "old_tax | new_tax"
}
```
**Success response:** `"Successfull"` (Kredily's spelling)

**Page-level action buttons:** `Bulk Approve` | `Export` | `Download Proofs`

---

### GAP A — Tax Scheme Restoration

After full Old Regime documentation:
- Called `POST /payroll/declaration/admin_action_on_declaration/` with `tax_scheme: "new_tax"`, `action: "Approve"`
- API response: `"Successfull"`
- Page reload confirmed: top-right badge shows **"New Tax Scheme"** ✓

---

## GAP B — Employee Leave Application Flow

**Access path:** Admin toggle → User mode → Leaves | Mohhmad Aseempasha  
**URL (Apply Leave):** `/leave-request/leave_accrual/`  
**URL (Logs):** `/leave-request/employeeLeaves/`  
**URL (Rules):** `/leaves/employeeLeaveRules/`  
**Mode switch:** Top-right "Admin" toggle → click to switch to "User" mode (and back)

---

### GAP B.1 — Apply Leave Page (Leave Balance View)

**Page title:** "Apply Leave"  
**Header:** "Leaves | Mohhmad Aseempasha"  
**Tabs:** `Apply Leave` | `Logs` | `Rules`  
**Top-right button:** `Apply For Leave` (blue)

**Leave balance cards (left panel):**

| Leave Type | Credited | Total Allowed | Applied | Penalty Deduction | Balance |
|------------|----------|---------------|---------|-------------------|---------|
| Casual Leave | 3 | 12 | 0 | 0.00 | **3.00** |
| Sick Leave | 5.42 | 12 | 1 | 0.00 | **4.42** |

**Card actions:** Each card has a pencil ✏ icon (top right of card) — purpose: edit leave (admin-only? or request amendment)

**Accrual History panel (right side):**
- Dropdown: `Casual Leave ▼` (switch between leave types)
- Monthly grid with columns: Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec
- Grid rows: Credited Leaves | Applied Leaves | Penalty Deduction | Closing Balance

**Casual Leave Accrual History (2026):**
| Row | Jan | Feb | Mar | Apr | May | Jun | Rest |
|-----|-----|-----|-----|-----|-----|-----|------|
| Credited Leaves | 0.00 | 0.00 | 0.00 | 1.00 | 1.00 | 1.00 | 0.00 |
| Applied Leaves | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| Penalty Deduction | – | – | – | – | – | – | – |
| Closing Balance | – | – | – | 1 | 3 | 3.00 | – |

---

### GAP B.2 — Apply Leave Modal (Form fields)

**Triggered by:** `Apply For Leave` button (top right)

**Modal title:** "Apply Leave"

**Fields:**

| Field | Type | Options / Notes |
|-------|------|-----------------|
| Leave Type | Dropdown (select) | Sick Leave / Loss of Pay / Comp Off / Casual Leave |
| Start Date | Date picker | Format: DD/MM/YYYY; calendar icon |
| Select Half (Start) | Dropdown | First Half / Second Half |
| End Date | Date picker | Format: DD/MM/YYYY; calendar icon |
| Select Half (End) | Dropdown | First Half / Second Half |
| Write your Reason | Textarea (resizable) | Free text |

**Action buttons:** `✗ CANCEL` | `APPLY` (blue)

**Available Leave Types in dropdown (from DOM):**
1. Sick Leave (value: 2)
2. Loss of Pay (value: 9)
3. Comp Off (value: 10)
4. Casual Leave (value: 1)

**Default selection:** Sick Leave

**Note:** DO NOT SUBMIT — modal inspected and closed via CANCEL.

---

### GAP B.3 — Leave Logs Tab (Employee View)

**URL:** `/leave-request/employeeLeaves/`  
**Page title:** "Logs"  
**Year selector:** `Select Year 2026 ▼`  
**Show per page:** 20

**Table columns:** Type | Start Date | End Date | Days | Applied On | Status | Actions

**Existing entries (2026):**

| Type | Start Date | End Date | Days | Applied On | Status | Actions |
|------|------------|----------|------|------------|--------|---------|
| Sick Leave | 04 Apr 2026 | 04 Apr 2026 | 1.0 | 06 Apr 2026 | Approved | *(none)* |

**Notes:**
- Approved entries show no Actions (no cancel/withdraw option visible)
- Pending entries would show Cancel / Withdraw options
- Pagination: Page 1 of 1

---

### GAP B.4 — Rules Tab (Employee Read-Only View)

**URL:** `/leaves/employeeLeaveRules/`  
**Page title:** "Rule list"

**Leave types listed (left sidebar):**
1. Loss Of Pay — Effective Date: 01/09/25
2. Sick Leave — Effective Date: 19/01/26
3. Casual Leave — Effective Date: 01/04/26

Each rule has two sub-tabs: **General Settings** | **Advanced Settings**

---

#### Loss of Pay — General Settings
| Field | Value |
|-------|-------|
| Name | Loss of Pay |
| Description | This is a default description for the Leave Type. You can customise this. |
| Leave Short Name | -- |
| Weekends Between Leave | Count as Leave |
| Holidays Between Leave | Count as Leave |
| Allowed under Probation | Yes |
| Allowed under Notice Period | No |
| Show LOP Summary to Employee | No |

#### Loss of Pay — Advanced Settings
| Section | Field | Value |
|---------|-------|-------|
| Miscellaneous | Future-dated Leaves Allowed | Yes |
| Miscellaneous | Future-dated Leaves Allowed After | 120 Days |
| Miscellaneous | Backdated Leaves Allowed | Yes |
| Miscellaneous | Backdated Leaves Allowed up to | 120 Days |
| Miscellaneous | Apply Leaves for Next Year Till | February |

---

#### Sick Leave — General Settings
| Field | Value |
|-------|-------|
| Name | Sick Leave |
| Description | This is a default description for the Leave Type. You can customise this. |
| Leave Short Name | -- |
| Leaves Allowed in a Year | 12.0 |
| Weekends Between Leave | Not Considered |
| Holidays Between Leave | Not Considered |
| Creditable On Accrual Basis | Yes |
| Creditable On Present Basis | No |
| Accrual Frequency | Monthly |
| Accrual Period | Start |
| Allowed under Probation | Yes |
| Allowed under Notice Period | No |
| Leave Encash Enabled | No |
| Carry Forward Enabled | No |

#### Sick Leave — Advanced Settings
| Section | Field | Value |
|---------|-------|-------|
| Leaves Count | Max. Leaves Allowed in a Month | 2.00 |
| Leaves Count | Continuous Leaves Allowed | 2 |
| Applicability | Negative Leaves Allowed | Yes |
| Miscellaneous | Future-dated Leaves Allowed | Yes |
| Miscellaneous | Future-dated Leaves Allowed After | 15 Days |
| Miscellaneous | Backdated Leaves Allowed | Yes |
| Miscellaneous | Backdated Leaves Allowed up to | 15 Days |
| Miscellaneous | Apply Leaves for Next Year Till | January |

---

#### Casual Leave — General Settings
| Field | Value |
|-------|-------|
| Name | Casual Leave |
| Description | This is a default description for the Leave Type. You can customise this. |
| Leave Short Name | -- |
| Leaves Allowed in a Year | 12.0 |
| Weekends Between Leave | Not Considered |
| Holidays Between Leave | Not Considered |
| Creditable On Accrual Basis | Yes |
| Creditable On Present Basis | No |
| Accrual Frequency | Monthly |
| Accrual Period | Start |
| Allowed under Probation | No |
| Allowed under Notice Period | No |
| Leave Encash Enabled | No |
| Carry Forward Enabled | No |

#### Casual Leave — Advanced Settings
| Section | Field | Value |
|---------|-------|-------|
| Leaves Count | Max. Leaves Allowed in a Month | 2.00 |
| Leaves Count | Continuous Leaves Allowed | 2 |
| Applicability | Negative Leaves Allowed | No |
| Miscellaneous | Future-dated Leaves Allowed | Yes |
| Miscellaneous | Future-dated Leaves Allowed After | 0 Days |
| Miscellaneous | Backdated Leaves Allowed | Yes |
| Miscellaneous | Backdated Leaves Allowed up to | 0 Days |
| Miscellaneous | Apply Leaves for Next Year Till | December |

---

## GAP C — Attendance: Advanced Rule Configuration

**Access path:** Admin → Attendance → Rules tab  
**URL:** `/rule_set/viewRules/?tab=0`  
**Page header:** "Normal Shift" (top badge — shift type indicator)  
**Sub-tabs:** `Attendance Rules` | `Assign Attendance Rules`

**Rules list:**
1. **General Shift** — 5 Employees — ✓ Company Default
2. **CEO** — 1 Employee

**Each rule card has:** Copy icon (duplicate rule) + rule name + employee count  
**Bottom of list:** `⊕ Create New Rule` button (with orange ✕ = premium gated)

---

### GAP C.1 — General Shift → General Rules

**Rule Name:** General Shift  
**Description:** This is a default description for the Attendance. You can customise this.  
**Status:** Company Default (green badge)  
**Actions available:** `✓ Company Default` | `✗ Remove`  
**Edit:** Pencil ✏ icon (top right of panel) — inline edit mode (no modal)

**Shift Timings:**
| Field | Value |
|-------|-------|
| In Time | 09:00 AM |
| Out Time | 06:00 PM |

**Enable Auto Deduction:** ✓ On (toggle)  
**Auto deduction date:** 31  
**Note:** "Auto deduction date will be the same as your attendance cycle end date"  
**Link:** "Click here to view the attendance cycle setting"

**Enable Anomaly Tracking:** ✓ On (toggle)

**Anomaly Settings (sub-fields under Anomaly Tracking):**
| Anomaly Type | Field | Value |
|--------------|-------|-------|
| ✅ In Time | In Time Grace Period | 10:00 |
| ✅ Out Time | Out Time Grace Period | 20:00 |
| ✅ Work Duration | Full Day | 08:00 |
| ✅ Work Duration | Half Day | 04:00 |
| ✅ Maximum Total Break Duration | — | 01:00 |
| ☐ Maximum No. of Breaks | — | (disabled / not set) |
| ✅ Auto clock-out | — | (enabled) |

**Checkboxes:** Each anomaly type has its own checkbox to enable/disable  
**Time inputs:** Each duration field has a clock 🕐 icon picker

---

### GAP C.2 — General Shift → Advanced Rules

| Setting | Value | Notes |
|---------|-------|-------|
| Enable Clock In/Out | **Mobile** (selected) | Device picker: Mobile / Web / Both |
| Enable Overtime | Off | — |
| Overtime Requires Approval | Off | — |
| Enable Attendance with Selfie | **On** | Has ▶ info button |
| Enable Comp Off | Off | Has ▶ info button |
| Enable Simple Punches | Off | — |
| Enable Penalty Rules | Off | Has ▶ info button |

**Edit mechanism:** Pencil ✏ icon → inline edit (CANCEL / SAVE buttons appear at bottom, no modal)

---

### GAP C.3 — General Shift → Edit Form (General Rules — Inline Edit)

**Editable fields (confirmed via DOM):**

| Field | Type | Input Element |
|-------|------|---------------|
| Rule Name | Text input | `<input type="text">` |
| Description | Textarea (resizable) | `<textarea>` |
| In Time | Time picker (clock icon) | `<input>` + clock widget |
| Out Time | Time picker | `<input>` + clock widget |
| Enable Auto Deduction | Toggle checkbox | `name="automatic_deduction_rules"` |
| Enable Anomaly Tracking | Toggle checkbox | `name="view_anomaly_tracking"` |
| In Time anomaly | Checkbox | `name="anomaly_checkbox"` |
| Out Time anomaly | Checkbox | `name="out_time_duration"` |
| Work Duration anomaly | Checkbox | `name="work_duration"` |
| In Time Grace Period | Time picker | Clock icon |
| Out Time Grace Period | Time picker | Clock icon |
| Full Day duration | Time picker | Clock icon |
| Half Day duration | Time picker | Clock icon |
| Maximum Total Break Duration | Checkbox + Time picker | Enabled checkbox |
| Maximum No. of Breaks | Checkbox (+ count input when enabled) | Disabled checkbox |
| Auto clock-out | Checkbox | Enabled |

**Save flow:** `CANCEL` | `SAVE` buttons at bottom (no page reload — AJAX save)

---

### GAP C.4 — CEO Rule → General Rules

**Rule Name:** CEO  
**Description:** This is a default description for the Attendance. You can customise this.  
**Status:** Not Company Default — shows `Set as Company Default` button instead  

**Shift Timings:**
| Field | Value |
|-------|-------|
| In Time | **09:30 AM** (30 min later than General Shift) |
| Out Time | **06:30 PM** (30 min later than General Shift) |

**Enable Auto Deduction:** **Off** (different from General Shift which is On)  
**Manual deduction date:** 31  
**Note:** "Manual deduction date has to be greater than your attendance cycle end date"  
**Link:** "Click here to manually run deduction"

**Enable Anomaly Tracking:** **Off** (different from General Shift which is On)  
*(No Anomaly Settings sub-section shown since Anomaly Tracking = Off)*

---

### GAP C.5 — CEO Rule → Advanced Rules

| Setting | Value | Notes |
|---------|-------|-------|
| Enable Clock In/Out | **Both** (selected) | Different from General Shift (Mobile) |
| Enable Overtime | Off | — |
| Overtime Requires Approval | Off | — |
| Enable Attendance with Selfie | **Off** | Different from General Shift (On) |
| Enable Comp Off | Off | — |
| Enable Simple Punches | Off | — |
| Enable Penalty Rules | N/A | Message: "Please enable Anomaly tracking first for Penalty Rules" |

**Note:** Penalty Rules is locked/hidden behind Anomaly Tracking requirement — since CEO has Anomaly Tracking Off, Penalty Rules cannot be configured for this rule set.

---

### GAP C.6 — Page-Level Notes

**Shift type selector** (top of page): `Normal Shift` badge — Kredily supports multiple shift types (Normal, Flexible, etc.) configured at the rule level  
**Assign Attendance Rules** tab: For assigning specific rules to specific employees/departments  
**Create New Rule** button: Orange ✕ icon = premium gated feature  

---

## GAP D — Leave Rules: Advanced Settings (Admin)

**Access path:** Admin → Leave → Rules → [Select leave type from left sidebar] → General Settings / Advanced Settings tabs  
**URL:** `https://skylinxglobal.kredily.com/leaves/viewLeaveRuleBase/?tab=0`  
**Edit mechanism:** Pencil icon (✏ `mode_edit`) at top-right of each tab panel — inline edit (no modal), CANCEL / SAVE at bottom  
**Leave types audited:** Sick Leave (5 Employees) · Casual Leave (2 Employees, orange ✕ = premium-gated)

---

### GAP D.1 — Sick Leave → General Settings (Read-Only)

| Field | Value |
|-------|-------|
| Name | Sick Leave |
| Description | This is a default description for the Leave Type. You can customise this. |
| Leave Short Name | -- (empty) |
| **Leaves Count** | |
| Leaves Allowed in a Year | 12.0 |
| Weekends Between Leave | Not Considered |
| Holidays Between Leave | Not Considered |
| **Accrual** | |
| Creditable On Accrual Basis | Yes |
| Creditable On Present Day Basis | No |
| Accrual Frequency | Monthly |
| Accrual Period | Start |
| **Applicability** | |
| Allowed under Probation | Yes |
| Allowed under Notice Period | No |
| **Leave Encash** | |
| Leave Encash Enabled | No |
| **Carry Forward** | |
| Carry Forward Enabled | No |

---

### GAP D.2 — Sick Leave → General Settings (Edit Form)

Triggered by pencil icon on General Settings tab. Fields become inline editable.

| Field | Control Type | Current Value | Options / Constraints |
|-------|-------------|---------------|----------------------|
| Name | text input | Sick Leave | free text |
| Description | text area | (default text) | free text |
| Leave Short Name | text input | (empty) | free text |
| Leaves Allowed in a Year | number input | 24.0* | numeric |
| Weekends Between Leave | checkbox pair | Not Considered | Count as Leave / Not Considered |
| Holidays Between Leave | checkbox pair | Not Considered | Count as Leave / Not Considered |
| Creditable On Accrual Basis | checkbox | ✓ Yes | toggle |
| Creditable On Present Day Basis | checkbox | ✗ No | toggle |
| Accrual Frequency | select dropdown | Monthly | Monthly, Quarterly, Half Yearly |
| Accrual Period | select dropdown | Start | Start, End |
| Accrual on Number of Present Days | select dropdown | 1 | 1–60 |
| Allowed under Probation | checkbox | ✓ Yes | toggle |
| Allowed under Notice Period | checkbox | ✗ No | toggle |
| Leave Encash Enabled | toggle | Off (No) | On/Off |
| Carry Forward Enabled | toggle | Off (No) | On/Off |

*Note: Earned Leave default is 24; Sick Leave is 12, but General Settings edit form re-uses the same Earned Leave form in the DOM — the displayed read-only value for Sick Leave is 12.0.

---

### GAP D.3 — Sick Leave → Advanced Settings (Read-Only)

| Section | Field | Value |
|---------|-------|-------|
| Leaves Count | Max. Leaves Allowed in a Month | 2.00 |
| Leaves Count | Continuous Leaves Allowed | 2 |
| Applicability | Negative Leaves Allowed | Yes |
| Applicability | Negative Leaves Count | 1 |
| Miscellaneous | Future-dated Leaves Allowed | Yes |
| Miscellaneous | Future-dated Leaves Allowed After | 15 Days |
| Miscellaneous | Backdated Leaves Allowed | Yes |
| Miscellaneous | Backdated Leaves Allowed up to | 15 Days |
| Miscellaneous | Apply Leaves for Next Year Till | January |

---

### GAP D.4 — Sick Leave → Advanced Settings (Edit Form)

Triggered by pencil icon on Advanced Settings tab. Inline form replaces values with controls.

| Section | Field | Control Type | Current Value | Options / Constraints |
|---------|-------|-------------|---------------|-----------------------|
| Leaves Count | Max. Leaves Allowed in a Month | select dropdown | 2 | 1–60 (integers) |
| Leaves Count | Continuous Leaves Allowed | select dropdown | 02 | 01–60 |
| Applicability | Negative Leaves Allowed | checkbox | ✓ checked | toggle |
| Applicability | Negative Leaves Count | select dropdown | 01 | 01–60 (appears only when Negative Leaves Allowed = checked) |
| Miscellaneous | Future-dated Leaves Allowed | checkbox | ✓ checked | toggle |
| Miscellaneous | Future-dated Leaves Allowed After | numeric select + unit | 15 Days | numeric 00–60, unit = Days |
| Miscellaneous | Backdated Leaves Allowed | checkbox | ✓ checked | toggle |
| Miscellaneous | Backdated Leaves Allowed up to | numeric select + unit | 15 Days | numeric 00–60, unit = Days |
| Miscellaneous | Apply Leaves for Next Year Till | select dropdown | January | January, February, March, April, May, June, July, August, September, October, November, December |

**Bottom bar:** `✕ CANCEL` (white) · `✓ SAVE` (blue) — no save attempted during audit.

---

### GAP D.5 — Casual Leave → General Settings (Read-Only)

| Field | Value |
|-------|-------|
| Name | Casual Leave |
| Description | This is a default description for the Leave Type. You can customise this. |
| Leave Short Name | -- (empty) |
| **Leaves Count** | |
| Leaves Allowed in a Year | 12.0 |
| Weekends Between Leave | Not Considered |
| Holidays Between Leave | Not Considered |
| **Accrual** | |
| Creditable On Accrual Basis | Yes |
| Creditable On Present Day Basis | No |
| Accrual Frequency | Monthly |
| Accrual Period | Start |
| **Applicability** | |
| Allowed under Probation | **No** ← differs from Sick Leave |
| Allowed under Notice Period | No |
| **Leave Encash** | |
| Leave Encash Enabled | No |
| **Carry Forward** | |
| Carry Forward Enabled | No |

---

### GAP D.6 — Casual Leave → Advanced Settings (Read-Only)

| Section | Field | Value | Δ vs Sick Leave |
|---------|-------|-------|-----------------|
| Leaves Count | Max. Leaves Allowed in a Month | 2.00 | same |
| Leaves Count | Continuous Leaves Allowed | 2 | same |
| Applicability | Negative Leaves Allowed | **No** | ← Sick Leave = Yes |
| Applicability | Negative Leaves Count | (hidden — N/A) | ← Sick Leave shows 1 |
| Miscellaneous | Future-dated Leaves Allowed | Yes | same |
| Miscellaneous | Future-dated Leaves Allowed After | **0 Days** | ← Sick Leave = 15 Days |
| Miscellaneous | Backdated Leaves Allowed | Yes | same |
| Miscellaneous | Backdated Leaves Allowed up to | **0 Days** | ← Sick Leave = 15 Days |
| Miscellaneous | Apply Leaves for Next Year Till | **December** | ← Sick Leave = January |

---

### GAP D.7 — Casual Leave → Advanced Settings (Edit Form)

Triggered by pencil icon on Advanced Settings tab.

| Section | Field | Control Type | Current Value | Options / Constraints |
|---------|-------|-------------|---------------|-----------------------|
| Leaves Count | Max. Leaves Allowed in a Month | select dropdown | 2 | 0.5, 1, 1.5 … up to 60 (0.5 steps) |
| Leaves Count | Continuous Leaves Allowed | select dropdown | 02 | 01–60 |
| Applicability | Negative Leaves Allowed | checkbox | ✗ unchecked | toggle — when unchecked, Negative Leaves Count field is hidden |
| Miscellaneous | Future-dated Leaves Allowed | checkbox | ✓ checked | toggle |
| Miscellaneous | Future-dated Leaves Allowed After | numeric select + unit | 00 Days | numeric 00–60, unit = Days |
| Miscellaneous | Backdated Leaves Allowed | checkbox | ✓ checked | toggle |
| Miscellaneous | Backdated Leaves Allowed up to | numeric select + unit | 00 Days | numeric 00–60, unit = Days |
| Miscellaneous | Apply Leaves for Next Year Till | select dropdown | December | January–December |

**Bottom bar:** `✕ CANCEL` (white) · `✓ SAVE` (blue) — no save attempted during audit.

---

### GAP D.8 — Leave Rule Sidebar: Full Type List (Admin View)

All leave types visible in left sidebar at `viewLeaveRuleBase/?tab=0`:

| # | Leave Type | Employees Assigned | Premium-Gated (✕) |
|---|------------|-------------------|-------------------|
| 1 | Earned Leave | 0 | No |
| 2 | Loss Of Pay | 6 | No |
| 3 | Casual Leave | 2 | Yes (orange ✕) |
| 4 | Work From Home | 1 | Yes |
| 5 | Sick Leave | 5 | Yes |
| 6 | Maternity Leave | 0 | Yes |
| 7 | Paternity Leave | 1 | Yes |
| 8 | ON Duty Leave | 1 | Yes |
| 9 | Event Leave | 0 | Yes |
| 10 | Comp Off | 0 | Yes |
| 11 | Leave Type 1 | 0 | Yes |

**Bottom of sidebar:** `+ Create New Rule` button (orange ✕ = premium-gated)  
**Assign Leave Rules tab:** secondary tab next to Leave Rules (content not expanded in this audit)

---

## GAP E — Employee Attendance Logs: Regularization Flow & Penalty Logs

**Access path:** Admin toggle → User mode → Attendance (sidebar) → Logs tab  
**Employee (User mode):** Mohhmad Aseempasha (hr@skylinxglobal.com)  
**URLs:**
- Attendance log (Daily): `https://skylinxglobal.kredily.com/viewEmployeeAttendanceLog/?tab=1`
- Attendance log (Monthly): `https://skylinxglobal.kredily.com/viewEmployeeAttendanceLog/?tab=2`
- Penalty Logs: `https://skylinxglobal.kredily.com/attendanceLog/employeePenaltyLog/?tab=0`

---

### GAP E.1 — Employee Attendance Page: Top-Level Structure

**Page title:** "Attendance"  
**Top-level tabs (User mode):**

| Tab | Premium-gated? | Notes |
|-----|----------------|-------|
| Logs | No | Default tab; contains Daily Log + Monthly Log sub-tabs |
| Automation Logs | Yes (orange ✕) | Contains Penalty Logs sub-tab |
| Rules | No | Read-only view of rules assigned to employee |

**Note:** No "Approvals" tab visible in User mode (Approvals is Admin-only).

**Page header note:**  
"Outstanding Anomalies (Current Month): **2**" — displayed as a blue hyperlink below page title, links to Monthly Log filtered to anomaly rows.

---

### GAP E.2 — Daily Log Sub-tab

**URL:** `/viewEmployeeAttendanceLog/?tab=1`  
**Sub-tabs inside Logs:** `Daily Log` | `Monthly Log`

**Daily Log page elements:**

| Element | Detail |
|---------|--------|
| Employee name | Displayed at top: "Mohhmad Asee..." (truncated) |
| Date navigation | `< [Previous]` · current date display · `[Next] >` arrow buttons |
| Timeline chart | Horizontal bar from 9 AM to 9 PM; color-coded segments |
| Anomalies section | Lists anomaly events for the selected date (type + timestamp) |
| Summary table | 3 columns: Work Duration · Break Duration · Overtime Duration |

**Timeline chart legend:**
| Color | Meaning |
|-------|---------|
| Blue | No Anomalies (normal clock-in/out) |
| Red | Clock-in / Clock-out IP Mismatch |
| Orange | Auto Logged Out |

---

### GAP E.3 — Monthly Log Sub-tab

**URL:** `/viewEmployeeAttendanceLog/?tab=2`

**Page controls (top bar):**

| Control | Type | Notes |
|---------|------|-------|
| Reset Filter | Button (white) | Clears all active filters |
| BULK APPROVAL | Button (blue) | Multi-select regularization — requires checkboxes |
| Export | Button | Downloads monthly log as file |
| Date range picker | From date → To date (date inputs) | Filters by date range |
| Show | Dropdown (20 default) | Records per page |

**Table columns:**

| # | Column | Notes |
|---|--------|-------|
| 1 | ☐ | Checkbox (for bulk selection) |
| 2 | Date | e.g., "01 Jun 2026" |
| 3 | Status | Code badge: P / AN / WO / A (see below) |
| 4 | In Time | Clock-in timestamp or `--` |
| 5 | Out Time | Clock-out timestamp or `--` |
| 6 | Work Duration | HH:MM; shown in **red** when anomaly/penalty applies |
| 7 | Overtime Duration | HH:MM or `--` |
| 8 | Break Duration | HH:MM or `--` |
| 9 | Breaks | Count or `--` |
| 10 | Action | "GET APPROVAL" button (blue) — appears only for AN rows |

**Status codes observed:**

| Code | Meaning |
|------|---------|
| P | Present |
| AN | Anomaly (triggers GET APPROVAL button) |
| WO | Week Off |
| A | Absent |

**Work Duration — red indicator:**  
When a row has AN status, Work Duration cell shows the duration in **red** (e.g., `07:59`). This indicates the actual worked time that fell short of the configured threshold and is subject to penalty deduction.

---

### GAP E.4 — GET APPROVAL Button → Request Approval Modal (Regularization)

**Button label:** "GET APPROVAL" (appears in Action column for AN rows only)  
**What it opens:** "Request Approval" modal (regularization flow)

**Modal header:**
- Title: `Request Approval`
- Date displayed top-right: e.g., `June 12, 2026` (the anomaly date)

**Fixed fields (always shown):**

| Field | Value (example) |
|-------|-----------------|
| Anomaly Type | `Auto Clocked Out, Total Duration` (read-only label — shows actual anomaly reason) |

**Regularization options (4 radio buttons):**

| # | Option | Default? |
|---|--------|----------|
| 1 | Mark as Present | ✓ (default selected) |
| 2 | Mark as Leave | ○ |
| 3 | Mark Exact Time | ○ |
| 4 | Mark as LOP | ○ |

**Bottom buttons (always present):** `CANCEL` (white) · `SEND` (blue)  
**Safety note:** Modal was opened and all options were documented — **NOT submitted.**

---

### GAP E.5 — Regularization Option 1: Mark as Present

**Selection:** `⬤ Mark as Present`

**Extra fields revealed:** None  
**Visible form state:** Anomaly Type label + 4 radio options + CANCEL + SEND  
**Behaviour on SEND:** Submits regularization request to manager for approval; marks the day as Present pending manager action.

---

### GAP E.6 — Regularization Option 2: Mark as Leave

**Selection:** `○ Mark as Leave`  
**Effect:** Opens nested **"Apply for Leave"** form within the modal.

**Apply for Leave sub-form fields:**

| Field | Type | Options |
|-------|------|---------|
| Leave Type | Dropdown | Loss of Pay · Comp Off · Sick Leave · Casual Leave |
| Start Date | Date picker | Pre-filled with anomaly date |
| Select Half (Start) | Dropdown | First Half · Second Half |
| End Date | Date picker | Initially empty |
| Select Half (End) | Dropdown | First Half · Second Half |
| Write your Reason | Textarea (resizable) | Free text |

**Sub-form buttons:** `CANCEL` · `APPLY` (blue)  
**Default Leave Type:** Loss of Pay

---

### GAP E.7 — Regularization Option 3: Mark Exact Time

**Selection:** `○ Mark Exact Time`  
**Effect:** Reveals Time In + Time Out pickers + reason field within the same modal.

**Additional fields revealed:**

| Field | Type | Sub-components |
|-------|------|---------------|
| Time In | Time picker | Hour dropdown (01–12) · Minute dropdown (00–59) · AM/PM dropdown |
| Time Out | Time picker | Hour dropdown (01–12) · Minute dropdown (00–59) · AM/PM dropdown |
| Write Your Reason | Textarea (resizable) | Free text |

**Buttons:** `CANCEL` · `SEND` (blue)  
**Behaviour on SEND:** Submits exact clock-in/clock-out times for the anomaly day; manager reviews and approves.

---

### GAP E.8 — Regularization Option 4: Mark as LOP

**Selection:** `○ Mark as LOP`  
**Effect:** Opens same nested **"Apply for Leave"** modal as "Mark as Leave" (GAP E.6), but with **Loss of Pay pre-selected** in Leave Type dropdown — field is not locked; employee can change it.

**Fields:** Identical to GAP E.6 (Apply for Leave sub-form)  
**Buttons:** `CANCEL` · `APPLY` (blue)

---

### GAP E.9 — Penalty Logs Page (Employee View)

**Navigation path:** Attendance → Automation Logs tab (✕ premium) → `Penalty Logs` (blue active sub-tab)  
**URL:** `https://skylinxglobal.kredily.com/attendanceLog/employeePenaltyLog/?tab=0`  
**Page section heading:** "Penalty Logs" (blue active-state button)  
**Note:** URL is `/employeePenaltyLog/` — NOT `/viewPenaltyLog/` or `/viewEmployeePenaltyLog/` (both 404).

**Page controls:**

| Control | Detail |
|---------|--------|
| Search | Text input with search icon (🔍) |
| Record count badge | Shows "0" (blue badge, current total) |
| Show | Dropdown (default 20 per page) |
| Pagination | `< PREVIOUS` · `NEXT >` (grayed out when no data) |

**Table columns:**

| # | Column | Has Filter (▼)? |
|---|--------|-----------------|
| 1 | Anomaly Type | Yes |
| 2 | Penalty Type | Yes |
| 3 | Leave Type | Yes |
| 4 | Deduction | No |
| 5 | Month | Yes |
| 6 | Applied On | Yes |
| 7 | Action | No |

**Current data state:** "No data available in table" — 0 penalty records logged for Mohhmad Aseempasha at time of audit (anomaly exists but penalty has not been applied/processed yet).

**Interpretation:** Anomalies appear in Monthly Log (AN status), but become Penalty Log entries only after the admin runs the auto-deduction process (configured under Attendance Rules → Enable Auto Deduction → auto deduction date = 31).

---

### GAP E.10 — Admin Mode: Return Confirmation

After completing Penalty Logs documentation, toggled back to Admin mode via top-right toggle.  
**Confirmed:** Toggle shows "Admin" (red) — page reloaded to Admin Attendance view.  
**Admin Attendance → Automation Logs → Penalty Logs** view is separate from the employee self-service view (different URL: admin side shows all employees' penalty records, not just the logged-in user's).

---

