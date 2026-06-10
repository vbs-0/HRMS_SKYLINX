# SKYLINX PeopleOS: Complete Reference Blueprint & Integration Specification

Welcome to the comprehensive technical blueprint for the **SKYLINX PeopleOS HRMS**. 

This directory contains the end-to-end specifications, architecture blueprints, database mappings, API endpoints, UI layouts, compliance rules, and testing configurations required to bring the current Skylinx HRMS to complete alignment with the reference codebase ([hrms-16.8.0](file:///c:/Users/chbha/Desktop/skylinx/HRMS/hrms-16.8.0)).

---

## Directory Map & Document Indexes

To navigate the implementation details, use the links below:

### 1. [System Architecture & Infrastructure](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/architecture_diagrams.md)
* Comprehensive architecture diagrams (system deployment, data pipelines, module interactions).
* Tech stack cross-compilation (Prisma/NestJS vs Frappe Framework).
* Tenant Isolation and SaaS design.

### 2. [Database Schema Mapping](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/database_schema_mapping.md)
* Granular database entities.
* Comparison of all 161 reference DocTypes against current Prisma models.
* Relational dependencies and missing entity fields.

### 3. [API Endpoints Inventory](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/api_endpoint_inventory.md)
* Comparison of all NestJS `@Controller` routes against reference `@frappe.whitelist` methods.
* Missing routes, param structures, HTTP actions, and permission levels.

### 4. [UI/UX Layouts, Windows & Interactions](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/ui_ux_window_structures.md)
* Form inputs, entering window structures, dialog actions, buttons, and user flows.
* Themes, layouts, and gesture interfaces.

### 5. [Indian Tax Compliance Logic](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/indian_tax_compliance.md)
* Complete math and regulatory formulas for local Indian rules:
  * Provident Fund (PF) calculations and wage limits.
  * Employee State Insurance (ESIC) calculation.
  * Gratuity slabs and experience rules.
  * Professional Tax (PT) brackets.
  * Income Tax slabs, investment declarations, and digital tax proof submissions.

### 6. [Testing Strategy & Pipelines](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/testing_strategy.md)
* Test setups for Jest (Backend API Unit & E2E) and Playwright (Frontend).
* Test suites, mocks, and deployment verification rules.

### 7. [Project Roadmap & Flutter Mobile Specifications](file:///c:/Users/chbha/Desktop/skylinx/HRMS/Hrms/docs/reference_blueprint/project_roadmap_and_mobile_spec.md)
* Dynamic completion checklist auditing completed vs remaining modules in monorepo.
* Flutter architecture, BLoC state management, Dio endpoints, and secure storage settings.
* Native screen layout specs, camera uploads, geofenced GPS checkins, and swipe gestures.

---

## Architectural Comparison Matrix: Startup CEO View

| System Metric | Reference Codebase (Frappe/ERPNext) | Target Codebase (Skylinx PeopleOS) | Business Advantage |
| :--- | :--- | :--- | :--- |
| **Framework** | Frappe (Python-based monolith) | NestJS + Next.js (TypeScript monorepo) | Superior speed, full type-safety, and modular runtime control. |
| **Database Access** | Active Record ORM (Frappe DB) | Prisma ORM (Schema-first client) | High-performance compiled SQL generation, safety against SQL injection. |
| **UI Rendering** | Frappe Page templates / Ionic Vue SPA | Next.js App Router (SSR & Client components) | Fast Server-Side Rendering (SEO), better initial page loads, modern UI aesthetics. |
| **Scaling Capability** | Monolith, scales via process duplication | Dockerized NestJS containers + Next.js Serverless | Cost-effective auto-scaling on Kubernetes/ECS. |
| **Tenant Isolation** | Site-based (Multi-tenant database) | Schema/Row-level Tenant Middleware | Cheaper infrastructure costs, unified cross-tenant analytics. |

---

## Core Objectives of the Integration
1. **Zero-Loss Migration**: Port all business-critical HR, payroll, roster, expense, and training logic from the reference python scripts without omitting database constraints.
2. **Indian Statutory Compliance**: Automate salary component deductions (PF, ESI, PT) based on Indian labour laws.
3. **Advanced Roster Management**: Create a modular planning interface supporting shift swaps and automated checkin-to-attendance conversions.
4. **Reliability Through Tests**: Implement e2e API testing and Playwright interface tests to guarantee stability.
