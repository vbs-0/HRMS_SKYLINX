# UI/UX Screen Layouts, Windows & User Interactions

This document defines the comprehensive screen-by-screen layout, window structures, dimensions, scrollbar specs, colors, inputs, validation rules, and every dropdown option list required for the **SKYLINX PeopleOS Next.js Web Frontend** ([apps/web/app](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/apps/web/app)).

> [!IMPORTANT]
> **Design Directive**: All page structures, main dashboard tabs, navigation menus, and home buttons must align with and preserve the existing Next.js UI shell in our codebase. We will prioritize the design of our active frontend because it is more feasible, stable, and visually polished than the reference's hybrid Vue layout. Reference UI details are used solely to specify missing fields, validations, and custom modal inputs.

---

## 1. Page Layout & Grid Dimensions

To maintain visual consistency across all viewports, the application conforms to a strict grid and layout sizing specification:

```
+-------------------------------------------------------------------+
|                           Top Navigation Bar (Height: 64px)       |
+------------------+------------------------------------------------+
|                  |                                                |
|  Sidebar Navigation|  Main Content Container (Max-Width: 1440px)    |
|  (Width: 260px)  |  Padding: 24px Desktop / 16px Mobile           |
|                  |                                                |
|                  |  +------------------------------------------+  |
|                  |  |  Content Grid Card                       |  |
|                  |  |  (Border Radius: 12px, Padding: 20px)    |  |
|                  |  +------------------------------------------+  |
|                  |                                                |
+------------------+------------------------------------------------+
```

### Layout Breakpoints & Sizes
* **Desktop View (>= 1024px)**:
  * **Sidebar Width**: Fixed `260px` with a CSS border separator (`1px solid rgba(255,255,255,0.08)` on dark mode).
  * **Top Header Height**: Fixed `64px`. Includes company logo, global search input, notification bell, and user avatar.
  * **Content Container**: Max-width capped at `1440px`, centered horizontally, with `24px` padding.
* **Tablet View (768px to 1023px)**:
  * **Sidebar Width**: Collapses to icon-only view (`72px` width). Hovering over an icon expands a tooltip.
  * **Content Container**: `20px` padding.
* **Mobile View (< 768px)**:
  * **Sidebar Width**: Hidden (`0px` width). Slides out as a full-height overlay drawer from the left when the burger menu icon in the header is tapped, or when a right-swipe gesture is detected at the screen edge.
  * **Content Container**: `16px` padding.
* **Modal Windows**:
  * **Standard Dialog Modal**: Centered overlay. Fixed width `600px` (desktop), full-width with `16px` margins (mobile).
  * **Large Wizard Modal** (e.g. Payroll Run): Fixed width `800px` (desktop).
  * **Detail Slide-over Drawer** (e.g. Candidate Profile, Tax Exemption Proof): Height `100vh`, fixed width `450px` (desktop) and `100vw` (mobile) sliding from the right.

---

## 2. Scrollbars, Scrolling & Backdrop Filters

* **Root Scroll**: `scroll-behavior: smooth` is active globally.
* **Scrollbar Design Tokens**:
  * Track background: `transparent`.
  * Thumb width: `6px`.
  * Thumb border-radius: `3px`.
  * Thumb color: `rgba(146, 148, 156, 0.3)` (Medium Gray tint) on idle, darkening to `rgba(128, 130, 137, 0.6)` on hover.
* **Modal Backdrop Overlay**:
  * Background: `rgba(15, 23, 42, 0.7)` (Slate-900 with 70% opacity).
  * Backdrop Blur: `backdrop-filter: blur(8px)`.

---

## 3. Dropdowns & Form Inputs Specification

Below is the complete registry of form layouts, input validations, and dropdown option values:

### A. Leave Request Form (Modal: 600px)
* **Visual Fields Layout**: 2-Column Grid on desktop, 1-Column on mobile.
* **Input Fields & Dropdown Options**:
  1. **Leave Type** (Dropdown Select):
     * *Values*: `Casual Leave`, `Sick Leave`, `Earned Leave`, `Compensatory Off (Comp-Off)`, `Maternity Leave`, `Paternity Leave`, `Leave Without Pay`.
     * *Validation*: Mandatory.
  2. **From Date** (DatePicker Calendar):
     * *Validation*: Mandatory. Cannot be prior to today unless regularization request is selected.
  3. **To Date** (DatePicker Calendar):
     * *Validation*: Mandatory. Must be equal to or greater than `From Date`.
  4. **Half Day** (Toggle Switch):
     * *Interaction*: Toggling to `true` expands the **Half Day Date** and **Half Day Period** selectors.
  5. **Half Day Period** (Segmented Control Button Group):
     * *Options*: `First Half` | `Second Half`.
  6. **Leave Reason** (TextArea):
     * *Validation*: Max 500 characters. Character counter shown in the bottom right corner of the field.
  7. **Leave Approver** (Dropdown Searchable Select):
     * *Values*: Fetched via `get_leave_approval_details` (list of active managers in the department).

---

### B. Expense Claim Form (Slide-over Drawer: 450px)
* **Visual Fields Layout**: Vertical stack with receipt upload area at the bottom.
* **Input Fields & Dropdown Options**:
  1. **Category** (Dropdown Select):
     * *Values*: `Business Travel`, `Food & Meals`, `Lodging & Hotel`, `Telephone & Internet`, `Medical Expenses`, `IT Hardware / Software`, `Others`.
  2. **Amount** (Number Input with prefix currency symbol):
     * *Validation*: Mandatory. Positive numbers only. Precision limit of 2 decimal places.
  3. **Currency** (Dropdown Select):
     * *Values*: `INR` (Default) | `USD` | `EUR`.
  4. **Cost Center** (Dropdown Searchable Select):
     * *Values*: Department codes (e.g. `DEPT-ENG`, `DEPT-HR`) or Client Projects list.
  5. **Claim Date** (DatePicker Calendar):
     * *Validation*: Defaults to today's date. Max date is today.
  6. **Description** (TextArea):
     * *Validation*: Max 300 characters.
  7. **Receipt Drag-and-Drop Uploader** (File container size: `100%` width, `120px` height):
     * *Accepted Formats*: `.pdf`, `.jpg`, `.jpeg`, `.png`. Max size: `5MB`.

---

### C. Job Vacancy Form (Large Modal: 800px)
* **Visual Fields Layout**: 2-Column Grid with full-width Rich Text Editor for description.
* **Input Fields & Dropdown Options**:
  1. **Job Title** (TextInput):
     * *Validation*: Mandatory. Max 100 characters.
  2. **Department** (Dropdown Select):
     * *Values*: Active departments list (e.g. Engineering, Product, Marketing, Sales).
  3. **Location** (Dropdown Select):
     * *Values*: Registered office locations (e.g. Mumbai, Bangalore, Remote).
  4. **Employment Type** (Dropdown Select):
     * *Values*: `Full-Time` | `Part-Time` | `Contract` | `Internship`.
  5. **Number of Openings** (Number Input):
     * *Validation*: Mandatory. Minimum value `1`.
  6. **Experience Requirement** (Dropdown Select):
     * *Values*: `0-1 Years (Entry)` | `1-3 Years (Junior)` | `3-5 Years (Mid)` | `5-8 Years (Senior)` | `8+ Years (Lead/Director)`.
  7. **Job Description** (Rich Text Area): HTML formatting enabled.

---

### D. Interview Scheduler Form (Modal: 600px)
* **Input Fields & Dropdown Options**:
  1. **Candidate** (TextInput): Read-only text showing the applicant's name.
  2. **Interview Stage** (Dropdown Select):
     * *Values*: `Screening Round` | `Technical Interview 1` | `Technical Interview 2` | `Management Round` | `HR Fitment`.
  3. **Interviewer** (Dropdown Searchable Multi-Select):
     * *Values*: List of active employees.
  4. **Scheduled Date & Time** (DateTimePicker):
     * *Validation*: Must be a future date and time.
  5. **Mode** (Dropdown Select):
     * *Values*: `Online - Zoom` | `Online - MS Teams` | `In-Person (Office)` | `Telephone Call`.
  6. **Meeting Link / Conference Room** (TextInput):
     * *Validation*: If Mode is Online, requires URL format. If In-Person, requires room selection.

---

### E. Indian Tax Declaration Form (Accordion List)
* **Regime Switcher**: Horizontal slider button toggling `Old Regime` vs `New Regime`.
* **Exemption Input Grid (Old Regime Only)**:
  1. **Section 80C** (Max Total: ₹1,50,000):
     * *PPF*, *ELSS Mutual Funds*, *Life Insurance Premium*, *Tuition Fees*, *Home Loan Principal Repayment*.
     * *Validations*: Numeric inputs. Each input has a secondary **"Paperclip Upload Icon"** showing document attachment status.
  2. **Section 80D (Health Insurance)** (Max: ₹25,000 / ₹50,000):
     * *Self, Spouse & Children Premium* (Max ₹25k).
     * *Senior Citizen Parents Premium* (Max ₹50k).
  3. **House Rent Allowance (HRA)**:
     * *Monthly Rent Paid* (Numeric Input).
     * *Landlord PAN* (TextInput).
       * *Regex Validation*: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` (Enforces statutory Indian PAN card format: 5 letters, 4 numbers, 1 letter).
     * *Rent Receipts Uploader* (File dropzone).
  4. **Section 24 (Housing Loan Interest)** (Max: ₹2,00,000):
     * *Interest Paid on Home Loan* (Numeric Input).

---

## 4. UI Layout Gesture & Interaction Specifications

### A. Drag-and-Drop Shift Assign Grid
* **Visual States**:
  * **Card Dragging**: The dragged shift block tilts **2 degrees** (`transform: rotate(2deg)`), shrinks slightly to `95%` scale, and applies an opacity of `0.85` with a shadow blur.
  * **Cell Target Hover**: The active date/employee cell highlights with a green dashed border (`border: 2px dashed #2dd36f`) and triggers a subtle pulse animation.

### B. Swipe Actions (Mobile viewports)
* **Swipe Thresholds**:
  * Swiping an application row left beyond `70px` triggers a red container slide-out exposing the **"Reject" Trash Button**.
  * Swiping right beyond `70px` triggers a green container exposing the **"Approve" Checkmark Button**.
  * *Resistance*: Swiping past 50% screen width automatically snaps the action to complete. Releasing before 30% snaps the card back to center.
