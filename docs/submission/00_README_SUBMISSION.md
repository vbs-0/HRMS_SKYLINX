# SKYLINX PeopleOS — Submission Package (2026-06-11)

Everything reviewers need, in reading order:

## This folder (`docs/submission/`)
1. **00_README_SUBMISSION.md** — this index
2. **[01_MASTER_FEATURE_INVENTORY.md](01_MASTER_FEATURE_INVENTORY.md)** — full tech stack, all 23 modules, what's implemented, demo credentials
3. **[02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md](02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md)** — feature-by-feature comparison against Frappe HRMS v16.8.0, prioritized missing list
4. **[03_PROFESSIONAL_ROADMAP.md](03_PROFESSIONAL_ROADMAP.md)** — phased roadmap with effort estimates and risks
5. **[04_FULL_VERIFICATION_REPORT.md](04_FULL_VERIFICATION_REPORT.md)** — overnight E2E audit: 3 roles × 28 pages automated sweep (0 failures), 43/43 unit tests, all bugs found & fixed with root causes
6. **[05_COMPLETE_SYSTEM_REFERENCE.md](05_COMPLETE_SYSTEM_REFERENCE.md)** — every module's workflow/features, every API endpoint, full role×module×action permission matrix, data models, complete tech stack
7. **[06_DEMO_GUIDE.md](06_DEMO_GUIDE.md)** — click-by-click live-demo script for all 3 roles, wow-moments, hardcoded-items honesty sheet, what-not-to-click list

## Supporting evidence (`docs/reference_blueprint/`)
- `roles_and_permissions_verification.md` — E2E role audit checklist & results
- `detailed_e2e_action_log.md` — every click/input/reaction logged per role
- `images/HR_ADMIN/` (10 screenshots), `images/MANAGER/` (4), `images/EMPLOYEE/` (5)
- `roles_and_permissions_matrix.md`, `api_endpoint_inventory.md`, `database_schema_mapping.md`, `architecture_diagrams.md`, `indian_tax_compliance.md`, `detailed_module_gap_analysis.md`, `module_implementation_status.md`, `testing_strategy.md`, `active_testing_guide.md`

## Runtime logs
- `logs/api.log`, `logs/web.log` — clean (no errors/exceptions in last audit)

## How to run
```
npm install
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev          # web on :3000, api on :3001
```
Logins: see credentials table in `01_MASTER_FEATURE_INVENTORY.md` §4.

## Known issues (honest disclosure — updated after overnight verification 2026-06-11)
1. ~~Seed missing MANAGER/EMPLOYEE accounts~~ **FIXED** — fully seeded incl. pending approval demo data.
2. ~~A11y console warnings~~ **FIXED** (autocomplete + id/name added). ~~Branding 404 on every page~~ **FIXED**. ~~SaaS 500 (tenant middleware bug)~~ **FIXED**. ~~Missing favicon~~ **FIXED**. See `04_FULL_VERIFICATION_REPORT.md` §2.
3. ~~Bank account numbers not encrypted~~ **FIXED 2026-06-11** — AES-256 at rest, masked in API responses, decrypted only in the permission-gated payroll bank export. **Open:** payroll statutory *rates* (PF 12%, ESI 0.75/3.25%, thresholds) are coded to current Indian law and verified by unit tests, but slab amounts are not yet admin-editable (structure amounts ARE admin-editable per employee); mobile breakpoints untested.
4. Functional gaps vs the Frappe reference are enumerated and prioritized in `02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md` §2 (largest: appraisal-cycle engine, leave encashment/accrual, gratuity, payroll corrections).

## API port note
The API runs on **port 4000** (`/api/v1` prefix) per `.env` — earlier docs said 3001; corrected here.
