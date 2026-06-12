# 02 · App Shell & Navigation Architecture

Replaces the flat 34-item sidebar (`components/nav-items.tsx`) and `app-shell-frame.tsx` with a role-shaped, grouped, keyboard-first shell.

---

## 1. Shell anatomy

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │ Topbar (56px): breadcrumb · ⌘K search · quick-add(+) │
│ Sidebar  │          theme · notifications(🔔) · help · avatar    │
│ (240px)  ├──────────────────────────────────────────────────────┤
│ grouped, │ Page header: serif H1 · context chips · actions      │
│ collaps- │ (sticky on scroll, condenses to 40px)                 │
│ ible     ├──────────────────────────────────────────────────────┤
│ rail@md  │ Content region (max-w 1440 centered; full-bleed for  │
│          │ tables/boards) — canvas --paper-0 + grain,           │
│          │ surfaces --paper-1                                    │
└──────────┴──────────────────────────────────────────────────────┘
Overlays: right Drawer (480/720px) · Modal (480/640px) · ⌘K palette · Toasts (bottom-right)
```

- **Sidebar:** company logo + tenant name; groups with caption-style headers; items = icon + label (+count chip for Inbox); active item = `--indigo-100` wash + 2px indigo left rail + ink text. Collapse control persists per user. md → 64px icon rail with tooltips; <md → hamburger + bottom tab bar (Home, Time, Pay, Inbox, Menu).
- **Topbar:** breadcrumb (`Module / Page / Record`), global search field (placeholder "Search people, pages, actions… ⌘K"), **Quick add (+)** menu (permission-filtered: Add employee, Apply leave, New claim, New ticket, New requisition, Run payroll…), theme toggle, notification bell with unread dot + drawer preview, help (docs + "Ask SkyNexus"), avatar menu (profile, my settings, theme, switch role-view for OWNER, sign out).
- **Page header:** serif H1 (e.g., *Payroll*), context chips (fiscal year, location filter where relevant), right-aligned action set — exactly one indigo primary.
- **Footer (sparse):** environment badge for non-prod, app version, status link.

## 2. Information architecture — navigation groups

Permission-gated: a group renders only if ≥1 item is visible; items map to `module.action` checks listed in §4.

| Group | Items (icon) | Visible to |
|---|---|---|
| *(ungrouped)* | **My Desk** (LayoutDashboard) · **Inbox** (CheckSquare, count) · **Calendar** (CalendarDays) | all |
| **People** | Directory (Users) · Org Chart (GitFork) · Onboarding (UserPlus) · Exits & F&F (UserMinus) · Documents & Letters (FileCheck2) · ID Cards (IdCard) | HR/admin; Directory+OrgChart all |
| **Time** | Attendance (Fingerprint) · Shifts & Roster (CalendarClock) · Leave (CalendarCheck) · Holidays (CalendarDays) | all (scope-shaped) |
| **Pay** | Payroll (BadgeIndianRupee) · Salary Structures (Layers3) · My Pay & Tax (Wallet — ESS) · Expenses (ReceiptText) · Loans & Advances (HandCoins) · Insurance & Benefits (HeartPulse) · Compliance & Filings (Landmark) | payroll.* for ops; ESS sees My Pay & Tax, Expenses, Insurance |
| **Talent** | Recruitment (BriefcaseBusiness) · Performance (Target) · Training & Skills (GraduationCap) · Surveys (ClipboardList) | gated |
| **Workplace** | Helpdesk (CircleHelp) · Grievance & POSH (ShieldAlert) · Travel Desk (Plane) · Assets (Boxes) · Policies (BookOpenCheck) · Announcements (Megaphone) · SkyNexus Social (MessageSquareText) · Rewards (Trophy) | all (scope-shaped) |
| **Insight** | Analytics (TrendingUp) · Reports (FileText) | analytics.read / reports.read |
| **Admin** | Settings (Settings) · Security & Audit (ShieldCheck) · Billing & Plan (CreditCard) · SaaS Admin (Building2 — platform owner only) · Setup Wizard (Sparkles — until completed, then inside Settings) | configure perms |

Rules: max 8 visible items per group; HR power-surfaces (e.g., Leave **Policies**) live as tabs inside the module, not separate nav entries — that's how 34 entries collapse to ~22 max (HR) / ~12 (ESS).

## 3. Module glyph registry (fixed, used everywhere)

Dashboard `LayoutDashboard` · Inbox `CheckSquare` · Calendar `CalendarDays` · Employees `Users` · OrgChart `GitFork` · Onboarding `UserPlus` · Exits `UserMinus` · Documents `FileCheck2` · Cards `IdCard` · Attendance `Fingerprint` · Roster `CalendarClock` · Leave `CalendarCheck` · Holidays `CalendarDays` · Payroll `BadgeIndianRupee` · Structures `Layers3` · MyPay `Wallet` · Expenses `ReceiptText` · Loans `HandCoins` · Insurance `HeartPulse` · Compliance `Landmark` · Recruitment `BriefcaseBusiness` · Performance `Target` · Training `GraduationCap` · Surveys `ClipboardList` · Helpdesk `CircleHelp` · Grievance `ShieldAlert` · Travel `Plane` · Assets `Boxes` · Policies `BookOpenCheck` · Announcements `Megaphone` · Social `MessageSquareText` · Rewards `Trophy` · Analytics `TrendingUp` · Reports `FileText` · Settings `Settings` · Security `ShieldCheck` · Billing `CreditCard` · SaaS `Building2` · AI `Sparkles`.

## 4. Full sitemap (route → purpose → primary permission)

### Home
| Route | Purpose | Permission |
|---|---|---|
| `/home` | Role-aware My Desk (replaces `/dashboard`) | session |
| `/inbox` | Unified approvals + tasks + mentions (replaces `/approvals`) | session |
| `/calendar` | Me/Team/Company calendar: leave, holidays, interviews, reviews, payroll dates | session |

### People
`/people` directory · `/people/new` (wizard) · `/people/[id]` Employee 360 (tabs: Overview, Job, Pay, Time, Documents, Assets, Performance, Training, Timeline, Access) · `/people/org-chart` · `/people/onboarding` (board + `/people/onboarding/[id]` runbook) · `/people/exits` (board + `/people/exits/[id]` runbook incl. F&F) · `/people/documents` (org-wide doc & letter center) · `/people/cards` (ID/visiting card studio) — `employees.*`

### Time
`/time/attendance` (Me | Team | Everyone | Anomalies | Rules tabs) · `/time/roster` (planner, shifts, rotations, change requests) · `/time/leave` (Me | Team | Everyone | Types & Policies | Year-end) · `/time/holidays` (calendars per location) — `attendance.*`, `leave.*`, `holidays.*`

### Pay
`/pay/payroll` (runs list → `/pay/payroll/run/[id]` run room) · `/pay/structures` (components, templates, assignments, revisions) · `/pay/me` (ESS: payslips, CTC view, tax regime & declarations, proofs, **Form 16 downloads**, loans) · `/pay/expenses` (claims, approvals, categories admin) · `/pay/loans` · `/pay/insurance` (policies, enrollments, claims) · `/pay/compliance` (PF/ESI/PT/TDS workbenches, challans, **Form 16 center**, 24Q, registers) — `payroll.*`, `expenses.*`, `compliance.*`

### Talent
`/talent/recruitment` (requisitions, jobs, pipeline `/jobs/[id]`, candidates `/candidates/[id]`, offers, interviews-as-interviewer) · `/talent/performance` (cycles `/cycles/[id]`, my reviews, team reviews, calibration, goals) · `/talent/training` (catalog, sessions, my learning, skills matrix) · `/talent/surveys` (list, builder, results; `/s/[token]` public fill) — `recruitment.*`, `performance.*`, `training.*`

### Workplace
`/work/helpdesk` (+`/[id]`) · `/work/grievance` (+case room) · `/work/travel` (+`/[id]`) · `/work/assets` (+`/[id]`) · `/work/policies` (+reader `/[id]`) · `/work/announcements` · `/work/social` · `/work/rewards`

### Insight
`/insight/analytics` (domain dashboards) · `/insight/reports` (catalog, `/insight/reports/[id]` runner, schedules)

### Admin
`/admin/settings` (hub; sections per doc 10) · `/admin/security` (roles & permissions, SSO/MFA, sessions, IP, audit, logs) · `/admin/billing` (plan, invoices, payments) · `/admin/saas` (platform: tenants, plans, payments — OWNER) · `/setup` (first-run wizard)

### Auth & misc
`/login` (+OTP, forgot, reset) · `/signup` (tenant create) · `/welcome/[token]` (preboarding portal) · `/profile` → redirects to `/people/[me]` · `/404`, `/403`, `/offline`

**Legacy redirects:** every current route (`/dashboard`, `/employees`, `/approvals`, `/support`, …) 301-redirects to its v2 home; bookmarks survive.

## 5. Command palette (⌘K) — system-wide

Sections, in rank order: **Actions** (permission-filtered verbs: "Apply leave", "Run payroll for June", "Add employee", "Approve pending (4)") → **People** (fuzzy on name/emp-code/email; ↵ opens 360, → peek card) → **Pages** → **Records** (recent + indexed: claims, tickets, candidates, runs) → **Help & policies** (deep into policy reader) → **Ask SkyNexus AI** (fallback row, opens AI drawer with the query).
Implementation: `cmdk` lib; server search endpoint `GET /search?q=` federating employees/pages/records with permission trimming; recents cached client-side. Esc layers: palette → drawer → modal (one per press).

## 6. Notifications

Bell → drawer (last 30, grouped Today/Earlier; filter chips All | Approvals | Mentions | System). Each item: module glyph, one-line serif-free text, timestamp, unread dot; click deep-links. "Mark all read" + per-user preferences link (`/admin/settings/notifications` matrix: event × channel in-app/email/none — backed by existing `notifications` + `settings` modules). Toasts only for actions the user just took; never for ambient events (those go to the bell).

## 7. Global patterns

- **Breadcrumbs** from route segments; record crumb uses display name ("Payroll / June 2026 / Run #PR-0061").
- **Context keeper:** list → record keeps filters in URL query (`?status=pending&dept=eng`); back restores scroll.
- **Saved views** on every major table (filters+columns+sort+density named per user; HR can publish org-wide views).
- **Quick-add (+)** items map to the same forms as in-module CTAs (single source).
- **Unsaved-changes guard** on all forms (modal: Stay / Discard).
- **Session expiry:** soft re-auth modal preserving form state.
- **Multi-entity scope-switcher** chip in topbar when company has >1 legal entity/location scope (filters all lists).

## 8. Keyboard map (global)

`⌘K` palette · `g h` home · `g i` inbox · `g p` people · `g l` leave · `g y` payroll · `c` context "create" · `/` focus list filter · `j/k` row navigate · `o`/`↵` open row · `x` select row · `a`/`r` approve/reject (Inbox) · `]`/`[` collapse sidebar · `?` shortcut sheet · `Esc` close top layer.

## 9. Shell loading & resilience

- App boot: sidebar + topbar render immediately from session cache; content area shows page skeleton (never full-screen spinner).
- Offline banner (gold) with retry; check-in queue stores punches locally and syncs (doc 06).
- 403 inside shell: friendly "You don't have access — request it" page that can raise a Helpdesk ticket pre-filled with route + permission needed.
- Error boundary per page region with reference id + "Report to Helpdesk".

## 10. Files to build (implementation anchor, see doc 11)

`apps/web/components/shell/{sidebar,topbar,page-header,breadcrumbs,quick-add,notification-drawer,theme-toggle,command-palette,bottom-tabs}.tsx`, `apps/web/lib/nav.ts` (single nav registry with `{href, label, icon, group, permission, badge?}` consumed by sidebar, palette, breadcrumbs, quick-add), `apps/web/lib/shortcuts.ts`.
