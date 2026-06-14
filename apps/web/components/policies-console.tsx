"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/client-api";
import { Card } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { FileCheck2, ShieldCheck, Plus, CheckCircle, Archive, Eye, Users } from "lucide-react";

interface Policy {
  id: string;
  title: string;
  category: string;
  description?: string;
  contentHtml?: string;
  version: string;
  effectiveDate: string;
  requiresAcknowledgment: boolean;
  status: string;
  acknowledged?: boolean;
}

interface Acknowledgment {
  id: string;
  acknowledgedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
  };
}

export function PoliciesConsole() {
  const [activeTab, setActiveTab] = useState("All Policies");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [acks, setAcks] = useState<Acknowledgment[]>([]);
  const [acksLoading, setAcksLoading] = useState(false);

  // Create policy form state
  const [showCreate, setShowCreate] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Leave");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formVersion, setFormVersion] = useState("1.0");
  const [formRequiresAck, setFormRequiresAck] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchPolicies = useCallback(() => {
    setLoading(true);
    apiFetch<Policy[]>("/policies")
      .then((res) => setPolicies(res.data || []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const fetchAcks = (policyId: string) => {
    setAcksLoading(true);
    apiFetch<Acknowledgment[]>(`/policies/${policyId}/acknowledgments`)
      .then((res) => setAcks(res.data || []))
      .catch(() => setAcks([]))
      .finally(() => setAcksLoading(false));
  };

  const handleAcknowledge = async (policyId: string) => {
    try {
      const me = await apiFetch<any>("/auth/me").catch(() => null);
      const employeeId = me?.data?.employeeId;
      if (!employeeId) {
        setError("Cannot determine your employee ID. Please log in again.");
        return;
      }
      await apiFetch(`/policies/${policyId}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ employeeId }),
      });
      setMessage("Policy acknowledged successfully!");
      fetchPolicies();
    } catch (err: any) {
      setError(err.message || "Failed to acknowledge policy");
    }
  };

  const handleArchive = async (policyId: string) => {
    try {
      await apiFetch(`/policies/${policyId}/archive`, { method: "PATCH" });
      setMessage("Policy archived.");
      fetchPolicies();
      setSelectedPolicy(null);
    } catch (err: any) {
      setError(err.message || "Failed to archive policy");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/policies", {
        method: "POST",
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          description: formDescription,
          contentHtml: formContent,
          version: formVersion,
          requiresAcknowledgment: formRequiresAck,
        }),
      });
      setMessage("Policy created successfully!");
      setShowCreate(false);
      setFormTitle("");
      setFormDescription("");
      setFormContent("");
      fetchPolicies();
    } catch (err: any) {
      setError(err.message || "Failed to create policy");
    } finally {
      setSaving(false);
    }
  };

  const categoryBadgeColor: Record<string, string> = {
    Leave: "bg-info-bg text-info-fg",
    Conduct: "bg-brand-50 text-brand-700",
    IT: "bg-warning-bg text-warning-fg",
    POSH: "bg-pink-100 text-pink-700",
    HR: "bg-success-bg text-success-fg",
  };

  const active = policies.filter((p) => p.status === "ACTIVE");
  const pending = active.filter((p) => p.requiresAcknowledgment && !p.acknowledged);
  const archived = policies.filter((p) => p.status === "ARCHIVED");

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Policy Center"
        title="Company Policies"
        summary="View, acknowledge, and manage company policies across all categories."
        tabs={["All Policies", "Pending Acknowledgment", "Archived", "Upload Policy"]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedPolicy(null);
          setShowCreate(false);
        }}
        actions={[
          { label: "Upload Policy", icon: <Plus className="h-4 w-4" />, tone: "primary" },
        ]}
        stats={[
          { label: "Active Policies", value: String(active.length), note: "All categories" },
          { label: "Pending ACK", value: String(pending.length), note: "Requires your attention" },
          { label: "Archived", value: String(archived.length), note: "Historical records" },
        ]}
      />

      <ReferenceFlowStrip module="Policies" />

      {message && (
        <div className="rounded-lg bg-[var(--success-bg)] p-3 text-sm text-[var(--success-fg)] font-semibold">{message}</div>
      )}
      {error && (
        <div className="rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)] font-semibold">{error}</div>
      )}

      {activeTab === "All Policies" && (
        <div className="grid grid-cols-[1fr_1.5fr] gap-6 max-lg:grid-cols-1">
          {/* Policy list */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-text-secondary text-center py-8">Loading policies…</div>
            ) : active.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-8">No active policies found.</div>
            ) : (
              active.map((policy) => (
                <Card
                  key={policy.id}
                  className={`p-4 cursor-pointer border transition hover:border-brand/40 hover:shadow-sm ${
                    selectedPolicy?.id === policy.id ? "border-brand bg-brand/5" : "border-[var(--border-subtle)]"
                  }`}
                  onClick={() => {
                    setSelectedPolicy(policy);
                    fetchAcks(policy.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            categoryBadgeColor[policy.category] || "bg-sunken text-text-primary"
                          }`}
                        >
                          {policy.category}
                        </span>
                        <span className="text-[10px] text-text-muted">v{policy.version}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary truncate">{policy.title}</h3>
                      {policy.description && (
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{policy.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {policy.acknowledged ? (
                        <CheckCircle className="h-5 w-5 text-success-fg" />
                      ) : policy.requiresAcknowledgment ? (
                        <div className="h-5 w-5 rounded-full border-2 border-orange-400 bg-warning-bg" title="Needs acknowledgment" />
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Policy detail */}
          <div>
            {selectedPolicy ? (
              <Card className="p-5 border border-[var(--border-subtle)] sticky top-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        categoryBadgeColor[selectedPolicy.category] || "bg-sunken text-text-primary"
                      }`}
                    >
                      {selectedPolicy.category}
                    </span>
                    <h2 className="text-base font-bold text-text-primary mt-1">{selectedPolicy.title}</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Version {selectedPolicy.version} · Effective{" "}
                      {new Date(selectedPolicy.effectiveDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPolicy.requiresAcknowledgment && !selectedPolicy.acknowledged && (
                      <button
                        id={`ack-policy-${selectedPolicy.id}`}
                        onClick={() => handleAcknowledge(selectedPolicy.id)}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Acknowledge
                      </button>
                    )}
                    <button
                      id={`archive-policy-${selectedPolicy.id}`}
                      onClick={() => handleArchive(selectedPolicy.id)}
                      className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-sunken transition"
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  </div>
                </div>

                {selectedPolicy.contentHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-text-primary mb-5"
                    dangerouslySetInnerHTML={{ __html: selectedPolicy.contentHtml }}
                  />
                ) : selectedPolicy.description ? (
                  <p className="text-sm text-text-secondary mb-5">{selectedPolicy.description}</p>
                ) : null}

                {/* Acknowledgments report */}
                <div className="mt-4 border-t border-line pt-4">
                  <h4 className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Acknowledgment Tracker
                  </h4>
                  {acksLoading ? (
                    <p className="text-xs text-text-muted">Loading…</p>
                  ) : acks.length === 0 ? (
                    <p className="text-xs text-text-muted">No acknowledgments recorded yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {acks.map((ack) => (
                        <div
                          key={ack.id}
                          className="flex items-center justify-between text-xs text-text-secondary bg-sunken rounded px-2 py-1"
                        >
                          <span className="font-semibold">
                            {ack.employee.firstName} {ack.employee.lastName}
                          </span>
                          <span className="text-text-muted">
                            {new Date(ack.acknowledgedAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-10 border border-dashed border-line flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <FileCheck2 className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">Select a policy to view details and acknowledgment status.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "Pending Acknowledgment" && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <Card className="p-10 text-center">
              <CheckCircle className="h-10 w-10 text-success-fg mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-secondary">All policies acknowledged!</p>
              <p className="text-xs text-text-muted mt-1">No pending acknowledgments for your account.</p>
            </Card>
          ) : (
            pending.map((policy) => (
              <Card key={policy.id} className="p-4 border border-warning-border bg-warning-bg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{policy.title}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{policy.description}</p>
                  </div>
                  <button
                    id={`ack-pending-${policy.id}`}
                    onClick={() => handleAcknowledge(policy.id)}
                    className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Acknowledge
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "Archived" && (
        <div className="space-y-3">
          {archived.length === 0 ? (
            <div className="text-sm text-text-muted text-center py-8">No archived policies.</div>
          ) : (
            archived.map((policy) => (
              <Card key={policy.id} className="p-4 border border-line opacity-70">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-text-muted" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary">{policy.title}</h3>
                    <p className="text-xs text-text-muted">
                      {policy.category} · v{policy.version}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "Upload Policy" && (
        <Card className="p-6 max-w-2xl border border-[var(--border-subtle)]">
          <h3 className="text-base font-bold text-text-primary mb-5 border-b pb-2">Create New Policy</h3>
          <form onSubmit={handleCreate} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1" htmlFor="policy-title">
                  Title *
                </label>
                <input
                  id="policy-title"
                  name="policy-title"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  placeholder="e.g. Remote Work Policy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1" htmlFor="policy-category">
                  Category *
                </label>
                <select
                  id="policy-category"
                  name="policy-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                >
                  {["Leave", "Conduct", "IT", "POSH", "HR", "Finance", "Safety"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1" htmlFor="policy-version">
                  Version
                </label>
                <input
                  id="policy-version"
                  name="policy-version"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  placeholder="1.0"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="policy-requires-ack"
                  name="policy-requires-ack"
                  checked={formRequiresAck}
                  onChange={(e) => setFormRequiresAck(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="policy-requires-ack" className="text-sm text-text-secondary font-medium">
                  Requires acknowledgment from employees
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1" htmlFor="policy-description">
                Short Description
              </label>
              <input
                id="policy-description"
                name="policy-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                placeholder="Brief summary of this policy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1" htmlFor="policy-content">
                Policy Content (HTML or plain text)
              </label>
              <textarea
                id="policy-content"
                name="policy-content"
                rows={8}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono"
                placeholder="<p>Enter the full policy text here…</p>"
              />
            </div>

            <button
              type="submit"
              id="create-policy-btn"
              disabled={saving}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand/90 transition"
            >
              {saving ? "Saving…" : "Create Policy"}
            </button>
          </form>
        </Card>
      )}
    </>
  );
}
