"use client";

import { useEffect, useState } from "react";
import { Edit2, Save, X, Info } from "lucide-react";
import { apiFetch } from "../lib/client-api";
import { Card, StatusPill } from "./ui";

interface LeaveTypeSettings {
  id: string;
  name: string;
  code: string;
  annualQuota: number;
  carryForwardAllowed: boolean;
  sandwichRuleEnabled: boolean;
  status: string;
  description: string;
  weekendsBetweenLeave: string;
  holidaysBetweenLeave: string;
  creditableOnAccrual: boolean;
  creditableOnPresentDay: boolean;
  accrualFrequency: string;
  accrualPeriod: string;
  allowedUnderProbation: boolean;
  allowedUnderNoticePeriod: boolean;
  leaveEncashEnabled: boolean;
  maxLeavesPerMonth: number;
  maxContinuousLeaves: number;
  negativeLeavesAllowed: boolean;
  futureDatedLeavesAllowed: boolean;
  backdatedLeavesAllowed: boolean;
  backdatedLeavesDaysLimit: number;
  applyNextYearTillMonth: string;
}

export function LeaveSettingsConsole() {
  const [types, setTypes] = useState<LeaveTypeSettings[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"rules" | "assignments">("rules");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({
    name: "",
    code: "",
    annualQuota: 30,
    weekendsBetweenLeave: "Not Considered",
    holidaysBetweenLeave: "Not Considered",
    sandwichRuleEnabled: false,
    creditableOnAccrual: true,
    creditableOnPresentDay: false,
    accrualFrequency: "Monthly",
    accrualPeriod: "Start",
    allowedUnderProbation: false,
    allowedUnderNoticePeriod: false,
    leaveEncashEnabled: false,
    carryForwardAllowed: false,
    description: "Custom leave type configuration.",
    maxLeavesPerMonth: 31,
    maxContinuousLeaves: 31,
    negativeLeavesAllowed: false,
    futureDatedLeavesAllowed: false,
    backdatedLeavesAllowed: true,
    backdatedLeavesDaysLimit: 90,
    applyNextYearTillMonth: "February",
  });

  async function handleCreateLeaveType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeForm.name || !newTypeForm.code) {
      setError("Please fill out name and short code.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/types", {
        method: "POST",
        body: JSON.stringify(newTypeForm),
      });
      setMessage("Leave type created successfully.");
      setShowAddModal(false);
      setNewTypeForm({
        name: "",
        code: "",
        annualQuota: 30,
        weekendsBetweenLeave: "Not Considered",
        holidaysBetweenLeave: "Not Considered",
        sandwichRuleEnabled: false,
        creditableOnAccrual: true,
        creditableOnPresentDay: false,
        accrualFrequency: "Monthly",
        accrualPeriod: "Start",
        allowedUnderProbation: false,
        allowedUnderNoticePeriod: false,
        leaveEncashEnabled: false,
        carryForwardAllowed: false,
        description: "Custom leave type configuration.",
        maxLeavesPerMonth: 31,
        maxContinuousLeaves: 31,
        negativeLeavesAllowed: false,
        futureDatedLeavesAllowed: false,
        backdatedLeavesAllowed: true,
        backdatedLeavesDaysLimit: 90,
        applyNextYearTillMonth: "February",
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create leave type");
    } finally {
      setSubmitting(false);
    }
  }

  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LeaveTypeSettings>>({});
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, "general" | "advanced">>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedAssignTypes, setSelectedAssignTypes] = useState<string[]>([]);
  const [assignEffectiveDate, setAssignEffectiveDate] = useState("2026-06-06");

  function loadAssignments() {
    apiFetch<any[]>("/leave/assignments")
      .then((body) => {
        if (body.data) {
          setAssignments(body.data);
        }
      })
      .catch((err) => console.error("Failed to load assignments", err));
  }

  function load() {
    setLoading(true);
    apiFetch<LeaveTypeSettings[]>("/leave/types")
      .then((body) => {
        if (body.data) {
          setTypes(body.data);
          const initialTabs: Record<string, "general" | "advanced"> = {};
          body.data.forEach((t) => {
            initialTabs[t.id] = "general";
          });
          setActiveSubTabs(initialTabs);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load leave settings"))
      .finally(() => setLoading(false));

    loadAssignments();
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssignRules(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmpIds.length) {
      alert("Please select at least one employee.");
      return;
    }
    if (!selectedAssignTypes.length) {
      alert("Please select at least one leave rule.");
      return;
    }
    try {
      await apiFetch("/leave/assignments", {
        method: "POST",
        body: JSON.stringify({
          employeeIds: selectedEmpIds,
          leaveTypeIds: selectedAssignTypes,
          effectiveDate: assignEffectiveDate,
        }),
      });
      setMessage("Rules assigned successfully.");
      setShowAssignPopup(false);
      setSelectedEmpIds([]);
      setSelectedAssignTypes([]);
      loadAssignments();
    } catch (err) {
      setError("Failed to assign rules.");
    }
  }

  async function handleBulkDelete() {
    if (!selectedEmpIds.length) {
      alert("Please select at least one employee.");
      return;
    }
    if (!confirm("Are you sure you want to unassign all leave rules for the selected employees?")) {
      return;
    }
    try {
      await apiFetch("/leave/assignments/delete", {
        method: "POST",
        body: JSON.stringify({
          employeeIds: selectedEmpIds,
          leaveTypeIds: types.map(t => t.id),
        }),
      });
      setMessage("Selected employee leave rules deleted successfully.");
      setSelectedEmpIds([]);
      loadAssignments();
    } catch (err) {
      setError("Failed to bulk delete rules.");
    }
  }

  async function handleRemoveSingleRule(employeeId: string, leaveTypeId: string) {
    try {
      await apiFetch("/leave/assignments/delete", {
        method: "POST",
        body: JSON.stringify({
          employeeIds: [employeeId],
          leaveTypeIds: [leaveTypeId],
        }),
      });
      loadAssignments();
    } catch (err) {
      setError("Failed to remove rule.");
    }
  }

  function handleEditClick(type: LeaveTypeSettings) {
    setEditingId(type.id);
    setEditForm(type);
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleSave(id: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/leave/types/${id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setMessage("Leave settings saved successfully.");
      setEditingId(null);
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update leave settings");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm font-semibold text-muted">Loading leave configurations...</div>;
  }

  return (
    <div className="grid gap-6">
      {/* Tab subnavigation */}
      <div className="flex gap-4 border-b border-slate-200 pb-0 print:hidden text-left">
        <button
          onClick={() => setActiveConsoleTab("rules")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeConsoleTab === "rules" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Leave Rules
        </button>
        <button
          onClick={() => setActiveConsoleTab("assignments")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeConsoleTab === "assignments" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Assign Leave Rules
        </button>
      </div>

      {message ? <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold transition-all">{message}</div> : null}
      {error ? <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold transition-all">{error}</div> : null}

      {activeConsoleTab === "rules" && (
        <>
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[#e8edf4] shadow-sm text-left">
            <div>
              <h3 className="text-base font-semibold text-[#172033]">Leave Policy Setup</h3>
              <p className="text-xs text-muted">Configure active annual quotas, accrual intervals and probation applicability rules.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white cursor-pointer hover:bg-brand/90 transition-all shadow-sm"
            >
              + Add Leave Type
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {types.map((type) => {
              const isEditing = editingId === type.id;
              const activeSubTab = activeSubTabs[type.id] || "general";
              const isPaternity = type.code === "PL" || type.name.toLowerCase().includes("paternity");
              const isCompOff = type.code === "COMP_OFF" || type.name.toLowerCase().includes("comp");

              return (
                <Card key={type.id} className="relative overflow-hidden transition-all duration-300 hover:shadow-md border border-[#e8edf4]">
                  {/* Header block */}
                  <div className="flex items-center justify-between border-b border-[#eef3f8] pb-3 mb-4">
                    <div className="grid gap-1 text-left">
                      {isEditing ? (
                        <input
                          type="text"
                          className="min-h-8 text-lg font-bold rounded border border-[#dce2eb] px-2 text-ink outline-none focus:border-brand"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <h2 className="text-xl font-bold text-[#172033]">{type.name}</h2>
                      )}
                      {/* Tabs: General Settings vs Advanced Settings */}
                      <div className="flex gap-4 mt-2">
                        <button
                          onClick={() => setActiveSubTabs({ ...activeSubTabs, [type.id]: "general" })}
                          className={`text-sm font-semibold pb-1 border-b-2 transition-all ${
                            activeSubTab === "general" ? "border-brand text-brand" : "border-transparent text-muted hover:text-[#172033]"
                          }`}
                        >
                          General Settings
                        </button>
                        <button
                          onClick={() => setActiveSubTabs({ ...activeSubTabs, [type.id]: "advanced" })}
                          className={`text-sm font-semibold pb-1 border-b-2 transition-all flex items-center gap-2 ${
                            activeSubTab === "advanced" ? "border-brand text-brand" : "border-transparent text-muted hover:text-[#172033]"
                          }`}
                        >
                          Advanced Settings <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold select-none">!</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSave(type.id)}
                            className="p-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-all flex items-center gap-1 text-xs font-semibold"
                          >
                            <Save className="h-4 w-4" /> Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 rounded-lg border border-[#dce2eb] bg-white text-muted hover:bg-slate-50 transition-all flex items-center gap-1 text-xs font-semibold"
                          >
                            <X className="h-4 w-4" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(type)}
                          className="p-2 rounded-full text-muted hover:text-brand hover:bg-[#f3f7fb] transition-all"
                          title="Edit Settings"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab Contents */}
                  {activeSubTab === "general" ? (
                    <div className="grid gap-5 text-left">
                      {/* Description block */}
                      <div className="grid gap-1">
                        <div className="flex items-center gap-1 text-xs font-bold uppercase text-[#8ca0bf]">
                          Description <Info className="h-3.5 w-3.5 text-muted cursor-help" />
                        </div>
                        {isEditing ? (
                          <textarea
                            className="min-h-16 rounded-lg border border-[#dce2eb] p-2.5 text-sm outline-none focus:border-brand text-ink w-full"
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-[#49637f]">{type.description}</p>
                        )}
                      </div>

                      {/* Short Name block */}
                      <div className="grid gap-1">
                        <div className="flex items-center gap-1 text-xs font-bold uppercase text-[#8ca0bf]">
                          Leave Short Name <Info className="h-3.5 w-3.5 text-muted" />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            className="max-w-[120px] min-h-9 rounded-lg border border-[#dce2eb] px-3 text-sm text-ink outline-none focus:border-brand"
                            value={editForm.code || ""}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-semibold text-[#172033]">{type.code || "--"}</p>
                        )}
                      </div>

                      <hr className="border-[#eef3f8]" />

                      {/* Leaves count table Grid */}
                      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
                        {/* Column 1: Leaves Count */}
                        <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4">
                          <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                            Leaves Count <Info className="h-3.5 w-3.5 text-muted" />
                          </h4>
                          <div className="grid gap-3">
                            {!isCompOff && (
                              <div>
                                <div className="text-xs font-semibold text-[#6d7f98]">Leaves Allowed {!isPaternity && "in a Year"}</div>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="mt-1 max-w-[100px] min-h-8 rounded border border-[#dce2eb] px-2 text-sm text-ink"
                                    value={editForm.annualQuota ?? 0}
                                    onChange={(e) => setEditForm({ ...editForm, annualQuota: Number(e.target.value) })}
                                  />
                                ) : (
                                  <div className="text-base font-bold text-[#172033]">{Number(type.annualQuota).toFixed(1)}</div>
                                )}
                              </div>
                            )}
                            {!isPaternity && (
                              <>
                                <div>
                                  <div className="text-xs font-semibold text-[#6d7f98]">Weekends Between Leave</div>
                                  {isEditing ? (
                                    <select
                                      className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                      value={editForm.weekendsBetweenLeave || "Not Considered"}
                                      onChange={(e) => setEditForm({ ...editForm, weekendsBetweenLeave: e.target.value })}
                                    >
                                      <option value="Not Considered">Not Considered</option>
                                      <option value="Considered">Considered</option>
                                    </select>
                                  ) : (
                                    <div className="text-sm font-semibold text-[#172033]">{type.weekendsBetweenLeave}</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[#6d7f98]">Holidays Between Leave</div>
                                  {isEditing ? (
                                    <select
                                      className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                      value={editForm.holidaysBetweenLeave || "Not Considered"}
                                      onChange={(e) => setEditForm({ ...editForm, holidaysBetweenLeave: e.target.value })}
                                    >
                                      <option value="Not Considered">Not Considered</option>
                                      <option value="Considered">Considered</option>
                                    </select>
                                  ) : (
                                    <div className="text-sm font-semibold text-[#172033]">{type.holidaysBetweenLeave}</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[#6d7f98]">Sandwich Rule Enabled</div>
                                  {isEditing ? (
                                    <select
                                      className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm bg-white"
                                      value={editForm.sandwichRuleEnabled ? "Yes" : "No"}
                                      onChange={(e) => setEditForm({ ...editForm, sandwichRuleEnabled: e.target.value === "Yes" })}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  ) : (
                                    <div className="text-sm font-semibold text-[#172033]">{type.sandwichRuleEnabled ? "Yes" : "No"}</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Accrual */}
                        {!isPaternity && !isCompOff ? (
                          <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4">
                            <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                              Accrual <Info className="h-3.5 w-3.5 text-muted" />
                            </h4>
                            <div className="grid gap-3 text-sm">
                              <div>
                                <div className="text-xs font-semibold text-[#6d7f98]">Creditable On Accrual Basis</div>
                                {isEditing ? (
                                  <select
                                    className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                    value={editForm.creditableOnAccrual ? "Yes" : "No"}
                                    onChange={(e) => setEditForm({ ...editForm, creditableOnAccrual: e.target.value === "Yes" })}
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : (
                                  <div className="font-semibold text-[#172033]">{type.creditableOnAccrual ? "Yes" : "No"}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-[#6d7f98]">Creditable On Present Day Basis</div>
                                {isEditing ? (
                                  <select
                                    className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                    value={editForm.creditableOnPresentDay ? "Yes" : "No"}
                                    onChange={(e) => setEditForm({ ...editForm, creditableOnPresentDay: e.target.value === "Yes" })}
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : (
                                  <div className="font-semibold text-[#172033]">{type.creditableOnPresentDay ? "Yes" : "No"}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-[#6d7f98]">Accrual Frequency</div>
                                {isEditing ? (
                                  <select
                                    className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                    value={editForm.accrualFrequency || "Monthly"}
                                    onChange={(e) => setEditForm({ ...editForm, accrualFrequency: e.target.value })}
                                  >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Yearly">Yearly</option>
                                  </select>
                                ) : (
                                  <div className="font-semibold text-[#172033]">{type.accrualFrequency}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-[#6d7f98]">Accrual Period</div>
                                {isEditing ? (
                                  <select
                                    className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                    value={editForm.accrualPeriod || "Start"}
                                    onChange={(e) => setEditForm({ ...editForm, accrualPeriod: e.target.value })}
                                  >
                                    <option value="Start">Start</option>
                                    <option value="End">End</option>
                                  </select>
                                ) : (
                                  <div className="font-semibold text-[#172033]">{type.accrualPeriod}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-4 flex flex-col items-center justify-center text-center text-xs text-muted">
                            <Info className="h-5 w-5 mb-2 text-slate-400" />
                            Accrual settings are not applicable to {type.name}.
                          </div>
                        )}

                        {/* Column 3: Applicability & Options */}
                        <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4 col-span-1">
                          <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                            Applicability <Info className="h-3.5 w-3.5 text-muted" />
                          </h4>
                          <div className="grid gap-3 text-sm">
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Allowed under Probation</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                  value={editForm.allowedUnderProbation ? "Yes" : "No"}
                                  onChange={(e) => setEditForm({ ...editForm, allowedUnderProbation: e.target.value === "Yes" })}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.allowedUnderProbation ? "Yes" : "No"}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Allowed under Notice Period</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                  value={editForm.allowedUnderNoticePeriod ? "Yes" : "No"}
                                  onChange={(e) => setEditForm({ ...editForm, allowedUnderNoticePeriod: e.target.value === "Yes" })}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.allowedUnderNoticePeriod ? "Yes" : "No"}</div>
                              )}
                            </div>
                            {!isPaternity && !isCompOff && (
                              <>
                                <div>
                                  <div className="text-xs font-semibold text-[#6d7f98]">Leave Encash Enabled</div>
                                  {isEditing ? (
                                    <select
                                      className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                      value={editForm.leaveEncashEnabled ? "Yes" : "No"}
                                      onChange={(e) => setEditForm({ ...editForm, leaveEncashEnabled: e.target.value === "Yes" })}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  ) : (
                                    <div className="font-semibold text-[#172033]">{type.leaveEncashEnabled ? "Yes" : "No"}</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-[#6d7f98]">Carry Forward Enabled</div>
                                  {isEditing ? (
                                    <select
                                      className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm"
                                      value={editForm.carryForwardAllowed ? "Yes" : "No"}
                                      onChange={(e) => setEditForm({ ...editForm, carryForwardAllowed: e.target.value === "Yes" })}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  ) : (
                                    <div className="font-semibold text-[#172033]">{type.carryForwardAllowed ? "Yes" : "No"}</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Advanced Settings tab content */
                    <div className="grid gap-5 text-left">
                      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
                        {/* Column 1: Leaves Count */}
                        <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4">
                          <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                            Leaves Count <Info className="h-3.5 w-3.5 text-muted" />
                          </h4>
                          <div className="grid gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Max. Leaves Allowed in a Month</div>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="mt-1 max-w-[100px] min-h-8 rounded border border-[#dce2eb] px-2 text-sm text-ink"
                                  value={editForm.maxLeavesPerMonth ?? 31}
                                  onChange={(e) => setEditForm({ ...editForm, maxLeavesPerMonth: Number(e.target.value) })}
                                />
                              ) : (
                                <div className="text-base font-bold text-[#172033]">{Number(type.maxLeavesPerMonth ?? 31).toFixed(2)}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Continuous Leaves Allowed</div>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="mt-1 max-w-[100px] min-h-8 rounded border border-[#dce2eb] px-2 text-sm text-ink"
                                  value={editForm.maxContinuousLeaves ?? 31}
                                  onChange={(e) => setEditForm({ ...editForm, maxContinuousLeaves: Number(e.target.value) })}
                                />
                              ) : (
                                <div className="text-sm font-bold text-[#172033]">{type.maxContinuousLeaves ?? 31}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Applicability */}
                        <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4">
                          <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                            Applicability <Info className="h-3.5 w-3.5 text-muted" />
                          </h4>
                          <div className="grid gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Negative Leaves Allowed</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm bg-white"
                                  value={editForm.negativeLeavesAllowed ? "Yes" : "No"}
                                  onChange={(e) => setEditForm({ ...editForm, negativeLeavesAllowed: e.target.value === "Yes" })}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <div className="text-sm font-semibold text-[#172033]">{type.negativeLeavesAllowed ? "Yes" : "No"}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Miscellaneous */}
                        <div className="rounded-lg bg-[#f8fafc] border border-[#e8edf4] p-4">
                          <h4 className="text-xs font-bold uppercase text-[#8ca0bf] mb-3 flex items-center gap-1">
                            Miscellaneous <Info className="h-3.5 w-3.5 text-muted" />
                          </h4>
                          <div className="grid gap-3 text-sm">
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Future-dated Leaves Allowed</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm bg-white"
                                  value={editForm.futureDatedLeavesAllowed ? "Yes" : "No"}
                                  onChange={(e) => setEditForm({ ...editForm, futureDatedLeavesAllowed: e.target.value === "Yes" })}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.futureDatedLeavesAllowed ? "Yes" : "No"}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Backdated Leaves Allowed</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm bg-white"
                                  value={editForm.backdatedLeavesAllowed ? "Yes" : "No"}
                                  onChange={(e) => setEditForm({ ...editForm, backdatedLeavesAllowed: e.target.value === "Yes" })}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.backdatedLeavesAllowed ? "Yes" : "No"}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Backdated Leaves Allowed up to</div>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="mt-1 max-w-[100px] min-h-8 rounded border border-[#dce2eb] px-2 text-sm text-ink bg-white"
                                  value={editForm.backdatedLeavesDaysLimit ?? 90}
                                  onChange={(e) => setEditForm({ ...editForm, backdatedLeavesDaysLimit: Number(e.target.value) })}
                                />
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.backdatedLeavesDaysLimit ?? 90} Days</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[#6d7f98]">Apply Leaves for Next Year Till</div>
                              {isEditing ? (
                                <select
                                  className="mt-1 min-h-8 rounded border border-[#dce2eb] px-2 text-sm bg-white"
                                  value={editForm.applyNextYearTillMonth || "February"}
                                  onChange={(e) => setEditForm({ ...editForm, applyNextYearTillMonth: e.target.value })}
                                >
                                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="font-semibold text-[#172033]">{type.applyNextYearTillMonth || "February"}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Assign Leave Rules tab */}
      {activeConsoleTab === "assignments" && (
        <div className="bg-white rounded-lg border border-[#e8edf4] p-5 shadow-sm space-y-4 text-left">
          {/* Sub-header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-[#cbd5e1] pl-3 pr-8 text-xs outline-none focus:border-brand"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>

              {/* Assign Rules Popup Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowAssignPopup(!showAssignPopup)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  <span>Assign Rules</span>
                </button>

                {/* Popover Card dropdown */}
                {showAssignPopup && (
                  <div className="absolute left-0 mt-2 z-30 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500 border-b pb-1">Select Rule</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {types.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedAssignTypes.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssignTypes([...selectedAssignTypes, t.id]);
                              } else {
                                setSelectedAssignTypes(selectedAssignTypes.filter(id => id !== t.id));
                              }
                            }}
                            className="rounded border-[#cbd5e1] text-brand focus:ring-brand h-3.5 w-3.5"
                          />
                          <span>{t.name}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Effective Date</label>
                      <input
                        type="date"
                        value={assignEffectiveDate}
                        onChange={(e) => setAssignEffectiveDate(e.target.value)}
                        className="w-full min-h-8 rounded border border-slate-200 px-2 text-xs focus:border-brand outline-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setShowAssignPopup(false)}
                        className="min-h-8 rounded border border-slate-200 px-3 text-[10px] font-bold hover:bg-slate-50"
                      >
                        CANCEL
                      </button>
                      <button
                        type="button"
                        onClick={handleAssignRules}
                        className="min-h-8 rounded bg-brand text-white px-3 text-[10px] font-bold hover:bg-brand/90"
                      >
                        APPLY
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk Delete */}
              <button
                onClick={handleBulkDelete}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                <span>Bulk Delete</span>
              </button>

              {/* Import */}
              <button
                onClick={() => alert("Excel/CSV template assignment import triggered.")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#ed174f] px-4 text-xs font-bold text-white hover:bg-[#ed174f]/90 transition"
              >
                <span>Import</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Show</span>
              <select className="min-h-9 rounded-lg border px-2.5 bg-white text-slate-700 outline-none">
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedEmpIds.length > 0 && selectedEmpIds.length === assignments.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmpIds(assignments.map(a => a.id));
                        } else {
                          setSelectedEmpIds([]);
                        }
                      }}
                      className="rounded border-[#cbd5e1] text-brand focus:ring-brand h-3.5 w-3.5"
                    />
                  </th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Manager</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rules Applied</th>
                </tr>
              </thead>
              <tbody>
                {assignments.filter(row => 
                  row.name.toLowerCase().includes(assignSearch.toLowerCase()) || 
                  row.employeeCode.toLowerCase().includes(assignSearch.toLowerCase())
                ).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmpIds([...selectedEmpIds, row.id]);
                          } else {
                            setSelectedEmpIds(selectedEmpIds.filter(id => id !== row.id));
                          }
                        }}
                        className="rounded border-[#cbd5e1] text-brand focus:ring-brand h-3.5 w-3.5"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{row.employeeCode}</td>
                    <td className="p-3 font-bold text-slate-900">{row.name}</td>
                    <td className="p-3 text-slate-650">{row.managerName}</td>
                    <td className="p-3 text-slate-650">{row.employmentType}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {row.rulesApplied.map((rule: any) => (
                          <span
                            key={rule.leaveTypeId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/50 px-2.5 py-0.5"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white uppercase shrink-0">
                              {rule.code[0] || rule.name[0]}
                            </span>
                            <span className="text-[10px] font-semibold text-[#1e3a8a]">{rule.name}</span>
                            <button
                              onClick={() => handleRemoveSingleRule(row.id, rule.leaveTypeId)}
                              className="text-blue-400 hover:text-rose-500 font-bold ml-1 text-xs leading-none"
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            setSelectedEmpIds([row.id]);
                            setShowAssignPopup(true);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 hover:bg-[#dbeafe] text-slate-600 hover:text-brand transition font-bold text-xs"
                          title="Assign Rule"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-150 pt-4 text-xs font-semibold text-slate-500">
            <span>Showing 1 to {assignments.length} of {assignments.length} records</span>
            <div className="flex gap-2">
              <button disabled className="rounded border px-3 py-1 cursor-not-allowed opacity-50 bg-[#f8fafc]">PREVIOUS</button>
              <button className="rounded bg-brand text-white px-3 py-1">1</button>
              <button disabled className="rounded border px-3 py-1 cursor-not-allowed opacity-50 bg-[#f8fafc]">NEXT</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1f2a44] text-white p-4 font-semibold text-sm flex justify-between items-center">
              <span>Create Custom Leave Type</span>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleCreateLeaveType} className="p-6 overflow-y-auto space-y-4 text-sm text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">Leave Name</label>
                  <input
                    value={newTypeForm.name}
                    onChange={(e) => setNewTypeForm({ ...newTypeForm, name: e.target.value })}
                    placeholder="e.g. Wedding Leave"
                    required
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">Short Code</label>
                  <input
                    value={newTypeForm.code}
                    onChange={(e) => setNewTypeForm({ ...newTypeForm, code: e.target.value })}
                    placeholder="e.g. WL"
                    required
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  value={newTypeForm.description}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, description: e.target.value })}
                  placeholder="Enter policy description..."
                  className="min-h-16 rounded-lg border border-slate-200 p-2 text-sm focus:border-brand outline-none"
                />
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-xs font-bold uppercase text-slate-800">General Settings</h4>

              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                {/* Section 1: Leaves Count */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Leaves Count</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Leaves Allowed in a Year</label>
                    <input
                      type="number"
                      value={newTypeForm.annualQuota}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, annualQuota: Number(e.target.value) })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Weekends Between Leave</label>
                    <select
                      value={newTypeForm.weekendsBetweenLeave}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, weekendsBetweenLeave: e.target.value })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Not Considered">Not Considered</option>
                      <option value="Considered">Considered</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Holidays Between Leave</label>
                    <select
                      value={newTypeForm.holidaysBetweenLeave}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, holidaysBetweenLeave: e.target.value })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Not Considered">Not Considered</option>
                      <option value="Considered">Considered</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Sandwich Rule Enabled</label>
                    <select
                      value={newTypeForm.sandwichRuleEnabled ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, sandwichRuleEnabled: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Accrual */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Accrual</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Creditable On Accrual Basis</label>
                    <select
                      value={newTypeForm.creditableOnAccrual ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, creditableOnAccrual: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Creditable On Present Day Basis</label>
                    <select
                      value={newTypeForm.creditableOnPresentDay ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, creditableOnPresentDay: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Accrual Frequency</label>
                    <select
                      value={newTypeForm.accrualFrequency}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, accrualFrequency: e.target.value })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Accrual Period</label>
                    <select
                      value={newTypeForm.accrualPeriod}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, accrualPeriod: e.target.value })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Start">Start</option>
                      <option value="End">End</option>
                    </select>
                  </div>
                </div>

                {/* Section 3: Applicability */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Applicability</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Allowed under Probation</label>
                    <select
                      value={newTypeForm.allowedUnderProbation ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, allowedUnderProbation: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Allowed under Notice Period</label>
                    <select
                      value={newTypeForm.allowedUnderNoticePeriod ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, allowedUnderNoticePeriod: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Leave Encash Enabled</label>
                    <select
                      value={newTypeForm.leaveEncashEnabled ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, leaveEncashEnabled: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Carry Forward Enabled</label>
                    <select
                      value={newTypeForm.carryForwardAllowed ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, carryForwardAllowed: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-xs font-bold uppercase text-slate-800">Advanced Settings</h4>

              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                {/* Section 4: Leaves Count (Advanced) */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Leaves Count</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Max. Leaves Allowed in a Month</label>
                    <input
                      type="number"
                      value={newTypeForm.maxLeavesPerMonth}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, maxLeavesPerMonth: Number(e.target.value) })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Continuous Leaves Allowed</label>
                    <input
                      type="number"
                      value={newTypeForm.maxContinuousLeaves}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, maxContinuousLeaves: Number(e.target.value) })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Section 5: Applicability (Advanced) */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Applicability</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Negative Leaves Allowed</label>
                    <select
                      value={newTypeForm.negativeLeavesAllowed ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, negativeLeavesAllowed: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Section 6: Miscellaneous (Advanced) */}
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1 border-b pb-1">Miscellaneous</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Future-dated Leaves Allowed</label>
                    <select
                      value={newTypeForm.futureDatedLeavesAllowed ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, futureDatedLeavesAllowed: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Backdated Leaves Allowed</label>
                    <select
                      value={newTypeForm.backdatedLeavesAllowed ? "Yes" : "No"}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, backdatedLeavesAllowed: e.target.value === "Yes" })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Backdated Allowed up to (Days)</label>
                    <input
                      type="number"
                      value={newTypeForm.backdatedLeavesDaysLimit}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, backdatedLeavesDaysLimit: Number(e.target.value) })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Apply next year till month</label>
                    <select
                      value={newTypeForm.applyNextYearTillMonth}
                      onChange={(e) => setNewTypeForm({ ...newTypeForm, applyNextYearTillMonth: e.target.value })}
                      className="mt-1 w-full min-h-8 rounded border border-slate-200 px-2 text-sm bg-white"
                    >
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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
                  className="min-h-10 rounded-lg bg-brand text-white px-4 text-xs font-semibold hover:bg-brand/90"
                >
                  {submitting ? "Saving..." : "Create Leave Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

