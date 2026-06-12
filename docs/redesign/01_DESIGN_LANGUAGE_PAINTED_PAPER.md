# 01 · Design Language — *Painted Paper*

The visual system for SKYLINX PeopleOS v2. Warm paper surfaces, ink typography, a single clay accent, painted (low-chroma) status hues, soft light, and faint grain. Built to be **less eye-straining than any white SaaS dashboard** and to stay legible through an 8-hour payroll day.

Everything here is normative. Token names map 1:1 to `assets/tokens.css`.

---

## 1. Mood

- **Reference feel:** a well-bound ledger + a modern editorial site. Ink on warm paper; clay stamps for action; sage/ochre/brick wax-seals for status.
- **Anti-goals:** glassmorphism, neon gradients, pure-white cards on grey, saturated blue links, heavy borders, drop shadows darker than 8% ink.

## 2. Color system

### 2.1 Neutrals — "paper & ink" (light theme, default)

| Token | Hex | Use |
|---|---|---|
| `--paper-0` | `#F4F1E8` | App canvas (with grain, §7) |
| `--paper-1` | `#FBF9F2` | Cards, panels, table rows |
| `--paper-2` | `#EFEADC` | Wells, table headers, inset areas, hover wash |
| `--paper-3` | `#E6DFCC` | Pressed states, selected row wash |
| `--ink-900` | `#211E1A` | Primary text, icons |
| `--ink-700` | `#524C42` | Secondary text, labels |
| `--ink-500` | `#7E776A` | Muted text, captions, placeholders¹ |
| `--ink-300` | `#B3AB9A` | Disabled text, decorative glyphs |
| `--line-strong` | `#CFC7B2` | Input borders, emphasized dividers |
| `--line` | `#DFD9C7` | Card borders, table rules |
| `--line-soft` | `#EBE6D7` | Hairlines inside cards |

¹ `--ink-500` on `--paper-1` = 4.6:1 — the minimum pair allowed for text.

### 2.2 Accent — clay

| Token | Hex | Use |
|---|---|---|
| `--clay-700` | `#9D4A32` | Active/pressed primary |
| `--clay-600` | `#B85C3E` | **Primary buttons, focused accents** (4.6:1 on paper-1) |
| `--clay-500` | `#D97757` | Hover, charts, selected glyphs, dark-theme accent |
| `--clay-300` | `#EBAE92` | Progress tracks, decorative |
| `--clay-100` | `#F7E4D8` | Tint wash (selected nav, callouts) |

Links are **ink, underlined**, turning clay on hover — never blue.

### 2.3 Painted status hues (each with `-600` fg, `-100` wash, `-300` line)

| Family | 600 | 100 wash | 300 line | Meaning |
|---|---|---|---|---|
| **Sage** | `#5E7A57` | `#E8EDDF` | `#BFCFB4` | Success, approved, present, paid, active |
| **Ochre** | `#996F1F` | `#F3E9CF` | `#DCC98F` | Pending, warning, expiring, on-hold |
| **Brick** | `#A8453A` | `#F4E0DA` | `#DFAF9F` | Rejected, overdue, LOP, errors, danger |
| **Slate** | `#56718A` | `#E2E8EC` | `#AFC0CD` | Info, drafts, scheduled, neutral process |
| **Plum** | `#7B5E7E` | `#EDE5EE` | `#C9B4CB` | AI/SkyNexus, special states (sabbatical, secondment) |

Rules: washes only behind `-600` text of the same family or `--ink-900`; never place `-600` text on `-300`; status is **never conveyed by color alone** (always icon or label).

### 2.4 Dark theme — "lamplight ink"

Warm dark, not black; same token names, swapped values (see tokens.css `[data-theme="dark"]`):
canvas `#181612`, surface `#201D18`, raised `#27231D`, well `#131109`, text `#EAE3D4`, secondary `#B5AC9A`, muted `#897F6C`, lines `#3B352A`/`#2E2922`, accent shifts to `--clay-500 #D97757` (7.1:1), status hues lightened one step (e.g., sage `#8FAE85`). Washes become 16% alpha overlays of the family hue. Elevation in dark = lighter surface + 1px line, not bigger shadow.

Theme switch: `system | light | dark` in the user menu, stored per user (`settings` module), applied via `data-theme` on `<html>`, no-flash inline script in `app/layout.tsx`.

### 2.5 Data-viz palette (ordered)

`clay-500 → slate-600 → sage-600 → ochre-600 → plum-600 → ink-300`, fills at 24% alpha with 600-weight strokes; gridlines `--line-soft`; axis text `--ink-500`. Single-metric charts always clay. Charts must pass grayscale print.

## 3. Typography

| Role | Stack | Token |
|---|---|---|
| **Display/serif** | `"Fraunces", "Source Serif 4", Georgia, "Times New Roman", serif` | `--font-serif` |
| **UI sans** | `"Inter", "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif` | `--font-sans` |
| **Mono/figures** | `"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace` | `--font-mono` |

Self-host via `next/font` (no FOUT/CLS, no third-party request). Fraunces variable: optical size + weight axes; use `soft 0, wonk 0`.

### 3.1 Scale (rem; base 16px)

| Token | Size/Leading | Face | Use |
|---|---|---|---|
| `display` | 2.75/1.1 · 560wt | serif | Auth pages, empty-state heroes |
| `h1` | 2.125/1.2 · 540 | serif | Page titles |
| `h2` | 1.625/1.25 · 540 | serif | Section titles, drawer titles |
| `h3` | 1.25/1.3 · 600 | sans | Card titles |
| `h4` | 1/1.4 · 600 | sans | Sub-cards, table group heads |
| `body-l` | 1/1.55 · 400 | sans | Reading prose (policies, letters) |
| `body` | 0.875/1.5 · 400 | sans | **Default UI text** |
| `body-s` | 0.8125/1.45 · 400 | sans | Table cells (compact), meta |
| `caption` | 0.75/1.35 · 500 | sans | Labels, badges; +0.02em tracking; labels uppercase optional |
| `num-xl` | 2/1.1 · 560 | serif, `tabular-nums` | KPI figures |
| `num` | 0.875/1.4 · 500 | mono or sans `tabular-nums` | Amounts, IDs, dates in tables |

Global rules: `font-variant-numeric: tabular-nums` on all tables and amount fields; ₹ amounts right-aligned, 2 decimals, Indian digit grouping (`1,23,456.00`); nil = `–`; negative = brick + parentheses `(-1,200.00)` in payroll registers.

## 4. Space, radius, elevation

- **Spacing scale (px):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Card padding 20; section gap 24; page gutter 24 (16 mobile). Density `compact` multiplies row paddings ×0.6.
- **Radius:** controls 8 (`--r-control`), inputs/buttons 10, cards 14 (`--r-card`), drawers/modals 16, pills 999. Never mix radii within one component.
- **Borders:** 1px only. Elevation prefers *line + tint* over shadow.
- **Shadows (ink-tinted, soft):**
  - `--shadow-1` `0 1px 2px rgba(33,30,26,.05)` — cards
  - `--shadow-2` `0 2px 6px rgba(33,30,26,.06), 0 8px 24px rgba(33,30,26,.07)` — popovers, drawers
  - `--shadow-3` `0 4px 12px rgba(33,30,26,.08), 0 16px 48px rgba(33,30,26,.10)` — modals, command palette
- **Layering (z):** base 0 · sticky table head 10 · sidebar/topbar 20 · drawer 30 · modal 40 · palette 50 · toast 60.

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.32,.72,.18,1)` | Everything |
| `--t-fast` | 120ms | Hover, toggles, checkboxes |
| `--t-base` | 180ms | Drawers in, tabs, accordions |
| `--t-slow` | 240ms | Modals, palette, page fade (60ms opacity only) |

Skeleton shimmer 1.6s linear. Numbers may count-up once (400ms) on dashboard load only. `prefers-reduced-motion`: all transitions → 1ms, shimmer → static `--paper-2`.

## 6. Iconography

`lucide-react` (already in stack) at 16/18/20px, `stroke-width: 1.75`, color inherits text. Icons always paired with labels in nav and buttons (icon-only allowed only in table row-actions and topbar, with tooltip + `aria-label`). Module glyph set is fixed in doc 02 §3 so each module keeps one icon everywhere (nav, cards, palette, empty states).

## 7. Texture & ornament (the "painted paper" signature)

1. **Grain:** SVG `feTurbulence` noise (data-URI, ~3% opacity, `background-blend-mode: multiply`) on `--paper-0` canvas ONLY — never on cards, never behind dense tables; disabled in dark theme below 1.5%; excluded from print.
2. **Deckle rule:** section dividers may use the `.rule-ink` hairline — a 2px asymmetric double line (`--line-strong` over `--line-soft`) evoking a ruled ledger.
3. **Stamp chips:** status badges are pill chips with wash + 1px family line — like wax seals, not glowing dots.
4. **Serif numerals:** KPI figures render in Fraunces with old-style feel but `tabular-nums` — the brand moment on every dashboard.
5. **Cover pages:** printable documents (payslips, Form 16 cover, letters) get a letterhead band: company logo left, serif document title, deckle rule beneath.

## 8. Voice & microcopy

Sentence case everywhere (buttons, titles, labels). Verbs on buttons ("Run payroll", "Approve 4 selected"), never "Submit/OK". Empty states: one serif line + one sentence + one primary action ("No leave requests yet. Time off you apply for will appear here."). Errors: what failed + what to do + reference id. Dates: `12 Jun 2026`; times `09:42`; relative only under 7 days ("2 days ago").

## 9. Accessibility (WCAG 2.2 AA — release gate)

- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥18.66px bold/24px); verified token pairs listed in tokens.css comments; CI check via axe in Playwright.
- Focus: 2px `--clay-600` ring, 2px offset, on **every** interactive element; `:focus-visible` only; never `outline: none` without replacement.
- Hit targets ≥ 40×40px (24px minimum spacing exception per 2.2).
- Full keyboard paths for: table row open, drawer close (Esc), palette (⌘K), approve/reject in Inbox (A/R), date pickers (arrows), matrix editor (doc 10).
- `aria-live="polite"` for toasts and async table refresh; row count announcements on filter.
- Forms: visible labels always (no placeholder-as-label), `autocomplete` attributes (fixes existing audit warning), error text linked via `aria-describedby`.
- Tables: `<th scope>`, caption or `aria-label`, sticky header announced.
- Language: `lang="en-IN"`; all icons decorative (`aria-hidden`) unless sole content.

## 10. Print & PDF discipline

`@media print`: grain off, `--paper-*` → white, ink → black, shadows off, sidebar/topbar/actions hidden via existing `.print-hide`, page margins 16mm (keep `globals.css` block). Documents with statutory layouts (payslip, Form 16, F&F statement, offer/relieving letters) use dedicated print stylesheets with the letterhead band (§7.5) and `break-inside: avoid` on tables. Server-side PDFs reuse identical HTML templates for pixel parity.

## 11. Responsive & density

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Sidebar: ≥lg expanded (240px), md rail (64px, labels in tooltip), <md hidden behind hamburger + bottom tab bar for the 5 ESS staples (Home, Time, Pay, Inbox, Menu). Tables <md collapse to key-value cards with the same row actions. All ESS "apply/submit/check-in" flows must complete on 360px width.
