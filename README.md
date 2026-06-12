# SKYLINX HRMS

A company-ready browser-based HRMS starter for SKYLINX HR that runs without installing dependencies.

## Included modules

- Role-based panels: Super Admin, HR/Admin, Manager, and Employee Self-Service
- Full module catalog for MVP, Version 2, and Version 3
- Dashboard with employee, attendance, leave, payroll, compliance, and HR action KPIs
- Employee directory with add-employee workflow
- Attendance tracking
- Leave requests with approval action
- Payroll summaries
- Hiring pipeline overview
- Onboarding checklist and workflow tracking
- Document verification tracking
- Compliance calendar for PF, ESI, Professional Tax, and TDS
- Reports with downloadable HRMS summary
- Security, notifications, backup, and admin controls overview
- Local browser persistence with seeded demo data

## Product documents

- [UI v2 Redesign — "Painted Paper" complete architecture](docs/redesign/README.md) (design language, full sitemap, every module blueprint, permissions & Form 16 UX, roadmap + browser mockup)
- [SKYLINX PeopleOS Blueprint](docs/SKYLINX_PEOPLEOS_BLUEPRINT.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Specification](docs/API_SPEC.md)
- [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)

## Production scaffold

This repository now includes the real product scaffold:

- `apps/web`: Next.js + Tailwind frontend
- `apps/api`: NestJS backend API
- `packages/database`: PostgreSQL Prisma schema
- `packages/shared`: shared module, role, and dashboard types
- `docker-compose.yml`: local PostgreSQL and Redis services
- `assets/skylinx-logo.png`: original SKYLINX Global Solutions logo
- `assets/skylinx-logo-display.png`: cropped display copy made from the original logo for clean UI placement

## Full-stack run plan

```powershell
cmd /c npm install
docker compose up -d
copy .env.example .env
cmd /c npm run db:generate
cmd /c npm run db:migrate
cmd /c npm run db:seed
cmd /c npm run dev
```

Web app: `http://localhost:3000`

API health: `http://localhost:4000/api/v1/health`

API docs: `http://localhost:4000/api/docs`

Default seeded HR login placeholder:

- Email: `hr.admin@skylinx.local`
- Password: `Skylinx@123`

Use this only for local development and change it before any real deployment.

## Auth flow

Public endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/forgot-password`
- `GET /api/v1/health`

Login body:

```json
{
  "email": "hr.admin@skylinx.local",
  "password": "Skylinx@123"
}
```

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Permission format is `module.action`, for example:

- `employees.read`
- `leave.approve`
- `payroll.configure`
- `reports.export`

`SUPER_ADMIN` bypasses permission checks. Other roles must have every permission required by a route.

## Run

Open `index.html` in a browser, or serve the folder with any static web server.

For example:

```powershell
python -m http.server 5173
```

Then visit `http://localhost:5173`.

## Suggested next backend phase

- Authentication and role-based access: admin, HR, manager, employee
- Database schema: employees, departments, attendance, leave, payroll, jobs, candidates
- API layer with audit logs and approval workflows
- Payroll rules for tax, PF, ESI, gratuity, bonuses, and reimbursements
- Export payslips and compliance reports
