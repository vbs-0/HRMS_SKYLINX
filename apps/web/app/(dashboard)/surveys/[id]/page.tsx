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
      <div className="py-20 text-center text-text-muted font-semibold">
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
          className="rounded-lg p-2 text-text-muted hover:bg-sunken transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{survey.title}</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {survey.anonymous ? "This survey is anonymous." : "Your response will be recorded with your identity."}
          </p>
        </div>
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

      {survey.hasResponded ? (
        <div className="rounded-xl border border-line bg-raised p-8 text-center text-text-secondary">
          <p className="font-semibold">You have already submitted a response for this survey.</p>
          <p className="text-xs mt-1 text-text-muted">Thank you for participating!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {survey.questions?.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-line bg-raised p-5">
              <p className="text-sm font-bold text-text-primary mb-4">
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
                            : "border-line text-text-secondary hover:bg-sunken"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-text-muted">Not at all</span>
                    <span className="text-xs text-text-muted">Absolutely</span>
                  </div>
                </div>
              )}

              {q.kind === "TEXT" && (
                <textarea
                  rows={3}
                  placeholder="Enter your answer…"
                  className="w-full rounded-lg border border-line p-3 text-sm resize-none focus:outline-none focus:border-brand"
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
