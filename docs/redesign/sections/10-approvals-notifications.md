# §10 — Approvals Inbox & Notifications/Reminders

> Inventory: `inventory/platform.md` §8 (notifications/reminders), §9 (approvals). Primitives: §02 (Drawer, Toast, Banner, ApprovalTrail, CommentThread). Master plan §6 (unified inbox, notifications). Workflow routing keys: `rbac-settings.md` B1 `approvals.*`.
> Permissions: `approvals.{read,approve}`; per-module decide also via `leave.approve`/`attendance.approve`/`expenses.approve`/`insurance.approve`/`payroll.approve`; `notifications.{read,create,update}`; reminders `settings.configure`.
> **Correctness fixes owned here (platform.md):** inbox `GET /approvals` merges **only leave + attendance** but `decide` handles 5 modules → expenses/insurance/payroll decidable but never listed (§9); **no tenant scoping** on the inbox → aggregates/decides across all tenants (§9); **no approver-chain** logic — any `approvals.approve` holder decides anything one-step; routing ClientRule strings decorative (§9); approving leave here does **not** deduct balance (§9 — real flow is leave module); seeded MANAGER lacks `approvals.read/approve` → managers can't use the inbox (§9); notification channels EMAIL/WHATSAPP/PUSH create **DB rows only, nothing dispatched** (§8.1); **no "my notifications" endpoint** — recipients can't read their own (§8.1); reminders **only DOCUMENT_EXPIRY works** (BIRTHDAY/WORK_ANNIVERSARY/LEAVE_BALANCE/PROBATION_END stored but no-op, §8.2); no scheduler — all manual POST (§8.2); Templates tab hardcoded (§8.1); "Escalated" approvals tab filters a status that never exists (§9); approvals "Inspect" modal shows **fabricated** detail text (§9).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. Unified Approvals Inbox — `/inbox` (replaces `/approvals`)
**Title** "Inbox" · **Breadcrumb** Inbox · **Roles** `approvals.read` OR any module approver (`leave.approve`∥`attendance.approve`∥`expenses.approve`∥`insurance.approve`∥`payroll.approve`). **Plan** Standard.
**Fix seed (rbac-settings A7)**: grant managers `approvals.read/approve` so the inbox replaces per-console approval (today managers approve from leave/attendance consoles, platform.md §9).

### Layout
Left filter rail (counts): **All · Leave · Attendance/Regularization · Expenses · Travel · Loans · Insurance claims · Recruitment offers · Document change-requests · Separations** · **Tasks** (non-approval to-dos). Center list. Right detail pane (≥xl) or Drawer.

### List
- **Row**: requester Avatar+name, type glyph, one-line summary ("EL · 3 days · 14–16 Jul"), amount (MoneyText if money), age chip (warning >3d, danger >7d), SLA dot.
- **Sort**: age, type, amount. **Bulk**: select-all-in-filter → Approve / Reject (reason) / Forward; destructive/bulk previews count + total.
- **States**: empty "Inbox zero — nothing waiting on you" (success check); filtered-empty; error+ref; forbidden.

### Detail pane
Full request + context block (balances for leave; cap/spend for expense; roster impact for shift), **policy verdicts** (same component as §04/§05), attachments viewer, **ApprovalTrail** (who's before/after me — from §B workflow), **CommentThread** (request clarification → notifies requester), actions **Approve** (primary) / **Reject** (reason required) / **Forward** (delegate + note). 
- **FIX (platform.md §9)**: remove the fabricated "Inspect" narrative (hardcoded reason/receipt/shift text) — render the real record.

### API
- List: EXISTS `GET /approvals` (**fix**: extend to merge expenses/insurance/travel/loans/offers — today only leave+attendance, platform.md §9; **add tenant scoping** — today cross-tenant). 
- Decide: EXISTS `POST /approvals/:module/:id/decision {approve|reject}` (handles leave/attendance/expenses/insurance/payroll). **FIX**: leave decision here must run the real balance-deducting flow (today this path skips it, platform.md §9) — delegate to the module service; add tenant scoping (today decides any tenant's record by id).
- **Tasks tab**: non-approval to-dos (onboarding items §03, clearance items §03, proof batches §05, survey to take §07, review due §06) — **NEW** `GET /tasks (session)`.
- Keyboard: `j/k` navigate, `a/r` approve/reject, `u` undo within 8s (where workflow allows).

# B. Approval workflow engine (master plan §6; **NEW** — today routing strings are decorative, platform.md §9)
Per-process chains (Leave, Regularization, OT, Expense, Travel, Loan, Comp revision, Offer, Requisition, Document change, Exit, Payroll lock). Builder lives in §08 Settings → Workflows; the **ApprovalTrail** everywhere renders from this one engine (one mental model). Until built, the `approvals.*` ClientRule strings ("Manager then HR", rbac-settings B1) and `approvals.expenseApproval/documentVerification/payrollApproval` are display-only. **NEW** `GET/POST /workflows`, resolver that produces the ordered approver list per request; self-approval guard; SLA → escalate; delegation/OOO.

---

# C. Notifications
## C1. Bell drawer (topbar, §01) — **fix decorative bell** (shell.md §1.2)
Last 30, grouped Today/Earlier; filter chips All | Approvals | Mentions | System; unread dot; click deep-links. "Mark all read". Unread **count badge** (NEW `GET /notifications/count`). 
- **FIX (platform.md §8.1)**: there is **no "my notifications" endpoint** — `GET /notifications` is `notifications.read` (HR-only) and returns ALL rows cross-tenant → **NEW** `GET /notifications/mine (session)` returning the caller's own, tenant-scoped. 
- Mark read: **NEW** `PATCH /notifications/:id/read`.

## C2. Notifications center — `/notifications`
**Roles** `notifications.read` (admin broadcast view), `notifications.create`. Queue table (channel/status/search filter), per-row "mark sent" EXISTS `PATCH /notifications/:id/sent`; send panel (audience ALL/HR + channel + title/body) EXISTS `POST /notifications`. 
- **FIX (platform.md §8.1)**: channels EMAIL/WHATSAPP/PUSH create DB rows only — **NEW**: real dispatch workers (SMTP exists via reminders/MailService; wire WhatsApp/push via §08 integrations) or label channel "in-app only" until wired. Replace hardcoded Templates tab with real template CRUD (**NEW**) or remove.

## C3. Notification preferences matrix — `/settings/notifications` (master plan §6; **NEW**)
**Roles** session (own prefs) + `settings.configure` (org defaults). Grid: **event × channel** (in-app/email/whatsapp/push) per user, with org default + lock toggle. **NEW** `GET/PUT /notifications/preferences`. Events: approvals, mentions, payroll published, declaration window, doc expiry, probation ending, reminders.

# D. Reminders engine — `/reminders` (master plan §6, market gap blueprint §4)
**Roles** `settings.configure`. Rules table: event (BIRTHDAY, WORK_ANNIVERSARY, **DOCUMENT_EXPIRY**, LEAVE_BALANCE, PROBATION_END, + NEW: certification expiry, contract end, declaration window, payroll lock), daysOffset, audience (employee/manager/HR), channel (in-app/email/both), template (subject/body w/ `{{placeholders}}`), enabled. Preview upcoming-30-days. "Process Now". 
- EXISTS `POST/GET/PATCH /reminders`, `POST /reminders/process`, `GET /reminders/upcoming-expiries` (consumed by §03/§04). 
- **FIX (platform.md §8.2)**: only DOCUMENT_EXPIRY does anything — BIRTHDAY is dead code, the other three are stored/counted but no-op → **implement each event type**. `{{placeholders}}` are never substituted → implement substitution. `processedCount` counts rules not reminders → fix copy. **NEW scheduler** (today manual button only; processing across all visible tenants when owner runs it — scope it).
- **States**: empty "No reminder rules yet — add one".

---

## E. Cross-cutting (this section)
- Every approvable surface (leave/expense/travel/insurance/offer/regularization/exit) routes into the **one** Inbox; per-console approval buttons remain as shortcuts but call the same decide path.
- Toasts only for actions the user just took; ambient events go to the bell (§02).
- Banners for time-bound prompts (declaration window closing, payroll lock approaching, proofs due) — dismiss persists per key.
- Tenant-scope Notification + approval source models (platform.md §0.2/§9).
- Mobile: Inbox swipe approve/reject (reference §5.3); bell drawer full-height sheet; bottom-tab "Inbox" badge.
- **Backend backlog**: extend `GET /approvals` to all modules + tenant-scope + real leave-balance flow; workflow engine + resolver; `GET /notifications/mine` + count + mark-read; real channel dispatch; notification preferences endpoints; implement all reminder event types + placeholder substitution + scheduler; tasks endpoint; manager approvals seed grant.

## F. Post-critique remediations (98 §D)
- **Tenant-scoping insufficient alone (D-2):** the inbox `decide` cross-tenant-by-id fix needs the §08/§12 TenantMiddleware fix (verify JWT + stop trusting `x-tenant-id`), not just a `companyId` filter.
- **Workflow ownership boundary (D-15):** §10 B owns the **runtime engine/resolver + ApprovalTrail**; the **builder UI is owned by §08 J1** (`/settings/workflows`). The earlier "builder lives in §08" pointer now resolves to a real §08 section.
- **`GET /notifications/recipients` (D-11):** wire it to the §C2 send-panel audience picker (today API-only) or remove it.
- **Shared scheduler (D-16):** the reminders scheduler (§D) and the §09 report scheduler must share **one** job-runner/cron substrate (no cron exists today, platform.md §8.2) — build one primitive, not two.
