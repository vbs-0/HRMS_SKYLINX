"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { getCurrentCompanyId } from "../lib/session";
import { Card } from "./ui";
import { Info, Save, X, Calendar, UserCheck, ShieldAlert, Plus, Trash2 } from "lucide-react";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface LeavePolicy {
  id: string;
  name: string;
  description: string | null;
  assignments?: {
    id: string;
    employee: {
      firstName: string;
      lastName: string;
    };
  }[];
}

interface BlockListDate {
  id: string;
  date: string;
  reason: string;
}

interface BlockList {
  id: string;
  name: string;
  description: string | null;
  dates: BlockListDate[];
}

interface LeavePolicyPanelProps {
  initialTab?: "policies" | "blocklists";
}

export function LeavePolicyPanel({ initialTab = "policies" }: LeavePolicyPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"policies" | "blocklists">(initialTab);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [blockLists, setBlockLists] = useState<BlockList[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Leave Policy Form
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({ name: "", description: "" });

  // Leave Policy Assignment Form
  const [showAssignPolicy, setShowAssignPolicy] = useState(false);
  const [assignForm, setAssignForm] = useState({
    policyId: "",
    employeeIds: [] as string[],
    effectiveFrom: new Date().toISOString().split("T")[0],
  });

  // Block List Form
  const [showAddBlockList, setShowAddBlockList] = useState(false);
  const [blockListForm, setBlockListForm] = useState({ name: "", description: "" });

  // Block Date Form
  const [selectedBlockListId, setSelectedBlockListId] = useState<string | null>(null);
  const [blockDateForm, setBlockDateForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [empRes, polRes, blRes] = await Promise.all([
        apiFetch<EmployeeOption[]>("/employees"),
        apiFetch<LeavePolicy[]>(`/leave/policies/${getCurrentCompanyId()}`),
        apiFetch<BlockList[]>(`/leave/block-lists/${getCurrentCompanyId()}`),
      ]);

      if (empRes.data) setEmployees(empRes.data);
      if (polRes.data) setPolicies(polRes.data);
      if (blRes.data) setBlockLists(blRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load configuration data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!policyForm.name) return;
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/policies", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          ...policyForm,
        }),
      });
      setMessage("Leave policy created successfully.");
      setPolicyForm({ name: "", description: "" });
      setShowAddPolicy(false);
      loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    }
  }

  async function handleAssignPolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.policyId || !assignForm.employeeIds.length) {
      alert("Please select a policy and at least one employee.");
      return;
    }
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/policies/assign", {
        method: "POST",
        body: JSON.stringify(assignForm),
      });
      setMessage("Policy assigned successfully.");
      setAssignForm({
        policyId: "",
        employeeIds: [],
        effectiveFrom: new Date().toISOString().split("T")[0],
      });
      setShowAssignPolicy(false);
      loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign policy");
    }
  }

  async function handleCreateBlockList(e: React.FormEvent) {
    e.preventDefault();
    if (!blockListForm.name) return;
    setMessage("");
    setError("");
    try {
      await apiFetch("/leave/block-lists", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          ...blockListForm,
        }),
      });
      setMessage("Leave block list created successfully.");
      setBlockListForm({ name: "", description: "" });
      setShowAddBlockList(false);
      loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create block list");
    }
  }

  async function handleAddBlockDate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBlockListId || !blockDateForm.date || !blockDateForm.reason) {
      alert("Please enter both a date and a reason.");
      return;
    }
    setMessage("");
    setError("");
    try {
      await apiFetch(`/leave/block-lists/${selectedBlockListId}/dates`, {
        method: "POST",
        body: JSON.stringify(blockDateForm),
      });
      setMessage("Block list date added successfully.");
      setBlockDateForm({
        date: new Date().toISOString().split("T")[0],
        reason: "",
      });
      setSelectedBlockListId(null);
      loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add blocked date");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm font-semibold text-muted">Loading policy configurations...</div>;
  }

  return (
    <div className="grid gap-6">
      {/* Sub tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-0 print:hidden text-left">
        <button
          onClick={() => setActiveSubTab("policies")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === "policies" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Leave Policies
        </button>
        <button
          onClick={() => setActiveSubTab("blocklists")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === "blocklists" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Leave Block Lists
        </button>
      </div>

      {message && <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)] font-semibold text-left">{message}</div>}
      {error && <div className="rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)] font-semibold text-left">{error}</div>}

      {/* Leave Policies Section */}
      {activeSubTab === "policies" && (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Leave Policies</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Define corporate leave policies and assign them to employees.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignPolicy(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <UserCheck className="h-4 w-4" /> Assign Policy
              </button>
              <button
                onClick={() => setShowAddPolicy(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Policy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => (
              <Card key={policy.id} className="p-5 border border-[var(--border-subtle)] hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">{policy.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">{policy.description || "No description provided."}</p>
                  <hr className="border-slate-100 my-3" />
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Employees</span>
                    <div className="max-h-36 overflow-y-auto space-y-1 mt-1.5">
                      {policy.assignments && policy.assignments.length > 0 ? (
                        policy.assignments.map((as) => (
                          <div key={as.id} className="text-xs font-semibold text-slate-700 bg-slate-50 border px-2 py-1 rounded">
                            {as.employee.firstName} {as.employee.lastName}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 font-medium italic">No employees assigned yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leave Block Lists Section */}
      {activeSubTab === "blocklists" && (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[var(--border-subtle)] shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Leave Block Lists</h3>
              <p className="text-xs text-muted font-medium mt-0.5">Prevent leave requests during critical company periods.</p>
            </div>
            <button
              onClick={() => setShowAddBlockList(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Block List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockLists.map((bl) => (
              <Card key={bl.id} className="p-5 border border-[var(--border-subtle)] hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-slate-800">{bl.name}</h4>
                    <button
                      onClick={() => setSelectedBlockListId(bl.id)}
                      className="text-[11px] font-bold text-brand hover:underline"
                    >
                      + Add Date
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{bl.description || "No description provided."}</p>
                  <hr className="border-slate-100 my-3" />
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocked Dates & Reasons</span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 mt-1.5">
                      {bl.dates && bl.dates.length > 0 ? (
                        bl.dates.map((d) => (
                          <div key={d.id} className="text-xs border p-2 rounded bg-red-50/30 border-red-100 flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-bold text-slate-800">{new Date(d.date).toLocaleDateString()}</div>
                              <div className="text-slate-500 mt-0.5 font-medium">{d.reason}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 font-medium italic">No blocked dates added yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {showAddPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">Add New Leave Policy</h3>
              <button onClick={() => setShowAddPolicy(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Release Freeze Policy"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea
                  placeholder="Describe target group or applicability..."
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  className="w-full min-h-16 rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPolicy(false)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Policy Modal */}
      {showAssignPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">Assign Leave Policy</h3>
              <button onClick={() => setShowAssignPolicy(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAssignPolicy} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Policy</label>
                <select
                  required
                  value={assignForm.policyId}
                  onChange={(e) => setAssignForm({ ...assignForm, policyId: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none bg-white"
                >
                  <option value="">Select Policy</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Employees</label>
                <select
                  multiple
                  required
                  value={assignForm.employeeIds}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setAssignForm({ ...assignForm, employeeIds: options.map(o => o.value) });
                  }}
                  className="w-full min-h-24 rounded-lg border border-slate-200 p-2 text-sm focus:border-brand outline-none bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees.</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Effective From Date</label>
                <input
                  type="date"
                  required
                  value={assignForm.effectiveFrom}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignPolicy(false)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Block List Modal */}
      {showAddBlockList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">Add New Block List</h3>
              <button onClick={() => setShowAddBlockList(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateBlockList} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Block List Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Release Delivery Blackout"
                  value={blockListForm.name}
                  onChange={(e) => setBlockListForm({ ...blockListForm, name: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea
                  placeholder="e.g. Critical release window block list..."
                  value={blockListForm.description}
                  onChange={(e) => setBlockListForm({ ...blockListForm, description: e.target.value })}
                  className="w-full min-h-16 rounded-lg border border-slate-200 p-2.5 text-sm focus:border-brand outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddBlockList(false)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  Save Block List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Block Date Modal */}
      {selectedBlockListId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">Add Date to Block List</h3>
              <button onClick={() => setSelectedBlockListId(null)} className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddBlockDate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date to Block</label>
                <input
                  type="date"
                  required
                  value={blockDateForm.date}
                  onChange={(e) => setBlockDateForm({ ...blockDateForm, date: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reason for Block</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical release sprint deadline"
                  value={blockDateForm.reason}
                  onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                  className="w-full min-h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-brand outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedBlockListId(null)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  Add Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
