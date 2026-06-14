"use client";

import { useState, useEffect } from "react";
import { BarChart2, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "../../../lib/client-api";
import { ReferenceModuleHeader } from "../../../components/reference-module";
import { useActiveRole } from "../../../lib/role";

interface Survey {
  id: string;
  title: string;
  type: string;
  status: string;
  anonymous: boolean;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { role } = useActiveRole();
  const isAdmin = role === "admin";

  useEffect(() => {
    apiFetch<Survey[]>("/surveys")
      .then((res) => setSurveys(res.data || []))
      .catch(() => undefined);
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-success-bg text-success-fg",
    CLOSED: "bg-sunken text-text-secondary",
    DRAFT: "bg-warning-bg text-warning-fg",
  };

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Engagement"
        title="Pulse Surveys"
        summary="Engage with your team and measure employee sentiment and eNPS."
        tabs={[]}
        activeTab=""
        onTabChange={() => undefined}
        actions={
          isAdmin
            ? [{ label: "Create Survey", icon: <Plus className="h-4 w-4" />, tone: "primary" as const, onClick: () => setMessage("Survey builder coming soon.") }]
            : []
        }
        stats={[
          { label: "Total Surveys", value: String(surveys.length), note: "All time" },
          { label: "Active", value: String(surveys.filter((s) => s.status === "ACTIVE").length), note: "Open now" },
        ]}
      />

      {message && (
        <div className="mb-4 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg p-4 text-sm font-semibold text-danger-fg">{error}</div>
      )}

      {surveys.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm font-semibold text-text-secondary">No surveys found.</p>
          <p className="text-xs text-text-muted mt-1">HR Admin can create pulse surveys from here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <div key={survey.id} className="rounded-xl border border-line bg-raised p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-text-primary">{survey.title}</h3>
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                    STATUS_COLORS[survey.status] ?? "bg-sunken text-text-secondary"
                  }`}
                >
                  {survey.status}
                </span>
              </div>
              <div className="text-xs text-text-secondary space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Type</span>
                  <span className="font-semibold text-text-primary capitalize">{survey.type?.toLowerCase().replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Anonymous</span>
                  <span className="font-semibold text-text-primary">{survey.anonymous ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/surveys/${survey.id}`}
                  className="flex-1 min-h-9 flex items-center justify-center rounded-lg border border-line-strong text-xs font-semibold text-text-primary hover:bg-sunken transition"
                >
                  View & Respond
                </Link>
                {isAdmin && (
                  <Link
                    href={`/surveys/${survey.id}/results`}
                    className="min-h-9 flex items-center justify-center rounded-lg border border-line-strong px-3 hover:bg-sunken transition"
                    title="Results"
                  >
                    <BarChart2 className="h-4 w-4 text-text-secondary" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
