# 99 — Implementation Roadmap Detailed

## 1. READ FIRST: Architecture & Master Plan Summary

Understanding the P0 → shell → domains order based on `00_MASTER_UI_ARCHITECTURE.md` and `99_IMPLEMENTATION_ROADMAP.md`:
*   **P0 (Foundation):** Lay down design tokens (CSS variables), Tailwind config, and rebuilt `ui.tsx` primitives. This is purely additive and ensures the 96-check e2e full-audit gate stays green without altering existing behaviors.
*   **SHELL:** Implement the new sidebar, topbar, federated search, and branding injection (e.g., `app-shell-frame.tsx`) ensuring white-labeling is strictly tenant-driven (no hardcoded "SKYLINX", only "PeopleOS").
*   **P1 (Money):** Rework payroll lifecycle, salary structures, tax declarations, and expenses first because they carry the highest risk. Parity and math must be strictly preserved and manually verified.
*   **P2 (Self-service):** Build ESS role dashboards, attendance/leave, and the unified Approvals Inbox. Ensure the employee and manager experiences are fully migrated to v2.
*   **P3 (Talent & Engagement):** Rebuild performance, recruitment, social, grievance, and support consoles, tackling severe UX gaps (e.g., grievance console 404s, requisition creation 400s).
*   **P4 (Platform & Admin):** Execute the settings tree, Permissions admin (RBAC), Workflow engine, SaaS owner console, and auth hardening (e.g., SEC-01 to SEC-14 fixes).
*   **P5 (Polish):** Accessibility passes, mobile optimization, unflagging the new UI, and permanent 301 redirects from legacy routes.
*   **Non-Negotiable Rule:** Payroll math must remain untouched unless explicitly reviewed. Correctness items (SEC, UX, ENG) must be resolved in tandem with their respective UI phases.

---

## 2. PHASE 0 — Design Tokens & Theme (Foundation)

This phase is **PURELY ADDITIVE**. Existing components will not be touched yet. It establishes the visual language and utility classes required for the rebuild, ensuring it is safe to ship alone.

*   **`apps/web/app/tokens.css` (NEW):**
    *   **Variables:** `--color-brand-primary`, `--surface-raised`, `--text-muted`, semantic colors (`--success`, `--warning`, `--danger`, `--info`), elevation and spacing scales, border radii.
    *   **Purpose:** The central source of truth for all design tokens. Includes light/dark/compact mode media queries.
*   **`apps/web/tailwind.config.js` (UPDATE):**
    *   **Changes:** Extend the theme configuration to map to the CSS variables in `tokens.css` (e.g., `colors: { brand: 'var(--color-brand-primary)' }`).
    *   **Purpose:** Allows usage of `bg-brand`, `text-muted`, etc., throughout the codebase.
*   **`apps/web/components/ui.tsx` (UPDATE/NEW):**
    *   **Changes:** Rebuild primitive components (Button, Input, Select, Table, Card, Modal, StatusPill, etc.) using the new tokenized Tailwind classes.
    *   **Purpose:** Creates a resilient, accessible component library mapped to the new design system.
*   **`apps/web/lib/status-map.ts` (NEW):**
    *   **Changes:** Map string statuses (`ACTIVE`, `PENDING`, `REJECTED`) to semantic colors.
    *   **Purpose:** Ensure consistent StatusPill rendering across all domains.

**Verification Gate:** `npx tsc --noEmit -p apps/web/tsconfig.json` passes. `npx playwright test` (or equivalent e2e suite) passes, proving no existing pages were broken by the additive CSS/primitives.

---

## 3. SHELL Phase

Updating the global layout and navigation structure.

*   **`apps/web/components/app-shell-frame.tsx`:**
    *   **Change:** Inject CSS variables based on tenant branding settings (e.g., `rules.branding.primaryColor`).
    *   **Note:** MUST strictly read `rules.branding.platformBrand` and `rules.branding.clientDisplayName`. Do not hardcode "SKYLINX".
*   **`apps/web/components/app-shell.tsx`:**
    *   **Change:** Redesign the overall grid layout to accommodate the new collapsible Sidebar and Topbar (breadcrumb, federated search, quick-add, theme toggle, avatar).
*   **`apps/web/components/nav-items.tsx` & `apps/web/lib/nav.ts`:**
    *   **Change:** Reorganize navigation into the 8 new groups (My Space, Team, HR Operations, Money, Talent, Company, Insights, Platform Admin). Map permissions carefully.
*   **`apps/web/app/layout.tsx`:**
    *   **Change:** Integrate the new font loading and ensure `app-shell-frame.tsx` wraps the `children` correctly with the new layout structure.

**Verification Gate:** Visual smoke test of the new shell. E2E tests pass for navigation routing. `tsc` passes.

---

## 4. DOMAIN Phases

### P1 — Money (High Risk)
| Screen/Component | Changes | Existing Endpoints | Risk | RBAC / Payroll Logic |
| :--- | :--- | :--- | :--- | :--- |
| `payroll-console.tsx` | Run Room stepper, drill-downs, LOP edit, fix `UX-01` (calculate jump) | `GET /payroll`, `POST /payroll/:id/calculate`, `PATCH /payroll/:id/lock` | **HIGH** | **YES** (Flag for Claude) |
| `expenses-console.tsx` | Expense claims, receipt upload, fix `UX-16` (auto-approval skip) | `GET /expenses`, `POST /expenses` (creates with APPROVED) | Med | **YES** (Flag for Claude) |
| `compliance-console.tsx` | Workbenches for PT/TDS/Form16, fix `UX-05` (empty files) | `GET /compliance`, `POST /compliance/export` | High | **YES** (Flag for Claude) |

*   **GAPs:** `/payroll/:id/corrections` (Missing API), `/payroll/:id/form16` (Route mismatch `UX-02`).

### P2 — Self-Service & Approvals
| Screen/Component | Changes | Existing Endpoints | Risk | RBAC / Payroll Logic |
| :--- | :--- | :--- | :--- | :--- |
| `employees-console.tsx` | Dashboard widgets, profile tabs, add employee wizard (`UX-08`, `UX-11`) | `GET /employees`, `PATCH /employees/:id` (Drops fields) | Med | No |
| `attendance-console.tsx` | Clock widget (geofence), month calendar, fix `UX-07` (overlapping punch) | `GET /attendance/logs`, `POST /attendance/clock-in`, `POST /attendance/clock-out` | Med | No |
| `leave-console.tsx` | Balance cards, apply modal, sandwich preview, fix `UX-21` (half-day drop) | `GET /leave/balances`, `GET /leave/requests`, `PATCH /leave/requests/:id/approve` | Med | No |
| `approvals-console.tsx` | Unified Inbox (tabs by module + all), card context preview | *Requires ENG-01 Workflow API* | Med | **YES** (Flag for Claude) |

*   **GAPs:** `/attendance/regularization` (Approve hits 404 `UX-06`), `/employees/export` (Real server endpoint missing), Workflow engine endpoints.

### P3 — Talent & Engagement
| Screen/Component | Changes | Existing Endpoints | Risk | RBAC / Payroll Logic |
| :--- | :--- | :--- | :--- | :--- |
| `performance-console.tsx` | Cycles, appraisals, 360, calibration, fix `UX-29` (seed perms) | `GET /performance/appraisals` | Low | No |
| `recruitment-console.tsx` | Requisition kanban, interview scheduling, fix `UX-15` (designationId req) | `GET /recruitment/requisitions`, `POST /recruitment/requisitions` (fails 400) | Low | No |
| `grievance-console.tsx` | Intake + resolution timeline, fix `UX-13` (incompatible UI), `SEC-13` | `GET /grievance`, `POST /grievance`, `PATCH /grievance/:id` | High | No (Privacy risk SEC-13) |
| `support-console.tsx` | SLA countdown pills, fix `UX-18` (ticket uncloseable) | `GET /tickets`, `POST /tickets` | Low | No |

*   **GAPs:** 9-box calibration + goals/OKR endpoints (`ENG-08`), Ticket status update endpoint.

### P4 — Platform & Admin
| Screen/Component | Changes | Existing Endpoints | Risk | RBAC / Payroll Logic |
| :--- | :--- | :--- | :--- | :--- |
| `settings-console.tsx` | Settings tree for all `DEFAULT_RULES` keys | `GET /settings/company`, `GET /settings/rules`, `PATCH /settings/rules` | Med | No |
| `security-console.tsx` | Permissions admin grid, fix `ENG-13` (roles/scopes UI) | `GET /security/audit-logs` | High | **YES** (Flag for Claude) |
| `saas-console.tsx` | Tenant list, DB-backed plan editor, billing, fix `UX-25` (fake audits) | `GET /saas`, `GET /saas/coupons` | High | **YES** (Flag for Claude) |

*   **GAPs:** Roles/permissions admin API (`ENG-13`), Real SaaS payment gateway (`SEC-14`).

---

## 5. Verification Gates per Phase

*   **Phase 0:** `tsc` clean (both api and web). Existing E2E suite passes without modifications.
*   **Phase 1 (Money):** `tsc` clean. Payroll math manual verification (byte-compare exports vs legacy). Formula-trace popover tested. Playwright checks for Run Room lifecycle.
*   **Phase 2 (Self-Service):** `tsc` clean. Role-audit e2e suites pass on v2 routes for ESS and Manager personas. Geofence clock-in manual smoke test.
*   **Phase 3 (Talent/Eng):** `tsc` clean. Grievance and Recruitment creation flows e2e tested successfully without 400/404 errors.
*   **Phase 4 (Platform):** `tsc` clean. Permission map regenerated (`scripts/generate-permission-map.js`). Permission-change e2e passes (create role → verify nav/fields/API 403 align). Security audit confirmed closed for SEC-01 through SEC-14.
*   **Phase 5 (Polish):** Axe accessibility scan reports 0 serious/critical violations on touched pages. Mobile-viewport smoke tests pass. Performance budget checks pass.

*Note: All endpoints documented were sourced directly from grep analysis of `apps/web/components/`. Known missing backend functionality is marked as a GAP for Claude to implement.*
