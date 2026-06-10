# Database Schema Mapping Specification

This document maps the 161 DocTypes in the reference codebase ([hrms-16.8.0](file:///c:/Users/chbha/Desktop/skylinx/HRMS/hrms-16.8.0)) to the PostgreSQL database representation in our Prisma schema ([schema.prisma](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma)).

---

## 1. Database Model Gap Overview

* **Reference Count**: 161 DocTypes (118 in HR, 43 in Payroll).
* **Current Skylinx Count**: 52 Models implemented.
* **Implemented Models**: 11 Core HR, 7 Recruitment, 5 Core Payroll, 29 SaaS/Social/Support/Logs.
* **Missing Models**: 109 Models (across Rosters, Onboarding, Training, Travel, Advanced Payroll, and Tax Compliance).

---

## 2. Core HR Module Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `employee` | `Employee` | **Implemented** | Needs fields: `emergencyContactName`, `emergencyContactPhone`, `maritalStatus`, `bloodGroup`, `residenceAddress`. (Currently, these are missing from the core `Employee` model). |
| `employee_document` | `EmployeeDocument` | **Implemented** | Needs field: `identificationDocumentType` linking to doc types. |
| `employee_bank_detail`| `EmployeeBankDetail` | **Implemented** | Complete. |
| `department` | `Department` | **Implemented** | Complete. |
| `designation` | `Designation` | **Implemented** | Complete. |
| `employment_type` | *None* | **Missing** | Create `EmploymentType` model (Permanent, Contractor, Part-Time, Intern). |
| `employee_grade` | *None* | **Missing** | Create `EmployeeGrade` model to map pay scales and benefits. |
| `employee_grievance` | *None* | **Missing** | Create `EmployeeGrievance` and `GrievanceType` models for tracking complaints. |

---

## 3. Onboarding & Separation Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `employee_onboarding` | *None* | **Missing** | Create `EmployeeOnboardingTemplate` and `EmployeeOnboardingActivity` models to track hiring checklist tasks. |
| `employee_separation` | *None* | **Missing** | Create `EmployeeSeparationTemplate` and `EmployeeSeparationActivity` models. |
| `exit_interview` | *None* | **Missing** | Create `ExitInterview` model tracking reason, interviewer notes, feedback. |
| `full_and_final_statement` | *None* | **Missing** | Create `FullAndFinalStatement` model to calculate pending salary, notice buyouts, and asset recoveries. |
| `full_and_final_asset` | *None* | **Missing** | Create `FullAndFinalAsset` model linking returnable company assets. |

---

## 4. Attendance & Shift Roster Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `attendance` | `AttendanceLog` | **Implemented** | Complete. Maps check-ins and check-outs. |
| `attendance_request` | `AttendanceRegularization` | **Implemented** | Complete. Handles regularization requests. |
| `shift_type` | `Shift` | **Implemented** | Complete. |
| `shift_assignment` | *None* | **Missing** | Create `ShiftAssignment` to assign shifts to employees for specific date ranges. |
| `shift_request` | *None* | **Missing** | Create `ShiftRequest` for shift swaps or requests. |
| `shift_schedule` | *None* | **Missing** | Create `ShiftSchedule` and `ShiftScheduleAssignment` to support roster configurations. |
| `holiday_list` | `Holiday` | **Implemented** | Complete. Maps mandatory and optional holiday calendar lists. |

---

## 5. Travel & Expense Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `expense_claim` | `Expense` | **Implemented** | Complete. |
| `travel_request` | *None* | **Missing** | Create `TravelRequest` to track flight/hotel authorization. |
| `travel_itinerary` | *None* | **Missing** | Create `TravelItinerary` containing flight details, ticket numbers, and booking URLs. |
| `employee_advance` | *None* | **Missing** | Create `EmployeeAdvance` for advance cash payouts (deducted from subsequent expenses). |

---

## 6. Training & Skills Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `training_program` | *None* | **Missing** | Create `TrainingProgram` model (Class curriculum details). |
| `training_event` | *None* | **Missing** | Create `TrainingEvent` model (Scheduled sessions). |
| `training_result` | *None* | **Missing** | Create `TrainingResult` model (Employee marks/grades for events). |
| `skill` | *None* | **Missing** | Create `Skill` and `SkillAssessment` models for organizational competencies. |
| `employee_skill_map` | *None* | **Missing** | Create `EmployeeSkillMap` linking employees to their current verified skills. |

---

## 7. Payroll, Benefits & Indian Tax Compliance Mapping

| Reference DocType | Target Prisma Model | Implementation Status | Action Required / Missing Fields |
| :--- | :--- | :--- | :--- |
| `salary_structure` | `SalaryStructure` | **Implemented** | **Needs Modifications**: Exclude hardcoded fields (ESI, PF, PT, HRA, Basic) and implement a dynamic relation to `SalaryComponent` models to allow customizable component formulas, matching the reference flexibility. |
| `salary_component` | `PayrollComponent` | **Implemented** | **Needs Modifications**: Create a master `SalaryComponent` configuration table supporting custom formulas (e.g., `base * 0.40`), tax-exemption categories, and whether it counts for PF/ESI calculation. |
| `payroll_entry` | `PayrollRun` | **Implemented** | Complete. |
| `salary_slip` | `Payslip` | **Implemented** | Complete. |
| `employee_benefit_application` | *None* | **Missing** | Create `EmployeeBenefitApplication` & `EmployeeBenefitDetail` to model flexible benefits configurations. |
| `employee_tax_exemption_declaration`| *None* | **Missing** | Create `TaxExemptionDeclaration` model tracking annual investments declared under 80C, 80D, HRA, etc. |
| `employee_tax_exemption_proof_submission`| *None* | **Missing** | Create `TaxExemptionProof` model storing uploaded proof documents. |
| `income_tax_slab` | *None* | **Missing** | Create `IncomeTaxSlab` and `TaxableSalarySlab` tables representing tax rates (New vs Old tax regimes in India). |
| `gratuity` | *None* | **Missing** | Create `Gratuity` and `GratuityRule` models for terminal payouts. |
| `additional_salary` | *None* | **Missing** | Create `AdditionalSalary` table for monthly variable payouts/deductions (bonuses, salary advances). |

---

## 8. Database Relationships & Schema Constraints

Below is the database relationship mapping for new tables that must be appended to [schema.prisma](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/packages/database/prisma/schema.prisma):

```prisma
// Example Schema Additions for Recruitment & Lifecycle Expansion

model EmploymentType {
  id        String     @id @default(cuid())
  name      String     @unique
  employees Employee[]
}

model ShiftAssignment {
  id         String   @id @default(cuid())
  employeeId String
  shiftId    String
  fromDate   DateTime
  toDate     DateTime?
  employee   Employee @relation(fields: [employeeId], references: [id])
  shift      Shift    @relation(fields: [shiftId], references: [id])
}

model TaxExemptionDeclaration {
  id         String                   @id @default(cuid())
  employeeId String
  year       Int
  regime     String                   // OLD, NEW
  status     ApprovalStatus           @default(PENDING)
  items      TaxExemptionDeclarationItem[]
  employee   Employee                 @relation(fields: [employeeId], references: [id])
}

model TaxExemptionDeclarationItem {
  id            String                  @id @default(cuid())
  declarationId String
  category      String                  // e.g. 80C, 80D, HRA
  declaredAmount Decimal
  declaredProof Url?
  declaration   TaxExemptionDeclaration @relation(fields: [declarationId], references: [id])
}
```
