# Shell Inventory — App Frame, Navigation, Routes, UI Primitives, Client Gating, Auth Chrome, Design Tokens

> Generated 2026-06-13 from source on branch `2.0`. Scope: `apps/web/components/app-shell-frame.tsx` (+ `app-shell.tsx`), `apps/web/components/nav-items.tsx`, every `apps/web/app/**/page.tsx`, `apps/web/components/ui.tsx`, `apps/web/lib/{permissions.ts,permission-map.json,plan-access.ts,plan-server.ts,session.ts,role.ts}`, `apps/web/app/layout.tsx`, `apps/web/app/globals.css`, `apps/web/tailwind.config.ts`, `apps/web/app/login/page.tsx` + `login-form.tsx`, `apps/web/app/signup/page.tsx`.
> Conventions: **API-only** = control invokes nothing. **Decorative** = rendered, no handler/hardcoded. File refs are `file:line`. This is the layer §01 (IA & navigation) and §02 (design system) of the section specs rebuild against.

---

## 0. Cross-cutting facts a redesign must respect

1. **The shell is one client component.** `AppShell` (server, `app-shell.tsx`) resolves `activePlan` via `getActivePlan()` (cookie, `lib/plan-server.ts`) and renders `<AppShellFrame title subtitle activePlan>` (`app-shell-frame.tsx`, 261 ln, `"use client"`). Every page calls `<AppShell title=… subtitle=…>{children}</AppShell>` and passes its own title/subtitle (e.g. `dashboard/page.tsx:23`). There is **no nested layout** beyond the root — `app/layout.tsx` only sets `<html lang="en"><body>`; the `(dashboard)` route group has **no** `layout.tsx`.
2. **Two parallel "role" systems, neither is real RBAC for the shell.**
   - Server RBAC = JWT `permissions[]` (`module.action`), decoded client-side for nav gating.
   - `lib/role.ts` `useActiveRole()` is a **cosmetic local toggle** (`"hr" | "admin"`, `localStorage skylinx_role`, custom-event synced) that several consoles fork their entire UI on (e.g. leave/attendance/payroll/performance). The header shows the HR/Admin switch **only on `/leave|/attendance|/payroll|/performance`** (`app-shell-frame.tsx:40`). This is not a permission and must not be confused with one.
3. **Two different client `hasPermission` implementations exist** — `lib/permissions.ts:34` (owner-bypass, returns `true` when token missing) and `lib/session.ts:66` (strict, no owner-bypass, returns `false` when missing). Consumers disagree on edge behavior. Consolidate in redesign.
4. **Brand color is defined twice and inconsistently.** Tailwind `brand` token = `#176b87` (`tailwind.config.ts`), used by `text-brand`/`bg-brand` utility classes throughout the shell. Separately the shell writes the **tenant** `branding.primaryColor` (default `#078ced`) into the CSS var `--color-brand` (`app-shell-frame.tsx:95`) — but **almost nothing consumes `--color-brand`** (utilities point at the static Tailwind value). White-label color is effectively cosmetic today.
5. **Hardcoded hex everywhere, no token layer.** The shell hardcodes `#f5f7fb` (canvas), `#1f2a44` (header), `#dce2eb` (borders), `#172033`/`#34465f`/`#49637f` (text), `#eef5ff` (hover), `#38a7f4` (icon), `#ba3d37` (lock) inline. `globals.css` has only `body` colors + print rules. There is **no dark mode, no density, no spacing/elevation/radius scale, no font setup** (system default stack).

---

## 1. App frame anatomy (`app-shell-frame.tsx`)

### 1.1 Layout
- Root `<main className="min-h-screen bg-[#f5f7fb]">`; **off-canvas sidebar** (`fixed inset-y-0 left-0 w-[255px]`, white, `translate-x-full` when closed) toggled by `open` state — i.e. the sidebar is **hidden by default on ALL viewport sizes**, opened via the header hamburger and a full-screen scrim (`:122`). There is no persistent desktop sidebar; this is a mobile-pattern frame stretched to desktop.
- **Header** (`:183`) is a dark bar `bg-[#1f2a44]`, `min-h-[68px]`: hamburger, logo (inverted via `brightness-0 invert`), "Hi, {displayName}!" (hidden < xl), employee search form, right cluster.
- **Page region** (`:249`): `p-8` (→ `p-5` < lg); renders `<h1>{title}</h1>` + `<p>{subtitle}</p>` then `{children}`. Title/subtitle are the only per-page chrome inputs.

### 1.2 Header controls
| Control | Behavior | Ref / state |
|---|---|---|
| Hamburger | opens sidebar | `:184` |
| Logo → `/dashboard` | tenant `logoDataUrl`→`company.logoUrl`→`/skylinx-logo-display.png` fallback | `:187`, `onError` swap |
| Global search | submit → `window.location.href = /employees?q=<term>` (full reload). **Searches employees only** — label "Search Employees" | `:196-215` |
| HR/Admin switch | `toggleRole("hr"\|"admin")`; visible only on 4 routes; hidden < sm | `:218-235` |
| Plan badge → `/saas` | shows `activePlan` ("Standard Plan") | `:237` |
| Date | `toLocaleDateString("en-IN", …)`; hidden < xl | `:240` |
| Bell icon | **decorative — no onClick, no notification count** | `:241` |
| Avatar | `displayName.slice(0,2).toUpperCase()` initials; no menu | `:242` |
| `AuthActions` | login/logout button (`auth-actions.tsx`; clears token client-side, **no server logout**) | `:245` |

### 1.3 Branding load (client effect, `:55-114`)
On mount: decode JWT for owner flag (`isSuperAdmin` || perm `saas.admin` || role `super_admin`) and `permissions[]`; `fetch GET /settings/rules` → set `branding`, write `--color-brand`, set company name/logo, and **reconcile the `peopleos_plan` cookie with `data.activePlan`, reloading the page if they differ** (`:103-110`). Implications: a flash of default branding before fetch; a hard reload on first login if the cookie/plan disagree; all branding is client-fetched (no SSR theme).

---

## 2. Navigation (`nav-items.tsx` + filter in `app-shell-frame.tsx:143-178`)

### 2.1 The nav array — **33 flat items, no grouping**
`group?` exists in the type but **every item omits it** — the sidebar is one ungrouped scroll list. Order as declared:

| # | href | label | icon | plan (plan-access) | nav permission key |
|---|---|---|---|---|---|
| 1 | `/dashboard` | Dashboard | LayoutDashboard | Basic | ALWAYS_VISIBLE |
| 2 | `/setup` | Setup Wizard | Sparkles | Basic | ALWAYS_VISIBLE |
| 3 | `/analytics` | Analytics | TrendingUp | Pro | `analytics.*` |
| 4 | `/saas` | SaaS Billing | Layers3 | Pro | `saas.*` |
| 5 | `/saas-admin` | SaaS Admin | ShieldCheck | Pro | **owner-only** (`isOwner`) |
| 6 | `/approvals` | Approvals | CheckSquare | Standard | `approvals.*` |
| 7 | `/assets` | Assets | BriefcaseBusiness | Standard | `assets.*` |
| 8 | `/performance` | PMS | Target | Standard | `performance.*` |
| 9 | `/employees` | Directory | Users | Basic | `employees.*` |
| 10 | `/recruitment` | Recruitment | BriefcaseBusiness | Pro¹ | `recruitment.*` |
| 11 | `/documents` | Documents | FileCheck2 | Basic | ALWAYS_VISIBLE |
| 12 | `/cards` | ID & Visiting Card | IdCard | Standard | ALWAYS_VISIBLE |
| 13 | `/attendance` | Attendance | Fingerprint | Basic | `attendance.*` |
| 14 | `/leave` | Leave | CalendarCheck | Basic | `leave.*` |
| 15 | `/holidays` | Holidays | CalendarDays | Basic | ALWAYS_VISIBLE |
| 16 | `/organization` | Organization Chart | GitFork | Standard | `organization.*` |
| 17 | `/payroll` | Payroll | BadgeIndianRupee | Standard | `payroll.*` |
| 18 | `/compliance` | Compliance | Landmark | Pro | `compliance.*` |
| 19 | `/training` | Training & Skills | GraduationCap | Pro¹ | `training.*` |
| 20 | `/travel` | Travel Desk | Plane | Pro¹ | `travel.*` |
| 21 | `/expenses` | Expense Payout | ReceiptText | Standard | `expenses.*` |
| 22 | `/insurance` | Insurance Management | HeartPulse | Standard | `insurance.*` |
| 23 | `/support` | Support | CircleHelp | Basic | ALWAYS_VISIBLE |
| 24 | `/grievance` | Grievances | AlertTriangle | Pro¹ | ALWAYS_VISIBLE |
| 25 | `/notifications` | Notifications | Megaphone | Standard | `notifications.*` |
| 26 | `/social` | SkyNexus | MessageSquareText | Standard | ALWAYS_VISIBLE |
| 27 | `/rewards` | Rewards | Trophy | Pro | `rewards.*` |
| 28 | `/reports` | Reports | FileText | Basic | `reports.*` |
| 29 | `/security` | Security | ShieldCheck | Pro | alias→`settings.*` |
| 30 | `/settings` | Settings | Settings | Basic | `settings.*` |
| 31 | `/policies` | Policies | FileCheck2 | Pro¹ | ALWAYS_VISIBLE |
| 32 | `/surveys` | Surveys | FileText | Pro¹ | ALWAYS_VISIBLE |
| 33 | `/reminders` | Reminders | Megaphone | Pro¹ | alias→`notifications.*` |

¹ Module not in `modulePlanAccess` → `requiredPlanForModule` defaults **"Pro"** (`plan-access.ts:44`). So recruitment/training/travel/grievance/policies/surveys/reminders all render plan-locked on Basic/Standard even though several are ALWAYS_VISIBLE for permissions — plan lock and permission visibility are computed independently (see 2.3).

### 2.2 Visibility filter (`:143-161`)
1. `/saas-admin` → only if `isOwner`.
2. If `isOwner` **or** `myPermissions === null` (token not yet decoded) → show everything (anti-flicker).
3. `ALWAYS_VISIBLE` set (10 hrefs: dashboard, social, policies, surveys, support, grievance, documents, cards, holidays, setup) → always shown regardless of permissions. **This is the trap documented in engagement.md** — non-HR users see social/grievance/etc. then hit 403s on the data calls.
4. Else `moduleKeyFromHref(href)` → `moduleAlias` remap (`security→settings`, `saas-admin→saas`, `reminders→notifications`) → show iff any `permissions[]` entry `startsWith("<key>.")`.

### 2.3 Plan gating overlay (`:162-177`)
Independent of visibility: each shown item computes `requiredPlanForModule` vs `activePlan`; if not allowed (and not `/saas`) the row dims (`text-[#8ca0bf]`) and shows a `LockKeyhole`. Lock is **cosmetic** — the link still navigates; real lock screens come from `<PlanGate>` inside the page (`plan-gate.tsx`, server, reads cookie). There is **no server plan enforcement** (platform.md §0.3).

### 2.4 Gaps for redesign
- No grouping, no active-state highlight, no collapse/pin, no breadcrumbs, no per-persona ordering, no badges/counts (e.g. pending approvals), no keyboard nav, no search over nav, no recent/favourites.
- Nav permission key is derived from the href by string-strip (`moduleKeyFromHref`) — fragile; redesign should carry an explicit `permission` per item.
- `Link2` icon imported but unused (`nav-items.tsx:19`).

---

## 3. Route map — every `app/**/page.tsx`

38 page files. All non-auth pages wrap `<AppShell>`; auth/marketing pages are standalone. `(dashboard)` is a pathless route group (no shared layout).

| Route | File | Shell? | Plan gate | Primary console / inventory ref |
|---|---|---|---|---|
| `/` | `app/page.tsx` | — | — | `redirect("/login")` |
| `/login` | `app/login/page.tsx` | — | — | `login-form.tsx` (§7) |
| `/signup` | `app/signup/page.tsx` | — | — | 4-step wizard (platform.md §4.6) |
| `/dashboard` | `app/dashboard/page.tsx` | ✓ | — | LiveMetrics + DashboardWidgets + quick-grid (§09 ref) |
| `/setup` | `app/setup/page.tsx` | ✓ | — | setup-wizard-console (platform.md §3) |
| `/analytics` | `app/analytics/page.tsx` | ✓ | Pro | analytics-console (platform.md §5) |
| `/saas` | `app/saas/page.tsx` | ✓ | — | saas-page-content (platform.md §4.4) |
| `/saas-admin` | `app/saas-admin/page.tsx` | ✓ | — | saas-admin-page-content (platform.md §4.5) |
| `/approvals` | `app/approvals/page.tsx` | ✓ | Standard | approvals-console (platform.md §9) |
| `/assets` | `app/assets/page.tsx` | ✓ | Standard | assets-console (engagement.md §8) |
| `/performance` | `app/performance/page.tsx` | ✓ | — | performance-console (talent.md §1) |
| `/employees` | `app/employees/page.tsx` | ✓ | — | employees-console (core-hr.md §1) |
| `/recruitment` | `app/recruitment/page.tsx` | ✓ | — | recruitment-console (talent.md §2) |
| `/documents` | `app/documents/page.tsx` | ✓ | — | DocumentUploadPanel (core-hr.md §1.3) |
| `/cards` | `app/cards/page.tsx` | ✓ | — | card-generator |
| `/attendance` | `app/attendance/page.tsx` | ✓ | — | attendance-console (time.md) |
| `/leave` | `app/leave/page.tsx` | ✓ | — | leave-console (time.md) — role-forked |
| `/holidays` | `app/holidays/page.tsx` | ✓ | — | holiday-console (time.md) |
| `/organization` | `app/organization/page.tsx` | ✓ | — | organization-console (core-hr.md §2) |
| `/payroll` | `app/payroll/page.tsx` | ✓ | — | payroll-console 14 tabs (money.md §1) |
| `/compliance` | `app/compliance/page.tsx` | ✓ | — | compliance-console (money.md §2) |
| `/training` | `app/training/page.tsx` | ✓ | Standard | training-console (talent.md §3) |
| `/travel` | `app/travel/page.tsx` | ✓ | Standard | travel-console (talent.md §4) |
| `/expenses` | `app/expenses/page.tsx` | ✓ | — | expenses-console (money.md §3) |
| `/insurance` | `app/insurance/page.tsx` | ✓ | — | insurance-console (engagement.md §7) |
| `/support` | `app/support/page.tsx` | ✓ | — | support-console (engagement.md §6) |
| `/grievance` | `app/grievance/page.tsx` | ✓ | — | grievance-console **broken** (engagement.md §5) |
| `/notifications` | `app/notifications/page.tsx` | ✓ | Standard | notifications-console (platform.md §8.1) |
| `/social` | `app/social/page.tsx` | ✓ | — | skynexus-console (engagement.md §1) |
| `/rewards` | `app/rewards/page.tsx` | ✓ | Pro | rewards-dashboard (talent.md §5) |
| `/reports` | `app/reports/page.tsx` | ✓ | — | reports-console (platform.md §6) |
| `/security` | `app/security/page.tsx` | ✓ | Pro | security-console (platform.md §2) |
| `/settings` | `app/settings/page.tsx` | ✓ | — | settings-console (platform.md §3) |
| `/(dashboard)/reminders` | `…/reminders/page.tsx` | ✓ | — | reminders rules (platform.md §8.2) |
| `/(dashboard)/surveys` | `…/surveys/page.tsx` | ✓ | — | surveys list (engagement.md §3) |
| `/(dashboard)/surveys/[id]` | `…/surveys/[id]/page.tsx` | ✓ | — | survey respond |
| `/(dashboard)/surveys/[id]/results` | `…/surveys/[id]/results/page.tsx` | ✓ | — | survey results |

**Route gaps vs nav:** every nav href resolves to a page. **No detail routes** exist for records (no `/employees/[id]`, `/payroll/runs/[id]`, `/recruitment/jobs/[id]`, etc.) — everything is single-page consoles with in-page drawers/modals. The redesign's per-record routes (§03–§08) are all NEW.

---

## 4. UI primitives (`components/ui.tsx`) — 34 lines, **4 components**

| Component | Props | Notes |
|---|---|---|
| `Card` | `className`, `...divProps` | `rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm` |
| `StatusPill` | `tone: green\|yellow\|red\|blue\|indigo\|purple` | hardcoded bg/text hex per tone; **no semantic mapping** — every console picks a tone by hand |
| `MetricCard` | `label, value, note` | note always green text (`#18865a`) regardless of sentiment |
| `DataState` | `tone: loading\|empty\|error`, `message` | the only empty/loading/error affordance in the app |

Everything else — tables, forms, inputs, selects, date pickers, tabs, modals, drawers, toasts, buttons — is **hand-rolled per console** with inline Tailwind. There is no Button, Input, Select, Modal, Drawer, Tabs, Toast, Table, Pagination, Skeleton, EmptyState, Avatar, Tooltip, Stepper, or Wizard primitive. `live-tables.tsx` and `action-panels.tsx` are the de-facto shared table/form libraries but are bespoke and inconsistent. **This is the single biggest §02 deliverable: a real primitive library.**

---

## 5. Client permission gating (`lib/permissions.ts` + `permission-map.json`)

- `permission-map.json` = **124 regex→permission entries** generated from API `@RequirePermissions` (`scripts/generate-permission-map.js`). `requiredPermissionFor(path)` matches a GET path to its permission; `apiFetch`/`client-api.ts` uses it to **skip requests the JWT can't pass** (avoids 403 noise) and `PermissionDeniedError` is thrown locally instead.
- `hasPermission(perm)` (`permissions.ts:34`): owner roles (`SUPER_ADMIN`/`SYSTEM_OWNER`) bypass; missing token → `true` (let API decide).
- **Keep-in-sync hazard:** the map is committed JSON; any route/permission change requires regeneration or the client gating drifts from the API.
- Redesign: the section specs reference real permission strings; the gating helper + map stay the source of truth for client-side hide/disable.

## 6. Plan access (`lib/plan-access.ts`, `plan-server.ts`, `plan-gate.tsx`)
- `PlanName = Basic|Standard|Pro`, `defaultActivePlan = "Standard"`, `planRank` 1/2/3, `modulePlanAccess` map (25 keys; unknowns → Pro), `hasPlanAccess`, `planTone` (Basic→green/Standard→yellow/Pro→red).
- Active plan source: `peopleos_plan` cookie (`plan-server.ts`, read in server components); written at login and reconciled from `/settings/rules` (§1.3). **Client cookie only — no server enforcement** (platform.md §0.3).

## 7. Auth chrome
- **Login** (`app/login/page.tsx` + `login-form.tsx`): card with logo (`alt="Acme Corp"` placeholder), email + password only. Submit → `POST /auth/login`; on success `setAccessToken` (localStorage `peopleos_access_token`), write `peopleos_plan` cookie, `router.push("/dashboard")`. **No OTP field, no "forgot password" link, no SSO, no remember-me, no tenant selector.** (Auth API OTP/forgot endpoints are stubs — platform.md §1.)
- **Signup** (`app/signup/page.tsx`): public 4-step wizard (plan → org+admin → simulated card → success), `POST /saas/signup` (grants SUPER_ADMIN — platform.md §4.3/§4.6). Prefilled fake card.
- **Logout** (`auth-actions.tsx`): clears token client-side; **no server session invalidation**; 15-min JWT, no refresh (platform.md §0.1).
- **Stale-JWT (tenantId null) class**: documented in master plan §6 — needs a re-login prompt.

## 8. Design tokens — current state (the §02 baseline)
| Surface | Current value | Source |
|---|---|---|
| Canvas bg | `#f5f7fb` | `globals.css` body, shell `main` |
| Header bg | `#1f2a44` (dark navy) | shell `:183` |
| Card | white, `border #dce2eb`, `shadow-sm`, `rounded-lg` | `ui.tsx` |
| Text ink / muted | `#172033` / `#657083` | tailwind `ink`/`muted` |
| Brand (utility) | `#176b87` (teal) | tailwind `brand` |
| Brand (CSS var, tenant) | `#078ced` default | shell `--color-brand` (largely unconsumed) |
| Accent | `#db6b28` | tailwind `accent` (rarely used) |
| Status hues | green `#18865a`/`#e6f5ef`, yellow `#a46f00`/`#fff5db`, red `#ba3d37`/`#fde8e6`, blue, indigo, purple | `ui.tsx` StatusPill |
| Print | `.print-area` / `.print-hide`, `@page margin 16mm` | `globals.css` |
| Font | system default (no `next/font`, no family set) | — |
| Dark mode / density / spacing scale / elevation scale / radii scale / motion | **none** | — |

**Redesign mandate (master plan §4):** move identity off `#078ced` Kredily-adjacent blue; introduce a named token layer (`color.brand.*`, `surface.*`, `text.*`, semantic `success/warning/danger/info`, elevation/spacing/radii/motion scales); white-label runtime theming via CSS vars from `branding.*`; a single semantic **status-pill map** replacing per-console tone guesses; dark mode + density toggle.

---

## 9. Summary — shell quirks to fix in the redesign
1. Sidebar is off-canvas on all sizes (no persistent desktop rail); no active state, no groups, 33 flat items.
2. `group?` field unused; nav permission inferred by href string-strip + alias map; `Link2` icon dead import.
3. Global search is employee-only and does a full page reload.
4. Bell is decorative; no notification surface in the shell.
5. Brand color defined twice (Tailwind `#176b87` vs CSS var `#078ced`), tenant color largely unconsumed.
6. `ALWAYS_VISIBLE` nav set shows pages users can't use → 403 dead-ends (social, grievance, surveys, cards, …).
7. Plan lock is cosmetic in nav; real gate is `<PlanGate>`; no server plan enforcement.
8. Two `hasPermission` impls with different missing-token semantics.
9. Cosmetic `useActiveRole` (hr/admin) localStorage toggle drives whole-console forks — easily mistaken for RBAC; switch only appears on 4 routes.
10. Only 4 UI primitives; everything else bespoke per console.
11. No record-detail routes anywhere; no breadcrumbs; no nested layouts.
12. No token layer, no dark mode, no fonts, hardcoded hex throughout; `globals.css` is 45 lines.
