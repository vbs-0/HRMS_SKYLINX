# Competitor Parity Research — SKYLINX vs Kredily, Keka, Zoho People, greytHR, Darwinbox/BambooHR

**Date:** 2026-06-11 · Method: parallel deep-research across all 5 products' published feature sets (396 features catalogued), diffed against the SKYLINX implementation (through Wave 4).

Legend: ✅ have · 🟡 partial · ❌ missing

## 1. Where SKYLINX already matches or beats the market ✅
Core HR (database, directory, org chart, grades, employment types, onboarding/offboarding, exit, F&F with auto-suggestions), promotions/transfers history, document management with verification, **policy center with acknowledgments (Wave 4)**, announcements with read-tracking (Wave 4), custom employee fields (Wave 4), celebrations widget (Wave 4); attendance (multi-mode logs, regularization, OT, shifts/rosters/bulk assign, web geolocation capture); leave (types, policies, accrual engine, encashment, comp-off, block lists, sandwich rule, LOP→payroll); payroll (configurable structures, runs, payslips, bank export, PF/ESI/PT/TDS with admin-editable slabs + old/new regime, IT declarations & proofs, corrections/arrears, gratuity, retention bonus, salary withholding, loans with EMI auto-recovery, Form 16-style summary); expenses (grade caps, two-stage approval, advances); recruitment (requisition→offer pipeline, interview conflict detection, staffing plans, referrals); training/skills (programs, events, results, skill-gap); travel desk; insurance; performance (appraisal cycles, KRA templates with weightage validation, self/manager rating, 360° feedback); grievances; helpdesk; assets; rewards & recognition; social feed; audit logs; **multi-tenant SaaS with plans/billing/branding** (ahead of Kredily/greytHR); AES-256 field encryption; full RBAC with own-record scoping.

## 2. Missing — buildable on web stack (candidate Waves 5+)

### High value (most-cited across competitors)
| Feature | Who has it | Notes |
|---|---|---|
| Pulse surveys / eNPS / custom surveys | Keka, Zoho, Darwinbox, BambooHR, greytHR | Engagement measurement — biggest missing engagement piece |
| Salary revision / increment cycles (compensation planning) | Keka, Zoho, Darwinbox | We have promotions w/ revised CTC; no org-wide hike cycle linked to appraisal scores |
| Statutory e-filing artifacts: PF ECR file, Form 24Q (FVU), PT/LWF challans, Form 12BA | greytHR, Keka, Kredily | We compute correctly; we don't emit the government file formats |
| Team leave calendar (manager availability view) | Keka, Zoho | Small UI feature, high manager value |
| IP-based attendance restriction | Zoho, Keka | Web-enforceable today (geofencing needs mobile) |
| Custom report builder (ad-hoc queries, scheduled exports) | all five | We have fixed reports only |
| Events & reminders engine (probation confirmation due, document expiry, birthday auto-greetings) | greytHR, Zoho | We store the dates; no automated reminder engine |
| Letter e-signature (click-to-sign + audit) | Keka, Zoho, BambooHR | We generate letters; no signature capture |
| Knowledge base + HR chatbot | Zoho (Zia), greytHR (Bella), Darwinbox | SkyNexus console exists as a base |
| Disciplinary actions / PIP workflows | Keka | Adjacent to existing grievance module |
| Accounting JV export (Tally/ERP) | greytHR | Payroll → accounting handoff |
| Salary advance self-service | Kredily, greytHR | We have EmployeeAdvance (travel-linked); generalize |
| 2FA (TOTP) & SSO | Keka, Zoho, Darwinbox | Security tier for enterprise sales |
| Webhooks (event push) | Keka, Zoho | API exists; no outbound events |

### Medium / enterprise tier
Project timesheets & billable-hours tracking (Keka PSA, Zoho), OKR module distinct from KRAs, normalization/bell-curve + 9-box grid, 1:1 meeting tracker, succession planning & career paths (Darwinbox), workforce/position budgeting, benefits administration & total-rewards statement (BambooHR, US-centric), resume parsing + job-board distribution + careers page, background-verification integration, mass email/SMS campaigns, no-code workflow builder, marketplace integrations (Slack/Teams/Tally), localization/translations, sandbox environment, LMS depth (SCORM, certificates, assessments).

## 3. Mobile/hardware-dependent (correctly deferred to the Android phase)
Native apps, selfie + face-recognition punch (with liveness), geofencing enforcement, kiosk mode, biometric device sync (ZKTeco/eSSL/Matrix), auto clock-in (Klocky-style), push notifications, offline attendance. **Backend contract is already mobile-ready** (stateless JWT REST).

## 4. Recommendation
- **Wave 5 (next build):** surveys/eNPS, team leave calendar, salary revision cycles linked to appraisal scores, reminders engine, IP restriction, salary advance self-service, disciplinary/PIP, JV export, statutory file formats (ECR/24Q-shaped exports), letter click-to-sign.
- **Wave 6 (platform/enterprise):** custom report builder, webhooks, 2FA/SSO, knowledge base + chatbot upgrade, timesheets/projects.
- **Mobile phase:** everything in §3 plus push-driven approvals.
