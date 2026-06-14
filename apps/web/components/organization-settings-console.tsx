"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/client-api";
import { requestDataRefresh } from "../lib/refresh-events";
import { Card } from "./ui";
import { Plus, Trash2, Edit3, Save, X, Building2, Briefcase, MapPin } from "lucide-react";

export function OrganizationSettingsConsole() {
  const [activeTab, setActiveTab] = useState<"Departments" | "Designations" | "Locations">("Departments");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Create forms state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form inputs
  const [deptForm, setDeptForm] = useState({ name: "", code: "", status: "ACTIVE" });
  const [desigForm, setDesigForm] = useState({ title: "", grade: "", status: "ACTIVE" });
  const [locForm, setLocForm] = useState({ name: "", address: "", city: "", state: "", country: "India", status: "ACTIVE" });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  function loadData() {
    setLoading(true);
    setError("");
    setMessage("");
    
    if (activeTab === "Departments") {
      apiFetch<any[]>("/organization/departments")
        .then((res) => setDepartments(res.data || []))
        .catch((err) => setError(err.message || "Failed to load departments"))
        .finally(() => setLoading(false));
    } else if (activeTab === "Designations") {
      apiFetch<any[]>("/organization/designations")
        .then((res) => setDesignations(res.data || []))
        .catch((err) => setError(err.message || "Failed to load designations"))
        .finally(() => setLoading(false));
    } else if (activeTab === "Locations") {
      apiFetch<any[]>("/organization/locations")
        .then((res) => setLocations(res.data || []))
        .catch((err) => setError(err.message || "Failed to load locations"))
        .finally(() => setLoading(false));
    }
  }

  // CREATE handlers
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (activeTab === "Departments") {
        await apiFetch("/organization/departments", {
          method: "POST",
          body: JSON.stringify(deptForm),
        });
        setMessage("Department created successfully!");
        setDeptForm({ name: "", code: "", status: "ACTIVE" });
      } else if (activeTab === "Designations") {
        await apiFetch("/organization/designations", {
          method: "POST",
          body: JSON.stringify(desigForm),
        });
        setMessage("Designation created successfully!");
        setDesigForm({ title: "", grade: "", status: "ACTIVE" });
      } else if (activeTab === "Locations") {
        await apiFetch("/organization/locations", {
          method: "POST",
          body: JSON.stringify(locForm),
        });
        setMessage("Location created successfully!");
        setLocForm({ name: "", address: "", city: "", state: "", country: "India", status: "ACTIVE" });
      }
      setShowAddModal(false);
      loadData();
      requestDataRefresh("organization");
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  // UPDATE handlers
  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const id = editingItem.id;
      if (activeTab === "Departments") {
        await apiFetch(`/organization/departments/${id}`, {
          method: "PATCH",
          body: JSON.stringify(deptForm),
        });
        setMessage("Department updated successfully!");
      } else if (activeTab === "Designations") {
        await apiFetch(`/organization/designations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(desigForm),
        });
        setMessage("Designation updated successfully!");
      } else if (activeTab === "Locations") {
        await apiFetch(`/organization/locations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(locForm),
        });
        setMessage("Location updated successfully!");
      }
      setEditingItem(null);
      loadData();
      requestDataRefresh("organization");
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  // DELETE handlers
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      let url = "";
      if (activeTab === "Departments") url = `/organization/departments/${id}`;
      else if (activeTab === "Designations") url = `/organization/designations/${id}`;
      else if (activeTab === "Locations") url = `/organization/locations/${id}`;

      await apiFetch(url, { method: "DELETE" });
      setMessage("Item deleted successfully!");
      loadData();
      requestDataRefresh("organization");
    } catch (err: any) {
      setError(err.message || "Deletion failed. Make sure no employees are currently assigned to this entry.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: any) {
    setEditingItem(item);
    if (activeTab === "Departments") {
      setDeptForm({ name: item.name, code: item.code, status: item.status });
    } else if (activeTab === "Designations") {
      setDesigForm({ title: item.title, grade: item.grade || "", status: item.status });
    } else if (activeTab === "Locations") {
      setLocForm({
        name: item.name,
        address: item.address || "",
        city: item.city,
        state: item.state,
        country: item.country || "India",
        status: item.status,
      });
    }
  }

  function inputClass() {
    return "min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-brand";
  }

  return (
    <div className="grid gap-5">
      {message && <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)] font-semibold">{error}</div>}

      {/* Sub-tab selection */}
      <div className="flex border-b border-slate-200">
        {(["Departments", "Designations", "Locations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setEditingItem(null);
              setShowAddModal(false);
            }}
            className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all focus:outline-none ${
              activeTab === tab
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="p-5 border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {activeTab === "Departments" && <Building2 className="h-5 w-5 text-brand" />}
            {activeTab === "Designations" && <Briefcase className="h-5 w-5 text-brand" />}
            {activeTab === "Locations" && <MapPin className="h-5 w-5 text-brand" />}
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">{activeTab} List</h3>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add {activeTab.slice(0, -1)}
          </button>
        </div>

        {/* Modal for Create or Edit */}
        {(showAddModal || editingItem) && (
          <div className="mb-6 rounded-xl border border-brand/20 bg-brand/5 p-5 animate-in slide-in-from-top duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
              </h4>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleUpdateSubmit : handleAddSubmit} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {activeTab === "Departments" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Department Name</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. Research & Development"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Code / Abbreviation</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. RND"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select
                      className={inputClass()}
                      value={deptForm.status}
                      onChange={(e) => setDeptForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "Designations" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Designation Title</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. Principal Scientist"
                      value={desigForm.title}
                      onChange={(e) => setDesigForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Grade Level (Optional)</label>
                    <input
                      className={inputClass()}
                      placeholder="e.g. G5"
                      value={desigForm.grade}
                      onChange={(e) => setDesigForm((prev) => ({ ...prev, grade: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select
                      className={inputClass()}
                      value={desigForm.status}
                      onChange={(e) => setDesigForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "Locations" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Location Name</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. Headquarters / Tech Hub"
                      value={locForm.name}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. Chennai"
                      value={locForm.city}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                    <input
                      className={inputClass()}
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={locForm.state}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Address (Optional)</label>
                    <input
                      className={inputClass()}
                      placeholder="Street address detail"
                      value={locForm.address}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Country</label>
                    <input
                      className={inputClass()}
                      placeholder="India"
                      value={locForm.country}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select
                      className={inputClass()}
                      value={locForm.status}
                      onChange={(e) => setLocForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </>
              )}

              <div className="col-span-full flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                >
                  {loading ? "Saving..." : editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Data list tables */}
        <div className="overflow-auto">
          {loading && !showAddModal && !editingItem ? (
            <div className="text-center text-xs text-slate-400 py-8">Loading lists from database...</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[var(--surface-sunken)] uppercase text-slate-500 tracking-wider font-semibold">
                {activeTab === "Departments" && (
                  <tr>
                    <th className="p-3 border-b border-slate-100">Code</th>
                    <th className="p-3 border-b border-slate-100">Name</th>
                    <th className="p-3 border-b border-slate-100">Status</th>
                    <th className="p-3 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "Designations" && (
                  <tr>
                    <th className="p-3 border-b border-slate-100">Title</th>
                    <th className="p-3 border-b border-slate-100">Grade</th>
                    <th className="p-3 border-b border-slate-100">Status</th>
                    <th className="p-3 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                )}
                {activeTab === "Locations" && (
                  <tr>
                    <th className="p-3 border-b border-slate-100">Name</th>
                    <th className="p-3 border-b border-slate-100">City / State</th>
                    <th className="p-3 border-b border-slate-100">Country</th>
                    <th className="p-3 border-b border-slate-100">Status</th>
                    <th className="p-3 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === "Departments" && (
                  departments.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-semibold">No departments found.</td></tr>
                  ) : (
                    departments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{item.code}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.status}</span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => startEdit(item)} className="p-1.5 border rounded-lg hover:border-brand/40 text-slate-600 hover:text-brand transition"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 border rounded-lg hover:border-red-400 text-slate-600 hover:text-red-600 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === "Designations" && (
                  designations.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-semibold">No designations found.</td></tr>
                  ) : (
                    designations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{item.title}</td>
                        <td className="p-3 font-mono text-slate-500 font-semibold">{item.grade || "-"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.status}</span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => startEdit(item)} className="p-1.5 border rounded-lg hover:border-brand/40 text-slate-600 hover:text-brand transition"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 border rounded-lg hover:border-red-400 text-slate-600 hover:text-red-600 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === "Locations" && (
                  locations.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400 font-semibold">No locations found.</td></tr>
                  ) : (
                    locations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-slate-600 font-semibold">{item.city}, {item.state}</td>
                        <td className="p-3 text-slate-500">{item.country}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{item.status}</span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => startEdit(item)} className="p-1.5 border rounded-lg hover:border-brand/40 text-slate-600 hover:text-brand transition"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 border rounded-lg hover:border-red-400 text-slate-600 hover:text-red-600 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

