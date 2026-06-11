# Deep E2E Action Log

This log details the step-by-step verification and interactions across the UNVERIFIED modules.

## Roles Used:
- HR_ADMIN: hr.admin@skylinx.local
- MANAGER: rohan.iyer@skylinx.local
- EMPLOYEE: kabir.sethi@skylinx.local

## PHASE 1: Demo-Critical Flow Testing (HR_ADMIN)

### 1. Payroll Verification & Compliance
* **Action**: Navigated to `/payroll` and initialized a payroll run for June 2026.
* **UI Reaction**: Run created as `6/2026 - DRAFT`.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/01_payroll_console.png`
* **Action**: Opened the month picker, filled Month (6) and Year (2026) in the modal, and clicked "Create Run".
* **UI Reaction**: Run initialized successfully.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/02_payroll_create_run_modal.png` & `03_payroll_run_initialized.png`
* **Action**: Clicked "Calculate Salary".
* **UI Reaction**: Calculated gross, deductions, and net pays for 4 seeded employees (Aarav Mehta, Priya Nair, Kabir Sethi, Sara Khan) with status `APPROVED`.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/04_payroll_calculated_salary_list.png`
* **Action**: Clicked "View Breakdown" on the first employee (Aarav Mehta).
* **UI Reaction**: Opened modal displaying earnings (Basic, HRA, Allowances) and deductions (PF, Professional Tax, TDS) correctly.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/05_payroll_salary_breakdown_modal.png`
* **Action**: Closed the modal and clicked "Bank CSV Export".
* **UI Reaction**: Initiated CSV export download/generation.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/06_payroll_bank_csv_export.png`
* **Action**: Clicked "Statutory & Tax" button.
* **UI Reaction**: Opened the statutory section with annual investment declarations.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/07_payroll_statutory_and_tax_section.png`
* **Action**: Navigated to `/compliance`.
* **UI Reaction**: Showed that the Compliance module is locked for the Standard plan.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/08_payroll_compliance_locked.png`
* **Action**: Navigated to `/saas`, selected the "Enterprise" plan, and clicked "Pay".
* **UI Reaction**: Upgraded plan to PRO, showing "PRO PLAN" in the header.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/09_saas_plan_upgraded.png`
* **Action**: Returned to `/compliance`.
* **UI Reaction**: Compliance Dashboard is now fully unlocked and displays PF, ESI, PT, and TDS statutory values, along with the Employee Compliance Register.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/10_payroll_compliance_dashboard.png`

### 2. Recruitment Pipeline Verification
* **Action**: Navigated to `/recruitment`.
* **UI Reaction**: Loaded the Recruitment dashboard displaying active job openings, total applicants, and requisitions.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/11_recruitment_dashboard_empty.png`
* **Action**: Clicked "Request Headcount" and filled details for "Senior Frontend Engineer" in Department "Engineering" with 2 openings.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/12_recruitment_headcount_modal_filled.png`
* **Action**: Submitted the headcount request.
* **UI Reaction**: Requisition created in PENDING status.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/13_recruitment_headcount_requested.png`
* **Action**: Clicked "Approve" on the headcount requisition.
* **UI Reaction**: Status updated to APPROVED.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/14_recruitment_headcount_approved.png`
* **Action**: Clicked "Create Job Vacancy" and filled details matching the requisition.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/15_recruitment_job_vacancy_modal_filled.png`
* **Action**: Submitted the vacancy.
* **UI Reaction**: Job vacancy posted successfully with ID `CTY75C`.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/16_recruitment_job_vacancy_posted.png`
* **Action**: Navigated to "Candidates" tab, clicked "Add Candidate", and filled details for Dev Kumar (dev.kumar@example.com).
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/17_recruitment_candidate_modal_filled.png`
* **Action**: Clicked "Add Candidate" to submit.
* **UI Reaction**: Dev Kumar added to applicant database under SCREENING stage.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/18_recruitment_candidate_added.png`
* **Action**: Clicked on Dev Kumar's name in the candidates list.
* **UI Reaction**: Opened the Candidate drawer/profile panel.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/19_recruitment_candidate_drawer.png`
* **Action**: Clicked "Schedule Interview Round" and filled details for Technical Round 1 with Aarav Mehta and Kabir Sethi.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/20_recruitment_interview_modal_filled.png`
* **Action**: Submitted the interview schedule.
* **UI Reaction**: Interview scheduled successfully.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/21_recruitment_interview_scheduled.png`
* **Action**: Navigated to "Interviews" tab to verify.
* **UI Reaction**: Table displays scheduled interview.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/22_recruitment_interview_list.png`
* **Action**: Opened interview feedback scorecard modal for Aarav Mehta and submitted rating 4.5/5 with "Hire".
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/23_recruitment_scorecard_modal_filled.png`
* **Action**: Executed `submit_feedback_kabir.ts` script to submit Kabir Sethi's feedback. Updated stage of Dev Kumar to Technical Interview and then to Offer.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/24_recruitment_stage_updated_tech.png` & `25_recruitment_stage_updated_offer.png`
* **Action**: Opened Dev Kumar's Candidate Profile drawer, clicked "Create & Issue Job Offer", filled Annual CTC (INR 12,00,000) and Expected Joining Date (2026-07-01).
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/26_recruitment_offer_modal_filled.png`
* **Action**: Clicked "Issue Offer Letter".
* **UI Reaction**: Toast notification "Job Offer created successfully!" displayed. Candidate status in drawer updated to "Offer Issued".
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/26_recruitment_offer_created.png`
* **Action**: Clicked "Done" to close the drawer, and navigated to the "Job Offers" tab.
* **UI Reaction**: Issued job offer for Dev Kumar displayed correctly in DRAFT status.
* **Screenshot Reference**: `docs/reference_blueprint/images/HR_ADMIN_DEEP/27_recruitment_job_offers_tab.png`

## Next: Attendance Deep Verification
*(Status: PENDING)*

