"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Fingerprint, Loader2, Save, ShieldCheck, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetch } from "../lib/client-api";
import { Card, DataState, StatusPill } from "./ui";
import { SetupBrandingForm } from "./setup-branding-form";

interface CompanySettings {
  name?: string;
  legalName?: string;
  logoUrl?: string;
  address?: string;
  taxId?: string;
  workWeek?: string;
  timezone?: string;
}

interface ModuleSetting {
  module: string;
  enabled: boolean;
}

interface ClientRules {
  branding: Record<string, unknown>;
  attendance: Record<string, unknown>;
  leave: Record<string, unknown>;
  payroll: Record<string, unknown>;
  approvals: Record<string, unknown>;
  permissions: Record<string, unknown>;
}

type SetupTab = "company" | "workWeek" | "roles" | "attendance" | "leave";

const defaultRules: ClientRules = {
  branding: {},
  attendance: {
    workWeek: "Monday to Saturday",
    shiftStart: "09:30",
    shiftEnd: "18:30",
    graceMinutes: 10,
    weeklyOff: "Sunday",
    holidayPolicy: "Mandatory and optional holidays",
    geoAttendance: true,
    biometricRequired: false,
    overtimeEnabled: true,
    lateMarkRule: "After grace minutes",
  },
  leave: {
    approvalFlow: "Manager then HR",
    sandwichLeave: false,
    carryForward: false,
    compOffAllowed: true,
    leaveYear: "Calendar Year",
    earnedLeave: 12,
    sickLeave: 6,
    casualLeave: 6,
  },
  payroll: {},
  approvals: {},
  permissions: {
    superAdmin: ["all"],
    hrAdmin: ["employees", "documents", "attendance", "leave", "payroll", "reports", "settings"],
    manager: ["dashboard", "employees", "attendance", "leave", "approvals", "reports"],
    employee: ["dashboard", "attendance", "leave", "documents", "cards"],
  },
};

const tabs: Array<{ key: SetupTab; label: string; icon: LucideIcon }> = [
  { key: "company", label: "Company", icon: CheckCircle2 },
  { key: "workWeek", label: "Work Week", icon: CalendarDays },
  { key: "roles", label: "Roles & Permissions", icon: UserCog },
  { key: "attendance", label: "Attendance Settings", icon: Fingerprint },
  { key: "leave", label: "Leave Settings", icon: ShieldCheck },
];

const roleKeys = [
  { key: "superAdmin", label: "Super Admin" },
  { key: "hrAdmin", label: "HR/Admin" },
  { key: "manager", label: "Manager" },
  { key: "employee", label: "Employee" },
];

function valueText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function valueNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : Number(value || fallback);
}

function valueBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function valueList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function moduleLabel(module: string) {
  return module.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SetupWizardConsole() {
  const [activeTab, setActiveTab] = useState<SetupTab>("company");
  const [company, setCompany] = useState<CompanySettings>({});
  const [rules, setRules] = useState<ClientRules>(defaultRules);
  const [modules, setModules] = useState<ModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [companyResponse, rulesResponse, modulesResponse] = await Promise.all([
          apiFetch<CompanySettings>("/settings/company"),
          apiFetch<ClientRules>("/settings/rules"),
          apiFetch<ModuleSetting[]>("/settings/modules"),
        ]);
        if (!mounted) return;
        setCompany(companyResponse.data || {});
        setRules({
          ...defaultRules,
          ...(rulesResponse.data || {}),
          attendance: { ...defaultRules.attendance, ...(rulesResponse.data?.attendance || {}) },
          leave: { ...defaultRules.leave, ...(rulesResponse.data?.leave || {}) },
          permissions: { ...defaultRules.permissions, ...(rulesResponse.data?.permissions || {}) },
        });
        setModules((modulesResponse.data || []).filter((item) => !["backup", "mobile", "testing", "ai"].includes(item.module)));
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "Unable to load setup settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const permissionModules = useMemo(() => {
    const preferred = ["dashboard", "employees", "documents", "attendance", "leave", "payroll", "reports", "settings", "approvals", "expenses", "cards"];
    const moduleKeys = modules.map((item) => item.module);
    return preferred.filter((item) => moduleKeys.includes(item) || item === "dashboard");
  }, [modules]);

  async function saveWorkWeek(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("Work week saved.", async (form) => {
      const workWeek = String(form.get("workWeek"));
      const timezone = String(form.get("timezone"));
      const attendance = {
        ...rules.attendance,
        workWeek,
        weeklyOff: String(form.get("weeklyOff")),
        holidayPolicy: String(form.get("holidayPolicy")),
        shiftStart: String(form.get("shiftStart")),
        shiftEnd: String(form.get("shiftEnd")),
        graceMinutes: Number(form.get("graceMinutes")),
      };
      await apiFetch("/settings/company", {
        method: "PATCH",
        body: JSON.stringify({
          name: company.name || "",
          legalName: company.legalName || "",
          logoUrl: company.logoUrl || "",
          address: company.address || "",
          taxId: company.taxId || "",
          workWeek,
          timezone,
        }),
      });
      await apiFetch("/settings/rules", { method: "PATCH", body: JSON.stringify({ attendance }) });
      setCompany((current) => ({ ...current, workWeek, timezone }));
      setRules((current) => ({ ...current, attendance }));
    }, event.currentTarget);
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("Attendance settings saved.", async (form) => {
      const attendance = {
        ...rules.attendance,
        shiftStart: String(form.get("shiftStart")),
        shiftEnd: String(form.get("shiftEnd")),
        graceMinutes: Number(form.get("graceMinutes")),
        lateMarkRule: String(form.get("lateMarkRule")),
        geoAttendance: form.get("geoAttendance") === "on",
        biometricRequired: form.get("biometricRequired") === "on",
        selfieRequired: form.get("selfieRequired") === "on",
        deviceRequired: form.get("deviceRequired") === "on",
        overtimeEnabled: form.get("overtimeEnabled") === "on",
      };
      await apiFetch("/settings/rules", { method: "PATCH", body: JSON.stringify({ attendance }) });
      setRules((current) => ({ ...current, attendance }));
    }, event.currentTarget);
  }

  async function saveLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("Leave settings saved.", async (form) => {
      const leave = {
        ...rules.leave,
        approvalFlow: String(form.get("approvalFlow")),
        leaveYear: String(form.get("leaveYear")),
        earnedLeave: Number(form.get("earnedLeave")),
        sickLeave: Number(form.get("sickLeave")),
        casualLeave: Number(form.get("casualLeave")),
        sandwichLeave: form.get("sandwichLeave") === "on",
        carryForward: form.get("carryForward") === "on",
        compOffAllowed: form.get("compOffAllowed") === "on",
      };
      await apiFetch("/settings/rules", { method: "PATCH", body: JSON.stringify({ leave }) });
      setRules((current) => ({ ...current, leave }));
    }, event.currentTarget);
  }

  async function savePermissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSection("Role permissions saved.", async (form) => {
      const permissions = Object.fromEntries(
        roleKeys.map((role) => [role.key, form.getAll(role.key).map(String)]),
      );
      await apiFetch("/settings/rules", { method: "PATCH", body: JSON.stringify({ permissions }) });
      setRules((current) => ({ ...current, permissions }));
    }, event.currentTarget);
  }

  async function saveSection(successMessage: string, action: (form: FormData) => Promise<void>, formElement: HTMLFormElement) {
    setMessage("");
    setError("");
    setSaving(activeTab);
    try {
      await action(new FormData(formElement));
      setMessage(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Setup update failed.");
    } finally {
      setSaving("");
    }
  }

  function inputClass() {
    return "min-h-11 rounded-lg border border-[var(--border-default)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-brand";
  }

  function checkbox(name: string, label: string, checked: boolean) {
    return (
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
        <input defaultChecked={checked} name={name} type="checkbox" />
        {label}
      </label>
    );
  }

  if (loading) return <DataState message="Loading setup wizard from database..." />;

  return (
    <section className="grid gap-5" id="setup-wizard-console">
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold ${activeTab === key ? "bg-brand text-white" : "border border-[var(--border-default)] bg-white text-[var(--text-secondary)]"}`}
              key={key}
              onClick={() => {
                setActiveTab(key);
                setMessage("");
                setError("");
              }}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {message ? <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm font-semibold text-[var(--success-fg)]">{message}</div> : null}
      {error ? <DataState message={error} tone="error" /> : null}

      {activeTab === "company" ? <SetupBrandingForm /> : null}

      {activeTab === "workWeek" ? (
        <Card>
          <SetupTitle title="Work Week Setup" note="Configure client work days, weekly off, timezone and default shift policy." icon={CalendarDays} />
          <form className="mt-5 grid gap-4" onSubmit={saveWorkWeek}>
            <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
              <input className={inputClass()} name="workWeek" defaultValue={company.workWeek || valueText(rules.attendance.workWeek, "Monday to Saturday")} placeholder="Work Week" />
              <input className={inputClass()} name="weeklyOff" defaultValue={valueText(rules.attendance.weeklyOff, "Sunday")} placeholder="Weekly Off" />
              <input className={inputClass()} name="timezone" defaultValue={company.timezone || "Asia/Kolkata"} placeholder="Timezone" />
              <input className={inputClass()} name="shiftStart" defaultValue={valueText(rules.attendance.shiftStart, "09:30")} type="time" />
              <input className={inputClass()} name="shiftEnd" defaultValue={valueText(rules.attendance.shiftEnd, "18:30")} type="time" />
              <input className={inputClass()} min="0" name="graceMinutes" defaultValue={valueNumber(rules.attendance.graceMinutes, 10)} type="number" />
            </div>
            <textarea className="min-h-24 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-brand" name="holidayPolicy" defaultValue={valueText(rules.attendance.holidayPolicy, "Mandatory and optional holidays")} placeholder="Holiday policy" />
            <SaveButton saving={saving === "workWeek"} label="Save Work Week" />
          </form>
        </Card>
      ) : null}

      {activeTab === "roles" ? (
        <Card>
          <SetupTitle title="Roles & Permissions Setup" note="Select what each client role can access. The selection is saved into client rules." icon={UserCog} />
          <form className="mt-5 grid gap-4" onSubmit={savePermissions}>
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Module</th>
                    {roleKeys.map((role) => <th className="border-b border-[var(--border-default)] p-3" key={role.key}>{role.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {permissionModules.map((module) => (
                    <tr key={module}>
                      <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold">{moduleLabel(module)}</td>
                      {roleKeys.map((role) => {
                        const values = valueList(rules.permissions[role.key]);
                        const checked = values.includes("all") || values.includes(module);
                        return (
                          <td className="border-b border-[var(--surface-sunken)] p-3" key={role.key}>
                            <input defaultChecked={checked} name={role.key} type="checkbox" value={module} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SaveButton saving={saving === "roles"} label="Save Role Permissions" />
          </form>
        </Card>
      ) : null}

      {activeTab === "attendance" ? (
        <Card>
          <SetupTitle title="Attendance Settings Setup" note="Configure late mark, geo attendance, biometric requirement and overtime." icon={Fingerprint} />
          <form className="mt-5 grid gap-4" onSubmit={saveAttendance}>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <input className={inputClass()} name="shiftStart" defaultValue={valueText(rules.attendance.shiftStart, "09:30")} type="time" />
              <input className={inputClass()} name="shiftEnd" defaultValue={valueText(rules.attendance.shiftEnd, "18:30")} type="time" />
              <input className={inputClass()} min="0" name="graceMinutes" defaultValue={valueNumber(rules.attendance.graceMinutes, 10)} type="number" />
              <input className={inputClass()} name="lateMarkRule" defaultValue={valueText(rules.attendance.lateMarkRule, "After grace minutes")} placeholder="Late Mark Rule" />
              {checkbox("geoAttendance", "Geo Attendance", valueBool(rules.attendance.geoAttendance, true))}
              {checkbox("biometricRequired", "Biometric Required", valueBool(rules.attendance.biometricRequired))}
              {checkbox("selfieRequired", "Selfie Required", valueBool(rules.attendance.selfieRequired))}
              {checkbox("deviceRequired", "Clock-in Device Required", valueBool(rules.attendance.deviceRequired))}
              {checkbox("overtimeEnabled", "Overtime Enabled", valueBool(rules.attendance.overtimeEnabled, true))}
            </div>
            <SaveButton saving={saving === "attendance"} label="Save Attendance Settings" />
          </form>
        </Card>
      ) : null}

      {activeTab === "leave" ? (
        <Card>
          <SetupTitle title="Leave Settings Setup" note="Configure leave types, yearly policy, carry forward, sandwich leave and comp-off." icon={ShieldCheck} />
          <form className="mt-5 grid gap-4" onSubmit={saveLeave}>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              <input className={inputClass()} name="approvalFlow" defaultValue={valueText(rules.leave.approvalFlow, "Manager then HR")} placeholder="Approval Flow" />
              <input className={inputClass()} name="leaveYear" defaultValue={valueText(rules.leave.leaveYear, "Calendar Year")} placeholder="Leave Year" />
              <input className={inputClass()} min="0" name="earnedLeave" defaultValue={valueNumber(rules.leave.earnedLeave, 12)} type="number" placeholder="Earned Leave" />
              <input className={inputClass()} min="0" name="sickLeave" defaultValue={valueNumber(rules.leave.sickLeave, 6)} type="number" placeholder="Sick Leave" />
              <input className={inputClass()} min="0" name="casualLeave" defaultValue={valueNumber(rules.leave.casualLeave, 6)} type="number" placeholder="Casual Leave" />
              {checkbox("sandwichLeave", "Sandwich Leave", valueBool(rules.leave.sandwichLeave))}
              {checkbox("carryForward", "Carry Forward", valueBool(rules.leave.carryForward))}
              {checkbox("compOffAllowed", "Comp-Off Allowed", valueBool(rules.leave.compOffAllowed, true))}
            </div>
            <SaveButton saving={saving === "leave"} label="Save Leave Settings" />
          </form>
        </Card>
      ) : null}
    </section>
  );
}

function SetupTitle({ title, note, icon: Icon }: { title: string; note: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Setup Wizard</div>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-muted">{note}</p>
      </div>
      <StatusPill tone="green">
        <span className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          Functioning
        </span>
      </StatusPill>
    </div>
  );
}

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white disabled:opacity-60" disabled={saving} type="submit">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  );
}
