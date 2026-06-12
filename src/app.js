const STORAGE_KEY = "skylinx-peopleos-state-v2";

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/></svg>',
  employees: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  leave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="m9 16 2 2 4-5"/></svg>',
  payroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h.01M11 15h2"/></svg>',
  hiring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 6h4M10 10h4M8 14h8"/><rect x="5" y="2" width="14" height="20" rx="2"/></svg>',
  onboarding: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  documents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15v3M12 9v9M17 5v13"/></svg>',
  modules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  panels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16M4 12h16M4 19h16"/><path d="M8 3v4M16 10v4M12 17v4"/></svg>',
  security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M16 8h5V3"/></svg>',
};

const views = [
  ["dashboard", "Dashboard", icons.dashboard],
  ["panels", "User Panels", icons.panels],
  ["modules", "Modules", icons.modules],
  ["employees", "Employees", icons.employees],
  ["attendance", "Attendance", icons.attendance],
  ["leave", "Leave", icons.leave],
  ["payroll", "Payroll", icons.payroll],
  ["hiring", "Hiring", icons.hiring],
  ["onboarding", "Onboarding", icons.onboarding],
  ["documents", "Documents", icons.documents],
  ["reports", "Reports", icons.reports],
  ["security", "Security", icons.security],
  ["settings", "Settings", icons.settings],
];

let state = loadState();
let activeView = "dashboard";
let query = "";
let modal = null;

function loadState() {
  const seed = structuredClone(window.HRMS_SEED);
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seed;
  try {
    const parsed = JSON.parse(saved);
    return {
      ...seed,
      ...parsed,
      company: { ...seed.company, ...(parsed.company || {}) },
    };
  } catch {
    return seed;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function employee(id) {
  return state.employees.find((item) => item.id === id);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function render() {
  document.getElementById("app").innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-logo" src="assets/skylinx-logo-display.png" alt="Acme Corp" />
          <div class="brand-text">
            <strong>${state.company?.name || "SKYLINX HR"}</strong>
            <span>HRMS & Payroll</span>
          </div>
        </div>
        <nav class="nav">
          ${views
            .map(
              ([id, label, icon]) => `
                <button class="${activeView === id ? "active" : ""}" data-view="${id}" title="${label}">
                  ${icon}<span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
        <div class="sidebar-foot">
          Company workspace · ${state.company?.workWeek || "Monday to Saturday"} · ${state.company?.payrollMonth || "May 2026"}
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <h1>${views.find(([id]) => id === activeView)[1]}</h1>
          <div class="search">
            ${icons.search}
            <input id="globalSearch" placeholder="Search employees, departments, status" value="${escapeHtml(query)}" />
          </div>
        </header>
        <section class="content">${renderView()}</section>
      </main>
    </div>
    ${modal ? renderModal() : ""}
  `;
  bindEvents();
}

function renderView() {
  if (activeView === "dashboard") return dashboardView();
  if (activeView === "panels") return panelsView();
  if (activeView === "modules") return modulesView();
  if (activeView === "employees") return employeesView();
  if (activeView === "attendance") return attendanceView();
  if (activeView === "leave") return leaveView();
  if (activeView === "payroll") return payrollView();
  if (activeView === "hiring") return hiringView();
  if (activeView === "onboarding") return onboardingView();
  if (activeView === "documents") return documentsView();
  if (activeView === "reports") return reportsView();
  if (activeView === "security") return securityView();
  return settingsView();
}

function dashboardView() {
  const activeEmployees = state.employees.filter((item) => item.status === "active").length;
  const present = state.attendance.filter((item) => item.status === "present").length;
  const pendingLeave = state.leaveRequests.filter((item) => item.status === "pending").length;
  const payrollTotal = state.payroll.reduce((sum, item) => sum + item.net, 0);
  const pendingCompliance = state.compliance.filter((item) => item.status === "pending").length;
  return `
    <div class="grid kpis">
      ${metric("Active Employees", activeEmployees, "+3 this quarter")}
      ${metric("Present Today", present, "Live attendance")}
      ${metric("Leave Pending", pendingLeave, "Needs approval")}
      ${metric("Payroll Net", money(payrollTotal), "May 2026")}
      ${metric("Modules", state.modules.length, "MVP, V2 and V3 roadmap")}
      ${metric("Security Items", state.security.length, "Controls to implement")}
    </div>
    <div class="grid split" style="margin-top: 16px">
      <div class="card section">
        <h2>People Directory</h2>
        ${employeeTable(filterEmployees().slice(0, 5))}
      </div>
      <div class="card section">
        <h2>HR Action Center</h2>
        <div class="list">
          <div class="list-item">
            <div class="list-row"><strong>Compliance filings</strong><span class="pill pending">${pendingCompliance} pending</span></div>
            <span class="muted">PF, ESI, PT and TDS reminders for ${state.company.payrollMonth}</span>
          </div>
          ${state.leaveRequests
            .map((request) => {
              const person = employee(request.employeeId);
              return `<div class="list-item">
                <div class="list-row"><strong>${person?.name || "Unknown"}</strong><span class="pill ${request.status}">${request.status}</span></div>
                <span class="muted">${request.type}: ${request.from} to ${request.to}</span>
              </div>`;
            })
            .join("")}
        </div>
      </div>
    </div>
    <div class="grid split" style="margin-top: 16px">
      <div class="card section">
        <h2>Company Announcements</h2>
        <div class="list">
          ${state.announcements
            .map((item) => `<div class="list-item"><div class="list-row"><strong>${item.title}</strong><span class="muted">${item.date}</span></div><span class="muted">${item.audience}</span></div>`)
            .join("")}
        </div>
      </div>
      <div class="card section">
        <h2>Quick HRMS Coverage</h2>
        <div class="list">
          <div class="list-item"><strong>Employee self-service</strong><span class="muted">Leave, attendance, payslip, profile and documents.</span></div>
          <div class="list-item"><strong>India payroll readiness</strong><span class="muted">Gross, deductions, net pay, PF, ESI, PT and TDS tracking.</span></div>
        </div>
      </div>
    </div>
    <div class="toolbar" style="margin-top: 16px">
      <button class="button warn" id="resetDemo">${icons.refresh}Reset demo data</button>
    </div>
  `;
}

function metric(label, value, note) {
  return `<div class="card metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function panelsView() {
  return `
    <div class="toolbar">
      <div><strong>${state.panels.length}</strong> role-based user panels</div>
    </div>
    <div class="grid kpis">
      ${state.panels
        .map(
          (panel) => `
          <div class="card metric">
            <span>${panel.status}</span>
            <strong style="font-size: 20px">${panel.name}</strong>
            <small>${panel.users} users - ${panel.focus}</small>
          </div>
        `,
        )
        .join("")}
    </div>
  `;
}

function modulesView() {
  const phases = ["MVP", "V2", "V3"];
  return `
    <div class="toolbar">
      <div><strong>${state.modules.length}</strong> SKYLINX PeopleOS modules</div>
    </div>
    <div class="grid">
      ${phases
        .map((phase) => {
          const modules = state.modules.filter((module) => module.phase === phase);
          return `<div class="card section">
            <h2>${phase} Modules</h2>
            <div class="module-grid">
              ${modules
                .map(
                  (module) => `
                    <div class="module-card">
                      <div class="list-row"><strong>${module.name}</strong><span class="pill ${module.status}">${module.status}</span></div>
                      <span class="muted">${module.owner}</span>
                      <div class="chips">${module.items.map((item) => `<span>${item}</span>`).join("")}</div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>`;
        })
        .join("")}
    </div>
  `;
}

function employeesView() {
  return `
    <div class="toolbar">
      <div><strong>${filterEmployees().length}</strong> employee records</div>
      <div class="toolbar-actions">
        <button class="button primary" data-open-modal="employee">${icons.plus}Add employee</button>
      </div>
    </div>
    <div class="card section">${employeeTable(filterEmployees())}</div>
  `;
}

function employeeTable(items) {
  if (!items.length) return `<div class="empty">No employees found.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Location</th><th>Joining</th><th>Status</th></tr></thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td><div class="person"><span class="avatar">${initials(item.name)}</span><div><strong>${item.name}</strong><br><span class="muted">${item.email}</span></div></div></td>
                  <td>${item.role}</td>
                  <td>${item.department}</td>
                  <td>${item.location}</td>
                  <td>${item.joiningDate}</td>
                  <td><span class="pill ${item.status}">${item.status}</span></td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function attendanceView() {
  return `
    <div class="toolbar">
      <div><strong>${state.attendance.length}</strong> attendance entries</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="attendance">${icons.plus}Mark attendance</button></div>
    </div>
    <div class="card section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead>
          <tbody>${state.attendance
            .map((item) => {
              const person = employee(item.employeeId);
              return `<tr><td>${person?.name || item.employeeId}</td><td>${item.date}</td><td>${item.checkIn || "-"}</td><td>${item.checkOut || "-"}</td><td><span class="pill ${item.status}">${item.status}</span></td></tr>`;
            })
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function leaveView() {
  return `
    <div class="toolbar">
      <div><strong>${state.leaveRequests.length}</strong> leave requests</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="leave">${icons.plus}Request leave</button></div>
    </div>
    <div class="card section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${state.leaveRequests
            .map((item) => {
              const person = employee(item.employeeId);
              return `<tr>
                <td>${person?.name || item.employeeId}</td><td>${item.type}</td><td>${item.from} to ${item.to}</td><td>${item.days}</td><td>${item.reason}</td>
                <td><span class="pill ${item.status}">${item.status}</span></td>
                <td>${item.status === "pending" ? `<button class="button" data-approve-leave="${item.id}">${icons.check}Approve</button>` : "-"}</td>
              </tr>`;
            })
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function payrollView() {
  return `
    <div class="toolbar">
      <div><strong>${state.payroll.length}</strong> payroll slips</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="payroll">${icons.plus}Add payroll</button></div>
    </div>
    <div class="card section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Month</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
          <tbody>${state.payroll
            .map((item) => {
              const person = employee(item.employeeId);
              return `<tr><td>${person?.name || item.employeeId}</td><td>${item.month}</td><td>${money(item.gross)}</td><td>${money(item.deductions)}</td><td><strong>${money(item.net)}</strong></td><td><span class="pill ${item.status}">${item.status}</span></td></tr>`;
            })
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function hiringView() {
  return `
    <div class="toolbar">
      <div><strong>${state.jobs.length}</strong> open jobs</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="job">${icons.plus}Add job</button></div>
    </div>
    <div class="grid kpis">
      ${state.jobs
        .map(
          (job) => `
          <div class="card metric">
            <span>${job.department}</span>
            <strong style="font-size: 20px">${job.title}</strong>
            <small>${job.candidates} candidates · ${job.stage}</small>
          </div>
        `,
        )
        .join("")}
    </div>
  `;
}

function onboardingView() {
  return `
    <div class="toolbar">
      <div><strong>${state.onboarding.length}</strong> onboarding workflows</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="onboarding">${icons.plus}Add onboarding</button></div>
    </div>
    <div class="grid split">
      <div class="card section">
        <h2>Joining Pipeline</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Stage</th><th>Owner</th><th>Due</th><th>Progress</th></tr></thead>
            <tbody>${state.onboarding
              .map((item) => {
                const person = employee(item.employeeId);
                return `<tr><td>${person?.name || item.employeeId}</td><td>${item.stage}</td><td>${item.owner}</td><td>${item.due}</td><td><strong>${item.progress}%</strong></td></tr>`;
              })
              .join("")}</tbody>
          </table>
        </div>
      </div>
      <div class="card section">
        <h2>Checklist</h2>
        <div class="list">
          <div class="list-item"><strong>Collect KYC</strong><span class="muted">Aadhaar, PAN, bank proof, address proof.</span></div>
          <div class="list-item"><strong>Assign policies</strong><span class="muted">Leave policy, holiday calendar, shift, reporting manager.</span></div>
          <div class="list-item"><strong>Payroll setup</strong><span class="muted">Salary structure, statutory IDs, payout bank account.</span></div>
        </div>
      </div>
    </div>
  `;
}

function documentsView() {
  return `
    <div class="toolbar">
      <div><strong>${state.documents.length}</strong> employee documents</div>
      <div class="toolbar-actions"><button class="button primary" data-open-modal="document">${icons.plus}Add document</button></div>
    </div>
    <div class="card section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Document</th><th>Employee</th><th>Status</th><th>Expiry</th></tr></thead>
          <tbody>${state.documents
            .map((item) => {
              const person = employee(item.employeeId);
              return `<tr><td>${item.name}</td><td>${person?.name || item.employeeId}</td><td><span class="pill ${item.status}">${item.status}</span></td><td>${item.expires || "-"}</td></tr>`;
            })
            .join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function reportsView() {
  const byDepartment = state.employees.reduce((acc, item) => {
    acc[item.department] = (acc[item.department] || 0) + 1;
    return acc;
  }, {});
  return `
    <div class="toolbar">
      <div><strong>Reports</strong> for ${state.company.legalName}</div>
      <div class="toolbar-actions"><button class="button" id="downloadReport">${icons.documents}Download summary</button></div>
    </div>
    <div class="grid split">
      <div class="card section">
        <h2>Department Headcount</h2>
        <div class="list">${Object.entries(byDepartment)
          .map(([name, count]) => `<div class="list-item"><div class="list-row"><strong>${name}</strong><span>${count}</span></div></div>`)
          .join("")}</div>
      </div>
      <div class="card section">
        <h2>Compliance Calendar</h2>
        <div class="list">${state.compliance
          .map((item) => `<div class="list-item"><div class="list-row"><strong>${item.name}</strong><span class="pill ${item.status}">${item.status}</span></div><span class="muted">${item.period} · due ${item.due}</span></div>`)
          .join("")}</div>
      </div>
    </div>
  `;
}

function securityView() {
  return `
    <div class="toolbar">
      <div><strong>Security, notifications and backup</strong> controls</div>
    </div>
    <div class="grid split">
      <div class="card section">
        <h2>Security</h2>
        <div class="list">${state.security
          .map((item) => `<div class="list-item"><div class="list-row"><strong>${item.name}</strong><span class="pill ${item.status}">${item.status}</span></div><span class="muted">Priority: ${item.priority}</span></div>`)
          .join("")}</div>
      </div>
      <div class="card section">
        <h2>Notifications</h2>
        <div class="list">${state.notifications
          .map((item) => `<div class="list-item"><div class="list-row"><strong>${item.name}</strong><span class="pill ${item.status}">${item.status}</span></div><span class="muted">${item.channel}</span></div>`)
          .join("")}</div>
      </div>
    </div>
    <div class="card section" style="margin-top: 16px">
      <h2>Backup & Recovery</h2>
      <div class="module-grid">${state.backups
        .map((item) => `<div class="module-card"><div class="list-row"><strong>${item.name}</strong><span class="pill ${item.status}">${item.status}</span></div><span class="muted">${item.frequency}</span></div>`)
        .join("")}</div>
    </div>
  `;
}

function settingsView() {
  return `
    <div class="toolbar">
      <div><strong>${state.company.legalName}</strong> admin controls</div>
    </div>
    <div class="grid split">
      <div class="card section">
        <h2>Company Profile</h2>
        <div class="list">
          <div class="list-item"><div class="list-row"><strong>Brand</strong><span>${state.company.name}</span></div></div>
          <div class="list-item"><div class="list-row"><strong>Work week</strong><span>${state.company.workWeek}</span></div></div>
          <div class="list-item"><div class="list-row"><strong>Locations</strong><span>${state.company.locations.length}</span></div><span class="muted">${state.company.locations.join(", ")}</span></div>
        </div>
      </div>
      <div class="card section">
        <h2>Admin Controls</h2>
        <div class="list">${state.settingsCatalog
          .map((item) => `<div class="list-item"><div class="list-row"><strong>${item.name}</strong><span class="pill ${item.status}">${item.status}</span></div></div>`)
          .join("")}</div>
      </div>
    </div>
  `;
}

function renderModal() {
  const forms = {
    employee: employeeForm,
    attendance: attendanceForm,
    leave: leaveForm,
    payroll: payrollForm,
    job: jobForm,
    onboarding: onboardingForm,
    document: documentForm,
  };
  const titles = {
    employee: "Add Employee",
    attendance: "Mark Attendance",
    leave: "Request Leave",
    payroll: "Add Payroll",
    job: "Add Job",
    onboarding: "Add Onboarding",
    document: "Add Document",
  };
  return `
    <div class="modal-backdrop">
      <form class="modal" id="modalForm" data-form="${modal}">
        <div class="modal-head">
          <h2>${titles[modal]}</h2>
          <button class="button" type="button" data-close-modal title="Close">${icons.close}</button>
        </div>
        <div class="modal-body">${forms[modal]()}</div>
        <div class="modal-foot">
          <button class="button" type="button" data-close-modal>Cancel</button>
          <button class="button primary" type="submit">${icons.check}Save</button>
        </div>
      </form>
    </div>
  `;
}

function employeeOptions() {
  return state.employees.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
}

function employeeForm() {
  return `<div class="form">
    ${field("name", "Full name")}
    ${field("role", "Role")}
    ${field("department", "Department")}
    ${field("location", "Location")}
    ${field("email", "Email", "email")}
    ${field("phone", "Phone")}
    ${field("joiningDate", "Joining date", "date")}
    ${field("salary", "Annual salary", "number")}
  </div>`;
}

function attendanceForm() {
  return `<div class="form">
    <label>Employee<select name="employeeId">${employeeOptions()}</select></label>
    ${field("date", "Date", "date", "2026-05-25")}
    ${field("checkIn", "Check in", "time")}
    ${field("checkOut", "Check out", "time")}
    <label>Status<select name="status"><option>present</option><option>late</option><option>absent</option></select></label>
  </div>`;
}

function leaveForm() {
  return `<div class="form">
    <label>Employee<select name="employeeId">${employeeOptions()}</select></label>
    <label>Type<select name="type"><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Unpaid Leave</option></select></label>
    ${field("from", "From", "date")}
    ${field("to", "To", "date")}
    ${field("days", "Days", "number")}
    <label>Status<select name="status"><option>pending</option><option>approved</option><option>rejected</option></select></label>
    <label class="full">Reason<textarea name="reason"></textarea></label>
  </div>`;
}

function payrollForm() {
  return `<div class="form">
    <label>Employee<select name="employeeId">${employeeOptions()}</select></label>
    ${field("month", "Month", "text", "June 2026")}
    ${field("gross", "Gross pay", "number")}
    ${field("deductions", "Deductions", "number")}
    ${field("net", "Net pay", "number")}
    <label>Status<select name="status"><option>draft</option><option>paid</option><option>hold</option></select></label>
  </div>`;
}

function jobForm() {
  return `<div class="form">
    ${field("title", "Job title")}
    ${field("department", "Department")}
    ${field("stage", "Stage", "text", "Screening")}
    ${field("candidates", "Candidates", "number", "0")}
  </div>`;
}

function onboardingForm() {
  return `<div class="form">
    <label>Employee<select name="employeeId">${employeeOptions()}</select></label>
    ${field("stage", "Stage", "text", "Document Collection")}
    ${field("owner", "Owner", "text", "Aarav Mehta")}
    ${field("due", "Due date", "date")}
    ${field("progress", "Progress", "number", "0")}
  </div>`;
}

function documentForm() {
  return `<div class="form">
    <label>Employee<select name="employeeId">${employeeOptions()}</select></label>
    ${field("name", "Document name")}
    <label>Status<select name="status"><option>pending</option><option>verified</option><option>rejected</option></select></label>
    ${field("expires", "Expiry date", "date")}
  </div>`;
}

function field(name, label, type = "text", value = "") {
  return `<label>${label}<input name="${name}" type="${type}" value="${value}" required /></label>`;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      render();
    });
  });
  document.getElementById("globalSearch")?.addEventListener("input", (event) => {
    query = event.target.value;
    render();
  });
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      modal = button.dataset.openModal;
      render();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      modal = null;
      render();
    });
  });
  document.querySelectorAll("[data-approve-leave]").forEach((button) => {
    button.addEventListener("click", () => {
      const request = state.leaveRequests.find((item) => item.id === button.dataset.approveLeave);
      request.status = "approved";
      saveState();
      render();
    });
  });
  document.getElementById("resetDemo")?.addEventListener("click", () => {
    state = structuredClone(window.HRMS_SEED);
    saveState();
    render();
  });
  document.getElementById("downloadReport")?.addEventListener("click", () => {
    const report = [
      `${state.company.legalName} HRMS Summary`,
      `Employees: ${state.employees.length}`,
      `Attendance entries: ${state.attendance.length}`,
      `Leave requests: ${state.leaveRequests.length}`,
      `Payroll slips: ${state.payroll.length}`,
      `Compliance items: ${state.compliance.length}`,
    ].join("\\n");
    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "skylinx-hrms-summary.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.getElementById("modalForm")?.addEventListener("submit", saveForm);
}

function saveForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.form === "employee") {
    values.id = `EMP-${1001 + state.employees.length}`;
    values.salary = Number(values.salary);
    values.status = "active";
    state.employees.push(values);
    activeView = "employees";
  }
  if (form.dataset.form === "attendance") {
    state.attendance.unshift({ ...values, id: `ATT-${Date.now()}` });
    activeView = "attendance";
  }
  if (form.dataset.form === "leave") {
    state.leaveRequests.unshift({ ...values, id: `LEA-${Date.now()}`, days: Number(values.days) });
    activeView = "leave";
  }
  if (form.dataset.form === "payroll") {
    state.payroll.unshift({
      ...values,
      id: `PAY-${Date.now()}`,
      gross: Number(values.gross),
      deductions: Number(values.deductions),
      net: Number(values.net),
    });
    activeView = "payroll";
  }
  if (form.dataset.form === "job") {
    state.jobs.unshift({ ...values, id: `JOB-${Date.now()}`, candidates: Number(values.candidates) });
    activeView = "hiring";
  }
  if (form.dataset.form === "onboarding") {
    state.onboarding.unshift({ ...values, id: `ONB-${Date.now()}`, progress: Number(values.progress) });
    activeView = "onboarding";
  }
  if (form.dataset.form === "document") {
    state.documents.unshift({ ...values, id: `DOC-${Date.now()}` });
    activeView = "documents";
  }
  modal = null;
  saveState();
  render();
}

function filterEmployees() {
  const term = query.trim().toLowerCase();
  if (!term) return state.employees;
  return state.employees.filter((item) =>
    [item.name, item.role, item.department, item.location, item.email, item.status]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

render();
