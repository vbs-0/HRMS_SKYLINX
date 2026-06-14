"use client";

import { Download, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackCompliance } from "../lib/fallback-data";
import { emptyCompliance } from "../lib/live-data";
import { Card, MetricCard, StatusPill } from "./ui";

type ComplianceData = typeof fallbackCompliance;
type ComplianceCheck = ComplianceData["checks"][number];
type ComplianceRow = ComplianceData["rows"][number];

function money(value?: number) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function toneFor(status: string) {
  return status === "READY" ? "green" : "yellow";
}

export function ComplianceConsole() {
  const [data, setData] = useState<ComplianceData>(emptyCompliance);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ComplianceData>("/compliance")
      .then((body) => {
        if (body.data) setData(body.data);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function exportCompliance(type: string) {
    try {
      const res = await apiFetch<any>(`/compliance/export/${type}`, { method: "POST" });
      setMessage(`${type.toUpperCase()} compliance export generated.`);
      
      if (res?.data?.payload) {
        const blob = new Blob([res.data.payload], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}_export_${Date.now()}.${type === "esi" ? "csv" : "txt"}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setMessage(`Failed to export ${type.toUpperCase()}`);
    }
  }

  const form16Ready = data.rows.filter((row: ComplianceRow) => row.form16Status === "READY").length;

  return (
    <div className="grid gap-5">
      {message ? <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)]">{message}</div> : null}
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Active Employees" value={String(data.activeEmployees)} note="Compliance population" />
        <MetricCard label="Salary Configured" value={String(data.configuredEmployees)} note="PF, ESI, PT, TDS mapped" />
        <MetricCard label="Payroll Runs" value={String(data.payrollRuns)} note="Available statutory source" />
        <MetricCard label="Form 16 Ready" value={String(form16Ready)} note="TDS-ready employees" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Compliance Center</h2>
            <p className="mt-1 text-sm text-muted">PF, ESI, Professional Tax, TDS and Form 16 readiness.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["pf", "esi", "pt", "tds", "form16"].map((type) => (
              <button
                className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 text-sm font-semibold hover:border-brand"
                key={type}
                onClick={() => exportCompliance(type)}
              >
                <Download className="h-4 w-4" /> {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {data.checks.map((check: ComplianceCheck) => (
            <div className="rounded-lg border border-[var(--border-default)] p-4" key={check.name}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Landmark className="h-5 w-5 text-brand" />
                <StatusPill tone={toneFor(check.status)}>{check.status}</StatusPill>
              </div>
              <div className="font-semibold">{check.name}</div>
              <div className="mt-2 text-sm text-muted">{money(check.amount)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Employee Compliance Register</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[var(--border-default)] p-3">Employee</th>
                <th className="border-b border-[var(--border-default)] p-3">Department</th>
                <th className="border-b border-[var(--border-default)] p-3">Annual CTC</th>
                <th className="border-b border-[var(--border-default)] p-3">PF</th>
                <th className="border-b border-[var(--border-default)] p-3">ESI</th>
                <th className="border-b border-[var(--border-default)] p-3">PT</th>
                <th className="border-b border-[var(--border-default)] p-3">TDS</th>
                <th className="border-b border-[var(--border-default)] p-3">Form 16</th>
                <th className="border-b border-[var(--border-default)] p-3">Effective</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: ComplianceRow) => (
                <tr key={row.employeeId}>
                  <td className="border-b border-[var(--border-default)] p-3 font-semibold">{row.employee}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{row.department}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{money(Number(row.annualCtc))}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{money(Number(row.pf))}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{money(Number(row.esi))}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{money(Number(row.professionalTax))}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{money(Number(row.tds))}</td>
                  <td className="border-b border-[var(--border-default)] p-3"><StatusPill tone={toneFor(row.form16Status)}>{row.form16Status}</StatusPill></td>
                  <td className="border-b border-[var(--border-default)] p-3">{String(row.effectiveFrom).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
