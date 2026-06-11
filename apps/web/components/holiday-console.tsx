"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { getCurrentCompanyId } from "../lib/session";
import { useLocationOptions } from "../lib/options";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { Card, StatusPill } from "./ui";
import { CalendarPlus, Download, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface ApiHoliday {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
  locationId?: string | null;
  location?: { name: string } | null;
}

export function HolidayConsole() {
  const [activeTab, setActiveTab] = useState("Calendar");
  const [holidays, setHolidays] = useState<ApiHoliday[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2026-06"); // YYYY-MM
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state for creating a new holiday
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("MANDATORY");
  const [formLocationId, setFormLocationId] = useState("");
  const locations = useLocationOptions();
  
  // Stubs for alert replacement
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [showRulesAlert, setShowRulesAlert] = useState(false);

  function loadHolidays() {
    apiFetch<ApiHoliday[]>("/holidays")
      .then((res) => {
        if (res.data) {
          setHolidays(res.data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    loadHolidays();
    return onDataRefresh("holidays", loadHolidays);
  }, []);

  async function handleCreateHoliday(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!formName || !formDate) {
      setError("Please fill out all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/holidays", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          locationId: formLocationId || undefined,
          name: formName,
          date: formDate,
          type: formType,
        }),
      });
      setMessage("Holiday created successfully.");
      setFormName("");
      setFormDate("");
      setFormType("MANDATORY");
      setFormLocationId("");
      setShowAddModal(false);
      loadHolidays();
      requestDataRefresh("holidays");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create holiday");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiFetch(`/holidays/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      loadHolidays();
      requestDataRefresh("holidays");
    } catch (err) {
      console.error(err);
    }
  }

  function handleExportCSV() {
    if (!holidays.length) return;
    const headers = ["Name", "Date", "Type", "Location", "Status"];
    const csvData = holidays.map((h) => [
      h.name,
      h.date.slice(0, 10),
      h.type,
      h.location?.name || "All Locations",
      h.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(",")].concat(csvData.map((row) => row.map(val => `"${val}"`).join(","))).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `holiday_calendar_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse current year/month
  const [yearStr, monthStr] = selectedMonth.split("-");
  const currentYear = parseInt(yearStr) || 2026;
  const currentMonthIdx = (parseInt(monthStr) || 6) - 1; // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate calendar grid properties
  const startOffset = (new Date(currentYear, currentMonthIdx, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  
  const calendarCells: Array<{ dateNum: number; dateString: string; isCurrentMonth: boolean }> = [];
  
  // Prev month padding
  const prevMonthDays = new Date(currentYear, currentMonthIdx, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
    const prevYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;
    const dStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
    calendarCells.push({ dateNum: dNum, dateString: dStr, isCurrentMonth: false });
  }

  // Current month active days
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({ dateNum: i, dateString: dStr, isCurrentMonth: true });
  }

  // Next month padding to fill out 35 or 42 cells
  const totalCellsNeeded = calendarCells.length > 35 ? 42 : 35;
  const nextMonthPadding = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const nextMonthIdx = currentMonthIdx === 11 ? 0 : currentMonthIdx + 1;
    const nextYear = currentMonthIdx === 11 ? currentYear + 1 : currentYear;
    const dStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({ dateNum: i, dateString: dStr, isCurrentMonth: false });
  }

  function handlePrevMonth() {
    let nextM = currentMonthIdx; // 0-indexed
    let nextY = currentYear;
    if (nextM === 0) {
      nextM = 11;
      nextY -= 1;
    } else {
      nextM -= 1;
    }
    setSelectedMonth(`${nextY}-${String(nextM + 1).padStart(2, "0")}`);
  }

  function handleNextMonth() {
    let nextM = currentMonthIdx; // 0-indexed
    let nextY = currentYear;
    if (nextM === 11) {
      nextM = 0;
      nextY += 1;
    } else {
      nextM += 1;
    }
    setSelectedMonth(`${nextY}-${String(nextM + 1).padStart(2, "0")}`);
  }

  // Filter list rows based on active tabs
  const filteredListHolidays = holidays.filter((h) => {
    if (activeTab === "Mandatory" && h.type !== "MANDATORY") return false;
    if (activeTab === "Optional" && h.type !== "OPTIONAL") return false;
    if (activeTab === "Regional" && h.type !== "REGIONAL") return false;
    return true;
  });

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Holiday"
        title="Holiday Calendar"
        summary="Maintain mandatory, optional and regional holiday calendars that feed attendance and leave workflows."
        tabs={["Calendar", "Mandatory", "Optional", "Regional"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        monthValue={selectedMonth}
        onMonthChange={setSelectedMonth}
        actions={[
          {
            label: "Add Holiday",
            icon: <CalendarPlus className="h-4 w-4" />,
            tone: "primary",
            onClick: () => {
              setFormDate(`${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}-01`);
              setShowAddModal(true);
            },
          },
          { label: "Locations", icon: <MapPin className="h-4 w-4" />, onClick: () => setShowLocationAlert(true) },
          { label: "Rules", icon: <SlidersHorizontal className="h-4 w-4" />, onClick: () => setShowRulesAlert(true) },
          { label: "Export", icon: <Download className="h-4 w-4" />, onClick: handleExportCSV },
        ]}
        stats={[
          { label: "Holidays", value: String(holidays.filter(h => h.status === "ACTIVE").length), note: "Active count" },
          { label: "Types", value: "3", note: "Mandatory/Opt/Reg" },
          { label: "Linked", value: "Yes", note: "Attendance sync" },
        ]}
      />

      <ReferenceFlowStrip module="Holiday Calendar" />

      {/* Messages */}
      {(message || error) && (
        <div className="mb-4">
          {message && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 border border-rose-200">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Add Holiday Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1f2a44] text-white p-4 font-semibold text-sm flex justify-between items-center">
              <span>Create New Holiday</span>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white text-lg font-bold">×</button>
            </div>
            <form onSubmit={handleCreateHoliday} className="p-5 space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Holiday Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Independence Day"
                  required
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0091ff] outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0091ff] outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0091ff] outline-none"
                >
                  <option value="MANDATORY">Mandatory</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="REGIONAL">Regional</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Location (Optional)</label>
                <select
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(e.target.value)}
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#0091ff] outline-none"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-10 rounded-lg bg-[#0091ff] text-white px-4 text-xs font-semibold hover:bg-[#007cdb]"
                >
                  {submitting ? "Saving..." : "Create Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Views */}
      {activeTab === "Calendar" ? (
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#172033]">Monthly Calendar Grid</h2>
              <p className="text-xs text-muted">Mandatory, optional and regional holidays marked directly in the monthly view.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <div className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 min-w-[120px] text-center">
                {monthNames[currentMonthIdx]} {currentYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold mb-2 text-[#49637f]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="rounded-lg bg-[#eef3f8] p-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              // Find active holidays on this date
              const dayHolidays = holidays.filter(
                (h) => h.status === "ACTIVE" && h.date.slice(0, 10) === cell.dateString
              );

              return (
                <div
                  key={`${cell.dateString}-${idx}`}
                  className={`min-h-[96px] rounded-lg border p-2 flex flex-col justify-between text-left transition-all ${
                    !cell.isCurrentMonth
                      ? "border-[#f1f5f9] bg-[#f8fafc]/50 text-slate-350"
                      : dayHolidays.length
                      ? "border-blue-200 bg-blue-50/20 text-slate-800"
                      : "border-[#e8edf4] bg-white hover:bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <span className={`text-[11px] font-bold ${!cell.isCurrentMonth ? "text-slate-300" : ""}`}>
                    {cell.dateNum}
                  </span>

                  {dayHolidays.map((h) => {
                    const badgeColor =
                      h.type === "MANDATORY"
                        ? "bg-rose-50 border border-rose-100 text-rose-700"
                        : h.type === "OPTIONAL"
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                        : "bg-indigo-50 border border-indigo-100 text-indigo-700";

                    return (
                      <div
                        key={h.id}
                        className={`p-1 px-1.5 rounded text-[9px] font-bold truncate leading-tight mt-1 ${badgeColor}`}
                        title={`${h.name} (${h.type}${h.location ? ` - ${h.location.name}` : ''})`}
                      >
                        {h.name} {h.location ? `(${h.location.name})` : ''}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* List tables view for Mandatory, Optional, Regional */
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#172033]">
              {activeTab} Holiday Directory
            </h2>
            <span className="text-xs text-muted">{filteredListHolidays.length} Holidays configured</span>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm text-left text-slate-600">
              <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 font-bold">
                <tr>
                  <th className="border-b border-[#dce2eb] p-3">Holiday Name</th>
                  <th className="border-b border-[#dce2eb] p-3">Date</th>
                  <th className="border-b border-[#dce2eb] p-3">Type</th>
                  <th className="border-b border-[#dce2eb] p-3">Location</th>
                  <th className="border-b border-[#dce2eb] p-3">Status</th>
                  <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loaded && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Loading holidays from database...</td>
                  </tr>
                )}
                {loaded && !filteredListHolidays.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No {activeTab.toLowerCase()} holidays found.</td>
                  </tr>
                )}
                {filteredListHolidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="border-b border-[#dce2eb] p-3 font-semibold text-slate-800">{h.name}</td>
                    <td className="border-b border-[#dce2eb] p-3">{h.date.slice(0, 10)}</td>
                    <td className="border-b border-[#dce2eb] p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        h.type === "MANDATORY"
                          ? "bg-rose-100 text-rose-800"
                          : h.type === "OPTIONAL"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {h.type}
                      </span>
                    </td>
                    <td className="border-b border-[#dce2eb] p-3">{h.location?.name || "All Locations"}</td>
                    <td className="border-b border-[#dce2eb] p-3">
                      <StatusPill tone={h.status === "ACTIVE" ? "green" : "red"}>{h.status}</StatusPill>
                    </td>
                    <td className="border-b border-[#dce2eb] p-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(h.id, h.status)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                          h.status === "ACTIVE"
                            ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            : "bg-[#0091ff] text-white border-transparent hover:bg-[#007cdb]"
                        }`}
                      >
                        {h.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Location Alert Modal */}
      {showLocationAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-[#172033]">Location Settings</h3>
            <p className="text-sm text-[#49637f] mb-6">Location configurations and holiday mapping are managed via the central organization settings module.</p>
            <div className="flex justify-end">
              <button onClick={() => setShowLocationAlert(false)} className="rounded-lg bg-[#0091ff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007cdb]">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Alert Modal */}
      {showRulesAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-[#172033]">Holiday Rules</h3>
            <p className="text-sm text-[#49637f] mb-6">Holiday policies and compensation rules are linked directly to the attendance and payroll calculation engines.</p>
            <div className="flex justify-end">
              <button onClick={() => setShowRulesAlert(false)} className="rounded-lg bg-[#0091ff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007cdb]">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
