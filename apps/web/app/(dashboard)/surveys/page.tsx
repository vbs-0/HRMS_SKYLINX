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
    ACTIVE: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-500",
    DRAFT: "bg-amber-100 text-amber-700",
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
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div>
      )}

      {surveys.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No surveys found.</p>
          <p className="text-xs text-slate-400 mt-1">HR Admin can create pulse surveys from here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <div key={survey.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800">{survey.title}</h3>
                <span
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                    STATUS_COLORS[survey.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {survey.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Type</span>
                  <span className="font-semibold text-slate-700 capitalize">{survey.type?.toLowerCase().replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Anonymous</span>
                  <span className="font-semibold text-slate-700">{survey.anonymous ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/surveys/${survey.id}`}
                  className="flex-1 min-h-9 flex items-center justify-center rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  View & Respond
                </Link>
                {isAdmin && (
                  <Link
                    href={`/surveys/${survey.id}/results`}
                    className="min-h-9 flex items-center justify-center rounded-lg border border-slate-300 px-3 hover:bg-slate-50 transition"
                    title="Results"
                  >
                    <BarChart2 className="h-4 w-4 text-slate-500" />
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
