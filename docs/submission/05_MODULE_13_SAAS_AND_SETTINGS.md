# Module 13 Specs: Settings & SaaS Administration

This document provides a comprehensive technical reference for the **Settings & SaaS Administration** module of SKYLINX PeopleOS HRMS, covering database models, backend NestJS controllers, frontend Next.js pages, role permissions, and end-to-end data flows.

---

## 1. Functional Purpose & Business Logic

The Settings & SaaS module provides the administrative foundation, controlling client onboarding, feature locks, plan gating, and tenant change logs:

1.  **SaaS Provisioning & Tenant Onboarding**:
    *   Exposes a public sign-up flow registering a new `Company` and its primary `User` (automatically assigned the `OWNER` role).
2.  **Subscription Plan Gating**:
    *   Maintains plan categories (`Plan` model) detailing price, feature sets, and `employeeLimit` constraints.
    *   **Workspaces Gate**: A custom NestJS interceptor intercepting queries. If the tenant's active headcount (`Employee` count) exceeds the subscription plan limit (`Plan.employeeLimit`), attempts to insert new employee records are rejected with a `403 Forbidden` plan capacity violation error.
3.  **Dynamic Module Configuration**:
    *   HR Admins can toggle specific HRMS modules (e.g. travel desk, helpdesk, rewards) as active or inactive (`ModuleSetting` model). If a module is deactivated, requests to its routes generate `403 Forbidden` errors.
4.  **Client Rules & Policies**:
    *   Saves custom workspace configurations (`ClientRule` table) for password complexity, check-in windows, or work-week defaults.
5.  **Global Audit Logging**:
    *   Captures and records all system mutations (`AuditLog` model). Includes details of the actor user ID, company ID, module mutated, action tag, IP address, and JSON diffs of before/after records.

### Dropdown Linkages & Connection Completion
*   **Source Fields**: 
    *   **Timezone Selector**: Standard list of timezone settings (e.g. Asia/Kolkata, UTC).
    *   **SaaS Settings Plan**: Dropdown selector displaying available billing plans (Basic, Standard, Pro).
*   **Dropdown Administration**:
    *   Billing plans are created and updated inside the System SaaS panel, writing to the `Plan` table.
    *   Subscription updates are routed via Payment Gateways, inserting billing receipts into `Payment`.
    *   Any changes made in these settings are instantly populated in the dropdown menus of the settings and plan selection screens.

---

## 2. Detailed Schema & Database Mappings

The settings and SaaS administration module uses the following models in `packages/database/prisma/schema.prisma`:

*   **`Company`**:
    *   `id` (String CUID, Primary Key)
    *   `name` (String)
    *   `legalName` (String)
    *   `logoUrl` (String, Optional)
    *   `address` (String, Optional)
    *   `taxId` (String, Optional)
    *   `workWeek` (String, Default: "Monday to Saturday")
    *   `timezone` (String, Default: "Asia/Kolkata")
    *   `status` (String, Default: "ACTIVE") // ACTIVE, SUSPENDED
*   **`ModuleSetting`**:
    *   `id` (String CUID, Primary Key)
    *   `companyId` (String CUID, Foreign Key to `Company.id`)
    *   `module` (String, e.g. "travel")
    *   `enabled` (Boolean, Default: true)
    *   *Constraint*: Unique composite index `@@unique([companyId, module])`
*   **`ClientRule`**:
    *   `id` (String CUID, Primary Key)
    *   `companyId` (String CUID, Foreign Key to `Company.id`)
    *   `category` (String, e.g. "SECURITY")
    *   `key` (String, e.g. "password_min_length")
    *   `valueJson` (Json)
    *   `status` (String, Default: "ACTIVE")
    *   *Constraint*: Unique composite index `@@unique([companyId, category, key])`
*   **`Plan`**:
    *   `id` (String CUID, Primary Key)
    *   `name` (String, Unique)
    *   `monthlyPrice` (Decimal)
    *   `annualPrice` (Decimal)
    *   `employeeLimit` (Int)
    *   `features` (Json, Optional)
*   **`Subscription`**:
    *   `id` (String CUID, Primary Key)
    *   `tenantId` (String CUID, Foreign Key to `Company.id`, Unique)
    *   `planId` (String CUID, Foreign Key to `Plan.id`)
    *   `startDate` (DateTime, Default: now)
    *   `expiryDate` (DateTime)
    *   `status` (String, Default: "ACTIVE")
*   **`Payment`**:
    *   `id` (String CUID, Primary Key)
    *   `subscriptionId` (String CUID, Foreign Key to `Subscription.id`)
    *   `amount` (Decimal)
    *   `paymentMethod` (String, Default: "CARD")
    *   `transactionId` (String, Unique, Optional)
    *   `status` (String, Default: "COMPLETED")
*   **`AuditLog`**:
    *   `id` (String CUID, Primary Key)
    *   `actorUserId` (String CUID, Foreign Key to `User.id`, Optional)
    *   `module` (String, e.g. "payroll")
    *   `action` (String, e.g. "payroll.lock")
    *   `entityType` (String)
    *   `entityId` (String, Optional)
    *   `oldValueJson` (Json, Optional)
    *   `newValueJson` (Json, Optional)
    *   `ipAddress` (String, Optional)
    *   `userAgent` (String, Optional)

---

## 3. NestJS API Controllers & Services

*   **Folder Location**: `apps/api/src/modules/settings`, `apps/api/src/modules/saas` & `apps/api/src/modules/organization`
*   **Controllers**: `settings.controller.ts`, `saas.controller.ts` & `organization.controller.ts`
*   **Endpoints**:
    *   `POST /api/v1/saas/signup`: Onboards a company, creates `Company` and primary `User` with `OWNER` role.
    *   `POST /api/v1/saas/select-plan`: Maps tenant to selected `Plan` and registers a `Payment`.
    *   `PATCH /api/v1/saas/companies/:id/status`: SaaS administrator suspends or activates companies.
    *   `PATCH /api/v1/settings/company`: Updates company metadata (timezones, addresses, tax IDs).
    *   `PATCH /api/v1/settings/modules/:module`: Updates module activation triggers (`ModuleSetting` enabled/disabled).
    *   `PATCH /api/v1/settings/rules`: Updates security rules.
    *   `GET /api/v1/settings/logs`: Returns tenant audit logs.
    *   **Organization Config Settings**:
        *   `GET/POST /api/v1/organization/departments`: Retrieve or create departments.
        *   `PATCH/DELETE /api/v1/organization/departments/:id`: Update or delete departments.
        *   `GET/POST /api/v1/organization/designations`: Retrieve or create designations.
        *   `PATCH/DELETE /api/v1/organization/designations/:id`: Update or delete designations.
        *   `GET/POST /api/v1/organization/locations`: Retrieve or create locations.
        *   `PATCH/DELETE /api/v1/organization/locations/:id`: Update or delete locations.

---

## 4. Next.js UI Screens & Multi-Role View Mappings

*   **Files**:
    *   `apps/web/app/settings/page.tsx`
    *   `apps/web/app/admin/saas/page.tsx` (SaaS administration)
    *   `apps/web/components/settings-tabs-container.tsx`
    *   `apps/web/components/organization-settings-console.tsx`

### A. SaaS Super Admin View
*   **Access Requirements**: System administrator role.
*   **UI Controls**:
    *   `SaaS Control Center` dashboard: Displays active tenants, subscription status, and platform audit logs.
    *   `Suspend Tenant` button next to company records.
    *   `Configure Billing Plans` panel: Adjust prices and limits.

### B. Company Owner View
*   **Access Requirements**: Role `OWNER` inside the tenant company.
*   **UI Controls**:
    *   `Company Details` settings page: Fields for tax IDs, timezones, and address coordinates.
    *   `Billing & Subscription` tab: Selects plans and pays renewals.
    *   `Feature Toggles` switches: Enables/disables modules (e.g. Travel Desk, Social Feed).

### C. HR Admin View
*   **Access Requirements**: Role `HR_ADMIN` with configuration permissions.
*   **UI Controls**:
    *   `Client Rules` panel: Enforces password rules, work week limits, and default shifts.
    *   `Change Log` tab: Reads company-wide audit trails.
    *   `Organization` settings tab: Full CRUD (create, read, update, delete) for departments, designations, and locations.
    *   Cannot switch subscription tiers or suspend the company tenant.

### D. Employee / Manager View
*   **Access Requirements**: Roles `EMPLOYEE` or `MANAGER`.
*   **UI Controls**:
    *   Settings pages and SaaS controls are completely hidden.

---

## 5. End-to-End Cycle Flowchart

This flowchart outlines the complete tenant provisioning, plan selection, settings customization, and plan gating cycle:

```mermaid
flowchart TD
    A[Public User: Opens /signup] --> B(Enter Company Name, Email & Password)
    B -->|Submit Form| C(API: POST /api/v1/saas/signup)
    C -->|Prisma Transaction| D[Insert Company details & User record]
    D -->|Assign Admin Role| E(DB: Assign OWNER role to User)
    E -->|Success Response| F(UI: Redirect to SaaS Select Plan page)
    
    F --> G[Company Owner: Selects Plan & clicks Pay]
    G -->|Select Plan & Payment details| H(API: POST /api/v1/saas/select-plan)
    H -->|Prisma Transaction| I[Insert Subscription & Payment status = COMPLETED]
    I -->|Activate Workspace| J(DB: Set Subscription status = ACTIVE)
    J -->|Success Response| K(UI: Redirects to Company Dashboard)
    
    K --> L[Owner: Clicks Settings -> Toggle Modules]
    L -->|Toggle off Travel Desk| M(API: PATCH /api/v1/settings/modules/travel with enabled = false)
    M -->|Write DB config| N(DB: Update ModuleSetting enabled = false)
    N -->|Update AuditLog| O(DB: Insert AuditLog action = module.update)
    
    Note over O, P: Employee Headcount Limit Check
    
    P[HR Admin: Clicks Add Employee] --> Q(Submit Profile details)
    Q -->|Submit| R(API: POST /api/v1/employees)
    R -->|Intercepts Request| S{Active Employees < Plan.employeeLimit?}
    S -->|No| T[API: Throw 403 Plan headcount limit reached]
    S -->|Yes| U[Prisma Transaction: Save Employee profile]
    U -->|Audit logged| V(DB: Insert AuditLog action = employee.create)
```
