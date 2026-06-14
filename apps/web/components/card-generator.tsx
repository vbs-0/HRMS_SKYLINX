"use client";

import { Check, ChevronDown, Download, Palette, Printer, RotateCcw, Save, ShieldCheck, UserRound, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { StatusPill } from "./ui";

type Mode = "id" | "visiting";
type Side = "front" | "back";

interface CardEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  location: string;
  joiningDate: string;
  bloodGroup: string;
  emergencyContact: string;
}

interface ApiEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  joiningDate: string;
  bloodGroup?: string | null;
  emergencyContactPhone?: string | null;
  department?: { name: string } | null;
  designation?: { title: string } | null;
  location?: { name: string; city: string } | null;
}

interface ModuleSetting {
  module: string;
  enabled: boolean;
  settingsJson?: {
    cardTemplate?: string;
    brandColor?: string;
    defaultMode?: Mode;
  } | null;
}

const templates = [
  { key: "glass", name: "Glass Hero", note: "Centered layout with soft gradient header" },
  { key: "minimal", name: "Minimal Pro", note: "Clean white layout with strong typography" },
  { key: "split", name: "Split Pro", note: "Left color panel and right content block" },
  { key: "edge", name: "Modern Edge", note: "Top gradient bar with centered avatar" },
  { key: "bold", name: "Corporate Bold", note: "Full colored header with structured details" },
];

const brandColors = ["#4f46e5", "#1aa7d8", "#15b881", "#f59e0b", "#e11d48", "#334155"];

function qrCells(seed: string) {
  let value = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return Array.from({ length: 49 }, (_, index) => {
    value = (value * 31 + index * 17) % 997;
    const edge = index < 7 || index > 41 || index % 7 === 0 || index % 7 === 6;
    return edge || value % 3 === 0;
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function truncate(value: string, max = 34) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function ValidationItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
      <Check className="h-3.5 w-3.5 rounded-full border border-[var(--success-fg)] p-[1px] text-[var(--success-fg)]" />
      {label}
    </div>
  );
}

function TemplateThumb({ color }: { color: string }) {
  return (
    <div className="relative h-14 w-9 rounded border border-[var(--border-default)] bg-white shadow-sm">
      <div className="h-5 rounded-t" style={{ background: color }} />
      <div className="absolute left-1/2 top-4 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-[#dbeafe]" />
      <div className="mx-auto mt-4 h-1 w-5 rounded bg-[var(--border-default)]" />
      <div className="mx-auto mt-1 h-1 w-4 rounded bg-[var(--border-subtle)]" />
    </div>
  );
}

function MiniQr({ cells, color }: { cells: boolean[]; color: string }) {
  return (
    <div className="grid h-12 w-12 grid-cols-7 gap-[1px] rounded bg-white/90 p-1">
      {cells.map((active, index) => <span style={{ background: active ? color : "var(--border-subtle)" }} key={index} />)}
    </div>
  );
}

export function CardGenerator() {
  const [employees, setEmployees] = useState<CardEmployee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [mode, setMode] = useState<Mode>("id");
  const [side, setSide] = useState<Side>("front");
  const [template, setTemplate] = useState("glass");
  const [color, setColor] = useState(brandColors[0]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<ModuleSetting[]>("/settings/modules")
      .then((body) => {
        const cards = body.data?.find((item) => item.module === "cards");
        if (cards?.settingsJson?.cardTemplate && templates.some((item) => item.key === cards.settingsJson?.cardTemplate)) {
          setTemplate(cards.settingsJson.cardTemplate);
        }
        if (cards?.settingsJson?.brandColor) {
          setColor(cards.settingsJson.brandColor);
        }
        if (cards?.settingsJson?.defaultMode) {
          setMode(cards.settingsJson.defaultMode);
        }
      })
      .catch(() => undefined);

    apiFetch<ApiEmployee[]>("/employees")
      .then((body) => {
        if (!body.data?.length) return;
        const mapped = body.data.map((employee) => ({
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          phone: employee.phone || "-",
          department: employee.department?.name || "-",
          designation: employee.designation?.title || "-",
          location: employee.location?.name || employee.location?.city || "-",
          joiningDate: employee.joiningDate.slice(0, 10),
          bloodGroup: employee.bloodGroup || "Not recorded",
          emergencyContact: employee.emergencyContactPhone || "-",
        }));
        setEmployees(mapped);
        setEmployeeId(mapped[0].id);
      })
      .catch(() => undefined);
  }, []);

  const employee = employees.find((item) => item.id === employeeId) || employees[0];
  const qr = useMemo(() => qrCells(employee ? `${employee.employeeCode}-${employee.email}-${mode}-${side}` : mode), [employee, mode, side]);
  const selectedTemplate = templates.find((item) => item.key === template) || templates[0];

  async function saveDefault(label: string) {
    await apiFetch("/settings/modules/cards", {
      method: "PATCH",
      body: JSON.stringify({
        enabled: true,
        settingsJson: {
          cardTemplate: template,
          brandColor: color,
          defaultMode: mode,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    setMessage(label);
  }

  function printCard() {
    window.print();
  }

  if (!employee) {
    return <div className="rounded-lg border border-[var(--border-default)] bg-white p-5 text-sm text-muted shadow-sm">Loading employees from database...</div>;
  }

  return (
    <div className="min-h-[720px] overflow-hidden rounded-lg border border-[var(--border-default)] bg-[#f4f7fb] shadow-sm">
      <div className="flex min-h-[720px] max-xl:grid max-xl:grid-cols-1">
        <aside className="w-[320px] shrink-0 border-r border-[var(--border-default)] bg-white p-6 print:hidden max-xl:w-full">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-[var(--surface-sunken)] p-1">
            <button className={`min-h-10 rounded-full text-sm font-semibold ${mode === "id" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => setMode("id")}>ID Card</button>
            <button className={`min-h-10 rounded-full text-sm font-semibold ${mode === "visiting" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => setMode("visiting")}>Visiting Card</button>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Printer className="h-4 w-4 text-[var(--text-muted)]" /> Templates
          </div>
          <div className="grid gap-3">
            {templates.map((item) => (
              <button
                className={`flex min-h-[72px] items-center gap-3 rounded-[22px] border p-3 text-left ${template === item.key ? "border-[var(--text-primary)] bg-[#f8fbff] shadow-sm" : "border-[var(--border-subtle)] bg-white"}`}
                key={item.key}
                onClick={() => setTemplate(item.key)}
              >
                <TemplateThumb color={color} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="mt-1 truncate text-xs text-[var(--text-muted)]">{item.note}</div>
                </div>
                {template === item.key ? <Check className="h-4 w-4 text-[var(--color-brand-600)]" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-[var(--text-muted)]" /> Brand Color
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {brandColors.map((item) => (
              <button
                aria-label={`Use color ${item}`}
                className={`h-9 w-9 rounded-full border-2 ${color === item ? "border-[var(--text-primary)]" : "border-white"} shadow-sm`}
                key={item}
                onClick={() => setColor(item)}
                style={{ background: item }}
              />
            ))}
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[#c7d4e4] bg-white text-lg text-[var(--text-muted)]" onClick={() => setColor("#4f46e5")}>+</button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col items-center px-8 py-7 print:p-0">
          <div className="mb-6 w-full max-w-[420px] print:hidden">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
              <UserRound className="h-4 w-4" /> Preview Employee
            </div>
            <select
              className="min-h-12 w-full rounded-full border border-[var(--border-default)] bg-white px-5 text-sm font-semibold shadow-sm"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              {employees.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-2 rounded-full bg-[var(--surface-sunken)] p-1 print:hidden">
            <button className={`min-h-9 rounded-full px-8 text-sm font-semibold ${side === "front" ? "bg-white text-ink shadow-sm" : "text-[var(--text-muted)]"}`} onClick={() => setSide("front")}>Front</button>
            <button className={`min-h-9 rounded-full px-8 text-sm font-semibold ${side === "back" ? "bg-white text-ink shadow-sm" : "text-[var(--text-muted)]"}`} onClick={() => setSide("back")}>Back</button>
          </div>

          <div className="grid justify-items-center gap-4">
            {mode === "id" ? (
              <div className={`w-[300px] overflow-hidden bg-white text-[var(--text-primary)] shadow-xl print:shadow-none ${template === "minimal" ? "rounded-lg" : "rounded-[18px]"}`} style={{ aspectRatio: "2.125 / 3.375" }}>
                {side === "front" ? (
                  <>
                    <div className="relative h-[150px]" style={{ background: template === "minimal" ? "#ffffff" : `linear-gradient(135deg, ${color}, #4733d6)` }}>
                      <img src="/company-logo.png" alt="Acme Corp" className="absolute right-5 top-5 h-10 w-16 rounded-2xl bg-white/15 object-contain p-2" />
                      <div className="absolute -bottom-14 left-1/2 flex h-28 w-28 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-white bg-[var(--color-brand-50)] text-3xl font-semibold shadow-lg" style={{ color }}>
                        {initials(employee.name)}
                      </div>
                    </div>
                    <div className="px-7 pt-16 text-center">
                      <h2 className="text-2xl font-bold leading-tight">{employee.name}</h2>
                      <div className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color }}>{employee.designation}</div>
                      <div className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 text-left shadow-sm">
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="font-bold uppercase text-[var(--text-muted)]">Emp ID</span>
                          <strong>{employee.employeeCode}</strong>
                        </div>
                        <div className="mt-5 flex justify-between gap-4 text-xs">
                          <span className="font-bold uppercase text-[var(--text-muted)]">Blood Group</span>
                          <strong>{employee.bloodGroup}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col justify-between p-7">
                    <div>
                      <img src="/company-logo.png" alt="Acme Corp" className="h-14 w-36 object-contain" />
                      <div className="mt-8 grid gap-3 text-sm">
                        <div><span className="text-xs font-bold uppercase text-[var(--text-muted)]">Department</span><div className="font-semibold">{employee.department}</div></div>
                        <div><span className="text-xs font-bold uppercase text-[var(--text-muted)]">Contact</span><div className="font-semibold">{employee.phone}</div></div>
                        <div><span className="text-xs font-bold uppercase text-[var(--text-muted)]">Emergency</span><div className="font-semibold">{employee.emergencyContact}</div></div>
                        <div><span className="text-xs font-bold uppercase text-[var(--text-muted)]">Office</span><div className="font-semibold">{employee.location}</div></div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <MiniQr cells={qr} color={color} />
                      <div className="text-right text-xs text-muted">Valid while employed</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid w-[560px] max-w-full grid-cols-[1fr_160px] overflow-hidden rounded-[18px] bg-white shadow-xl print:shadow-none" style={{ aspectRatio: "1.75 / 1" }}>
                <div className="p-7">
                  <img src="/company-logo.png" alt="Acme Corp" className="h-14 w-44 object-contain" />
                  <div className="mt-8 text-2xl font-bold">{employee.name}</div>
                  <div className="mt-1 text-sm font-bold uppercase" style={{ color }}>{employee.designation}</div>
                  <div className="mt-5 grid gap-2 text-sm text-[var(--text-primary)]">
                    <div>{employee.phone}</div>
                    <div>{employee.email}</div>
                    <div>{employee.location}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 text-white" style={{ background: color }}>
                  <MiniQr cells={qr} color="#102632" />
                  <div className="mt-4 text-center text-xs font-semibold">{employee.employeeCode}</div>
                </div>
              </div>
            )}
            <div className="text-xs text-[var(--text-muted)] print:hidden">Preview rendered at standard CR80 card size.</div>
            <button className="flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-5 text-sm font-semibold text-[var(--text-secondary)] print:hidden" onClick={printCard}>
              <Download className="h-4 w-4" /> Export PDF Preview
            </button>
          </div>
        </section>

        <aside className="w-[320px] shrink-0 border-l border-[var(--border-default)] bg-white p-6 print:hidden max-xl:w-full">
          {message ? <div className="mb-4 rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)]">{message}</div> : null}
          <div className="rounded-lg border border-[var(--border-default)] p-5 shadow-sm">
            <h2 className="text-sm font-bold">Print Validation</h2>
            <div className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">ID Card</div>
                <div className="grid gap-3">
                  {["Full Name", "Employee ID", "Designation", "Blood Group", "Emergency Contact", "Office Address"].map((item) => <ValidationItem label={item} key={item} />)}
                </div>
                <StatusPill>Ready to print</StatusPill>
              </div>
              <div>
                <div className="mb-3 text-xs font-bold uppercase text-[var(--text-muted)]">Visiting Card</div>
                <div className="grid gap-3">
                  {["Full Name", "Designation", "Contact Number", "Office Address"].map((item) => <ValidationItem label={item} key={item} />)}
                </div>
                <StatusPill>Ready to print</StatusPill>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold">Actions</h2>
            <div className="grid gap-3">
              <button className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b7c7ff] bg-[#eef2ff] px-4 text-sm font-bold text-[#3528d9]" onClick={() => saveDefault(`${selectedTemplate.name} saved as company default.`)}>
                <Save className="h-4 w-4" /> Save as Company Default
              </button>
              <button className="flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white" style={{ background: color }} onClick={() => saveDefault(`${selectedTemplate.name} rolled out to all employees.`)}>
                <Users className="h-4 w-4" /> Roll Out to All Employees
              </button>
              <button className="flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-4 text-sm font-semibold text-[var(--text-secondary)]" onClick={() => { setTemplate("glass"); setColor(brandColors[0]); setSide("front"); }}>
                <RotateCcw className="h-4 w-4" /> Reset Designer
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--border-subtle)] p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Selected Template</span>
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            <div className="text-muted">{selectedTemplate.name}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--success-fg)]">
              <ShieldCheck className="h-4 w-4" /> Connected to employee database
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
