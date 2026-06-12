# Kredily Parity Audit

This document provides a deep comparison of our HRMS against the Kredily reference blueprint across 7 key areas.

## Parity Table

| Feature | Kredily Blueprint | Our HRMS Implementation | Gap Severity |
|---------|-------------------|--------------------------|--------------|
| **1. Payroll salary structures** | Named reusable structure templates with formula components (e.g. Basic = CTC * 0.5), multiple structures (Daily Wage, Hourly, Contractor %), assign-to-employees flow. | `SalaryStructure` is a flat, per-employee model with fixed absolute amounts. No formulas, no named templates, no dynamic rules engine. | **MISSING** |
| **2. Payroll components** | Per-component metadata configuration: taxable flag, annual limit, individual override, proof required, ESI applicable, included in CTC, applied-to count, enable toggle. | `PayrollComponent` is merely a snapshot line-item within a `Payslip`. No central DB configuration dictionary. Hardcoded statutory logic in `payroll.service.ts`. | **MISSING** |
| **3. Pay register** | Monthly generation, freeze payroll, individual payslip preview, email dispatch. | `PayrollRun` handles generation and freezing via `calculate()` and `lock()`. Individual payslips are viewable. Natively lacks email dispatch. | **PARTIAL** |
| **4. Anomaly/penalty** | Auto-penalty tracking (late marks, short hours, half day deductions), anomaly list for HR to review before payroll, grace periods. | `AttendanceRegularization` exists for requesting fixes, but no auto-penalty engine tracking short hours or auto-docking pay. | **MISSING** |
| **5. F&F encashment** | Full & Final settlement wizard with automatic leave encashment, notice period recovery, loan deductions, and asset recovery blocks. | `FullAndFinalStatement` model and `calculateFullAndFinal` service exist. Notice shortfall is auto-calculated, but leave encashment and asset cost deduction are manual data inputs. No strict wizard blockers. | **PARTIAL** |
| **6. Declaration windows** | IT declaration windows tied to payroll cycle (Apr-Dec proofs, Jan-Mar actuals), window open/close alerts. | Employees can submit declarations and proofs anytime via `submitTaxDeclaration` / `submitProof`. No time-window enforcement or alerts. | **MISSING** |
| **7. Bank export** | Configurable bank export files (ICICI, HDFC standard formats) with maker-checker flow. | `bankExport` endpoint returns a generic JSON array of account details and net pay. No bank-specific text/CSV format generation. | **PARTIAL** |

## Prioritized Gap List

### P1 - Critical for Payroll Accuracy & Compliance
- **Payroll Salary Structures & Components (MISSING)**: The lack of a rules-driven component dictionary and formula-based templates makes scaling payroll across multiple employment types (contractors, hourly, etc.) impossible without hardcoding new logic.
- **Declaration Windows (MISSING)**: Without IT declaration time-window enforcement, employees can alter declarations post-payroll-run, which risks throwing off historical TDS calculations and causing compliance issues.

### P2 - Major Operational Bottlenecks
- **Anomaly/Penalty Auto-tracking (MISSING)**: HR has to manually calculate late marks and short hours to input as payroll corrections, defeating the purpose of an integrated attendance-payroll system.
- **F&F Encashment Automation (PARTIAL)**: While basic F&F exists, lack of automatic leave encashment calculations and asset blocks requires manual intervention and leaves room for human error during employee offboarding.

### P3 - UX and Process Enhancements
- **Bank Export Formats (PARTIAL)**: Finance team must manually convert the generic JSON payload into specific bank upload formats (HDFC/ICICI).
- **Pay Register Email Dispatch (PARTIAL)**: Payslips exist but cannot be bulk-emailed automatically upon payroll lock.
