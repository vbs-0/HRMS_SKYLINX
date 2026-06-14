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
      <div className="py-20 text-center text-text-muted font-semibold">
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
            className="rounded-lg p-2 text-text-muted hover:bg-sunken transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{survey.title} — Results</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {survey.responses?.length ?? 0} response{survey.responses?.length !== 1 ? "s" : ""} · Status:{" "}
              <span className={survey.status === "ACTIVE" ? "text-success-fg font-bold" : "text-text-secondary font-bold"}>
                {survey.status}
              </span>
            </p>
          </div>
        </div>

        {survey.status !== "CLOSED" && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="inline-flex items-center gap-1.5 min-h-9 rounded-lg border border-danger-border bg-danger-bg px-4 text-xs font-semibold text-danger-fg hover:bg-danger-bg transition disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            {closing ? "Closing…" : "Close Survey"}
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm font-semibold text-danger-fg">
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
          <div key={q.id} className="rounded-xl border border-line bg-white p-5">
            <p className="text-sm font-bold text-text-primary mb-4">
              {idx + 1}. {q.text}
            </p>

            {q.kind === "SCALE_0_10" && avg !== null && (
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl font-bold text-brand">{avg}</span>
                <span className="text-xs text-text-muted">avg out of 10 ({scaleAnswers.length} responses)</span>
              </div>
            )}

            <div className="space-y-2">
              {survey.responses?.map((r, i) => {
                const ans = r.answersJson?.[q.id];
                if (ans === undefined) return null;
                return (
                  <div key={r.id ?? i} className="rounded-lg bg-sunken border border-line px-4 py-2 text-sm text-text-primary">
                    {String(ans)}
                  </div>
                );
              })}
              {survey.responses?.length === 0 && (
                <p className="text-xs text-text-muted italic">No responses yet.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
