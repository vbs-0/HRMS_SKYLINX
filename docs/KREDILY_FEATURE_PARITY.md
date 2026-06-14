# Kredily → PeopleOS Feature Parity & Gap Map

> Built from Kredily's **public** feature pages (kredily.com) — competitive feature
> benchmarking, not UI cloning. Status vs. PeopleOS as of 2026-06-13.
> Legend: ✅ Have · 🟡 Partial · ❌ Missing · ⭐ PeopleOS ahead

---

## 1. Payroll
| Kredily feature | PeopleOS |
|---|---|
| Salary structure config (custom components/allowances) | ✅ templates + components |
| Payslip generation | ✅ |
| Bulk payslip download | 🟡 per-employee yes; bulk download to confirm |
| Salary disbursement (bank transfer) | 🟡 NEFT advice **file** exported — no live bank-API payout |
| **1-click salary payout (live bank integration)** | ❌ big gap — we export a file, don't push to bank |
| Income tax / TDS computation | ✅ slabs admin-editable |
| PF / ESI / PT / LOP | ✅ statutory, admin-configurable |
| Form 16 | ✅ |
| Form 12BB (investment declarations) | ✅ tax declarations |
| Reimbursements | ✅ expenses module |
| Bonus / incentives / commissions | 🟡 referral bonus only; no general bonus run |
| Mid-month / variable payouts | ❌ |
| Full & Final (FnF) | ✅ exit module |
| Overtime calculation | ✅ |
| **Multi-company payroll (many cos under one login)** | 🟡 we're multi-**tenant**; multi-co under one tenant not built |

## 2. Attendance & Time
| Kredily feature | PeopleOS |
|---|---|
| Real-time attendance tracking | ✅ |
| Geofencing (location check-in) | ✅ admin radius |
| **Face recognition / liveliness ("KredEYE")** | ❌ no face/selfie auth |
| GPS + selfie check-in | 🟡 geofence yes, selfie/face no |
| **Auto clock in/out ("Klocky")** | ❌ |
| Timesheets | 🟡 |
| Regularization | ✅ (incl. approve/reject — fixed this session) |
| Multiple shifts / roster | ✅ shift mgmt |
| Overtime | ✅ |
| **Mobile-app attendance** | ❌ — see Mobile gap |

## 3. Leave
| Kredily feature | PeopleOS |
|---|---|
| Custom leave types (CL/SL/EL…) | ✅ |
| Carry-forward / accrual rules | ✅ |
| Leave request + approval | ✅ manager→HR |
| Comp-off | ✅ |
| Holiday calendar | ✅ |
| Per-branch / per-dept leave policies | 🟡 policy config exists; per-branch differentiation shallow |

## 4. Core HR
| Kredily feature | PeopleOS |
|---|---|
| Employee records / data mgmt | ✅ |
| Onboarding | ✅ templates |
| Employee **self**-onboarding (digital join/update) | 🟡 profile edit yes; guided self-onboard flow thin |
| Offboarding / Exit | ✅ |
| Documents | ✅ with verification workflow |
| Asset management | ✅ |
| Roster management | 🟡 via shifts |
| Org structure (dept/desig/location/grade) | ✅ |
| Org chart | ✅ |
| Promotions / transfers | ✅ (timeline names fixed this session) |
| Probation | ✅ (flow fixed this session) |
| Custom fields | ✅ |
| Bulk upload | ✅ (file input fixed this session) |
| **AI bulk-upload error-correction ("Magic Upload")** | ❌ plain upload, no AI correction |
| Multi-branch / location | ✅ locations |

## 5. Performance
| Kredily feature | PeopleOS |
|---|---|
| Appraisals / reviews | ✅ |
| Goals / KRA | ✅ |
| Calibration / ratings | ✅ |
| Continuous feedback | 🟡 |

## 6. Employee Self-Service (ESS)
| Kredily feature | PeopleOS |
|---|---|
| Apply leave / view balance | ✅ |
| Download payslip / Form 16 | ✅ |
| Update own profile | ✅ (save-fields bug fixed this session) |
| Mark attendance from phone | ❌ (no mobile app) |

## 7. Compliance & Reporting
| Kredily feature | PeopleOS |
|---|---|
| Statutory compliance (PF/ESI/PT/TDS) | ✅ |
| Compliance dashboard | ✅ |
| Government-ready statutory reports | 🟡 export exists; format-exact returns to verify |
| Payroll registers | 🟡 |
| **AI payroll anomaly dashboards** | ❌ |

## 8. Engagement / Other
| Kredily feature | PeopleOS |
|---|---|
| Employee social network | ✅ social feed + announcements ⭐ |
| Expense management | ✅ |
| Benefits / insurance | ✅ insurance module |
| Mobile apps (Android + iOS) | ❌ **web only** — biggest platform gap |
| AI-powered (general) | ❌ no AI features yet |

---

## Where PeopleOS is AHEAD of (public) Kredily ⭐
These are built in PeopleOS and **not** emphasized on Kredily's public pages — a differentiation story:
- **Full Recruitment/ATS** (requisitions, candidates, interviews, offers, referrals, staffing plans)
- **Travel** and **Training** modules
- **Helpdesk / Tickets** with queues
- **Grievance** (including anonymous, identity-protected)
- **Surveys**
- **Granular RBAC** + the per-feature permission matrix
- **True white-label multi-tenant SaaS** architecture (Kredily is a single hosted product)

---

## The real gaps to close (priority order)

**Tier 1 — platform/credibility blockers (Kredily clearly ahead):**
1. **Native mobile apps (Android/iOS)** — their headline ESS channel. We're web-only. Biggest gap; biggest effort.
2. **Live salary disbursement** (bank-API "1-click payout") — we stop at the NEFT advice file.
3. **Email/SMTP live** + S3 storage — our own production blockers (independent of Kredily).

**Tier 2 — competitive AI features (their differentiators):**
4. Face-recognition / selfie attendance ("KredEYE" equivalent).
5. AI bulk-upload error correction ("Magic Upload" equivalent).
6. AI payroll anomaly detection on dashboards.

**Tier 3 — depth parity (smaller):**
7. General bonus/incentive payroll run (beyond referral bonus).
8. Per-branch policy differentiation depth.
9. Multi-company-under-one-account payroll.
10. Auto clock in/out; richer timesheets.
11. Polished guided self-onboarding.

---

## Recommended sequencing
1. **Close our own production blockers** (email, storage, 2nd-tenant test) — needed regardless of Kredily.
2. **Mobile** is the single biggest parity gap but also the biggest build — decide early: responsive PWA (cheap, ~80% of value) vs. native apps (expensive). **PWA first** is the pragmatic call.
3. **AI features** are strong marketing differentiators and, with modern models, cheaper to add than they look (face-match, anomaly flags, smart import). Good Tier-2 bets.
4. Tier 3 depth items as customers ask.

> Note on method: this is a feature/idea benchmark from public marketing pages. We are
> **not** copying Kredily's UI — PeopleOS keeps its own visual identity (see redesign docs).
