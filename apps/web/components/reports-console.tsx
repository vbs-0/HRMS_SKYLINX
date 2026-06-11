"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, Filter, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { apiFetch } from "../lib/client-api";
import { Card, MetricCard, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";

interface ApiReportRow {
  // Common properties across reports
  code?: string;
  name?: string;
  department?: string;
  designation?: string;
  location?: string;
  status?: string;

  employee?: string;
  date?: string;
  shift?: string;
  checkInAt?: string;
  checkOutAt?: string;

  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  days?: number;

  month?: number;
  year?: number;
  grossPay?: number;
  deductions?: number;
  netPay?: number;

  category?: string;
  amount?: number;
  claimDate?: string;

  employeePf?: number;
  esi?: number;
  professionalTax?: number;
  tds?: number;
}

interface ApiReport {
  type: string;
  total?: number;
  rows?: ApiReportRow[];
  gross?: number;
  deductions?: number;
  net?: number;
  amount?: number;
  pending?: number;
  approved?: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  tds?: number;
}

interface ReportCard {
  key: string;
  title: string;
  note: string;
  total: number;
}

const tabToKeyMap: Record<string, string> = {
  "Employees": "employees",
  "Attendance": "attendance",
  "Leaves": "leave",
  "Payroll": "payroll",
  "Expenses": "expenses",
  "Compliance": "compliance",
};

const keyToTabMap: Record<string, string> = {
  "employees": "Employees",
  "attendance": "Attendance",
  "leave": "Leaves",
  "payroll": "Payroll",
  "expenses": "Expenses",
  "compliance": "Compliance",
};

const CUSTOM_MODELS = [
  {
    key: "employee",
    label: "Employee Directory",
    fields: {
      employeeCode: "Employee ID",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      gender: "Gender",
      joiningDate: "Joining Date",
      status: "Status",
      panNumber: "PAN Number",
    },
    statuses: ["ACTIVE", "INACTIVE", "EXITED"],
  },
  {
    key: "attendanceLog",
    label: "Attendance Log",
    fields: {
      date: "Date",
      checkInAt: "Check-In",
      checkOutAt: "Check-Out",
      status: "Attendance Status",
      overtimeMinutes: "Overtime (Min)",
    },
    statuses: ["PRESENT", "LATE", "ABSENT", "HALF_DAY"],
  },
  {
    key: "leaveRequest",
    label: "Leave Request",
    fields: {
      fromDate: "From Date",
      toDate: "To Date",
      days: "Leave Days",
      status: "Status",
      reason: "Reason",
    },
    statuses: ["PENDING", "APPROVED", "REJECTED"],
  },
  {
    key: "payslip",
    label: "Payslip Payouts",
    fields: {
      grossPay: "Gross Pay",
      deductions: "Deductions",
      netPay: "Net Pay",
      status: "Status",
    },
    statuses: ["DRAFT", "PENDING", "APPROVED", "PAID"],
  },
  {
    key: "expense",
    label: "Expense Claims",
    fields: {
      category: "Category",
      amount: "Amount",
      claimDate: "Claim Date",
      status: "Status",
      description: "Description",
    },
    statuses: ["PENDING", "APPROVED", "REJECTED"],
  },
];

export function ReportsConsole() {
  const [activeTab, setActiveTab] = useState("Employees");
  const [selectedReport, setSelectedReport] = useState<ApiReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Custom Report Builder States
  const [customModel, setCustomModel] = useState("employee");
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [customStatus, setCustomStatus] = useState("All");
  const [customData, setCustomData] = useState<{ headers: Record<string, string>; rows: any[]; total: number } | null>(null);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Initialize fields when model changes
  useEffect(() => {
    const modelCfg = CUSTOM_MODELS.find(m => m.key === customModel);
    if (modelCfg) {
      setCustomFields(Object.keys(modelCfg.fields));
    }
  }, [customModel]);

  const handleGenerateCustom = async () => {
    setLoadingCustom(true);
    setError("");
    setMessage("");
    try {
      const payload: any = {
        model: customModel,
        fields: customFields,
        take: 5000,
      };
      if (customStatus !== "All") {
        payload.where = { status: customStatus };
      }
      const res = await apiFetch<any>("/reports/custom", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.data) {
        setCustomData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate custom report");
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleDownloadCustomCSV = () => {
    if (!customData || !customData.rows.length) return;
    const headersKeys = Object.keys(customData.headers);
    const headersLabels = headersKeys.map(k => customData.headers[k]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headersLabels.join(",")].concat(
        customData.rows.map((row: any) =>
          headersKeys.map((k) => `"${row[k] ?? ""}"`).join(",")
        )
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `custom_report_${customModel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage("Custom CSV Report downloaded successfully.");
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [cards, setCards] = useState<ReportCard[]>([
    { key: "employees", title: "Employee Directory", note: "Profile, department and status data", total: 0 },
    { key: "attendance", title: "Attendance Log", note: "Logs, late marks and shift checks", total: 0 },
    { key: "leave", title: "Leave Auditing", note: "Leave approvals, categories and durations", total: 0 },
    { key: "payroll", title: "Payroll Payouts", note: "Gross, deductions and net salary lists", total: 0 },
    { key: "expenses", title: "Expense Claims", note: "Reimbursements, totals and stages", total: 0 },
    { key: "compliance", title: "Compliance Contributions", note: "TDS, EPF, ESI and PT deductions", total: 0 },
  ]);

  // Load summary counts for all cards
  function loadCardCounts() {
    const keys = ["employees", "attendance", "leave", "payroll", "expenses", "compliance"];
    keys.forEach((key) => {
      apiFetch<ApiReport>(`/reports/${key}`)
        .then((res) => {
          if (res.data) {
            const count = res.data.total || res.data.rows?.length || 0;
            setCards((curr) => curr.map((c) => c.key === key ? { ...c, total: count } : c));
          }
        })
        .catch(() => undefined);
    });
  }

  // Fetch report details
  function loadReport(key: string) {
    setLoading(true);
    setError("");
    apiFetch<ApiReport>(`/reports/${key}`)
      .then((res) => {
        if (res.data) {
          setSelectedReport(res.data);
          setActiveTab(keyToTabMap[key] || "Employees");
        }
      })
      .catch((err) => setError("Failed to load report data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCardCounts();
    if (activeTab !== "Custom Builder") {
      loadReport(tabToKeyMap[activeTab] || "employees");
    }
  }, [activeTab]);

  // Trigger export queued
  async function triggerExport() {
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{ format: string; status: string; auditId: string }>("/reports/export", { method: "POST" });
      setMessage(`Report export queued. Format: ${res.data?.format.toUpperCase()} (Audit Log ID: ${res.data?.auditId})`);
      loadCardCounts();
    } catch (err) {
      setError("Failed to queue export");
    }
  }

  // Filter local rows
  const filteredRows = (selectedReport?.rows || []).filter((row) => {
    // 1. Search Query
    const nameStr = (row.name || row.employee || "").toLowerCase();
    const codeStr = (row.code || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const queryMatch = !searchQuery || nameStr.includes(query) || codeStr.includes(query);

    // 2. Status Filter
    const statusVal = row.status || "";
    const statusMatch = statusFilter === "All" || statusVal.toUpperCase() === statusFilter.toUpperCase();

    // 3. Department Filter
    const deptVal = row.department || "";
    const deptMatch = deptFilter === "All" || deptVal.toLowerCase() === deptFilter.toLowerCase();

    return queryMatch && statusMatch && deptMatch;
  });

  // Dynamic CSV compiler and downloader
  function handleDownloadCSV() {
    if (!selectedReport || !filteredRows.length) return;
    const type = selectedReport.type;

    let headers: string[] = [];
    let csvMapper: (row: ApiReportRow) => (string | number)[];

    if (type === "employees") {
      headers = ["Employee Code", "Employee Name", "Department", "Designation", "Office Location", "Status"];
      csvMapper = (row) => [row.code || "", row.name || "", row.department || "", row.designation || "", row.location || "", row.status || ""];
    } else if (type === "attendance") {
      headers = ["Employee", "Date", "Shift", "Check In", "Check Out", "Status"];
      csvMapper = (row) => [row.employee || "", row.date ? row.date.slice(0, 10) : "", row.shift || "", row.checkInAt ? row.checkInAt.slice(11, 16) : "", row.checkOutAt ? row.checkOutAt.slice(11, 16) : "", row.status || ""];
    } else if (type === "leave") {
      headers = ["Employee", "Leave Type", "From Date", "To Date", "Days Used", "Status"];
      csvMapper = (row) => [row.employee || "", row.leaveType || "", row.fromDate ? row.fromDate.slice(0, 10) : "", row.toDate ? row.toDate.slice(0, 10) : "", row.days || 0, row.status || ""];
    } else if (type === "payroll") {
      headers = ["Employee", "Month/Year", "Gross Pay", "Deductions", "Net Pay", "Status"];
      csvMapper = (row) => [row.employee || "", `${row.month}/${row.year}`, row.grossPay || 0, row.deductions || 0, row.netPay || 0, row.status || ""];
    } else if (type === "expenses") {
      headers = ["Employee", "Category", "Amount Claimed", "Claim Date", "Status"];
      csvMapper = (row) => [row.employee || "", row.category || "", row.amount || 0, row.claimDate ? row.claimDate.slice(0, 10) : "", row.status || ""];
    } else if (type === "compliance") {
      headers = ["Employee", "EPF Contribution", "ESI Contribution", "Professional Tax", "TDS Deducted"];
      csvMapper = (row) => [row.employee || "", row.employeePf || 0, row.esi || 0, row.professionalTax || 0, row.tds || 0];
    } else {
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(",")].concat(filteredRows.map((r) => csvMapper(r).map(val => `"${val}"`).join(","))).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage("Excel CSV Report downloaded successfully.");
  }

  // PDF trigger (opens print layout)
  function handlePrintPDF() {
    window.print();
  }

  // Dynamic statistics
  const countTotal = selectedReport?.rows?.length || 0;
  const countFiltered = filteredRows.length;

  let metric1 = { label: "Selected Report", val: selectedReport?.type ? selectedReport.type.toUpperCase() : "EMPLOYEES", note: "Active template" };
  let metric2 = { label: "Total Records", val: String(countTotal), note: "Database matches" };
  let metric3 = { label: "Filter Matches", val: String(countFiltered), note: "Export line items" };
  let metric4 = { label: "Report Value", val: "₹0", note: "General summaries" };

  if (selectedReport?.type === "payroll") {
    metric4 = { label: "Total Net Payout", val: `₹${Number(selectedReport.net || 0).toLocaleString("en-IN")}`, note: "Gross payout list" };
  } else if (selectedReport?.type === "expenses") {
    metric4 = { label: "Total Claim Value", val: `₹${Number(selectedReport.amount || 0).toLocaleString("en-IN")}`, note: `${selectedReport.pending || 0} Pending approvals` };
  } else if (selectedReport?.type === "compliance") {
    metric4 = { label: "Total TDS Withheld", val: `₹${Number(selectedReport.tds || 0).toLocaleString("en-IN")}`, note: "Annual tax totals" };
  }

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Reports"
        title="Reports Center"
        summary="Generate and inspect directory lists, shift attendance logs, leave balances, payouts, and compliance files."
        tabs={["Employees", "Attendance", "Leaves", "Payroll", "Expenses", "Compliance", "Custom Builder"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={activeTab === "Custom Builder" ? [] : [
          { label: "Download Excel", icon: FileSpreadsheet, tone: "primary", onClick: handleDownloadCSV },
          { label: "Print PDF", icon: FileText, onClick: handlePrintPDF },
        ]}
        searchValue={activeTab === "Custom Builder" ? undefined : searchQuery}
        onSearchChange={activeTab === "Custom Builder" ? undefined : setSearchQuery}
        statusValue={activeTab === "Custom Builder" ? undefined : statusFilter}
        onStatusChange={activeTab === "Custom Builder" ? undefined : setStatusFilter}
      />

      <ReferenceFlowStrip module="Reports" />

      {/* Confirmation Toasts */}
      {(message || error) && (
        <div>
          {message && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {activeTab !== "Custom Builder" && (
        <>
          {/* Metric Display */}
          <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label={metric1.label} value={metric1.val} note={metric1.note} />
        <MetricCard label={metric2.label} value={metric2.val} note={metric2.note} />
        <MetricCard label={metric3.label} value={metric3.val} note={metric3.note} />
        <MetricCard label={metric4.label} value={metric4.val} note={metric4.note} />
      </div>

      {/* Report Selection Grid */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Select Template File</h3>
            <p className="text-xs text-muted">Click a template below to view and query its data fields.</p>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"
            onClick={triggerExport}
          >
            <Download className="h-4 w-4" /> Trigger Export Job
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {cards.map((c) => (
            <div
              key={c.key}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                selectedReport?.type === c.key
                  ? "border-brand bg-brand-50/10 shadow-sm ring-1 ring-brand"
                  : "border-[#e8edf4] bg-white hover:bg-slate-50/70"
              }`}
              onClick={() => loadReport(c.key)}
            >
              <FileSpreadsheet className="h-6 w-6 text-brand mb-2" />
              <div className="font-bold text-slate-800 text-sm">{c.title}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.note}</p>
              <div className="mt-4 flex gap-1.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {c.total} rows
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Excel/CSV
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Unified Filters & Preview Workspace Card */}
      <Card>
        {/* Card Header with Title and Download/Print actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 capitalize">
              {selectedReport?.type ? `${selectedReport.type} preview data` : "Loading Report..."}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{countFiltered} records showing in compile table</p>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              onClick={handlePrintPDF}
            >
              Print PDF Report
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition"
              onClick={handleDownloadCSV}
            >
              Compile & Save Excel
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mb-5 flex flex-wrap gap-3 items-center">
          <div className="relative w-64 max-sm:w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or code..."
              className="min-h-10 w-full rounded-lg border border-[#dce2eb] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="min-h-10 w-44 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            className="min-h-10 w-44 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="People">People</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-semibold">
              Querying database and compiling data records...
            </div>
          ) : !filteredRows.length ? (
            <div className="py-12 text-center text-slate-400 font-semibold">
              No matching records found.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              {/* Dynamic Columns based on active report type */}
              {selectedReport?.type === "employees" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Code</th>
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Department</th>
                      <th className="border-b p-3">Designation</th>
                      <th className="border-b p-3">Location</th>
                      <th className="border-b p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-mono font-semibold text-xs">{r.code}</td>
                        <td className="border-b p-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="border-b p-3">{r.department}</td>
                        <td className="border-b p-3">{r.designation}</td>
                        <td className="border-b p-3">{r.location}</td>
                        <td className="border-b p-3 text-center">
                          <StatusPill tone={r.status === "ACTIVE" ? "green" : "red"}>{r.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {selectedReport?.type === "attendance" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Date</th>
                      <th className="border-b p-3">Shift</th>
                      <th className="border-b p-3">Check In</th>
                      <th className="border-b p-3">Check Out</th>
                      <th className="border-b p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-semibold text-slate-800">{r.employee}</td>
                        <td className="border-b p-3">{r.date ? r.date.slice(0, 10) : "-"}</td>
                        <td className="border-b p-3">{r.shift}</td>
                        <td className="border-b p-3 font-mono text-xs">{r.checkInAt ? r.checkInAt.slice(11, 19) : "-"}</td>
                        <td className="border-b p-3 font-mono text-xs">{r.checkOutAt ? r.checkOutAt.slice(11, 19) : "-"}</td>
                        <td className="border-b p-3 text-center">
                          <StatusPill tone={r.status === "PRESENT" ? "green" : r.status === "LATE" ? "yellow" : "red"}>
                            {r.status}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {selectedReport?.type === "leave" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Leave Type</th>
                      <th className="border-b p-3">From Date</th>
                      <th className="border-b p-3">To Date</th>
                      <th className="border-b p-3 text-center">Days</th>
                      <th className="border-b p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-semibold text-slate-800">{r.employee}</td>
                        <td className="border-b p-3 font-semibold">{r.leaveType}</td>
                        <td className="border-b p-3">{r.fromDate ? r.fromDate.slice(0, 10) : "-"}</td>
                        <td className="border-b p-3">{r.toDate ? r.toDate.slice(0, 10) : "-"}</td>
                        <td className="border-b p-3 text-center font-bold text-slate-700">{r.days}</td>
                        <td className="border-b p-3 text-center">
                          <StatusPill tone={r.status === "APPROVED" ? "green" : "yellow"}>{r.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {selectedReport?.type === "payroll" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Month/Year</th>
                      <th className="border-b p-3">Gross Salary</th>
                      <th className="border-b p-3">Deductions</th>
                      <th className="border-b p-3">Net Salary</th>
                      <th className="border-b p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-semibold text-slate-800">{r.employee}</td>
                        <td className="border-b p-3 font-mono text-xs">{r.month}/{r.year}</td>
                        <td className="border-b p-3">₹{Number(r.grossPay).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 text-rose-600">₹{Number(r.deductions).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 font-semibold text-brand">₹{Number(r.netPay).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 text-center">
                          <StatusPill tone={r.status === "APPROVED" ? "green" : "yellow"}>{r.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {selectedReport?.type === "expenses" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Expense Category</th>
                      <th className="border-b p-3">Claim Amount</th>
                      <th className="border-b p-3">Claim Date</th>
                      <th className="border-b p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-semibold text-slate-800">{r.employee}</td>
                        <td className="border-b p-3 font-semibold">{r.category}</td>
                        <td className="border-b p-3 font-bold text-slate-800">₹{Number(r.amount).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3">{r.claimDate ? r.claimDate.slice(0, 10) : "-"}</td>
                        <td className="border-b p-3 text-center">
                          <StatusPill tone={r.status === "APPROVED" ? "green" : "yellow"}>{r.status}</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {selectedReport?.type === "compliance" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="border-b p-3">Employee Name</th>
                      <th className="border-b p-3">Provident Fund (EPF)</th>
                      <th className="border-b p-3">ESI Deposit</th>
                      <th className="border-b p-3">Professional Tax</th>
                      <th className="border-b p-3">TDS (Income Tax)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="border-b p-3 font-semibold text-slate-800">{r.employee}</td>
                        <td className="border-b p-3 text-rose-600 font-mono text-xs">₹{Number(r.employeePf).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 text-rose-600 font-mono text-xs">₹{Number(r.esi).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 text-rose-600 font-mono text-xs">₹{Number(r.professionalTax).toLocaleString("en-IN")}</td>
                        <td className="border-b p-3 text-rose-600 font-mono font-bold text-xs">₹{Number(r.tds).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>
      </Card>
      </>
      )}

      {activeTab === "Custom Builder" && (
        <Card className="p-5 border border-[#e8edf4] text-left">
          <div className="grid grid-cols-[300px_1fr] gap-6 max-xl:grid-cols-1">
            {/* Left panel: configurations */}
            <div className="space-y-5 rounded-xl border border-slate-100 bg-[#f8fafc] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Configurations</h4>

              {/* Model selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Dataset</label>
                <select
                  className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                >
                  {CUSTOM_MODELS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status Filter (Optional)</label>
                <select
                  className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm outline-none transition focus:border-brand"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {CUSTOM_MODELS.find(m => m.key === customModel)?.statuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Checkboxes for fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Select Columns</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 bg-white rounded-lg p-3">
                  {Object.entries(CUSTOM_MODELS.find(m => m.key === customModel)?.fields || {}).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                        checked={customFields.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomFields([...customFields, key]);
                          } else {
                            setCustomFields(customFields.filter(f => f !== key));
                          }
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateCustom}
                disabled={loadingCustom}
                className="w-full min-h-10 rounded-lg bg-brand text-xs font-bold text-white transition hover:bg-brand-dark shadow-sm disabled:opacity-50"
              >
                {loadingCustom ? "Querying..." : "Generate Preview"}
              </button>
            </div>

            {/* Right panel: preview workspace */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Preview Workspace</h4>
                  <p className="text-[10px] text-slate-400">Showing first 10 matching records. Download full report as CSV.</p>
                </div>
                {customData && customData.rows.length > 0 && (
                  <button
                    onClick={handleDownloadCustomCSV}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Export {customData.total} Rows to CSV
                  </button>
                )}
              </div>

              {!customData ? (
                <div className="border border-dashed border-slate-200 p-12 text-center text-slate-400 rounded-lg bg-slate-50/50 text-xs font-semibold">
                  Select your dataset and column fields, then click "Generate Preview" to fetch data.
                </div>
              ) : customData.rows.length === 0 ? (
                <div className="border border-dashed border-slate-200 p-12 text-center text-slate-400 rounded-lg bg-slate-50/50 text-xs font-semibold">
                  No matching records found in database.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full border-collapse text-left text-xs text-slate-600 bg-white">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        {Object.keys(customData.headers).map((k) => (
                          <th key={k} className="p-2.5 font-bold uppercase text-slate-500 text-[10px] tracking-wider border-r">
                            {customData.headers[k]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customData.rows.slice(0, 10).map((row: any, rIndex: number) => (
                        <tr key={rIndex} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          {Object.keys(customData.headers).map((k) => (
                            <td key={k} className="p-2.5 border-r font-medium text-slate-800">
                              {row[k]?.toString() ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
