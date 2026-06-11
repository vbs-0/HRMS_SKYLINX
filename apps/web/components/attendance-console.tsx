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
import { CalendarDays, Download, Fingerprint, SlidersHorizontal, LogIn, LogOut, MapPin } from "lucide-react";

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
        tabs={["Dashboard", "Attendance Log", "Regularization", "Shift & Rules", "Bulk Upload"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        monthValue={month}
        onMonthChange={setMonth}
        actions={[
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
          <GeoCheckInPanel />
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

      {activeTab === "Bulk Upload" && (
        <BulkAttendanceUploadPanel />
      )}
    </>
  );
}

// ==========================================
// Geo Check-In/Out Panel (with browser GPS)
// ==========================================
function GeoCheckInPanel() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "acquiring" | "ready" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data?.length) {
        setEmployees(res.data);
        setSelectedEmpId(res.data[0].id);
      }
    }).catch(() => undefined);
  }, []);

  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      setGeoStatus("error");
      return;
    }
    setGeoStatus("acquiring");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus("ready");
      },
      (err) => {
        setGeoError(`Location error: ${err.message}`);
        setGeoStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const doCheckIn = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    setMessage("");
    setActionError("");
    try {
      await apiFetch("/attendance/check-in", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmpId,
          latitude: coords?.lat,
          longitude: coords?.lng,
          accuracy: coords?.accuracy,
        }),
      });
      setMessage("✓ Check-in recorded successfully!");
    } catch (err: any) {
      setActionError(err.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const doCheckOut = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    setMessage("");
    setActionError("");
    try {
      await apiFetch("/attendance/check-out", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmpId,
          latitude: coords?.lat,
          longitude: coords?.lng,
          accuracy: coords?.accuracy,
        }),
      });
      setMessage("✓ Check-out recorded successfully!");
    } catch (err: any) {
      setActionError(err.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 border border-[#e8edf4]">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-brand" /> Quick Geo Check-In / Out
      </h3>

      {message && (
        <div className="mb-3 rounded-lg bg-[#e6f5ef] px-3 py-2 text-sm text-[#18865a] font-semibold">{message}</div>
      )}
      {actionError && (
        <div className="mb-3 rounded-lg bg-[#fde8e6] px-3 py-2 text-sm text-[#ba3d37] font-semibold">{actionError}</div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-end max-md:grid-cols-1">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="geo-employee-select">
            Employee
          </label>
          <select
            id="geo-employee-select"
            name="geo-employee-select"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        <button
          id="geo-acquire-btn"
          onClick={acquireLocation}
          disabled={geoStatus === "acquiring"}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            geoStatus === "ready"
              ? "bg-green-100 text-green-700 border border-green-300"
              : geoStatus === "error"
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {geoStatus === "acquiring" ? "Getting GPS…" : geoStatus === "ready" ? `±${Math.round(coords!.accuracy)}m` : "Get GPS"}
        </button>

        <button
          id="attendance-checkin-btn"
          onClick={doCheckIn}
          disabled={loading || !selectedEmpId}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand/90 transition disabled:opacity-50"
        >
          <LogIn className="h-3.5 w-3.5" /> Check In
        </button>

        <button
          id="attendance-checkout-btn"
          onClick={doCheckOut}
          disabled={loading || !selectedEmpId}
          className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" /> Check Out
        </button>
      </div>

      {geoError && (
        <p className="mt-2 text-xs text-red-500">{geoError}</p>
      )}
      {coords && geoStatus === "ready" && (
        <p className="mt-2 text-[10px] text-slate-400">
          📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · accuracy ±{Math.round(coords.accuracy)}m
        </p>
      )}
    </Card>
  );
}


function BulkAttendanceUploadPanel() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [recordsJson, setRecordsJson] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data && res.data.length > 0) {
        setEmployees(res.data);
        const demoRecords = res.data.slice(0, 2).map((emp) => ({
          employeeId: emp.id,
          date: "2026-06-11",
          checkInAt: "2026-06-11T09:15:00+05:30",
          checkOutAt: "2026-06-11T18:30:00+05:30",
          status: "PRESENT",
        }));
        setRecordsJson(JSON.stringify(demoRecords, null, 2));
      }
    });
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const parsed = JSON.parse(recordsJson);
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be a JSON array of records");
      }
      const res = await apiFetch<any>("/attendance/bulk-upload", {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      setMessage(`Successfully uploaded ${res.data?.count || 0} attendance records!`);
    } catch (err: any) {
      setError(err.message || "Failed to parse or upload records");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold">{error}</div>}

      <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Bulk Attendance Upload</h3>
          <form onSubmit={handleUpload} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Attendance Records (JSON Array)</label>
              <textarea
                id="attendance-json-textarea"
                rows={12}
                required
                className="w-full rounded-lg border border-slate-200 p-3 text-xs font-mono bg-slate-50"
                value={recordsJson}
                onChange={(e) => setRecordsJson(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              id="attendance-upload-btn"
              className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
            >
              {submitting ? "Uploading..." : "Upload Attendance"}
            </button>
          </form>
        </Card>

        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Instruction & Schema Reference</h3>
          <div className="space-y-4 text-xs text-[#49637f] leading-relaxed">
            <p>
              Upload multiple attendance logs at once by providing a JSON array containing employee check-ins and check-outs.
            </p>
            <h4 className="font-bold text-slate-700">Required fields per object:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>employeeId</strong>: String ID of the employee</li>
              <li><strong>date</strong>: Date string (YYYY-MM-DD)</li>
              <li><strong>checkInAt</strong>: ISO DateTime String (optional)</li>
              <li><strong>checkOutAt</strong>: ISO DateTime String (optional)</li>
              <li><strong>status</strong>: PRESENT, ABSENT, LATE, HALF_DAY, HOLIDAY, WEEK_OFF (defaults to PRESENT)</li>
            </ul>
            <h4 className="font-bold text-slate-700">Available Employees in Database:</h4>
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded p-2 bg-slate-50">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-[10px] font-bold text-slate-400">
                    <th className="text-left py-1">Name</th>
                    <th className="text-left py-1">Employee Code</th>
                    <th className="text-left py-1">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100/50 hover:bg-white">
                      <td className="py-1 text-slate-800 font-semibold">{emp.firstName} {emp.lastName}</td>
                      <td className="py-1">{emp.employeeCode}</td>
                      <td className="py-1 font-mono text-[10px] select-all">{emp.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
