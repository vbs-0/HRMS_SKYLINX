# PeopleOS UI Redesign — Document Set

The complete, code-grounded redesign architecture for the PeopleOS HRMS web app (`apps/web`), branch `2.0`. **Docs-only** — this folder specifies the rebuild; implementation happens on the code branch.

## Reading order
1. **[`00_MASTER_UI_ARCHITECTURE.md`](00_MASTER_UI_ARCHITECTURE.md)** — vision, personas, IA, design direction, phased plan (the synthesis / entry point).
2. **`inventory/`** — 9 exhaustive, file:line-referenced audits of *what exists today* (endpoints, permissions, DTOs, quirks). The source of truth every spec is checked against.
3. **`sections/01`–`12`** — the per-screen redesign specs (route, roles, layout, tables, forms, every interaction marked EXISTS/NEW, states).
4. **[`98_ADVERSARIAL_CRITIQUE.md`](98_ADVERSARIAL_CRITIQUE.md)** — 5-agent QA pass over the specs + remediation log.
5. **[`99_IMPLEMENTATION_ROADMAP.md`](99_IMPLEMENTATION_ROADMAP.md)** — phases P0–P5, per-phase DoD, consolidated backlog (planning view), risk register, build-vs-review split.
6. **[`CORRECTNESS_BACKLOG.md`](CORRECTNESS_BACKLOG.md)** — the **live operational defect tracker** (☐/☑ + commit SHAs + owner tags). Canonical for status; the code lane works from this.

## Inventories (`inventory/`)
| File | Scope |
|---|---|
| `shell.md` | App frame, nav, routes, UI primitives, client gating, auth chrome, current design tokens |
| `rbac-settings.md` | Full seed permission matrix (roles × modules × actions) + every DEFAULT_RULES key |
| `blueprint.md` | Kredily reference screens, parity status, market gaps, binding reference dimensions/forms |
| `core-hr.md` | Employees, organization, custom fields |
| `time.md` | Attendance, holidays, leave |
| `money.md` | Payroll, compliance, expenses |
| `talent.md` | Performance, recruitment, training, travel, rewards |
| `engagement.md` | Social, announcements, surveys, policies, grievance, helpdesk, insurance, assets |
| `platform.md` | Auth, security, settings, SaaS, analytics, reports, dashboard, notifications, approvals, AI, health |

## Section specs (`sections/`)
`01` IA & navigation · `02` design system · `03` core HR · `04` time/attendance/leave · `05` payroll/money · `06` talent · `07` engagement & ops · `08` platform admin · `09` dashboards & analytics · `10` approvals & notifications · `11` mobile & accessibility · `12` auth & onboarding.

## Conventions
- **EXISTS `METHOD /path`** = wire to a current API endpoint · **NEW `METHOD /path` (perm)** = proposed backend.
- Permissions are real `<module>.<action>` (action ∈ create/read/update/delete/approve/export/configure); `delete` is granted to no seeded role (SUPER_ADMIN-only) — see `rbac-settings.md`.
- Backlog IDs: `SEC-*` (security), `UX-*` (broken-UX), `ENG-*` (missing engine), `PAR-*` (parity) in `99`; the live tracker in `CORRECTNESS_BACKLOG.md` uses its own ☐/☑ list.

**Status:** architecture set complete (see `00` §9). Implementation proceeds on the code branch against `99`'s phases + `CORRECTNESS_BACKLOG.md`.
