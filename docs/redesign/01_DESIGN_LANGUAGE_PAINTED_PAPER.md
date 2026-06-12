# 01 · Design Language — *Painted Paper · Indigo Ink*

The visual system for SKYLINX PeopleOS v2. Warm-grey paper surfaces, indigo-ink accent, muted gold highlights, painted (low-chroma) status hues, soft light, and faint grain. An **editorial ledger** identity of its own — built to be less eye-straining than any white SaaS dashboard and to stay legible through an 8-hour payroll day.

Everything here is normative. Token names map 1:1 to `assets/tokens.css`.

---

## 1. Mood

- **Reference feel:** a well-bound accounts ledger + a modern editorial site. Indigo ink on warm-grey paper; gold-leaf details used the way a bookbinder would — sparingly; sage/gold/brick wax-seals for status.
- **Anti-goals:** glassmorphism, neon gradients, electric SaaS blue (`#2563EB`-style glow), pure-white cards on cold grey, heavy borders, drop shadows darker than 8% ink. The indigo here is deep and ink-like, never luminous.

## 2. Color system

### 2.1 Neutrals — "paper & ink" (light theme, default)

| Token | Hex | Use |
|---|---|---|
| `--paper-0` | `#F1F0EB` | App canvas (warm-grey fog, with grain §7) |
| `--paper-1` | `#FAF9F5` | Cards, panels, table rows |
| `--paper-2` | `#E9E8E0` | Wells, table headers, inset areas, hover wash |
| `--paper-3` | `#DEDDD2` | Pressed states, selected row wash |
| `--ink-900` | `#20222B` | Primary text, icons (indigo-tinted near-black) |
| `--ink-700` | `#474B58` | Secondary text, labels |
| `--ink-500` | `#6F7280` | Muted text, captions, placeholders¹ |
| `--ink-300` | `#A9ABB4` | Disabled text, decorative glyphs |
| `--line-strong` | `#C8C8BF` | Input borders, emphasized dividers |
| `--line` | `#D9D8D0` | Card borders, table rules |
| `--line-soft` | `#E6E5DE` | Hairlines inside cards |

¹ `--ink-500` on `--paper-1` ≈ 4.6:1 — the minimum pair allowed for text.

### 2.2 Accent — indigo ink

| Token | Hex | Use |
|---|---|---|
| `--indigo-700` | `#38437A` | Active/pressed primary |
| `--indigo-600` | `#43508F` | **Primary buttons, focused accents** (7.0:1 on paper-1) |
| `--indigo-500` | `#5A68A8` | Hover, charts, selected glyphs |
| `--indigo-300` | `#AAB3D9` | Progress tracks, selection bg, decorative |
| `--indigo-100` | `#E8EBF6` | Tint wash (selected nav, callouts) |

Links are **ink, underlined**, turning indigo on hover — never default-browser blue.

### 2.3 Muted gold — highlight + warning family

| Token | Hex | Use |
|---|---|---|
| `--gold-600` | `#87671D` | Warning/pending text (AA on paper-1), warning chips |
| `--gold-500` | `#A8862D` | **Decorative highlight only** — brand monogram, pinned/star stamps, celebration glyphs, "featured" accents. Never body text, never buttons |
| `--gold-300` | `#D9C684` | Chip borders, underline flourishes |
| `--gold-100` | `#F3EBD2` | Warning wash, highlight wash |

Gold doubles as the warning family (pending, expiring, on-hold) — warnings always carry an icon or label, so decorative gold stamps and warning chips stay unambiguous.

### 2.4 Painted status hues (each with `-600` fg, `-100` wash, `-300` line)

| Family | 600 | 100 wash | 300 line | Meaning |
|---|---|---|---|---|
| **Sage** | `#5E7A57` | `#E8EDDF` | `#BFCFB4` | Success, approved, present, paid, active |
| **Gold** | `#87671D` | `#F3EBD2` | `#D9C684` | Pending, warning, expiring, on-hold |
| **Brick** | `#A8453A` | `#F4E0DA` | `#DFAF9F` | Rejected, overdue, LOP, errors, danger |
| **Slate** | `#5C6B7C` | `#E4E8ED` | `#B3BFCA` | Info, drafts, scheduled, neutral process (desaturated grey-blue — clearly distinct from accent indigo) |
| **Plum** | `#7B5E7E` | `#EDE5EE` | `#C9B4CB` | AI/SkyNexus, special states (sabbatical, secondment) |

Rules: washes only behind `-600` text of the same family or `--ink-900`; never place `-600` text on `-300`; status is **never conveyed by color alone** (always icon or label).

### 2.5 Dark theme — "Midnight Ledger"

Deep ink-blue-grey, not black; same token names, swapped values (see tokens.css `[data-theme="dark"]`):
canvas `#14151A`, surface `#1C1E25`, raised `#23252E`, well `#2A2D38` (pressed), text `#E7E5DC`, secondary `#B3B2AD`, muted `#85868D`, lines `#3A3C46`/`#2F313B`, accent lightens to `--indigo-600 #8E9CD4` (6.2:1; primary buttons become light-indigo with dark ink text), gold lightens to `#CDB269`, status hues lightened one step (sage `#8FAE85`, brick `#D08A7E`, slate `#93A7BB`). Washes become deep tints of the family hue. Elevation in dark = lighter surface + 1px line, not bigger shadow.

Theme switch: `system | light | dark` in the user menu, stored per user (`settings` module), applied via `data-theme` on `<html>`, no-flash inline script in `app/layout.tsx`.

### 2.6 Data-viz palette (ordered)

`indigo-500 → sage-600 → gold-500 → slate-600 → plum-600 → ink-300`, fills at 24% alpha with 600-weight strokes; gridlines `--line-soft`; axis text `--ink-500`. Single-metric charts always indigo. Charts must pass grayscale print.

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
  - `--shadow-1` `0 1px 2px rgba(32,34,43,.05)` — cards
  - `--shadow-2` `0 2px 6px rgba(32,34,43,.06), 0 8px 24px rgba(32,34,43,.07)` — popovers, drawers
  - `--shadow-3` `0 4px 12px rgba(32,34,43,.08), 0 16px 48px rgba(32,34,43,.10)` — modals, command palette
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
4. **Gold-leaf details:** `--gold-500` reserved for the brand monogram, pinned/star stamps, celebration glyphs and featured markers — the bookbinder's restraint is what keeps it premium.
5. **Serif numerals:** KPI figures render in Fraunces with old-style feel but `tabular-nums` — the brand moment on every dashboard.
6. **Cover pages:** printable documents (payslips, Form 16 cover, letters) get a letterhead band: company logo left, serif document title, deckle rule beneath.

## 8. Voice & microcopy

Sentence case everywhere (buttons, titles, labels). Verbs on buttons ("Run payroll", "Approve 4 selected"), never "Submit/OK". Empty states: one serif line + one sentence + one primary action ("No leave requests yet. Time off you apply for will appear here."). Errors: what failed + what to do + reference id. Dates: `12 Jun 2026`; times `09:42`; relative only under 7 days ("2 days ago").

## 9. Accessibility (WCAG 2.2 AA — release gate)

- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥18.66px bold/24px); verified token pairs listed in tokens.css comments; CI check via axe in Playwright.
- Focus: 2px `--indigo-600` ring, 2px offset, on **every** interactive element; `:focus-visible` only; never `outline: none` without replacement.
- Hit targets ≥ 40×40px (24px minimum spacing exception per 2.2).
- Full keyboard paths for: table row open, drawer close (Esc), palette (⌘K), approve/reject in Inbox (A/R), date pickers (arrows), matrix editor (doc 10).
- `aria-live="polite"` for toasts and async table refresh; row count announcements on filter.
- Forms: visible labels always (no placeholder-as-label), `autocomplete` attributes (fixes existing audit warning), error text linked via `aria-describedby`.
- Tables: `<th scope>`, caption or `aria-label`, sticky header announced.
- Language: `lang="en-IN"`; all icons decorative (`aria-hidden`) unless sole content.

## 10. Print & PDF discipline

`@media print`: grain off, `--paper-*` → white, ink → black, shadows off, sidebar/topbar/actions hidden via existing `.print-hide`, page margins 16mm (keep `globals.css` block). Documents with statutory layouts (payslip, Form 16, F&F statement, offer/relieving letters) use dedicated print stylesheets with the letterhead band (§7.6) and `break-inside: avoid` on tables. Server-side PDFs reuse identical HTML templates for pixel parity.

## 11. Responsive & density

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Sidebar: ≥lg expanded (240px), md rail (64px, labels in tooltip), <md hidden behind hamburger + bottom tab bar for the 5 ESS staples (Home, Time, Pay, Inbox, Menu). Tables <md collapse to key-value cards with the same row actions. All ESS "apply/submit/check-in" flows must complete on 360px width.
