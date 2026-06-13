# §11 — Mobile & Accessibility

> Master plan §6 (mobile flows, WCAG 2.1 AA). Reference gestures + Flutter spec: `blueprint.md` §5.1/§5.3 + `reference_blueprint/project_roadmap_and_mobile_spec.md`. Tokens/components: §02. Responsive rules: §01 §8.
> Two parts: **A. Responsive web** (the Next.js app at small viewports) and **B. Accessibility** (release gate, all sections). Native Flutter app is a later phase (blueprint §4 §3) — backend is already mobile-ready (stateless JWT REST); this section specs the **web mobile** experience + the contract the native app inherits.

---

# A. RESPONSIVE WEB

## A1. Breakpoints & shell transforms (§01 §8)
sm640 · md768 · lg1024 · xl1280 · 2xl1536.
- **Sidebar**: ≥lg persistent 260px · md icon-rail 72px (tooltips) · <md hidden → **bottom tab bar** with 5 ESS staples: **Home, Attendance, Leave, Inbox, Menu** (Menu opens full nav drawer). (Fixes today's off-canvas-at-all-sizes, shell.md §1.1.)
- **Topbar**: <md collapses search into an icon → full-screen search overlay; quick-add + bell stay; breadcrumb truncates to current page.
- **Content**: padding 24/20/16 (desktop/tablet/mobile, reference §5.1); max-width 1440 centered.
- **Tables → RecordCards**: every DataTable (§02) collapses <md to a card list (avatar/title/meta/status + row actions in ⋯), preserving filters and bulk select.
- **Modals → bottom sheets**: dialogs become full-width bottom sheets (drag-down to dismiss; reference §5.3); wizards become single-column stepped sheets.
- **Drawers**: right-drawer → full-screen (100vw) sheet (reference §5.1).

## A2. The 6 mobile-first ESS flows (master plan §6) — must complete at 360px width
| Flow | Screen | Key interactions | API |
|---|---|---|---|
| **Clock in/out (GPS)** | §04 A1 PunchWidget | full-width punch button; GPS map w/ green geofence radius; swipe-up to punch (prevents double-tap, haptic on success, reference Flutter §B); offline queue + "will sync" | `POST /attendance/check-in|check-out` |
| **Apply leave** | §04 C1 | bottom-sheet (Leave Type tap-select, date-range swipe calendar, half-day toggle, reason+counter); drag-down dismiss draft | `POST /leave/requests` |
| **View payslip** | §05 B | payslip list → PayslipDocument (mobile-legible) → download PDF | `GET /payroll/runs/:id/payslips` (+NEW per-payslip GET/PDF) |
| **Approve** | §10 A | Inbox row **swipe right >70px = Approve (green), left = Reject (red)**; >50% auto-completes, <30% snaps back (reference §5.3); reject opens reason sheet | `POST /approvals/:module/:id/decision` |
| **Submit expense (camera)** | §05 D | amount → category → **Capture Receipt** (native camera, cropped thumbnail, upload spinner) | `POST /expenses` (+NEW receipt upload) |
| **Read announcement** | §07 B / §09 A1 | feed cards, pinned-first, tap to read (marks read) | `GET /announcements`, `POST /announcements/:id/read` |

## A3. Gestures (reference §5.3 — web where feasible, native later)
- **Roster drag-assign** (§04 A6): dragged block `rotate(2deg)` + `scale(95%)` + opacity `.85` + shadow; target cell green dashed `#2dd36f` + pulse. Keyboard/menu alternative required (a11y §B5).
- **Swipe row actions** (lists): left/right thresholds 70px, auto-complete 50%, snap-back 30%; always a visible button alternative (no swipe-only action).
- **Pull-to-refresh** on mobile lists (expenses, leaves, notifications).
- All gesture actions have a non-gesture equivalent (a11y).

## A4. Performance on mobile
Route JS budget (§02 §14) enforced; virtualized tables for rosters/registers; images lazy + sized; no Base64 media in feed (§07 A fix); skeletons not spinners; reduced-motion respected.

---

# B. ACCESSIBILITY (WCAG 2.1 AA — release gate; baseline declared in §02 §11)

## B1. Contrast & color
- All token pairs verified ≥4.5:1 (≥3:1 large ≥18.66px bold / 24px) — §02 §2 tables are the verified source; CI axe check.
- **Status never by color alone** — §02 §2.3 pills always carry label text + (optional) icon. Charts pass grayscale (§02 §2.4) + offer data-table toggle (§09).
- White-label brand override (§02 §7) must re-validate contrast; reject/auto-adjust tenant colors that fail.

## B2. Focus management
- Visible `:focus-visible` ring (2px brand.500 + 2px offset) on **every** interactive element; never `outline:none` without replacement.
- **Modals/drawers/sheets**: focus trapped while open, returned to trigger on close, `Esc` closes top layer only (§01 §6 layering), `aria-modal`, labelled by title.
- **Wizards** (§03 add-employee, §05 run room, §12 setup): focus moves to step heading on next/back; errors move focus to first invalid field.
- **Command palette** (§01 §6): focus to input on open, arrow-navigable, restores focus on close.

## B3. Semantics & screen readers
- Landmarks per region: `<nav>` (sidebar), `<header>` (topbar), `<main>` (content), `<aside>` (drawer); skip-to-content link.
- Tables: `<th scope>`, caption/`aria-label`, `aria-sort` on sortable headers, row-count announced on filter (`aria-live`), sticky header announced.
- Forms (§02 §8.2): **visible labels always** (no placeholder-as-label), `autocomplete` attributes (**fixes the two known audit warnings** — master plan §6 / inventories), errors linked via `aria-describedby`, required state announced.
- Live regions: toasts + async table refresh `aria-live="polite"`; destructive confirmations `role="alertdialog"`.
- Icons decorative `aria-hidden` unless sole content (then `aria-label`).
- `lang="en-IN"` on `<html>` (**fix**: today `en`, shell.md §8); localization framework keys (§08) for future.

## B4. Hit targets & input
- Interactive targets ≥40×40px (24px min spacing exception per 2.2); generous on mobile.
- Everything operable by keyboard (§01 §9 map): table row open (`o`/↵), drawer Esc, palette ⌘K, inbox `a`/`r`, date pickers (arrows), **PermissionMatrix** (arrows + space, §08 B), roster (move-to menu alt to drag).
- No keyboard traps; logical tab order matches visual order; RTL-safe logical CSS properties.

## B5. Motion & preferences
- `prefers-reduced-motion`: transitions ≤1ms, skeleton shimmer static, no count-up, no pulse (§02 §4).
- `prefers-color-scheme` feeds the `system` theme default (§02 §6).
- Density toggle (§02 §5) persists; compact mode keeps ≥40px targets via spacing not shrinking hit area below minimum.

## B6. Testing & gate
- **axe** (serious/critical = 0) per page in Playwright; **keyboard-path e2e** for the top 12 flows (login, punch, apply leave, approve, payslip, add employee, run payroll preview, permission edit, settings save, report run, ticket raise, policy ack).
- Manual screen-reader script (NVDA/VoiceOver) on the 6 mobile flows + 1 of each overlay type.
- Storybook a11y addon per component (§02 §14); contrast lint on tokens; visual-regression light/dark/compact.
- Print/PDF (§02 §12) legible in grayscale; statutory docs keep structure when CSS off.

---

## C. Native Flutter contract (later phase — blueprint §4 §3)
Backend already stateless-JWT-REST. Native app (BLoC/Dio/Secure-Storage/FCM/Geolocator) consumes the same endpoints; bottom-nav (Home/Attendance/Leave/Expense/Profile); geofenced punch (swipe-up + haptic), camera receipt, payslip PDF offline, FCM push for approvals/payroll/shift. Hardware features (selfie/face punch, biometric device sync, kiosk, offline attendance) are the native phase per blueprint §4 §3. **This web section's flows + the API contract are the spec the native app mirrors.**

## D. Backlog (this section)
Bottom tab bar; table→card + modal→sheet transforms; swipe actions w/ button fallback; camera receipt upload (needs §05 receipt endpoint); `lang="en-IN"` + no-flash theme script; autocomplete attrs; focus-trap utilities; axe + keyboard e2e gate; per-payslip/PDF endpoint for mobile payslip.
