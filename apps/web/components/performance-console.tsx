"use client";

import { Award, Play, Target, TrendingUp, Users, Plus, MessageSquare, Star, Send, X, CalendarCheck, Download } from "lucide-react";
import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackPerformance } from "../lib/fallback-data";
import { emptyPerformance } from "../lib/live-data";
import { Card, MetricCard, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";

type PerformanceData = typeof fallbackPerformance;
type PerformanceRow = PerformanceData["rows"][number];
interface PerformanceLog {
  id: string;
  action: string;
  status: string;
  createdAt: string;
}

interface FeedbackRequest {
  id: string;
  employeeId: string;
  reviewerId: string;
  competencies: string;
  deadline: string;
  status: string; // PENDING, SUBMITTED
  employee: { firstName: string; lastName: string };
  reviewer: { firstName: string; lastName: string };
  responses: Array<{
    ratings: any;
    comments: string;
    submittedAt: string;
  }>;
}

function toneFor(rating: string) {
  return rating === "EXCELLENT" ? "green" : rating === "GOOD" ? "yellow" : "red";
}

function progress(completed: number, total: number) {
  return Math.round((completed / Math.max(total, 1)) * 100);
}

export function PerformanceConsole() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [data, setData] = useState<PerformanceData>(emptyPerformance);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // 360 Feedback States
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);
  
  // Form values
  const [competenciesInput, setCompetenciesInput] = useState("Leadership, Communication, Technical Proficiency");
  const [commentsInput, setCommentsInput] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    Leadership: 4,
    Communication: 4,
    Technical: 4,
  });

  function load() {
    apiFetch<PerformanceData>("/performance")
      .then((body) => {
        if (body.data) setData(body.data);
      })
      .catch(() => undefined);
    
    loadFeedbackRequests();
    loadEmployees();
  }

  async function loadFeedbackRequests() {
    try {
      const res = await apiFetch<FeedbackRequest[]>("/performance/feedback/requests");
      setFeedbackRequests(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadEmployees() {
    apiFetch<any[]>("/employees")
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function launchCycle() {
    await apiFetch("/performance/cycle", { method: "POST" });
    setMessage("Performance review cycle launched.");
    load();
  }

  async function handleCreateRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/performance/feedback/request", {
        method: "POST",
        body: JSON.stringify({
          employeeId: String(form.get("employeeId")),
          reviewerId: String(form.get("reviewerId")),
          competencies: competenciesInput,
          deadline: new Date(String(form.get("deadline"))).toISOString(),
        }),
      });
      setMessage("360-degree feedback request dispatched successfully.");
      setShowRequestModal(false);
      loadFeedbackRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  async function handleSubmitResponse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRequest) return;
    setMessage("");
    setError("");
    try {
      await apiFetch("/performance/feedback/response", {
        method: "POST",
        body: JSON.stringify({
          requestId: selectedRequest.id,
          ratings,
          comments: commentsInput,
        }),
      });
      setMessage("360 feedback response submitted successfully.");
      setShowResponseModal(false);
      setSelectedRequest(null);
      setCommentsInput("");
      loadFeedbackRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="PMS"
        title="Performance Management"
        summary="Goals, review cycles, attendance score, recognition signals and appraisal readiness."
        tabs={["Dashboard", "Goals", "Reviews", "Ratings", "360 Feedback"]}
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab)}
        actions={[
          { label: "New Cycle", icon: <CalendarCheck className="h-4 w-4" />, tone: "primary" },
          { label: "Goals", icon: <Target className="h-4 w-4" /> },
          { label: "Ratings", icon: <Star className="h-4 w-4" /> },
          { label: "Export", icon: <Download className="h-4 w-4" /> },
        ]}
        stats={[
          { label: "Cycle", value: "Live", note: "Review ready" },
          { label: "Signals", value: "4", note: "Score inputs" },
          { label: "Approval", value: "Manager", note: "HR lock" },
        ]}
      />
      <ReferenceFlowStrip module="PMS" />

      {activeTab === "360 Feedback" ? (
        <div className="grid gap-5 mt-5">
          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div>}

          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">360-Degree Feedback Requests</h3>
              <p className="text-xs text-slate-400 mt-1">Request reviews from peers, managers, and subordinates to build multi-dimensional appraisals.</p>
            </div>
            <button
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark flex items-center gap-2"
              onClick={() => setShowRequestModal(true)}
            >
              <Plus className="h-4 w-4" /> Request Review
            </button>
          </div>

          <Card>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Review Target</th>
                    <th className="border-b border-[#dce2eb] p-3">Reviewer Assigned</th>
                    <th className="border-b border-[#dce2eb] p-3">Focus Competencies</th>
                    <th className="border-b border-[#dce2eb] p-3">Deadline</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                    <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No 360 feedback requests logged.
                      </td>
                    </tr>
                  ) : (
                    feedbackRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">
                          {req.employee?.firstName} {req.employee?.lastName}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold font-mono text-xs">
                          {req.reviewer?.firstName} {req.reviewer?.lastName}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-xs text-slate-500 font-semibold">{req.competencies}</td>
                        <td className="border-b border-[#eef2f6] p-3 text-xs text-slate-400">
                          {new Date(req.deadline).toLocaleDateString("en-IN")}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3">
                          <StatusPill tone={req.status === "SUBMITTED" ? "green" : "yellow"}>
                            {req.status}
                          </StatusPill>
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-right">
                          {req.status === "PENDING" && (
                            <button
                              className="rounded bg-brand text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-brand-dark transition"
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowResponseModal(true);
                              }}
                            >
                              Submit Review
                            </button>
                          )}
                          {req.status === "SUBMITTED" && (
                            <span className="text-xs text-slate-400 font-semibold">Response Logged</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* REQUEST MODAL */}
          {showRequestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-md font-bold text-slate-800">Dispatch 360 Feedback Request</h4>
                  <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setShowRequestModal(false)}>
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback Target Employee</label>
                    <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="employeeId" required>
                      <option value="">Select Target...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Reviewer (Colleague/Peer/Manager)</label>
                    <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="reviewerId" required>
                      <option value="">Select Reviewer...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Focus Competencies (comma separated)</label>
                    <input
                      className="min-h-10 w-full rounded-lg border px-3 text-sm"
                      value={competenciesInput}
                      onChange={(e) => setCompetenciesInput(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Completion Deadline</label>
                    <input className="min-h-10 w-full rounded-lg border px-3 text-sm" type="date" name="deadline" required />
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowRequestModal(false)}>Cancel</button>
                    <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Dispatch Request</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RESPONSE MODAL */}
          {showResponseModal && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="text-md font-bold text-slate-800">Submit 360 Peer Review</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Target: {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
                  </div>
                  <button className="p-1 hover:bg-slate-50 rounded" onClick={() => { setShowResponseModal(false); setSelectedRequest(null); }}>
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Competency Ratings</h5>
                    {selectedRequest.competencies.split(",").map(comp => {
                      const cleanComp = comp.trim();
                      return (
                        <div key={cleanComp} className="flex justify-between items-center gap-3">
                          <span className="text-sm font-semibold text-slate-700">{cleanComp}</span>
                          <select
                            className="min-h-10 rounded-lg border px-2 text-sm bg-white font-semibold"
                            value={ratings[cleanComp] || 4}
                            onChange={(e) => setRatings({ ...ratings, [cleanComp]: Number(e.target.value) })}
                          >
                            <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                            <option value="4">⭐⭐⭐⭐ (Good)</option>
                            <option value="3">⭐⭐⭐ (Average)</option>
                            <option value="2">⭐⭐ (Below Avg)</option>
                            <option value="1">⭐ (Poor)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Qualitative Feedback / Observational Comments</label>
                    <textarea
                      className="w-full rounded-lg border p-3 text-sm outline-none focus:border-brand h-24"
                      value={commentsInput}
                      onChange={(e) => setCommentsInput(e.target.value)}
                      placeholder="Discuss team contribution, alignment to values, and growth areas..."
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => { setShowResponseModal(false); setSelectedRequest(null); }}>Cancel</button>
                    <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Submit Feedback</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 mt-5">
          {message ? <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a]">{message}</div> : null}
          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
            <MetricCard label="Employees" value={String(data.employees)} note="Included in performance review" />
            <MetricCard label="Average Score" value={`${data.averageScore}%`} note="Attendance, goals and recognition" />
            <MetricCard label="Review Ready" value={String(data.reviewReady)} note="Eligible appraisal records" />
            <MetricCard label="Recognitions" value={String(data.recognitions)} note="Reward-backed signals" />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Review Readiness</h2>
                <p className="mt-1 text-sm text-muted">Goals, attendance, recognition and appraisal readiness in one place.</p>
              </div>
              <button className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white" onClick={launchCycle}>
                <Play className="h-4 w-4" /> Launch Cycle
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
              {data.categories.map((item) => (
                <div className="rounded-lg border border-[#dce2eb] p-4" key={item.name}>
                  <div className="mb-3 flex items-center justify-between">
                    <Target className="h-5 w-5 text-brand" />
                    <StatusPill tone={item.completed === item.total ? "green" : "yellow"}>{item.completed}/{item.total}</StatusPill>
                  </div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="mt-2 h-2 rounded-full bg-[#e8eef5]">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${progress(item.completed, item.total)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Performance Matrix</h2>
            <div className="overflow-auto">
              <table className="w-full min-w-[1020px] border-collapse text-sm">
                <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Employee</th>
                    <th className="border-b border-[#dce2eb] p-3">Department</th>
                    <th className="border-b border-[#dce2eb] p-3">Designation</th>
                    <th className="border-b border-[#dce2eb] p-3">Goals</th>
                    <th className="border-b border-[#dce2eb] p-3">Attendance</th>
                    <th className="border-b border-[#dce2eb] p-3">Recognition</th>
                    <th className="border-b border-[#dce2eb] p-3">Score</th>
                    <th className="border-b border-[#dce2eb] p-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row: PerformanceRow) => (
                    <tr key={row.employeeId}>
                      <td className="border-b border-[#dce2eb] p-3 font-semibold"><Award className="mr-2 inline h-4 w-4 text-brand" />{row.employee}</td>
                      <td className="border-b border-[#dce2eb] p-3">{row.department}</td>
                      <td className="border-b border-[#dce2eb] p-3">{row.designation}</td>
                      <td className="border-b border-[#dce2eb] p-3">{row.completedGoals}/{row.goals}</td>
                      <td className="border-b border-[#dce2eb] p-3">{row.attendanceScore}%</td>
                      <td className="border-b border-[#dce2eb] p-3">{row.recognitionPoints} pts</td>
                      <td className="border-b border-[#dce2eb] p-3"><TrendingUp className="mr-2 inline h-4 w-4 text-brand" />{row.performanceScore}%</td>
                      <td className="border-b border-[#dce2eb] p-3"><StatusPill tone={toneFor(row.rating)}>{row.rating}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Review Cycle Logs</h2>
            <div className="grid gap-2">
              {data.logs.map((log: PerformanceLog) => (
                <div className="flex items-center justify-between rounded-lg border border-[#dce2eb] p-3 text-sm" key={log.id}>
                  <span className="font-semibold">{log.action} / {log.status}</span>
                  <span className="text-muted">{String(log.createdAt).slice(0, 10)}</span>
                </div>
              ))}
              {!data.logs.length ? <div className="text-sm text-muted">No performance cycle launched yet.</div> : null}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
