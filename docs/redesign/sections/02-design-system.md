# §02 — Design System

> Foundation for every other section. Replaces `apps/web/components/ui.tsx` (4 components, shell.md §4) and the hardcoded-hex shell (shell.md §0.5/§8). Direction from master plan §4: a **distinct identity off Kredily's `#078ced`**, named tokens (not hex), white-label runtime theming, semantic status system, dark mode + density. Reference dimensions reused from blueprint.md §5.1.
> **Naming rule (binding):** components and screens reference **token names** (`color.brand.600`, `space.4`, `radius.card`) — never raw hex. The token→hex table here is the single place hex lives.

---

## 1. Brand identity

**Primary = Indigo** (a deep, confident violet-blue), deliberately off Kredily's bright `#078ced` and off competitor blues; pairs with warm-graphite neutrals and an amber accent. Enterprise, calm, high-contrast. Runtime-themeable: a tenant's `branding.primaryColor` (rbac-settings B1) overrides `--color-brand-600` and the scale is re-derived, so white-label tenants keep accessible contrast.

| Token | Hex (default) | Use |
|---|---|---|
| `color.brand.50` | `#EEF0FF` | tint backgrounds, selected nav |
| `color.brand.100` | `#E0E3FF` | hover wash, chips |
| `color.brand.300` | `#A9B0F5` | borders on tint, disabled brand |
| `color.brand.500` | `#6366F1` | secondary brand, focus ring |
| `color.brand.600` | `#4F46E5` | **primary action** (AA on white) |
| `color.brand.700` | `#4338CA` | hover/active primary |
| `color.brand.900` | `#312E81` | brand text on tint |

## 2. Color tokens

### 2.1 Neutral ramp (warm graphite)
| Token | Light | Dark | Use |
|---|---|---|---|
| `surface.canvas` | `#F7F8FA` | `#0E1116` | app background |
| `surface.raised` | `#FFFFFF` | `#171B22` | cards, panels, table rows |
| `surface.sunken` | `#F1F3F6` | `#0A0D11` | wells, table header, inset |
| `surface.hover` | `#F3F4F7` | `#1E232B` | row/control hover |
| `surface.selected` | `var(brand.50)` | `#1B2030` | selected row |
| `border.subtle` | `#EBEDF1` | `#232932` | hairlines inside cards |
| `border.default` | `#DDE1E7` | `#2C333D` | card/input borders, table rules |
| `border.strong` | `#C5CBD4` | `#3A424E` | emphasized dividers, input focus base |
| `text.primary` | `#161A20` | `#E8EBF0` | body text, headings |
| `text.secondary` | `#4B5563` | `#AEB6C2` | labels, secondary |
| `text.muted` | `#6B7280` | `#8B95A3` | captions, placeholder (AA ≥4.5:1 on raised) |
| `text.disabled` | `#9AA2AE` | `#5A6472` | disabled only |
| `text.onBrand` | `#FFFFFF` | `#FFFFFF` | text on brand.600 |

### 2.2 Semantic (each: `fg` text/icon, `bg` wash, `border`) — light / dark
| Family | fg | bg | border | Meaning |
|---|---|---|---|---|
| `success` | `#0F7A4D` / `#56C98A` | `#E6F6EE` / `#10271C` | `#A7E0C2` / `#1E4332` | active, verified, approved, paid, present, completed |
| `warning` | `#9A6700` / `#E0B341` | `#FBF1D9` / `#2A2210` | `#EBD08A` / `#4A3C16` | pending, draft, open, probation, notice period, on-hold, due |
| `danger` | `#B42318` / `#F0817A` | `#FCE9E7` / `#2B1614` | `#F0B3AE` / `#52211C` | rejected, exited, overdue, LOP, failed, error |
| `info` | `#1357C4` / `#6BA6F5` | `#E7F0FE` / `#11203A` | `#AECBF5` / `#1E3A63` | info, scheduled, processing, in-review |
| `neutral` | `var(text.secondary)` | `var(surface.sunken)` | `var(border.default)` | inactive, hold, reverted, archived, n/a |

### 2.3 Status-pill semantic map (single source of truth — `lib/status-map.ts`, NEW)
Replaces per-console tone guesses (shell.md §4). Every status string in the app maps to one family. Consumers call `<StatusPill status={row.status} />` — never pick a color by hand.

| Status strings (from schema `ApprovalStatus` + module statuses) | Family |
|---|---|
| `ACTIVE, VERIFIED, APPROVED, PAID, PRESENT, COMPLETED, RELEASED, HIRED, SETTLED, ACKNOWLEDGED` | success |
| `PENDING, DRAFT, OPEN, PROBATION, NOTICE_PERIOD, HOLD, SELF_DONE, MANAGER_DONE, ON_LEAVE, DUE, EXPIRING` | warning |
| `REJECTED, EXITED, CONVERTED_LOP, CONVERTED_TO_LOP, FAILED, OVERDUE, ABSENT, BREACHED, LAPSED` | danger |
| `SCHEDULED, IN_REVIEW, PROCESSING, IN_PROGRESS, SUBMITTED, BOOKED, INVESTIGATING` | info |
| `INACTIVE, REVERTED, ARCHIVED, CANCELLED, WITHDRAWN, NOT_REQUIRED, NONE` | neutral |
> Unknown/unmapped status → neutral + console warning in dev. Pill always shows label text (never color-only — a11y §11).

### 2.4 Data-viz palette (ordered, for §09 charts)
`brand.600 → #0EA5A4 (teal) → #F59E0B (amber) → #8B5CF6 (violet) → #EC4899 (pink) → #64748B (slate)`; fills at 18% alpha + 600 stroke; gridlines `border.subtle`; axis text `text.muted`. Single-metric charts use brand. Must pass grayscale print.

## 3. Typography
- **Sans (UI):** `Inter` (self-host via `next/font`, `display:swap`), fallback `system-ui, "Segoe UI", Roboto, sans-serif`. (Shell has no font today — shell.md §8.)
- **Mono (figures/IDs/code):** `"JetBrains Mono", ui-monospace, monospace`. **Money & IDs use `font-variant-numeric: tabular-nums`** (master plan §5.3).

| Token | size/line/weight | use |
|---|---|---|
| `text.display` | 30/36 · 600 | auth, empty-state hero |
| `text.h1` | 24/32 · 600 | page title (shell `<h1>`) |
| `text.h2` | 20/28 · 600 | section / drawer title |
| `text.h3` | 16/24 · 600 | card title |
| `text.body` | 14/20 · 400 | **default UI text** |
| `text.bodySm` | 13/18 · 400 | table cells, meta |
| `text.caption` | 12/16 · 500 | labels, badges (+0.01em) |
| `num.kpi` | 28/34 · 600 tabular | KPI figures (MetricCard) |
| `num.cell` | 13/18 · 500 tabular | amounts/IDs in tables |

## 4. Space · radius · elevation · motion
- **Space scale (px):** `0,2,4,8,12,16,20,24,32,40,48,64` → tokens `space.0…space.16`. Card padding `space.5` (20); section gap `space.6` (24); page gutter 24/16 (blueprint.md §5.1).
- **Radius:** `radius.control` 8 · `radius.input` 8 · `radius.card` 12 (reference) · `radius.overlay` 16 · `radius.pill` 999.
- **Elevation (shadow):** `elev.1` `0 1px 2px rgba(16,20,30,.06)` (cards) · `elev.2` `0 4px 12px rgba(16,20,30,.08)` (popover/drawer) · `elev.3` `0 12px 32px rgba(16,20,30,.12)` (modal/palette). Dark mode: lighter surface + border, not bigger shadow.
- **Z-index:** sticky-table-head 10 · sidebar/topbar 20 · drawer 30 · modal 40 · palette 50 · toast 60.
- **Motion:** `ease.standard` `cubic-bezier(.2,.6,.2,1)`; `dur.fast` 120ms (hover/toggle) · `dur.base` 180ms (drawer/tab) · `dur.slow` 240ms (modal/palette). Skeleton shimmer 1.5s. `prefers-reduced-motion` → all ≤1ms, shimmer static.

## 5. Density
Two modes via `data-density` on `<html>`, persisted per user (NEW user-pref): **comfortable** (default; table row 48px, input 40px) and **compact** (row 36px, input 34px, paddings ×0.7). All tables expose a density toggle in the toolbar (§ table below).

## 6. Dark mode
`data-theme="system|light|dark"` on `<html>`, persisted per user; no-flash inline script in `app/layout.tsx` (NEW — layout currently bare, shell.md §8). All tokens have dark values (§2). Status washes become dark tints. Charts re-map to dark grid/axis.

## 7. White-label theming
On load (or SSR from `/settings/public-profile`), write `branding.primaryColor → --color-brand-600` and derive 50–900 (HSL lightness steps); `branding.logoDataUrl`, `platformBrand`, `clientDisplayName`, `showPoweredBy` flow to the shell. Fixes shell.md §0.4 (single brand source; kill the `#176b87` vs `#078ced` split — both replaced by `--color-brand-*`).

---

## 8. Component library (`components/ui/*`, NEW)
Every component: token-only styling, `className` passthrough, sizes `sm|md(default)|lg`, `:focus-visible` ring `2px brand.500 + 2px offset`, disabled = `text.disabled` + `not-allowed` + optional `disabledReason` tooltip, all 6 states where applicable (default/hover/focus/disabled/loading/error). Built on Radix primitives for a11y (dialog/popover/select/tabs/tooltip/dropdown/checkbox/radio/switch) + `cmdk` (palette) + `@tanstack/react-table` (DataTable) + `react-hook-form`+`zod` (forms) + `recharts` (charts).

### 8.1 Actions
- **Button** — variants `primary` (brand.600), `secondary` (raised + border.strong), `ghost` (transparent, hover surface.hover), `danger` (danger.fg), `link` (brand, underline on hover). `loading` (spinner replaces leading icon, width locked), icon slots, `confirmHold` for irreversible micro-actions. **One primary per region** (lint `pp/one-primary`).
- **IconButton** — square 32/36/40, tooltip + `aria-label` required.
- **SplitButton / MenuButton** — primary + dropdown (e.g. "Approve ▾ Approve & next").

### 8.2 Inputs (all wrapped by **FormField**: label + required/optional tag + control + help + error linked via `aria-describedby`; labels always visible, no placeholder-as-label — fixes shell a11y gap)
Input · Textarea (autosize + counter when `maxLength`) · **NumberInput** (right-aligned tabular) · **MoneyInput** (₹ prefix, Indian grouping on blur, 2dp — money screens, master plan §5.3) · **Select** (Radix, searchable ≥8 opts) · **MultiSelect** (chips + "select all in filter") · **Combobox** (async; presets `EmployeePicker`, `DepartmentPicker`, `DesignationPicker`, `LocationPicker`) · **DatePicker** / **DateRangePicker** (FY presets; min/max; disabled-dates fn; holiday dots for §04) · **TimePicker** · **MonthPicker** (payroll periods) · **Checkbox** / **Radio** / **RadioCard** (rich tiles, e.g. tax regime) · **Switch** (inline saving tick) · **Slider** (KRA weights, paired numeric) · **FileUpload** (dropzone, type/size rules surfaced, per-file progress, thumbnail; reference: .pdf/.jpg/.png ≤5MB, 120px — blueprint §5.2; `documentKind` applies PII handling) · **OTPInput** (6 cells, paste-aware — for §12 OTP) · **SearchInput** (debounced, `/` shortcut) · **FormulaInput** (mono, token autocomplete for `CTC * n`, live test — §05 salary templates, money.md §1.4).

### 8.3 Form layout
**FormSection** (h3 + divider + 2-col grid → 1-col mobile, per reference) · **FormFooter** (sticky: Cancel ghost + primary; saving state; "Saved · just now") · **Wizard** (numbered rail, validate-on-next, draft autosave — §03 add-employee, §05 payroll run, §12 setup) · **InlineEdit** (view→input swap for profile fields, fixes core-hr.md §1.1 silent-drop by sending only edited fields).

### 8.4 Data display
- **DataTable** (the workhorse — replaces every bespoke `live-tables.tsx` table). Toolbar: SearchInput · FilterBar (chips w/ operators, "+ Filter" from column registry) · SavedViews · ColumnPicker · density toggle · Export (CSV/XLSX, perm-gated `*.export`) · primary action slot. Header: sticky, sortable (`aria-sort`), resizable, pin first col. Rows: hover, selectable (checkbox), row click → drawer/detail; row actions = max 2 inline IconButtons + ⋯ menu. Cells: text / num (tabular) / money / date / Avatar+name / StatusPill / progress / chips / **masked PII** (•••• + reveal-with-permission, audit event — core-hr.md §0.3). Bulk bar (slides up): "N selected · <actions> · Clear"; destructive bulk previews affected rows. **States: skeleton rows · empty (icon+line+CTA) · filtered-empty (Clear) · error (retry + ref id) · forbidden.** Pagination: 25/50/100 + "Showing 1–N of M"; **server-side pagination/sort/filter is a NEW backend need** (every inventory flags full-table loads — core-hr §1.1, money §4.5, etc.). Mobile: collapses to RecordCard list. Variants: `TreeTable` (org/departments), virtualized (rosters, audit, payroll register).
- **MetricCard / KpiRow** — caption + tabular value + delta chip (▲success/▼danger + "vs last period") + optional sparkline; click → filtered list. (Replaces ui.tsx MetricCard whose note is always green.)
- **DescriptionList** (label/value pairs, copyable IDs) · **RecordCard** (mobile/board) · **Timeline** (actor+action+time+diff popover — §03 career/audit) · **KanbanBoard** (DnD + keyboard move-to; §06 recruitment, §03 onboarding) · **CalendarView / MonthGrid** (§04 leave/holiday/roster; reference drag specs §5.3) · **OrgChartNode** (§03 org chart) · **ProgressRing / ProgressBar** (leave balances, completeness) · **Stepper** (§05 payroll, §03 lifecycle) · **Charts** wrapper (recharts, tokens-only, data-table toggle for a11y).

### 8.5 Overlays
- **Drawer** (right; 450 standard / 720 wide per reference §5.1): header (title + StatusPill + ⋯), tabbed body, sticky footer; Esc/scrim close (guarded if dirty); stacks max 2. The pattern for record triage (employee, claim, candidate, ticket).
- **Modal** (600 dialog / 800 wizard per reference): focused commits only; destructive confirm = danger header + consequence sentence + typed `CONFIRM` for irreversible (delete run, purge).
- **Popover** (filters, formula-trace "How computed?" for every payroll figure — §05) · **Tooltip** (Radix, 320ms) · **Toast** (bottom-right, 5s, max 3, action slot, `aria-live=polite`) · **Banner** (page-level: warning/danger/info, dismiss persists per key — e.g. declaration window closing) · **CommandPalette** (⌘K, NEW — §01) · **ConfirmDialog** (standardized destructive confirm).

### 8.6 Feedback & status
**StatusPill** (uses §2.3 map; replaces ui.tsx StatusPill) · **Badge / CountBadge** (nav counts) · **Avatar / AvatarGroup** (initials on deterministic tint, photo when present) · **EmptyState / ErrorState / ForbiddenState** (icon + headline + sentence + action — replaces ui.tsx DataState; ForbiddenState offers "request access" → §07 helpdesk) · **Skeleton** (block/row/card) · **Kbd** (palette/shortcuts).

### 8.7 Navigation chrome (consumed by §01)
**Sidebar** (grouped, collapsible, active state, count badges) · **Topbar** (breadcrumb + global search + quick-add + notifications + theme + avatar menu) · **Breadcrumbs** · **Tabs** (Radix, keyboard) · **Pagination** · **PageHeader** (serif/h1 title + subtitle + context chips + one primary action).

## 9. Domain composites (`components/domain/*`, built from §8 — referenced by §03–§09)
`SalaryBreakupTable`, `CtcCalculator`, `PayslipDocument` (web+print twin, replaces fabricated breakdown money.md §1.2), `Form16Card`, `TaxRegimeCompare`, `LeaveBalanceRing`, `AttendanceDayCell`, `PunchWidget` (single, geofence-aware — replaces the 2 overlapping widgets time.md §1), `ApprovalTrail`, `PermissionMatrix` (§08 grid), `ClearanceMatrix` (§03 exits), `ScorecardForm` (§06), `ChallanCard` (§05 compliance), `PolicyAcknowledgeBar`, `OnboardingChecklist`.

## 10. Iconography
`lucide-react` (already in stack), 16/18/20px, stroke 1.75, inherits text color. One fixed glyph per module (the §01 nav registry) reused in cards/palette/empty states. Icon-only allowed only with tooltip + `aria-label`. Remove dead `Link2` import (shell.md §2.4).

## 11. Accessibility baseline (WCAG 2.1 AA — release gate; detail in §11)
Token pairs verified ≥4.5:1 (≥3:1 large); focus ring on every interactive el; hit target ≥40px; full keyboard paths (table row open, drawer Esc, palette ⌘K, approve/reject A/R, date pickers, matrix editor); `aria-live` toasts + async table refresh; visible labels + `autocomplete` (fixes the two audit warnings); `<th scope>`; `lang="en-IN"` (layout currently `en`); status never color-only (§2.3); reduced-motion (§4).

## 12. Print
Keep `globals.css` `.print-area`/`.print-hide`/`@page 16mm`. Statutory docs (payslip, Form 16, F&F, letters, ID card) get dedicated print stylesheets with a **white-label letterhead band** (fixes hardcoded "Skylinx / Mumbai" letterhead, core-hr.md §1.15). Server PDFs reuse identical HTML for parity.

## 13. Migration from current `ui.tsx`
| Current | Replacement |
|---|---|
| `Card` | `ui/Card` (token-styled) |
| `StatusPill` (manual tone) | `ui/StatusPill` + `lib/status-map.ts` |
| `MetricCard` (note always green) | `ui/MetricCard` (delta sentiment-aware) |
| `DataState` (loading/empty/error) | `ui/Skeleton` + `EmptyState` + `ErrorState` + `ForbiddenState` |
| bespoke tables (`live-tables.tsx`) | `ui/DataTable` |
| bespoke forms (`action-panels.tsx`) | `ui/FormField` + controls + `Wizard` |
| inline hex everywhere | tokens (§2) |
Keep behavior parity per phase (master plan §8 P0); audit stays green.

## 14. Implementation notes
- Tokens as CSS custom properties in `app/tokens.css` (light + `[data-theme=dark]` + `[data-density=compact]`), mapped into `tailwind.config.ts` (`colors`, `borderRadius`, `boxShadow`, `fontFamily`, `darkMode:['selector','[data-theme="dark"]']`). Replace the 4-token tailwind config (shell.md §8).
- Lint: `pp/no-raw-color` (tokens only), `pp/one-primary`.
- Storybook + axe per component (CI gate); visual-regression on the kit + key pages, light/dark, both densities.
