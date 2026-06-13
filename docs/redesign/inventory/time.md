# Time Inventory — Attendance, Holidays, Leave

> Sources read end-to-end: `apps/api/src/modules/attendance/*` (controller 159 ln, service 949 ln, DTOs),
> `apps/api/src/modules/holidays/*`, `apps/api/src/modules/leave/*` (controller 222 ln, service 1155 ln, DTOs),
> `apps/web/components/attendance-console.tsx`, `leave-console.tsx`, `leave-settings-console.tsx`, `holiday-console.tsx`,
> plus their delegates `roster-console.tsx`, `live-tables.tsx` (AttendanceTable / RegularizationsTable / PenaltyLogsTable / LeaveTable / HolidaysTable / LeaveEncashmentTable), `action-panels.tsx` (AttendanceActionPanel / LeaveApplyPanel), `reference-workspaces.tsx`, `leave-policy-panel.tsx`, and `packages/database/prisma/schema.prisma`.
> Date: 2026-06-12.

## Cross-cutting facts a redesign must respect

1. **Permission model**: every endpoint is gated with `@RequirePermissions("<module>.<verb>")` (`read|create|update|approve|configure`). The web side mirrors this in `apps/web/lib/permission-map.json`.
2. **Tenancy is partial.** Prisma middleware (`apps/api/src/prisma/prisma.service.ts:6-13`) auto-scopes only: `Shift, LeaveType, Holiday, PenaltyLog, ClientRule, LeavePolicy, LeaveBlockList, Employee, ...`. **NOT auto-scoped**: `AttendanceLog, AttendanceRegularization, OvertimeRequest, ShiftAssignment, ShiftRequest, AttendanceAnomaly, LeaveRequest, LeaveBalance, LeaveLedgerEntry, LeaveEncashment, CompOffConversion, LeavePolicyAssignment, LeaveBlockListDate`. List endpoints on those models (`GET /attendance/logs`, `GET /leave/requests`, `GET /leave/balances`, etc.) do bare `findMany` with **no companyId filter** (e.g. `attendance.service.ts:18-29`, `leave.service.ts:377-386`) — they are only transitively scoped and can leak cross-tenant rows in a true multi-tenant DB.
3. **Config lives in two places**: typed columns on `LeaveType` / `Shift`, plus a JSON side-channel in `ClientRule` (`category="leave_type_settings"`, key = leaveTypeId) and settings-service rules (`attendance.workWeek/shiftStart/shiftEnd/graceMinutes/halfDayMinutes/geoAttendance/geofenceRadiusMeters/penaltyMapping`, `leave.leaveYear`). The Prisma `AttendanceRule` model (schema.prisma:385) exists but is **never read by the attendance service** — dead model.
4. **Role-forked UI**: `leave-console.tsx:130` renders a completely different console for `role === "admin"` (tabs: Leave Rules Policy / Leave Approvals / Leave Policies / Block Lists) vs everyone else (Dashboard / Team Calendar / Leave Requests / Leave Balance / Leave Rules / Leave Encashment / Comp-Off Conversion).

---

# Module: Attendance (`/attendance`)

## 1. Check-in / Check-out (with geofencing)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Check in | `POST /attendance/check-in` | `attendance.create` |
| Check out | `POST /attendance/check-out` | `attendance.create` |

**Behaviour** (`attendance.service.ts:53-179`):
- `checkIn` defaults timestamp to now; shift = `shiftId` param or first ACTIVE shift (400 if none).
- **Geofence**: enforced only when settings rule `geoAttendance` is true **and** the shift has `ShiftLocation` rows. Then GPS coords are mandatory (400 otherwise); Haversine distance vs each linked Location; radius = settings `geofenceRadiusMeters` (default 200 m); outside → 400 "outside the authorized geofenced location" (`attendance.service.ts:76-116`).
- Late calc: `checkInAt > shift.startTime (fallback rule shiftStart "09:30") + graceMinutes (shift.graceMinutes ?? rule 10)` → status `LATE` else `PRESENT` (`:646-651`).
- Upsert on `(employeeId, date)` — re-check-in silently overwrites the earlier punch. `source: "WEB"`.
- `checkOut` requires today's log (404 otherwise); stores checkout coords/accuracy but **does not geofence-validate checkout**.

**UI**:
- `GeoCheckInPanel` (attendance-console.tsx:124-292, Dashboard tab): employee dropdown, "Get GPS" (browser `navigator.geolocation`, high accuracy), Check In / Check Out buttons, coordinate + accuracy readout. Coords are optional — if the user never clicks Get GPS the request goes without coordinates (fails only when geofencing is active for the shift).
- `AttendanceActionPanel` (action-panels.tsx:663-708, also Dashboard tab): second, redundant check-in/out widget that posts hardcoded `shiftId: "shift_general"` — **breaks (400) unless a seeded shift literally has that id**; sends no GPS.

**Gaps/quirks**: two overlapping check-in widgets on one tab; checkout never validated against geofence; re-check-in overwrites instead of erroring; no "my own punch" concept — any employee in the dropdown can be punched by whoever can see the page (server does not check requester == employee).

## 2. Attendance logs & dashboard

| Endpoint | Method/Path | Permission |
|---|---|---|
| List logs | `GET /attendance/logs` | `attendance.read` |

Returns ALL logs (employee, shift, regularizations, overtimeRequests included), ordered date desc — no pagination, no date filter server-side (`attendance.service.ts:18-29`).

**UI**: "Attendance Log" tab renders `AttendanceTable` (live-tables.tsx:992-1047) with client-side search / status / month filters. Header stat tiles (Present/Absent/Late, attendance-console.tsx:28-43) count over the **entire history**, yet are labelled "Active roster today" — misleading. Header actions "Month View", "Export", "Rules" (attendance-console.tsx:60-64) have **no onClick — purely decorative**. `AttendanceRulesWorkspace` (reference-workspaces.tsx:57-98) on the Dashboard tab is a **hardcoded static display** ("09:30 AM to 06:30 PM", "After 09:45 AM") not bound to real settings — fake UI.

## 3. Shifts & roster

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List shifts | `GET /attendance/shifts` | `attendance.read` | RosterConsole "Standard Shift Definitions" (read-only cards) |
| Assign shift | `POST /attendance/shifts/assign` | `attendance.update` | RosterConsole "Assign Roster Shift" form (employee, shift, date) |
| Bulk assign | `POST /attendance/shifts/bulk-assign` | `attendance.update` | RosterConsole "Bulk Assign Shifts" (checkbox employee list, shift, start/end date) |
| Request shift change | `POST /attendance/shifts/requests` | `attendance.create` | **NONE — API-only** (no form anywhere creates a shift request) |
| List shift requests | `GET /attendance/shifts/requests` | `attendance.read` | RosterConsole "Shift Roster Requests" table |
| Decide shift request | `PATCH /attendance/shifts/requests/:id/decide` | `attendance.approve` | Approve/Reject icon buttons (sends `{status: APPROVED|REJECTED}`); approval upserts a ShiftAssignment |
| List assignments | `GET /attendance/shifts/assignments` | `attendance.read` | RosterConsole "Active Roster Assignments" table |

**Major gap: there is NO shift CRUD at all** — no `POST/PATCH/DELETE /attendance/shifts` endpoint and no UI; shifts (name, startTime, endTime, graceMinutes, halfDayMinutes, linked ShiftLocations) can only come from seed/DB. Bulk assign loops day-by-day upserts (N employees × M days writes, `attendance.service.ts:442-476`). ShiftAssignment is unique on `(employeeId, date)` — one shift per day.

## 4. Auto attendance processing

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Process day | `POST /attendance/shifts/process-auto` (body `{date}`) | `attendance.update` | RosterConsole "Auto Attendance Process" (date + Run button) |

For every ACTIVE employee (`attendance.service.ts:559-638`): no log → creates log with status `HOLIDAY` (company/location holiday on that date, locationId null = all locations), `WEEK_OFF` (Sunday always; Saturday too when workWeek = "Monday to Friday"), else `ABSENT`; source `AUTO_PROCESS`. Existing PRESENT logs get re-graded to LATE if applicable. Manual trigger only — **no cron/scheduler**.

## 5. Regularization

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List | `GET /attendance/regularizations` | `attendance.read` | "Regularization" tab → `RegularizationsTable` |
| Create | `POST /attendance/regularize` | `attendance.create` | **NONE — API-only.** Employees cannot file a regularization from any console |
| Decide | `PATCH /attendance/regularize/:id` (body `{action: approve\|reject, decidedByUserId}`) | `attendance.approve` | **BROKEN** — see below |

**Bug**: `RegularizationsTable` (live-tables.tsx:1064-1071) calls `PATCH /attendance/regularizations/${id}/approve`, but the API route is `PATCH /attendance/regularize/:id` (attendance.controller.ts:50). **The UI Approve button 404s.** There is also no Reject button in the UI at all.

**Approve** (`attendance.service.ts:223-293`): creates/updates the attendance log to PRESENT with the requested times (upserts a log if the request had none).
**Reject** (`:295-358`): marks REJECTED **and immediately creates a `PenaltyLog` with status `CONVERTED_LOP`** — anomaly type inferred from the log status (ABSENT→ABSENT/FULL_DAY/1.0 day; HALF_DAY→OUT_TIME; no log→MISSED_PUNCH; else LATE; non-ABSENT = HALF_DAY/0.5 day). i.e. rejecting a regularization auto-docks pay with no separate confirmation step.

## 6. Overtime

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Create OT | `POST /attendance/overtime` (`{employeeId, attendanceLogId, hours>=0.5, reason}`) | `attendance.update` | **NONE — API-only** |

Created with status **auto-`APPROVED`** (`attendance.service.ts:392-411`) — the ApprovalStatus field exists but there is no pending/decide flow. No list endpoint either (OT rows only surface nested inside `GET /attendance/logs`). This matters because the Comp-Off UI (below) demands a raw `overtimeRequestId` string the user has no way to look up.

## 7. Bulk upload (CSV)

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Upload | `POST /attendance/bulk-upload` (multipart `file`) | `attendance.create` | "Bulk Upload" tab (`BulkAttendanceUploadPanel`, attendance-console.tsx:295-371) |

CSV columns `employeeId,date,checkInAt,checkOutAt,status` (tolerates `EmployeeId`, `"Employee ID"`, `Check In`, etc.); invalid rows are silently skipped; upserts with source `BULK_UPLOAD` and stamps **all rows with the first ACTIVE shift** regardless of the employee's roster (`attendance.service.ts:665-734`). UI uses raw `fetch` with manual `Authorization` + `x-tenant-id` headers (bypasses the shared `apiFetch`); copy says "CSV or Excel" but the input accepts `.csv` only; the `status` column is cast unvalidated into the `AttendanceStatus` enum (bad value = Prisma runtime error).

## 8. Penalty logs (Loss of Pay ledger) + bulk revert

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List | `GET /attendance/penalty-logs?month&year&anomalyType` | `attendance.read` | "Penalty Logs" tab → `PenaltyLogsTable` (live-tables.tsx:1351-1473) |
| Bulk revert | `POST /attendance/penalty-logs/bulk-revert` (`{ids[]}`) | `attendance.approve` | Checkbox column + "Revert Selected" button |

Revert sets `status=REVERTED`, `revertedBy=<jwt sub>`, skips already-reverted (`attendance.service.ts:376-390`). UI passes month/year from the header month picker; the `anomalyType` filter exists in the API but is **not exposed in the UI**. Note: nothing downstream consumes `PenaltyLog` rows for payroll math yet — they are a ledger; "revert" only flips a status flag (no compensating ledger/payroll entry).

## 9. Anomaly engine — evaluate / decide / auto-clock-out / convert-LOP (**entirely API-only, zero UI**)

| Endpoint | Method/Path | Permission |
|---|---|---|
| Evaluate day | `POST /attendance/anomalies/evaluate` (`{date}`) | `attendance.configure` |
| List anomalies | `GET /attendance/anomalies` | `attendance.read` |
| Decide anomaly | `PATCH /attendance/anomalies/:id/decide` (`{status: APPROVED\|OVERRIDDEN, decidedByUserId}`) | `attendance.approve` |
| Auto clock-out | `POST /attendance/auto-clock-out` (`{date}`) | `attendance.configure` |
| Month-end LOP conversion | `POST /attendance/anomalies/convert-lop` (`{month, year}`) | `attendance.configure` |

Logic (`attendance.service.ts:740-948`):
- **Evaluate**: only logs with BOTH punches; flags `LATE` (check-in > start+grace), `EARLY_EXIT` (checkout < end−grace), `SHORT_HOURS` (worked < halfDayMinutes, default 240); dedupes per `(logId, type, OPEN)`. Logs missing a punch are skipped here (covered by auto-clock-out instead). `ABSENT` anomaly type exists in the enum but is never produced by evaluate.
- **Decide**: OPEN only; APPROVED = penalise later, OVERRIDDEN = waive.
- **Auto clock-out**: open logs (check-in, no checkout, not yet auto-closed) get checkout = shift end, log status `AUTO_CLOCK_OUT`, plus a `MISSED_PUNCH` anomaly.
- **Convert-LOP**: all OPEN anomalies in the month → `CONVERTED_TO_LOP` + a `PenaltyLog` row, using settings `penaltyMapping` (per anomaly type → FULL_DAY=1.0 / HALF_DAY=0.5 days). Requires tenant context (401 without). Note OVERRIDDEN escapes conversion but **APPROVED anomalies also escape** (only OPEN are converted) — "approve" effectively also waives, which looks unintended.
- The whole pipeline is manual-POST driven; no scheduler. `permission-map.json:27` knows `^/attendance/anomalies$` but **no web console ever calls any of these five endpoints** — outputs surface only indirectly via the Penalty Logs tab.

---

# Module: Holidays (`/holidays`) — location-scoped

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List | `GET /holidays` | `holidays.read` | HolidayConsole calendar grid + 3 list tabs |
| Create | `POST /holidays` (`{companyId, locationId?, name, date, type}`) | `holidays.create` | "Add Holiday" modal (name, date, type select MANDATORY/OPTIONAL/REGIONAL, location dropdown w/ "All Locations") |
| Toggle status | `PATCH /holidays/:id/status` (`{status}`) | `holidays.update` | Disable/Enable button per row |

**Location scoping** (`holidays.service.ts:11-42`): if the requester's roles are **only** `EMPLOYEE` and they have `employee.locationId`, the list is filtered to `locationId IN (null, theirLocation)`; HR/admin/managers see everything. `locationId=null` = company-wide holiday. Attendance auto-process and leave day-count both consume holidays (leave's `calculateDaysCount` filters by company+ACTIVE but **not** by employee location — inconsistency with the attendance processor, which does check `emp.locationId`, `attendance.service.ts:597-605` vs `leave.service.ts:643-653`).

**Gaps/quirks**:
- **No edit or delete endpoint** — a typo'd holiday can only be disabled, never fixed or removed.
- `type` is a free string in the API/DB; only the UI constrains to the 3 values; list tabs (Mandatory/Optional/Regional) filter client-side.
- Status DTO accepts any string (no enum validation).
- Header stats: "Types: 3" and "Linked: Yes — Attendance sync" are hardcoded (holiday-console.tsx:231-235).
- "Locations" and "Rules" header buttons open **informational stub modals** only (holiday-console.tsx:486-510).
- Export = client-side CSV of the loaded list.
- Calendar grid (Mon-first, 35/42 cells, prev/next month nav) shows ACTIVE holidays only, color-coded by type; month picker in the shared header also drives it.
- `HolidaysTable` in live-tables.tsx:460-524 is an **orphaned duplicate** (defined, never imported by any console).

---

# Module: Leave (`/leave`)

## 1. Leave types & full rule set

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List (merged rules) | `GET /leave/types` | `leave.read` | LeaveSettingsConsole cards (admin); read-only "Leave Rules" cards (employee view, leave-console.tsx:244-295); type dropdowns everywhere |
| Create | `POST /leave/types` | `leave.configure` | "+ Add Leave Type" modal — full form incl. general + advanced sections |
| Update | `PATCH /leave/types/:id` | `leave.configure` | Inline edit per card (General Settings / Advanced Settings sub-tabs) |
| Delete | `DELETE /leave/types/:id` | `leave.configure` | X button w/ confirm dialog |

**Rule fields** — two storage tiers (`leave.service.ts:34-223`):
- **LeaveType columns**: `name, code (unique per company), annualQuota, carryForwardAllowed, sandwichRuleEnabled, compOffLinked, encashable, maxEncashableDays, availableDuringNotice, status` (schema.prisma:485-506).
- **ClientRule JSON extras** (category `leave_type_settings`, key=typeId) with defaults: `description`, `weekendsBetweenLeave`/`holidaysBetweenLeave` ("Not Considered"), `creditableOnAccrual` (true), `creditableOnPresentDay` (false), `accrualFrequency` ("Monthly"), `accrualPeriod` ("Start"), `allowedUnderProbation` (false), `allowedUnderNoticePeriod` (false), `leaveEncashEnabled` (false), `maxLeavesPerMonth` (31), `maxContinuousLeaves` (31), `negativeLeavesAllowed` (false), `futureDatedLeavesAllowed` (false), `backdatedLeavesAllowed` (true), `backdatedLeavesDaysLimit` (90), `applyNextYearTillMonth` ("February").
- **CRITICAL: almost none of the advanced rules are enforced.** Request validation only uses block lists + sandwich rule + balance (`leave.service.ts:435-512`). maxLeavesPerMonth, maxContinuousLeaves, negative/future/backdated rules, probation/notice applicability, weekends/holidaysBetweenLeave, applyNextYearTillMonth are **display-only metadata** today.
- **First-run seeding**: when a tenant has zero types, `GET /leave/types` auto-seeds 5 starters (Event 5, ON Duty 30, Paternity 7, Sick 12, Casual 12) — deliberately never re-seeds deleted ones (`leave.service.ts:34-57`).
- **Delete is soft when history exists**: linked requests/balances → status INACTIVE (audit-logged) instead of hard delete; UI explains this in the confirm message (leave-settings-console.tsx:420-427). Note: the types list does NOT filter INACTIVE — deactivated types still show in dropdowns/cards.
- **Two parallel encashment flags**: model `encashable`+`maxEncashableDays`+`availableDuringNotice` (edited via `LeaveEncashmentTable`, which lives in **lifecycle-console.tsx:830** "F&F Settings", not the leave console) vs ClientRule `leaveEncashEnabled` (edited in LeaveSettingsConsole, and the one the encashment apply form filters on, leave-console.tsx:643). They are not synchronized.
- LeaveSettingsConsole has card-level conditional rendering: types named/coded like Paternity hide accrual+yearly quota fields, comp-off types hide quota (leave-settings-console.tsx:354-355) — cosmetic special cases keyed on `code === "PL"` / name contains "paternity"/"comp".

## 2. Leave rule assignments (type → employee balances)

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Grid of who-has-what | `GET /leave/assignments` | `leave.read` | "Assign Leave Rules" tab — table with checkbox selection, search, rule chips per employee |
| Assign | `POST /leave/assignments` (`{employeeIds[], leaveTypeIds[], effectiveDate?}`) | `leave.configure` | "Assign Rules" modal (multi-select types + effective date) and per-row "+" |
| Unassign | `POST /leave/assignments/delete` (`{employeeIds[], leaveTypeIds[]}`) | `leave.configure` | per-chip ×, and "Bulk Delete" (sends ALL type ids for selected employees) |

Assignment = creating a `LeaveBalance` row for the current leave year with opening=accrued=available=annualQuota plus an ACCRUAL ledger entry (`leave.service.ts:304-358`). **Quirks**: `effectiveDate` is accepted but ignored by the service; re-assigning is balance-idempotent (`update:{}`) **but writes a duplicate ACCRUAL ledger entry every call**; unassign hard-deletes balances (even if leave was already used) while ledger entries remain. Leave year honours settings `leave.leaveYear` ("Financial Year" → year flips in April, `leave.service.ts:18-26`). UI extras: "Import" button is a fake `alert()` stub (leave-settings-console.tsx:878-883); the Show 20/50/100 selector and PREVIOUS/1/NEXT pager are decorative (no pagination logic); default effective date is hardcoded `"2026-06-06"` (leave-settings-console.tsx:153).

## 3. Balances

`GET /leave/balances` — `leave.read` — all balances incl. employee+leaveType, year desc, no filters (`leave.service.ts:377-386`). UI: "Leave Balance" tab (`LeaveTable mode="balances"`: Employee/Type/Year/Opening/Used/Available) + client CSV export from the header. No per-employee "my balance" endpoint — every viewer with `leave.read` sees everyone.

## 4. Leave requests

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List | `GET /leave/requests` | `leave.read` | "Leave Requests" tab / admin "Leave Approvals" (`LeaveTable mode="requests"` with search/status/month filters) |
| Create | `POST /leave/requests` | `leave.create` | "Apply Leave" modal → `LeaveApplyPanel` (action-panels.tsx:710-781) |
| Approve | `PATCH /leave/requests/:id/approve` (`{decidedByUserId?, note?}`) | `leave.approve` | Approve button on PENDING rows |
| Reject | `PATCH /leave/requests/:id/reject` | `leave.approve` | Reject button |

**Create flow** (`leave.service.ts:435-512`): block-list check (day-by-day scan of every blocked date in every company block list) → server recalculates `days` via `calculateDaysCount` (sandwich rule: weekends/ACTIVE-company-holidays in the span count only when `sandwichRuleEnabled`; weekend = Sun, or Sat+Sun when company `workWeek === "Monday to Friday"`) → balance lookup for `fromDate.getFullYear()` → 400 if missing or insufficient → PENDING request + audit log.
**Approve** re-validates balance in a transaction, increments `used`, decrements `available`, writes a DEBIT ledger entry, stores decider in `managerId`. **Reject** just flips status. Both enforce **HR-applied leaves can only be decided by SUPER_ADMIN** (`assertCanDecide`, `leave.service.ts:417-433`); `GET /requests` correspondingly hides HR users' own requests from HR_ADMIN viewers (`:388-414`).

**Quirks**:
- Client-sent `days` (DTO allows 0.5 steps) is **ignored** — server recounts whole days only, so half-day leave is impossible despite the UI's 0.5 step input.
- Balance year = `fromDate.getFullYear()`, NOT `getLeaveYear()` — inconsistent with assignments/encashment/accrual when Financial Year mode is on.
- No employee-self scoping: the Apply modal exposes a dropdown of ALL employees; the API also accepts any employeeId.
- No cancel/withdraw endpoint; no approver-note display; no attachment support.
- "Team Calendar" tab is a flat list of APPROVED requests, not a calendar (leave-console.tsx:738-765).
- Employee Dashboard `LeaveRulesWorkspace` shows hardcoded balances ("Earned Leave 12 days"…) — fake static UI (reference-workspaces.tsx:196-217).
- Holiday exclusion in day-count is company-wide, ignoring the employee's location.

## 5. Block lists

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Create list | `POST /leave/block-lists` | `leave.configure` | Admin "Block Lists" tab → LeavePolicyPanel "Add Block List" modal |
| List | `GET /leave/block-lists/:companyId` | `leave.read` | Cards with blocked-date chips (companyId param is overridden by tenant context, `leave.service.ts:696`) |
| Add date | `POST /leave/block-lists/:id/dates` (`{date, reason}`) | `leave.configure` | "+ Add Date" modal per card |

**No delete/update endpoints for block lists or their dates** (API + UI gap) — a blocked date is permanent without DB surgery. Block lists apply to ALL employees company-wide (no department/location targeting). Enforcement happens at request-create only (already-approved leaves are unaffected by a new block date).

## 6. Policies & accrual engine

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Create policy | `POST /leave/policies` (`{name, description}` only) | `leave.configure` | Admin "Leave Policies" tab → "Add Policy" modal |
| List policies | `GET /leave/policies/:companyId` | `leave.read` | Policy cards w/ assigned-employee chips |
| Assign policy | `POST /leave/policies/assign` (`{policyId, employeeIds[], effectiveFrom}`) | `leave.configure` | "Assign Policy" modal (multi-select) |
| List assignments | `GET /leave/policies/assignments/:companyId` | `leave.read` | (data also nested in policy cards) |
| Process accruals | `POST /leave/accruals/process` (`{period}`) | `leave.configure` | "Process Accruals" button in LeaveSettingsConsole (sends current `YYYY-MM`) |

**Critical gap**: a `LeavePolicy` holds NO rules itself — accrual behaviour comes from `LeaveAccrualSchedule` rows (`leavePolicyId, leaveTypeId, frequency, daysPerPeriod, lastProcessedPeriod`, schema.prisma:1591-1601) and **there is no endpoint or UI to create/edit accrual schedules** — seed/DB only. So the "Process Accruals" button silently returns `[]` for any unseeded tenant. Processing (`leave.service.ts:953-1048`) iterates schedules × policy assignments, skips non-ACTIVE employees, is idempotent per period via a magic remarks substring (`Accrual Policy:<id> Period:<period>`), upserts balances (+accrued/+available) and ACCRUAL ledger entries, updates `lastProcessedPeriod` per employee-loop-iteration (repeatedly). Manual trigger only — no scheduler. Policy assignment has no unassign endpoint.

## 7. Leave ledger

`GET /leave/ledger/:employeeId` — `leave.read` — full ledger (ACCRUAL/DEBIT/CREDIT/ENCASHMENT) desc (`leave.service.ts:716-723`). **API-only: no console renders the ledger** (permission-map.json:191 maps it, nothing calls it). A redesign gets an audit-trail view for free here.

## 8. Leave encashment

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| List | `GET /leave/encashments` | `leave.read` | "Leave Encashment" tab (employee console) history table |
| Apply | `POST /leave/encashments` (`{employeeId, leaveTypeId, days>=1}`) | `leave.create` | Apply form — type dropdown filtered to `leaveEncashEnabled` |
| Decide | `PATCH /leave/encashments/:id/decide` (`{status: APPROVED\|REJECTED, decidedByUserId?, note?}`) | `leave.approve` | Approve/Reject buttons shown only when `role === "admin"` |

Rate is **hardcoded `basic / 30`** from the employee's ACTIVE salary structure (400 if none) (`leave.service.ts:790-847`). Apply checks current-leave-year balance. Approve (transaction): decrement balance, ENCASHMENT ledger entry, **creates an `AdditionalSalary` ADDITION row** ("Leave Encashment (<type>)") that flows into payroll (`:880-918`). Quirks: `maxEncashableDays` is NOT enforced; the model `encashable` flag is NOT checked (only the UI filters by the other flag, and only client-side — API will encash any type); days are validated against balance only.

## 9. Comp-off conversion (overtime → leave credit)

| Endpoint | Method/Path | Permission | UI |
|---|---|---|---|
| Create | `POST /leave/comp-off-conversions` (`{employeeId, overtimeRequestId, leaveTypeId, daysGranted}`) | `leave.create` | "Comp-Off Conversion" tab form |
| List | `GET /leave/comp-off-conversions` | `leave.read` | "Comp-Off Requests Log" table |
| Approve | `PATCH /leave/comp-off-conversions/:id/approve` | `leave.approve` | Approve button (admin role only in UI) |
| Reject | `PATCH /leave/comp-off-conversions/:id/reject` | `leave.approve` | Reject button |

Approve credits the balance (upsert) + CREDIT ledger entry (`leave.service.ts:1083-1151`). **Quirks**: balance year here is calendar `new Date().getFullYear()` — third year convention in the same module; the UI requires typing a **raw `overtimeRequestId`** ("e.g. ot_12345") with no picker and no way to discover ids (no OT list endpoint); no validation that the OT belongs to the employee or that hours ≈ daysGranted; `daysGranted` UI input allows 0.5 steps and API accepts any number; OvertimeRequest↔CompOffConversion is one-to-one in schema so a second conversion for the same OT throws a raw FK/unique error.

---

# Summary tables

## API-only (no UI control anywhere)
| Capability | Endpoint(s) |
|---|---|
| Anomaly engine (evaluate, list, decide) | `POST /attendance/anomalies/evaluate`, `GET /attendance/anomalies`, `PATCH /attendance/anomalies/:id/decide` |
| Auto clock-out | `POST /attendance/auto-clock-out` |
| Month-end LOP conversion | `POST /attendance/anomalies/convert-lop` |
| Create regularization | `POST /attendance/regularize` |
| Create overtime | `POST /attendance/overtime` |
| Create shift-change request | `POST /attendance/shifts/requests` |
| Leave ledger view | `GET /leave/ledger/:employeeId` |
| Policy assignment listing | `GET /leave/policies/assignments/:companyId` (data only shown nested) |

## UI-only / fake / broken
| Item | Location | Nature |
|---|---|---|
| Regularization Approve button | live-tables.tsx:1064 | **Broken** — wrong route (`/attendance/regularizations/:id/approve` vs API `/attendance/regularize/:id`); no Reject button at all |
| Attendance header actions (Month View/Export/Rules) | attendance-console.tsx:60-64 | No onClick — decorative |
| AttendanceRulesWorkspace / LeaveRulesWorkspace | reference-workspaces.tsx:57,196 | Hardcoded static "rules"/"balances", not data-bound |
| Assign-rules "Import" button | leave-settings-console.tsx:878 | `alert()` stub |
| Assignments pagination + page-size select | leave-settings-console.tsx:886-892, 985-992 | Decorative |
| Holiday "Locations"/"Rules" buttons | holiday-console.tsx:486-510 | Informational stub modals |
| Holiday stats "Types: 3", "Linked: Yes" | holiday-console.tsx:231-235 | Hardcoded |
| AttendanceActionPanel hardcoded `shift_general` | action-panels.tsx:682 | Works only with matching seed data |
| `HolidaysTable` component | live-tables.tsx:460 | Orphaned (never imported) |
| Process Accruals button | leave-settings-console.tsx:320-339 | Functional but no-ops without DB-seeded LeaveAccrualSchedule rows |
| Mojibake glyphs (`ðŸ"`, `Ã—`) | leave-settings-console.tsx:858,962,1001 | Encoding artifacts in UI strings |

## Missing endpoints a redesign should plan around
- Shift CRUD (create/edit/delete shifts, manage shift↔location links).
- Holiday edit/delete.
- Block list / blocked-date delete; policy unassign; accrual-schedule CRUD.
- Leave request cancel/withdraw; "my requests/my balance" self-scoped reads.
- OT list/decide; anomaly UI; scheduler for auto-process/auto-clock-out/accruals.
