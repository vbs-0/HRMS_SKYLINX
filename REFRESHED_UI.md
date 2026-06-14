# Refreshed UI — PeopleOS v2 (branch `refreshed-ui`)

Implements the redesign spec set in `docs/redesign/` (design system §02, shell/nav §01). **Branch-isolated — never pushed to `2.0`.** Foundation-first: the token layer + shell + primitive kit reskin **every page at once**; individual console bodies are then migrated screen-by-screen against the same primitives.

## What's built (this branch)
| Layer | File(s) | Effect |
|---|---|---|
| **Token layer** | `apps/web/app/tokens.css` | Indigo brand + warm-graphite neutrals + semantic hues; light/dark (`data-theme`) + density (`data-density`) |
| **Tailwind mapping** | `apps/web/tailwind.config.ts` | tokens → utilities; `darkMode` selector; legacy `brand/ink/muted/accent` remapped so existing consoles reskin automatically |
| **Global CSS** | `apps/web/app/globals.css` | token-based base, focus ring, thin scrollbars, print rules |
| **Theming** | `apps/web/app/layout.tsx`, `apps/web/lib/theme.ts` | no-flash theme script, Inter + JetBrains Mono, `useTheme()` (light/dark/system + density) |
| **Status system** | `apps/web/lib/status-map.ts` | one map: any status string → semantic tone (+ legacy-tone shim) |
| **Primitive kit** | `apps/web/components/ui.tsx` | `Card, CardHeader, Button, StatusPill/Badge, Field, Input, Textarea, Select, MetricCard, KpiCard, DataState, EmptyState, Skeleton(+Rows), Avatar, Tabs, Spinner` — token-styled, dependency-free. **Legacy exports kept** (`Card/StatusPill/MetricCard/DataState`) so all ~50 consoles still compile |
| **Grouped nav** | `apps/web/components/nav-items.tsx` | 8 groups (My Space/People/Time/Money/Talent/Workplace/Insights/Admin); `nav` flat export kept for back-compat + `groupedNav()` |
| **New shell** | `apps/web/components/app-shell-frame.tsx` | persistent grouped sidebar (active state, plan locks, permission-filtered), topbar (breadcrumb, search, quick-add, **theme toggle**, notifications, plan badge), page header. Same `AppShell` API → **all 38 pages adopt it with no page edits** |
| **Style guide** | `apps/web/app/style-guide/page.tsx` + `components/style-gallery.tsx` | living reference of every primitive + states (visit `/style-guide`) |

White-label: tenant `branding.primaryColor` overrides `--color-brand-600` at runtime, **except** the legacy seed blue `#078ced` (so default tenants keep the v2 indigo — per §02 §7).

## Run
```
npm install            # repo root (workspaces)
npm run dev -w @skylinx/web
# visit http://localhost:3000/style-guide  (design system)
#       http://localhost:3000/dashboard    (reskinned app)
```
> Not type-checked in this environment (`node_modules` absent). Before merge: `npm run typecheck -w @skylinx/web` and `npm run build -w @skylinx/web`.

## Migration pattern for the remaining console bodies
The shell + tokens already restyle every page. To deep-migrate a console (e.g. `employees-console.tsx`) to full v2:
1. Replace bespoke tables with the kit (`Card`, `Tabs`) + a `DataTable` (next primitive to add) — until then, existing tables inherit token colors.
2. Swap inline hex (`#dce2eb`, `#172033`, …) for utility classes (`border-line`, `text-text-primary`, `bg-raised`, `text-text-muted`).
3. Use `<StatusPill status={row.status} />` instead of hand-picked tones.
4. Use `Field`/`Input`/`Select`/`Textarea` for forms; `EmptyState`/`Skeleton`/`DataState` for the six states.
5. Follow the screen's section spec in `docs/redesign/sections/` for layout, fields, and EXISTS/NEW API.

## Next primitives to add (per §02, not yet built)
`DataTable` (sort/filter/bulk/pagination/states), `Drawer`, `Modal`, `Tooltip`, `Toast`, `CommandPalette` (⌘K), `DatePicker`, `Combobox`/`EmployeePicker`, `MoneyInput`, charts wrapper, and the domain composites (`PayslipDocument`, `PermissionMatrix`, `PunchWidget`, …).

## Scope honesty
This branch delivers the **complete design-system foundation + shell + theming + style guide**, which visually redesigns the whole app and establishes the build pattern. The per-console deep rebuilds (tables→DataTable, full form specs) are the remaining work, mechanical and parallelizable against the section specs.
