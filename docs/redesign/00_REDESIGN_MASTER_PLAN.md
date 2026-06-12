# SKYLINX PeopleOS — Complete UI Redesign Master Plan

**Codename:** *Painted Paper · Indigo Ink*
**Date:** 2026-06-12
**Status:** Approved design baseline — implementation pending
**Scope:** Every screen, every component, every permission gate, every state — a full visual + structural redesign of `apps/web`.

---

## 1. What this is

A ground-up redesign of the SKYLINX PeopleOS interface into a calm, *paper-and-ink* design language — editorial serif headings, warm-grey paper surfaces, deep indigo-ink accent with muted gold highlights, soft shadows, subtle grain — engineered for **low eye strain over 8-hour HR workdays** while exposing the **full depth of an enterprise HRMS**: from company setup, roles & permission matrices, and approval-chain configuration down to leave accrual rules, payroll runs, PF/ESI/PT/TDS filings, and Form 16 generation & distribution.

The principle: **simple surface, deep drawers.** Every screen leads with the one thing the user came to do; everything else is one deliberate step away (tabs, drawers, command palette), never deleted, never buried more than two levels deep.

## 2. Document set (read in order)

| # | Document | Covers |
|---|---|---|
| 00 | `00_REDESIGN_MASTER_PLAN.md` | Vision, principles, current-state audit, scope matrix |
| 01 | `01_DESIGN_LANGUAGE_PAINTED_PAPER.md` | Tokens: color (light/dark), type, space, elevation, motion, texture, iconography, data-viz, accessibility, print |
| 02 | `02_APP_SHELL_AND_NAVIGATION.md` | Information architecture, full sitemap, shell anatomy, role-aware nav, command palette, search, notifications, shortcuts, responsive rules |
| 03 | `03_COMPONENT_LIBRARY.md` | Every reusable component: anatomy, variants, states, a11y contract |
| 04 | `04_BLUEPRINT_HOME_AND_SELF_SERVICE.md` | Role-aware home, Inbox (approvals), My Profile 360, documents, ID cards, announcements, surveys, social, rewards, AI assistant |
| 05 | `05_BLUEPRINT_CORE_HR_LIFECYCLE.md` | Directory, Employee 360, onboarding, probation, transfers, exits & F&F, org chart, organization masters |
| 06 | `06_BLUEPRINT_TIME_AND_ATTENDANCE.md` | Attendance, shifts, roster, regularization, OT, anomalies→LOP, leave (types/policies/balances/encashment/comp-off/blackout), holidays |
| 07 | `07_BLUEPRINT_PAYROLL_AND_COMPLIANCE.md` | Salary structures, components, payroll runs, payslips, declarations & proofs, **Form 16**, 24Q, PF/ESI/PT/LWF, bank files, loans, gratuity, F&F pay, expenses, travel money, insurance |
| 08 | `08_BLUEPRINT_TALENT.md` | Recruitment ATS, performance cycles (KRA/OKR/360/9-box), training & skills, certifications |
| 09 | `09_BLUEPRINT_OPERATIONS.md` | Helpdesk, grievance & POSH, travel desk, assets, policies, reminders, notifications center, compliance calendar |
| 10 | `10_SETTINGS_PERMISSIONS_AND_ADMIN.md` | Full Settings IA, **roles & permission matrix builder**, scopes & field-level security, workflow engine, custom fields, templates, integrations, security, audit, data admin, SaaS admin |
| 11 | `11_IMPLEMENTATION_ROADMAP.md` | Tech approach, file-by-file migration map, phases, QA gates, perf/a11y budgets, rollout flags |
| — | `assets/tokens.css` | Ready-to-ship CSS custom properties (light + dark) |
| — | `mockups/painted-paper-preview.html` | Self-contained browser mockup of the new language (shell, dashboard, leave, payslip/Form 16, permissions) |

## 3. Current-state audit (what we are replacing)

| Area | Today | Problem |
|---|---|---|
| Theme | `#f5f7fb` cool grey, default Tailwind blues (`apps/web/app/globals.css`) | Generic, high-glare white, no identity, harsh for long sessions |
| Navigation | **Flat 34-item sidebar** (`components/nav-items.tsx`) | No grouping, no role shaping, unscannable; admin and ESS see the same wall |
| Component kit | 4 components, 34 lines (`components/ui.tsx`) | Each of the ~50 console files (30,700+ LOC) hand-rolls its own tables/forms/states → inconsistent everywhere |
| Page pattern | Monolithic `*-console.tsx` client components | Tabs-inside-tabs, no shared list/detail/form patterns, no skeletons, inconsistent empty/error states |
| Dark mode | None | Requested: low eye strain |
| Density/scale | One density, mixed font sizes | No tabular numerics for money, no print discipline beyond payslip |
| Accessibility | 2 known a11y warnings, no focus/contrast system | Not WCAG-audited |
| Mobile | Desktop-only layouts | ESS actions (check-in, leave, payslip) need mobile-first paths |

**What stays:** the NestJS API surface (34 modules), Prisma schema (80+ models), RBAC `module.action` permission model, all business logic. This is a **frontend re-architecture**; API changes are limited to additive endpoints noted per blueprint.

## 4. Design principles (binding)

1. **Paper, not glass.** Warm-grey paper surfaces, ink text, deep indigo accent, gold used like leaf — sparingly. No pure white (`#FFF`) or pure black (`#000`) anywhere; no electric SaaS blue — the indigo stays ink-dark, never glowing.
2. **Calm by default, dense on demand.** Default = comfortable spacing; every table offers a `Compact` density toggle persisted per user.
3. **One primary action per view.** Exactly one indigo button per screen region; everything else is quiet (outline/ghost).
4. **Progressive depth.** Overview → list → record drawer → full record page. Drawers for triage, pages for deep work. Nothing important lives only in a modal.
5. **Role-shaped, permission-gated.** The shell renders only what the session's `module.action` permissions allow; within a screen, gated controls render disabled-with-reason only when discoverability helps (e.g., "Requires `payroll.approve`"), otherwise hidden.
6. **Every state designed.** Loading (skeleton), empty (first-run with CTA), partial, error (retry + reference ID), forbidden, offline. No raw spinners, no blank panes.
7. **Numbers are sacred.** All money/IDs/dates in tabular numerals, right-aligned amounts, explicit currency, en-dash for nil. Payroll screens show *how a number was computed* (formula trace popover).
8. **Reversibility & receipts.** Destructive actions are typed-confirmation; bulk actions preview affected rows; every mutation surfaces an audit reference.
9. **Keyboard-first parity.** Everything reachable via ⌘K and shortcuts; mouse is optional.
10. **Quietly delightful.** Texture, serif numerals, 150ms ease — never animation that costs comprehension or battery.

## 5. Scope matrix — every capability the new UI must surface

Legend: ● exists in API today (reskin + complete the UX) · ◐ partial (finish in redesign) · ○ new in redesign (additive build)

### Foundation & administration
| Capability | Status | Blueprint |
|---|---|---|
| Tenant signup, setup wizard, branding | ● | 10 |
| Company profile, legal entities, locations, departments, designations, grades, cost centers | ● | 05/10 |
| Fiscal year, currency, numbering series, working-week config | ◐ | 10 |
| Custom fields engine (all modules) | ● | 10 |
| Roles & permission matrix (module × action), permission scopes (self/team/dept/location/company) | ●/◐ | 10 |
| Field-level security & PII masking (PAN, Aadhaar, bank, salary) | ○ | 10 |
| Approval workflow builder (multi-step chains per module/amount/grade) | ◐ | 10 |
| Email/letter template studio, document numbering | ◐ | 10 |
| Audit log explorer, error/system logs | ● | 10 |
| Data import/export center, backups | ◐ | 10 |
| Integrations: biometric devices, SSO, calendar, accounting export, webhooks, API keys | ○ | 10 |
| SaaS: plans, subscription, payments, module toggles, tenant admin | ● | 10 |
| Notification templates & user notification preferences | ◐ | 09/10 |

### People & lifecycle
| Capability | Status | Blueprint |
|---|---|---|
| Directory (search/filter/segment/bulk), profile completeness | ● | 05 |
| Employee 360: personal, job, comp history, statutory IDs (PAN/Aadhaar/UAN/ESIC/PRAN), bank, family, nominees, education, experience, skills, docs, assets, timeline | ● | 05 |
| Onboarding: preboarding portal, checklist templates, doc collection, e-sign-ready letters, buddy | ◐ | 05 |
| Probation & confirmation flow | ◐ | 05 |
| Transfers, promotions, increments, role changes (effective-dated) | ◐ | 05 |
| Exit: resignation, notice, clearance matrix (IT/Finance/Admin/Manager), exit interview, relieving & experience letters | ● | 05 |
| Full & Final: leave encashment, gratuity, recoveries, settlement statement | ● | 05/07 |
| Org chart (interactive), reporting lines, dotted lines | ◐ | 05 |
| ID & visiting card generator | ● | 04 |

### Time & leave
| Capability | Status | Blueprint |
|---|---|---|
| Web check-in/out with geo + selfie option, kiosk mode, biometric feed | ◐ | 06 |
| Attendance rules (grace, half-day, min hours), cycles | ● | 06 |
| Shifts, rotations, roster planner, shift change requests | ● | 06 |
| Regularization & OT requests with approval | ● | 06 |
| Anomaly engine (late/missing/short) → penalty/LOP lifecycle | ● | 06 |
| Holiday calendars (multi-location, optional/restricted holidays) | ● | 06 |
| Leave types (CL/SL/EL, maternity/paternity, comp-off, LWP, custom), unit (day/half/hour) | ● | 06 |
| Accrual policies, proration, carry-forward, lapse, encashment, sandwich, blackout, holiday-adjacent rules | ● | 06 |
| Balances + ledger (every credit/debit explained) | ● | 06 |
| Team leave calendar & coverage conflicts | ◐ | 06 |
| Year-end leave processing | ◐ | 06 |

### Pay & compliance (India-first)
| Capability | Status | Blueprint |
|---|---|---|
| Salary components (earning/deduction/employer cost, formula, taxability) + config metadata | ● | 07 |
| Salary structures & templates, assignment, CTC calculator, revision & arrears | ● | 07 |
| Payroll runs: gates checklist → preview → validate → lock → publish; off-cycle runs | ● | 07 |
| Payslips (web + PDF, password option), bulk publish, employee view | ● | 07 |
| Bank disbursement/advice file export | ● | 07 |
| Loans & salary advances with EMI schedule | ◐ | 07 |
| Bonuses, retention bonus, salary withholding/release | ● | 07 |
| Tax regimes (old/new), investment declarations windows, proof submission & verification, Form 12BB | ● | 07 |
| **Form 16 center: Part A import/merge, Part B generation, digital sign, bulk publish, employee download** | ◐ | 07 |
| TDS computation & monthly challan tracker, 24Q quarterly pack | ◐ | 07 |
| PF (ECR file), ESI, PT (state slabs), LWF | ●/◐ | 07 |
| Gratuity calculation, F&F integration | ● | 07 |
| Payroll registers, variance vs last month, GL/journal export, cost-center reporting | ◐ | 07 |
| Expense claims: categories, grade caps, mileage, multi-line, receipts, approval → payout (payroll or direct) | ● | 07 |
| Employee advances (travel) & settlement | ● | 07 |
| Insurance: policies, dependents, enrollments, claims, benefit items | ● | 07 |
| Compliance calendar & filing tracker (PF/ESI/PT/TDS due dates), audit packs | ● | 09 |

### Talent
| Capability | Status | Blueprint |
|---|---|---|
| Requisitions & approvals, job postings, careers intake | ● | 08 |
| Candidate pipeline kanban, stages, resume, referrals | ● | 08 |
| Interview rounds, panels, scorecards/feedback | ● | 08 |
| Offers: terms, approvals, letters, acceptance → onboarding handoff | ● | 08 |
| Performance: cycles, KRA/KPI/OKR goals, self + manager review, 360, calibration/9-box, outcomes → increment letters | ● | 08 |
| PIP and continuous feedback/praise | ○ | 08 |
| Training: programs, sessions, nominations, attendance, feedback, results, certifications & expiry | ● | 08 |
| Skill matrix & designation skill maps | ● | 08 |

### Workplace & engagement
| Capability | Status | Blueprint |
|---|---|---|
| Helpdesk: categories, SLA, assignment, comments, CSAT | ● | 09 |
| Grievance & POSH: confidential intake, committee, case timeline | ● | 09 |
| Travel desk: requests, itineraries, advances | ● | 09 |
| Assets: catalog, assign/return, condition, exit clearance hook | ● | 09 |
| Policies: versioning, publish, acknowledgment tracking | ● | 09 |
| Announcements & reminders | ● | 04/09 |
| Surveys & eNPS | ● | 04 |
| Social feed (SkyNexus), recognition & rewards ledger, celebrations | ● | 04 |
| AI assistant (SkyNexus AI): ask-HR, policy Q&A, deep links | ● | 04 |

### Insight
| Capability | Status | Blueprint |
|---|---|---|
| Role dashboards (ESS / Manager / HR / Owner) | ● | 04 |
| Analytics: headcount, attrition, attendance, leave, payroll cost, recruitment funnel, performance distribution | ● | 04/09 |
| Report center: catalog, filters, schedules, exports (CSV/XLSX/PDF) | ◐ | 09 |

## 6. Personas → experience shaping

| Persona | Landing | Nav groups shown | Signature surfaces |
|---|---|---|---|
| **Employee (ESS)** | *My Desk* | Home, My Work, Time, Pay, Workplace, Growth | Check-in hero, leave apply, payslip & tax center, helpdesk |
| **Manager** | *Team Desk* | + Team | Inbox (approvals), team roster/leave calendar, regularization queue, reviews |
| **HR Admin** | *HR Cockpit* | + People, Pay Ops, Talent, Insight | Payroll run room, lifecycle boards, compliance calendar, report center |
| **Owner / Super Admin** | *HR Cockpit* | + Admin (Settings, Security, SaaS) | Permission matrix, workflow builder, audit explorer, billing |

## 7. Phasing (detail in doc 11)

- **P0 — Foundation (week 1-2):** tokens.css + Tailwind preset, fonts, dark mode, new `ui/` component kit, new shell + grouped nav behind `NEXT_PUBLIC_UI_V2` flag.
- **P1 — Daily life (week 3-5):** Home/My Desk, Inbox, Attendance, Leave, Profile 360, Directory.
- **P2 — Money (week 6-9):** Payroll suite, declarations & Form 16 center, expenses, compliance.
- **P3 — Talent & ops (week 10-12):** Recruitment, performance, training, helpdesk, assets, travel, policies, social.
- **P4 — Admin depth (week 13-15):** Settings, permission matrix builder, workflow engine, audit, SaaS, report center.
- **P5 — Polish (week 16):** a11y audit pass, perf budget enforcement, print suite, kill legacy flag.

Each phase ships behind the flag with Playwright coverage per `apps/web/e2e/` conventions before flip.
