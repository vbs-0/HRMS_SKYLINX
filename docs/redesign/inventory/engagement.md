# Engagement & Services Module Inventory

Modules covered: **social (SkyNexus feed), announcements, surveys, policies, grievance, tickets (helpdesk), insurance, assets**.

Sources read: `apps/api/src/modules/{social,announcements,surveys,policies,grievance,tickets,insurance,assets}/*` (controllers, services, DTOs), `packages/database/prisma/schema.prisma`, `packages/database/prisma/seed.ts` (permission grants), `apps/api/src/prisma/prisma.service.ts` (tenant middleware), `apps/api/src/main.ts` (ValidationPipe), and web consoles `apps/web/components/{skynexus-console,social-feed,policies-console,grievance-console,support-console,insurance-console,assets-console,dashboard-widgets,settings-console,live-tables,action-panels}.tsx`, `apps/web/app/{social,policies,grievance,insurance,assets,support}/page.tsx`, `apps/web/app/(dashboard)/surveys/**`.

---

## Cross-cutting facts (read first)

### Validation
`main.ts:35-39` sets a global `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`. Any UI payload with a property not in the DTO is a **400 error**, not silently ignored. This is what breaks the grievance console (see below).

### Permission guard
`permissions.guard.ts:28-32` — `SUPER_ADMIN` role bypasses all permission checks. Everyone else needs every permission listed in `@RequirePermissions`.

### Role grants (from `packages/database/prisma/seed.ts`)
| Permission | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| social.read / social.create | yes (bypass) | yes (seed.ts:134-135) | **no** | **no** |
| announcements (uses `employees.read` / `employees.configure`) | yes | yes (both) | employees.read only | employees.read only |
| surveys.read | yes | yes | yes | yes |
| surveys.create | yes | yes | yes (seed.ts:341) | no |
| surveys.configure (results/close) | yes | yes | **yes** (seed.ts:342) | no |
| policies.read | yes | yes | yes | yes |
| policies.create / policies.configure | yes | yes | no | no |
| grievance.create | yes | yes | no | **yes** (seed.ts:355) |
| grievance.read | yes | yes | yes | yes |
| grievance.approve (update) | yes | yes (seed.ts:137) | no | no |
| tickets.read / tickets.create | yes | yes | yes | yes |
| tickets.update (status) | yes | yes (seed.ts:136) | no | no |
| insurance.read | yes | yes | **no** | yes |
| insurance.create | yes | yes | no | **yes** (seed.ts:363) — employees can create policies/dependents/claims |
| insurance.approve | yes | yes | no | no |
| assets.read | yes | yes | **no** | **no** |
| assets.configure (create/assign/return/delete) | yes | yes (seed.ts:146) | no | no |

**Notable:** Managers and Employees have **no social.* grants** — the SkyNexus page is in the always-visible nav set (`app-shell-frame.tsx:149-153`: `/social`, `/policies`, `/surveys`, `/support`, `/grievance` are ALWAYS_VISIBLE regardless of permissions), so non-HR users see the page but `/social/feed` returns 403 and the feed silently shows "No social posts". Same trap for Assets/Insurance pages for managers (nav hides them via permission-prefix filtering, but ALWAYS_VISIBLE items bypass that filter).

### Tenant isolation (critical for redesign)
`prisma.service.ts:6-17` auto-scopes only these relevant models: **CompanyPolicy, Announcement, CompanyAsset** (via `companyId`) and **Ticket, AuditLog, User** (via `tenantId`). The middleware stamps tenant on create and injects tenant into every where-clause.

**NOT tenant-scoped:** `SocialPost/Like/Comment`, `Grievance`, `EmployeeInsurance/InsuranceDependent/InsuranceClaim`, `Survey/SurveyQuestion/SurveyResponse`, `AnnouncementRead`, `PolicyAcknowledgment`. Consequences:
- `social.service.ts feed()`, `grievance.service.ts findAll()`, `insurance.service.ts policies()/dependents()/claims()`, `surveys.service.ts findAll()` run **unscoped `findMany`** → in a true multi-tenant DB these leak rows across tenants. Today's single-seed-company DB hides this.
- **Survey create is broken at the DB level**: `surveys.service.ts:14` hard-codes `companyId: ""` with a comment "Overwritten by middleware", but `Survey` is *not* in the middleware's model list, so nothing overwrites it → Postgres FK violation against `Company` on `POST /surveys`. (Announcements/Policies do the same `companyId: ""` trick but they ARE in the list, so it works for them.)

### Audit logging
social, announcements, surveys, policies, insurance write `AuditLog` rows without `actorUserId`/`tenantId` in service code (middleware stamps tenantId). tickets and assets write full audit rows including `actorUserId` (`tickets.service.ts`, `assets.service.ts audit()`).

---

## 1. Social (SkyNexus feed) — `apps/api/src/modules/social`, UI `apps/web/components/skynexus-console.tsx` (page `/social`), legacy `social-feed.tsx` (unused on /social; type-only import of fallback data)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| GET `/social/feed` | social.read | All posts, pinned first then newest; includes author+employee, likes (w/ user), comments (asc) (`social.service.ts:11-24`) |
| POST `/social/posts` | social.create | type ∈ ANNOUNCEMENT/POST/BIRTHDAY/RECOGNITION, title?, body!, mediaUrl?, mediaType?, pinned? Controller defaults `authorUserId` to JWT sub (`social.controller.ts:20-25`) |
| POST `/social/posts/:id/like` | social.create | Upsert like (idempotent); userId defaults to JWT sub |
| DELETE `/social/posts/:id/like` | social.create | deleteMany on (postId,userId) |
| POST `/social/posts/:id/comments` | social.create | body! |

No endpoints for: edit post, delete post, delete comment, pin-toggle after publish, visibility control (schema has `visibility` default "COMPANY" but no API/UI uses it), pagination (feed returns ALL posts ever).

### UI (SkyNexusConsole, 846 lines)
- Tabs: Feed / Announcements / Birthdays / Recognition (client-side filter on `post.type`); client-side search.
- Composer: title + body + type select + "Pin notice" checkbox; publishes to POST /social/posts.
- Header action modals: "Announcement" (pinned default true), "Recognize", "Wish Birthday" — all also post to `/social/posts` (NOT the announcements module).
- Like toggle (POST/DELETE like, heart fills if current JWT sub in likes), expandable comment drawer with comment form.
- Media: file picker reads file as **Base64 data-URL** (≤50MB) into `mediaUrl`... but the rendered post card **never displays mediaUrl** (the media render block was removed; state plumbed, output dropped). Base64-in-Postgres-text also means a 50MB video becomes a ~67MB DB row sent to every feed reader.
- Right rail: "Upcoming Birthdays" — **fake**: synthesizes birthday dates from a hard-coded rotating list `["Today","Tomorrow","In 3 Days","June 12",...]` applied to the first 4 employees from `/reports/employees` (`skynexus-console.tsx:135-146`). No DOB data is used.
- "Pinned Company Updates" rail: pinned **social posts** only (not announcements module).
- "Nexus Analytics" card: total posts + total likes (client computed).
- Current user name resolved by matching JWT email against `/reports/employees` rows.

### Quirks / gaps
- Employees & managers have no social.read/create → feature is HR-admin-only in practice despite being styled as an all-hands feed.
- Posts are global (no companyId on SocialPost) → cross-tenant feed leak.
- Like permission is `social.create`, not `social.read` — a hypothetical read-only role can see but not like (consistent at least).
- Old `SocialFeed` component (`social-feed.tsx`) still exists with its own simpler UI; not mounted on any page (only type import of `fallbackSocialPosts`).
- No moderation: any user with social.create can pin, post as ANNOUNCEMENT, etc. `authorUserId` is accepted from the request body (controller only fills it if absent) → **a caller can spoof another user as author**.

---

## 2. Announcements — `apps/api/src/modules/announcements`; UI: **no dedicated page** (dashboard widget only)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| POST `/announcements` | employees.configure | title!, body!, pinned?, audience? (free string, default "ALL"), publishedAt?, expiresAt? `companyId:""` stamped by tenant middleware (`announcements.service.ts:12-25`) |
| GET `/announcements` | employees.read | Only published & unexpired; pinned-first; per-employee `read` flag merged in (`announcements.service.ts:28-58`) |
| GET `/announcements/:id` | employees.read | + `read` flag |
| PATCH `/announcements/:id/pin` | employees.configure | body `{pinned: boolean}` |
| POST `/announcements/:id/read` | employees.read | body `{employeeId}`; controller forbids marking for another employee (`announcements.controller.ts:42-47`) |
| GET `/announcements/:id/reads` | employees.configure | Read-receipt report w/ employee + department |

Permissions piggyback on `employees.*` because "announcements" is not in the permission seed module list.

### UI
- **No create UI, no list page, no read-receipt report UI, no pin toggle UI, no mark-as-read call anywhere.** The only consumer is `dashboard-widgets.tsx:43-48`: fetches `/announcements`, filters `a.isPinned` — **field mismatch, API returns `pinned`** → the "Pinned Announcements" dashboard widget can never render. Its "View all announcements →" link is also `href="\notifications"` (backslash, broken route semantics) and the notifications page does not list announcements anyway.
- The SkyNexus "Announcement" button creates a **social post**, not an Announcement row — the two announcement systems are completely disconnected.

### Verdict
Effectively **API-only module** (audience targeting, scheduling/expiry, read receipts all unreachable from UI). Two seeded rows exist (`seed.ts:1083-1101`).

---

## 3. Surveys — `apps/api/src/modules/surveys`; UI `apps/web/app/(dashboard)/surveys/*` (routes `/surveys`, `/surveys/[id]`, `/surveys/[id]/results`)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| POST `/surveys` | surveys.create | title!, type!, anonymous?, startsAt?, endsAt?, status? (default DRAFT), questions[] {text!, kind!, optionsJson?} — **broken: `companyId:""` is never stamped (Survey not in tenant middleware list) → FK violation** (`surveys.service.ts:12-35`) |
| GET `/surveys` | surveys.read | All surveys (unscoped), per-employee `hasResponded` flag |
| GET `/surveys/:id` | surveys.read | + ordered questions + hasResponded |
| POST `/surveys/:id/submit` | surveys.read | Rejects non-ACTIVE; one response per employee (also `@@unique([surveyId, employeeId])`); `employeeId` nullable for non-employee users |
| GET `/surveys/:id/results` | surveys.configure | Raw responses; nulls `employeeId` if survey.anonymous |
| PATCH `/surveys/:id/close` | surveys.configure | Sets status CLOSED |

No endpoints for: activate a DRAFT survey (status only settable at create; only transition endpoint is → CLOSED), edit/delete survey, delete question, reminders, response export.

### UI
- `/surveys` list: card grid w/ status badge, type, anonymous flag; "View & Respond" link; results link shown if `useActiveRole()` returns "admin" (client-side cosmetic role, not real permissions). **"Create Survey" button is fake** — onClick shows toast "Survey builder coming soon." (`surveys/page.tsx:50`). Survey creation is **API-only** (and currently broken anyway, see above).
- `/surveys/[id]`: respond form. Renders only two question kinds: `SCALE_0_10` (0–10 buttons) and `TEXT` (textarea). Any other `kind`/`optionsJson` (e.g. multiple-choice) renders question text with **no input**. Submits `{answersJson: {questionId: answer}}`. Shows "already submitted" state via hasResponded.
- `/surveys/[id]/results`: per-question listing of raw answers, computed average for SCALE_0_10, "Close Survey" button (PATCH close). Guarded only by API permission (managers have surveys.configure, so managers can view results/close).

### Quirks
- `startsAt`/`endsAt` exist in schema/DTO but are **never enforced** (submit only checks `status === "ACTIVE"`) and never shown in UI.
- Anonymous protection is shallow: results endpoint nulls employeeId in the response, but the row still stores employeeId, and `@@unique([surveyId, employeeId])` means anonymity is storage-level fiction.
- eNPS branding in UI copy, but no eNPS calculation anywhere.

---

## 4. Policies (docs + acknowledgment) — `apps/api/src/modules/policies`; UI `policies-console.tsx` (page `/policies`)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| POST `/policies` | policies.create | title!, category!, description?, fileUrl?, contentHtml?, version? (default "1.0"), effectiveDate?, requiresAcknowledgment? (default true); status forced ACTIVE; tenant-stamped (CompanyPolicy is in middleware list) |
| GET `/policies` | policies.read | All policies for tenant w/ per-employee `acknowledged` flag |
| GET `/policies/:id` | policies.read | + acknowledged flag |
| POST `/policies/:id/acknowledge` | policies.read | body `{employeeId}`; controller forbids acknowledging for someone else; rejects ARCHIVED; upsert (idempotent) |
| GET `/policies/:id/acknowledgments` | policies.configure | Roster w/ employee + department, newest first |
| PATCH `/policies/:id/archive` | policies.configure | Sets ARCHIVED |

No endpoints for: edit policy/new version (version is just a string at create), delete, un-archive, file upload (fileUrl is a bare string; no storage integration), acknowledgment-outstanding report (who has NOT acked).

### UI (PoliciesConsole, 474 lines)
- Tabs: All Policies / Pending Acknowledgment / Archived / Upload Policy.
- All Policies: master-detail; list cards w/ category badge (colors for Leave/Conduct/IT/POSH/HR), green check if acked, orange ring if pending. Detail pane renders `contentHtml` with **`dangerouslySetInnerHTML` — stored XSS vector** (any policies.create holder can inject script) (`policies-console.tsx:1113-1117`).
- Acknowledge button: fetches `/auth/me` to get employeeId, POSTs acknowledge. Detail pane also shows live Acknowledgment Tracker (GET acknowledgments — silently empty for non-admins lacking policies.configure).
- **Archive button is rendered for every viewer** (employees included) — clicking it as a non-admin 403s with raw error message; no role gating client-side.
- Pending Acknowledgment tab: list of active+requiresAck+!acked with Acknowledge buttons.
- Upload Policy tab: full create form (title, category select incl. Finance/Safety, version, requiresAck checkbox, description, contentHtml textarea). Note: header "Upload Policy" action button has **no onClick** — only the tab works. No actual file upload despite the name; `fileUrl` DTO field unused by UI.

### Verdict
Most complete of the eight modules: every API endpoint has a UI consumer.

---

## 5. Grievance — `apps/api/src/modules/grievance`; UI `grievance-console.tsx` (page `/grievance`)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| POST `/grievance` | grievance.create | DTO: **employeeId!, title!, description!, category!**, anonymous? → status PENDING (`grievance.dto.ts`, `grievance.service.ts:11-26`) |
| GET `/grievance` | grievance.read | All grievances (unscoped, cross-tenant), includes full employee object — **even when `anonymous: true`, the employee identity is returned to any grievance.read holder (incl. the employee role itself)** |
| GET `/grievance/:id` | grievance.read | same |
| PATCH `/grievance/:id` | grievance.approve | `{status? (ApprovalStatus enum: PENDING/APPROVED/REJECTED/...), assignedToId?, resolution?}` |

`assignedToId` is stored but never read/rendered anywhere. Status is the generic `ApprovalStatus` enum — there is no INVESTIGATING/RESOLVED/CLOSED state in the DB even though the UI assumes them.

### UI (GrievanceConsole, 365 lines) — **written against a different, nonexistent API; broken end-to-end**
- Submit form sends `{subject, description, anonymous, againstEmployeeId}` to POST /grievance (`grievance-console.tsx:199-207`). Actual DTO wants `title/category/employeeId`; with `forbidNonWhitelisted` the request **400s every time** ("property subject should not exist"). Filing a grievance from the UI is impossible.
- Resolve flow PATCHes `/grievance/:id/resolve` with `{resolutionDetails}` (`grievance-console.tsx:224-229`) — **route does not exist (404)** and the field isn't in UpdateGrievanceDto anyway. Resolving from the UI is impossible.
- List rendering reads `g.subject`, `g.reporter`, `g.againstEmployee`, `g.resolutionDetails` — none exist on the API row (which has `title`, `employee`, `resolution`). Worse, the search filter calls `g.subject.toLowerCase()` (`grievance-console.tsx:241-245`) → **TypeError crash of the whole console as soon as one grievance row exists**.
- Stats cards count statuses "RESOLVED"/"CLOSED" that the enum can't produce.
- HR-resolution box gated client-side on roles SUPER_ADMIN/HR_ADMIN from `/auth/me`.
- Page header (`app/grievance/page.tsx`) shows hard-coded reference stats: "HR Contacts: Aarav Mehta", "Escalation Policy: Level-3 CEO Escalation" — decorative fiction.

### Verdict
API works (4 endpoints); **the entire web console is incompatible with it** — UI-only shell on top of mismatched contract. There is also a passing service spec (`grievance.service.spec.ts`) testing the real shape, so the API contract is the authoritative one.

---

## 6. Tickets / Helpdesk — `apps/api/src/modules/tickets`; UI `support-console.tsx` (page `/support`)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| POST `/tickets` | tickets.create | subject!, description!, priority? (default "Medium"), queue? (default from settings or "HR Helpdesk"). Generates `ticketNumber` = `{ticketPrefix or "TKT"}-{6-digit random}` (collision-possible, `@unique` would 500 on collision). Computes `slaDeadline` from settings `support.slaHighHours/slaMediumHours/slaLowHours` (defaults 24/48/72) keyed off priority (`tickets.service.ts:21-60`). Audit log + fire-and-forget SMTP notification via MailService |
| GET `/tickets` | tickets.read | All tickets for tenant (Ticket is tenant-middleware scoped; system owner sees all tenants — includes `company.name/legalName` for that purpose), with comments + commenter identity. **No per-user filtering: any employee with tickets.read sees every ticket in the company, not just their own** |
| GET `/tickets/:id` | tickets.read | + ordered comments |
| POST `/tickets/:id/comments` | tickets.create | comment!; touches ticket.updatedAt; audited |
| PATCH `/tickets/:id/status` | tickets.update | body `{status}` — **free string, no enum validation**; audited with old/new value |

No endpoints for: assignment (`assignedTo` column exists, never written), queue management CRUD (queues are strings), SLA breach query, ticket close metrics, attachment.

### Settings linkage
- `settings.service.ts:114-119` defaults: `support: { slaHighHours: 24, slaMediumHours: 48, slaLowHours: 72, defaultQueue: "HR Helpdesk", ticketPrefix: "TKT" }`.
- Settings console exposes only the 3 SLA-hour fields (`settings-console.tsx:842-857`); the PATCH body rebuilds `support` with **only** those 3 keys (`settings-console.tsx:455-459`) → saving settings **drops `defaultQueue` and `ticketPrefix`** from the stored rules (API then falls back to hard-coded defaults). Prefix/queue are effectively not admin-configurable.

### UI (SupportConsole, 1031 lines)
- Tabs: Helpdesk / Tickets / Knowledge Base / Contact.
- Helpdesk: 4 queue cards (HR Helpdesk, Payroll Support, Technical Support, Implementation) — **hard-coded array**; only the SLA label is live, and the mapping is arbitrary/misleading: HR Helpdesk shows `slaMediumHours`, Payroll shows `slaHighHours`, Technical shows `slaLowHours` (`support-console.tsx:195-205`). "Agents online" counts are fiction.
- Raise Ticket modal → POST /tickets (subject/description/priority/queue). Works. "Email" modal is the same POST dressed as an email composer (always Medium/HR Helpdesk). "Call"/"Chat" actions: hard-coded `tel:555-0199` and `https://wa.me/91555-0199`.
- Tickets tab: expandable rows w/ description, correspondence log (comments), reply box → POST comments. Timeline sidebar shows only a synthesized single "Ticket Created" event — `slaDeadline` is **never displayed**; no SLA countdown/breach UI.
- **No UI calls PATCH /tickets/:id/status** — verified by repo-wide grep; tickets can never be resolved/closed from the web app (status update is API-only). The status filter dropdown maps "Approved"→Resolved etc. purely client-side; "Rejected" filter hard-returns false.
- Header stats: "Avg Resolution 12 hours", "Support Agents 6 Online" — hard-coded.
- Knowledge Base: 5 hard-coded FAQs with category filter + accordion (client-only).
- Contact: hard-coded phone/WhatsApp/email contacts.

---

## 7. Insurance — `apps/api/src/modules/insurance`; UI `insurance-console.tsx` + `action-panels.tsx` (InsuranceActionPanel) + `live-tables.tsx` (3 tables); page `/insurance`

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| GET `/insurance/policies` | insurance.read | All EmployeeInsurance (unscoped/cross-tenant) w/ employee, dependents, claims; ordered by endDate asc |
| GET `/insurance/dependents` | insurance.read | All dependents w/ employee + insurance |
| GET `/insurance/claims` | insurance.read | All claims, newest claimDate first |
| POST `/insurance/policies` | insurance.create | employeeId!, provider!, policyNumber!, policyType!, coverageAmount!≥1, premiumAmount?≥0, startDate!, endDate! → status ACTIVE |
| POST `/insurance/dependents` | insurance.create | employeeId!, insuranceId?, fullName!, relationship!, dateOfBirth?; validates dependent belongs to policy's employee |
| POST `/insurance/claims` | insurance.create | employeeId!, insuranceId!, claimType!, claimAmount!≥1, claimDate!, claimNumber?, documentUrl? (IsUrl). **Creates with `status: APPROVED`** (`insurance.service.ts:120`) — every new claim is instantly auto-approved |
| PATCH `/insurance/claims/:id/approve` | insurance.approve | Only acts on PENDING claims; sets decidedBy/decidedAt |
| PATCH `/insurance/claims/:id/reject` | insurance.approve | same |

No endpoints for: policy renewal/expiry handling, deactivate policy/dependent, edit/delete anything, premium deduction linkage to payroll.

### UI
- Tabs: Overview / Employee Insurance / Dependents / Claims; header actions Add Policy / Add Dependent / Submit Claim (all open `InsuranceActionPanel`, a single shared form posting to the 3 create endpoints) / Export (client-side CSV per active tab).
- Tables (live-tables.tsx): policies (w/ dependent count), dependents, claims. Claims rows show Approve/Reject buttons **only when status === "PENDING"** (`live-tables.tsx:858-877`), PATCHing approve/reject with `decidedBy` = current user email.
- **Dead workflow**: since createClaim hard-codes APPROVED, UI-submitted claims never show the Approve/Reject buttons and `decideClaim` rejects non-PENDING — the entire approval UI is only reachable for the one PENDING claim created by seed (`seed.ts:656+`). Approve flow is effectively unreachable for organic data.
- Stats cards: Active Policies / Pending Claims / Dependents (live counts).
- Quirk: claim `status` filter dropdown compares lowercase against ApprovalStatus values — works.
- Employees hold insurance.create → an employee can create a policy for any employeeId (no self-scoping anywhere in this module; no "my insurance" view — everyone sees everyone's policies/claims).

---

## 8. Assets — `apps/api/src/modules/assets`; UI `assets-console.tsx` (page `/assets`, plus decorative `ReferenceModuleHeader`/`AssetsWorkflowWorkspace` above it)

### Endpoints
| Method & Path | Permission | Notes |
|---|---|---|
| GET `/assets` | assets.read | Returns a composite **summary object**: `{total, assigned, available, returned, handoverPending, categories[4], rows[], logs[]}` (`assets.service.ts:19-160`). `returned` = count of `asset.return` audit actions in last 30 logs; `handoverPending` = ASSIGNED & (condition POOR or employee EXITED); categories hard-coded to exactly Laptop / ID Card / Phone / Accessories (any other `type` is invisible in category cards) |
| POST `/assets` | assets.configure | assetTag!, type!, item!, condition?, status?, assignedToId? |
| POST `/assets/:assetTag/assign` | assets.configure | body `{employeeId?}` — **if omitted, silently assigns to the first ACTIVE employee of the tenant** (`assets.service.ts assign()` fallback) |
| POST `/assets/:assetTag/return` | assets.configure | body `{condition?}` → status RETURNED, unassigns |
| DELETE `/assets/:assetTag` | assets.configure | hard delete |

Addressing is by `assetTag` (globally `@unique` in schema across ALL tenants — creating a tag that exists in another tenant passes the service's tenant-scoped duplicate check then dies on the DB unique constraint → unhandled P2002 500).

### Auto-seeding quirk (biggest one)
`assets.service.ts summary()` step 2: **if the tenant has zero assets and ≥1 active employee, GET /assets silently inserts 5 demo assets** (SKY-LAP-001/002, SKY-ID-001, SKY-PHN-001, SKY-ACC-001, assigned to the first employees). Deleting all assets then refreshing the page resurrects mock data; a brand-new tenant's first visit fabricates an inventory. The register can never be empty.

### UI (AssetsConsole, 756 lines)
- Tabs: Inventory (category cards + table) / Assigned / Handover (ASSIGNED+POOR or employee EXITED, plus RETURNED) / Audit (log list w/ month + search filter, from `logs` in summary).
- Modals: Add Asset (type limited to the same 4 hard-coded types; optional immediate assignment), Assign (only AVAILABLE/RETURNED assets selectable; employee required — so the API's "first active employee" fallback is unreachable from UI), Return (condition GOOD/POOR/DAMAGED), per-row Assign / Return / Delete (with confirm modal).
- Quick row "Return" (`handleReturnRow`) posts without condition body → keeps existing condition.
- Export: client-side CSV of current rows.
- Header search/status/month filters all client-side.
- Decorative duplication: `app/assets/page.tsx` renders a second static `ReferenceModuleHeader` + `AssetsWorkflowWorkspace` with non-functional Add/Assign/Return/Export buttons **above** the real console (which renders its own identical working header) — two stacked headers, the top one fake.
- Employee/manager roles lack assets.read → page (in nav, not ALWAYS_VISIBLE, so hidden for them) would 403; no "my assets" employee view exists.

---

## Summary matrix: API-only vs UI-only vs broken

| Capability | State |
|---|---|
| Announcements module (create, audience, expiry, pin, mark-read, read-receipts) | **API-only** (no UI anywhere; dashboard widget broken by `isPinned` vs `pinned` mismatch) |
| Survey creation | **API-only AND broken** (UI button is a "coming soon" toast; API create FK-fails on companyId stamping gap) |
| Survey results/close | UI exists (managers+HR) |
| Ticket status update (resolve/close) | **API-only** (no UI caller) |
| Ticket assignment (`assignedTo`), SLA display | Schema-only / stored-but-never-shown |
| Grievance file + resolve from UI | **Broken** (UI contract mismatch: subject/resolve-route/resolutionDetails don't exist; console crashes on non-empty list) |
| Insurance claim approval workflow | **Dead** (claims auto-created APPROVED; buttons only render for PENDING) |
| Asset register | Full UI, but GET re-seeds 5 demo assets on empty; categories fixed to 4 types |
| Social media attachments | UI captures Base64 but never renders it; API stores it |
| Social birthdays widget | Fake dates |
| Support queues/FAQ/contacts/agent counts | Hard-coded UI fiction |
| Cross-tenant isolation for social/grievance/insurance/surveys | **Missing at API layer** (relies on single-tenant deployment) |
| Policy center | Fully wired both sides; XSS risk via contentHtml; Archive button shown to non-admins |
