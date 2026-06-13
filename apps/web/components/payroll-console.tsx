"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/client-api";
import { useEmployeeOptions } from "../lib/options";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { getCurrentCompanyId, getAccessToken } from "../lib/session";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { Card } from "./ui";
import { ComplianceDash } from "./compliance-dash";
import {
  BadgeIndianRupee,
  Download,
  FileText,
  LockKeyhole,
  Play,
  Plus,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ApiPayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  processedAt?: string;
  lockedAt?: string;
}

interface ApiPayslipComponent {
  id: string;
  type: string;
  name: string;
  amount: number;
}

interface ApiPayslip {
  id: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    bankDetails?: {
      bankName: string;
      ifsc: string;
    };
  };
  components?: ApiPayslipComponent[];
}

interface ApiSalaryStructure {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  annualCtc: number;
  basic: number;
  hra: number;
  allowances: number;
  employerPf: number;
  employeePf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

export function PayrollConsole() {
  const [activeTab, setActiveTab] = useState("Payroll Run");
  const [runs, setRuns] = useState<ApiPayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [payslips, setPayslips] = useState<ApiPayslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<ApiSalaryStructure[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [componentConfigs, setComponentConfigs] = useState<any[]>([]);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [componentForm, setComponentForm] = useState({ id: "", name: "", category: "BASE", kind: "ALLOWANCE", taxable: true, annualLimit: "", individualOverride: false, proofRequired: false, esiApplicable: false, includedInCtc: true, enabled: true });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [bankExported, setBankExported] = useState<Record<string, boolean>>({});
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [skippedEmployees, setSkippedEmployees] = useState<any[]>([]);

  // Modals state
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [newRunMonth, setNewRunMonth] = useState("6");
  const [newRunYear, setNewRunYear] = useState(() => String(new Date().getFullYear()));

  const [selectedPayslip, setSelectedPayslip] = useState<ApiPayslip | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [rules, setRules] = useState<any>(null);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    employeeId: "",
    effectiveFrom: "2026-06-01",
    annualCtc: 600000,
    basic: 300000,
    hra: 120000,
    allowances: 108000,
    employerPf: 36000,
    employeePf: 36000,
    esi: 0,
    professionalTax: 2400,
    tds: 0,
  });

  // Template assign modal state
  const [assignTpl, setAssignTpl] = useState<any | null>(null);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignEffectiveDate, setAssignEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assignResult, setAssignResult] = useState<{ passed: { name: string }[]; failed: { name: string; reason: string }[] } | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);

  const employeeOptions = useEmployeeOptions();

  async function handleAssignTemplate() {
    if (!assignTpl || assignEmployeeIds.length === 0) return;
    setAssignBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ passed: { name: string }[]; failed: { name: string; reason: string }[] }>(
        `/payroll/templates/${assignTpl.id}/assign`,
        {
          method: "POST",
          body: JSON.stringify({ employeeIds: assignEmployeeIds, effectiveDate: assignEffectiveDate }),
        },
      );
      setAssignResult(res.data || { passed: [], failed: [] });
      loadSalaryStructures();
      requestDataRefresh("payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssignBusy(false);
    }
  }

  // Load basic data
  function loadRuns() {
    apiFetch<ApiPayrollRun[]>("/payroll/runs")
      .then((res) => {
        const data = res.data || [];
        setRuns(data);
        if (data.length && !selectedRunId) {
          setSelectedRunId(data[0].id);
        }
      })
      .catch((err) => setError("Failed to fetch payroll runs"));
  }

  function loadSalaryStructures() {
    apiFetch<ApiSalaryStructure[]>("/payroll/salary-structures")
      .then((res) => setSalaryStructures(res.data || []))
      .catch(() => undefined);
  }

  function loadTemplates() {
    apiFetch<any[]>("/payroll/templates")
      .then((res) => setTemplates(res.data || []))
      .catch(() => undefined);
  }

  function loadComponentConfigs() {
    apiFetch<any[]>("/payroll/component-configs")
      .then((res) => setComponentConfigs(res.data || []))
      .catch(() => undefined);
  }

  function loadPayslips(runId: string) {
    if (!runId) {
      setPayslips([]);
      return;
    }
    setLoading(true);
    apiFetch<{ items: ApiPayslip[] }>(`/payroll/runs/${runId}/payslips`)
      .then((res) => {
        setPayslips(res.data?.items || []);
      })
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRuns();
    loadSalaryStructures();
    loadTemplates();
    loadComponentConfigs();
    apiFetch("/settings/rules").then((res) => setRules(res.data || null)).catch(() => null);

    const cleanup = onDataRefresh("payroll", () => {
      loadRuns();
      loadSalaryStructures();
      if (selectedRunId) {
        loadPayslips(selectedRunId);
      }
    });
    return cleanup;
  }, [selectedRunId]);

  // Fetch payslips for selected run
  useEffect(() => {
    setMessage("");
    setError("");
    loadPayslips(selectedRunId);
  }, [selectedRunId]);

  const selectedRun = runs.find((r) => r.id === selectedRunId);

  // Auto calculate components helper (Annual values matching DB structure)
  function handleAutoCalculate() {
    const ctc = Number(salaryForm.annualCtc) || 0;
    const monthlyCtc = ctc / 12;

    const basicPct = Number(rules?.salaryStructure?.basicPct) || 0.50;
    const hraPct = Number(rules?.salaryStructure?.hraPct) || 0.40;
    const pfEmployeeRate = Number(rules?.payroll?.pfEmployeeRate) || 12.0;
    const esiEmployerRate = Number(rules?.payroll?.esiEmployerRate) || 3.25;

    const monthlyBasic = Math.round(monthlyCtc * basicPct);
    const monthlyHra = Math.round(monthlyBasic * hraPct);
    const monthlyPf = Math.round(monthlyBasic * (pfEmployeeRate / 100)); // EPF
    
    // ESI check (Applicable if gross is <= esiWageCeiling per month)
    const esiWageCeiling = Number(rules?.payroll?.esiWageCeiling) || 21000;
    const monthlyEsi = (monthlyBasic + monthlyHra) <= esiWageCeiling ? Math.round((monthlyBasic + monthlyHra) * (esiEmployerRate / 100)) : 0; 
    const monthlyPt = monthlyCtc > 15000 ? 200 : 0;
    
    // Quick slab estimate
    const defaultTdsPct = Number(rules?.salaryStructure?.defaultTdsPct) || 0.05;
    const monthlyTds = monthlyCtc > 100000 ? Math.round(monthlyCtc * 0.15) : monthlyCtc > 50000 ? Math.round(monthlyCtc * defaultTdsPct) : 0;

    const monthlyAllowances = Math.max(0, Math.round(monthlyCtc - monthlyBasic - monthlyHra - monthlyPf - monthlyEsi - monthlyPt - monthlyTds));

    setSalaryForm((prev) => ({
      ...prev,
      basic: monthlyBasic * 12,
      hra: monthlyHra * 12,
      allowances: monthlyAllowances * 12,
      employerPf: monthlyPf * 12,
      employeePf: monthlyPf * 12,
      esi: monthlyEsi * 12,
      professionalTax: monthlyPt * 12,
      tds: monthlyTds * 12,
    }));
  }

  // Action handlers
  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const month = parseInt(newRunMonth);
      const year = parseInt(newRunYear);
      const res = await apiFetch<ApiPayrollRun>("/payroll/runs", {
        method: "POST",
        body: JSON.stringify({ companyId: getCurrentCompanyId(), month, year }),
      });
      if (res.data?.id) {
        setSelectedRunId(res.data.id);
        setMessage(`Payroll run initialized for ${month}/${year}.`);
        loadRuns();
        setShowCreateRun(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run creation failed");
    }
  }

  async function handleCalculate() {
    if (!selectedRunId) return;
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/payroll/runs/${selectedRunId}/calculate`, { method: "POST" });
      setMessage("Payroll components calculated successfully!");
      loadRuns();
      loadPayslips(selectedRunId);
      requestDataRefresh("payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
      setLoading(false);
    }
  }

  async function handleLock() {
    if (!selectedRunId) return;
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/payroll/runs/${selectedRunId}/lock`, { method: "POST" });
      setMessage("Payroll run locked and finalized.");
      loadRuns();
      loadPayslips(selectedRunId);
      requestDataRefresh("payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Locking run failed");
      setLoading(false);
    }
  }

  async function handleBankExport() {
    if (!selectedRunId) return;
    setMessage("");
    setError("");
    try {
      const skippedRes = await apiFetch<any[]>(`/payroll/runs/${selectedRunId}/bank-file/skipped`);
      const skipped = skippedRes.data || [];
      if (skipped.length > 0) {
        setSkippedEmployees(skipped);
        setShowSkippedModal(true);
        return;
      }
      await downloadBankFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export check failed");
    }
  }

  async function downloadBankFile() {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/payroll/runs/${selectedRunId}/bank-file`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download bank file");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = response.headers.get("Content-Disposition");
      let filename = `bank-transfer-${selectedRun?.month}-${selectedRun?.year}.csv`;
      if (disposition && disposition.indexOf('filename="') !== -1) {
        filename = disposition.split('filename="')[1].split('"')[0];
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("CSV Bank Export downloaded successfully!");
      setBankExported((prev) => ({ ...prev, [selectedRunId]: true }));
      setShowSkippedModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/salary-structures", {
        method: "POST",
        body: JSON.stringify(salaryForm),
      });
      setMessage("Salary structure updated successfully!");
      loadSalaryStructures();
      setShowSalaryModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save salary structure");
    }
  }

  async function handleSaveComponent(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        ...componentForm,
        annualLimit: componentForm.annualLimit ? parseInt(componentForm.annualLimit as string) : null,
      };
      
      if (componentForm.id) {
        await apiFetch(`/payroll/component-configs/${componentForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/payroll/component-configs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setMessage("Component configured successfully!");
      loadComponentConfigs();
      setShowComponentModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save component configuration");
    }
  }

  async function handleToggleComponent(id: string, enabled: boolean) {
    try {
      await apiFetch(`/payroll/component-configs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !enabled }),
      });
      loadComponentConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle component");
    }
  }

  function handleOpenPayslip(payslip: ApiPayslip) {
    setLoading(true);
    // Fetch individual payslip with full components mapping
    apiFetch<{ items: ApiPayslip[] }>(`/payroll/runs/${selectedRunId}/payslips`)
      .then((res) => {
        const fullPayslip = res.data?.items.find((p) => p.id === payslip.id);
        if (fullPayslip) {
          setSelectedPayslip(fullPayslip);
          setShowPayslipModal(true);
        }
      })
      .finally(() => setLoading(false));
  }

  // Get active step index for wizard
  function getActiveStepIndex(status: string, runId: string) {
    if (!status) return 0;
    if (status === "DRAFT") return 1;
    if (status === "PENDING") return 2;
    if (status === "APPROVED") {
      return bankExported[runId] ? 4 : 3;
    }
    return 0;
  }

  // Quick statistics summary
  const totalGross = payslips.reduce((acc, p) => acc + Number(p.grossPay), 0);
  const totalDeductions = payslips.reduce((acc, p) => acc + Number(p.deductions), 0);
  const totalNet = payslips.reduce((acc, p) => acc + Number(p.netPay), 0);

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Payroll"
        title="Payroll Console"
        summary="Calculate salaries, generate reports, lock monthly payroll operations and manage employee salary CTC allocations."
        tabs={["Payroll Run", "Payslips", "Bank Export", "Statutory & Tax", "Salary Setup", "Templates", "Retention Bonus", "Salary Withholding", "Corrections", "Gratuity", "Tax Slabs", "IT Declaration & Proofs", "Form 16", "Components"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          {
            label: "Start Run",
            icon: Play,
            tone: "primary",
            onClick: () => setShowCreateRun(true),
          },
          {
            label: "Configure CTC",
            icon: BadgeIndianRupee,
            onClick: () => {
              setSalaryForm({
                employeeId: "",
                effectiveFrom: new Date().toISOString().slice(0, 10),
                annualCtc: 600000,
                basic: 300000,
                hra: 120000,
                allowances: 108000,
                employerPf: 36000,
                employeePf: 36000,
                esi: 0,
                professionalTax: 2400,
                tds: 0,
              });
              setShowSalaryModal(true);
            },
          },
        ]}
        stats={[
          { label: "Active Run", value: selectedRun ? `${selectedRun.month}/${selectedRun.year}` : "None", note: selectedRun?.status || "Ready" },
          { label: "Gross Payout", value: `₹${(totalGross/12000).toFixed(1)}L`, note: `${payslips.length} Employees` },
          { label: "Audit State", value: "Verified", note: "Compliance ready" },
        ]}
      />

      <ReferenceFlowStrip module="Payroll" />

      {/* Main Console Tab Contents */}
      {activeTab === "Payroll Run" && (
        <div className="grid gap-5">
          {/* Stepper Wizard */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8edf4] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">Payroll Workflow Tracker</h3>
                <p className="text-xs text-muted">Guided verification checklist for current payroll cycle.</p>
              </div>
              <button
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-dark"
                onClick={() => setShowCreateRun(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Initialize Run
              </button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
              {[
                { title: "Initialize Run", desc: "Select month and year", step: 0 },
                { title: "Compute Components", desc: "Calculate basic/allowances/taxes", step: 1 },
                { title: "Audit & Finalize", desc: "Verify payouts and lock cycle", step: 2 },
                { title: "Bank File Export", desc: "Generate secure CSV deposit lines", step: 3 },
              ].map((s, idx) => {
                const activeIdx = getActiveStepIndex(selectedRun?.status || "", selectedRunId);
                const isCompleted = activeIdx > s.step || (selectedRun?.status === "APPROVED" && s.step <= 2);
                const isActive = activeIdx === s.step;

                const handleClick = () => {
                  setError("");
                  setMessage("");
                  if (s.step === 0) {
                    setActiveTab("Payroll Run");
                    setShowCreateRun(true);
                  } else {
                    if (!selectedRunId) {
                      setError("Please initialize or select a payroll run first.");
                      return;
                    }
                    if (s.step === 1) {
                      setActiveTab("Payroll Run");
                      if (selectedRun?.status === "APPROVED") {
                        setMessage("This payroll run is already locked and finalized.");
                      } else {
                        setMessage("Ready to compute components. Use the 'Calculate Salary' button below to compute salaries.");
                      }
                    } else if (s.step === 2) {
                      setActiveTab("Payroll Run");
                      if (selectedRun?.status === "APPROVED") {
                        setMessage("This payroll run is already locked and finalized.");
                      } else if (selectedRun?.status !== "PENDING") {
                        setError("Please compute components (Step 2) first before locking.");
                      } else {
                        setMessage("Please review the calculated salaries below. When ready, click the 'Lock Payroll' button to finalize.");
                      }
                    } else if (s.step === 3) {
                      if (selectedRun?.status !== "APPROVED") {
                        setError("Payroll run must be locked and approved before exporting bank files.");
                      } else {
                        setActiveTab("Bank Export");
                        setMessage("Ready to export bank details. Click the 'Download Bank Excel CSV' button to export.");
                      }
                    }
                  }
                };

                return (
                  <div
                    key={s.title}
                    onClick={handleClick}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md hover:border-brand/40 ${
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50/30 text-emerald-800"
                        : isActive
                        ? "border-brand-300 bg-brand-50/20 shadow-sm"
                        : "border-[#e8edf4] bg-[#f8fafc] text-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isActive
                            ? "bg-brand text-white"
                            : "bg-[#e2e8f0] text-slate-600"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Step {idx + 1}</span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-800">{s.title}</div>
                    <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Action Selector */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="min-h-10 w-64 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none transition focus:border-brand"
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                >
                  <option value="">Select Payroll Month</option>
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.month}/{r.year} - {r.status}
                    </option>
                  ))}
                </select>

                {selectedRun && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedRun.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedRun.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    Status: {selectedRun.status}
                  </span>
                )}
              </div>

              {selectedRunId && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                      selectedRun?.status === "APPROVED"
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-brand text-white hover:bg-brand-dark cursor-pointer"
                    }`}
                    disabled={loading || selectedRun?.status === "APPROVED"}
                    onClick={handleCalculate}
                  >
                    <Play className="h-4 w-4" /> Calculate Salary
                  </button>
                  <button
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                      selectedRun?.status !== "PENDING"
                        ? "bg-slate-55 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                    }`}
                    disabled={loading || selectedRun?.status !== "PENDING"}
                    onClick={handleLock}
                  >
                    <LockKeyhole className="h-4 w-4" /> Lock Payroll
                  </button>
                  <button
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                      selectedRun?.status !== "APPROVED"
                        ? "bg-slate-55 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                    }`}
                    disabled={loading || selectedRun?.status !== "APPROVED"}
                    onClick={handleBankExport}
                  >
                    <Download className="h-4 w-4 text-slate-500" /> Bank CSV Export
                  </button>
                </div>
              )}
            </div>

            {/* Error / Success feedback */}
            {(message || error) && (
              <div className="mt-4">
                {message && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {message}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Current Run Payslips Table */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#172033]">Calculated Salary List</h3>
              <span className="text-xs text-muted">{payslips.length} Employees found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="border-b border-[#e8edf4] p-3">Employee</th>
                    <th className="border-b border-[#e8edf4] p-3">Code</th>
                    <th className="border-b border-[#e8edf4] p-3">Gross (Monthly)</th>
                    <th className="border-b border-[#e8edf4] p-3">Deductions (Monthly)</th>
                    <th className="border-b border-[#e8edf4] p-3">Net Pay (Monthly)</th>
                    <th className="border-b border-[#e8edf4] p-3 text-center">Status</th>
                    <th className="border-b border-[#e8edf4] p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedRunId ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Please select a payroll month/run above to view payout list.
                      </td>
                    </tr>
                  ) : loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Recalculating and fetching dynamic payouts...
                      </td>
                    </tr>
                  ) : !payslips.length ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No payslips calculated yet for this month. Click "Calculate Salary" above.
                      </td>
                    </tr>
                  ) : (
                    payslips.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="border-b border-[#e8edf4] p-3 font-semibold text-slate-800">
                          {p.employee.firstName} {p.employee.lastName}
                        </td>
                        <td className="border-b border-[#e8edf4] p-3 text-xs font-mono">{p.employee.employeeCode}</td>
                        <td className="border-b border-[#e8edf4] p-3">₹{Number(p.grossPay).toLocaleString("en-IN")}</td>
                        <td className="border-b border-[#e8edf4] p-3 text-rose-600">₹{Number(p.deductions).toLocaleString("en-IN")}</td>
                        <td className="border-b border-[#e8edf4] p-3 font-semibold text-brand">₹{Number(p.netPay).toLocaleString("en-IN")}</td>
                        <td className="border-b border-[#e8edf4] p-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="border-b border-[#e8edf4] p-3 text-right">
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            onClick={() => handleOpenPayslip(p)}
                          >
                            <Eye className="h-3.5 w-3.5" /> View Breakdown
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Payslips" && (
        <Card>
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <h3 className="text-base font-semibold">Bulk Payslips Directory</h3>
            <span className="text-xs text-muted">Quick access to formatted digital payslips</span>
          </div>

          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {!selectedRunId ? (
              <div className="col-span-3 py-8 text-center text-slate-400">Select a payroll run from Dashboard tab first.</div>
            ) : !payslips.length ? (
              <div className="col-span-3 py-8 text-center text-slate-400">No payslips available. Perform component calculation first.</div>
            ) : (
              payslips.map((p) => (
                <div key={p.id} className="rounded-xl border border-[#e8edf4] bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{p.employee.firstName} {p.employee.lastName}</h4>
                      <p className="text-xs text-slate-400">{p.employee.employeeCode}</p>
                    </div>
                    <FileText className="h-5 w-5 text-brand" />
                  </div>
                  <div className="mt-4 border-t pt-3 flex justify-between text-xs text-slate-500">
                    <div>
                      <div className="text-[10px] uppercase text-muted">Net Monthly Payout</div>
                      <div className="text-base font-bold text-slate-800 mt-0.5">₹{Number(p.netPay).toLocaleString("en-IN")}</div>
                    </div>
                    <button
                      className="mt-auto h-8 rounded-lg bg-brand/10 text-brand px-3 text-xs font-bold hover:bg-brand hover:text-white transition"
                      onClick={() => handleOpenPayslip(p)}
                    >
                      View Slip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "Bank Export" && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
            <div>
              <h3 className="text-base font-semibold">Bank Direct Payout Export</h3>
              <p className="text-xs text-muted">Direct transfer file format compatible with commercial banking portals.</p>
            </div>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
              disabled={!selectedRunId || selectedRun?.status !== "APPROVED"}
              onClick={handleBankExport}
            >
              <FileSpreadsheet className="h-4 w-4" /> Download Bank Excel CSV
            </button>
          </div>

          {!selectedRunId ? (
            <div className="py-8 text-center text-slate-400">Select a payroll run from Dashboard tab first.</div>
          ) : selectedRun?.status !== "APPROVED" ? (
            <div className="py-8 text-center text-amber-700 bg-amber-50 rounded-xl border border-amber-200 px-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>The bank export file is disabled because the current payroll run ({selectedRun?.month}/{selectedRun?.year}) is not locked yet. Lock the run first.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="border-b p-3">Employee Name</th>
                    <th className="border-b p-3">Employee Code</th>
                    <th className="border-b p-3">Net Payable Amt</th>
                    <th className="border-b p-3">Bank Provider</th>
                    <th className="border-b p-3">IFSC Code</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="border-b p-3 font-semibold text-slate-800">{p.employee.firstName} {p.employee.lastName}</td>
                      <td className="border-b p-3 font-mono text-xs">{p.employee.employeeCode}</td>
                      <td className="border-b p-3 font-semibold text-brand">₹{Number(p.netPay).toLocaleString("en-IN")}</td>
                      <td className="border-b p-3">{p.employee.bankDetails?.bankName || "Not Configured"}</td>
                      <td className="border-b p-3 font-mono text-xs">{p.employee.bankDetails?.ifsc || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "Statutory & Tax" && (
        <ComplianceDash />
      )}

      {activeTab === "Salary Setup" && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
            <div>
              <h3 className="text-base font-semibold">Employee CTC Salary Templates</h3>
              <p className="text-xs text-muted">Manage annual cost-to-company (CTC) structures and tax calculations.</p>
            </div>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"
              onClick={() => {
                setSalaryForm({
                  employeeId: "",
                  effectiveFrom: "2026-06-01",
                  annualCtc: 600000,
                  basic: 300000,
                  hra: 120000,
                  allowances: 108000,
                  employerPf: 36000,
                  employeePf: 36000,
                  esi: 0,
                  professionalTax: 2400,
                  tds: 0,
                });
                setShowSalaryModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Configure CTC
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="border-b p-3">Employee Name</th>
                  <th className="border-b p-3">Code</th>
                  <th className="border-b p-3">Annual CTC</th>
                  <th className="border-b p-3">Basic (Annual)</th>
                  <th className="border-b p-3">HRA (Annual)</th>
                  <th className="border-b p-3">Taxes & PF Deductions (Annual)</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!salaryStructures.length ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No salary structures configured yet. Click "Configure CTC".</td>
                  </tr>
                ) : (
                  salaryStructures.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="border-b p-3 font-semibold text-slate-800">{s.employee.firstName} {s.employee.lastName}</td>
                      <td className="border-b p-3 font-mono text-xs">{s.employee.employeeCode}</td>
                      <td className="border-b p-3 font-semibold text-slate-800">₹{Number(s.annualCtc).toLocaleString("en-IN")}</td>
                      <td className="border-b p-3">₹{Number(s.basic).toLocaleString("en-IN")}</td>
                      <td className="border-b p-3">₹{Number(s.hra).toLocaleString("en-IN")}</td>
                      <td className="border-b p-3 text-rose-600">
                        ₹{(Number(s.employeePf) + Number(s.esi) + Number(s.professionalTax) + Number(s.tds)).toLocaleString("en-IN")}
                      </td>
                      <td className="border-b p-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="border-b p-3 text-right">
                        <button
                          className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          onClick={() => {
                            setSalaryForm({
                              employeeId: s.employeeId,
                              effectiveFrom: s.effectiveFrom ? s.effectiveFrom.slice(0, 10) : "2026-06-01",
                              annualCtc: Number(s.annualCtc),
                              basic: Number(s.basic),
                              hra: Number(s.hra),
                              allowances: Number(s.allowances),
                              employerPf: Number(s.employerPf),
                              employeePf: Number(s.employeePf),
                              esi: Number(s.esi),
                              professionalTax: Number(s.professionalTax),
                              tds: Number(s.tds),
                            });
                            setShowSalaryModal(true);
                          }}
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "Templates" && (
        <div className="grid gap-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold">Salary Structure Templates</h3>
                <p className="text-xs text-muted">Create default formulas for salary component assignment.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {templates.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-400 border rounded-lg bg-slate-50">
                  No templates available.
                </div>
              ) : (
                templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border border-[#e8edf4] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">{tpl.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                      </div>
                      <button
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        onClick={() => {
                          setAssignTpl(tpl);
                          setAssignEmployeeIds([]);
                          setAssignResult(null);
                        }}
                        type="button"
                      >
                        Assign
                      </button>
                    </div>
                    <div className="mt-4 border-t pt-3">
                      <div className="text-[10px] uppercase text-muted mb-2 font-bold">Formula Components</div>
                      <div className="grid gap-1">
                        {(tpl.components as any[])?.map((c: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-600">{c.name} <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{c.type}</span></span>
                            <span className="font-mono text-slate-800">
                              {c.calcType === "FORMULA" ? c.formula : c.calcType === "FIXED" ? `₹${c.amount}` : "SYSTEM"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {assignTpl ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/45 p-4" onClick={() => setAssignTpl(null)}>
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {assignResult ? (
                  <>
                    <h3 className="text-base font-semibold">
                      {assignResult.failed.length === 0
                        ? "Salary structure assigned successfully"
                        : "Salary Structure Assignment Failed for below Employees"}
                    </h3>
                    <div className="mt-4 grid gap-3 text-sm">
                      {assignResult.passed.length > 0 ? (
                        <div>
                          <div className="text-xs font-bold uppercase text-emerald-600">Passed</div>
                          <p className="mt-1 text-slate-700">{assignResult.passed.map((p) => p.name).join(", ")}</p>
                        </div>
                      ) : null}
                      {assignResult.failed.length > 0 ? (
                        <div>
                          <div className="text-xs font-bold uppercase text-rose-600">Failed</div>
                          {assignResult.failed.map((f, i) => (
                            <p key={i} className="mt-1 text-slate-700">{f.name} — <span className="text-slate-500">{f.reason}</span></p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={() => setAssignTpl(null)} type="button">OK</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold">Assign “{assignTpl.name}”</h3>
                    <p className="mt-1 text-xs text-muted">Recomputes each selected employee&apos;s salary structure from the template formulas using their current CTC. Their previous structure is deactivated.</p>
                    <label className="mt-4 grid gap-1 text-xs text-muted">
                      Effective Date
                      <input
                        className="min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm text-ink"
                        onChange={(e) => setAssignEffectiveDate(e.target.value)}
                        type="date"
                        value={assignEffectiveDate}
                      />
                    </label>
                    <div className="mt-3 text-xs text-muted">Employees ({assignEmployeeIds.length} selected)</div>
                    <div className="mt-1 max-h-56 overflow-auto rounded-lg border border-[#dce2eb] p-2">
                      {employeeOptions.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                          <input
                            checked={assignEmployeeIds.includes(opt.value)}
                            onChange={(e) =>
                              setAssignEmployeeIds((prev) =>
                                e.target.checked ? [...prev, opt.value] : prev.filter((id) => id !== opt.value),
                              )
                            }
                            type="checkbox"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <button className="rounded-lg border border-[#dce2eb] px-4 py-2 text-sm" onClick={() => setAssignTpl(null)} type="button">Cancel</button>
                      <button
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        disabled={assignBusy || assignEmployeeIds.length === 0}
                        onClick={handleAssignTemplate}
                        type="button"
                      >
                        {assignBusy ? "Assigning…" : "Apply"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === "Retention Bonus" && (
        <RetentionBonusConsole />
      )}

      {activeTab === "Salary Withholding" && (
        <SalaryWithholdingConsole />
      )}

      {activeTab === "Corrections" && (
        <PayrollCorrectionsConsole />
      )}

      {activeTab === "Gratuity" && (
        <GratuityConsole />
      )}

      {activeTab === "Tax Slabs" && (
        <TaxSlabConsole />
      )}

      {activeTab === "Form 16" && (
        <Form16Panel />
      )}

      {activeTab === "IT Declaration & Proofs" && (
        <ITDeclarationProofsTab />
      )}

      {activeTab === "Components" && (
        <Card>
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-semibold">Payroll Components</h3>
              <p className="text-xs text-muted">Configure metadata for specific salary components like allowances, limits, and taxability.</p>
            </div>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"
              onClick={() => {
                setComponentForm({ id: "", name: "", category: "BASE", kind: "ALLOWANCE", taxable: true, annualLimit: "", individualOverride: false, proofRequired: false, esiApplicable: false, includedInCtc: true, enabled: true });
                setShowComponentModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Component
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="border-b border-[#e8edf4] p-3">Name</th>
                  <th className="border-b border-[#e8edf4] p-3">Category</th>
                  <th className="border-b border-[#e8edf4] p-3">Kind</th>
                  <th className="border-b border-[#e8edf4] p-3">Limit (Annual)</th>
                  <th className="border-b border-[#e8edf4] p-3 text-center">Taxable</th>
                  <th className="border-b border-[#e8edf4] p-3 text-center">Active</th>
                  <th className="border-b border-[#e8edf4] p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {componentConfigs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="border-b border-[#e8edf4] p-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="border-b border-[#e8edf4] p-3">{c.category}</td>
                    <td className="border-b border-[#e8edf4] p-3">{c.kind}</td>
                    <td className="border-b border-[#e8edf4] p-3">{c.annualLimit ? `₹${c.annualLimit.toLocaleString()}` : "No Limit"}</td>
                    <td className="border-b border-[#e8edf4] p-3 text-center">{c.taxable ? "Yes" : "No"}</td>
                    <td className="border-b border-[#e8edf4] p-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="border-b border-[#e8edf4] p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-brand text-xs font-medium hover:underline"
                          onClick={() => {
                            setComponentForm({ ...c, annualLimit: c.annualLimit || "" });
                            setShowComponentModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={`${c.enabled ? "text-rose-600" : "text-emerald-600"} text-xs font-medium hover:underline`}
                          onClick={() => handleToggleComponent(c.id, c.enabled)}
                        >
                          {c.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {componentConfigs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No components configured. Add one to start.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showComponentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#e8edf4] px-6 py-4 shrink-0">
              <h2 className="text-lg font-bold text-[#172033]">{componentForm.id ? "Edit" : "Add"} Component Configuration</h2>
              <button
                onClick={() => setShowComponentModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto px-6 py-4">
              <form id="component-form" onSubmit={handleSaveComponent} className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49637f]">Component Name</label>
                  <input
                    required
                    className="w-full min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                    placeholder="e.g. Conveyance Allowance"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#49637f]">Category</label>
                    <select
                      className="w-full min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm"
                      value={componentForm.category}
                      onChange={(e) => setComponentForm({ ...componentForm, category: e.target.value })}
                    >
                      <option value="BASE">Base / Core</option>
                      <option value="RECURRING">Recurring</option>
                      <option value="VARIABLE">Variable / Performance</option>
                      <option value="ADHOC">Ad-Hoc / One Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#49637f]">Kind</label>
                    <select
                      className="w-full min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm"
                      value={componentForm.kind}
                      onChange={(e) => setComponentForm({ ...componentForm, kind: e.target.value })}
                    >
                      <option value="ALLOWANCE">Allowance</option>
                      <option value="REIMBURSEMENT">Reimbursement</option>
                      <option value="DEDUCTION">Deduction</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49637f]">Annual Limit (₹)</label>
                  <input
                    type="number"
                    className="w-full min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm"
                    value={componentForm.annualLimit}
                    onChange={(e) => setComponentForm({ ...componentForm, annualLimit: e.target.value })}
                    placeholder="Leave blank for no limit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.taxable}
                      onChange={(e) => setComponentForm({ ...componentForm, taxable: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">Taxable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.proofRequired}
                      onChange={(e) => setComponentForm({ ...componentForm, proofRequired: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">Proof Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.includedInCtc}
                      onChange={(e) => setComponentForm({ ...componentForm, includedInCtc: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">Included in CTC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.esiApplicable}
                      onChange={(e) => setComponentForm({ ...componentForm, esiApplicable: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">ESI Applicable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.individualOverride}
                      onChange={(e) => setComponentForm({ ...componentForm, individualOverride: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">Allow Individual Override</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-brand focus:ring-brand"
                      checked={componentForm.enabled}
                      onChange={(e) => setComponentForm({ ...componentForm, enabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-slate-700">Component Active</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8edf4] px-6 py-4 bg-slate-50 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowComponentModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="component-form"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Save Component
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKIPPED EMPLOYEES MODAL */}
      {showSkippedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Missing Bank Details</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              The following {skippedEmployees.length} employee(s) have missing or unverified bank details and will be <strong className="text-rose-600">excluded</strong> from the bank export file. Do you want to proceed anyway?
            </p>
            <div className="max-h-60 overflow-y-auto mb-6 rounded border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2 font-semibold border-b">Employee Name</th>
                    <th className="p-2 font-semibold border-b">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skippedEmployees.map(e => (
                    <tr key={e.employeeCode}>
                      <td className="p-2">{e.firstName} {e.lastName}</td>
                      <td className="p-2 font-mono text-xs text-slate-500">{e.employeeCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setShowSkippedModal(false)}
              >
                Cancel Export
              </button>
              <button
                className="min-h-10 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600 transition"
                onClick={() => {
                  downloadBankFile();
                }}
              >
                Download Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RUN MODAL */}
      {showCreateRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize New Payroll Cycle</h3>
            <p className="text-xs text-slate-500 mb-4">Select month and year to initialize payslip calculations.</p>
            <form onSubmit={handleCreateRun} className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month</label>
                <select
                  className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                  value={newRunMonth}
                  onChange={(e) => setNewRunMonth(e.target.value)}
                >
                  {[
                    ["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"],
                    ["5", "May"], ["6", "June"], ["7", "July"], ["8", "August"],
                    ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"]
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                <select
                  className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                  value={newRunYear}
                  onChange={(e) => setNewRunYear(e.target.value)}
                >
                  {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 1 + i)).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setShowCreateRun(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition"
                >
                  Create Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PAYSLIP BREAKDOWN MODAL */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="print-area w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Salary Slip Breakdown</h3>
                <p className="text-xs text-slate-400">
                  {selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName} ({selectedPayslip.employee.employeeCode})
                </p>
              </div>
              <span className="rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-bold uppercase">
                {selectedRun?.month}/{selectedRun?.year}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 border-b pb-6">
              {/* Earnings */}
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 bg-emerald-50 rounded-lg p-2">Earnings</h4>
                <div className="grid gap-2 text-sm text-slate-700">
                  {selectedPayslip.components && selectedPayslip.components.some(c => c.type === "EARNING") ? (
                    selectedPayslip.components
                      .filter((c) => c.type === "EARNING")
                      .map((c) => (
                        <div className="flex justify-between" key={c.id}>
                          <span>{c.name}</span>
                          <span className="font-semibold">₹{Number(c.amount).toLocaleString("en-IN")}</span>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.grossPay) * 0.50).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRA Allowance</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.grossPay) * 0.20).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Special Allowance</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.grossPay) * 0.30).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold text-emerald-900 text-base">
                    <span>Total Earnings</span>
                    <span>₹{Number(selectedPayslip.grossPay).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 bg-rose-50 rounded-lg p-2">Deductions</h4>
                <div className="grid gap-2 text-sm text-slate-700">
                  {selectedPayslip.components && selectedPayslip.components.some(c => c.type === "DEDUCTION") ? (
                    selectedPayslip.components
                      .filter((c) => c.type === "DEDUCTION")
                      .map((c) => (
                        <div className="flex justify-between" key={c.id}>
                          <span>{c.name}</span>
                          <span className="font-semibold">₹{Number(c.amount).toLocaleString("en-IN")}</span>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Provident Fund (PF)</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.deductions) * 0.40).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ESI Contribution</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.deductions) * 0.10).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Tax</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.deductions) * 0.10).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDS (Tax)</span>
                        <span className="font-semibold">₹{Math.round(Number(selectedPayslip.deductions) * 0.40).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold text-rose-900 text-base">
                    <span>Total Deductions</span>
                    <span>₹{Number(selectedPayslip.deductions).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between bg-slate-55 p-4 rounded-xl">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Monthly Take-home</div>
                <div className="text-2xl font-black text-brand mt-0.5">₹{Number(selectedPayslip.netPay).toLocaleString("en-IN")}</div>
              </div>

              <div className="flex gap-2">
                <button
                  className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setShowPayslipModal(false)}
                >
                  Close
                </button>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition inline-flex items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4" /> Print Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTC CONFIGURATION MODAL */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configure CTC Structure</h3>
                <p className="text-xs text-slate-400">Configure employee compensation details and tax withholdings.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSalary} className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employee</label>
                  <select
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.employeeId}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employeeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Effective From</label>
                  <input
                    type="date"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.effectiveFrom}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual CTC (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.annualCtc}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, annualCtc: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual Basic (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.basic}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, basic: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual HRA (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.hra}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, hra: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual Allowances (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.allowances}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, allowances: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employee PF (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.employeePf}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, employeePf: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employer PF (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.employerPf}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, employerPf: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual ESI (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.esi}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, esi: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Professional Tax (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.professionalTax}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, professionalTax: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Annual TDS (₹)</label>
                  <input
                    type="number"
                    className="min-h-11 w-full rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                    value={salaryForm.tds}
                    onChange={(e) => setSalaryForm((prev) => ({ ...prev, tds: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setShowSalaryModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition"
                >
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PayrollCorrectionsConsole() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    payslipId: "",
    type: "ARREAR",
    amount: 0,
    reason: "",
  });

  function load() {
    apiFetch<any[]>("/payroll/corrections").then((res) => {
      if (res.data) setCorrections(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
    // Load all payslips to select target payslip to correct
    apiFetch<any[]>("/payroll/runs").then((res) => {
      const runs = res.data || [];
      if (runs.length) {
        apiFetch<{ items: any[] }>(`/payroll/runs/${runs[0].id}/payslips`).then((pRes) => {
          if (pRes.data?.items) setPayslips(pRes.data.items);
        });
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.payslipId || form.amount <= 0 || !form.reason) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/corrections", {
        method: "POST",
        body: JSON.stringify({
          payslipId: form.payslipId,
          type: form.type,
          amount: Number(form.amount),
          reason: form.reason,
        }),
      });
      setMessage("Payroll correction adjustment submitted successfully.");
      setForm({ payslipId: "", type: "ARREAR", amount: 0, reason: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to submit correction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(id: string, action: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/payroll/corrections/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setMessage(`Correction request marked ${action.toLowerCase()} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to decide correction request.");
    }
  }

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 text-left">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Record Payroll Correction / Arrears</h3>
        {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-xs text-[#18865a] font-semibold mb-3">{message}</div>}
        {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-xs text-[#ba3d37] font-semibold mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Payslip</label>
            <select
              name="payslipId"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.payslipId}
              onChange={(e) => setForm({ ...form, payslipId: e.target.value })}
            >
              <option value="">Select Payslip</option>
              {payslips.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.employee?.firstName} {p.employee?.lastName} (₹{Number(p.netPay).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Correction Type</label>
            <select
              name="type"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="ARREAR">Arrears Credit</option>
              <option value="BONUS_ADJUSTMENT">Bonus Adjustment</option>
              <option value="DEDUCTION_REVERSAL">Deduction Reversal Credit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              min="1"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Reason / Explanation</label>
            <input
              type="text"
              name="reason"
              required
              placeholder="e.g. FY2025 appraisal backlog arrears"
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
          >
            {submitting ? "Saving..." : "Apply Adjustment"}
          </button>
        </form>
      </Card>

      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Pending Adjustments Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-655">
            <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="p-2.5">Employee</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Reason</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!corrections.length ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">No corrections registered.</td>
                </tr>
              ) : (
                corrections.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-900">
                      {c.payslip?.employee?.firstName} {c.payslip?.employee?.lastName}
                    </td>
                    <td className="p-2.5 font-medium">{c.type}</td>
                    <td className="p-2.5 font-bold text-emerald-700">₹{Number(c.amount).toLocaleString("en-IN")}</td>
                    <td className="p-2.5 max-w-[200px] truncate">{c.reason}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === "PENDING" ? "bg-amber-100 text-amber-800" : c.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {c.status}
                        </span>
                        {c.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDecide(c.id, "APPROVED")}
                              className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecide(c.id, "REJECTED")}
                              className="border border-slate-200 text-slate-700 bg-white rounded px-2 py-0.5 font-bold hover:bg-slate-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function GratuityConsole() {
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
  });

  function load() {
    apiFetch<any[]>("/payroll/gratuity").then((res) => {
      if (res.data) setRecords(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId) return;
    setCalculating(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/gratuity", {
        method: "POST",
        body: JSON.stringify({ employeeId: form.employeeId }),
      });
      setMessage("Gratuity settlement computed and created successfully.");
      setForm({ employeeId: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to calculate gratuity.");
    } finally {
      setCalculating(false);
    }
  }

  async function handleDecide(id: string, action: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/payroll/gratuity/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setMessage(`Gratuity settlement marked ${action.toLowerCase()} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to approve/reject gratuity.");
    }
  }

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 text-left">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Calculate Gratuity Dues</h3>
        {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-xs text-[#18865a] font-semibold mb-3">{message}</div>}
        {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-xs text-[#ba3d37] font-semibold mb-3">{error}</div>}
        <form onSubmit={handleCalculate} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
            <select
              name="employeeId"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={calculating}
            className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
          >
            {calculating ? "Calculating..." : "Compute Dues"}
          </button>
        </form>
      </Card>

      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Gratuity Settlements</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-655">
            <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="p-2.5">Employee</th>
                <th className="p-2.5">Years of Service</th>
                <th className="p-2.5">Last Drawn Basic</th>
                <th className="p-2.5">Gratuity Amount</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!records.length ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">No gratuity records computed.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-900">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="p-2.5 font-medium">{Number(r.yearsOfService).toFixed(2)} years</td>
                    <td className="p-2.5">₹{Number(r.lastBasic).toLocaleString("en-IN")}</td>
                    <td className="p-2.5 font-bold text-brand">₹{Number(r.amount).toLocaleString("en-IN")}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === "PENDING" ? "bg-amber-100 text-amber-800" : r.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {r.status}
                        </span>
                        {r.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDecide(r.id, "APPROVED")}
                              className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecide(r.id, "REJECTED")}
                              className="border border-slate-200 text-slate-700 bg-white rounded px-2 py-0.5 font-bold hover:bg-slate-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TaxSlabConsole() {
  const [slabs, setSlabs] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    regime: "NEW",
    fromAmount: 0,
    toAmount: "",
    ratePercent: 0,
  });

  function load() {
    apiFetch<any[]>("/payroll/tax-slabs").then((res) => {
      if (res.data) setSlabs(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/tax-slabs", {
        method: "POST",
        body: JSON.stringify({
          regime: form.regime,
          fromAmount: Number(form.fromAmount),
          toAmount: form.toAmount ? Number(form.toAmount) : null,
          ratePercent: Number(form.ratePercent),
        }),
      });
      setMessage("Tax slab added successfully.");
      setForm({ regime: "NEW", fromAmount: 0, toAmount: "", ratePercent: 0 });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create tax slab.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 text-left">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Add Income Tax Slab</h3>
        {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-xs text-[#18865a] font-semibold mb-3">{message}</div>}
        {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-xs text-[#ba3d37] font-semibold mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Regime Type</label>
            <select
              name="regime"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.regime}
              onChange={(e) => setForm({ ...form, regime: e.target.value })}
            >
              <option value="NEW">New Tax Regime</option>
              <option value="OLD">Old Tax Regime</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">From Amount (Annual ₹)</label>
            <input
              type="number"
              name="fromAmount"
              min="0"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.fromAmount}
              onChange={(e) => setForm({ ...form, fromAmount: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">To Amount (Annual ₹, blank for no limit)</label>
            <input
              type="number"
              name="toAmount"
              min="1"
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.toAmount}
              onChange={(e) => setForm({ ...form, toAmount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              name="ratePercent"
              min="0"
              max="100"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.ratePercent}
              onChange={(e) => setForm({ ...form, ratePercent: Number(e.target.value) })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
          >
            {submitting ? "Adding..." : "Save Slab"}
          </button>
        </form>
      </Card>

      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Active Income Tax Slabs Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-655">
            <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="p-2.5">Regime</th>
                <th className="p-2.5">Income Band</th>
                <th className="p-2.5">Rate Percent</th>
                <th className="p-2.5">Surcharge (%)</th>
              </tr>
            </thead>
            <tbody>
              {!slabs.length ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">No tax slabs configured in the system.</td>
                </tr>
              ) : (
                slabs.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-bold text-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${s.regime === "NEW" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {s.regime}
                      </span>
                    </td>
                    <td className="p-2.5">
                      ₹{Number(s.fromAmount).toLocaleString("en-IN")} — {s.toAmount ? `₹${Number(s.toAmount).toLocaleString("en-IN")}` : "Above"}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">{Number(s.ratePercent)}%</td>
                    <td className="p-2.5 text-slate-400">{Number(s.surcharge)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RetentionBonusConsole() {
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    bonusAmount: 0,
    bonusDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  function load() {
    apiFetch<any[]>("/payroll/retention-bonuses").then((res) => {
      if (res.data) setRecords(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || form.bonusAmount <= 0 || !form.bonusDate) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/retention-bonuses", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          bonusAmount: Number(form.bonusAmount),
          bonusDate: form.bonusDate,
          reason: form.reason,
        }),
      });
      setMessage("Retention bonus logged successfully.");
      setForm({
        employeeId: "",
        bonusAmount: 0,
        bonusDate: new Date().toISOString().slice(0, 10),
        reason: "",
      });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to log retention bonus.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(id: string, action: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/payroll/retention-bonuses/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setMessage(`Retention bonus marked ${action.toLowerCase()} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to decide retention bonus.");
    }
  }

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 text-left">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Log Retention Bonus</h3>
        {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-xs text-[#18865a] font-semibold mb-3">{message}</div>}
        {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-xs text-[#ba3d37] font-semibold mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
            <select
              name="employeeId"
              id="rb-employeeId"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bonus Amount (₹)</label>
            <input
              type="number"
              name="bonusAmount"
              id="rb-bonusAmount"
              min="1"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.bonusAmount || ""}
              onChange={(e) => setForm({ ...form, bonusAmount: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Payout Target Date</label>
            <input
              type="date"
              name="bonusDate"
              id="rb-bonusDate"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.bonusDate}
              onChange={(e) => setForm({ ...form, bonusDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Reason / Retention Terms</label>
            <input
              type="text"
              name="reason"
              id="rb-reason"
              placeholder="e.g. 1-year service commitment bonus"
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
          >
            {submitting ? "Logging..." : "Create Retention Bonus"}
          </button>
        </form>
      </Card>

      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Retention Bonuses Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-655">
            <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="p-2.5">Employee</th>
                <th className="p-2.5">Bonus Amount</th>
                <th className="p-2.5">Payout Date</th>
                <th className="p-2.5">Reason</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!records.length ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">No retention bonuses recorded.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-900">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="p-2.5 font-bold text-brand">₹{Number(r.bonusAmount).toLocaleString("en-IN")}</td>
                    <td className="p-2.5 font-medium">{new Date(r.bonusDate).toLocaleDateString("en-IN")}</td>
                    <td className="p-2.5 max-w-[200px] truncate">{r.reason || "N/A"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === "PENDING" ? "bg-amber-100 text-amber-800" : r.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {r.status}
                        </span>
                        {r.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDecide(r.id, "APPROVED")}
                              className="bg-emerald-600 text-white rounded px-2.5 py-1 font-semibold text-[10px] hover:bg-emerald-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecide(r.id, "REJECTED")}
                              className="border border-slate-200 text-slate-700 bg-white rounded px-2.5 py-1 font-semibold text-[10px] hover:bg-slate-50 transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SalaryWithholdingConsole() {
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: "",
    reason: "",
  });

  function load() {
    apiFetch<any[]>("/payroll/withholdings").then((res) => {
      if (res.data) setRecords(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.fromDate) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/payroll/withholdings", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          fromDate: form.fromDate,
          toDate: form.toDate || null,
          reason: form.reason,
        }),
      });
      setMessage("Salary withholding logged successfully.");
      setForm({
        employeeId: "",
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: "",
        reason: "",
      });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to log salary withholding.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRelease(id: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/payroll/withholdings/${id}/release`, {
        method: "POST",
      });
      setMessage("Salary withholding released successfully. Arrears correction will be created in next run.");
      load();
    } catch (err: any) {
      setError(err.message || "Failed to release salary withholding.");
    }
  }

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1 text-left">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Apply Salary Withholding</h3>
        {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-xs text-[#18865a] font-semibold mb-3">{message}</div>}
        {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-xs text-[#ba3d37] font-semibold mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
            <select
              name="employeeId"
              id="sw-employeeId"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              name="fromDate"
              id="sw-fromDate"
              required
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.fromDate}
              onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">To Date (Optional)</label>
            <input
              type="date"
              name="toDate"
              id="sw-toDate"
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.toDate}
              onChange={(e) => setForm({ ...form, toDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Withholding</label>
            <input
              type="text"
              name="reason"
              id="sw-reason"
              placeholder="e.g. Exit formalities pending"
              className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
          >
            {submitting ? "Applying..." : "Apply Withholding"}
          </button>
        </form>
      </Card>

      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Salary Withholdings Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-655">
            <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="p-2.5">Employee</th>
                <th className="p-2.5">From Date</th>
                <th className="p-2.5">To Date</th>
                <th className="p-2.5">Reason</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!records.length ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">No salary withholdings applied.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-900">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="p-2.5 font-medium">{new Date(r.fromDate).toLocaleDateString("en-IN")}</td>
                    <td className="p-2.5 font-medium">{r.toDate ? new Date(r.toDate).toLocaleDateString("en-IN") : "Indefinite"}</td>
                    <td className="p-2.5 max-w-[200px] truncate">{r.reason || "N/A"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === "ACTIVE" ? "bg-[#fde8e6] text-[#ba3d37]" : "bg-emerald-100 text-emerald-800"}`}>
                          {r.status}
                        </span>
                        {r.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRelease(r.id)}
                            className="bg-emerald-600 text-white rounded px-2.5 py-1 font-semibold text-[10px] hover:bg-emerald-700 transition"
                          >
                            Release
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Form 16 Panel
// ==========================================
function Form16Panel() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [form16, setForm16] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    }).catch(() => undefined);
  }, []);

  const fetchForm16 = async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    setError("");
    setForm16(null);
    try {
      const res = await apiFetch<any>(`/payroll/form16/${selectedEmployeeId}`);
      setForm16(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch Form 16");
    } finally {
      setLoading(false);
    }
  };

  const fmtINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="grid gap-5">
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-base font-bold text-slate-800 mb-4">Form 16 — Annual Tax Summary</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="form16-employee">
              Select Employee
            </label>
            <select
              id="form16-employee"
              name="form16-employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— choose employee —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <button
            id="form16-fetch-btn"
            onClick={fetchForm16}
            disabled={!selectedEmployeeId || loading}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand/90 transition disabled:opacity-50"
          >
            {loading ? "Loading…" : "Generate Form 16"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {form16 && (
        <Card className="p-6 border border-[#e8edf4] print:shadow-none" id="form16-printable">
          {/* Header */}
          <div className="border-b-2 border-slate-200 pb-4 mb-5 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FORM 16</p>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">Annual Tax Computation</h2>
              <p className="text-sm text-slate-500 mt-0.5">Financial Year {form16.financialYear}</p>
            </div>
            <button
              id="form16-print-btn"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition print:hidden"
            >
              <FileText className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-sm:grid-cols-1">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Employee Details</p>
              <p className="text-sm font-bold text-slate-800">{form16.employeeName}</p>
              <p className="text-xs text-slate-500">{form16.designation}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assessment Details</p>
              <p className="text-xs text-slate-600">Financial Year: <strong>{form16.financialYear}</strong></p>
              <p className="text-xs text-slate-600 mt-0.5">Tax Regime: <strong>{form16.regime} REGIME</strong></p>
              <p className="text-xs text-slate-600 mt-0.5">Payslips Processed: <strong>{form16.payslipCount}</strong></p>
            </div>
          </div>

          {/* Income Computation */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">
              Part A — Income Computation
            </h4>
            <div className="space-y-1">
              {[
                { label: "Gross Total Income (Salary)", value: form16.grossPay, indent: false },
                { label: "Less: Standard Deduction u/s 16(ia)", value: -form16.standardDeduction, indent: true },
                { label: "Taxable Income", value: form16.taxableIncome, indent: false, bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between text-sm py-1.5 ${
                    row.bold ? "font-bold border-t border-slate-200 pt-2 mt-1" : ""
                  }`}
                >
                  <span className={`text-slate-700 ${row.indent ? "pl-6" : ""}`}>{row.label}</span>
                  <span className={row.value < 0 ? "text-red-500" : "text-slate-900"}>
                    {fmtINR(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Computation */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">
              Part B — Tax Computation
            </h4>
            <div className="space-y-1">
              {[
                { label: "Income Tax (as per slab)", value: form16.incomeTax },
                { label: "Surcharge", value: form16.surcharge },
                { label: "Health & Education Cess @ 4%", value: form16.cess },
                { label: "Total Tax Liability", value: form16.totalTaxLiability, bold: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between text-sm py-1.5 ${
                    row.bold ? "font-bold border-t border-slate-200 pt-2 mt-1" : ""
                  }`}
                >
                  <span className="text-slate-700">{row.label}</span>
                  <span className="text-slate-900">{fmtINR(row.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TDS Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">
              Part C — TDS Deducted at Source
            </h4>
            <div className="space-y-1">
              {[
                { label: "TDS Deducted (from payslip components)", value: form16.tdsDeducted },
                { label: "Total Tax Liability", value: form16.totalTaxLiability },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm py-1.5">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="text-slate-900">{fmtINR(row.value)}</span>
                </div>
              ))}
              <div className={`flex justify-between text-sm py-2 font-bold border-t border-slate-200 mt-1 ${
                form16.refundOrDue >= 0 ? "text-green-700" : "text-red-600"
              }`}>
                <span>{form16.refundOrDue >= 0 ? "Tax Refund Due" : "Balance Tax Payable"}</span>
                <span>{fmtINR(Math.abs(form16.refundOrDue))}</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-[10px] text-slate-400 text-center">
            This is a system-generated summary. For official Form 16 with employer DSC, contact the Finance team.
          </p>
        </Card>
      )}
    </div>
  );
}

// ===========================================
// IT Declaration & Proof Verification Tab
// ===========================================

interface TaxProof {
  id: string;
  employeeId: string;
  financialYear: string;
  sectionType: string;
  declaredAmount: number;
  actualAmount: number;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  hrRemarks?: string;
  decidedAt?: string;
  employee?: { firstName: string; lastName: string; employeeCode: string };
}

interface TaxDeclaration {
  id: string;
  employeeId: string;
  financialYear: string;
  regime: string;
  section80C: number;
  section80D: number;
  section24: number;
  otherExemptions: number;
  status: string;
}

const SECTION_OPTIONS = [
  { value: "80C", label: "80C – Investments (LIC, PF, ELSS, Tuition Fee)" },
  { value: "80D", label: "80D – Medical Insurance Premium" },
  { value: "24", label: "Sec 24 – Home Loan Interest" },
  { value: "other", label: "Other Exemptions" },
];

function proofStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function ITDeclarationProofsTab() {
  const [proofs, setProofs] = useState<TaxProof[]>([]);
  const [declaration, setDeclaration] = useState<TaxDeclaration | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Upload form
  const [uploadSection, setUploadSection] = useState("80C");
  const [declaredAmt, setDeclaredAmt] = useState("");
  const [actualAmt, setActualAmt] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // HR decide
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decideStatus, setDecideStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decideRemarks, setDecideRemarks] = useState("");
  const [deciding, setDeciding] = useState(false);

  const currentFY = (() => {
    const now = new Date();
    const yr = now.getFullYear();
    return now.getMonth() >= 3 ? `${yr}-${yr + 1}` : `${yr - 1}-${yr}`;
  })();

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<TaxProof[]>("/payroll/tax-proofs"),
    ])
      .then(([proofsRes]) => {
        setProofs(proofsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Group proofs by section for per-section status display
  const proofsBySection = SECTION_OPTIONS.reduce<Record<string, TaxProof[]>>((acc, s) => {
    acc[s.value] = proofs.filter((p) => p.sectionType === s.value);
    return acc;
  }, {});

  function getSectionStatus(section: string): string {
    const sProofs = proofsBySection[section] ?? [];
    if (!sProofs.length) return "Declared";
    if (sProofs.some((p) => p.status === "APPROVED")) return "Verified";
    if (sProofs.some((p) => p.status === "REJECTED")) return "Rejected";
    return "Proof Pending";
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!proofFile) { setError("Please select a file."); return; }
    setUploading(true);
    setError(""); setMessage("");
    try {
      // Step 1: upload file
      const fd = new FormData();
      fd.append("file", proofFile);
      const uploadRes = await fetch("/api/v1/payroll/tax-proofs/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : ""}` },
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("File upload failed");
      const { fileUrl } = await uploadRes.json();

      // Step 2: create proof record
      await apiFetch("/payroll/tax-proofs", {
        method: "POST",
        body: JSON.stringify({
          employeeId: proofs[0]?.employeeId ?? "", // will be overridden by server scope
          financialYear: currentFY,
          sectionType: uploadSection,
          declaredAmount: Number(declaredAmt),
          actualAmount: Number(actualAmt),
          fileUrl,
        }),
      });
      setMessage("Proof submitted successfully. HR will review and verify.");
      setProofFile(null);
      setDeclaredAmt(""); setActualAmt("");
      load();
    } catch (err: any) {
      setError(err?.message ?? "Proof submission failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDecide(id: string) {
    setDeciding(true);
    setError(""); setMessage("");
    try {
      await apiFetch(`/payroll/tax-proofs/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: decideStatus, hrRemarks: decideRemarks }),
      });
      setMessage(`Proof ${decideStatus === "APPROVED" ? "approved" : "rejected"} — effective exemption updated.`);
      setDecidingId(null);
      setDecideRemarks("");
      load();
    } catch (err: any) {
      setError(err?.message ?? "Decision failed");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="grid gap-5">
      {/* Per-section status summary */}
      <Card>
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">IT Declaration — Section-wise Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">FY {currentFY} · Proofs are additive: verified sections use min(declared, approved proof total)</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 font-semibold">
            {currentFY}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          {SECTION_OPTIONS.map((s) => {
            const st = getSectionStatus(s.value);
            const statusColor =
              st === "Verified" ? "border-emerald-200 bg-emerald-50" :
              st === "Rejected" ? "border-red-200 bg-red-50" :
              st === "Proof Pending" ? "border-amber-200 bg-amber-50" :
              "border-slate-200 bg-slate-50";
            const sProofs = proofsBySection[s.value] ?? [];
            const approvedActual = sProofs.filter(p => p.status === "APPROVED").reduce((sum, p) => sum + Number(p.actualAmount), 0);
            return (
              <div key={s.value} className={`rounded-xl border p-4 ${statusColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">{s.value}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                    st === "Verified" ? "bg-emerald-100 text-emerald-700" :
                    st === "Rejected" ? "bg-red-100 text-red-600" :
                    st === "Proof Pending" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>{st}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{s.label.split("–")[1]?.trim()}</p>
                {approvedActual > 0 && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ Verified: ₹{approvedActual.toLocaleString("en-IN")}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{sProofs.length} proof{sProofs.length !== 1 ? "s" : ""} submitted</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Proof Upload (Employee) */}
      <Card>
        <div className="mb-4 border-b pb-4">
          <h3 className="text-base font-semibold text-slate-800">Submit Proof Document</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload supporting documents for each exemption section. HR will verify and update effective amounts.</p>
        </div>
        <form onSubmit={handleUpload} className="grid gap-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Section</label>
            <select
              id="it-proof-section"
              className="w-full min-h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-brand"
              value={uploadSection}
              onChange={(e) => setUploadSection(e.target.value)}
            >
              {SECTION_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Declared Amount (₹)</label>
              <input
                id="it-proof-declared"
                type="number"
                className="w-full min-h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand"
                placeholder="e.g. 150000"
                value={declaredAmt}
                onChange={(e) => setDeclaredAmt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Actual Amount (₹)</label>
              <input
                id="it-proof-actual"
                type="number"
                className="w-full min-h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand"
                placeholder="e.g. 140000"
                value={actualAmt}
                onChange={(e) => setActualAmt(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Proof File (PDF/Image)</label>
            <input
              id="it-proof-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{message}</div>}
          <button
            id="it-proof-submit"
            type="submit"
            disabled={uploading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Submit Proof"}
          </button>
        </form>
      </Card>

      {/* All Proofs List (HR sees all, employees see own) */}
      <Card>
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <h3 className="text-base font-semibold text-slate-800">Proof Submissions — Verification Queue</h3>
          <span className="text-xs text-slate-400">{proofs.filter(p => p.status === "PENDING").length} pending review</span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading proofs…</div>
        ) : !proofs.length ? (
          <div className="py-8 text-center text-slate-400">No proofs submitted yet for this financial year.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {proofs[0]?.employee && <th className="border-b p-3">Employee</th>}
                  <th className="border-b p-3">Section</th>
                  <th className="border-b p-3">FY</th>
                  <th className="border-b p-3">Declared</th>
                  <th className="border-b p-3">Actual (Proof)</th>
                  <th className="border-b p-3">Proof Doc</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3">HR Remarks</th>
                  <th className="border-b p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {proofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-slate-50/50">
                    {proof.employee && (
                      <td className="border-b p-3 font-semibold text-slate-800">
                        {proof.employee.firstName} {proof.employee.lastName}
                        <span className="block text-xs text-slate-400 font-normal">{proof.employee.employeeCode}</span>
                      </td>
                    )}
                    <td className="border-b p-3 font-mono text-xs font-bold text-slate-700">{proof.sectionType}</td>
                    <td className="border-b p-3 text-xs">{proof.financialYear}</td>
                    <td className="border-b p-3">₹{Number(proof.declaredAmount).toLocaleString("en-IN")}</td>
                    <td className="border-b p-3 font-semibold">₹{Number(proof.actualAmount).toLocaleString("en-IN")}</td>
                    <td className="border-b p-3">
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand text-xs underline hover:text-brand-dark"
                      >
                        View Doc
                      </a>
                    </td>
                    <td className="border-b p-3">{proofStatusBadge(proof.status)}</td>
                    <td className="border-b p-3 text-xs text-slate-500 max-w-[120px] truncate">
                      {proof.hrRemarks || "—"}
                    </td>
                    <td className="border-b p-3 text-right">
                      {proof.status === "PENDING" ? (
                        decidingId === proof.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <select
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                              value={decideStatus}
                              onChange={(e) => setDecideStatus(e.target.value as any)}
                            >
                              <option value="APPROVED">Approve</option>
                              <option value="REJECTED">Reject</option>
                            </select>
                            <input
                              placeholder="Remarks (optional)"
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                              value={decideRemarks}
                              onChange={(e) => setDecideRemarks(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                className="flex-1 rounded-lg bg-brand text-white text-xs font-semibold px-2 py-1.5 hover:bg-brand-dark disabled:opacity-50"
                                disabled={deciding}
                                onClick={() => handleDecide(proof.id)}
                              >
                                {deciding ? "…" : "Confirm"}
                              </button>
                              <button
                                className="flex-1 rounded-lg border border-slate-200 text-xs text-slate-600 px-2 py-1.5 hover:bg-slate-50"
                                onClick={() => { setDecidingId(null); setDecideRemarks(""); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            onClick={() => { setDecidingId(proof.id); setDecideStatus("APPROVED"); setDecideRemarks(""); }}
                          >
                            Decide
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">
                          {proof.decidedAt ? new Date(proof.decidedAt).toLocaleDateString("en-IN") : "Done"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
