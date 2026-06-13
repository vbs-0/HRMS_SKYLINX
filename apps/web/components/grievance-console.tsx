"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { Card, StatusPill } from "./ui";
import { AlertTriangle, Plus, Search, ShieldAlert, CheckCircle, Eye, X, Send } from "lucide-react";

interface Grievance {
  id: string;
  title: string;
  description: string;
  anonymous: boolean;
  status: string; // PENDING, INVESTIGATING, APPROVED, REJECTED
  assignedToId?: string | null;
  employee?: { firstName: string; lastName: string } | null;
  resolution?: string | null;
  createdAt: string;
}

export function GrievanceConsole() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Panel state
  const [showAddGrievance, setShowAddGrievance] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
    loadGrievances();
    loadEmployees();
  }, []);

  async function loadUser() {
    apiFetch<any>("/auth/me")
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => undefined);
  }

  async function loadGrievances() {
    setLoading(true);
    try {
      const res = await apiFetch<Grievance[]>("/grievance");
      setGrievances(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    apiFetch<any[]>("/employees")
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch(() => undefined);
  }

  async function handleRaiseGrievance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/grievance", {
        method: "POST",
        body: JSON.stringify({
          employeeId: currentUser?.employeeId || "",
          title: String(form.get("title")),
          category: "GENERAL",
          description: String(form.get("description")),
          anonymous: form.get("anonymous") === "true",
        }),
      });
      setMessage("Grievance logged successfully. HR team has been notified.");
      setShowAddGrievance(false);
      loadGrievances();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveGrievance(id: string) {
    if (!resolutionText.trim()) return;
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/grievance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "APPROVED",
          resolution: resolutionText,
        }),
      });
      setMessage("Grievance status marked as APPROVED.");
      setSelectedGrievance(null);
      setResolutionText("");
      loadGrievances();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolution failed");
    } finally {
      setLoading(false);
    }
  }

  const filtered = grievances.filter(g =>
    (g.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.status || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHrOrAdmin = currentUser?.roles?.includes("SUPER_ADMIN") || currentUser?.roles?.includes("HR_ADMIN");

  return (
    <div className="grid gap-5">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{grievances.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Total Logged</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{grievances.filter(g => g.status !== "APPROVED" && g.status !== "REJECTED").length}</div>
            <div className="text-xs text-slate-500 font-semibold">Active investigations</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{grievances.filter(g => g.status === "APPROVED").length}</div>
            <div className="text-xs text-slate-500 font-semibold">Resolved cases</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{grievances.filter(g => g.anonymous).length}</div>
            <div className="text-xs text-slate-500 font-semibold">Anonymous filings</div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center gap-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="min-h-10 w-full rounded-lg border border-[#dce2eb] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand"
            placeholder="Search grievances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark flex items-center gap-2"
          onClick={() => setShowAddGrievance(true)}
        >
          <Plus className="h-4 w-4" /> Raise Grievance
        </button>
      </div>

      {showAddGrievance && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Log Formal Grievance</h3>
          <form onSubmit={handleRaiseGrievance} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject / Title</label>
                <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="title" placeholder="Workplace policy violation..." required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Filing Anonymity</label>
                <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="anonymous">
                  <option value="false">Identified (Include my profile name)</option>
                  <option value="true">Anonymous (Conceal identity from employee against)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Detailed Description of incident</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand h-28"
                name="description"
                placeholder="Provide dates, locations, witnesses and description of facts..."
                required
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddGrievance(false)}>Cancel</button>
              <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Submit Complaint</button>
            </div>
          </form>
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Formal Grievance Logs</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm text-left">
            <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="border-b border-[#dce2eb] p-3">Grievance Details</th>
                <th className="border-b border-[#dce2eb] p-3">Filer Identity</th>
                <th className="border-b border-[#dce2eb] p-3">Log Date</th>
                <th className="border-b border-[#dce2eb] p-3">Status</th>
                <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No grievance records logged.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="border-b border-[#eef2f6] p-3">
                      <div className="font-semibold text-slate-850">{g.title}</div>
                      <div className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{g.description}</div>
                    </td>
                    <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-600">
                      {g.anonymous ? <span className="italic text-slate-400">Anonymous</span> : `${g.employee?.firstName || "System"} ${g.employee?.lastName || "Filer"}`}
                    </td>
                    <td className="border-b border-[#eef2f6] p-3 text-xs text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border-b border-[#eef2f6] p-3">
                      <StatusPill tone={g.status === "APPROVED" ? "green" : g.status === "REJECTED" ? "red" : "yellow"}>
                        {g.status === "APPROVED" ? "RESOLVED" : g.status === "REJECTED" ? "CLOSED" : g.status}
                      </StatusPill>
                    </td>
                    <td className="border-b border-[#eef2f6] p-3 text-right">
                      <button
                        className="rounded border border-slate-200 text-slate-650 hover:bg-slate-50 font-semibold text-xs px-2.5 py-1.5 transition inline-flex items-center gap-1"
                        onClick={() => setSelectedGrievance(g)}
                      >
                        <Eye className="h-3 w-3" /> View & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* INSPECTOR & RESOLUTION MODAL */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Grievance details
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Reference ID: {selectedGrievance.id.slice(-6).toUpperCase()}</p>
              </div>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setSelectedGrievance(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Subject:</span>
                <span className="text-sm font-semibold text-slate-800">{selectedGrievance.title}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Description:</span>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{selectedGrievance.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                <div>Filer Identity: <span className="text-slate-700">{selectedGrievance.anonymous ? "Anonymous" : "Identified"}</span></div>
                <div>Log Date: <span className="text-slate-700">{new Date(selectedGrievance.createdAt).toLocaleString("en-IN")}</span></div>
              </div>
              {selectedGrievance.resolution && (
                <div className="mt-2 border-t pt-2">
                  <span className="text-xs text-emerald-600 font-bold block">Resolution Logged:</span>
                  <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg p-3 border border-emerald-100 mt-1">{selectedGrievance.resolution}</p>
                </div>
              )}
            </div>

            {isHrOrAdmin && selectedGrievance.status !== "APPROVED" && (
              <div className="border-t pt-4 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Submit Dispute Resolution</h5>
                <div className="flex gap-2">
                  <input
                    className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
                    placeholder="Enter final resolution details..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                  <button
                    className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark flex items-center gap-1.5"
                    onClick={() => handleResolveGrievance(selectedGrievance.id)}
                  >
                    <Send className="h-4 w-4" /> Resolve
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" onClick={() => setSelectedGrievance(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
