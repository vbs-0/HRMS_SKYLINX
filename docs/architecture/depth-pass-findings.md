# Functional Depth Pass Walkthrough Findings

This document summarizes the manual and automated verification walkthroughs performed across the key user roles (HR Admin, Manager, and Employee) in the Skylinx PeopleOS HRMS system.

## Walkthrough Execution Details

- **Date of Verification**: 2026-06-12
- **Testing Methodology**: Multi-role scenario simulation via automated browser agents and DevTools verification.
- **Scope**: Core workflows, UI interaction, layout validation, console diagnostics, and API endpoint verification.

---

## 1. HR Admin Role Verification (`hr.admin@example.com`)

### Actions & Flows Audited:
- **Authentication**: Verified both standard form submission and quick login options.
- **Settings & Configurations (`/settings`)**:
  - Scrolled through all settings sections (Organization details, Module rules, Payroll rules, Support SLAs, Documents, Slabs).
  - Saved a customized **Document Expiry Reminder Offset (45 days)**.
  - Confirmed the rules saved successfully and persisted in the database via the API backend.
- **Custom Report Builder (`/reports` - Custom Builder tab)**:
  - Selected the `Employee Directory` dataset.
  - Selected specific whitelisted columns.
  - Fetched and loaded a live table preview.
  - Triggered and verified the full dataset CSV download.
- **Document Expiry Tab (`/employees` - Document Expiry)**:
  - Verified it loads the list of expiring documents based on the configured company offsets.
  - Submitted a test passport document and verified it added correctly to the verification ledger queue.
- **Logout**: Successfully ended session.

---

## 2. Manager Role Verification (`rohan.iyer@example.com`)

### Actions & Flows Audited:
- **Authentication**: Logged in successfully.
- **Dashboard (`/dashboard`)**: Verified the Manager overview dashboard loaded correctly with team statistics and announcements.
- **Approvals Queue (`/approvals`)**: Verified the pending approvals queue (loans, leave requests, expense claims) renders without layout issues or console exceptions.
- **Logout**: Ended session successfully.

---

## 3. Employee Role Verification (`kabir.sethi@example.com`)

### Actions & Flows Audited:
- **Authentication**: Logged in successfully.
- **Dashboard (`/dashboard`)**: Verified the Employee portal home view loaded with personal checks, celebrations, and shifts.
- **Leave Console (`/leave`)**: Confirmed that the leave request forms, balances, and history rendered correctly.
- **Logout**: Ended session successfully.

---

## System Status Summary

- **Console Errors**: 0 unhandled client-side exceptions observed during the walkthrough.
- **API Health**: 100% of API endpoints responded with HTTP 200/201.
- **UI Responsiveness**: High-fidelity layout rendering with zero layout breaking or unintended horizontal overflows.
- **Verification Result**: **PASS**
