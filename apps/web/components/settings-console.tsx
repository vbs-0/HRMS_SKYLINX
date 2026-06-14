"use client";

import { FileDown, FileUp, KeyRound, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackCompanySettings, fallbackModuleSettings } from "../lib/fallback-data";
import { defaultActivePlan, hasPlanAccess, isPlanName, planTone, requiredPlanForModule, type PlanName } from "../lib/plan-access";
import { Card, StatusPill } from "./ui";
import { getAccessToken } from "../lib/session";
import { hasPermission } from "../lib/permissions";

type CompanySettings = typeof fallbackCompanySettings;
type ModuleSetting = (typeof fallbackModuleSettings)[number];

interface PtSlab { upto: number; monthly: number }
interface TdsSlab { from: number; upto: number; rate: number }

interface PayrollRules extends Record<string, unknown> {
  salaryStructure: string;
  pfEnabled: boolean;
  esiEnabled: boolean;
  professionalTaxEnabled: boolean;
  tdsEnabled: boolean;
  payrollLockDay: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  pfWageCeiling: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  esiWageCeiling: number;
  ptSlabs: PtSlab[];
  tdsSlabs: TdsSlab[];
}

interface DeclarationRules {
  windowEnabled: boolean;
  monthlyFromDay: number;
  monthlyToDay: number;
  currentFiscalYearStart?: string;
  fiscalYearDeadline?: string;
}

interface ClientRules {
  branding: Record<string, string | number | boolean>;
  attendance: Record<string, string | number | boolean>;
  leave: Record<string, string | number | boolean>;
  payroll: PayrollRules;
  approvals: Record<string, string | number | boolean>;
  support: Record<string, string | number | boolean>;
  documents: Record<string, string | number | boolean>;
  declarations?: DeclarationRules;
}

interface SettingsLog {
  id: string;
  module: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor?: { email: string; employee?: { firstName: string; lastName: string } | null } | null;
}

const defaultPtSlabs: PtSlab[] = [
  { upto: 10000, monthly: 0 },
  { upto: 15000, monthly: 110 },
  { upto: 20000, monthly: 130 },
  { upto: 999999, monthly: 200 },
];

const defaultTdsSlabs: TdsSlab[] = [
  { from: 0, upto: 250000, rate: 0 },
  { from: 250001, upto: 500000, rate: 5 },
  { from: 500001, upto: 750000, rate: 10 },
  { from: 750001, upto: 1000000, rate: 15 },
  { from: 1000001, upto: 1250000, rate: 20 },
  { from: 1250001, upto: 1500000, rate: 25 },
  { from: 1500001, upto: 999999999, rate: 30 },
];

const defaultPayrollRules: PayrollRules = {
  salaryStructure: "Monthly CTC",
  pfEnabled: true,
  esiEnabled: true,
  professionalTaxEnabled: true,
  tdsEnabled: true,
  payrollLockDay: 28,
  pfEmployeeRate: 12.0,
  pfEmployerRate: 12.0,
  pfWageCeiling: 15000,
  esiEmployeeRate: 0.75,
  esiEmployerRate: 3.25,
  esiWageCeiling: 21000,
  ptSlabs: defaultPtSlabs,
  tdsSlabs: defaultTdsSlabs,
};

const defaultClientRules: ClientRules = {
  branding: {
    platformBrand: "PeopleOS",
    clientDisplayName: "My Company",
    showPoweredBy: true,
    primaryColor: "#078ced",
    supportEmail: "support@example.com",
    supportPhone: "+91-800-PeopleOS",
  },
  attendance: {
    workWeek: "Monday to Saturday",
    shiftStart: "09:30",
    shiftEnd: "18:30",
    graceMinutes: 10,
    geoAttendance: true,
    biometricRequired: false,
    overtimeEnabled: true,
  },
  leave: {
    approvalFlow: "Manager then HR",
    sandwichLeave: false,
    carryForward: false,
    compOffAllowed: true,
    leaveYear: "Calendar Year",
  },
  payroll: defaultPayrollRules,
  approvals: {
    expenseApproval: "Manager then HR",
    documentVerification: "HR",
    payrollApproval: "HR Admin",
  },
  support: {
    slaHighHours: 24,
    slaMediumHours: 48,
    slaLowHours: 72,
  },
  documents: {
    expiryReminderDays: 30,
  },
  declarations: {
    windowEnabled: true,
    monthlyFromDay: 1,
    monthlyToDay: 15,
  },
};

const planCards = [
  {
    plan: "Basic" as PlanName,
    title: "Free Forever",
    price: "\u20B90",
    access: "Core HR access",
    includes: ["Dashboard", "Employee directory", "Documents", "Attendance", "Leave", "Holidays", "Reports", "Settings"],
  },
  {
    plan: "Standard" as PlanName,
    title: "Professional",
    price: "\u20B924,765.84/year",
    access: "HR operations access",
    includes: ["Payroll", "Expenses", "Insurance", "ID & visiting cards", "Organization chart", "Approvals", "Social feed", "Assets"],
  },
  {
    plan: "Pro" as PlanName,
    title: "Enterprise",
    price: "\u20B953,100/year",
    access: "All module access",
    includes: ["Rewards", "Compliance", "Security", "Analytics"],
  },
];

function moduleLabel(module: string) {
  return module
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeArray<T>(val: unknown, fallback: T[]): T[] {
  if (Array.isArray(val)) return val as T[];
  return fallback;
}

export function SettingsConsole() {
  const [company, setCompany] = useState<CompanySettings>(fallbackCompanySettings);
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [rules, setRules] = useState<ClientRules>(defaultClientRules);
  const [logs, setLogs] = useState<SettingsLog[]>([]);
  const [activePlan, setActivePlan] = useState<PlanName>(defaultActivePlan);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // Editable slab states (pulled from rules)
  const [ptSlabs, setPtSlabs] = useState<PtSlab[]>(defaultPtSlabs);
  const [tdsSlabs, setTdsSlabs] = useState<TdsSlab[]>(defaultTdsSlabs);

  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  function loadOrgStructure() {
    apiFetch<any[]>("/organization/departments")
      .then((body) => {
        if (body.data) setDepartments(body.data);
      })
      .catch(() => undefined);

    apiFetch<any[]>("/organization/designations")
      .then((body) => {
        if (body.data) setDesignations(body.data);
      })
      .catch(() => undefined);

    apiFetch<any[]>("/organization/locations")
      .then((body) => {
        if (body.data) setLocations(body.data);
      })
      .catch(() => undefined);
  }

  async function handleAddDepartment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") || "");
    const code = String(form.get("code") || "");
    if (!name || !code) return;
    try {
      await apiFetch("/organization/departments", {
        method: "POST",
        body: JSON.stringify({ name, code }),
      });
      formEl.reset();
      loadOrgStructure();
      setMessage("Department added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add department");
    }
  }

  async function handleAddDesignation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const title = String(form.get("title") || "");
    const grade = String(form.get("grade") || "");
    const departmentId = String(form.get("departmentId") || "") || null;
    if (!title) return;
    try {
      await apiFetch("/organization/designations", {
        method: "POST",
        body: JSON.stringify({ title, grade, departmentId }),
      });
      formEl.reset();
      loadOrgStructure();
      setMessage("Designation added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add designation");
    }
  }

  async function handleAddLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") || "");
    const city = String(form.get("city") || "");
    const state = String(form.get("state") || "");
    const country = String(form.get("country") || "India");
    const address = String(form.get("address") || "");
    if (!name || !city || !state) return;
    try {
      await apiFetch("/organization/locations", {
        method: "POST",
        body: JSON.stringify({ name, city, state, country, address }),
      });
      formEl.reset();
      loadOrgStructure();
      setMessage("Location added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    }
  }

  /** Fetches an API endpoint silently — does NOT redirect to /login on 401 */
  async function silentFetch<T>(path: string, requires?: string): Promise<T | null> {
    if (requires && !hasPermission(requires)) return null;
    const token = getAccessToken();
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";
    try {
      const res = await fetch(`${base}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } catch {
      return null;
    }
  }

  function load() {
    const token = getAccessToken();
    if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const roles: string[] = payload.roles || [];
          setIsOwner(!payload.tenantId && (roles.includes("super_admin") || roles.includes("SUPER_ADMIN") || roles.includes("SYSTEM_OWNER") || payload.isSuperAdmin === true));
        } catch {
        // ignore
      }
    }

    // These endpoints require settings.configure permission — use silentFetch (no redirect on 401)
    silentFetch<CompanySettings>("/settings/company", "settings.configure").then((data) => {
      if (data) setCompany({ ...fallbackCompanySettings, ...data });
    });
    silentFetch<ModuleSetting[]>("/settings/modules", "settings.configure").then((data) => {
      if (data?.length) setModules(data.map((item) => ({ module: item.module, enabled: item.enabled })));
    });
    silentFetch<SettingsLog[]>("/settings/logs", "settings.configure").then((data) => {
      if (data) setLogs(data);
    });

    apiFetch<{ activePlan: string }>("/saas")
      .then((body) => {
        if (body.data?.activePlan && isPlanName(body.data.activePlan)) setActivePlan(body.data.activePlan);
      })
      .catch(() => undefined);

    // Rules — accessible to any authenticated user
    apiFetch<ClientRules>("/settings/rules")
      .then((body) => {
        if (body.data) {
          const merged = { ...defaultClientRules, ...body.data };
          const payroll = { ...defaultPayrollRules, ...(body.data.payroll || {}) };
          merged.payroll = payroll;
          setRules(merged);
          setPtSlabs(safeArray<PtSlab>(payroll.ptSlabs, defaultPtSlabs));
          setTdsSlabs(safeArray<TdsSlab>(payroll.tdsSlabs, defaultTdsSlabs));
        }
      })
      .catch(() => undefined);

    loadOrgStructure();
  }

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )peopleos_plan=([^;]+)/);
    const plan = match ? decodeURIComponent(match[1]) : "";
    if (isPlanName(plan)) setActivePlan(plan);
    load();
  }, []);

  // Apply branding colors dynamically whenever rules change
  useEffect(() => {
    const color = String(rules.branding.primaryColor || "#078ced");
    document.documentElement.style.setProperty("--color-brand", color);
  }, [rules.branding.primaryColor]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const body = await apiFetch<CompanySettings>("/settings/company", {
        method: "PATCH",
        body: JSON.stringify({
          name: String(form.get("name")),
          legalName: String(form.get("legalName")),
          logoUrl: String(form.get("logoUrl")),
          address: String(form.get("address")),
          taxId: String(form.get("taxId")),
          workWeek: String(form.get("workWeek")),
          timezone: String(form.get("timezone")),
        }),
      });
      if (body.data) setCompany({ ...fallbackCompanySettings, ...body.data });
      setMessage("Company settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Company update failed");
    }
  }

  async function toggleModule(module: string, enabled: boolean) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/settings/modules/${module}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      setModules((current) => current.map((item) => item.module === module ? { ...item, enabled } : item));
      setMessage(`${module} ${enabled ? "enabled" : "disabled"}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Module update failed");
    }
  }

  async function saveRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const body: ClientRules = {
      branding: {
        platformBrand: String(form.get("platformBrand")),
        clientDisplayName: String(form.get("clientDisplayName")),
        showPoweredBy: form.get("showPoweredBy") === "on",
        primaryColor: String(form.get("primaryColor")),
        supportEmail: String(form.get("supportEmail")),
        supportPhone: String(form.get("supportPhone")),
      },
      attendance: {
        workWeek: String(form.get("attendanceWorkWeek")),
        shiftStart: String(form.get("shiftStart")),
        shiftEnd: String(form.get("shiftEnd")),
        graceMinutes: Number(form.get("graceMinutes")),
        geoAttendance: form.get("geoAttendance") === "on",
        biometricRequired: form.get("biometricRequired") === "on",
        overtimeEnabled: form.get("overtimeEnabled") === "on",
      },
      leave: {
        approvalFlow: String(form.get("leaveApprovalFlow")),
        sandwichLeave: form.get("sandwichLeave") === "on",
        carryForward: form.get("carryForward") === "on",
        compOffAllowed: form.get("compOffAllowed") === "on",
        leaveYear: String(form.get("leaveYear")),
      },
      payroll: {
        salaryStructure: String(form.get("salaryStructure")),
        pfEnabled: form.get("pfEnabled") === "on",
        esiEnabled: form.get("esiEnabled") === "on",
        professionalTaxEnabled: form.get("professionalTaxEnabled") === "on",
        tdsEnabled: form.get("tdsEnabled") === "on",
        payrollLockDay: Number(form.get("payrollLockDay")),
        pfEmployeeRate: Number(form.get("pfEmployeeRate")),
        pfEmployerRate: Number(form.get("pfEmployerRate")),
        pfWageCeiling: Number(form.get("pfWageCeiling")),
        esiEmployeeRate: Number(form.get("esiEmployeeRate")),
        esiEmployerRate: Number(form.get("esiEmployerRate")),
        esiWageCeiling: Number(form.get("esiWageCeiling")),
        ptSlabs,
        tdsSlabs,
      },
      approvals: {
        expenseApproval: String(form.get("expenseApproval")),
        documentVerification: String(form.get("documentVerification")),
        payrollApproval: String(form.get("payrollApproval")),
      },
      support: {
        slaHighHours: Number(form.get("slaHighHours")),
        slaMediumHours: Number(form.get("slaMediumHours")),
        slaLowHours: Number(form.get("slaLowHours")),
      },
      documents: {
        expiryReminderDays: Number(form.get("documentsExpiryReminderDays") || 30),
      },
    };

    try {
      await apiFetch("/settings/rules", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setRules(body);
      setMessage("Client rules saved successfully.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client rules update failed");
    }
  }

  async function saveDeclarations(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Are you sure you want to update the Tax Declaration Window settings? This affects active employee tax planning and proof submissions.")) return;

    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const fiscalYearDeadline = String(form.get("fiscalYearDeadline"));
    // The payroll cutoff logic reads fyCutoffMonth/fyCutoffDay (recurring annual),
    // not the full date — derive them from the picked deadline so the admin's
    // choice actually takes effect instead of being silently ignored. Parse the
    // YYYY-MM-DD string directly to avoid Date()'s UTC/local off-by-one.
    const [, fyMonthStr, fyDayStr] = fiscalYearDeadline.split("-");
    const fyCutoffMonth = Number(fyMonthStr);
    const fyCutoffDay = Number(fyDayStr);
    const body = {
      declarations: {
        windowEnabled: form.get("windowEnabled") === "on",
        monthlyFromDay: Number(form.get("monthlyFromDay")),
        monthlyToDay: Number(form.get("monthlyToDay")),
        currentFiscalYearStart: String(form.get("currentFiscalYearStart")),
        fiscalYearDeadline,
        ...(fyCutoffMonth >= 1 && fyCutoffMonth <= 12 && fyCutoffDay >= 1 && fyCutoffDay <= 31
          ? { fyCutoffMonth, fyCutoffDay }
          : {}),
      }
    };
    try {
      await apiFetch("/settings/rules", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setRules((prev) => ({ ...prev, declarations: body.declarations }));
      setMessage("Declaration settings saved successfully.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Declaration settings update failed");
    }
  }

  const [testingEmail, setTestingEmail] = useState(false);

  async function handleTestEmail() {
    const to = prompt("Enter email address to send test email to:");
    if (!to) return;
    setTestingEmail(true);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<any>("/settings/test-email", {
        method: "POST",
        body: JSON.stringify({ to }),
      });
      setMessage(res?.message || "Test email sent successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to send test email.");
    } finally {
      setTestingEmail(false);
    }
  }

  function downloadSettings() {
    const payload = encodeURIComponent(JSON.stringify({ company, rules, modules }, null, 2));
    const anchor = document.createElement("a");
    anchor.href = `data:application/json;charset=utf-8,${payload}`;
    anchor.download = "peopleos-client-settings.json";
    anchor.click();
    setMessage("Settings export downloaded.");
  }

  function inputClass() {
    return "min-h-10 rounded-lg border border-[var(--border-default)] px-3 text-sm";
  }

  function checkbox(name: string, label: string, checked: boolean) {
    return (
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-sm">
        <input defaultChecked={checked} name={name} type="checkbox" />
        {label}
      </label>
    );
  }

  // ── PT Slab helpers ──────────────────────────────────────────────────────
  function addPtSlab() {
    setPtSlabs((prev) => [...prev, { upto: 0, monthly: 0 }]);
  }
  function removePtSlab(i: number) {
    setPtSlabs((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updatePtSlab(i: number, field: keyof PtSlab, value: number) {
    setPtSlabs((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  // ── TDS Slab helpers ─────────────────────────────────────────────────────
  function addTdsSlab() {
    setTdsSlabs((prev) => [...prev, { from: 0, upto: 0, rate: 0 }]);
  }
  function removeTdsSlab(i: number) {
    setTdsSlabs((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateTdsSlab(i: number, field: keyof TdsSlab, value: number) {
    setTdsSlabs((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)]">{message}</div> : null}
      {error ? <div className="rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)]">{error}</div> : null}

      {/* ── Company Profile ─────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Company Profile</h2>
        <form className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1" onSubmit={saveCompany}>
          <input className={inputClass()} name="name" defaultValue={company.name} placeholder="Company Name" />
          <input className={inputClass()} name="legalName" defaultValue={company.legalName} placeholder="Legal Name" />
          <input className={inputClass()} name="logoUrl" defaultValue={company.logoUrl} placeholder="Logo URL" />
          <input className={inputClass()} name="address" defaultValue={company.address || ""} placeholder="Address" />
          <input className={inputClass()} name="taxId" defaultValue={company.taxId || ""} placeholder="Tax ID / GSTIN" />
          <input className={inputClass()} name="workWeek" defaultValue={company.workWeek} placeholder="Work Week" />
          <input className={inputClass()} name="timezone" defaultValue={company.timezone} placeholder="Timezone" />
          <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Save Profile</button>
        </form>
      </Card>

      {/* ── Client Rules & Branding ─────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Client Rules &amp; Branding</h2>
            <p className="mt-1 text-sm text-muted">Configure each company's rules, branding, and statutory deduction rates.</p>
          </div>
          <StatusPill tone="green">Database Saved</StatusPill>
        </div>
        <form className="grid gap-6" onSubmit={saveRules}>

          {/* Branding */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">🎨 Branding &amp; White-Label</h3>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Platform Brand Name</label>
                <input className={inputClass()} name="platformBrand" defaultValue={String(rules.branding.platformBrand)} placeholder="Platform Brand" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Company Display Name</label>
                <input className={inputClass()} name="clientDisplayName" defaultValue={String(rules.branding.clientDisplayName)} placeholder="Client Display Name" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Primary Brand Color</label>
                <div className="flex gap-2">
                  <input className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--border-default)] p-1" name="primaryColor" defaultValue={String(rules.branding.primaryColor)} type="color" />
                  <input className={`${inputClass()} flex-1`} defaultValue={String(rules.branding.primaryColor)} readOnly />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Support Email</label>
                <input className={inputClass()} name="supportEmail" defaultValue={String(rules.branding.supportEmail || "support@example.com")} placeholder="support@company.com" type="email" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Support Phone</label>
                <input className={inputClass()} name="supportPhone" defaultValue={String(rules.branding.supportPhone || "+91-800-PeopleOS")} placeholder="+91-800-PeopleOS" type="tel" />
              </div>
              <div className="flex flex-col justify-end gap-1">
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {testingEmail ? "Sending..." : "Test SMTP Config"}
                </button>
              </div>
              {checkbox("showPoweredBy", "Show Powered By Badge", Boolean(rules.branding.showPoweredBy))}
            </div>
          </section>

          {/* Attendance */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">🕐 Attendance Rules</h3>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Work Week</label>
                <input className={inputClass()} name="attendanceWorkWeek" defaultValue={String(rules.attendance.workWeek)} placeholder="Work Week" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Shift Start</label>
                <input className={inputClass()} name="shiftStart" defaultValue={String(rules.attendance.shiftStart)} type="time" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Shift End</label>
                <input className={inputClass()} name="shiftEnd" defaultValue={String(rules.attendance.shiftEnd)} type="time" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Grace Minutes</label>
                <input className={inputClass()} name="graceMinutes" defaultValue={Number(rules.attendance.graceMinutes)} min="0" type="number" />
              </div>
              {checkbox("geoAttendance", "Geo Attendance", Boolean(rules.attendance.geoAttendance))}
              {checkbox("biometricRequired", "Biometric Required", Boolean(rules.attendance.biometricRequired))}
              {checkbox("overtimeEnabled", "Overtime Enabled", Boolean(rules.attendance.overtimeEnabled))}
            </div>
          </section>

          {/* Leave */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">🗓️ Leave Rules</h3>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Approval Flow</label>
                <input className={inputClass()} name="leaveApprovalFlow" defaultValue={String(rules.leave.approvalFlow)} placeholder="Leave Approval Flow" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Leave Year</label>
                <input className={inputClass()} name="leaveYear" defaultValue={String(rules.leave.leaveYear)} placeholder="Leave Year" />
              </div>
              {checkbox("sandwichLeave", "Sandwich Leave", Boolean(rules.leave.sandwichLeave))}
              {checkbox("carryForward", "Carry Forward", Boolean(rules.leave.carryForward))}
              {checkbox("compOffAllowed", "Comp-Off Allowed", Boolean(rules.leave.compOffAllowed))}
            </div>
          </section>

          {/* Payroll General */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">💰 Payroll Configuration</h3>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Salary Structure</label>
                <input className={inputClass()} name="salaryStructure" defaultValue={String(rules.payroll.salaryStructure)} placeholder="Salary Structure" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Payroll Lock Day</label>
                <input className={inputClass()} name="payrollLockDay" defaultValue={Number(rules.payroll.payrollLockDay)} min="1" max="31" type="number" />
              </div>
              {checkbox("pfEnabled", "PF Enabled", Boolean(rules.payroll.pfEnabled))}
              {checkbox("esiEnabled", "ESI Enabled", Boolean(rules.payroll.esiEnabled))}
              {checkbox("professionalTaxEnabled", "Professional Tax", Boolean(rules.payroll.professionalTaxEnabled))}
              {checkbox("tdsEnabled", "TDS Enabled", Boolean(rules.payroll.tdsEnabled))}
            </div>
          </section>

          {/* PF & ESI Rates */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">📋 PF &amp; ESI Rates</h3>
            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-sunken)] p-4">
                <div className="mb-3 text-xs font-bold uppercase text-muted">Provident Fund (PF)</div>
                <div className="grid gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Employee Contribution (%)</label>
                    <input className={inputClass()} name="pfEmployeeRate" defaultValue={rules.payroll.pfEmployeeRate} min="0" max="100" step="0.01" type="number" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Employer Contribution (%)</label>
                    <input className={inputClass()} name="pfEmployerRate" defaultValue={rules.payroll.pfEmployerRate} min="0" max="100" step="0.01" type="number" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Wage Ceiling (₹)</label>
                    <input className={inputClass()} name="pfWageCeiling" defaultValue={rules.payroll.pfWageCeiling} min="0" type="number" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-sunken)] p-4">
                <div className="mb-3 text-xs font-bold uppercase text-muted">ESI (Employee State Insurance)</div>
                <div className="grid gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Employee Contribution (%)</label>
                    <input className={inputClass()} name="esiEmployeeRate" defaultValue={rules.payroll.esiEmployeeRate} min="0" max="100" step="0.01" type="number" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Employer Contribution (%)</label>
                    <input className={inputClass()} name="esiEmployerRate" defaultValue={rules.payroll.esiEmployerRate} min="0" max="100" step="0.01" type="number" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted">Wage Ceiling (₹)</label>
                    <input className={inputClass()} name="esiWageCeiling" defaultValue={rules.payroll.esiWageCeiling} min="0" type="number" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Tax Slabs */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase text-muted">🏛️ Professional Tax Slabs</h3>
              <button className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold" onClick={addPtSlab} type="button">
                <Plus className="h-3.5 w-3.5" /> Add Slab
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-[var(--border-default)]">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-muted">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3 text-left">Monthly Gross Upto (₹)</th>
                    <th className="border-b border-[var(--border-default)] p-3 text-left">Monthly PT (₹)</th>
                    <th className="border-b border-[var(--border-default)] p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {ptSlabs.map((slab, i) => (
                    <tr key={i}>
                      <td className="border-b border-[var(--border-default)] p-2">
                        <input
                          className="min-h-9 w-full rounded-lg border border-[var(--border-default)] px-3 text-sm"
                          value={slab.upto}
                          min="0"
                          type="number"
                          onChange={(e) => updatePtSlab(i, "upto", Number(e.target.value))}
                        />
                      </td>
                      <td className="border-b border-[var(--border-default)] p-2">
                        <input
                          className="min-h-9 w-full rounded-lg border border-[var(--border-default)] px-3 text-sm"
                          value={slab.monthly}
                          min="0"
                          type="number"
                          onChange={(e) => updatePtSlab(i, "monthly", Number(e.target.value))}
                        />
                      </td>
                      <td className="border-b border-[var(--border-default)] p-2 text-center">
                        <button className="rounded p-1 text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]" onClick={() => removePtSlab(i)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TDS / Income Tax Slabs */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase text-muted">📊 TDS / Income Tax Slabs</h3>
              <button className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold" onClick={addTdsSlab} type="button">
                <Plus className="h-3.5 w-3.5" /> Add Slab
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-[var(--border-default)]">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-muted">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3 text-left">From (₹)</th>
                    <th className="border-b border-[var(--border-default)] p-3 text-left">Upto (₹)</th>
                    <th className="border-b border-[var(--border-default)] p-3 text-left">Rate (%)</th>
                    <th className="border-b border-[var(--border-default)] p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {tdsSlabs.map((slab, i) => (
                    <tr key={i}>
                      <td className="border-b border-[var(--border-default)] p-2">
                        <input
                          className="min-h-9 w-full rounded-lg border border-[var(--border-default)] px-3 text-sm"
                          value={slab.from}
                          min="0"
                          type="number"
                          onChange={(e) => updateTdsSlab(i, "from", Number(e.target.value))}
                        />
                      </td>
                      <td className="border-b border-[var(--border-default)] p-2">
                        <input
                          className="min-h-9 w-full rounded-lg border border-[var(--border-default)] px-3 text-sm"
                          value={slab.upto}
                          min="0"
                          type="number"
                          onChange={(e) => updateTdsSlab(i, "upto", Number(e.target.value))}
                        />
                      </td>
                      <td className="border-b border-[var(--border-default)] p-2">
                        <input
                          className="min-h-9 w-full rounded-lg border border-[var(--border-default)] px-3 text-sm"
                          value={slab.rate}
                          min="0"
                          max="100"
                          step="0.5"
                          type="number"
                          onChange={(e) => updateTdsSlab(i, "rate", Number(e.target.value))}
                        />
                      </td>
                      <td className="border-b border-[var(--border-default)] p-2 text-center">
                        <button className="rounded p-1 text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]" onClick={() => removeTdsSlab(i)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Approvals */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">✅ Approvals Routing</h3>
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Expense Approval</label>
                <input className={inputClass()} name="expenseApproval" defaultValue={String(rules.approvals.expenseApproval)} placeholder="Expense Approval" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Document Verification</label>
                <input className={inputClass()} name="documentVerification" defaultValue={String(rules.approvals.documentVerification)} placeholder="Document Verification" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Payroll Approval</label>
                <input className={inputClass()} name="payrollApproval" defaultValue={String(rules.approvals.payrollApproval)} placeholder="Payroll Approval" />
              </div>
            </div>
          </section>

          {/* Support SLAs */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">🎧 Support SLAs (Hours)</h3>
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">High Priority SLA (Hours)</label>
                <input type="number" className={inputClass()} name="slaHighHours" defaultValue={Number(rules.support?.slaHighHours || 24)} placeholder="24" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Medium Priority SLA (Hours)</label>
                <input type="number" className={inputClass()} name="slaMediumHours" defaultValue={Number(rules.support?.slaMediumHours || 48)} placeholder="48" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Low Priority SLA (Hours)</label>
                <input type="number" className={inputClass()} name="slaLowHours" defaultValue={Number(rules.support?.slaLowHours || 72)} placeholder="72" />
              </div>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase text-muted">📁 Documents Configuration</h3>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted">Document Expiry Reminder Offset (Days)</label>
                <input
                  type="number"
                  className={inputClass()}
                  name="documentsExpiryReminderDays"
                  defaultValue={Number(rules.documents?.expiryReminderDays || 30)}
                  placeholder="30"
                  min="1"
                  required
                />
              </div>
            </div>
          </section>

          <button className="min-h-10 w-fit rounded-lg bg-brand px-6 text-sm font-semibold text-white">💾 Save All Rules</button>
        </form>
      </Card>

      {/* ── Tax Declaration Settings ────────────────────────────────────── */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Tax Declaration Settings</h2>
          <p className="mt-1 text-sm text-muted">Configure investment declaration windows and fiscal year deadlines for payroll compliance.</p>
        </div>
        <form className="grid gap-6" onSubmit={saveDeclarations}>
          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted">Monthly Window Start Day</label>
              <input type="number" className={inputClass()} name="monthlyFromDay" defaultValue={rules.declarations?.monthlyFromDay ?? 1} min="1" max="31" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted">Monthly Window End Day</label>
              <input type="number" className={inputClass()} name="monthlyToDay" defaultValue={rules.declarations?.monthlyToDay ?? 15} min="1" max="31" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted">Fiscal Year Start Date</label>
              <input type="date" className={inputClass()} name="currentFiscalYearStart" defaultValue={rules.declarations?.currentFiscalYearStart} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted">Fiscal Year End Deadline</label>
              <input type="date" className={inputClass()} name="fiscalYearDeadline" defaultValue={rules.declarations?.fiscalYearDeadline} required />
            </div>
            {checkbox("windowEnabled", "Declaration Window Enabled globally", Boolean(rules.declarations?.windowEnabled))}
          </div>
          <button className="min-h-10 w-fit rounded-lg bg-brand px-6 text-sm font-semibold text-white">Update Declaration Window</button>
        </form>
      </Card>

      {/* ── Organization Structure ──────────────────────────────────────── */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Organization Structure</h2>
          <p className="mt-1 text-sm text-muted">Configure departments, employee designations, and office work locations.</p>
        </div>

        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
          {/* Departments Column */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-muted flex items-center gap-1.5">
              🏢 Departments ({departments.length})
            </h3>

            <div className="mb-4 max-h-60 overflow-y-auto pr-1 flex flex-col gap-2">
              {departments.length === 0 ? (
                <div className="text-xs text-muted py-4 text-center">No departments created.</div>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between rounded-lg border border-[var(--surface-sunken)] bg-[var(--surface-sunken)] p-2.5 hover:bg-[var(--surface-sunken)] transition-colors duration-150">
                    <div>
                      <div className="text-sm font-semibold">{dept.name}</div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wider">{dept.code}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="border-t border-[var(--surface-sunken)] pt-3 flex flex-col gap-2" onSubmit={handleAddDepartment}>
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Add Department</div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass()} name="name" placeholder="Name (e.g. Sales)" required />
                <input className={inputClass()} name="code" placeholder="Code (e.g. SAL)" required />
              </div>
              <button className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                <Plus className="h-3.5 w-3.5" /> Add Department
              </button>
            </form>
          </div>

          {/* Designations Column */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-muted flex items-center gap-1.5">
              💼 Designations ({designations.length})
            </h3>

            <div className="mb-4 max-h-60 overflow-y-auto pr-1 flex flex-col gap-2">
              {designations.length === 0 ? (
                <div className="text-xs text-muted py-4 text-center">No designations created.</div>
              ) : (
                designations.map((desig) => (
                  <div key={desig.id} className="flex items-center justify-between rounded-lg border border-[var(--surface-sunken)] bg-[var(--surface-sunken)] p-2.5 hover:bg-[var(--surface-sunken)] transition-colors duration-150">
                    <div>
                      <div className="text-sm font-semibold">{desig.title}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {desig.department?.name && (
                          <span className="rounded bg-[#e0f2fe] px-1.5 py-0.5 text-[10px] font-medium text-[#0369a1]">{desig.department.name}</span>
                        )}
                        {desig.grade && (
                          <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#374151]">{desig.grade}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="border-t border-[var(--surface-sunken)] pt-3 flex flex-col gap-2" onSubmit={handleAddDesignation}>
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Add Designation</div>
              <input className={inputClass()} name="title" placeholder="Title (e.g. Sales Executive)" required />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass()} name="grade" placeholder="Grade (e.g. L2)" />
                <select className={inputClass()} name="departmentId">
                  <option value="">No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                <Plus className="h-3.5 w-3.5" /> Add Designation
              </button>
            </form>
          </div>

          {/* Locations Column */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase text-muted flex items-center gap-1.5">
              📍 Locations ({locations.length})
            </h3>

            <div className="mb-4 max-h-60 overflow-y-auto pr-1 flex flex-col gap-2">
              {locations.length === 0 ? (
                <div className="text-xs text-muted py-4 text-center">No locations created.</div>
              ) : (
                locations.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between rounded-lg border border-[var(--surface-sunken)] bg-[var(--surface-sunken)] p-2.5 hover:bg-[var(--surface-sunken)] transition-colors duration-150">
                    <div>
                      <div className="text-sm font-semibold">{loc.name}</div>
                      <div className="text-[10px] text-muted">{loc.city}, {loc.state}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="border-t border-[var(--surface-sunken)] pt-3 flex flex-col gap-2" onSubmit={handleAddLocation}>
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Add Location</div>
              <input className={inputClass()} name="name" placeholder="Name (e.g. Mumbai HQ)" required />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass()} name="city" placeholder="City" required />
                <input className={inputClass()} name="state" placeholder="State" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass()} name="country" defaultValue="India" placeholder="Country" required />
                <input className={inputClass()} name="address" placeholder="Address (optional)" />
              </div>
              <button className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                <Plus className="h-3.5 w-3.5" /> Add Location
              </button>
            </form>
          </div>
        </div>
      </Card>

      {/* ── Plan Access (owner only) ────────────────────────────────────── */}
      {isOwner && (
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Plan Access Settings</h2>
            <p className="mt-1 text-sm text-muted">Module permissions are controlled by the selected company plan.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={planTone(activePlan)}>{activePlan} Active</StatusPill>
            <a className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" href="/saas">Manage Plans</a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          {planCards.map((card) => {
            const active = card.plan === activePlan;
            return (
              <div className={`rounded-lg border p-4 ${active ? "border-[#ff8a2a] bg-[#fff3e8]" : "border-[var(--border-default)] bg-white"}`} key={card.plan}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{card.title}</div>
                    <div className="text-xs font-bold uppercase text-muted">{card.plan}</div>
                  </div>
                  <StatusPill tone={active ? "green" : planTone(card.plan)}>{active ? "Current" : card.price}</StatusPill>
                </div>
                <div className="mt-3 text-sm font-semibold text-brand">{card.access}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.includes.map((item) => (
                    <span className="rounded-full bg-[#f3f7fb] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]" key={item}>{item}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* ── Module Controls (owner only) ────────────────────────────────── */}
      {isOwner && (
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Module Controls</h2>
        <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {modules.map((item) => (
            (() => {
              const requiredPlan = requiredPlanForModule(item.module);
              const allowed = hasPlanAccess(requiredPlan, activePlan);
              return (
                <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${allowed ? "border-[var(--border-default)]" : "border-[#f3c4c0] bg-[#fff8f7]"}`} key={item.module}>
                  <div>
                    <div className="font-semibold">{moduleLabel(item.module)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill tone={allowed && item.enabled ? "green" : "red"}>{allowed ? (item.enabled ? "Enabled" : "Disabled") : "Locked"}</StatusPill>
                      <StatusPill tone={planTone(requiredPlan)}>{requiredPlan} Plan</StatusPill>
                    </div>
                  </div>
                  {allowed ? (
                    <button className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-semibold" type="button" onClick={() => toggleModule(item.module, !item.enabled)}>
                      {item.enabled ? "Disable" : "Enable"}
                    </button>
                  ) : (
                    <a className="rounded-lg bg-[var(--danger-fg)] px-3 py-2 text-sm font-semibold text-white" href="/saas">
                      Upgrade
                    </a>
                  )}
                </div>
              );
            })()
          ))}
        </div>
      </Card>
      )}

      {/* ── Audit Logs ──────────────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Settings &amp; Activity Logs</h2>
            <p className="mt-1 text-sm text-muted">Client administrators can review configuration and workflow changes.</p>
          </div>
          <button className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-semibold" onClick={load} type="button">Refresh Logs</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[var(--border-default)] p-3">Time</th>
                <th className="border-b border-[var(--border-default)] p-3">Module</th>
                <th className="border-b border-[var(--border-default)] p-3">Action</th>
                <th className="border-b border-[var(--border-default)] p-3">Record</th>
                <th className="border-b border-[var(--border-default)] p-3">Actor</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 12).map((log) => (
                <tr key={log.id}>
                  <td className="border-b border-[var(--border-default)] p-3">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  <td className="border-b border-[var(--border-default)] p-3 font-semibold">{moduleLabel(log.module)}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.action}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.entityType}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.actor?.employee ? `${log.actor.employee.firstName} ${log.actor.employee.lastName}` : log.actor?.email || "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Utility Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {[
          { title: "Data Import", note: "Use Employee Directory bulk upload for employee CSV import", icon: FileUp, action: "Open Employees", href: "/employees" },
          { title: "Data Export", note: "Download company settings and client rule JSON", icon: FileDown, action: "Download", onClick: downloadSettings },
          ...(isOwner ? [{ title: "License", note: "Subscription and module entitlement control", icon: KeyRound, action: "Manage Plans", href: "/saas" }] : []),
        ].map(({ title, note, icon: Icon, action, href, onClick }) => (
          <div className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm" key={title}>
            <Icon className="h-5 w-5 text-brand" />
            <div className="mt-3 font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted">{note}</div>
            <div className="mt-3">
              {href ? (
                <a className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--text-primary)]" href={href}>
                  {action}
                </a>
              ) : (
                <button className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--text-primary)]" onClick={onClick} type="button">
                  {action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
