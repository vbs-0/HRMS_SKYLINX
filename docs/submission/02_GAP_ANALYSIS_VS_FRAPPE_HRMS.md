# Gap Analysis — SKYLINX PeopleOS vs Frappe HRMS v16.8.0

Comparison of our Prisma data model + modules against the full doctype catalogue of the reference open-source product (`hrms-16.8.0/hrms/hr/doctype` and `hrms/payroll/doctype`).

Legend: ✅ Implemented · 🟡 Partial · ❌ Missing

## 1. Coverage Matrix (vs Frappe doctypes)

### HR Core
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Employee, grade, employment type | ✅ | `Employee`, `EmployeeGrade`, `EmploymentType` |
| Employee onboarding / separation (+templates) | ✅ | Onboarding/Separation templates & activities |
| Exit interview, Full & Final statement | ✅ | `ExitInterview`, `FullAndFinalStatement/Asset` |
| Employee promotion / transfer | ✅ | Promotion/transfer records & approval workflows implemented |
| Employee referral | ❌ | Not modelled |
| Employee grievance (+ grievance types) | ❌ | Tickets module exists but no formal grievance workflow |
| Appointment letters (+ templates) | ❌ | No letter generation |
| Daily work summary groups | ❌ | Not planned (low priority) |
| Vehicle log / vehicle service | ❌ | Not modelled (fleet) |
| Staffing plan | ❌ | Recruitment has requisitions but no headcount plan |

### Attendance & Shift
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Attendance, attendance request (regularization) | ✅ | `AttendanceLog`, `AttendanceRegularization` |
| Employee check-in (geo/biometric) | 🟡 | Logs exist; no dedicated check-in device/geo model |
| Shift type/assignment/request/schedule/location | ✅ | Full shift suite incl. `ShiftLocation` |
| Compensatory leave request | ❌ | Overtime requests exist; no comp-off conversion |
| Upload attendance (bulk import) | ❌ | No bulk import tool |

### Leave
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Leave type/application/allocation/balance | ✅ | |
| Leave policy + assignment, ledger entries | ✅ | |
| Leave block list (+dates) | ✅ | Verified in E2E (blackout-date rejection) |
| Leave encashment | ✅ | Leave encashment request and approval workflow, with ledger adjustments |
| Earned-leave accrual schedule, leave period | ✅ | Automated earned-leave accrual calculation & processing engine |
| Holiday list assignment | ✅ | Holidays module |

### Payroll (vs `hrms/payroll`)
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Salary structure/components/slips, payroll entry | ✅ | `SalaryStructure`, `PayrollRun`, `Payslip`, `PayrollComponent` |
| Additional salary, benefit application/claim | ✅ | |
| Tax exemption declaration + proof submission | ✅ | |
| Income tax slabs (configurable) | ✅ | Configurable tax slabs (OLD/NEW regimes) in compliance engine |
| Gratuity (+rules/slabs) | ✅ | Gratuity calculation rules, approvals, and F&F dues integration |
| Retention bonus / employee incentive | ❌ | Rewards module covers recognition, not payroll-linked incentives |
| Arrears / payroll correction | ✅ | Payroll correction/arrears calculation integrated into payroll runs |
| Salary withholding | ❌ | Not modelled |
| Employee advance | ✅ | `EmployeeAdvance` (linked to travel/expenses) |
| Loan integration (salary slip loans) | ❌ | No loans module |

### Performance
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Appraisal cycles, templates, KRAs, goals | 🟡 | Performance console exists; structured appraisal-cycle/KRA/goal engine is the largest functional gap |
| 360° employee feedback | ❌ | Not modelled |

### Recruitment / Training / Travel / Expenses
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Job requisition → opening → applicant → interview → offer | ✅ | Full pipeline incl. interview feedback & offer terms |
| Interview availability scheduling tools | 🟡 | Rounds & interviewers exist; no calendar sync |
| Training program/event/feedback/result, skill maps | ✅ | |
| Travel request + itinerary + costing | ✅ | Costing partially via advances |
| Expense claim (+types, taxes, advances) | ✅ | Grade-cap auto-approval verified in E2E |

### Where SKYLINX EXCEEDS Frappe HRMS
- Multi-tenant SaaS layer (plans, subscriptions, payments, setup wizard, branding)
- Insurance module (policies, dependents, claims)
- Rewards & recognition + social feed
- Helpdesk/ticketing
- AI assistant console
- Modern stack (Next.js 15/React 19 + NestJS) vs Frappe's Python/Jinja framework

## 2. Prioritized Missing-Feature Summary

**P2:** compensatory leave, bulk attendance upload, appointment/offer letter templates (PDF generation), loans, staffing plan, employee referral.
**P3:** grievance workflow, 360° feedback, vehicle/fleet, daily work summary, calendar-synced interview scheduling.

These feed directly into the roadmap (`03_PROFESSIONAL_ROADMAP.md`).

## 3. Execution Status (updated 2026-06-11)

**Closed since the original analysis:**
- **P1 HRMS Features Fully Implemented:** Added schemas, NestJS backend services, DTOs, controllers, unit tests, and Next.js frontend console segments for Leave Encashment, Earned-leave accrual schedule, Career History (Promotions & Transfers), Gratuity calculations, Payroll Corrections, and Admin-configurable Income Tax slabs.
- **Security Hardening:** PAN, PF account AND bank account numbers are now AES-256 encrypted at rest, masked in API responses, with the payroll bank export as the single permission-gated decryption point.
- **Quality & E2E Validation:** Full 3-role × 28-page automated audit at 0 failures (all Playwright sweeps pass successfully); 49/49 backend unit tests passing cleanly; all bugs from overnight verification resolved.

## 4. Mobile / Android Readiness

The backend already supports a future Android app with no architectural changes:
- Pure stateless REST API (`/api/v1`) with JWT bearer auth — identical contract for web and mobile clients.
- Swagger/OpenAPI definitions available for client SDK generation.
- CORS-configurable; tokens are transport-agnostic (the web stores in localStorage; mobile will use secure storage).
- Role/permission enforcement is fully server-side, so a mobile client cannot bypass RBAC.
- Mobile-first spec already drafted: `docs/reference_blueprint/project_roadmap_and_mobile_spec.md` (PWA → native path).
Recommended Android approach: React Native or Flutter against the same API; add refresh-token rotation + device push notifications (FCM) in the mobile phase.
