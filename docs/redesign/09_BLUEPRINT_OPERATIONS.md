# 09 · Blueprint — Workplace Operations & Insight

Screens: `/work/helpdesk`, `/work/grievance`, `/work/travel`, `/work/assets`, `/work/policies`, reminders, `/insight/analytics`, `/insight/reports`. API: `tickets`, `grievance`, `travel`, `assets`, `policies`, `reminders`, `analytics`, `reports`, `compliance` (calendar).

---

## 1. Helpdesk (`/work/helpdesk`)

- **ESS:** "Raise a ticket" (category tree: Payroll/Leave/IT/Admin/HR-letter/Other → sub-category sets SLA + assignee group; subject, description, attachments, related-record link picker e.g. payslip month) · My tickets list (status chips Open/In progress/Waiting on you/Resolved/Closed, SLA dot, last reply preview). "Waiting on you" = brick chip + Inbox task.
- **Agent/HR console:** queue board (Unassigned / Mine / Team; filters category, priority, SLA breach gold→brick) · ticket room: thread (CommentThread w/ internal-notes toggle), properties rail (assignee, priority, category, linked employee record card, related tickets), canned responses library, escalate (notify + bump priority), merge duplicates, resolve w/ resolution note → CSAT request (1–5 + comment) to requester.
- **Admin tab:** categories & routing rules (category → group/agent round-robin), SLA matrix (priority × first-response/resolution hours, business-hours calendar aware), CSAT report, canned responses manage.
- **Metrics strip:** open, breaching today, avg first-response, CSAT 30d.

## 2. Grievance & POSH (`/work/grievance`) — confidential by design

- **Intake (ESS):** type pick (Workplace grievance / Harassment-POSH / Whistleblower); **anonymity option** (anonymous tracking via case token), against-whom (optional), narrative, evidence, witness list. Plum "confidential" banner: who will see this (committee roles only), retention note.
- **Case room (committee/HR-confidential perm):** restricted-access record (access list explicit, every view audit-logged, no export of narrative without `grievance.configure`), Timeline (intake → acknowledgment SLA (24h chip) → inquiry sessions log → findings → action taken → closure), private CommentThread, related-document vault (sealed), respondent communications tracked separately. POSH mode: committee composition card (presiding officer, members, external member), statutory clock chips (90-day inquiry, annual report counter), annual POSH report export.
- **Registry (HR-confidential):** anonymized list (case id, type, status, age) — names hidden even here unless case-member.
- Separation from Helpdesk is hard: different module, different permission (`grievance.*`), no cross-linking of confidential cases.

## 3. Travel Desk (`/work/travel`)

- **ESS request wizard:** purpose & project/cost center → trip legs (from/to, dates, mode pref) → hotel needs → **advance request** (amount vs per-diem policy table by grade/city-class shown inline) → policy verdict chips → submit (workflow).
- **Trip page:** status Stepper (Requested → Approved → Booking → Booked → In trip → Settlement → Closed); itinerary cards per leg (booking refs, tickets attached by travel admin); advance chip (paid via payroll/bank); **settlement:** post-trip expense claim pre-linked (advance auto-offset, balance payable/recoverable line) → closes trip.
- **Travel admin console:** booking queue (approved trips needing fulfillment), vendor notes, spend dashboard (by dept/route/month), policy admin (per-diem matrix, class-of-travel by grade, advance caps).

## 4. Assets (`/work/assets`)

- **Registry:** DataTable: asset code (mono), type/category, model, serial, status (In stock/Assigned/In repair/Retired/Lost), assignee, location, purchase date & value (perm-gated), warranty expiry (gold <60d). Category masters + custom fields.
- **Assign/return flows:** assign drawer (employee picker, condition checklist + photos, acknowledgment task to employee → signature) ; return (condition diff, damage note → optional recovery line to F&F/payroll); full custody Timeline per asset.
- **ESS "My assets":** cards + "Report issue" (→ Helpdesk IT prefilled) + acknowledgment pendings.
- **Maintenance:** repair tickets, AMC vendor fields, downtime log.
- **Exit hook:** clearance matrix (doc 05 §8) auto-lists holder's assets; un-returned blocks clearance row.
- **Audits:** stocktake mode — scan/enter codes → discrepancy report.

## 5. Policies (`/work/policies`)

- **Library (ESS):** category sections (HR/IT/Finance/Conduct), policy cards (title, version chip, updated date, "Acknowledged ✓" sage or "Action needed" gold). **Reader:** body-l serif-friendly prose layout (TOC rail, print clean), version notice banner when re-ack needed, sticky PolicyAcknowledgeBar (checkbox + typed name or SignaturePad per policy setting).
- **Admin:** editor (rich text or PDF-attach mode), versioning (draft → publish → previous versions archived, diff view), audience (all/dept/location/grade), **acknowledgment campaign** (deadline, reminders cadence, tracker table: person, status, date, chase column → bulk nudge), ack export (audit evidence). New-joiner auto-assignment via onboarding template hook.

## 6. Reminders & notification rules (HR utility, surfaces in bell + Inbox)

Rules table: event (birthday, anniversary, probation end, doc expiry, certification expiry, contract end, visa/insurance renewal, compliance due-date), lead days, audience (HR/manager/employee), channel (in-app/email), template, active toggle. Preview upcoming 30 days list. (Backed by `reminders` + `notifications` modules; per-user channel prefs live in Settings → Notifications.)

## 7. Compliance calendar (`/pay/compliance` rail + `/calendar` overlay)

Year wall view: statute lanes (PF/ESI/PT/TDS/POSH report/S&E renewals) × months, ChallanCards on due dates (status tones), click → workbench. "Add filing obligation" for custom items (licence renewals etc., owner + evidence file on completion).

## 8. `/insight/analytics`

Domain dashboard pages (each = KpiRow + 2–4 charts + insight list, all click-through to filtered lists):
- **Workforce:** headcount trend (joiners/exits stacked), attrition % (voluntary/involuntary split, by dept heat), tenure & age mix, diversity ratio, span of control.
- **Attendance & leave:** absenteeism %, late-arrival trend, OT hours by dept, leave utilization vs accrual, LOP days trend, anomaly volume.
- **Payroll cost:** cost trend (gross/employer-cost stacked), cost per dept/location/cost-center, variance vs previous run (waterfall), statutory outflow summary, salary-band distribution.
- **Recruitment:** funnel, time-to-fill, source ROI, offer-acceptance, interviewer load.
- **Performance & learning:** rating distribution vs target curve, goal completion %, training hours/coverage, skill-gap heat.
- **Engagement:** eNPS trend, survey participation, recognition volume, helpdesk CSAT.
Period/entity/dept global filters; every chart: data-table toggle + PNG/CSV export; insight lines auto-generated ("Attrition in Support is 2.1× company average") — plum chip when AI-derived.

## 9. `/insight/reports` — Report Center

- **Catalog:** report cards grouped by module (each = name, description, perms, last run). Built-ins (≥40): employee master, joiners/exits, probation due, attendance register, late report, leave balance/ledger/transactions, payroll register, component-wise register, variance, PF/ESI/PT/TDS registers, **Form 16 status**, declaration status, loan book, expense by category/person, asset register, recruitment pipeline, offers, training matrix, certification expiry, policy ack status, audit trail extract.
- **Runner `/insight/reports/[id]`:** parameter panel (period, dept, location, status…) → run → DataTable result (column picker, totals row) → export CSV/XLSX/PDF (print letterhead) → **Schedule** (cron-lite picker: frequency, recipients (perm-checked), format) → schedules manage tab (last status, pause).
- **Custom report builder (v2.1 flag):** dataset pick (joined views curated per module) → drag columns → filters → group/aggregate → save to catalog (private/shared w/ permission tag).
- Every export respects field-level security (salary columns stripped without perm) + stamps footer (user, time, filters).

---

### Cross-cutting
- All queues (tickets, travel, bookings) mirror into Inbox; SLA tones unify (gold warn → brick breach).
- Confidential modules (grievance) excluded from global search, palette, AI assistant retrieval, and exports by default.
- Analytics respect data scopes: manager sees team cuts only; salary analytics need `payroll.read` org scope.
