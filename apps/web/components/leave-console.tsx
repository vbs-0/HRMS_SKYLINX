"use client";

import { useEffect, useState } from "react";
import { useActiveRole } from "../lib/role";
import { LeaveApplyPanel } from "./action-panels";
import { LeaveTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { LeaveRulesWorkspace } from "./reference-workspaces";
import { Card, StatusPill } from "./ui";
import { LeaveSettingsConsole } from "./leave-settings-console";
import { LeavePolicyPanel } from "./leave-policy-panel";
import { CalendarPlus, Download, ListChecks, SlidersHorizontal, X } from "lucide-react";
import { apiFetch } from "../lib/client-api";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-[#dce2eb] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LeaveConsole() {
  const { role } = useActiveRole();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("2026-06");
  const [status, setStatus] = useState("All");

  const [types, setTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  function loadData() {
    apiFetch<any[]>("/leave/types").then((res) => {
      if (res.data) setTypes(res.data);
    });
    apiFetch<any[]>("/leave/requests").then((res) => {
      if (res.data) setRequests(res.data);
    });
    apiFetch<any[]>("/leave/balances").then((res) => {
      if (res.data) setBalances(res.data);
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (role === "admin") {
      setActiveTab("Leave Rules Policy");
    } else {
      setActiveTab("Dashboard");
    }
  }, [role]);

  async function handleExport() {
    try {
      if (activeTab === "Leave Balance") {
        const res = await apiFetch<any[]>("/leave/balances");
        if (!res.data) return;
        const csvContent = [
          ["Employee", "Leave Type", "Year", "Opening Balance", "Accrued", "Used", "Available"].join(","),
          ...res.data.map((b) => [
            `"${b.employee?.firstName || ""} ${b.employee?.lastName || ""}"`,
            `"${b.leaveType?.name || ""}"`,
            b.year,
            b.openingBalance,
            b.accrued,
            b.used,
            b.available,
          ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `leave_balances_${Date.now()}.csv`);
        link.click();
      } else {
        const res = await apiFetch<any[]>("/leave/requests");
        if (!res.data) return;
        const csvContent = [
          ["Employee", "Leave Type", "From Date", "To Date", "Days", "Status", "Reason"].join(","),
          ...res.data.map((r) => [
            `"${r.employee?.firstName || ""} ${r.employee?.lastName || ""}"`,
            `"${r.leaveType?.name || ""}"`,
            r.fromDate?.slice(0, 10) || "",
            r.toDate?.slice(0, 10) || "",
            r.days,
            r.status,
            `"${(r.reason || "").replace(/"/g, '""')}"`,
          ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `leave_requests_${Date.now()}.csv`);
        link.click();
      }
    } catch (err) {
      console.error("Failed to export leave data", err);
    }
  }

  if (role === "admin") {
    return (
      <div className="grid gap-5">
        <ReferenceModuleHeader
          eyebrow="Admin"
          title="Leave Configurations"
          summary="Configure company leave rules, approve leave requests, carry forward balances, weekends policies, notice periods, and encashments."
          tabs={["Leave Rules Policy", "Leave Approvals", "Leave Policies", "Block Lists"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={[
            { label: "Rules", icon: SlidersHorizontal, tone: "primary", onClick: () => setActiveTab("Leave Rules Policy") },
            { label: "Approvals", icon: ListChecks, onClick: () => setActiveTab("Leave Approvals") },
            { label: "Export", icon: Download, onClick: handleExport },
          ]}
          stats={[
            { label: "Leave Types", value: `${types.length} Active`, note: "System seeded" },
            { label: "Balances Tracked", value: String(balances.length), note: "Active employees" },
            { label: "Audit Logs", value: "On", note: "Admin actions tracked" },
          ]}
        />
        <ReferenceFlowStrip module="Settings" />
        {activeTab === "Leave Rules Policy" && <LeaveSettingsConsole />}
        {activeTab === "Leave Approvals" && (
          <div className="grid gap-5">
            <LeaveTable mode="requests" search={search} status={status} month={month} />
          </div>
        )}
        {activeTab === "Leave Policies" && <LeavePolicyPanel initialTab="policies" />}
        {activeTab === "Block Lists" && <LeavePolicyPanel initialTab="blocklists" />}
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const activeCount = types.length;
  const balancesCount = balances.length;

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Leave"
        title="Leave Dashboard"
        summary="Apply, approve, reject and audit leave requests with balances, rules, carry forward and sandwich policy views."
        tabs={["Dashboard", "Team Calendar", "Leave Requests", "Leave Balance", "Leave Rules", "Leave Encashment", "Comp-Off Conversion"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        monthValue={month}
        onMonthChange={setMonth}
        statusValue={status}
        onStatusChange={setStatus}
        actions={[
          {
            label: "Apply Leave",
            icon: CalendarPlus,
            tone: "primary",
            onClick: () => setShowApplyPanel(!showApplyPanel),
          },
          {
            label: "Approvals",
            icon: ListChecks,
            onClick: () => setActiveTab("Leave Requests"),
          },
          {
            label: "Export",
            icon: Download,
            onClick: handleExport,
          },
          {
            label: "Rules",
            icon: SlidersHorizontal,
            onClick: () => setActiveTab("Leave Rules"),
          },
        ]}
        stats={[
          { label: "Pending Requests", value: String(pendingCount), note: "Awaiting decision" },
          { label: "Active Policies", value: String(activeCount), note: "Configured rules" },
          { label: "Balances Tracked", value: String(balancesCount), note: "Active employees" },
        ]}
      />
      <ReferenceFlowStrip module="Leave" />

      {activeTab === "Dashboard" && (
        <div className="grid gap-6">
          <LeaveRulesWorkspace />
          <div className="rounded-lg bg-blue-50/50 border border-blue-200 p-5 text-left">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Welcome to the Leave Control Room</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Use the tab controls above to review individual employee leave requests, check YTD balances, apply for leave encashments, or process earned-leave accruals. Click <strong>Apply Leave</strong> to submit a new leave record.
            </p>
          </div>
        </div>
      )}

      {activeTab === "Team Calendar" && (
        <TeamLeaveCalendar requests={requests} />
      )}

      {activeTab === "Leave Requests" && (
        <div className="grid gap-5">
          <LeaveTable mode="requests" search={search} status={status} month={month} />
        </div>
      )}

      <Modal isOpen={showApplyPanel} onClose={() => setShowApplyPanel(false)} title="Apply Leave">
        <LeaveApplyPanel onSuccess={() => setTimeout(() => { setShowApplyPanel(false); loadData(); }, 1200)} />
      </Modal>

      {activeTab === "Leave Balance" && (
        <LeaveTable mode="balances" search={search} />
      )}

      {activeTab === "Leave Rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => (
            <Card key={type.id} className="p-5 border border-[#e8edf4] hover:shadow-md transition text-left flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-[#172033]">{type.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-blue-50 px-2.5 py-1 rounded">
                    {type.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{type.description}</p>
                <hr className="border-slate-100 my-3" />
                <div className="space-y-2 text-xs text-[#49637f]">
                  <div className="flex justify-between">
                    <span className="font-semibold">Annual Quota:</span>
                    <span className="font-bold text-[#172033]">{type.annualQuota} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Probation Allowed:</span>
                    <span className="font-bold text-[#172033]">{type.allowedUnderProbation ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Notice Allowed:</span>
                    <span className="font-bold text-[#172033]">{type.allowedUnderNoticePeriod ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Weekends count:</span>
                    <span className="font-bold text-[#172033]">{type.weekendsBetweenLeave}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Holidays count:</span>
                    <span className="font-bold text-[#172033]">{type.holidaysBetweenLeave}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Carry Forward:</span>
                    <span className="font-bold text-[#172033]">{type.carryForwardAllowed ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Max Leaves / Month:</span>
                    <span className="font-bold text-[#172033]">{type.maxLeavesPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Negative Leaves:</span>
                    <span className="font-bold text-[#172033]">{type.negativeLeavesAllowed ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "Leave Encashment" && (
        <LeaveEncashmentPanel />
      )}

      {activeTab === "Comp-Off Conversion" && (
        <CompOffConversionPanel />
      )}
    </div>
  );
}

function CompOffConversionPanel() {
  const [conversions, setConversions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { role } = useActiveRole();

  const [form, setForm] = useState({
    employeeId: "",
    overtimeRequestId: "",
    leaveTypeId: "",
    daysGranted: 1,
  });

  function load() {
    apiFetch<any[]>("/leave/comp-off-conversions").then((res) => {
      if (res.data) setConversions(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
    apiFetch<any[]>("/leave/types").then((res) => {
      if (res.data) setLeaveTypes(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.overtimeRequestId || !form.leaveTypeId || form.daysGranted <= 0) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/comp-off-conversions", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          overtimeRequestId: form.overtimeRequestId,
          leaveTypeId: form.leaveTypeId,
          daysGranted: Number(form.daysGranted),
        }),
      });
      setMessage("Comp-off conversion request submitted successfully!");
      setForm({ employeeId: "", overtimeRequestId: "", leaveTypeId: "", daysGranted: 1 });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(id: string, action: "approve" | "reject") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/leave/comp-off-conversions/${id}/${action}`, {
        method: "PATCH",
      });
      setMessage(`Comp-off conversion request marked ${action === "approve" ? "approved" : "rejected"} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to decide comp-off conversion request.");
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold">{error}</div>}

      <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Overtime to Comp-Off Conversion</h3>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
              <select
                name="employeeId"
                id="compoff-employee-select"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              >
                <option value="">Choose Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Overtime Request ID</label>
              <input
                type="text"
                name="overtimeRequestId"
                id="compoff-ot-id-input"
                required
                placeholder="e.g. ot_12345"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.overtimeRequestId}
                onChange={(e) => setForm({ ...form, overtimeRequestId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Leave Type (Comp-Off)</label>
              <select
                name="leaveTypeId"
                id="compoff-type-select"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Days Granted</label>
              <input
                type="number"
                name="daysGranted"
                id="compoff-days-input"
                min="0.5"
                step="0.5"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.daysGranted}
                onChange={(e) => setForm({ ...form, daysGranted: Number(e.target.value) })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              id="compoff-submit-btn"
              className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
            >
              {submitting ? "Submitting..." : "Convert Overtime"}
            </button>
          </form>
        </Card>

        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Comp-Off Requests Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-slate-650">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-2.5">Employee</th>
                  <th className="p-2.5">Overtime Request ID</th>
                  <th className="p-2.5">Leave Type</th>
                  <th className="p-2.5">Days</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {!conversions.length ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">No comp-off conversion records found.</td>
                  </tr>
                ) : (
                  conversions.map((conv) => (
                    <tr key={conv.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-2.5 font-semibold text-slate-900">{conv.employee?.firstName} {conv.employee?.lastName}</td>
                      <td className="p-2.5">{conv.overtimeRequestId}</td>
                      <td className="p-2.5">{conv.leaveType?.name}</td>
                      <td className="p-2.5 font-bold">{Number(conv.daysGranted)}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={conv.status === "PENDING" ? "yellow" : conv.status === "APPROVED" ? "green" : "red"}>
                            {conv.status}
                          </StatusPill>
                          {conv.status === "PENDING" && role === "admin" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecide(conv.id, "approve")}
                                className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecide(conv.id, "reject")}
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
    </div>
  );
}

function LeaveEncashmentPanel() {
  const [encashments, setEncashments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { role } = useActiveRole();

  const [form, setForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    days: 1,
  });

  function load() {
    apiFetch<any[]>("/leave/encashments").then((res) => {
      if (res.data) setEncashments(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
    apiFetch<any[]>("/leave/types").then((res) => {
      if (res.data) setLeaveTypes(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || !form.leaveTypeId || form.days <= 0) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/encashments", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          leaveTypeId: form.leaveTypeId,
          days: Number(form.days),
        }),
      });
      setMessage("Encashment request submitted successfully!");
      setForm({ employeeId: "", leaveTypeId: "", days: 1 });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(id: string, action: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/leave/encashments/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setMessage(`Encashment request marked ${action.toLowerCase()} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to decide encashment request.");
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold">{error}</div>}

      <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Apply for Leave Encashment</h3>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
              <select
                name="employeeId"
                id="encash-employee-select"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              >
                <option value="">Choose Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Leave Type</label>
              <select
                name="leaveTypeId"
                id="encash-type-select"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.filter(t => t.leaveEncashEnabled).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Days to Encash</label>
              <input
                type="number"
                name="days"
                id="encash-days-input"
                min="1"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              id="encash-submit-btn"
              className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </Card>

        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Encashment History & Approvals</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-slate-650">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-2.5">Employee</th>
                  <th className="p-2.5">Leave Type</th>
                  <th className="p-2.5">Days</th>
                  <th className="p-2.5">Rate / Day</th>
                  <th className="p-2.5">Total Amount</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {!encashments.length ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">No encashment records found.</td>
                  </tr>
                ) : (
                  encashments.map((enc) => (
                    <tr key={enc.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-2.5 font-semibold text-slate-900">{enc.employee?.firstName} {enc.employee?.lastName}</td>
                      <td className="p-2.5">{enc.leaveType?.name}</td>
                      <td className="p-2.5 font-bold">{Number(enc.days)}</td>
                      <td className="p-2.5">₹{Number(enc.amountPerDay).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 font-bold text-brand">₹{Number(enc.totalAmount).toLocaleString("en-IN")}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={enc.status === "PENDING" ? "yellow" : enc.status === "APPROVED" ? "green" : "red"}>
                            {enc.status}
                          </StatusPill>
                          {enc.status === "PENDING" && role === "admin" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecide(enc.id, "APPROVED")}
                                className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecide(enc.id, "REJECTED")}
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
    </div>
  );
}

function TeamLeaveCalendar({ requests }: { requests: any[] }) {
  const approvedRequests = requests.filter(r => r.status === "APPROVED");
  
  return (
    <Card className="p-5 border border-[#e8edf4]">
      <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Team Leave Calendar</h3>
      <div className="grid gap-4">
        {!approvedRequests.length ? (
          <div className="text-sm text-slate-500">No approved leaves to show.</div>
        ) : (
          <div className="grid gap-3">
            {approvedRequests.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                <div className="font-semibold text-sm">
                  {r.employee?.firstName} {r.employee?.lastName}
                  <span className="ml-2 font-normal text-xs text-slate-500">({r.leaveType?.name})</span>
                </div>
                <div className="text-xs font-bold bg-white px-2 py-1 border rounded shadow-sm">
                  {r.fromDate?.slice(0, 10)} to {r.toDate?.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
