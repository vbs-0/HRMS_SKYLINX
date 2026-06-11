# SKYLINX PeopleOS — Product Roadmap

**As of:** 2026-06-11 · Owner: Guna Deep

## Phase 0 — Current State (DONE)
- 24 modules live across NestJS API + Next.js 15 UI (see `01_MASTER_FEATURE_INVENTORY.md`)
- RBAC with 3 operational roles + owner, verified end-to-end with screenshot evidence (`docs/reference_blueprint/images/`)
- Jest service tests (11 suites, 65 tests passed) + Playwright E2E full audit suite
- Seed-reproducible demo environment (all role logins seeded)
- Performance / Appraisal KRA Engine fully completed
- Employee loans, grievances, 360 feedback, leave encashment, accruals, career history, tax slabs, payroll corrections, retention bonuses, salary withholdings, and gratuity rounding fully completed

## Phase 1 — Hardening & Quality (Weeks 1–2)
| Item | Detail | Effort |
|---|---|---|
| Fix a11y warnings | Add `autocomplete` + `id/name` on login/leave form fields (found in E2E console audit) | XS |
| Expand Playwright suite | Codify the manual role audit (HR_ADMIN/MANAGER/EMPLOYEE journeys) as automated E2E in `apps/web/e2e/` | M |
| API test coverage | Jest specs for leave, expenses, recruitment, travel, training services | M |
| Error handling & toasts | Replace inline alert banners with consistent toast/error UX | S |
| CI pipeline | GitHub Actions: lint, typecheck, jest, playwright, prisma migrate check | S |

## Phase 2 — P1 Functional Gaps (DONE - Wave 3)
| Item | Detail | Effort |
|---|---|---|
| Performance engine | Appraisal cycles, templates, KRAs, goals, ratings → feeds increments | L |
| Leave engine v2 | Earned-leave accrual scheduler, leave encashment, compensatory leave | L |
| Employee lifecycle v2 | Promotion & transfer records with history; appointment-letter PDF generation | M |
| Payroll v2 | Gratuity rules/slabs, arrears & payroll correction, salary withholding | L |
| Configurable tax slabs | Admin UI for income-tax slabs/regimes (currently code-level) | M |

## Phase 3 — P2/P3 + Platform (IN PROGRESS)
- Bulk attendance import + biometric/geo check-in device integration
- Loans module (salary-slip integration)
- Staffing plan & employee referral (recruitment v2), calendar-synced interviews
- Grievance workflow & 360° feedback
- Document/letter template engine (offer, appointment, relieving letters)
- Mobile PWA (per `docs/reference_blueprint/project_roadmap_and_mobile_spec.md`)
- Production readiness: PostgreSQL migration plan, backups, rate limiting, audit-log viewer UI, SSO (Google/Microsoft)

## Phase 4 — SaaS Go-To-Market
- Billing automation on `Plan/Subscription/Payment` models, usage metering
- Tenant isolation review + per-tenant branding (setup wizard already built)
- Marketplace/AI features (SkyNexus assistant expansion)

## Risks & Dependencies
1. **DB engine** — confirm production target (current dev DB) and run load testing on payroll runs.
2. **Statutory updates** — PF/ESI/PT/TDS rates need a maintained config source (Phase 2 configurable slabs mitigates).
3. **Test debt** — automated E2E (Phase 1) must land before Phase 2 refactors to protect verified behavior.
