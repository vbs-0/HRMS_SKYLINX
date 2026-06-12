# 11 · Implementation Roadmap — from current app to Painted Paper v2

How `apps/web` migrates without breaking the working product. API stays; UI rebuilds behind a flag.

---

## 1. Technical approach

| Decision | Choice | Why |
|---|---|---|
| Theming | CSS custom properties (`assets/tokens.css` → `apps/web/app/tokens.css`) + Tailwind preset mapping; `darkMode: ['selector','[data-theme="dark"]']` | Runtime theme switch, no rebuild, tokens shared with print/PDF templates |
| Fonts | `next/font/local` or `next/font/google` for Fraunces + Inter + JetBrains Mono, `display: swap`, subset latin | Zero CLS, self-hosted, offline-safe |
| Primitives | Radix UI (dialog, popover, select, tabs, tooltip, dropdown) + `cmdk` palette + `react-hook-form` + `zod` + TanStack Table (v8) + TanStack Query + Recharts | A11y-correct foundations; we style, not re-invent |
| Flag | `NEXT_PUBLIC_UI_V2=1` → new shell + new routes; legacy routes 301 when flag on | Phase-by-phase flip, instant rollback |
| Structure | `components/ui/*` (kit) · `components/domain/*` (composites) · `components/shell/*` · `lib/nav.ts`, `lib/status-map.ts`, `lib/permissions.ts` (client gate helpers mirroring API `module.action`) | Kills 30k-line console monoliths gradually |
| State | Server components for reads where possible; TanStack Query for interactive consoles; URL = filter state | Restorable links, less client JS |
| Testing | Storybook + axe per component; Playwright suites per blueprint (extend existing `apps/web/e2e/`); visual regression (Playwright screenshots) on kit + key pages light/dark | Regression-proof reskin |

## 2. Phase plan (gates = merge criteria)

### P0 · Foundation (wk 1–2)
Build: tokens.css import, Tailwind preset, fonts, theme switcher + persistence, grain canvas, `ui/` kit core (Button, Field set, Select, DatePicker, Drawer, Modal, Toast, StatusChip, KpiCard, DataTable v1, EmptyState set), shell (sidebar groups, topbar, breadcrumbs, palette v1 pages-only), `lib/nav.ts` w/ permission filter, `/login` + `/home` skeleton-composed.
**Gate:** axe clean on kit; light/dark verified; legacy app untouched with flag off; Playwright smoke (login → home) green both flags.

### P1 · Daily life (wk 3–5)
`/home` widgets (ESS/Manager/HR variants), `/inbox` (approvals API), `/calendar` v1, `/people` directory + 360 (Overview/Job/Documents/Timeline tabs), `/time/attendance` Me+Team, `/time/leave` Me+Team (apply flow w/ verdict chips), `/time/holidays`, notifications drawer.
**Gate:** ESS + Manager can live fully in v2; e2e role suites (HR/MANAGER/EMPLOYEE journeys from `docs/reference_blueprint/` audits) pass on v2 routes.

### P2 · Money (wk 6–9)
`/pay/structures` (components/templates/assignments/revisions), `/pay/payroll` run room (gates→inputs→preview w/ formula trace→lock→publish→bank file), `/pay/me` (payslips, regime compare, declarations, proofs, Form 16 downloads), `/pay/expenses`, `/pay/compliance` workbenches + **Form 16 center**, print/PDF twins (payslip, Form 16, F&F).
**Gate:** parity checklist vs every existing payroll screen feature (Kredily-parity items preserved); register exports byte-checked vs legacy; print suite reviewed.

### P3 · Talent & workplace (wk 10–12)
Recruitment (reqs, pipeline, interviews, offers), performance (cycles, reviews, calibration), training (catalog, matrix), helpdesk, grievance (confidential pattern), travel, assets, policies (reader + ack), announcements, surveys, social, rewards, onboarding/exits boards + runbooks + F&F statement UI.
**Gate:** all legacy consoles have a v2 home; interviewer/committee scope tests pass.

### P4 · Control plane (wk 13–15)
Settings hub all sections, **PermissionMatrix editor + scopes + field-level security + View-as**, workflow builder + simulate, custom fields studio, data import/export center, security center + audit explorer, integrations cards, billing, SaaS admin, setup wizard v2, report center + schedules.
**Gate:** permission-change e2e (create role → verify nav/fields/API 403s align); audit rows asserted for every settings mutation.

### P5 · Polish & flip (wk 16)
Full WCAG 2.2 AA pass (axe + manual keyboard/AT script), perf budget enforcement, mobile bottom-tab paths for ESS staples, microcopy edit pass, empty/error state sweep, ⌘K records search, flag default ON → legacy `*-console.tsx` deleted after 2 stable weeks, redirects permanent.

## 3. File-level migration map (representative)

| Legacy | v2 destination |
|---|---|
| `app-shell-frame.tsx`, `nav-items.tsx` | `components/shell/*`, `lib/nav.ts` |
| `ui.tsx` (4 components) | `components/ui/*` (~45 components) |
| `dashboard-widgets.tsx`, `live-metrics.tsx`, `live-tables.tsx` | `app/home/*` widgets + `ui/KpiCard`, `ui/DataTable` |
| `approvals-console.tsx` | `app/inbox/*` |
| `employees-console.tsx`, `lifecycle-console.tsx` | `app/people/*` (directory, 360, onboarding, exits) |
| `attendance-console.tsx`, `roster-console.tsx` | `app/time/attendance/*`, `app/time/roster/*` |
| `leave-console.tsx`, `leave-policy-panel.tsx`, `leave-settings-console.tsx` | `app/time/leave/*` (tabs Me/Team/Everyone/Policies) |
| `payroll-console.tsx`, `compliance-dash.tsx`, `compliance-console.tsx` | `app/pay/*` |
| `recruitment/performance/training/travel/support/grievance/assets/policies-console.tsx` | `app/talent/*`, `app/work/*` |
| `settings-console.tsx`, `security-console.tsx`, `organization-settings-console.tsx`, `setup-wizard-console.tsx`, `saas-*.tsx` | `app/admin/*`, `app/setup/*` |
| `skynexus-console.tsx` | `components/domain/ai-drawer.tsx` (global) |
| `card-generator.tsx` | `app/people/cards/*` |

Each migration PR: one module, includes Playwright spec, deletes nothing until P5.

## 4. Additive API work (small, listed once)

Saved views CRUD · notification preferences matrix · permission scopes + field-security flags exposure (models exist; add to role endpoints) · workflow definitions CRUD + resolver (generalize current per-module approval fields) · search federation endpoint · report schedules · import job endpoints · webhook/event log · Form 16 Part A pairing + publish endpoints (extend payroll/compliance) · ICS feed tokens. All additive; legacy UI unaffected.

## 5. Budgets & quality gates (CI-enforced from P0)

- **Perf:** route JS ≤ 220KB gz (shell included); LCP ≤ 2.0s on mid-tier laptop profile; table interaction (sort/filter 1k rows) ≤ 100ms; theme switch no-flash (inline script).
- **A11y:** axe serious/critical = 0 per page; keyboard-path e2e for top 12 flows; contrast lint on token pairs.
- **Visual:** screenshot diff kit + 8 key pages, light & dark, default & compact.
- **Lint rules:** `pp/no-raw-color`, `pp/one-primary`, no `console.*`, no inline hex.
- **Print:** payslip/Form 16/F&F/letters PDF snapshot diffs.

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 30k LOC of consoles → long tail of forgotten micro-features | Parity checklist per module extracted from legacy file before rewrite (review artifact in PR description); legacy kept runnable behind flag until P5 |
| Payroll/compliance regressions | Byte-compare exports; formula-trace popover doubles as manual verification tool; lock/unlock audit asserted in e2e |
| Permission UI ↔ API drift | Single `lib/permissions.ts` consumed by nav, buttons, and route guards; contract test hits API with role fixtures and asserts UI gate map |
| Font/licence concerns | Fraunces + Inter + JetBrains Mono all OFL — bundled |
| Dark-mode contrast misses | Token pairs table tested in CI (computed contrast), not eyeballed |

## 7. Definition of done (v2 launch)

Every route in doc 02 sitemap live · zero legacy consoles imported · all six states present on every list/form (audited by checklist) · WCAG pass recorded · perf budgets green 7 consecutive days · role-based e2e (4 personas × core journeys) green · docs 00–10 updated to "as-built".
