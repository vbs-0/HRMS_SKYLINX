"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { InsuranceActionPanel } from "./action-panels";
import { InsuranceClaimsTable, InsurancePoliciesTable, InsuranceDependentsTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { InsuranceWorkspace } from "./reference-workspaces";
import { Card } from "./ui";
import { Download, ShieldPlus, UsersRound, HeartPulse } from "lucide-react";

export function InsuranceConsole() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [actionType, setActionType] = useState<"policy" | "dependent" | "claim">("policy");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [policies, setPolicies] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);

  function load() {
    apiFetch<any[]>("/insurance/policies").then((res) => {
      if (res.data) setPolicies(res.data);
    });
    apiFetch<any[]>("/insurance/dependents").then((res) => {
      if (res.data) setDependents(res.data);
    });
    apiFetch<any[]>("/insurance/claims").then((res) => {
      if (res.data) setClaims(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExport() {
    try {
      if (activeTab === "Dependents") {
        const res = await apiFetch<any[]>("/insurance/dependents");
        if (!res.data) return;
        const csvContent = [
          ["Employee", "Policy / Provider", "Dependent Name", "Relationship", "Date of Birth", "Status"].join(","),
          ...res.data.map((d) => [
            `"${d.employee?.firstName || ""} ${d.employee?.lastName || ""}"`,
            `"${d.insurance ? `${d.insurance.provider} (${d.insurance.policyNumber})` : "-"}"`,
            `"${d.fullName}"`,
            `"${d.relationship}"`,
            d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "-",
            d.status,
          ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `insurance_dependents_${Date.now()}.csv`);
        link.click();
      } else if (activeTab === "Claims") {
        const res = await apiFetch<any[]>("/insurance/claims");
        if (!res.data) return;
        const csvContent = [
          ["Employee", "Provider", "Claim Number", "Claim Type", "Amount", "Claim Date", "Status"].join(","),
          ...res.data.map((c) => [
            `"${c.employee?.firstName || ""} ${c.employee?.lastName || ""}"`,
            `"${c.insurance?.provider || ""}"`,
            `"${c.claimNumber || "-"}"`,
            `"${c.claimType}"`,
            c.claimAmount,
            c.claimDate.slice(0, 10),
            c.status,
          ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `insurance_claims_${Date.now()}.csv`);
        link.click();
      } else {
        const res = await apiFetch<any[]>("/insurance/policies");
        if (!res.data) return;
        const csvContent = [
          ["Employee", "Provider", "Policy Number", "Policy Type", "Coverage Amount", "Premium", "Valid Till", "Status"].join(","),
          ...res.data.map((p) => [
            `"${p.employee?.firstName || ""} ${p.employee?.lastName || ""}"`,
            `"${p.provider}"`,
            `"${p.policyNumber}"`,
            `"${p.policyType}"`,
            p.coverageAmount,
            p.premiumAmount,
            p.endDate.slice(0, 10),
            p.status,
          ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `insurance_policies_${Date.now()}.csv`);
        link.click();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleActionClick(type: "policy" | "dependent" | "claim") {
    setActionType(type);
    setShowActionPanel(true);
  }

  const activeClaims = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Insurance"
        title="Insurance Management"
        summary="Track employee coverage, dependents, claims and approvals with the same compact policy workspace shown in the reference."
        tabs={["Overview", "Employee Insurance", "Dependents", "Claims"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
        actions={[
          {
            label: "Add Policy",
            icon: <ShieldPlus className="h-4 w-4" />,
            tone: "primary",
            onClick: () => handleActionClick("policy"),
          },
          {
            label: "Add Dependent",
            icon: <UsersRound className="h-4 w-4" />,
            onClick: () => handleActionClick("dependent"),
          },
          {
            label: "Submit Claim",
            icon: <HeartPulse className="h-4 w-4" />,
            onClick: () => handleActionClick("claim"),
          },
          {
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExport,
          },
        ]}
        stats={[
          { label: "Active Policies", value: String(policies.length), note: "Database source" },
          { label: "Pending Claims", value: String(activeClaims), note: "Requires attention" },
          { label: "Dependents", value: String(dependents.length), note: "Registered family members" },
        ]}
      />
      <ReferenceFlowStrip module="Insurance" />

      {activeTab === "Overview" && (
        <div className="grid gap-5 text-left">
          <InsuranceWorkspace />
          <div className="rounded-lg bg-blue-50/50 border border-blue-200 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Welcome to Insurance Control Center</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Toggle the views above to audit policy schedules, list dependent relations, review medical/life claim requests, or download compliance CSV logs.
            </p>
          </div>
        </div>
      )}

      {/* Forms Section */}
      {showActionPanel && (
        <div className="relative border border-slate-200 bg-slate-50/50 rounded-xl p-2 transition text-left">
          <button
            onClick={() => setShowActionPanel(false)}
            className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Close Panel ×
          </button>
          <div className="p-3 font-semibold text-xs text-slate-500 uppercase tracking-wider border-b pb-1 mb-3">
            Insurance Operations Form ({actionType === "policy" ? "Create Policy" : actionType === "dependent" ? "Add Dependent" : "Submit Claim"})
          </div>
          <InsuranceActionPanel defaultAction={actionType} />
        </div>
      )}

      {activeTab === "Employee Insurance" && (
        <Card className="border border-[var(--border-subtle)] text-left overflow-hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Employee Insurance Policies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Policy No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Coverage</th>
                  <th className="p-3">Valid Till</th>
                  <th className="p-3">Dependents</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <InsurancePoliciesTable search={search} />
            </table>
          </div>
        </Card>
      )}

      {activeTab === "Dependents" && (
        <Card className="border border-[var(--border-subtle)] text-left overflow-hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Registered Insurance Dependents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Policy / Provider</th>
                  <th className="p-3">Dependent Name</th>
                  <th className="p-3">Relationship</th>
                  <th className="p-3">Date of Birth</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <InsuranceDependentsTable search={search} />
            </table>
          </div>
        </Card>
      )}

      {activeTab === "Claims" && (
        <Card className="border border-[var(--border-subtle)] text-left overflow-hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Insurance Claims & Approvals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Claim No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Claim Date</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Status & Actions</th>
                </tr>
              </thead>
              <InsuranceClaimsTable search={search} status={status} />
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
