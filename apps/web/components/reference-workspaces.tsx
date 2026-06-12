import { BadgeIndianRupee, BellRing, Building2, CalendarCheck, CheckCircle2, Download, FileCheck2, FileSpreadsheet, Fingerprint, Gift, GitFork, HeartPulse, KeyRound, LockKeyhole, MapPin, Megaphone, PlugZap, ReceiptText, ShieldCheck, Target, Trophy, UserRound, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function MiniCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FieldGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-[#eef3f8] pb-2 last:border-0 last:pb-0" key={label}>
          <span className="text-xs font-bold uppercase text-[#8ca0bf]">{label}</span>
          <span className="font-semibold text-[#172033]">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function EmployeeProfileWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-[280px_1fr] gap-5 max-xl:grid-cols-1">
      <div className="rounded-lg border border-[#dce2eb] bg-white p-5 text-center shadow-sm">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#dff7ff] text-2xl font-bold text-brand">SG</div>
        <h2 className="mt-4 text-xl font-semibold text-[#172033]">Acme Employee</h2>
        <p className="text-sm font-semibold uppercase text-brand">HR Operations</p>
        <div className="mt-5 grid gap-2 text-left text-sm">
          <div className="rounded-lg bg-[#f8fafc] p-3"><strong>Employee ID</strong><br />SGS/HR/0001</div>
          <div className="rounded-lg bg-[#f8fafc] p-3"><strong>Status</strong><br />Active</div>
          <div className="rounded-lg bg-[#f8fafc] p-3"><strong>Profile Completion</strong><br />Personal, Work, Bank, Documents</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <MiniCard title="Personal Information">
          <FieldGrid rows={[["Full Name", "Acme Employee"], ["Gender", "Not set"], ["Date of Birth", "Update required"], ["Blood Group", "O +"]]} />
        </MiniCard>
        <MiniCard title="Official Information">
          <FieldGrid rows={[["Department", "HR & Operations"], ["Designation", "Manager"], ["Reporting To", "HR Admin"], ["Work Location", "Hyderabad"]]} />
        </MiniCard>
        <MiniCard title="Contact & Address">
          <FieldGrid rows={[["Mobile", "+1-800-555-0199"], ["Email", "support@example.com"], ["Emergency", "Update required"], ["Address", "Hyderabad, Telangana"]]} />
        </MiniCard>
        <MiniCard title="Documents & Bank">
          <FieldGrid rows={[["Documents", "Verification queue"], ["Bank", "Secure details"], ["PAN", "Compliance"], ["UAN/ESI", "Payroll linked"]]} />
        </MiniCard>
      </div>
    </section>
  );
}

export function AttendanceRulesWorkspace() {
  const rules: Array<[string, string]> = [
    ["Shift Timing", "09:30 AM to 06:30 PM"],
    ["Late Mark", "After 09:45 AM"],
    ["Half Day", "Less than 4 working hours"],
    ["Regularization", "Manager approval required"],
    ["Geo Attendance", "Office radius validation"],
    ["Biometric", "Integration ready"],
  ];
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Attendance Rules">
        <FieldGrid rows={rules} />
      </MiniCard>
      <MiniCard title="Approval Flow">
        <div className="grid gap-3 text-sm">
          {["Employee request", "Manager review", "HR validation", "Attendance update"].map((step) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={step}>
              <CheckCircle2 className="h-4 w-4 text-[#18865a]" />
              <span className="font-semibold">{step}</span>
            </div>
          ))}
        </div>
      </MiniCard>
      <MiniCard title="Attendance Sources">
        <div className="grid gap-3 text-sm">
          {( [
            ["Web check-in", Fingerprint],
            ["Geo location", MapPin],
            ["Biometric device", ShieldCheck],
            ["Manual HR entry", UserRound],
          ] as Array<[string, LucideIcon]>).map(([label, Icon]) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={String(label)}>
              <Icon className="h-4 w-4 text-brand" />
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </MiniCard>
    </section>
  );
}

export function PayrollRunWorkspace() {
  const steps = ["Create Run", "Import Attendance", "Calculate Salary", "Verify Deductions", "Lock Payroll", "Publish Payslips"];
  return (
    <section className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172033]">Payroll Run Wizard</h2>
          <p className="text-sm text-muted">Same step-by-step payroll flow from the reference, connected to the live payroll run actions below.</p>
        </div>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="button">
          <BadgeIndianRupee className="h-4 w-4" />
          Start Payroll
        </button>
      </div>
      <div className="grid grid-cols-6 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        {steps.map((step, index) => (
          <div className="rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-4" key={step}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</div>
            <div className="mt-3 text-sm font-semibold text-[#172033]">{step}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReportsExportWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      {( [
        ["Employee Report", "Profile, department and status data", FileCheck2],
        ["Attendance Report", "Logs, late marks and regularization", CalendarCheck],
        ["Payroll Report", "Gross, deductions, net pay and statutory", BadgeIndianRupee],
      ] as Array<[string, string, LucideIcon]>).map(([title, note, Icon]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={String(title)}>
          <Icon className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
          <div className="mt-4 flex gap-2">
            <button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#dce2eb] px-3 text-sm font-semibold" type="button"><FileSpreadsheet className="h-4 w-4" />Excel</button>
            <button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#dce2eb] px-3 text-sm font-semibold" type="button"><Download className="h-4 w-4" />PDF</button>
          </div>
        </div>
      ))}
    </section>
  );
}

export function OrganizationChartWorkspace() {
  return (
    <section className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172033]">Visual Organization Chart</h2>
      <div className="mt-5 grid justify-items-center gap-4">
        <div className="rounded-lg bg-[#1f2a44] px-6 py-4 text-center text-white shadow-sm">
          <Building2 className="mx-auto h-6 w-6" />
          <div className="mt-2 font-semibold">Acme Corp</div>
        </div>
        <GitFork className="h-6 w-6 text-[#8ca0bf]" />
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          {["HR & Operations", "Finance & Payroll", "Recruitment & Admin"].map((team) => (
            <div className="rounded-lg border border-[#dce2eb] bg-[#f8fafc] px-5 py-4 text-center" key={team}>
              <div className="font-semibold text-[#172033]">{team}</div>
              <div className="mt-1 text-xs text-muted">Manager mapping enabled</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SettingsSetupWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      {[
        ["Company Profile", "Branding, address, statutory IDs"],
        ["Work Week", "Shift, weekly off and holiday policy"],
        ["Roles & Permissions", "Super admin, HR, manager, employee"],
        ["Payroll Settings", "PF, ESI, PT, TDS and salary heads"],
        ["Attendance Settings", "Late marks, geo, biometric and overtime"],
        ["Leave Settings", "Types, balances, carry forward and sandwich rules"],
      ].map(([title, note]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm" key={title}>
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-brand" />
            <div>
              <div className="font-semibold text-[#172033]">{title}</div>
              <div className="text-xs text-muted">{note}</div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export function LeaveRulesWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Leave Balances">
        <FieldGrid rows={[["Earned Leave", "12 days"], ["Sick Leave", "6 days"], ["Casual Leave", "6 days"], ["Comp-Off", "Approval linked"]]} />
      </MiniCard>
      <MiniCard title="Leave Rules">
        <FieldGrid rows={[["Carry Forward", "Enabled"], ["Sandwich Rule", "Configurable"], ["Half Day", "Allowed"], ["Approval", "Manager then HR"]]} />
      </MiniCard>
      <MiniCard title="Request Flow">
        <div className="grid gap-3 text-sm">
          {["Apply leave", "Balance validation", "Manager approval", "HR audit update"].map((step) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={step}>
              <CalendarCheck className="h-4 w-4 text-brand" />
              <span className="font-semibold">{step}</span>
            </div>
          ))}
        </div>
      </MiniCard>
    </section>
  );
}

export function DocumentsVerificationWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {[
        ["Identity", "Aadhaar, PAN, passport", "Secure upload"],
        ["Education", "Certificates and marksheets", "HR verification"],
        ["Employment", "Offer, experience, joining", "Direct upload"],
        ["Bank", "Account proof and cancelled cheque", "Payroll secure"],
      ].map(([title, note, status]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={title}>
          <FileCheck2 className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
          <div className="mt-4 rounded-full bg-[#e6f5ef] px-3 py-2 text-xs font-semibold text-[#18865a]">{status}</div>
        </div>
      ))}
    </section>
  );
}

export function HolidayCalendarWorkspace() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <section className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#172033]">Calendar View</h2>
          <p className="text-sm text-muted">Mandatory, optional and regional holidays in a month grid.</p>
        </div>
        <div className="rounded-lg border border-[#dce2eb] px-4 py-2 text-sm font-semibold text-[#34465f]">June 2026</div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {days.map((day) => <div className="rounded-lg bg-[#eef3f8] p-2 font-semibold text-[#49637f]" key={day}>{day}</div>)}
        {Array.from({ length: 35 }, (_, index) => {
          const date = index + 1;
          const marked = [5, 15, 26].includes(date);
          return (
            <div className={`min-h-20 rounded-lg border p-2 text-left ${marked ? "border-brand bg-[#eef5ff]" : "border-[#e8edf4] bg-[#f8fafc]"}`} key={date}>
              <div className="font-semibold">{date <= 30 ? date : ""}</div>
              {marked ? <div className="mt-2 text-xs font-semibold text-brand">Holiday</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function InsuranceWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Policy Details">
        <FieldGrid rows={[["Provider", "Company policy"], ["Coverage", "Employee + dependents"], ["Validity", "Annual"], ["Status", "Active"]]} />
      </MiniCard>
      <MiniCard title="Dependents">
        <div className="grid gap-3 text-sm">
          {["Spouse", "Children", "Parents"].map((person) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={person}>
              <UsersRound className="h-4 w-4 text-brand" />
              <span className="font-semibold">{person}</span>
            </div>
          ))}
        </div>
      </MiniCard>
      <MiniCard title="Claim Workflow">
        <div className="grid gap-3 text-sm">
          {["Submit claim", "Attach proof", "HR approval", "Reimbursement"].map((step) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={step}>
              <HeartPulse className="h-4 w-4 text-brand" />
              <span className="font-semibold">{step}</span>
            </div>
          ))}
        </div>
      </MiniCard>
    </section>
  );
}

export function RewardsMarketplaceWorkspace() {
  const rewards: Array<[string, string, LucideIcon]> = [
    ["Voucher", "Gift cards and employee benefits", Gift],
    ["Reward Points", "Point ledger and balance", Trophy],
    ["Recognition", "Employee wins and appreciation", CheckCircle2],
    ["Benefits", "Marketplace items and perks", ShieldCheck],
  ];

  return (
    <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {rewards.map(([title, note, Icon]) => (
        <div className="overflow-hidden rounded-lg border border-[#dce2eb] bg-white shadow-sm" key={String(title)}>
          <div className="h-24 bg-[#1f2a44] p-5 text-white">
            <Icon className="h-8 w-8" />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-[#172033]">{title}</h3>
            <p className="mt-2 text-sm text-muted">{note}</p>
            <button className="mt-4 min-h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="button">Configure</button>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ExpensePayoutWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Claim Workflow">
        <div className="grid gap-3 text-sm">
          {["Employee claim", "Receipt upload", "Manager approval", "HR approval", "Reimbursement"].map((step) => (
            <div className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3" key={step}>
              <ReceiptText className="h-4 w-4 text-brand" />
              <span className="font-semibold">{step}</span>
            </div>
          ))}
        </div>
      </MiniCard>
      <MiniCard title="Expense Categories">
        <FieldGrid rows={[["Travel", "Receipt required"], ["Food", "Policy limit"], ["Office", "Manager approval"], ["Medical", "HR review"]]} />
      </MiniCard>
      <MiniCard title="Payout Status">
        <FieldGrid rows={[["Pending", "Manager queue"], ["Approved", "Finance ready"], ["Rejected", "Reason required"], ["Paid", "Bank export"]]} />
      </MiniCard>
    </section>
  );
}

export function KonnectWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-[1fr_320px] gap-5 max-xl:grid-cols-1">
      <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#172033]">Company Feed</h2>
        <div className="mt-4 grid gap-4">
          {[
            ["Company Announcement", "Broadcast updates to all employees with comments and likes."],
            ["Birthday Wishes", "Auto-surface birthdays and employee celebrations."],
            ["Recognition Post", "Share rewards, wins and HR appreciation posts."],
          ].map(([title, note]) => (
            <div className="rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-4" key={title}>
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-brand" />
                <div>
                  <div className="font-semibold text-[#172033]">{title}</div>
                  <div className="text-sm text-muted">{note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <MiniCard title="Engagement Controls">
        <FieldGrid rows={[["Likes", "Enabled"], ["Comments", "Enabled"], ["Audience", "All employees"], ["Moderation", "HR Admin"]]} />
      </MiniCard>
    </section>
  );
}

export function PerformanceReviewWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {[
        ["Goals", "KRA and target tracking"],
        ["Attendance", "Presence score signals"],
        ["Recognition", "Rewards-based appraisal signals"],
        ["Review Cycle", "Manager rating and HR lock"],
      ].map(([title, note]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={title}>
          <Target className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef3f8]">
            <div className="h-full w-2/3 bg-brand" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function RecruitmentWorkflowWorkspace() {
  const stages = ["Job Posting", "Candidate Database", "Resume Upload", "Interview", "Offer Letter", "Joining"];
  return (
    <section className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172033]">Recruitment Pipeline</h2>
      <div className="mt-5 grid grid-cols-6 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        {stages.map((stage, index) => (
          <div className="rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-4" key={stage}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</div>
            <div className="mt-3 text-sm font-semibold text-[#172033]">{stage}</div>
          </div>
        ))}
      </div>
    </section>
  );
}



export function ComplianceWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
      {["PF", "ESI", "Professional Tax", "TDS", "Form 16"].map((item) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm" key={item}>
          <ShieldCheck className="h-7 w-7 text-brand" />
          <div className="mt-3 font-semibold text-[#172033]">{item}</div>
          <div className="mt-1 text-xs text-muted">Payroll linked statutory report</div>
        </div>
      ))}
    </section>
  );
}

export function AssetsWorkflowWorkspace() {
  const assets: Array<[string, string, LucideIcon]> = [
    ["Inventory", "Laptop, ID card, SIM, access card", ReceiptText],
    ["Assignment", "Issue assets to employees", UserRound],
    ["Handover", "Return checklist and condition", CheckCircle2],
    ["Audit", "Asset tag and movement history", FileCheck2],
  ];

  return (
    <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {assets.map(([title, note, Icon]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={String(title)}>
          <Icon className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
        </div>
      ))}
    </section>
  );
}

export function NotificationsWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {[
        ["Email Alerts", "Leave, payroll and HR notices"],
        ["Push Notifications", "Mobile app instant alerts"],
        ["In-App Queue", "Audit-backed notification history"],
      ].map(([title, note]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={title}>
          <BellRing className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
          <div className="mt-4 rounded-full bg-[#e6f5ef] px-3 py-2 text-xs font-semibold text-[#18865a]">Channel ready</div>
        </div>
      ))}
    </section>
  );
}

export function IntegrationsWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Communication">
        <FieldGrid rows={[["Email", "SMTP/API"], ["WhatsApp", "Template alerts"], ["Push", "Notification channel"], ["Status", "Testable"]]} />
      </MiniCard>
      <MiniCard title="Attendance Devices">
        <FieldGrid rows={[["Biometric", "Device import"], ["Geo", "Location check-in"], ["Shift", "Rules sync"], ["Logs", "Live API"]]} />
      </MiniCard>
      <MiniCard title="Storage & Payroll">
        <FieldGrid rows={[["S3", "Documents"], ["Bank Export", "Payroll file"], ["Storage", "Documents"], ["Audit", "Tracked"]]} />
      </MiniCard>
    </section>
  );
}

export function SecurityAdminWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Access Control">
        <FieldGrid rows={[["Roles", "Super Admin, HR, Manager, Employee"], ["Permissions", "Module-level"], ["2FA/OTP", "Login security"], ["Sessions", "Token based"]]} />
      </MiniCard>
      <MiniCard title="Data Protection">
        <FieldGrid rows={[["Payroll", "Sensitive fields"], ["Documents", "Secure storage"], ["Audit Logs", "All actions"], ["Access", "Controlled"]]} />
      </MiniCard>
      <MiniCard title="Admin Controls">
        <FieldGrid rows={[["Branding", "SKYLINX"], ["Modules", "Enable/disable"], ["Import/Export", "Controlled"], ["License", "Subscription ready"]]} />
      </MiniCard>
    </section>
  );
}

export function AnalyticsWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {[
        ["Workforce", "Headcount, department and location"],
        ["Attendance", "Presence, late and exception trends"],
        ["Payroll", "Gross, net, deductions and statutory"],
      ].map(([title, note]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={title}>
          <Target className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef3f8]">
            <div className="h-full w-3/4 bg-brand" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function SaasBillingWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
      <MiniCard title="Company Tenant">
        <FieldGrid rows={[["Company", "SKYLINX"], ["Active Plan", "Standard"], ["Employee Limit", "100"], ["Upgrade Path", "Basic to Standard to Pro"]]} />
      </MiniCard>
      <MiniCard title="Billing">
        <FieldGrid rows={[["Invoice", "Monthly"], ["Standard", "₹1,749/month"], ["Pro", "₹3,750/month"], ["Add-on User", "₹70 / ₹150"]]} />
      </MiniCard>
      <MiniCard title="SaaS Controls">
        <FieldGrid rows={[["Basic", "Core HR access"], ["Standard", "HR operations access"], ["Pro", "All module access"], ["Module Lock", "Plan based"]]} />
      </MiniCard>
    </section>
  );
}

export function ApprovalsWorkflowWorkspace() {
  return (
    <section className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {[
        ["Leave", "Approve or reject leave requests"],
        ["Attendance", "Regularization and overtime"],
        ["Expense", "Manager and HR approval"],
        ["Payroll", "Run lock and statutory checks"],
      ].map(([title, note]) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm" key={title}>
          <CheckCircle2 className="h-8 w-8 text-brand" />
          <h3 className="mt-4 text-lg font-semibold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm text-muted">{note}</p>
        </div>
      ))}
    </section>
  );
}
