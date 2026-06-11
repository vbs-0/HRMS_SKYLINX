"use client";

import { useState, useEffect } from "react";
import { AttendanceActionPanel } from "./action-panels";
import { AttendanceTable, RegularizationsTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { AttendanceRulesWorkspace } from "./reference-workspaces";
import { RosterConsole } from "./roster-console";
import { Card } from "./ui";
import { apiFetch } from "../lib/client-api";
import { CalendarDays, Download, Fingerprint, SlidersHorizontal } from "lucide-react";

export function AttendanceConsole() {
  const [activeTab, setActiveTab] = useState("Attendance Log");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("2026-06");

  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
  });

  useEffect(() => {
    apiFetch<any[]>("/attendance/logs")
      .then((res) => {
        const logs = res.data || [];
        let p = 0;
        let a = 0;
        let l = 0;
        logs.forEach((log) => {
          if (log.status === "PRESENT") p++;
          if (log.status === "ABSENT") a++;
          if (log.status === "LATE") l++;
        });
        setStats({ present: p, absent: a, late: l });
      })
      .catch(() => undefined);
  }, [activeTab]);

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Attendance"
        title="Attendance Dashboard"
        summary="Review daily presence, exceptions, regularization requests and attendance rules from one Skylinx PeopleOS control desk."
        tabs={["Dashboard", "Attendance Log", "Regularization", "Shift & Rules"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        monthValue={month}
        onMonthChange={setMonth}
        actions={[
          { label: "Check In", icon: <Fingerprint className="h-4 w-4" />, tone: "primary" },
          { label: "Month View", icon: <CalendarDays className="h-4 w-4" /> },
          { label: "Export", icon: <Download className="h-4 w-4" /> },
          { label: "Rules", icon: <SlidersHorizontal className="h-4 w-4" /> },
        ]}
        stats={[
          { label: "Present Count", value: String(stats.present), note: "Active roster today" },
          { label: "Absent Count", value: String(stats.absent), note: "No logs found" },
          { label: "Late Marks", value: String(stats.late), note: "Exceeded grace" },
        ]}
      />
      
      <ReferenceFlowStrip module="Attendance" />

      {activeTab === "Dashboard" && (
        <div className="grid gap-5">
          <AttendanceRulesWorkspace />
          <AttendanceActionPanel />
        </div>
      )}

      {activeTab === "Attendance Log" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800 text-left">Today&apos;s Logs</h2>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm text-left">
              <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="border-b border-[#dce2eb] p-3">Employee</th>
                  <th className="border-b border-[#dce2eb] p-3">Date</th>
                  <th className="border-b border-[#dce2eb] p-3">Check In</th>
                  <th className="border-b border-[#dce2eb] p-3">Check Out</th>
                  <th className="border-b border-[#dce2eb] p-3">Status</th>
                </tr>
              </thead>
              <AttendanceTable search={search} status={status} month={month} />
            </table>
          </div>
        </Card>
      )}

      {activeTab === "Regularization" && (
        <RegularizationsTable search={search} status={status} />
      )}

      {activeTab === "Shift & Rules" && (
        <RosterConsole />
      )}
    </>
  );
}
