"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "../../../../lib/client-api";

interface Question {
  id: string;
  text: string;
  kind: string;
}

interface Survey {
  id: string;
  title: string;
  anonymous: boolean;
  hasResponded: boolean;
  status: string;
  questions: Question[];
}

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Survey>(`/surveys/${id}`)
      .then((res) => { if (res.data) setSurvey(res.data); })
      .catch(() => setError("Failed to load survey."));
  }, [id]);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiFetch(`/surveys/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answersJson: answers }),
      });
      setMessage("Response submitted successfully! Thank you.");
      router.push("/surveys");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response.");
    } finally {
      setLoading(false);
    }
  }

  if (!survey) {
    return (
      <div className="py-20 text-center text-slate-400 font-semibold">
        {error || "Loading survey…"}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/surveys")}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{survey.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {survey.anonymous ? "This survey is anonymous." : "Your response will be recorded with your identity."}
          </p>
        </div>
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

      {survey.hasResponded ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="font-semibold">You have already submitted a response for this survey.</p>
          <p className="text-xs mt-1 text-slate-400">Thank you for participating!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {survey.questions?.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">
                {idx + 1}. {q.text}
              </p>

              {q.kind === "SCALE_0_10" && (
                <div>
                  <div className="flex justify-between gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                          answers[q.id] === n
                            ? "bg-brand border-brand text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Not at all</span>
                    <span className="text-xs text-slate-400">Absolutely</span>
                  </div>
                </div>
              )}

              {q.kind === "TEXT" && (
                <textarea
                  rows={3}
                  placeholder="Enter your answer…"
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:border-brand"
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full min-h-11 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit Response"}
          </button>
        </div>
      )}
    </div>
  );
}
