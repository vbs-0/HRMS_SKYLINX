# Core HR Inventory — Employees, Organization, Custom Fields

> Scope: `apps/api/src/modules/employees`, `apps/api/src/modules/organization`, `apps/api/src/modules/custom-fields` + web consoles `employees-console.tsx`, `lifecycle-console.tsx`, `organization-console.tsx`, `organization-settings-console.tsx`, `action-panels.tsx`, `live-tables.tsx`.
> Generated 2026-06-12 for the UI redesign. Every endpoint lists method, path (relative to `/api/v1`), and `@RequirePermissions` guard. "API-only" = no UI control invokes it. "UI-only" = UI calls something the API doesn't serve (or sends a payload it rejects).

---

## 0. Cross-cutting facts a redesign must respect

### 0.1 Permissions model
- API guard: `@RequirePermissions("<module>.<action>")` per route (`apps/api/src/common/auth/permissions.decorator`). Actions used in core HR: `employees.read|create|update|approve|configure`, `organization.read|update`.
- Web client mirrors route→permission via regex map `apps/web/lib/permission-map.json` (used for hiding/fetch gating). Keep it in sync if routes change.
- Role matrix lives in `docs/reference_blueprint/roles_and_permissions_matrix.md`.

### 0.2 Tenant isolation (critical quirk)
Prisma middleware (`apps/api/src/prisma/prisma.service.ts:5-93`) auto-injects `companyId`/`tenantId` into reads, writes, and creates — but ONLY for models in its allowlists. In-scope models covered: `Employee`, `Department`, `Designation`, `Location`, `CustomFieldDefinition`, `EmployeeGrade`, `EmploymentType`, `LetterTemplate`.
**NOT covered (no tenant filter applied):** `EmployeeDocument`, `EmployeeBankDetail`, `EmployeeOnboardingTemplate`, `EmployeeSeparationTemplate`, `ExitInterview`, `FullAndFinalStatement`, `EmployeePromotion`, `EmployeeTransfer`, `EmployeeLoan`, `CustomFieldValue`.
Consequences:
- `GET /employees/documents` and `GET /employees/queue/verify` return documents across ALL tenants (employees.service.ts:151-157, 1332-1339).
- Onboarding/separation templates have **no `companyId` column at all** (schema.prisma:1172, 1193) — they are globally shared across tenants.
- `EmployeeLoan` list (`listLoans`, employees.service.ts:1104) is also unscoped (currently unreachable, see §1.17).

### 0.3 Encryption / PII
- `panNumber` and `providentFundAccount` stored encrypted (AES via `common/crypto.util`), decrypted on list/detail/update responses (employees.service.ts:45-49, 229-234, 303-307).
- Bank account number stored as `accountNumberEncrypted`; responses pass through `sanitizeBankDetail()` which exposes `accountNumberMasked` only.

### 0.4 Employee status lifecycle
`EmployeeStatus` enum: `ACTIVE | INACTIVE | EXITED | PRE_ONBOARDING | PROBATION | NOTICE_PERIOD` (schema.prisma:2153-2160).
State writers: create→ACTIVE (default), onboarding/start→ACTIVE, separation/start→EXITED, resign→NOTICE_PERIOD, exit-ff/approve→EXITED, confirm-probation: PROBATION→ACTIVE. **Nothing ever sets PROBATION or PRE_ONBOARDING** — see §1.12 quirk.

---

## 1. EMPLOYEES module
Controller: `apps/api/src/modules/employees/employees.controller.ts` (route prefix `/employees`). Service: `employees.service.ts` (1406 lines).

### 1.1 Directory — list / detail / create / update
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/employees` | employees.read | includes department, designation, location, documents, grade, employmentTypeRelation; PAN/PF decrypted (svc:32-52) |
| GET | `/employees/:id` | employees.read | adds bankDetails (masked), leaveBalances, salaryStructures, addresses, educationHistory, familyDetails (svc:209-237) |
| POST | `/employees` | employees.create | nested create of addresses/education/family; **auto-seeds LeaveBalance rows for every ACTIVE LeaveType of the company** in a transaction + audit log (svc:107-147) |
| PATCH | `/employees/:id` | employees.update | partial of CreateEmployeeDto; nested arrays are **wholesale replaced** (`deleteMany: {}` then `create`) (svc:253-291) |

**DTO fields** (`dto/create-employee.dto.ts`): employeeCode, firstName, lastName, email, phone, joiningDate, companyId, departmentId, designationId, locationId, gender, dateOfBirth, panNumber, providentFundAccount, uan, gradeId, employmentTypeId, bloodGroup, maritalStatus, emergencyContactName/Phone, addresses[], educationHistory[], familyDetails[]. `UpdateEmployeeDto = PartialType(Create)`.

**UI** (`employees-console.tsx`)
- "All Employees" tab: searchable roster table (`EmployeesTable`, live-tables.tsx:199-255; client-side filter over code/name/role/dept/location). Row click opens full-screen drawer.
- "Add Employee" inline panel (lines 545-602): only code/name/email/phone/joiningDate/dept/desig/location — does NOT expose gender, DOB, PAN, grade, etc. at creation.
- Drawer edit mode (lines 656-1316): personal info, official details (dept/desig/location/grade/employment-type dropdowns), contact, bank (separate endpoint), PAN/PF, first address, first education entry, first family member. **Edit form binds employeeCode/firstName/lastName/email inputs but `handleSaveProfile` (lines 373-428) never sends them** — name/code/email edits are silently dropped. Addresses/education/family edits are also never sent in the PATCH body (UI-only inputs).
- "My Profile" tab: same drawer for the logged-in user's `employeeId` (from `/auth/me`).
- Export: client-side CSV built from `GET /employees` (lines 462-499) — there is no server export endpoint.
- A second minimal `EmployeeCreatePanel` exists in `action-panels.tsx:22-66` (used on other pages).
- "Company Profile" tab (lines 1318-1350): stats computed client-side from `/employees` + `/settings/rules`; **"Locations" header stat falls back to a hardcoded `5`** (`companyStats.locs.length || 5`, line 525).

**Quirks**
- `email` is globally `@unique` across all tenants (schema.prisma:192) — cross-tenant duplicate email creation fails confusingly.
- Drawer edit drops several bound fields (above) — UI-only inputs.
- No delete/deactivate employee endpoint at all; INACTIVE/SUSPENDED states unreachable from this module.
- No server-side pagination/filtering on `GET /employees` — full table load.

### 1.2 Bulk upload (CSV + Excel)
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/employees/bulk-upload` | employees.create | naive CSV split (no quoted-comma handling); creates employees directly — **skips leave-balance seeding, skips audit, random `EMP{n}` code fallback** (svc:159-207) |
| GET | `/employees/upload/bulk/template` | employees.read | returns CSV header string (15 columns) (svc:1344-1363) |
| POST | `/employees/upload/bulk/excel` | employees.create | XLSX via `xlsx` lib; each row goes through `create()` → leave balances ARE seeded; per-row error report `{imported, errors[]}` (svc:1365-1404) |

**UI**: "Bulk Upload" panel (employees-console.tsx:604-622) posts FormData to `/employees/bulk-upload`. **BROKEN: the panel renders a decorative drop-zone with no `<input type="file">` element**, while the handler queries `input[type="file"]` (line 343) — it always errors "Please select a CSV or Excel file". The newer Excel endpoint + template download have **no UI at all** (API-only).

### 1.3 Documents (upload, verify, expiry)
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/employees/documents` | employees.read | all documents, newest first — **not tenant-scoped** (svc:151-157) |
| POST | `/employees/:id/documents/upload` | employees.update | multer disk storage to `./uploads`, returns `{fileUrl}` only — does not create a DB row (ctrl:94-115) |
| POST | `/employees/:id/documents` | employees.update | metadata row; **`verificationStatus` is hardcoded `"VERIFIED"` on create** (svc:379-390) |
| PATCH | `/employees/:id/documents/:documentId/verify` | employees.approve | sets VERIFIED + verifiedBy/At; **no reject path** — DTO only carries optional `verifiedBy` (svc:393-406) |
| GET | `/employees/queue/verify` | employees.approve | PENDING docs, all tenants (svc:1332-1339) |

**UI**
- "Verification" tab (employees-console.tsx:1352-1409): left form submits documentType + manual **File URL string** (no file picker) to `POST /:id/documents` for the logged-in user; right side `DocumentsTable` (live-tables.tsx:257-323) lists `GET /employees/documents` with a "Verify" button on PENDING rows.
- Real binary upload exists only in `DocumentUploadPanel` (action-panels.tsx:68-141, mounted at `/documents` page): two-step upload → metadata.
- "Document Expiry" tab: reads `/reminders/upcoming-expiries` (reminders module) and color-codes by days-left (employees-console.tsx:1434-1510).

**Quirks**
- Because POST `/:id/documents` auto-VERIFIES, **the verify queue can never be fed by the normal UI flows** — the Verify button / `queue/verify` endpoint only ever see seeded or externally-created PENDING rows. The verify ledger is effectively decorative.
- `GET /employees/queue/verify` has no UI consumer (API-only); the Verification tab uses the full documents list instead.
- Upload endpoint serves files from local `./uploads` with URL built from request host — no S3/abstraction.

### 1.4 Bank details (with verification)
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| PATCH | `/employees/:id/bank-details` | employees.read (+service ownership) | self-service OR HR (`employees.update` holders); upsert; account number encrypted; **status resets to PENDING on every change** (svc:316-354) |
| PATCH | `/employees/:id/bank-details/verify` | employees.approve | body `{status: VERIFIED\|REJECTED}` (svc:357-373) |

DTO validation: account number `^\d{6,20}$`, IFSC `^[A-Z]{4}0[A-Z0-9]{6}$` (dto/bank-detail.dto.ts).

**UI**: bank block in the profile drawer (employees-console.tsx:992-1077) shows masked account + verification pill; edit mode collects holder/bank/account/IFSC/branch and PATCHes the bank endpoint only when all four required fields are present (lines 400-415). **There is no UI anywhere for the HR verify/reject action** — `bank-details/verify` is API-only. One bank account per employee (`employeeId @unique`).

### 1.5 Onboarding (templates + start)
**Endpoints**
| Method | Path | Permission |
|---|---|---|
| POST | `/employees/onboarding/templates` | employees.create |
| GET | `/employees/onboarding/templates` | employees.read |
| POST | `/employees/:id/onboarding/start` | employees.update (body `{templateId}`) |

**UI** (`lifecycle-console.tsx`, embedded as the "Lifecycle" tab of Employees console): "Onboarding" tab — start workflow (employee + template selects), create template with dynamic activity rows (title/description/assignedRole), list existing templates.

**Quirks (major)**
- `startOnboarding` (svc:437-455) **persists nothing per-employee** — it just sets the employee status to ACTIVE and echoes the template's activities. There is no task-instance table, no progress tracking, no assignee resolution. The success toast "N tasks created" is misleading.
- Templates are global (no companyId, §0.2). No update/delete endpoints for templates.
- DTO accepts departmentId/designationId scoping but the UI never sends them.

### 1.6 Separation (templates + start)
**Endpoints**: mirror of onboarding — POST/GET `/employees/separation/templates` (employees.create/read), POST `/employees/:id/separation/start` (employees.update).
**UI**: "Exit Separation" tab of lifecycle console (clearance checklist builder + start form).
**Quirks**: `startSeparation` (svc:484-502) **immediately sets status EXITED** with no clearance gating, no persisted checklist instance — same non-persistence as onboarding. No template update/delete.

### 1.7 Exit interview
**Endpoints**: POST `/employees/:id/exit-interview` (employees.update; upsert, status forced COMPLETED, svc:504-528); GET `/employees/:id/exit-interview` (employees.read; 404 if none).
**UI**: "F&F Settlement" tab of lifecycle console → "Record Exit Interview" form (employee, exit date, reason, feedback, optional interviewer). One interview per employee (`employeeId @unique`).

### 1.8 Full & Final settlement
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/employees/:id/ff-suggestions` | employees.read | query: resignationDate, exitDate, noticeDays. Computes gratuity (from tenant `GratuityRule`, fallback 5yr / 15÷26), approved leave-encashment total, outstanding approved loan balances, unpaid salary from latest non-approved payroll run, unreturned `CompanyAsset`s, notice-shortfall deduction; defaultNoticeDays from settings `exitRules` (svc:902-1028) |
| POST | `/employees/:id/full-and-final` | employees.update | upsert statement + asset rows; server recomputes gratuity/notice-shortfall/encashment when not overridden; **status saved as APPROVED immediately** (svc:539-654) |
| GET | `/employees/:id/full-and-final` | employees.read | statement + assets |
| PATCH | `/employees/full-and-final/assets/:assetId` | employees.update | `{returnedStatus: PENDING\|RETURNED\|RECOVER_COST, recoveryCost?}` (svc:665-674) |
| POST | `/employees/:id/exit-ff/approve` | employees.approve | sets statement APPROVED **and employee status EXITED** (svc:1131-1147) |

**UI**: lifecycle console "F&F Settlement" tab — auto-fills from ff-suggestions on employee/date/notice change (debounce-free, fires per keystroke on dates), editable dues fields, dynamic asset rows, generates statement; right panel renders the statement with per-asset Returned/Recover-Cost/Pending buttons. Also embeds `LeaveEncashmentTable` (leave module).

**Quirks**
- The separate `exit-ff/approve` approval endpoint is **API-only** (no UI button) and largely moot since calculation already writes APPROVED — the DRAFT default status in schema is never used.
- F&F math duplicated between `calculateFullAndFinal` and `getFfSuggestions`; comments warn it must match payroll's GratuityRule.
- UI lumps loan balance + notice shortfall into "Other Recoveries" client-side (lifecycle-console.tsx:137-139), then ALSO sends noticeShortfall separately → notice shortfall is double-deducted if the user doesn't manually fix the recovery field.
- One statement per employee (upsert by `employeeId @unique`).

### 1.9 Resignation
**Endpoint**: POST `/employees/:id/resign` (employees.update) — body `{resignationDate, lastWorkingDay, exitReason, personalEmail?}`; sets status NOTICE_PERIOD + dates (svc:1206-1222).
**UI**: **none** (API-only). No self-service "Resign" button exists anywhere in the web app; the fields `resignationDate/lastWorkingDay/exitReason/personalEmail` are never displayed either.

### 1.10 Exit letters (relieving / experience)
**Endpoints**: POST `/employees/:id/exit-letters/relieving` and `/experience` (both employees.update) — find-or-create a `LetterTemplate` of type RELIEVING/EXPERIENCE with default body, render placeholders (employeeName, companyName, joiningDate, lastWorkingDay, designation, designationTitle, employeeCode, relievingDate), return rendered text (svc:1152-1201).
**UI**: **none** (API-only). The Letter Templates tab (§1.15) covers generic templates but has no exit-letter generation buttons.

### 1.11 Probation confirmation
**Endpoint**: PATCH `/employees/:id/confirm-probation` (employees.approve) — requires current status PROBATION, sets ACTIVE + `probationConfirmedAt` (svc:1227-1244).
**UI**: **none** (API-only). **Dead-end feature**: nothing in the codebase ever sets an employee to PROBATION (creation defaults ACTIVE), so this endpoint always 400s in practice. Reminders module has a PROBATION_END reminder type referencing the same concept.

### 1.12 Resend invite / activation
**Endpoint**: POST `/employees/:id/resend-invite` (employees.update) — regenerates `inviteToken`, resets/creates the linked `User` with a random temp password, assigns EMPLOYEE role if creating, writes a Notification row (svc:1249-1303).
**UI**: **none** (API-only).
**Quirks**: temp password is embedded in plaintext in the notification body; `Role` lookup by global name `EMPLOYEE`; phone falls back to `"0000000000"`.

### 1.13 Promotions
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/employees/:id/promotions` | employees.read | |
| POST | `/employees/:id/promotions` | employees.create | from/to designation (required), from/to grade, revisedCtc, effectiveDate, reason → PENDING (svc:727-744) |
| PATCH | `/employees/promotions/:promoId/decide` | employees.approve | APPROVED applies designation/grade to employee AND, if revisedCtc set, deactivates old salary structures and **creates a new SalaryStructure** using settings-driven percentages (basicPct/hraPct/defaultTdsPct, PF/ESI/PT rules from `SettingsService.mergedRules()` + `getPayrollRules()`) (svc:746-839); `decidedByUserId` defaults to caller (ctrl:240-251) |

**UI**: read-only "Career History Timeline" in the profile drawer (`CareerHistoryPanel`, employees-console.tsx:1979-2062) — promotions/transfers tabs with status pills. **No UI to create or decide promotions** (create + decide are API-only). The timeline also renders `p.fromDesignation?.title` etc., but the list endpoint doesn't `include` those relations — names always fall back to placeholder text.

### 1.14 Transfers
**Endpoints**: GET/POST `/employees/:id/transfers` (read/create), PATCH `/employees/transfers/:transferId/decide` (employees.approve) — APPROVED applies department/location/manager to the employee (svc:849-900). All fields optional except effectiveDate.
**UI**: same read-only timeline as promotions; **create/decide are API-only**; same missing-relation-include rendering quirk.

### 1.15 Letter templates (generic)
**Endpoints**: POST `/employees/letter-templates` (employees.create), GET `/employees/letter-templates/list/:companyId` (employees.read; companyId overridden by tenant context), POST `/employees/letter-templates/render` (employees.read; `{templateId, placeholders{}}` → `{{key}}` substitution) (svc:1045-1082).
**UI**: "Letter Templates" tab (employees-console.tsx:1512-1733) — create template (type OFFER/APPOINTMENT/RELIEVING, title, body with placeholders), pick template + employee, client builds placeholder map, renders preview, `window.print()` for PDF. Letterhead in print preview is **hardcoded "Skylinx PeopleOS / 121 Innovation Way, Mumbai"** (line 1714) — white-label violation. No template update/delete endpoints.

### 1.16 Employee loans
**Endpoints actually routed**: only POST `/employees/loans` (employees.create) → creates PENDING loan (ctrl:313-317; svc:1087-1102).
**Service methods with NO controller route**: `listLoans` (svc:1104-1111) and `decideLoan` (svc:1113-1126).
**UI**: "Loans" tab (employees-console.tsx:1735-1977) — apply form (auto-computes totalPayable), loans table with admin Approve/Reject buttons. **BROKEN/UI-only: the table fetches `GET /employees/loans/list/all` and decisions PATCH `/employees/loans/:id/decide` — neither route exists → both 404.** The list is permanently empty and decisions can never be made; approved-loan EMI deduction therefore can't flow into payroll/F&F from the UI. Approve/Reject visibility gated client-side by `role === "admin"`.

### 1.17 Grades & employment types
**Endpoints**: POST `/employees/grades`, GET `/employees/grades/:companyId`, POST `/employees/types`, GET `/employees/types/:companyId` (create=employees.create, list=employees.read; companyId param overridden by tenant context) (svc:676-714). Grade carries `maxExpenseLimit` (used by expenses validation + the expense panel warning in action-panels.tsx:158-195).
**UI**: dropdowns only (profile drawer official details). **No UI to create/edit grades or employment types** — POSTs are API-only. Note Employee also still has a legacy string `employmentType` column (default FULL_TIME) alongside `employmentTypeId` relation; drawer displays relation first, falls back to the string.

### 1.18 License / seat tracking
**Endpoint**: GET `/employees/license-info` (employees.read) — active employee count vs `Subscription.plan.employeeLimit`, returns `{activeEmployees, employeeLimit, availableSeats, plan}` (svc:1308-1327).
**UI**: **none in employees console** (API-only here; the SaaS console area is its own module). Seat limit is NOT enforced on employee creation — informational only.

---

## 2. ORGANIZATION module
Controller: `organization.controller.ts` (prefix `/organization`). Service: `organization.service.ts`.

### 2.1 Org chart
**Endpoint**: GET `/organization/chart` (organization.read) — returns `{employees[] (flat nodes with managerId/managerName/photoUrl from "Profile Photo" document), departmentTree (grouped), reportingTree, unmappedEmployees}` (svc:13-61).
**UI** (`organization-console.tsx`, page `/organization`): Employee Tree (recursive cards, collapse toggles, direct/indirect reportee counts computed client-side) and Department Tree (department selector + member cards). "Export to PDF" = `window.print()` with print CSS.
**Quirks**: UI ignores the API's `photoUrl` and renders initials; a `getAvatarUrl()` helper with hardcoded randomuser.me URLs keyed to seeded demo names exists but is effectively dead code (lines 62-78). `reportingTree`/`unmappedEmployees` from the API are unused by the UI. Roots = anyone whose manager isn't in the list.

### 2.2 Manager mapping
**Endpoint**: PATCH `/organization/employees/:id/manager` (organization.update) — body `{managerId?}` (null clears); self-report guard; validates manager exists; audit log (svc:63-98).
**UI**: `ManagerMappingPanel` is fully built in `action-panels.tsx:311-350` **but is not imported/mounted on any page** — effectively API-only in the running app. The org chart has no drag-to-reassign either.

### 2.3 Departments CRUD
**Endpoints**: GET/POST `/organization/departments`, PATCH/DELETE `/organization/departments/:id` (read=organization.read, rest=organization.update). Fields: name, code (required, `@@unique([companyId, code])`), managerEmployeeId?, status (svc:101-177). Hard delete with audit.
**UI** (`organization-settings-console.tsx`, mounted as a tab inside Settings via `settings-tabs-container.tsx`): list table + add/edit inline modal (name, code, status) + delete with `confirm()`.
**Gaps**: `managerEmployeeId` (department head) is in the DTO/schema but has **no UI field** and is never displayed. Delete is a hard delete — FK failures surface as a generic error ("Make sure no employees are currently assigned"), no soft-delete/reassignment flow despite the INACTIVE status existing.

### 2.4 Designations CRUD
**Endpoints**: GET/POST `/organization/designations`, PATCH/DELETE `/:id` (same permission split). Fields: title, departmentId?, grade? (free-text string, unrelated to EmployeeGrade entity), status. GET includes `department` (svc:180-257).
**UI**: same console tab — title, grade text, status. **`departmentId` linkage has no UI field** and isn't shown in the table.
**Quirk**: two unrelated "grade" concepts coexist (Designation.grade string vs EmployeeGrade entity) — naming hazard for redesign.

### 2.5 Locations CRUD (lat/long)
**Endpoints**: GET/POST `/organization/locations`, PATCH/DELETE `/:id`. DTO fields: name, address?, city, state, country (default India), status (svc:260-340).
**Schema**: `Location` ALSO has `latitude Decimal?` / `longitude Decimal?` (schema.prisma:176-177) consumed by attendance geofenced check-in via `ShiftLocation` (attendance.service.ts:98-103).
**UI**: same console tab — name, city, state, address, country, status.
**Gap (important)**: **lat/long is not settable through any organization endpoint or UI** — the DTOs omit it entirely. Geofence coordinates can currently only exist via seed/DB edits. A redesign of the Locations form should add lat/long (and likely a geofence radius, which today is a settings-level value).

---

## 3. CUSTOM FIELDS module
Controller: `custom-fields.controller.ts` (no prefix; registers dual route aliases). Service: `custom-fields.service.ts`.

### 3.1 Field definitions CRUD
**Endpoints** (each registered under BOTH `settings/custom-fields...` and `custom-fields/definitions...` aliases):
| Method | Paths | Permission |
|---|---|---|
| POST | `/settings/custom-fields`, `/custom-fields/definitions` | employees.configure |
| GET | same + `/:id` | employees.read |
| PUT | `.../:id` | employees.configure |
| DELETE | `.../:id` | employees.configure (cascade-deletes values via schema `onDelete: Cascade`) |

DTO: `{label, fieldKey, fieldType ∈ TEXT|NUMBER|DATE|SELECT, optionsJson?, required?}`; duplicate `fieldKey` per company rejected (svc:10-31). `CustomFieldDefinition.entityType` defaults `"EMPLOYEE"` and is not exposed anywhere.

### 3.2 Employee values
**Endpoints**
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/employees/:id/custom-values`, `/custom-fields/values/:id` | employees.read + **controller-level role check: self OR roles HR_ADMIN/MANAGER** (ctrl:46-55) | returns merged definitions+values: `{id, label, fieldKey, fieldType, optionsJson, required, value}` per definition (svc:89-133) |
| PUT | `/employees/:id/custom-values` | employees.configure | bulk `{fieldKey: value}` map; unknown keys silently skipped (svc:135-171) |
| POST | `/custom-fields/values` | employees.configure | single `{employeeId, definitionId, value}`; resolves fieldKey then delegates to bulk update (ctrl:67-83) |

Values stored as `valueJson` JSON-stringified; unique per `(definitionId, employeeId)`.

### 3.3 UI — "Custom Fields" tab of Employees console (`CustomFieldsPanel`, employees-console.tsx:2067-2332)
**Severely broken — UI/API contract mismatch throughout:**
1. **Create field is broken**: UI POSTs `{name, label, type, required}` (line 2120) but API requires `{fieldKey, fieldType, ...}` → class-validator 400s every time. Field creation only works via API.
2. **Definitions list renders blank chips**: UI reads `def.name` / `def.type` (lines 2243, 2246) — API returns `fieldKey` / `fieldType`.
3. **Saved values never display**: UI builds its value map from `v.definitionId` (line 2152) but the merged GET response keys items by `id`; `valueMap[def.id]` is always undefined, so inputs always look empty even after a successful save.
4. **Type-driven inputs never engage**: `def.type` is undefined → DATE/NUMBER/BOOLEAN rendering switches never fire; everything is a text input.
5. UI offers a `BOOLEAN` field type (line 2205) that the API enum rejects; conversely the API's `SELECT` + `optionsJson` (dropdown options) have **no UI authoring support**.
6. Saving a single value (POST `/custom-fields/values`) does work server-side, so data written blind is persisted — it just can't be seen back (point 3).
7. Custom values are **not shown on the employee profile drawer** at all — only inside this panel.
8. Permission asymmetry: employees can GET their own values but PUT/POST require `employees.configure` → no self-service editing of custom fields.

---

## 4. Summary tables

### 4.1 API-only (no functioning UI control)
| Feature | Endpoint(s) |
|---|---|
| Resignation | POST `/employees/:id/resign` |
| Exit letters | POST `/employees/:id/exit-letters/relieving|experience` |
| F&F approval | POST `/employees/:id/exit-ff/approve` |
| Probation confirm | PATCH `/employees/:id/confirm-probation` (also unreachable: nothing sets PROBATION) |
| Resend invite | POST `/employees/:id/resend-invite` |
| Verify queue | GET `/employees/queue/verify` |
| License info | GET `/employees/license-info` |
| Excel bulk upload + template | GET `/employees/upload/bulk/template`, POST `/employees/upload/bulk/excel` |
| Promotion create/decide | POST `/employees/:id/promotions`, PATCH `/employees/promotions/:id/decide` |
| Transfer create/decide | POST `/employees/:id/transfers`, PATCH `/employees/transfers/:id/decide` |
| Grade / employment-type create | POST `/employees/grades`, POST `/employees/types` |
| Bank detail verify/reject | PATCH `/employees/:id/bank-details/verify` |
| Manager mapping | PATCH `/organization/employees/:id/manager` (panel exists but unmounted) |
| Custom field update/delete + bulk values | PUT/DELETE definition routes, PUT `/employees/:id/custom-values` |
| Custom field create (effectively) | POST definition — UI payload always rejected |

### 4.2 UI-only / broken UI (calls that fail or inputs that go nowhere)
| Feature | Problem |
|---|---|
| Loans list & approve/reject | UI calls GET `/employees/loans/list/all` and PATCH `/employees/loans/:id/decide` — routes don't exist (service methods unrouted) → 404, table always empty |
| Bulk upload panel | No `<input type="file">` rendered → always errors client-side |
| Custom fields panel | create 400s; list/type/value display read wrong keys (§3.3) |
| Profile drawer | employeeCode/name/email/address/education/family inputs editable but never sent on save |
| Promotion/transfer timeline | renders relation names the API doesn't include |
| Header stat | "Locations" falls back to hardcoded 5 |
| Letter print preview | hardcoded Skylinx letterhead (white-label violation) |

### 4.3 Biggest structural quirks for redesign
1. Onboarding/separation "start" persists no per-employee tasks — pure status flip + echo (needs a checklist-instance model if redesigned honestly).
2. Document verification is self-defeating (auto-VERIFIED on create; queue starves; no reject).
3. Tenant scoping holes: documents list/queue and onboarding/separation templates are cross-tenant (templates lack companyId entirely).
4. F&F double-counts notice shortfall when fed from suggestions; F&F is auto-APPROVED on calculation, making the approve endpoint redundant.
5. Location lat/long powers attendance geofencing but is unsettable via org API/UI.
6. PROBATION status is a dead end; employee statuses INACTIVE/PRE_ONBOARDING also unreachable.
7. No employee deactivation/offboarding-light, no soft deletes anywhere in org CRUD.
8. Two competing "grade" concepts (EmployeeGrade entity vs Designation.grade string) and two employment-type representations (string column + relation).
