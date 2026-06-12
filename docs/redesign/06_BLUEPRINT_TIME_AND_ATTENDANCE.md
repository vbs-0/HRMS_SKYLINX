# 06 · Blueprint — Time, Attendance, Shifts & Leave

Screens: `/time/attendance`, `/time/roster`, `/time/leave`, `/time/holidays`. API: `attendance`, `leave`, `holidays`. Existing depth to surface: rules, regularization, OT, shift schedules, anomaly→LOP lifecycle, leave policies/ledger/blackout/sandwich/encashment.

---

## 1. `/time/attendance`

### Tab: Me (ESS default)
- **Punch hero** (shared with Home): big Check in/out, current shift chip, geo status (in-fence sage / out-of-fence ochre with policy outcome), selfie capture when required, WFH toggle per policy. Offline: punches queue locally, "Will sync" chip.
- **Month heatmap** (AttendanceDayCell grid): tone by worked hours; dots: ochre = anomaly, brick = LOP, slate = holiday/week-off, sage = leave (approved). Day click → day drawer: punches list (time, source: web/geo/biometric/kiosk, location), computed (in, out, hours, status), actions: **Request regularization** (missing/wrong punch: proposed times + reason + evidence) · **Request OT** (hours + justification).
- **My requests strip:** regularizations & OT with status chips + ApprovalTrail.
- **Summary cards:** present days, late count (vs grace), avg hours, OT approved hours, LOP days MTD.

### Tab: Team (manager)
- Today board: Present (with in-times, late flagged ochre) · Not in yet · On leave · WFH · On OT. 
- **Regularization & OT queue** (also mirrored in Inbox): row = person, date, type, delta, reason; one-click approve/reject; bulk.
- Member drill-in = their Me view (read).

### Tab: Everyone (HR, `attendance.read` org scope)
- DataTable: date filter, person, shift, in/out, hours, status (Present/Absent/Half/Leave/Holiday/WO/LOP chips), source, anomaly chip; saved views ("Yesterday absent", "Late >3× this month"); export; **bulk mark** (e.g., event day present) with audit note.
- **Device feed monitor:** biometric/API ingestion status (last sync per device, failed rows queue with re-map tool).

### Tab: Anomalies (HR/manager) — the anomaly→LOP lifecycle (existing engine)
- Pipeline list: rule hit (late > grace ×3, missing punch, short hours), person, date(s), state machine chips: Detected → Notified (auto-nudge to employee: regularize by D+3) → Under review → Excused / **Penalty posted (LOP n days)** → Synced to payroll period.
- Row drawer: evidence (punches), rule citation, history; actions Excuse (reason) / Post penalty (LOP days editable within rule cap) — both audit-logged; period-lock awareness ("June payroll locked — posts to July").

### Tab: Rules (HR `attendance.configure`)
- **Attendance rules** cards list → editor: cycle (e.g., 26→25), grace minutes, late-mark threshold & penalty ladder (3 lates = ½ LOP etc. — FormulaInput-lite), min half/full-day hours, auto-absent cutoff, geo-fence on/off + radius per location, selfie required, WFH allowed days, OT eligibility (grade/shift), OT multiplier & caps, week-off pattern (fixed/rotational). Assignment matrix: rule × (department/grade/location/individual override) with effective dates.
- Live **rule tester**: pick sample punches → shows computed status ("09:47 in → Late mark #2 this month").

## 2. `/time/roster` — Shifts & scheduling

- **Shifts library:** ShiftPill list (code, name, start–end, break, night flag, color tone from painted set); editor with overnight handling preview.
- **Planner:** virtualized grid (people rows × days columns, week/fortnight/month zoom); cells = ShiftPill; drag to assign, paint-mode for ranges; conflict checks inline (leave overlap brick outline, <11h rest ochre); column summaries (coverage per shift vs required headcount); copy week, apply **rotation patterns** (e.g., 5×Morning→5×Night→2×Off), auto-fill from pattern; publish → notifies team (unpublished = slate hatch).
- **Shift change requests** (ESS): propose swap (with colleague consent flow) or change; manager approves in Inbox; planner shows pending overlay.
- **Schedules tab:** recurring assignment table (person, pattern, effective range) — the existing shift schedules model.

## 3. `/time/leave`

### Tab: Me (ESS default)
- **Balance rings row** — per type: available big, then accrued YTD / used / pending / carry-forward / encashable split on tooltip; ledger link.
- **Apply leave** (primary clay) → Drawer form: type select (shows balance + rules note per type), range picker (holidays/week-offs auto-excluded display; half-day start/end toggles; hourly if type allows), **live validation panel**: balance after, sandwich rule effect ("Sat–Sun counted: policy §4"), blackout conflict (brick block w/ policy cite), notice-period rule, max-consecutive check, doc requirement (e.g., SL >2d → attach certificate), coverage hint ("2 teammates already off 14 Jul"); approver preview (ApprovalTrail); submit → Inbox routing.
- **My requests:** table w/ status, ApprovalTrail popover, Cancel (pending) / Request cancellation (approved future — goes to approver).
- **My ledger:** every credit/debit (accrual, used, lapse, encash, adjustment) with running balance — answers "why is my balance X".
- **Holidays preview** + **Comp-off:** earn requests (worked holiday/week-off date + evidence → approval → credits comp-off balance w/ expiry chip).

### Tab: Team (manager)
- Coverage calendar (month): bars per person; conflict shading when >N% team off (policy); pending requests overlaid hatched.
- Queue mirror of Inbox leave items; balances table for team.

### Tab: Everyone (HR)
- All requests DataTable (filters: type, status, dept, date range); balances grid (person × type with drill to ledger); **Adjust balance** action (±days, reason mandatory, audit) ; encashment requests queue (policy rate shown, approve → payroll input); year-end processing wizard: preview carry-forward/lapse/auto-encash per policy → simulate (diff per person) → execute (ledger entries + notification).

### Tab: Types & Policies (HR `leave.configure`)
- **Leave types** table (code, name, paid/unpaid, unit day/half/hour, color, active toggle, delete/deactivate guard per existing fix): editor — applicability (gender/marital for maternity etc., grades, after probation?), max per request, min notice days, max consecutive, doc-required threshold, sandwich rule on/off, holiday-adjacent counting, encashable (cap %, rate basis: Basic / Basic+DA / gross), carry-forward (cap days, expiry months), negative balance allowed (floor), comp-off expiry days.
- **Accrual policies:** frequency (monthly/quarterly/yearly/anniversary), rate (days per period), proration on join/exit (FormulaInput), credit timing (start/end of period), applicability mapping (policy × dept/grade/location, effective-dated). **Policy assignments** table + bulk assign.
- **Blackout periods:** ranges per audience (e.g., "Quarter close 25–31 Mar · Finance dept"), override permission note.
- **Simulator:** pick persona + date range → shows full verdict chain (the same engine as apply-form validation) for config testing.

## 4. `/time/holidays`

- Calendars per location/entity: year grid + list (date, name, type: National/Festival/**Optional**); optional-holiday election flow for ESS (pick up to N per policy → tracked); clone year, import CSV, publish (notifies); week-off patterns reference. ESS view: my calendar with "Optional picks left: 1".

---

### Permission gates (recap)
`attendance.read|create(self punch)|update|approve(corrections)|configure` · `leave.read|create|approve|configure` · `holidays.read|create|update`. Manager scope = team; HR = org. Every approve action writes ApprovalTrail + audit.

### Edge & error states
- Punch without geo permission → instructional state + fallback per rule (allow w/ flag or block).
- Backdated applications beyond policy window → blocked with cite; HR override path (reason + audit).
- Regularization after payroll lock → routes to next period with banner.
- Planner unsaved changes guard; publish diff preview ("12 cells changed for 8 people").
- All validations render as the SAME chips in ESS form, manager Inbox detail, and HR queue (single verdict component → trust).
