# §12 — Auth & First-Run Onboarding

> Inventory: `inventory/platform.md` §1 (auth), §4 (saas signup/onboarding), `inventory/shell.md` §7 (auth chrome). Master plan §6 (auth & first-run, stale-JWT prompt). Primitives: §02 (OTPInput, FormField, Wizard). Settings keys written by setup: `rbac-settings.md` B.
> Permissions: auth endpoints `@Public`; setup `settings.configure`; signup `@Public`.
> **Correctness/security fixes owned here (platform.md):** OTP request/verify + forgot-password are **echo stubs** (no token, no email) and have **no UI** (§1); marketing claims "Login using OTP" / "2FA Active" but it's UI-only (§1); 15-min JWT, **no refresh endpoint** → hard 401 every 15 min (§0.1); **no server logout / token revocation** (§1); login doesn't check `Company.status` → **SUSPENDED tenant users still log in** (§1); failed logins not audited, **no lockout/rate-limit** (§1); `expiresIn:900` hardcoded vs JwtModule (§1); self-signup grants **SUPER_ADMIN** = owner-bypass (§4.3); signup payment is **simulated** (prefilled fake card, client-trusted amount, no gateway) (§4.6); `peopleos_plan` cookie reconciliation can hard-reload on login (shell.md §1.3); stale-JWT `tenantId=null` class (master plan §6).
> Legend: **EXISTS `METHOD /path`** · **NEW `METHOD /path` (perm)**.

---

# A. Login — `/login`
**Title** "Sign in to {platformBrand}" · **Public** (white-label chrome from `GET /settings/public-profile`).
### Layout
Branded card (logo from branding, **fix** `alt="Acme Corp"` placeholder, shell.md §7): email, password, **Remember me**, **Forgot password?** link (**NEW** — none today), primary **Sign in**, divider, **Sign in with OTP** (**NEW**), SSO buttons (**NEW**, when tenant SSO configured §08). 
### Fields
- email (type email, autocomplete username, req), password (type password, autocomplete current-password, req).
- **Errors**: invalid creds "Email or password is incorrect" (generic — don't reveal which); **NEW** suspended-tenant "This workspace is suspended — contact your admin" (fix: today SUSPENDED can log in, platform.md §1); rate-limit "Too many attempts, try again in N min" (**NEW** lockout).
### Flow
EXISTS `POST /auth/login` → `{accessToken, expiresIn:900, user, activePlan}`; store token (`peopleos_access_token`), write `peopleos_plan` cookie, route `/dashboard`. **Fixes**: audit failed logins + lockout/rate-limit (platform.md §1); check `Company.status` (block SUSPENDED); single source for expiry (don't hardcode 900); avoid the login→reload plan-cookie churn (shell.md §1.3). 
### Toasts
success → redirect; fail → inline error (not toast).

# B. OTP login — `/login` (OTP mode) (**build real; today stubs, platform.md §1**)
- Request: email/phone → **NEW real** `POST /auth/otp/request` (generate OTP, store hashed w/ expiry, send via SMTP/WhatsApp §08; today echoes input). 
- Verify: **OTPInput** (6 cells, paste-aware §02) → **NEW real** `POST /auth/otp/verify` (validates, issues JWT; today echoes, never tokens). Resend timer, attempt cap.
- **Until built**: hide the OTP option (don't ship the stub as if it works — current marketing claims are UI-only, platform.md §1).

# C. Forgot / reset password — `/forgot`, `/reset/[token]` (**NEW; today stub + no UI**)
- Forgot: email → **NEW real** `POST /auth/forgot-password` (issue reset token, email link; today echoes). Always show "If that email exists, we sent a link" (no enumeration).
- Reset: new password + confirm (policy from §08 auth policy) → **NEW** `POST /auth/reset-password {token,password}`.

# D. Session lifecycle (master plan §6; fixes platform.md §0.1/§1)
- **Refresh tokens (NEW)**: `POST /auth/refresh` + rotation so the 15-min access token renews silently (today hard 401 every 15 min). Access 15m, refresh longer-lived, rev-on-logout.
- **Soft re-auth modal**: on 401/expiry, show a modal that re-authenticates **without losing form state** (§01 §7) instead of a full redirect.
- **Stale-JWT (tenantId=null)**: detect tokens missing `tenantId` → prompt re-login (the API has a `resolveTenantId` DB fallback, but the UI should re-issue a clean token; master plan §6).
- **Logout (NEW server-side)**: `POST /auth/logout` revokes refresh/blacklists (today client-only clear, no revocation, platform.md §1).
- **MFA/2FA (TOTP)** enrollment in profile (§08 auth policy; today "Enable 2FA" button is dead, platform.md §1) — market gap (blueprint §4).

# E. Tenant signup — `/signup` (public 4-step wizard)
**Title** "Create your workspace" · **Public**.
- Step 1 plan select (from `GET /saas/plans` — **fix**: today prices hardcoded client-side, ignores the endpoint, platform.md §4.6); Step 2 org + admin details; Step 3 payment; Step 4 success → `/login`.
- **Fixes (platform.md §4)**: 
  - **Grant HR_ADMIN, not SUPER_ADMIN** to the signup admin (today every signup admin is SUPER_ADMIN = owner-bypass + cross-tenant via `isOwner`, §4.3) — biggest multi-tenancy hole.
  - **Payment**: today prefilled fake card (`4111…`), client-trusted amount, no gateway → integrate a real gateway or clearly mark "trial / no charge"; don't claim a charge that didn't happen.
  - Use `GET /saas/coupons` (its stated purpose is signup, currently unused, §4.6).
  - Reconcile onboarding module keys (`directory`…) with settings `MODULES` (`employees`…) — three vocabularies (platform.md §4.3/§3 quirk 5).
- EXISTS `POST /saas/signup` (creates Company, EMP001, admin user, subscription, payment, module settings). **States**: per-step validation; success screen → "Set up your workspace" → §F.

# F. First-run Setup Wizard — `/setup`
**Title** "Set up {company}" · **Roles** `settings.configure`. Resumable; progress in rail.
Steps (writes `company` + `rules`; rbac-settings B): 1 Company & logo (branding) → 2 Locations & departments → 3 Designations & grades → 4 Work week & holidays (`attendance.workWeek` + holiday calendar) → 5 Leave types & quotas (`leave.*` + earned/sick/casual) → 6 Attendance rule basics (`attendance.*`) → 7 Payroll statutory (`payroll.*` PF/ESI/PT/TDS + default structure template) → 8 Roles & first invites → 9 Review → Launch ("Your HRMS is ready" + next-step cards). Each step skippable ("Set up later" → to-do card on HR Cockpit §09). Demo-data toggle (load/purge sample, typed-confirm purge).
- EXISTS `PATCH /settings/company`, `PATCH /settings/rules`. **Fixes**: declarations key mismatch (§08/§05); the "Roles & Permissions" matrix step is decorative (never enforced, platform.md §3 quirk 4) → wire to real roles (§08 B) or drop; reconcile with settings-console overlap (platform.md §3).

# G. Employee activation / invite (master plan §6)
- HR resend-invite (§03 §12) → employee gets a link/token; **fix**: temp password embedded plaintext in notification (core-hr §1.12) → use a set-password token flow instead.
- Activation page `/activate/[token]` (**NEW**): set password (policy §08) → first login → optional preboarding profile completion (→ §03 onboarding).
- Empty-tenant state: a fresh workspace with no data shows a "Set this up" hero linking to §F Setup Wizard (master plan §6).

---

## H. Cross-cutting (this section)
- White-label everywhere: login/signup/setup chrome from `branding.*` (§02 §7); no hardcoded "Acme Corp"/"Skylinx" (shell.md §7, core-hr §1.15).
- Public pages still token-safe: `GET /settings/public-profile` is the only pre-auth data (platform.md §3).
- A11y (§11): OTPInput keyboard/paste, focus to first field, error focus, `autocomplete` on email/password/new-password.
- Mobile: single-column login/wizard; OTP autofill from SMS where supported.
- **Backend backlog (highest security priority, platform.md §12)**: real OTP + forgot/reset; refresh-token rotation + server logout/revocation; signup grants HR_ADMIN not SUPER_ADMIN; check Company.status on login; failed-login audit + lockout/rate-limit; real payment gateway (or honest no-charge); verify JWT in TenantMiddleware + stop trusting `x-tenant-id` (§08); set-password token instead of plaintext temp password; MFA/TOTP + SSO.
