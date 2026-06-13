# §07 — Engagement & Ops: Social, Announcements, Surveys, Policies, Grievance, Helpdesk, Insurance, Assets

> Inventory: `inventory/engagement.md`. Primitives: §02 (CommentThread, PolicyAcknowledgeBar, AssetTag, InsuranceCard, ChallanCard). Permissions/seed: `inventory/rbac-settings.md` A3–A6.
> Permissions: `social.{read,create}`, announcements via `employees.{read,configure}`, `surveys.{read,create,configure}`, `policies.{read,create,configure}`, `grievance.{create,read,approve(update)}`, `tickets.{read,create,update}`, `insurance.{read,create,approve}`, `assets.{read,configure}`.
> **Critical fixes owned here (engagement.md):** grievance console wholly incompatible with API → 400 on submit, 404 on resolve, **crashes on any row** (§5); survey create FK-fails (companyId stamping gap) + builder is a "coming soon" toast (§3); announcements module has **no UI** + dashboard widget broken by `isPinned`/`pinned` (§2); ticket status-update has **no UI caller** → tickets uncloseable (§6); insurance claims auto-APPROVED → approval UI dead (§7); assets GET **re-seeds 5 demo rows** on empty + categories fixed to 4 (§8); social media Base64 captured but never rendered + fake birthdays (§1); policy `contentHtml` XSS via `dangerouslySetInnerHTML` (§4); ALWAYS_VISIBLE nav trap → non-HR 403s (§0).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. SOCIAL (SkyNexus) — `/social`
**Title** "SkyNexus" · **Plan** Standard. **Roles** `social.{read,create}`. **Fix seed** (engagement.md §1): managers/employees lack `social.* ` → feed 403s though it's styled all-hands; grant read/create org-wide (rbac-settings A7).
- Feed (tabs Feed/Announcements/Birthdays/Recognition — client filter on post.type), composer (title/body/type/pin), like toggle, comment drawer (CommentThread). EXISTS `GET /social/feed`, `POST /social/posts`, `POST/DELETE …/:id/like`, `POST …/:id/comments`.
- **Fixes**: render `mediaUrl` (today captured as Base64 ≤50MB but never displayed; **NEW**: move to file storage, not Base64-in-Postgres, engagement.md §1); real birthdays from `GET /dashboard/celebrations` (today fabricated rotating dates, §1); tenant-scope SocialPost (today global cross-tenant, §1); server-set `authorUserId` from JWT only (today spoofable, §1); **NEW** moderation (edit/delete/pin-toggle/report — today none).
- **States**: empty "No posts yet — say hello"; forbidden → ForbiddenState.

# B. ANNOUNCEMENTS — `/announcements` (**build UI; today API-only**, engagement.md §2)
**Roles** create `employees.configure`, read `employees.read`. (Announcements piggyback `employees.*` — not in permission seed list.)
- **Reader**: card feed, pinned-first, audience-targeted, expiry-aware; per-user read flag. **Composer (HR)**: title, body, pinned, **audience** (free string default ALL — **NEW**: structured all/location/dept/custom), publishedAt, expiresAt, require-acknowledgment. Pin toggle. **Read-receipt report** (who read, by dept). EXISTS `POST /announcements`, `GET /announcements[/:id]`, `PATCH …/:id/pin`, `POST …/:id/read`, `GET …/:id/reads`. 
- **Fix**: dashboard widget filters `a.isPinned` but API returns `pinned` → never renders (engagement.md §2); the SkyNexus "Announcement" button creates a **social post**, not an announcement — unify the two systems.

# C. SURVEYS — `/surveys` (+`/surveys/[id]`, `/surveys/[id]/results`)
**Roles** `surveys.read` (all), `surveys.create`, `surveys.configure` (results/close — managers have it).
- **List**: cards (status DRAFT/ACTIVE/CLOSED, type, anonymous flag); respond link; results link (gate `surveys.configure`).
- **Builder (NEW — today a "coming soon" toast, engagement.md §3)**: title, type, anonymous (lock after launch), startsAt/endsAt, questions[] (kind SCALE_0_10 / TEXT / **multiple-choice — NEW render**, optionsJson). **FIX CREATE** (engagement.md §3): `companyId:""` is never stamped (Survey not in tenant middleware) → FK violation → **add Survey to the tenant allowlist** so create works. EXISTS `POST /surveys`.
- **Respond** `/surveys/[id]`: one section per screen, autosave, "anonymous" banner when true. **Fix**: non-SCALE/TEXT kinds render no input today (§3) → render all kinds. EXISTS `GET /surveys[/:id]`, `POST …/:id/submit` (one per employee).
- **Results** `/surveys/[id]/results`: response rate, **eNPS gauge** (detractor/passive/promoter — **NEW**: no eNPS calc today despite branding, §3), per-question charts, anonymized text. **Fix anonymity**: results null employeeId but the row still stores it + unique(survey,employee) → anonymity is storage-level fiction (§3); for true anonymity, don't store employeeId on anonymous surveys. Close → `PATCH …/:id/close`. EXISTS `GET …/:id/results`.
- **NEW**: activate DRAFT (today status only settable at create or →CLOSED, §3); reminders to non-responders; export. **Pulse surveys/eNPS** = top market gap (blueprint §4).

# D. POLICIES — `/policies` (+`/policies/[id]`)
**Roles** `policies.read`, `policies.create`, `policies.configure` (acks/archive). Most-complete module (engagement.md §4) — polish + fix.
- **Library** (tabs All/Pending/Archived/Upload): category cards, ack status (success/warning). **Reader** `/policies/[id]`: prose layout + TOC, **PolicyAcknowledgeBar** (checkbox / typed-name / SignaturePad). **FIX XSS**: `contentHtml` is rendered via `dangerouslySetInnerHTML` (stored XSS for any `policies.create` holder, engagement.md §4) → sanitize (DOMPurify) or render markdown.
- **Acknowledgment tracker**: who acked + date; **NEW outstanding report** (who has NOT — today none, §4); ack export (audit). **Fix**: Archive button shown to all → gate to `policies.configure` (§4).
- **Admin**: create (title, category, version, requiresAck, description, contentHtml/fileUrl). **NEW**: edit/new-version (version is a string at create), un-archive, real file upload (fileUrl unused), new-joiner auto-assign (→ §03 onboarding). EXISTS `POST /policies`, `GET …[/:id]`, `POST …/:id/acknowledge`, `GET …/:id/acknowledgments`, `PATCH …/:id/archive`.
- **Letter e-signature** (click-to-sign + audit) = market gap (blueprint §4) — applies to policies + §03 letters.

# E. GRIEVANCE — `/grievance` (+`/grievance/[id]`) (**rebuild console; API works, UI is wholly incompatible**, engagement.md §5)
**Roles** create `grievance.create` (EMPLOYEE+HR), read `grievance.read` (all), update/resolve `grievance.approve` (HR). **Confidential by design.**
- **Intake (ESS)**: type/category, title, description, anonymous toggle, evidence. **FIX**: today UI sends `{subject, description, anonymous, againstEmployeeId}` but DTO needs `{employeeId, title, description, category}` → `forbidNonWhitelisted` 400s every submit (§5). Use real DTO.
- **Case room** `/grievance/[id]`: timeline (intake→ack→inquiry→findings→action→closure), private CommentThread, assignedTo (today stored, never rendered — surface it, §5), resolution. **FIX**: resolve PATCHes nonexistent `/:id/resolve` w/ `resolutionDetails` → use EXISTS `PATCH /grievance/:id` `{status, assignedToId, resolution}` (§5). **FIX list crash**: console reads `g.subject.toLowerCase()` (field doesn't exist) → TypeError on first row (§5); use `g.title`/`g.employee`/`g.resolution`.
- **Confidentiality (NEW)**: status enum is generic ApprovalStatus (no INVESTIGATING/RESOLVED/CLOSED, §5) → **NEW** grievance status enum; **anonymity is broken** — GET returns full employee even when `anonymous:true` (§5) → server must withhold identity; restricted access list + audit every view; exclude from global search/palette/AI; POSH committee mode (master plan §5.5). EXISTS `POST /grievance`, `GET …[/:id]`, `PATCH …/:id`.

# F. HELPDESK — `/support` (+`/support/[id]`)
**Roles** `tickets.{read,create,update}`. (Read is not self-scoped — every reader sees all company tickets, engagement.md §6.)
- **Raise ticket**: subject, description, priority (Low/Medium/High → SLA from `support.slaHighHours/Medium/Low` 24/48/72), queue (default `support.defaultQueue`). Generates `{ticketPrefix}-NNNNNN` (today random, collision-risk → **NEW** sequence). EXISTS `POST /tickets`.
- **Ticket room** `/support/[id]`: thread + reply (CommentThread), **SLA countdown/breach pill** (today `slaDeadline` never displayed, §6), properties (priority, queue, **assignee** — today stored never written → **NEW** assignment, §6). **FIX**: status update has **no UI caller** → tickets can never be resolved/closed (§6) → wire EXISTS `PATCH /tickets/:id/status` (also **NEW**: validate status enum, today free string). EXISTS `GET /tickets[/:id]`, `POST …/:id/comments`.
- **Admin**: categories & routing (round-robin **NEW**), SLA matrix, CSAT (**NEW**), canned responses (**NEW** — today hardcoded). **Fixes**: settings save drops `defaultQueue`/`ticketPrefix` (§6 / rbac-settings B1) → persist all support keys; replace hardcoded queues/agent-counts/FAQ/contacts (§6) with real data or labeled placeholders.
- **Knowledge base + HR chatbot** = market gap (blueprint §4; SkyNexus base exists).

# G. INSURANCE — `/insurance`
**Roles** `insurance.{read,create,approve}`. (No self-scoping — everyone sees all policies/claims, engagement.md §7.)
- Tabs Overview/Policies/Dependents/Claims. Add Policy / Add Dependent / Submit Claim (shared form). **InsuranceCard** (ESS): sum insured, validity, TPA, e-card, covered members. EXISTS `GET /insurance/policies|dependents|claims`, `POST …` (3 creates), `PATCH /insurance/claims/:id/approve|reject`.
- **FIX dead approval** (engagement.md §7): `createClaim` hardcodes `status:APPROVED` → Approve/Reject buttons (only show on PENDING) never appear for organic claims → create as PENDING. **NEW**: self-scope ("my insurance"); premium→payroll deduction linkage; policy renewal/expiry; edit/delete.
- Claims tracker timeline (intimation→docs→TPA→settled). **States**: empty per tab.

# H. ASSETS — `/assets`
**Roles** `assets.{read,configure}`. **Fix seed** (engagement.md §8): managers/employees lack `assets.read` → no "my assets" view; grant ESS read for own assets.
- Tabs Inventory/Assigned/Handover/Audit. Add Asset, Assign (employee req), Return (condition GOOD/POOR/DAMAGED), Delete (confirm). Custody timeline. EXISTS `GET /assets` (composite summary), `POST /assets`, `POST /assets/:tag/assign|return`, `DELETE /assets/:tag`.
- **FIX auto-seed** (engagement.md §8): GET silently inserts 5 demo assets when tenant has 0 + ≥1 employee → register can never be empty; remove → real EmptyState "No assets yet — add the first". **Fix**: categories hardcoded to 4 (Laptop/ID Card/Phone/Accessories) → dynamic from `type` + custom categories; `assetTag` globally unique across tenants → P2002 500 (§8) → tenant-scope or handle; assign-without-employee fallback to "first active employee" (§8) → require employee.
- **Exit hook**: clearance matrix auto-lists holder's assets, un-returned blocks clearance (→ §03 exits). Remove the duplicate static header above the real console (§8).

---

## I. Cross-cutting (this section)
- Confidential grievance excluded from search/palette/AI/exports; restricted view audit.
- All queues (tickets, claims, grievance) mirror into §10 Inbox; SLA tones unify (warning→danger).
- Tenant-scope the unscoped models: SocialPost/Like/Comment, Grievance, EmployeeInsurance/Dependent/Claim, Survey/Question/Response, AnnouncementRead, PolicyAcknowledgment (engagement.md §0).
- Every list: skeleton/empty/filtered-empty/error+ref/forbidden; mobile RecordCards.
- **Backend backlog**: add Survey to tenant allowlist (fixes create); grievance DTO/route/status/anonymity fixes; ticket status UI + assignment + sequence + persist support settings; insurance PENDING-on-create + self-scope + payroll linkage; assets remove auto-seed + dynamic categories + tenant-scope tag; announcements UI + `pinned` field fix + unify with social; policy XSS sanitize + versioning + outstanding-ack report; social media storage + real birthdays + moderation + tenant-scope + author spoof fix.
