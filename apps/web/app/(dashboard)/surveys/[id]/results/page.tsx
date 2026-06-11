"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, XCircle } from "lucide-react";
import { apiFetch } from "../../../../../lib/client-api";

interface SurveyQuestion {
  id: string;
  text: string;
  kind: string;
}

interface SurveyResponse {
  id: string;
  answersJson: Record<string, string | number>;
}

interface SurveyResults {
  id: string;
  title: string;
  status: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
}

export default function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyResults | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    apiFetch<SurveyResults>(`/surveys/${id}/results`)
      .then((res) => { if (res.data) setSurvey(res.data); })
      .catch(() => setError("Failed to load results."));
  }, [id]);

  async function handleClose() {
    setClosing(true);
    setError("");
    try {
      await apiFetch(`/surveys/${id}/close`, { method: "PATCH" });
      setSurvey((prev) => prev ? { ...prev, status: "CLOSED" } : prev);
      setMessage("Survey has been closed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close survey.");
    } finally {
      setClosing(false);
    }
  }

  if (!survey) {
    return (
      <div className="py-20 text-center text-slate-400 font-semibold">
        {error || "Loading results…"}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/surveys")}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{survey.title} — Results</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {survey.responses?.length ?? 0} response{survey.responses?.length !== 1 ? "s" : ""} · Status:{" "}
              <span className={survey.status === "ACTIVE" ? "text-emerald-600 font-bold" : "text-slate-500 font-bold"}>
                {survey.status}
              </span>
            </p>
          </div>
        </div>

        {survey.status !== "CLOSED" && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="inline-flex items-center gap-1.5 min-h-9 rounded-lg border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            {closing ? "Closing…" : "Close Survey"}
          </button>
        )}
      </div>

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

      {/* Questions with answers */}
      {survey.questions?.map((q, idx) => {
        // For scale questions compute average
        const scaleAnswers = survey.responses
          ?.map((r) => r.answersJson?.[q.id])
          .filter((a) => typeof a === "number") as number[];
        const avg = scaleAnswers?.length
          ? (scaleAnswers.reduce((a, b) => a + b, 0) / scaleAnswers.length).toFixed(1)
          : null;

        return (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold text-slate-800 mb-4">
              {idx + 1}. {q.text}
            </p>

            {q.kind === "SCALE_0_10" && avg !== null && (
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl font-bold text-brand">{avg}</span>
                <span className="text-xs text-slate-400">avg out of 10 ({scaleAnswers.length} responses)</span>
              </div>
            )}

            <div className="space-y-2">
              {survey.responses?.map((r, i) => {
                const ans = r.answersJson?.[q.id];
                if (ans === undefined) return null;
                return (
                  <div key={r.id ?? i} className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-2 text-sm text-slate-700">
                    {String(ans)}
                  </div>
                );
              })}
              {survey.responses?.length === 0 && (
                <p className="text-xs text-slate-400 italic">No responses yet.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
