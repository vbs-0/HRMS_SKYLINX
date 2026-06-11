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
| Employee promotion / transfer | ❌ | No promotion/transfer records — lifecycle console covers status only |
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
| Leave encashment | ❌ | Not modelled |
| Earned-leave accrual schedule, leave period | 🟡 | Balances exist; no automated accrual engine |
| Holiday list assignment | ✅ | Holidays module |

### Payroll (vs `hrms/payroll`)
| Frappe capability | SKYLINX status | Notes |
|---|---|---|
| Salary structure/components/slips, payroll entry | ✅ | `SalaryStructure`, `PayrollRun`, `Payslip`, `PayrollComponent` |
| Additional salary, benefit application/claim | ✅ | |
| Tax exemption declaration + proof submission | ✅ | |
| Income tax slabs (configurable) | 🟡 | Compliance logic present (see `indian_tax_compliance.md`); slabs not admin-configurable |
| Gratuity (+rules/slabs) | ❌ | Not modelled |
| Retention bonus / employee incentive | ❌ | Rewards module covers recognition, not payroll-linked incentives |
| Arrears / payroll correction | ❌ | No correction workflow |
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

**P1 (high business impact):** appraisal cycle/KRA/goal engine, leave encashment + earned-leave accrual, employee promotion/transfer records, gratuity, payroll correction/arrears.
**P2:** compensatory leave, bulk attendance upload, appointment/offer letter templates (PDF generation), loans, staffing plan, employee referral.
**P3:** grievance workflow, 360° feedback, vehicle/fleet, daily work summary, calendar-synced interview scheduling.

These feed directly into the roadmap (`03_PROFESSIONAL_ROADMAP.md`).

## 3. Execution Status (updated 2026-06-11)

**Closed since the original analysis:**
- Security hardening: PAN, PF account AND bank account numbers are now AES-256 encrypted at rest, masked in API responses, with the payroll bank export as the single permission-gated decryption point.
- Quality: full 3-role × 28-page automated audit at 0 failures; 43/43 unit tests; all bugs from the overnight verification fixed (see `04_FULL_VERIFICATION_REPORT.md`).

**P1–P3 items above remain roadmap features by deliberate decision**, not omissions: each is a multi-day build (data model + service + UI + tests). They are sequenced in `03_PROFESSIONAL_ROADMAP.md` Phases 2–3 and were intentionally not rushed into a verified, demo-ready build.

## 4. Mobile / Android Readiness

The backend already supports a future Android app with no architectural changes:
- Pure stateless REST API (`/api/v1`) with JWT bearer auth — identical contract for web and mobile clients.
- Swagger/OpenAPI definitions available for client SDK generation.
- CORS-configurable; tokens are transport-agnostic (the web stores in localStorage; mobile will use secure storage).
- Role/permission enforcement is fully server-side, so a mobile client cannot bypass RBAC.
- Mobile-first spec already drafted: `docs/reference_blueprint/project_roadmap_and_mobile_spec.md` (PWA → native path).
Recommended Android approach: React Native or Flutter against the same API; add refresh-token rotation + device push notifications (FCM) in the mobile phase.
