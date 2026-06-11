"use client";

import { BriefcaseBusiness, Check, RotateCcw, PackagePlus, UserRound, CheckCircle2, Download, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { useEmployeeOptions } from "../lib/options";
import { Card, MetricCard, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { fallbackAssets } from "../lib/fallback-data";
import { emptyAssets } from "../lib/live-data";

type AssetsData = typeof fallbackAssets;
type AssetRow = AssetsData["rows"][number];
interface AssetLog {
  id: string;
  action: string;
  assetTag: string;
  status: string;
  createdAt: string;
}

function toneFor(status: string): "green" | "yellow" | "red" | undefined {
  const normalized = status.toUpperCase();
  if (normalized === "AVAILABLE" || normalized === "GOOD" || normalized === "COMPLETED") {
    return "green";
  }
  if (normalized === "ASSIGNED") {
    return "green";
  }
  if (normalized === "RETURNED" || normalized === "PENDING" || normalized === "AVERAGE") {
    return "yellow";
  }
  return "red";
}

// Reusable overlay modal component
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

export function AssetsConsole() {
  const [data, setData] = useState<AssetsData>(emptyAssets);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("Inventory");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("");

  // Modal / Popup state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [assignTargetAsset, setAssignTargetAsset] = useState<string | null>(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState<string | null>(null);

  // Form Field states
  const [newAssetTag, setNewAssetTag] = useState("");
  const [newAssetType, setNewAssetType] = useState("Laptop");
  const [newAssetItem, setNewAssetItem] = useState("");
  const [newAssetCondition, setNewAssetCondition] = useState("GOOD");
  const [newAssetStatus, setNewAssetStatus] = useState("AVAILABLE");
  const [newAssetAssignedTo, setNewAssetAssignedTo] = useState("");

  const [panelAssetTag, setPanelAssetTag] = useState("");
  const [panelEmployeeId, setPanelEmployeeId] = useState("");
  const [returnCondition, setReturnCondition] = useState("GOOD");

  const employees = useEmployeeOptions();

  function load() {
    apiFetch<AssetsData>("/assets")
      .then((body) => {
        if (body.data) setData(body.data);
      })
      .catch((err) => console.warn("Failed to load assets inventory:", err));
  }

  useEffect(() => {
    load();
  }, []);

  // Form Submissions
  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/assets", {
        method: "POST",
        body: JSON.stringify({
          assetTag: newAssetTag,
          type: newAssetType,
          item: newAssetItem,
          condition: newAssetCondition,
          status: newAssetStatus,
          assignedToId: newAssetStatus === "ASSIGNED" ? newAssetAssignedTo || undefined : undefined,
        }),
      });
      setMessage(`Asset "${newAssetTag}" created successfully.`);
      setNewAssetTag("");
      setNewAssetItem("");
      setNewAssetStatus("AVAILABLE");
      setNewAssetAssignedTo("");
      setShowAddPanel(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset.");
    }
  }

  async function handleAssignAsset(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch(`/assets/${panelAssetTag}/assign`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: panelEmployeeId || undefined,
        }),
      });
      setMessage(`Asset "${panelAssetTag}" assigned successfully.`);
      setPanelAssetTag("");
      setPanelEmployeeId("");
      setShowAssignPanel(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign asset.");
    }
  }

  async function handleReturnAsset(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch(`/assets/${panelAssetTag}/return`, {
        method: "POST",
        body: JSON.stringify({
          condition: returnCondition,
        }),
      });
      setMessage(`Asset "${panelAssetTag}" returned successfully.`);
      setPanelAssetTag("");
      setReturnCondition("GOOD");
      setShowReturnPanel(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return asset.");
    }
  }

  async function handleAssignRow(assetTag: string, empId: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/assets/${assetTag}/assign`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: empId || undefined,
        }),
      });
      setMessage(`Asset "${assetTag}" assigned successfully.`);
      setAssignTargetAsset(null);
      setPanelEmployeeId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign asset.");
    }
  }

  async function handleReturnRow(assetTag: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/assets/${assetTag}/return`, {
        method: "POST",
      });
      setMessage(`Asset "${assetTag}" returned successfully.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return asset.");
    }
  }

  async function handleDeleteAsset(assetTag: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/assets/${assetTag}`, {
        method: "DELETE",
      });
      setMessage(`Asset "${assetTag}" deleted successfully.`);
      setDeleteTargetAsset(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete asset.");
    }
  }

  async function handleExport() {
    try {
      const csvContent = [
        ["Asset Tag", "Type", "Item", "Assigned To", "Department", "Status", "Condition"].join(","),
        ...data.rows.map((row) => [
          `"${row.assetTag}"`,
          `"${row.type}"`,
          `"${row.item}"`,
          `"${row.assignedTo}"`,
          `"${row.department}"`,
          `"${row.status}"`,
          `"${row.condition}"`,
        ].join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `assets_inventory_${Date.now()}.csv`);
      link.click();
    } catch (err) {
      console.error(err);
    }
  }

  // Filter rows locally
  const filteredRows = data.rows.filter((row) => {
    // 1. Tab routing
    if (activeTab === "Assigned" && row.status !== "ASSIGNED") return false;
    if (activeTab === "Handover") {
      if (row.status !== "ASSIGNED" && row.status !== "RETURNED") return false;
      if (row.status === "ASSIGNED" && row.condition !== "POOR" && row.employeeStatus !== "EXITED") return false;
    }

    // 2. Search filter
    if (search) {
      const query = search.toLowerCase();
      const matchTag = row.assetTag.toLowerCase().includes(query);
      const matchItem = row.item.toLowerCase().includes(query);
      const matchType = row.type.toLowerCase().includes(query);
      const matchEmp = row.assignedTo.toLowerCase().includes(query);
      const matchDept = row.department.toLowerCase().includes(query);
      if (!matchTag && !matchItem && !matchType && !matchEmp && !matchDept) return false;
    }

    // 3. Status filter
    if (status && status !== "All") {
      if (status.toUpperCase() !== row.status.toUpperCase()) return false;
    }

    return true;
  });

  // Filter logs locally
  const logsList = (data.logs || []) as AssetLog[];
  const filteredLogs = logsList.filter((log) => {
    // 1. Search filter
    if (search) {
      const query = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(query);
      const matchTag = log.assetTag.toLowerCase().includes(query);
      if (!matchAction && !matchTag) return false;
    }

    // 2. Date filter (Month)
    if (month) {
      if (!String(log.createdAt).startsWith(month)) return false;
    }

    return true;
  });

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Assets"
        title="Asset Management"
        summary="Track company assets, employee assignments, return checkpoints and handover audit logs."
        tabs={["Inventory", "Assigned", "Handover", "Audit"]}
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
            label: "Add Asset",
            icon: <PackagePlus className="h-4 w-4" />,
            tone: "primary",
            onClick: () => {
              setShowAddPanel(true);
              setShowAssignPanel(false);
              setShowReturnPanel(false);
              setAssignTargetAsset(null);
            },
          },
          {
            label: "Assign",
            icon: <UserRound className="h-4 w-4" />,
            onClick: () => {
              setShowAssignPanel(true);
              setShowAddPanel(false);
              setShowReturnPanel(false);
              setAssignTargetAsset(null);
            },
          },
          {
            label: "Return",
            icon: <RotateCcw className="h-4 w-4" />,
            onClick: () => {
              setShowReturnPanel(true);
              setShowAddPanel(false);
              setShowAssignPanel(false);
              setAssignTargetAsset(null);
            },
          },
          {
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExport,
          },
        ]}
        stats={[
          { label: "Assets", value: String(data.total), note: "Tracked inventory" },
          { label: "Assigned", value: String(data.assigned), note: "With employees" },
          { label: "Available", value: String(data.available), note: "Ready to issue" },
        ]}
      />

      <ReferenceFlowStrip module="Assets" />

      {/* Result Notification banner */}
      {message || error ? (
        <div className={`rounded-lg p-3 text-sm ${error ? "bg-[#fde8e6] text-[#ba3d37]" : "bg-[#e6f5ef] text-[#18865a]"}`}>
          {error || message}
        </div>
      ) : null}

      {/* Overlay Modals Workspace */}
      <Modal isOpen={showAddPanel} onClose={() => setShowAddPanel(false)} title="Add New Company Asset">
        <form className="grid grid-cols-2 gap-4" onSubmit={handleAddAsset}>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Asset Tag / Serial No.</label>
            <input
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              placeholder="e.g. SKY-LAP-023"
              value={newAssetTag}
              onChange={(e) => setNewAssetTag(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Type</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value)}
            >
              <option value="Laptop">Laptop</option>
              <option value="ID Card">ID Card</option>
              <option value="Phone">Phone</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Condition</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={newAssetCondition}
              onChange={(e) => setNewAssetCondition(e.target.value)}
            >
              <option value="GOOD">Good</option>
              <option value="AVERAGE">Average</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Item Name / Description</label>
            <input
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              placeholder="e.g. Dell Latitude 5420"
              value={newAssetItem}
              onChange={(e) => setNewAssetItem(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Initial Status</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={newAssetStatus}
              onChange={(e) => setNewAssetStatus(e.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
            </select>
          </div>
          {newAssetStatus === "ASSIGNED" && (
            <div>
              <label className="mb-1 block text-xs font-bold text-[#49637f]">Assign To Employee</label>
              <select
                className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
                value={newAssetAssignedTo}
                onChange={(e) => setNewAssetAssignedTo(e.target.value)}
                required
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.value} value={emp.value}>{emp.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2 border-t pt-3 mt-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#34465f]"
              onClick={() => setShowAddPanel(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Save Asset
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssignPanel} onClose={() => setShowAssignPanel(false)} title="Assign Asset to Employee">
        <form className="grid gap-4" onSubmit={handleAssignAsset}>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Select Available Asset</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={panelAssetTag}
              onChange={(e) => setPanelAssetTag(e.target.value)}
              required
            >
              <option value="">Choose asset...</option>
              {data.rows.filter(r => r.status === "AVAILABLE" || r.status === "RETURNED").map(row => (
                <option key={row.assetTag} value={row.assetTag}>{row.assetTag} - {row.item} ({row.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Select Employee</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={panelEmployeeId}
              onChange={(e) => setPanelEmployeeId(e.target.value)}
              required
            >
              <option value="">Choose employee...</option>
              {employees.map((emp) => (
                <option key={emp.value} value={emp.value}>{emp.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t pt-3 mt-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#34465f]"
              onClick={() => setShowAssignPanel(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Assign Asset
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showReturnPanel} onClose={() => setShowReturnPanel(false)} title="Return Issued Asset">
        <form className="grid gap-4" onSubmit={handleReturnAsset}>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Select Assigned Asset</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={panelAssetTag}
              onChange={(e) => setPanelAssetTag(e.target.value)}
              required
            >
              <option value="">Choose asset...</option>
              {data.rows.filter(r => r.status === "ASSIGNED").map(row => (
                <option key={row.assetTag} value={row.assetTag}>{row.assetTag} - {row.item} (Assigned to: {row.assignedTo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Return Condition</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              required
            >
              <option value="GOOD">GOOD</option>
              <option value="POOR">POOR</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t pt-3 mt-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#34465f]"
              onClick={() => setShowReturnPanel(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Return Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* Row Assignment Modal */}
      <Modal isOpen={!!assignTargetAsset} onClose={() => setAssignTargetAsset(null)} title={`Assign Asset: ${assignTargetAsset}`}>
        <form className="grid gap-4" onSubmit={(e) => {
          e.preventDefault();
          if (assignTargetAsset) handleAssignRow(assignTargetAsset, panelEmployeeId);
        }}>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#49637f]">Select Employee to Assign To</label>
            <select
              className="w-full min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm text-[#172033] outline-none"
              value={panelEmployeeId}
              onChange={(e) => setPanelEmployeeId(e.target.value)}
              required
            >
              <option value="">Choose employee...</option>
              {employees.map((emp) => (
                <option key={emp.value} value={emp.value}>{emp.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t pt-3 mt-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#34465f]"
              onClick={() => { setAssignTargetAsset(null); setPanelEmployeeId(""); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Assign Now
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTargetAsset} onClose={() => setDeleteTargetAsset(null)} title="Delete Asset from Inventory">
        <div className="grid gap-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete asset <span className="font-mono font-bold text-slate-900">{deleteTargetAsset}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t pt-3 mt-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold text-[#34465f]"
              onClick={() => setDeleteTargetAsset(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTargetAsset) handleDeleteAsset(deleteTargetAsset);
              }}
            >
              Delete Asset
            </button>
          </div>
        </div>
      </Modal>

      {/* Grid tabs content layout */}
      {activeTab !== "Audit" ? (
        <>
          {/* Asset Category list */}
          {activeTab === "Inventory" && (
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Asset Categories</h2>
                  <p className="mt-1 text-sm text-muted">Laptops, ID cards, phones and accessories issued to employees.</p>
                </div>
                <StatusPill>{data.returned} Returned</StatusPill>
              </div>
              <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
                {data.categories.map((item) => (
                  <div className="rounded-lg border border-[#dce2eb] p-4 bg-white shadow-xs" key={item.type}>
                    <BriefcaseBusiness className="mb-3 h-5 w-5 text-brand" />
                    <div className="font-semibold text-ink">{item.type}</div>
                    <div className="mt-2 text-2xl font-semibold text-[#172033]">{item.count}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Filtered assets inventory table */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-[#172033]">
              {activeTab === "Inventory" ? "Asset Inventory" : activeTab === "Assigned" ? "Assigned Company Assets" : "Handover Queue (Exit & Poor Condition)"}
            </h2>
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Asset</th>
                    <th className="border-b border-[#dce2eb] p-3">Type</th>
                    <th className="border-b border-[#dce2eb] p-3">Assigned To</th>
                    <th className="border-b border-[#dce2eb] p-3">Department</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                    <th className="border-b border-[#dce2eb] p-3">Condition</th>
                    <th className="border-b border-[#dce2eb] p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row: AssetRow) => (
                    <tr key={row.id}>
                      <td className="border-b border-[#dce2eb] p-3">
                        <div className="font-semibold text-ink">{row.assetTag}</div>
                        <div className="text-xs text-muted">{row.item}</div>
                      </td>
                      <td className="border-b border-[#dce2eb] p-3 text-ink">{row.type}</td>
                      <td className="border-b border-[#dce2eb] p-3 text-ink">{row.assignedTo}</td>
                      <td className="border-b border-[#dce2eb] p-3 text-ink">{row.department}</td>
                      <td className="border-b border-[#dce2eb] p-3"><StatusPill tone={toneFor(row.status)}>{row.status}</StatusPill></td>
                      <td className="border-b border-[#dce2eb] p-3"><StatusPill tone={toneFor(row.condition)}>{row.condition}</StatusPill></td>
                      <td className="border-b border-[#dce2eb] p-3">
                        <div className="flex gap-2">
                          {row.status === "AVAILABLE" || row.status === "RETURNED" ? (
                            <button
                              className="flex min-h-8 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-semibold text-white"
                              onClick={() => {
                                setAssignTargetAsset(row.assetTag);
                                setPanelEmployeeId("");
                              }}
                            >
                              <Check className="h-3.5 w-3.5" /> Assign
                            </button>
                          ) : (
                             <button
                               className="flex min-h-8 items-center gap-1 rounded-lg border border-[#dce2eb] px-3 text-xs font-semibold hover:bg-slate-50"
                               onClick={() => {
                                 setPanelAssetTag(row.assetTag);
                                 setReturnCondition(row.condition || "GOOD");
                                 setShowReturnPanel(true);
                               }}
                             >
                               <RotateCcw className="h-3.5 w-3.5" /> Return
                             </button>
                          )}
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#fde8e6] text-[#ba3d37] hover:bg-[#fde8e6] transition-colors"
                            onClick={() => setDeleteTargetAsset(row.assetTag)}
                            title="Delete Asset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredRows.length && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted">No assets found matching the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        /* Audit movement logs tab */
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#172033]">Asset Movement Audit Logs</h2>
              <p className="mt-1 text-sm text-muted">History of asset creations, assignments, and returns.</p>
            </div>
          </div>
          <div className="grid gap-2">
            {filteredLogs.map((log: AssetLog) => (
              <div className="flex items-center justify-between rounded-lg border border-[#dce2eb] p-3 bg-[#f8fafc] text-sm" key={log.id}>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                    log.action === "asset.create" ? "bg-[#e6f5ef] text-[#18865a]" : log.action === "asset.assign" ? "bg-blue-50 text-blue-600" : log.action === "asset.delete" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {log.action.replace("asset.", "").toUpperCase()}
                  </span>
                  <span className="font-bold text-ink">{log.assetTag}</span>
                  <span className="text-xs text-muted">({log.status})</span>
                </div>
                <span className="text-xs text-muted">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
              </div>
            ))}
            {!filteredLogs.length ? (
              <div className="p-8 text-center text-sm text-muted">No asset movement logs match the filters.</div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}

