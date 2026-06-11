"use client";

import { useEffect, useState } from "react";
import { useActiveRole } from "../lib/role";
import { LeaveApplyPanel } from "./action-panels";
import { LeaveTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { LeaveRulesWorkspace } from "./reference-workspaces";
import { Card } from "./ui";
import { LeaveSettingsConsole } from "./leave-settings-console";
import { LeavePolicyPanel } from "./leave-policy-panel";
import { CalendarPlus, Download, ListChecks, SlidersHorizontal } from "lucide-react";
import { apiFetch } from "../lib/client-api";

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
          summary="Configure company leave rules, carry forward balances, weekends policies, notice periods, and encashments."
          tabs={["Leave Rules Policy", "Leave Policies", "Block Lists"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={[
            { label: "Rules", icon: SlidersHorizontal, tone: "primary" },
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
        tabs={["Dashboard", "Leave Requests", "Leave Balance", "Leave Rules"]}
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
              Use the tab controls above to review individual employee leave requests, check year-to-date balances, or inspect active leave policy rules. Click <strong>Apply Leave</strong> to submit a new leave record.
            </p>
          </div>
        </div>
      )}

      {activeTab === "Leave Requests" && (
        <div className="grid gap-5">
          {showApplyPanel && <LeaveApplyPanel />}
          <LeaveTable mode="requests" search={search} status={status} month={month} />
        </div>
      )}

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
    </div>
  );
}
