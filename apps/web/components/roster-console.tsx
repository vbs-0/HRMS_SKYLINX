"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { Card, StatusPill } from "./ui";
import { Calendar, Users, FileClock, Clock, Check, X, Play } from "lucide-react";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
}

interface ShiftRequest {
  id: string;
  employeeId: string;
  shiftId: string;
  requestedDate: string;
  status: string;
  reason?: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  shift: {
    name: string;
  };
}

interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  date: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export function RosterConsole() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  
  // Assign Shift Form States
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [assignDate, setAssignDate] = useState("");

  // Bulk Assign Shift Form States
  const [bulkEmps, setBulkEmps] = useState<string[]>([]);
  const [bulkShift, setBulkShift] = useState("");
  const [bulkStart, setBulkStart] = useState("");
  const [bulkEnd, setBulkEnd] = useState("");

  // Process Auto Attendance Date State
  const [autoDate, setAutoDate] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
    return onDataRefresh("roster", loadAll);
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([
      apiFetch<Shift[]>("/attendance/shifts").then((res) => {
        if (res.data) setShifts(res.data);
      }),
      apiFetch<EmployeeOption[]>("/employees").then((res) => {
        if (res.data) setEmployees(res.data);
      }),
      apiFetch<ShiftRequest[]>("/attendance/shifts/requests").then((res) => {
        if (res.data) setRequests(res.data);
      }),
      apiFetch<ShiftAssignment[]>("/attendance/shifts/assignments").then((res) => {
        if (res.data) setAssignments(res.data);
      }),
    ])
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!selectedEmp || !selectedShift || !assignDate) {
        throw new Error("All assign fields are required");
      }
      await apiFetch("/attendance/shifts/assign", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmp,
          shiftId: selectedShift,
          date: assignDate,
        }),
      });
      setMessage("Shift assigned successfully!");
      setSelectedEmp("");
      setSelectedShift("");
      setAssignDate("");
      requestDataRefresh("roster");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to assign shift");
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!bulkEmps.length || !bulkShift || !bulkStart || !bulkEnd) {
        throw new Error("All bulk assign fields are required");
      }
      await apiFetch("/attendance/shifts/bulk-assign", {
        method: "POST",
        body: JSON.stringify({
          employeeIds: bulkEmps,
          shiftId: bulkShift,
          startDate: bulkStart,
          endDate: bulkEnd,
        }),
      });
      setMessage("Bulk shifts assigned successfully!");
      setBulkEmps([]);
      setBulkShift("");
      setBulkStart("");
      setBulkEnd("");
      requestDataRefresh("roster");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed bulk shift assignment");
    }
  };

  const handleDecideRequest = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/attendance/shifts/requests/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: decision }),
      });
      setMessage(`Shift request marked ${decision.toLowerCase()}.`);
      requestDataRefresh("roster");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    }
  };

  const handleTriggerAuto = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!autoDate) throw new Error("Please select a date");
      const res = await apiFetch<any>("/attendance/shifts/process-auto", {
        method: "POST",
        body: JSON.stringify({ date: autoDate }),
      });
      setMessage(`Processed auto-attendance for ${autoDate}. ${res.data?.count || 0} records created/updated.`);
      setAutoDate("");
      requestDataRefresh("attendance");
    } catch (err: any) {
      setError(err.message || "Failed to run auto processor");
    }
  };

  const toggleBulkEmp = (id: string) => {
    if (bulkEmps.includes(id)) {
      setBulkEmps(bulkEmps.filter((item) => item !== id));
    } else {
      setBulkEmps([...bulkEmps, id]);
    }
  };

  return (
    <div className="grid gap-6 text-left">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in duration-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
        {/* Shift Definition List */}
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
            <Clock className="h-5 w-5 text-brand" /> Standard Shift Definitions
          </h3>
          <div className="grid gap-3">
            {shifts.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                <div className="font-semibold text-slate-800">{s.name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Timings: <strong>{s.startTime}</strong> to <strong>{s.endTime}</strong>
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Grace Limit: {s.graceMinutes} mins
                </div>
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="text-xs text-slate-400">No shift policies configured.</div>
            )}
          </div>
        </Card>

        {/* Individual Shift Assignment */}
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
            <Calendar className="h-5 w-5 text-brand" /> Assign Roster Shift
          </h3>
          <form onSubmit={handleAssignShift} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
              <select
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                required
              >
                <option value="">Choose Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Shift</label>
              <select
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                required
              >
                <option value="">Choose Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Roster Date</label>
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                required
              />
            </div>
            <button
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
              type="submit"
            >
              Assign Roster
            </button>
          </form>
        </Card>

        {/* Trigger Auto Attendance */}
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
            <Play className="h-5 w-5 text-brand" /> Auto Attendance Process
          </h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Runs automated background attendance check sheets: identifies absent staff, holiday status, weekend off schedules, and logs late flags.
          </p>
          <form onSubmit={handleTriggerAuto} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Processing Date</label>
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                type="date"
                value={autoDate}
                onChange={(e) => setAutoDate(e.target.value)}
                required
              />
            </div>
            <button
              className="min-h-10 rounded-lg border border-brand bg-brand/5 text-brand px-4 text-sm font-semibold hover:bg-brand hover:text-white transition shadow-sm"
              type="submit"
            >
              Run Attendance Processor
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
        {/* Left: Bulk Assign Shift */}
        <Card className="col-span-1">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
            <Users className="h-5 w-5 text-brand" /> Bulk Assign Shifts
          </h3>
          <form onSubmit={handleBulkAssign} className="grid gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Select Employees</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 grid gap-2 bg-slate-50/50">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkEmps.includes(emp.id)}
                      onChange={() => toggleBulkEmp(emp.id)}
                      className="rounded text-brand focus:ring-brand"
                    />
                    <span>{emp.firstName} {emp.lastName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Shift</label>
              <select
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={bulkShift}
                onChange={(e) => setBulkShift(e.target.value)}
                required
              >
                <option value="">Choose Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                  type="date"
                  value={bulkStart}
                  onChange={(e) => setBulkStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                  type="date"
                  value={bulkEnd}
                  onChange={(e) => setBulkEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
              type="submit"
            >
              Apply Bulk Roster
            </button>
          </form>
        </Card>

        {/* Right: Assignments List */}
        <div className="col-span-2 grid gap-6">
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Calendar className="h-5 w-5 text-brand" /> Active Roster Assignments
            </h3>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full min-w-[500px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Shift Policy</th>
                    <th className="p-3">Timings</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {a.employee?.firstName} {a.employee?.lastName}
                      </td>
                      <td className="p-3 text-slate-600">{a.date?.slice(0, 10)}</td>
                      <td className="p-3 font-medium text-brand">{a.shift?.name}</td>
                      <td className="p-3 text-xs font-semibold text-slate-500">
                        {a.shift?.startTime} - {a.shift?.endTime}
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-xs text-muted text-center">
                        No shift assignments loaded from database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Shift Requests from Staff */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <FileClock className="h-5 w-5 text-brand" /> Shift Roster Requests
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Requested Date</th>
                    <th className="p-3">Preferred Shift</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {req.employee?.firstName} {req.employee?.lastName}
                      </td>
                      <td className="p-3 text-slate-600">{req.requestedDate?.slice(0, 10)}</td>
                      <td className="p-3 font-medium text-slate-700">{req.shift?.name}</td>
                      <td className="p-3 text-xs text-slate-500">{req.reason || "-"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={req.status === "PENDING" ? "yellow" : req.status === "REJECTED" ? "red" : "green"}>
                            {req.status}
                          </StatusPill>
                          {req.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecideRequest(req.id, "APPROVED")}
                                className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                title="Approve Request"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDecideRequest(req.id, "REJECTED")}
                                className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                title="Reject Request"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-xs text-muted text-center">
                        No shift change requests found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
