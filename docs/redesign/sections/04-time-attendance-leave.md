# §04 — Time: Attendance, Shifts/Roster, Holidays, Leave

> Inventory: `inventory/time.md`. Primitives: §02. Settings keys: `inventory/rbac-settings.md` Part B (`attendance.*`, `leave.*`, `documents.expiryReminderDays`) + per-leave-type `ClientRule(category="leave_type_settings", key=typeId)`. Reference leave form registry: `blueprint.md` §5.2.
> Permissions: `attendance.{read,create,update,approve,configure}`, `leave.{read,create,approve,configure}`, `holidays.{read,create,update}`.
> **Correctness fixes owned here (time.md):** broken regularize Approve route + missing Reject/create UI (§5); two overlapping punch widgets + hardcoded `shift_general` (§1); no shift CRUD (§3); anomaly engine zero-UI (§9); holiday edit/delete missing (Holidays); half-day leave silently dropped server-side (§4); 3 inconsistent leave-year conventions (§4/§8/§9); accrual-schedule CRUD missing (§6); block-list date delete missing (§5); fake static rules/balances workspaces (§2/§4); leave ledger has no UI (§7); mojibake glyphs (summary).
> Status legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. ATTENDANCE

## A1. My Attendance — `/attendance` (My tab, ESS default)
**Title** "My attendance" · **Breadcrumb** Time / Attendance · **Roles** `attendance.create` (punch), `attendance.read` (own). **Plan** Basic.
### Layout
**PunchWidget** (single, geofence-aware — **replaces the 2 overlapping widgets + hardcoded `shift_general`**, time.md §1) → this-week strip (AttendanceDayCell ×7) → month calendar heatmap → my regularization/OT requests.
### PunchWidget
- State machine: Not-in → **Check in** (brand primary) → working timer → **Check out**. Shows current shift chip, geo status (in-fence success / out-of-fence warning), accuracy readout. "Get GPS" auto-runs; if `attendance.geoAttendance` true AND shift has ShiftLocation, GPS mandatory, radius = `attendance.geofenceRadiusMeters` (default 200) — out-of-fence → blocked with reason. 
- **API** EXISTS `POST /attendance/check-in`, `POST /attendance/check-out` (checkout not geofenced — keep; re-check-in overwrites — **NEW** guard/confirm). **Fix**: punch is for the logged-in employee only (today any dropdown employee, server doesn't check requester==employee, time.md §1) → **NEW** server scope `requester==employeeId` unless `attendance.update`.
- Offline: queue punch, "Will sync" chip (mobile §11).
### Month heatmap (AttendanceDayCell)
Tone by hours; dots: warning=anomaly, danger=LOP, info=holiday/week-off, success=leave. Day click → **day drawer**: punches (time, source WEB/AUTO/BULK/REGULARIZATION, location), computed in/out/hours/status, actions **Request regularization**, **Request OT**.
### My requests strip
Regularizations + OT with StatusPill + ApprovalTrail.
**States**: empty "No attendance yet this month"; geo-denied instructional state + fallback per rule.

## A2. Attendance Admin — `/attendance` (Team / Everyone tabs)
**Roles** `attendance.read` (org/team), `attendance.update` (corrections), `attendance.approve`.
- **Team tab** (manager): today board (Present w/ in-times late-flagged, Not-in, On leave, WFH, On OT); regularization & OT queue (mirrors Inbox §10).
- **Everyone tab** (HR): DataTable — date filter, person, shift, in/out, hours, Status pill (Present/Absent/Half/Leave/Holiday/WeekOff/LOP), source, anomaly chip. Saved views ("Yesterday absent", "Late >3× this month"). Bulk mark (event-day present) w/ audit note. **Header actions are real** (fix decorative Month View/Export/Rules, time.md §2): Month View (calendar), Export (server CSV — **NEW `GET /attendance/logs/export`**), Rules → A5.
- **API** EXISTS `GET /attendance/logs` (**NEW**: server date-range filter + pagination; today full history, mislabeled "today" stats, time.md §2). Remove fake static `AttendanceRulesWorkspace` (time.md §2).

## A3. Regularization & OT
**Roles** create `attendance.create`, decide `attendance.approve`.
- **Regularization**: ESS create (**NEW UI** — today API-only, time.md §5) `POST /attendance/regularize` {date, requested in/out, reason, evidence}. Decide: **fix broken route** — UI must call EXISTS `PATCH /attendance/regularize/:id` {action: approve|reject} (today calls wrong `…/regularizations/:id/approve` → 404; no Reject button). **Warn on reject**: rejecting auto-creates a `CONVERTED_LOP` PenaltyLog (time.md §5) → confirm dialog "Reject regularization? This posts a Loss-of-Pay penalty for {date}."
- **OT**: ESS create (**NEW UI**) `POST /attendance/overtime` {attendanceLogId, hours≥0.5, reason}. Today auto-APPROVED w/ no list (time.md §6) → **NEW** `GET /attendance/overtime` + pending/decide flow so comp-off (E5) can pick a real OT.

## A4. Anomaly Center & Penalty Logs — `/attendance` (Anomalies, Penalty Logs tabs) — **build the zero-UI engine** (time.md §9)
**Roles** `attendance.read`, `attendance.approve` (decide), `attendance.configure` (evaluate/auto-clock-out/convert).
- **Anomaly pipeline**: list (Detected → Notified → Under review → Penalty posted / Excused). Row drawer: evidence (punches), rule citation, history; actions **Excuse** (=OVERRIDDEN) / **Post penalty**. Header: **Evaluate day** (date), **Auto clock-out** (date), **Convert to LOP** (month/year, with affected-employee preview + typed confirm). 
- **API** EXISTS `POST /attendance/anomalies/evaluate`, `GET /attendance/anomalies`, `PATCH /attendance/anomalies/:id/decide`, `POST /attendance/auto-clock-out`, `POST /attendance/anomalies/convert-lop`. **Fix** (time.md §9): clarify APPROVED-also-escapes-conversion semantics (only OPEN convert) — make "Approve" vs "Excuse" intent explicit; **NEW** scheduler for evaluate/auto-clock-out (today manual POST only).
- **Penalty Logs tab**: PenaltyLogsTable (month/year/**anomalyType filter — expose**, today hidden, time.md §8), bulk **Revert Selected** `attendance.approve` → EXISTS `POST /attendance/penalty-logs/bulk-revert`. Confirm "Revert N penalties? Affected pay recalculated next run." Note LOP feeds payroll (money.md §1.1).

## A5. Attendance Rules — `/attendance` (Rules tab)
**Roles** `attendance.configure`. Editor for DEFAULT_RULES `attendance.*` (rbac-settings B1) — **expose the currently API-only keys**:
| Field | Type | DEFAULT_RULES key | default |
|---|---|---|---|
| Work week | select (Mon-Sat/Mon-Fri) | `attendance.workWeek` | Monday to Saturday |
| Shift start / end | time | `attendance.shiftStart`/`shiftEnd` | 09:30 / 18:30 |
| Grace minutes | number | `attendance.graceMinutes` | 10 |
| Geo attendance | switch | `attendance.geoAttendance` | true |
| Geofence radius (m) | number | `attendance.geofenceRadiusMeters` | 200 (**NEW field**) |
| Biometric required | switch | `attendance.biometricRequired` | false |
| Overtime enabled | switch | `attendance.overtimeEnabled` | true |
| Penalty mapping | matrix (anomaly→FULL_DAY/HALF_DAY) | `attendance.penaltyMapping` | ABSENT=FULL_DAY, others HALF_DAY (**NEW editor**) |
Live **rule tester** (sample punches → computed status). Save → EXISTS `PATCH /settings/rules` {attendance}. (Note dead `AttendanceRule` model — time.md §3; rules live in settings.) **IP-based restriction** = market gap (blueprint §4) → **NEW** `attendance.ipAllowlist` key.

## A6. Shifts & Roster — `/roster` (or `/attendance` Roster tab)
**Roles** `attendance.read`, `attendance.update` (assign), `attendance.approve` (decide requests).
- **Shifts library**: ShiftPill cards. **NEW: shift CRUD** (today none — seed/DB only, time.md §3) `POST/PATCH/DELETE /attendance/shifts (attendance.configure)` with name, startTime, endTime, graceMinutes, halfDayMinutes, ShiftLocation links (for geofence).
- **Roster planner**: virtualized grid (people × days), drag-assign (reference gesture: rotate 2°/scale 95%/green-dashed target, blueprint §5.3), paint ranges, rotation patterns, conflict checks (leave overlap, <11h rest), coverage summary, publish. EXISTS `POST /attendance/shifts/assign`, `POST /attendance/shifts/bulk-assign`, `GET /attendance/shifts/assignments`.
- **Shift change requests**: ESS create (**NEW UI** — today API-only, time.md §3) `POST /attendance/shifts/requests`; decide EXISTS `PATCH /attendance/shifts/requests/:id/decide` (upserts assignment); list EXISTS `GET …/requests`.
- **Auto attendance process**: date + Run → EXISTS `POST /attendance/shifts/process-auto` (creates HOLIDAY/WEEK_OFF/ABSENT logs); **NEW** scheduler.
- **Bulk upload (CSV)**: EXISTS `POST /attendance/bulk-upload` (**fix**: uses shared apiFetch not raw fetch; validate status enum; copy says CSV+Excel but only .csv — align; stamps first shift regardless of roster — **NEW** respect employee roster, time.md §7).

---

# B. HOLIDAYS — `/holidays`
**Title** "Holidays" · **Roles** `holidays.read`, `holidays.create`, `holidays.update`. **Plan** Basic.
- **Layout**: year switcher + month calendar grid (Mon-first, color by type) + list tabs Mandatory/Optional/Regional.
- **Add Holiday** modal: name (req), date (req), type (select MANDATORY/OPTIONAL/REGIONAL — **NEW** enum-validate; today free string, time.md Holidays), location (dropdown + "All Locations" = company-wide null). EXISTS `POST /holidays`.
- **Row actions**: Disable/Enable EXISTS `PATCH /holidays/:id/status`; **NEW Edit + Delete** (today a typo can only be disabled — `PATCH /holidays/:id`, `DELETE /holidays/:id` `holidays.update`).
- **Location scoping**: EMPLOYEE sees `locationId IN (null, theirLocation)` (time.md Holidays). **Fix inconsistency**: leave day-count must filter holidays by employee location like attendance does (today leave ignores location, time.md §4).
- **Fix**: hardcoded stats "Types: 3 / Linked: Yes" → live; "Locations/Rules" stub modals → real or remove; orphaned `HolidaysTable` unused. Export server CSV.
- **States**: empty "No holidays for {year}" + Add.

---

# C. LEAVE — `/leave`
**Role-forked today** (admin vs employee console, time.md §0.4) → redesign uses **tabs gated by permission**, not the cosmetic `useActiveRole` toggle (shell.md §0.2).

## C1. My Leave — `/leave` (My tab, ESS)
**Roles** `leave.create`, `leave.read` (own — **NEW** self-scope; today every reader sees everyone, time.md §3).
- **Balance rings** per type (available big; tooltip accrued/used/pending/carry-forward/encashable). **Fix** fake static `LeaveRulesWorkspace` balances (time.md §4).
- **Apply Leave** (600px modal, reference §5.2): Leave Type (select: Casual/Sick/Earned/Comp-Off/Maternity/Paternity/LWP — req, shows balance+rule note), From (≥today unless regularization), To (≥From), **Half Day** toggle → Half Day Period (First/Second) — **FIX: server must honor half-day** (today recounts whole days, 0.5 input ignored, time.md §4), Reason (≤500 + counter), Approver (searchable active managers). Live validation panel: balance-after, **sandwich rule** preview (weekends/holidays counted when `sandwichLeave`/type `sandwichRuleEnabled`), **block-list** conflict (danger + cite), notice/max-consecutive/doc-required (**enforce the today-display-only advanced rules**, time.md §1). Submit → EXISTS `POST /leave/requests` (block-list + sandwich + balance checks). 
- **My requests**: table w/ StatusPill + ApprovalTrail; **NEW Cancel/withdraw** (today none, time.md §4).
- **My ledger**: every ACCRUAL/DEBIT/CREDIT/ENCASHMENT w/ running balance — **NEW UI** for EXISTS `GET /leave/ledger/:employeeId` (today API-only, time.md §7).
- **Comp-off earn**: request (worked date + evidence) → §C? Note: comp-off conversion needs a real OT picker (A3 fix).

## C2. Leave Approvals — `/leave` (Approvals tab; also Inbox §10)
**Roles** `leave.approve`. Queue: requester, type, dates, days, balance context, policy verdicts (same chips as apply form). Approve/Reject (+note). EXISTS `PATCH /leave/requests/:id/approve|reject` (approve decrements balance + DEBIT ledger, transactional). **Note**: HR-applied leaves decidable only by SUPER_ADMIN (`assertCanDecide`, time.md §4) — surface as disabled w/ reason. **Team Calendar**: real CalendarView (today a flat list, time.md §4); **team availability view** = market gap (blueprint §4).

## C3. Leave Admin
**Roles** `leave.configure` (rules/policies/assignments/block-lists/accruals), `leave.read`.

### Leave Types & rules — `/leave` (Types tab)
DataTable of types → editor with **General** + **Advanced** (the full two-tier rule set, time.md §1):
- LeaveType columns: name, code (unique/company), annualQuota, carryForwardAllowed, sandwichRuleEnabled, compOffLinked, encashable, maxEncashableDays, availableDuringNotice, status.
- ClientRule `leave_type_settings` extras: description, weekendsBetweenLeave/holidaysBetweenLeave, creditableOnAccrual/PresentDay, accrualFrequency/Period, allowedUnderProbation/NoticePeriod, leaveEncashEnabled, maxLeavesPerMonth, maxContinuousLeaves, negative/future/backdated rules (+limit), applyNextYearTillMonth.
- EXISTS `GET /leave/types` (auto-seeds 5 on first run; soft-delete when history), `POST/PATCH/DELETE /leave/types/:id`. **Fixes**: enforce advanced rules in apply validation (today display-only); **unify the two encashment flags** (`encashable` vs `leaveEncashEnabled`, time.md §1); filter INACTIVE from dropdowns; remove cosmetic name/code special-cases.

### Policies & accrual — `/leave` (Policies tab)
Policy CRUD (name, description) EXISTS `POST /leave/policies`, `GET …/:companyId`, assign EXISTS `POST /leave/policies/assign`. **Critical gap (time.md §6)**: policies hold no rules — accrual lives in `LeaveAccrualSchedule` (no CRUD) → **NEW** `POST/PATCH/DELETE /leave/accrual-schedules (leave.configure)` (frequency, daysPerPeriod per type) so "Process Accruals" isn't a silent no-op. Process EXISTS `POST /leave/accruals/process` {period}. **NEW** policy unassign; scheduler.

### Assignments — `/leave` (Assign Rules tab)
Grid (employee × types), assign/unassign EXISTS `POST /leave/assignments`, `POST /leave/assignments/delete`. **Fixes**: honor `effectiveDate` (ignored today); stop duplicate ACCRUAL ledger on re-assign; unassign shouldn't orphan ledger; real pagination (today decorative); remove fake "Import" alert + hardcoded default date 2026-06-06 (time.md §2).

### Block lists — `/leave` (Block Lists tab)
Create list + add date EXISTS `POST /leave/block-lists`, `GET …/:companyId`, `POST …/:id/dates`. **NEW**: delete/update list + dates (today permanent, time.md §5); department/location targeting (today company-wide).

### Encashment & Comp-off — `/leave` (Encashment, Comp-Off tabs)
- **Encashment**: apply (type filtered to `leaveEncashEnabled`), list, decide EXISTS `GET/POST /leave/encashments`, `PATCH …/:id/decide` (approve → balance debit + ENCASHMENT ledger + AdditionalSalary ADDITION → payroll). **Fix**: enforce `maxEncashableDays` + `encashable` flag server-side (today not enforced, time.md §8). Rate hardcoded `basic/30`.
- **Comp-off conversion**: create (OT picker — **NEW**, today raw `overtimeRequestId` typed, time.md §9), list, approve/reject EXISTS endpoints. **Fix**: validate OT belongs to employee + hours≈daysGranted; unify leave-year (today calendar-year here vs FY elsewhere).

### Leave settings (global) — DEFAULT_RULES `leave.*` (in §08 or here)
approvalFlow, sandwichLeave, carryForward, compOffAllowed, leaveYear (rbac-settings B1) — **year-end carry-forward wizard** (preview lapse/CF/auto-encash → execute) is master-plan §5.2; **fix the 3 leave-year conventions** to one `getLeaveYear()` (time.md §4/§8/§9).

---

## D. Cross-cutting (this section)
- Same policy-verdict component renders in ESS apply form, manager Approvals detail, and HR queue (single source → trust).
- Every list: skeleton/empty/filtered-empty/error+ref/forbidden. Remove all fake static workspaces + mojibake strings (time.md summary).
- Mobile: PunchWidget full-width with GPS map; Apply Leave bottom-sheet (reference §5.3 swipe approve/reject in queues); tables → RecordCards.
- Keyboard: punch (Enter), day-drawer Esc, queue j/k + a/r approve/reject.
- **Backend backlog**: shift CRUD; holiday edit/delete; regularize route fix + create UI; OT list/decide; anomaly UI wiring + schedulers; accrual-schedule CRUD; block-list delete; leave cancel + self-scoped my-reads; half-day day-count; single leave-year; tenant-scope AttendanceLog/LeaveRequest/Balance/Ledger (time.md §0.2).

---

## Post-critique remediations (98 §B)
- **OT create permission (#1):** `POST /attendance/overtime` is gated `attendance.update`, **not** `attendance.create`; body requires `employeeId`. EMPLOYEE lacks `attendance.update`, so ESS-initiated OT needs either a server downgrade to `attendance.create` or a seed grant (rbac A7).
- **ESS read dependency (#23, P0):** EMPLOYEE has **no `attendance.read`/`leave.read`** today → "My Attendance"/"My Leave" tabs 403 **and** the §01 nav items are hidden. Every "self-scope (NEW)" read here depends on the rbac A7 grant of self-scoped `attendance.read`/`leave.read` to EMPLOYEE — state this as a hard prerequisite.
- **Holiday delete permission (#3):** gate `DELETE /holidays/:id` as `holidays.delete` (a real action, SUPER_ADMIN-only by seed — rbac A2), not `holidays.update`; flag it SUPER_ADMIN-only until §08 grants delete.
- **Leave-year (#7):** state in C1/C2 that balance rings + approval key off `getLeaveYear()` (settings `leave.leaveYear`), not `fromDate.getFullYear()` — the single-leave-year fix.
- **Roster route (#4):** commit to the dedicated `/roster` route (drop the "or /attendance Roster tab" hedge) per §01.
- **Export perms (#5/#6):** `attendance.export`/`leave.export`/`holidays.export` are seeded to **no role** — either gate exports on `*.read` or add the `export` action to HR_ADMIN grants (rbac A3).
- **Policy-assignments listing (#8):** surface `GET /leave/policies/assignments/:companyId` as the assigned-employees view (today nested-only).
- **Comp-off duplicate-OT guard (#9):** OvertimeRequest↔CompOffConversion is one-to-one — disable already-converted OTs in the picker (2nd conversion 500s on the unique FK).
- **Settings key home (#25):** `documents.expiryReminderDays` belongs to §03 Documents, not the §04 header (it's a `documents.*` key).
- **`attendance.ipAllowlist` (98 §F-B4):** the NEW IP-restriction key must be registered in the §08 Attendance settings row (not in rbac B1 today).
- **OT body (#2):** include required `employeeId` in the OT request shape.
