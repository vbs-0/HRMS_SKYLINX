# 03 · Component Library — `apps/web/components/ui/`

Replaces the 34-line `ui.tsx`. Built on Radix primitives (a11y) + Tailwind tokens. Every console screen must compose ONLY from this kit — no bespoke tables/forms in feature code. Names below are the exported component names.

Conventions: all components accept `className`; sizes `sm | md (default) | lg`; tones use the painted families `sage | ochre | brick | slate | plum | clay | neutral`; every interactive element has `:focus-visible` ring `--focus-ring`; disabled = 50% opacity + `cursor-not-allowed` + optional `disabledReason` tooltip.

---

## 1. Primitives

### Button
- Variants: `primary` (clay-600 bg, paper-1 text; hover clay-500; active clay-700) · `secondary` (paper-1 bg, line-strong border, ink-900) · `ghost` (transparent, hover paper-2) · `danger` (brick-600) · `link` (ink underline → clay).
- Sizes 32/38/44px; icon-left/right slots; `loading` (spinner replaces icon, label stays, width locked); `confirmHold` variant for irreversible micro-actions (hold 600ms).
- One `primary` per region (lint rule `pp/one-primary`).

### IconButton — 32/38px square, tooltip mandatory, `aria-label` required prop.

### Badge / StatusChip
- Stamp chip: wash bg + 1px `-300` family border + `-600` text + optional 8px glyph; sizes sm (18px) / md (22px).
- Canonical status→tone map (single source `lib/status-map.ts`): approved/paid/active/present/completed→sage · pending/in-review/on-hold/expiring→ochre · rejected/overdue/failed/lop/terminated→brick · draft/scheduled/processing/info→slate · ai/special→plum · archived/inactive→neutral.

### Avatar — initials on deterministic paper-tone bg (hash→6 muted hues), photo when present; sizes 20/24/32/40/64/96; `AvatarGroup` (+N overflow); presence dot only in Social.

### Tooltip — ink-900 bg, paper-1 text, 4px radius, 320ms delay, never holds essential info alone.

### Kbd — paper-2 bg, line border, mono 11px. Used in palette + shortcut sheet.

## 2. Forms (`Form` namespace, RHF + zod)

### Field wrapper
Label (caption, ink-700) + optional "Required"/"Optional" tag + control + help text (ink-500) + error (brick-600 + icon, `aria-describedby`). Labels ALWAYS visible — no placeholder-as-label.

### Controls
- **Input** — 38px, paper-1 bg, line-strong border, focus clay border + ring; prefix/suffix slots (₹, %, @); clearable.
- **NumberInput** — right-aligned, tabular-nums, stepper optional; `currency` mode renders ₹ prefix + Indian grouping on blur.
- **Textarea** — autosize 3→12 rows; char counter when `maxLength`.
- **Select** — Radix; searchable ≥8 options; option = label + optional meta line; groups; async loader.
- **MultiSelect** — chips-in-field, "Select all in filter", count summary ("4 departments").
- **Combobox** — async people/master picker: avatar + name + sub-line (designation · dept); recent section; `EmployeePicker`, `DepartmentPicker`, `DesignationPicker`, `LocationPicker` presets.
- **DatePicker** — paper calendar; serif month title; holidays dotted ochre, week-offs muted; min/max + disabled-dates fn; `fy` mode (Apr–Mar quick ranges). **DateRangePicker** with presets (This month, Last month, This FY, Custom).
- **TimePicker** (15-min steps + free type) · **MonthPicker** (payroll periods).
- **Checkbox / Radio / RadioCard** (rich option tiles with title+desc, e.g., tax regime choice) · **Switch** (with inline saving tick).
- **Slider** — only for weights (KRA %); always paired numeric input.
- **FileUpload** — drag zone ("Drop files or browse"), type/size rules surfaced upfront, per-file progress, image/pdf thumbnail, virus-scan pending state (ochre), error retry. `documentKind` prop applies PII handling (doc 01 §masking).
- **SignaturePad** — draw/type/upload for acknowledgments & e-sign-ready letters.
- **OTPInput** — 6 cells, auto-advance, paste-aware.
- **SearchInput** — leading glyph, `/` shortcut binding, debounced.
- **FormulaInput** — mono font, token highlighting for component codes (`BASIC*0.4`), variable autocomplete, live test panel ("For Asha: ₹18,400") — used in salary components & accrual rules.

### Form layouts
`FormSection` (h3 + deckle rule + 2-col grid, collapses to 1-col <md) · `FormFooter` (sticky: Cancel ghost + Primary; saving state; "Saved · just now" whisper) · `Wizard` (numbered rail left, steps validate-on-next, draft autosave, summary step) · `InlineEdit` (view→input swap for 360 fields, pencil on hover, Esc cancels).

## 3. Data display

### DataTable (the workhorse)
- Toolbar: SearchInput · FilterBar (chips with operator menus; "+ Filter" adds from column registry) · SavedViews menu · ColumnPicker · Density toggle · Export (CSV/XLSX, respects filters, perm `*.export`) · primary action slot.
- Header: sticky, paper-2, sortable (aria-sort), resizable, pin first col on scroll.
- Rows: 48px (40 compact); hover paper-2; selected paper-3 + checkbox; row actions = max 2 inline IconButtons + ⋯ menu; entire row clickable (opens Drawer or page).
- Cells: text/num (tabular)/money (₹ right)/date/Avatar+name/StatusChip/progress/chips list/masked PII (••• + reveal-with-permission audit event).
- Bulk bar (slides up): "12 selected · Approve · Export · Assign · Clear" — destructive bulk always previews affected list in modal.
- States: skeleton rows (header + 8 shimmer lines) · empty (module glyph, serif line, CTA) · filtered-empty ("No results for these filters" + Clear) · error (retry + ref id) · forbidden.
- Pagination: 25/50/100 + "Showing 1–25 of 1,204"; virtual scroll variant for >2k rows (roster, audit logs).
- `TreeTable` variant (org units, report groups). Mobile: collapses to `RecordCard` list.

### Other display
- **KpiCard** — caption label, serif `num-xl` value (count-up once), delta chip (▲ sage/▼ brick + "vs last month"), optional 32px sparkline, click→filtered list. `KpiRow` grid wrapper.
- **RecordCard** — avatar/glyph + title + meta + chips + actions; used in mobile lists & boards.
- **DescriptionList** — label/value pairs 2-col (360 Overview, settlement statements); `copyable` values for IDs.
- **Timeline** — vertical, glyph nodes, actor + action + timestamp + diff popover ("Basic: 30,000 → 34,000"); filters by event type. Used: employee history, ticket/case rooms, audit.
- **KanbanBoard** — columns with WIP count + ₹ sum where relevant; DnD with keyboard alternative (move-to menu); card = RecordCard. Used: recruitment, onboarding/exit boards, ticket triage.
- **CalendarView** — month/week; event pills with family tones; day peek popover; used by leave/holiday/roster/interview/company calendar.
- **OrgChartView** — zoom/pan tree, node = avatar+name+designation+count, expand-on-demand, dotted-line edges, minimap, export PNG/PDF.
- **Charts** (Recharts wrapper `pp-charts`): Line/Area/Bar/Stacked/Donut/Funnel/Heatmap(attendance)/Scatter(9-box); tokens-only colors, grid `--line-soft`, tooltip = ink card; every chart has `data table` toggle for a11y.
- **ProgressRing / ProgressBar** — leave balance rings, profile completeness, run progress.
- **Stepper** — payroll run gates, onboarding runbook stages: done sage check, current clay, blocked brick with reason link.
- **CommentThread** — avatar, body, @mentions (notify), attachments, internal-note toggle (HR-only, ochre wash), edited mark.
- **DiffView** — before/after two-tone rows for audit & approval-of-change screens (CTC revision shows old→new per component).
- **EmptyState / ErrorState / ForbiddenState** — standardized blocks (serif headline, sentence, action).
- **Letterhead** — print band (logo, serif title, deckle rule) for payslip/Form 16/letters.
- **MoneyText** — ₹, Indian grouping, tabular; `words` prop adds "(Rupees One Lakh Twenty Thousand only)" for statements.

## 4. Overlays

- **Drawer** (right; 480 standard, 720 wide): header (title + status chip + ⋯), tabbed body, sticky footer actions; stacks max 2; Esc/scrim closes (guarded if dirty). THE pattern for record triage (employee peek, claim review, ticket, candidate).
- **Modal** (480 confirm / 640 form): for focused commits only — confirmations, single-step forms, bulk previews. Destructive confirm: brick header glyph, consequence sentence, typed `CONFIRM` for irreversible (delete run, purge data).
- **Popover** — filters, formula trace ("How was this computed?" on every payroll figure: component tree with values), column pickers.
- **Toast** — bottom-right, 5s, max 3 stacked, action slot ("Undo", "View"), `aria-live=polite`; sage/brick/ochre/slate accents.
- **Banner** — page-level: ochre (payroll window closing, proofs due), brick (failed disbursement file), slate (scheduled maintenance), plum (AI suggestion). Dismiss persists per user per key.
- **CommandPalette** — per doc 02 §5.
- **TourSpot** — first-run coach marks (max 3 per page, dismiss-all).

## 5. Domain composites (built from the above, live in `components/domain/`)

`LeaveBalanceRing` (type, used/total, accrual tooltip) · `AttendanceDayCell` (heat tone by hours + anomaly dot) · `PunchButton` (giant check-in/out with geo state + selfie capture) · `SalaryBreakupTable` (earnings/deductions/employer cost groups, totals verify row) · `CtcCalculator` (live gross↔CTC↔in-hand as components edit) · `PayslipDocument` (web + print twin) · `Form16Card` (FY, parts, sign status, download) · `TaxRegimeCompare` (old vs new side-by-side with savings line) · `ApprovalTrail` (chain visual: actor→state→time per step) · `PolicyAcknowledgeBar` (sticky: "I have read & agree" + SignaturePad) · `ClearanceMatrix` (dept × status grid for exits) · `ScorecardForm` (interview/appraisal criteria + anchored ratings) · `NineBox` (drag calibration grid) · `ShiftPill` (coded shift chip for roster cells) · `GoalTree` (OKR cascade) · `PermissionMatrix` (doc 10 §3 — module×action grid editor) · `AuditEventRow` · `ChallanCard` (statutory payment: period, amount, due chip, file link) · `OnboardingChecklist` · `AssetTag` · `InsuranceCard` · `RewardLedgerRow` · `CelebrationCard` · `AiPromptBar` (SkyNexus ask-anything input — plum accents).

## 6. Quality contract (per component, enforced in review)

1. Keyboard path + visible focus. 2. ARIA per APG pattern. 3. All 6 states designed (default/hover/focus/disabled/loading/error where applicable). 4. Dark theme verified. 5. RTL-safe paddings (logical properties). 6. Storybook story with controls + axe pass (`pnpm storybook`; CI gate). 7. No hex literals — tokens only (lint `pp/no-raw-color`).
