"use client";

import { Check, CheckSquare, Clock3, Eye, Filter, HelpCircle, X, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { Card, MetricCard, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";

interface ApprovalItem {
  id: string;
  type: string;
  module: string;
  requester: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  // Dynamic extra metadata for detail modal simulation
  details?: {
    reason?: string;
    description?: string;
    dates?: string;
    incidentDate?: string;
    category?: string;
    claimType?: string;
    candidateEmail?: string;
    jobTitle?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

interface ApprovalsResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  modules: Array<{ module: string; count: number }>;
  items: ApprovalItem[];
}

export function ApprovalsConsole() {
  const [data, setData] = useState<ApprovalsResponse>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    modules: [],
    items: [],
  });
  const [activeTab, setActiveTab] = useState("Pending");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Detail modal state
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  function load() {
    apiFetch<ApprovalsResponse>("/approvals")
      .then((body) => {
        if (body.data) {
          setData(body.data);
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(item: ApprovalItem, decision: "approve" | "reject") {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiFetch(`/approvals/${item.module}/${item.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      setMessage(`${item.type} request has been successfully ${decision}d.`);
      setShowDetailModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkApprove() {
    const pendingItems = filteredItems.filter(item => ["PENDING", "DRAFT", "ACTIVE"].includes(item.status.toUpperCase()));
    if (!pendingItems.length) {
      setError("No pending items available for bulk approval.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      await Promise.all(
        pendingItems.map(item =>
          apiFetch(`/approvals/${item.module}/${item.id}/decision`, {
            method: "POST",
            body: JSON.stringify({ decision: "approve" }),
          })
        )
      );
      setMessage(`Successfully approved ${pendingItems.length} request(s).`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk approval failed.");
      load();
    } finally {
      setLoading(false);
    }
  }

  // Get status class/tone for UI
  function toneFor(status: string) {
    if (["APPROVED", "PAH", "PAID", "OFFERED"].includes(status)) return "green";
    if (status === "REJECTED") return "red";
    return "yellow";
  }

  // Formatting amount/count label
  function amountText(item: ApprovalItem) {
    if (item.type === "Leave") {
      return `${item.amount} days`;
    }
    if (item.amount > 0) {
      return `₹${Number(item.amount).toLocaleString("en-IN")}`;
    }
    return "-";
  }

  // Filter items by status, module card selection, and search query
  const filteredItems = data.items.filter((item) => {
    // 1. Status Filter (Tabs)
    const status = String(item.status).toUpperCase();
    let statusMatch = false;
    if (activeTab === "Pending") {
      statusMatch = ["PENDING", "DRAFT", "ACTIVE"].includes(status);
    } else if (activeTab === "Approved") {
      statusMatch = ["APPROVED", "PAID", "OFFERED"].includes(status);
    } else if (activeTab === "Rejected") {
      statusMatch = status === "REJECTED";
    } else if (activeTab === "Escalated") {
      statusMatch = status === "HOLD";
    }

    // 2. Module Filter Card Selection
    const moduleMatch = !selectedModule || item.module === selectedModule;

    // 3. Search Query Filter
    const searchMatch =
      !searchQuery ||
      item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && moduleMatch && searchMatch;
  });

  // Calculate dynamic stats
  const totalCount = data.items.length;
  const pendingCount = data.items.filter((item) => ["PENDING", "DRAFT", "ACTIVE"].includes(item.status.toUpperCase())).length;
  const approvedCount = data.items.filter((item) => ["APPROVED", "PAID", "OFFERED"].includes(item.status.toUpperCase())).length;
  const rejectedCount = data.items.filter((item) => item.status.toUpperCase() === "REJECTED").length;

  // Render module-specific data in detailed view
  function renderModalBreakdown(item: ApprovalItem) {
    switch (item.module) {
      case "leave":
        return (
          <div className="grid gap-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Leave Category:</span>
              <span className="font-semibold text-text-primary">{item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Duration:</span>
              <span className="font-semibold text-text-primary">{item.amount} Work Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Policy Type:</span>
              <span className="font-semibold text-text-primary">Rule-Backed sandwich verified</span>
            </div>
            <div className="bg-[var(--surface-sunken)] p-3 rounded-lg border border-line mt-2">
              <div className="text-xs text-text-muted uppercase font-bold">Reason for request</div>
              <p className="text-xs text-text-primary font-medium mt-1">"Personal family gathering. Travel tickets verified and backup resource allocated."</p>
            </div>
          </div>
        );
      case "expenses":
        return (
          <div className="grid gap-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Claim Category:</span>
              <span className="font-semibold text-text-primary">{item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Total Amount:</span>
              <span className="font-semibold text-brand text-base">₹{Number(item.amount).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Receipt File:</span>
              <span className="inline-flex items-center gap-1 text-xs text-brand font-bold cursor-pointer">
                <FileText className="h-3.5 w-3.5" /> receipt_tax_invoice.png
              </span>
            </div>
            <div className="bg-[var(--surface-sunken)] p-3 rounded-lg border border-line mt-2">
              <div className="text-xs text-text-muted uppercase font-bold">Description</div>
              <p className="text-xs text-text-primary font-medium mt-1">"Client lunch with product engineering stakeholders regarding new project milestones."</p>
            </div>
          </div>
        );
      case "attendance":
        return (
          <div className="grid gap-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Regularization Reason:</span>
              <span className="font-semibold text-text-primary">{item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Logged Date:</span>
              <span className="font-semibold text-text-primary">{String(item.createdAt).slice(0, 10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Regularized Shift:</span>
              <span className="font-semibold text-text-primary">General Shift (9:30 AM - 6:30 PM)</span>
            </div>
            <div className="bg-[var(--surface-sunken)] p-3 rounded-lg border border-line mt-2">
              <div className="text-xs text-text-muted uppercase font-bold">Incident Details</div>
              <p className="text-xs text-text-primary font-medium mt-1">Forgot to mark biometric scan when entering Bangalore premises due to security delay.</p>
            </div>
          </div>
        );
      case "insurance":
        return (
          <div className="grid gap-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Claim Type:</span>
              <span className="font-semibold text-text-primary">{item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Requested Reimbursement:</span>
              <span className="font-semibold text-text-primary">₹{Number(item.amount).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Insured Coverage:</span>
              <span className="font-semibold text-text-primary">Company Group Medical Policy</span>
            </div>
            <div className="bg-[var(--surface-sunken)] p-3 rounded-lg border border-line mt-2">
              <div className="text-xs text-text-muted uppercase font-bold">Medical Diagnosis / Comments</div>
              <p className="text-xs text-text-primary font-medium mt-1">Dental implant treatment. Pre-auth files uploaded and verified by insurance provider.</p>
            </div>
          </div>
        );
      case "payroll":
        return (
          <div className="grid gap-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Payroll Period:</span>
              <span className="font-semibold text-text-primary">Monthly Run for {item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary font-medium">Processed Payouts:</span>
              <span className="font-semibold text-text-primary">5 Active Employees calculated</span>
            </div>
            <div className="bg-[var(--surface-sunken)] p-3 rounded-lg border border-line mt-2">
              <div className="text-xs text-text-muted uppercase font-bold">Payroll Lock Status</div>
              <p className="text-xs text-text-primary font-medium mt-1">Awaiting executive approval to lock components, freeze records, and compile the final direct-transfer bank export CSV lines.</p>
            </div>
          </div>
        );

      default:
        return <div className="text-xs text-muted">No further metadata available.</div>;
    }
  }

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Approvals"
        title="Approvals Queue"
        summary="Audit, review, and decide on leave requests, attendance logs, expenses, insurance claims, and payroll runs."
        tabs={["Pending", "Approved", "Rejected", "Escalated"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: "Approve Bulk", icon: CheckSquare, tone: "primary", onClick: handleBulkApprove },
          { label: "Settings", icon: Filter, href: "#" },
        ]}
        stats={[
          { label: "Pending Queue", value: String(pendingCount), note: "Awaiting action" },
          { label: "Approved Payout", value: String(approvedCount), note: "Successfully resolved" },
          { label: "Escalated", value: "0", note: "Holds" },
        ]}
      />

      <ReferenceFlowStrip module="Approvals" />

      {/* Confirmation Toasts */}
      {(message || error) && (
        <div>
          {message && (
            <div className="rounded-xl bg-success-bg p-4 text-sm text-success-fg border border-success-border flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success-fg shrink-0" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-danger-bg p-4 text-sm text-danger-fg border border-danger-border flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger-fg shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Total Submissions" value={String(totalCount)} note="Across all HR modules" />
        <MetricCard label="Action Pending" value={String(pendingCount)} note="Needs review" />
        <MetricCard label="Completed / Closed" value={String(approvedCount)} note="Approved submissions" />
        <MetricCard label="Declined / Rejected" value={String(rejectedCount)} note="Rejected submissions" />
      </div>

      {/* Module Filter Cards */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Module Filter Filters</h3>
            <p className="text-xs text-muted">Click a card to filter the queue below by a specific business module.</p>
          </div>
          {selectedModule && (
            <button
              className="text-xs text-brand font-bold hover:underline"
              onClick={() => setSelectedModule(null)}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { module: "leave", count: data.items.filter(i => i.module === "leave" && ["PENDING", "DRAFT"].includes(i.status.toUpperCase())).length, label: "Leaves" },
          ].map((m) => (
            <div
              key={m.module}
              className={`rounded-xl border p-4 cursor-pointer transition-all min-w-[200px] ${
                selectedModule === m.module
                  ? "border-brand bg-brand-50/15 shadow-sm ring-1 ring-brand"
                  : "border-[var(--border-subtle)] bg-raised hover:bg-sunken"
              }`}
              onClick={() => setSelectedModule(selectedModule === m.module ? null : m.module)}
            >
              <div className="font-bold text-text-primary text-sm">{m.label}</div>
              <div className="mt-2 text-xs text-muted font-semibold">{m.count} pending items</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Request Queue Table */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary">{activeTab} Queue</h3>
          <div className="relative w-64 max-sm:w-full">
            <input
              type="text"
              placeholder="Search request or name..."
              className="min-h-9 w-full rounded-lg border border-line bg-raised px-3 text-xs outline-none transition focus:border-brand"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-text-secondary">
            <thead>
              <tr className="bg-sunken text-xs font-bold uppercase tracking-wider text-text-secondary">
                <th className="border-b p-3">Request Type</th>
                <th className="border-b p-3">Requester Name</th>
                <th className="border-b p-3">Subject / Title</th>
                <th className="border-b p-3">Details / Value</th>
                <th className="border-b p-3">Logged Date</th>
                <th className="border-b p-3 text-center">Status</th>
                <th className="border-b p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredItems.length ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    No requests matching current filter options.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={`${item.module}-${item.id}`} className="hover:bg-sunken">
                    <td className="border-b p-3 font-semibold text-text-primary">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <CheckSquare className="h-4 w-4 text-brand" />
                        {item.type}
                      </span>
                    </td>
                    <td className="border-b p-3 font-semibold text-text-primary">{item.requester}</td>
                    <td className="border-b p-3">{item.title}</td>
                    <td className="border-b p-3 font-medium text-text-primary">{amountText(item)}</td>
                    <td className="border-b p-3 text-xs font-medium">{String(item.createdAt).slice(0, 10)}</td>
                    <td className="border-b p-3 text-center">
                      <StatusPill tone={toneFor(item.status)}>{item.status}</StatusPill>
                    </td>
                    <td className="border-b p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-raised px-2.5 text-xs font-bold text-text-secondary transition hover:bg-sunken"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 text-text-muted" /> Inspect
                        </button>
                        {["PENDING", "DRAFT", "ACTIVE"].includes(item.status.toUpperCase()) && (
                          <>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 text-white px-2.5 text-xs font-bold hover:bg-emerald-700 transition"
                              onClick={() => decide(item, "approve")}
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-danger-border text-danger-fg px-2.5 text-xs font-bold hover:bg-danger-bg transition"
                              onClick={() => decide(item, "reject")}
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAIL MODAL POPUP */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-raised p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-line">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Request Audit Details</h3>
                <p className="text-xs text-text-muted">Review employee submission details below.</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                ["APPROVED", "PAID", "OFFERED"].includes(selectedItem.status.toUpperCase())
                  ? "bg-success-bg text-success-fg"
                  : selectedItem.status.toUpperCase() === "REJECTED"
                  ? "bg-danger-bg text-danger-fg"
                  : "bg-warning-bg text-warning-fg"
              }`}>
                {selectedItem.status}
              </span>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Submitted By:</span>
                <span className="font-bold text-text-primary">{selectedItem.requester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Logged Date:</span>
                <span className="font-semibold text-text-primary">{String(selectedItem.createdAt).slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Request Type:</span>
                <span className="font-bold text-text-primary capitalize">{selectedItem.type} Request</span>
              </div>
            </div>

            {renderModalBreakdown(selectedItem)}

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                className="min-h-10 rounded-lg border border-line-strong px-4 text-sm font-semibold text-text-primary hover:bg-sunken transition"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>

              {["PENDING", "DRAFT", "ACTIVE"].includes(selectedItem.status.toUpperCase()) && (
                <>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg bg-emerald-600 text-white px-4 text-sm font-semibold hover:bg-emerald-700 transition"
                    onClick={() => decide(selectedItem, "approve")}
                    disabled={loading}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-danger-border text-danger-fg px-4 text-sm font-semibold hover:bg-danger-bg transition"
                    onClick={() => decide(selectedItem, "reject")}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
