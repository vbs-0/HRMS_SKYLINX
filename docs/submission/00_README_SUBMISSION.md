# SKYLINX PeopleOS — Submission Package (2026-06-11)

Everything reviewers need, in reading order:

## This folder (`docs/submission/`)
1. **00_README_SUBMISSION.md** — this index
2. **[01_MASTER_FEATURE_INVENTORY.md](01_MASTER_FEATURE_INVENTORY.md)** — full tech stack, all 24 modules, what's implemented, demo credentials
3. **[02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md](02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md)** — feature-by-feature comparison against Frappe HRMS v16.8.0, prioritized missing list
4. **[03_PROFESSIONAL_ROADMAP.md](03_PROFESSIONAL_ROADMAP.md)** — phased roadmap with effort estimates and risks
5. **[04_FULL_VERIFICATION_REPORT.md](04_FULL_VERIFICATION_REPORT.md)** — overnight E2E audit: 3 roles × 29 pages automated sweep (0 failures), 65/65 unit tests, all bugs found & fixed with root causes
6. **[05_COMPLETE_SYSTEM_REFERENCE.md](05_COMPLETE_SYSTEM_REFERENCE.md)** — every module's workflow/features, every API endpoint, full role×module×action permission matrix, data models, complete tech stack
7. **[06_DEMO_GUIDE.md](06_DEMO_GUIDE.md)** — click-by-click live-demo script for all 3 roles, wow-moments, hardcoded-items honesty sheet, what-not-to-click list

### Detailed Module Specifications (1-13)
*   **[Module 1: Authentication & RBAC](05_MODULE_01_AUTHENTICATION_AND_RBAC.md)** — User access control and permissions
*   **[Module 2: Employee Directory & Career Lifecycle](05_MODULE_02_EMPLOYEE_DIRECTORY.md)** — Core profiles, grades, career promotions & transfers
*   **[Module 3: Attendance & Shift Roster](05_MODULE_03_ATTENDANCE_AND_ROSTER.md)** — Logs, check-in, regularization, roster planning
*   **[Module 4: Leave Management](05_MODULE_04_LEAVE_MANAGEMENT.md)** — Types, policy, encashments, accruals, blackout dates
*   **[Module 5: Payroll & Compliance](05_MODULE_05_PAYROLL_AND_COMPLIANCE.md)** — Structures, run, statutory math (PF/ESI/PT/TDS), slabs, loans
*   **[Module 6: Expense Claims](05_MODULE_06_EXPENSE_CLAIMS.md)** — Reimbursable claims with grade-based amount caps
*   **[Module 7: Recruitment & ATS](05_MODULE_07_RECRUITMENT_ATS.md)** — Job requisitions, postings, candidates, interviews, offers
*   **[Module 8: Onboarding & Separation Lifecycle](05_MODULE_08_LIFECYCLE.md)** — Onboarding tasks, separations, exit interview, F&F settlement
*   **[Module 9: Training & Skill Assessments](05_MODULE_09_TRAINING_AND_SKILLS.md)** — Training programs, events, designations skill-gap analysis
*   **[Module 10: Travel Desk](05_MODULE_10_TRAVEL_DESK.md)** — Travel requests, itineraries, employee advances
*   **[Module 11: Social Feed & Rewards](05_MODULE_11_SOCIAL_AND_REWARDS.md)** — Vouchers, recognitions, ledger, social post interactions
*   **[Module 12: Support Helpdesk](05_MODULE_12_SUPPORT_HELPDESK.md)** — Helpdesk ticket lifecycle and comment feeds
*   **[Module 13: Settings & SaaS Administration](05_MODULE_13_SAAS_AND_SETTINGS.md)** — Plan catalogue, subscription, module toggles, company branding

### Additional Reports
*   **[07_FEATURE_BUILDOUT_REPORT.md](07_FEATURE_BUILDOUT_REPORT.md)** — Wave 3 feature completions report
*   **[08_COMPETITOR_PARITY_RESEARCH.md](08_COMPETITOR_PARITY_RESEARCH.md)** — Deep competitor features comparison
*   **[09_FULL_FEATURE_STATUS_VS_MARKET.md](09_FULL_FEATURE_STATUS_VS_MARKET.md)** — Detailed market analysis

## Supporting evidence (`docs/reference_blueprint/`)
- **[roles_and_permissions_verification.md](../reference_blueprint/roles_and_permissions_verification.md)** — E2E role audit checklist & results
- **[detailed_e2e_action_log.md](../reference_blueprint/detailed_e2e_action_log.md)** — every click/input/reaction logged per role
- Screenshots: **[images/HR_ADMIN/](../reference_blueprint/images/HR_ADMIN/)** (10 screenshots), **[images/MANAGER/](../reference_blueprint/images/MANAGER/)** (4), **[images/EMPLOYEE/](../reference_blueprint/images/EMPLOYEE/)** (5)
- Additional Specifications:
  - **[roles_and_permissions_matrix.md](../reference_blueprint/roles_and_permissions_matrix.md)**
  - **[api_endpoint_inventory.md](../reference_blueprint/api_endpoint_inventory.md)**
  - **[database_schema_mapping.md](../reference_blueprint/database_schema_mapping.md)**
  - **[architecture_diagrams.md](../reference_blueprint/architecture_diagrams.md)**
  - **[indian_tax_compliance.md](../reference_blueprint/indian_tax_compliance.md)**
  - **[detailed_module_gap_analysis.md](../reference_blueprint/detailed_module_gap_analysis.md)**
  - **[module_implementation_status.md](../reference_blueprint/module_implementation_status.md)**
  - **[testing_strategy.md](../reference_blueprint/testing_strategy.md)**
  - **[active_testing_guide.md](../reference_blueprint/active_testing_guide.md)**
  - **[project_roadmap_and_mobile_spec.md](../reference_blueprint/project_roadmap_and_mobile_spec.md)**
  - **[ui_ux_window_structures.md](../reference_blueprint/ui_ux_window_structures.md)**


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
4. Functional gaps vs the Frappe reference are enumerated and prioritized in `02_GAP_ANALYSIS_VS_FRAPPE_HRMS.md` §2 (all major functional gaps (appraisal-cycle engine, leave encashment/accrual, gratuity, payroll corrections, retention bonuses, salary withholdings) are now fully implemented).

## API port note
The API runs on **port 4000** (`/api/v1` prefix) per `.env` — earlier docs said 3001; corrected here.
