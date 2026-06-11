"use client";

import { Award, Play, Target, TrendingUp, Users, Plus, MessageSquare, Star, Send, X, CalendarCheck, Download, CheckCircle, AlertCircle, FileText, User } from "lucide-react";
import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackPerformance } from "../lib/fallback-data";
import { emptyPerformance } from "../lib/live-data";
import { Card, MetricCard, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { useActiveRole } from "../lib/role";

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
  appraisalId?: string | null;
  requestorId: string;
  providerId: string;
  status: string; // PENDING, SUBMITTED
  questions: any;
  answers?: any;
  createdAt: string;
  requestor?: { firstName: string; lastName: string; employeeCode: string };
  provider?: { firstName: string; lastName: string; employeeCode: string };
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { role } = useActiveRole();
  const isAdminView = role === "admin";

  // Data lists
  const [cycles, setCycles] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);

  // Modals & Editors
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Selected Entities
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);

  // Form inputs
  const [cycleName, setCycleName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [templateName, setTemplateName] = useState("");
  const [kras, setKras] = useState<Array<{ title: string; weightagePercent: number }>>([
    { title: "Deliverables & Code Quality", weightagePercent: 40 },
    { title: "Team Collaboration & Support", weightagePercent: 30 },
    { title: "Innovation & Continuous Learning", weightagePercent: 30 },
  ]);

  const [bulkCycleId, setBulkCycleId] = useState("");
  const [bulkTemplateId, setBulkTemplateId] = useState("");

  // Ratings inputs
  const [selfRatings, setSelfRatings] = useState<Record<string, { rating: number; description: string }>>({});
  const [managerRatings, setManagerRatings] = useState<Record<string, { rating: number }>>({});
  const [incrementThreshold, setIncrementThreshold] = useState(4.0);

  // 360 Feedback Inputs
  const [competenciesInput, setCompetenciesInput] = useState("Leadership, Communication, Technical Proficiency");
  const [commentsInput, setCommentsInput] = useState("");
  const [peerRatings, setPeerRatings] = useState<Record<string, number>>({
    Leadership: 4,
    Communication: 4,
    Technical: 4,
  });

  const kraWeightageSum = kras.reduce((sum, k) => sum + Number(k.weightagePercent), 0);

  function load() {
    apiFetch<any>("/auth/me")
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => undefined);

    apiFetch<PerformanceData>("/performance")
      .then((body) => {
        if (body.data) setData(body.data);
      })
      .catch(() => undefined);

    loadCycles();
    loadTemplates();
    loadAppraisals();
    loadFeedbackRequests();
    loadEmployees();
  }

  async function loadCycles() {
    try {
      const res = await apiFetch<any[]>("/performance/cycles");
      setCycles(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTemplates() {
    try {
      const res = await apiFetch<any[]>("/performance/templates");
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAppraisals() {
    try {
      const res = await apiFetch<any[]>("/performance/appraisals");
      setAppraisals(res.data || []);
    } catch (err) {
      console.error(err);
    }
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
  }, [role]);

  // Cycle handlers
  async function handleCreateCycle(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/performance/cycles", {
        method: "POST",
        body: JSON.stringify({ name: cycleName, startDate, endDate, status: "DRAFT" }),
      });
      setMessage("Appraisal cycle created successfully.");
      setCycleName("");
      setStartDate("");
      setEndDate("");
      setShowCycleModal(false);
      loadCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    }
  }

  async function activateCycle(id: string) {
    try {
      await apiFetch(`/performance/cycles/${id}/activate`, { method: "POST" });
      setMessage("Appraisal cycle activated successfully.");
      loadCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
    }
  }

  async function completeCycle(id: string) {
    try {
      await apiFetch(`/performance/cycles/${id}/complete`, { method: "POST" });
      setMessage("Appraisal cycle marked completed.");
      loadCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Completion failed");
    }
  }

  // Template handlers
  async function handleCreateTemplate(e: FormEvent) {
    e.preventDefault();
    if (kraWeightageSum !== 100) {
      setError("Weightages must sum to 100%");
      return;
    }
    setMessage("");
    setError("");
    try {
      await apiFetch("/performance/templates", {
        method: "POST",
        body: JSON.stringify({ name: templateName, kras }),
      });
      setMessage("Appraisal template created successfully.");
      setTemplateName("");
      setKras([
        { title: "Deliverables & Code Quality", weightagePercent: 40 },
        { title: "Team Collaboration & Support", weightagePercent: 30 },
        { title: "Innovation & Continuous Learning", weightagePercent: 30 },
      ]);
      setShowTemplateModal(false);
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    }
  }

  // Bulk appraisal creation handler
  async function handleBulkCreate(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/performance/appraisals/create-for-cycle", {
        method: "POST",
        body: JSON.stringify({ cycleId: bulkCycleId, templateId: bulkTemplateId }),
      });
      setMessage("Appraisals created in bulk successfully.");
      setBulkCycleId("");
      setBulkTemplateId("");
      setShowBulkModal(false);
      loadAppraisals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk creation failed");
    }
  }

  // Self Rate Submit
  async function handleSelfRate(appraisalId: string, event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const ratingsArray = Object.entries(selfRatings).map(([kraId, val]) => ({
      kraId,
      rating: val.rating,
      description: val.description,
    }));
    try {
      await apiFetch(`/performance/appraisals/${appraisalId}/self-rate`, {
        method: "POST",
        body: JSON.stringify({ ratings: ratingsArray }),
      });
      setMessage("Self rating submitted successfully.");
      setSelectedAppraisal(null);
      loadAppraisals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
    }
  }

  // Manager Rate Submit
  async function handleManagerRate(appraisalId: string, event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const ratingsArray = Object.entries(managerRatings).map(([kraId, val]) => ({
      kraId,
      rating: val.rating,
    }));
    try {
      await apiFetch(`/performance/appraisals/${appraisalId}/manager-rate`, {
        method: "POST",
        body: JSON.stringify({ ratings: ratingsArray }),
      });
      setMessage("Manager rating submitted successfully.");
      setSelectedAppraisal(null);
      loadAppraisals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
    }
  }

  // Complete Appraisal (HR action)
  async function completeAppraisal(appraisalId: string) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/performance/appraisals/${appraisalId}/complete`, {
        method: "POST",
        body: JSON.stringify({ incrementThreshold }),
      });
      setMessage("Appraisal review completed. Suggested increments/promotions have been logged as pending.");
      setSelectedAppraisal(null);
      loadAppraisals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete appraisal");
    }
  }

  // 360 Feedback Handlers
  async function handleCreateRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/performance/feedback/requests", {
        method: "POST",
        body: JSON.stringify({
          appraisalId: selectedAppraisal?.id || null,
          requestorId: String(form.get("requestorId")),
          providerId: String(form.get("providerId")),
          questions: competenciesInput.split(",").map(c => c.trim()),
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
      await apiFetch(`/performance/feedback/requests/${selectedRequest.id}/respond`, {
        method: "POST",
        body: JSON.stringify({
          answers: { ratings: peerRatings, comments: commentsInput },
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

  // Role visibility filtering
  const myAppraisals = appraisals.filter(app => app.employeeId === currentUser?.employeeId);
  const teamAppraisals = appraisals.filter(app => app.employeeId !== currentUser?.employeeId);

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="PMS"
        title="Performance Management"
        summary="Goals, templates, self & manager ratings, 360 peer feedback, and appraisal cycle results."
        tabs={
          isAdminView
            ? ["Dashboard", "Cycles", "Templates", "Team Appraisals", "Results", "360 Feedback"]
            : ["Dashboard", "My Appraisal", "Team Appraisals", "Results", "360 Feedback"]
        }
        activeTab={activeTab}
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSelectedAppraisal(null);
        }}
        actions={
          isAdminView
            ? [
                { label: "New Cycle", icon: <CalendarCheck className="h-4 w-4" />, tone: "primary", onClick: () => setShowCycleModal(true) },
                { label: "New Template", icon: <Plus className="h-4 w-4" />, onClick: () => setShowTemplateModal(true) },
                { label: "Bulk Appraise", icon: <Users className="h-4 w-4" />, onClick: () => setShowBulkModal(true) },
              ]
            : []
        }
        stats={[
          { label: "Active Cycles", value: String(cycles.filter(c => c.status === "ACTIVE").length), note: "Reviews ongoing" },
          { label: "My Reviews", value: String(myAppraisals.length), note: "Self rating status" },
          { label: "Team Reviews", value: String(teamAppraisals.length), note: "Reports grading" },
        ]}
      />
      <ReferenceFlowStrip module="PMS" />

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 mt-5">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 mt-5">{error}</div>}

      {/* DASHBOARD TAB */}
      {activeTab === "Dashboard" && (
        <div className="grid gap-5 mt-5">
          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
            <MetricCard label="Employees Scored" value={String(data.employees)} note="Scored in active cycle" />
            <MetricCard label="Average Rating" value={`${data.averageScore}%`} note="Based on completed reviews" />
            <MetricCard label="Appraisals Total" value={String(appraisals.length)} note="Created across cycles" />
            <MetricCard label="Cycles" value={String(cycles.length)} note="Configured templates & cycles" />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Review Readiness Dashboard</h2>
                <p className="mt-1 text-sm text-muted">Statutory calculations, employee alignment, and peer feedback counts.</p>
              </div>
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
            <h2 className="mb-4 text-lg font-semibold">Performance Summary Matrix</h2>
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
        </div>
      )}

      {/* CYCLES TAB (HR ONLY) */}
      {activeTab === "Cycles" && isAdminView && (
        <div className="grid gap-5 mt-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Appraisal Review Cycles</h3>
            <button
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white flex items-center gap-2 hover:bg-brand-dark"
              onClick={() => setShowCycleModal(true)}
            >
              <Plus className="h-4 w-4" /> Create Appraisal Cycle
            </button>
          </div>

          <Card>
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Cycle Name</th>
                    <th className="border-b border-[#dce2eb] p-3">Start Date</th>
                    <th className="border-b border-[#dce2eb] p-3">End Date</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                    <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                        No appraisal cycles configured.
                      </td>
                    </tr>
                  ) : (
                    cycles.map((cy) => (
                      <tr key={cy.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">{cy.name}</td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600">{new Date(cy.startDate).toLocaleDateString("en-IN")}</td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600">{new Date(cy.endDate).toLocaleDateString("en-IN")}</td>
                        <td className="border-b border-[#eef2f6] p-3">
                          <StatusPill tone={cy.status === "ACTIVE" ? "green" : cy.status === "COMPLETED" ? "blue" : "yellow"}>
                            {cy.status}
                          </StatusPill>
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-right space-x-2">
                          {cy.status === "DRAFT" && (
                            <button
                              className="rounded bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-emerald-700"
                              onClick={() => activateCycle(cy.id)}
                            >
                              Activate
                            </button>
                          )}
                          {cy.status === "ACTIVE" && (
                            <button
                              className="rounded bg-rose-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-rose-700"
                              onClick={() => completeCycle(cy.id)}
                            >
                              Complete Cycle
                            </button>
                          )}
                          {cy.status === "COMPLETED" && (
                            <span className="text-xs text-slate-400 font-semibold">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TEMPLATES TAB (HR ONLY) */}
      {activeTab === "Templates" && isAdminView && (
        <div className="grid gap-5 mt-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Appraisal KRA Templates</h3>
            <button
              className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white flex items-center gap-2 hover:bg-brand-dark"
              onClick={() => setShowTemplateModal(true)}
            >
              <Plus className="h-4 w-4" /> Create template
            </button>
          </div>

          <Card>
            <div className="grid gap-4">
              {templates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-semibold">
                  No appraisal templates configured.
                </div>
              ) : (
                templates.map((temp) => (
                  <div key={temp.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-md">{temp.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {temp.kras.map((k: any) => (
                          <span key={k.id} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 font-semibold">
                            {k.title} ({k.weightagePercent}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MY APPRAISAL TAB (EMPLOYEE VIEW) */}
      {activeTab === "My Appraisal" && !isAdminView && (
        <div className="grid gap-5 mt-5">
          <h3 className="text-lg font-semibold text-slate-800">My Appraisals</h3>

          {selectedAppraisal ? (
            <Card>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                  <h4 className="font-bold text-slate-800">Fill Self Assessment</h4>
                  <p className="text-xs text-slate-400">Review Template: {selectedAppraisal.template?.name}</p>
                </div>
                <button
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                  onClick={() => setSelectedAppraisal(null)}
                >
                  Back to List
                </button>
              </div>

              <form onSubmit={(e) => handleSelfRate(selectedAppraisal.id, e)} className="space-y-5">
                {selectedAppraisal.template?.kras.map((kra: any) => (
                  <div key={kra.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 text-sm">{kra.title}</span>
                      <span className="text-xs font-semibold text-slate-400">Weightage: {kra.weightagePercent}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Self Rating (1-5)</label>
                        <select
                          className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white font-semibold"
                          required
                          value={selfRatings[kra.id]?.rating || ""}
                          onChange={(e) =>
                            setSelfRatings({
                              ...selfRatings,
                              [kra.id]: {
                                ...selfRatings[kra.id],
                                rating: Number(e.target.value),
                              },
                            })
                          }
                        >
                          <option value="">Select rating...</option>
                          <option value="5">5 - Outstanding</option>
                          <option value="4">4 - Exceeds Expectations</option>
                          <option value="3">3 - Meets Expectations</option>
                          <option value="2">2 - Needs Improvement</option>
                          <option value="1">1 - Unsatisfactory</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Observation / Achievements Description</label>
                        <input
                          className="min-h-10 w-full rounded-lg border px-3 text-sm"
                          type="text"
                          required
                          placeholder="Describe how you met this KRA..."
                          value={selfRatings[kra.id]?.description || ""}
                          onChange={(e) =>
                            setSelfRatings({
                              ...selfRatings,
                              [kra.id]: {
                                ...selfRatings[kra.id],
                                description: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
                    type="button"
                    onClick={() => setSelectedAppraisal(null)}
                  >
                    Cancel
                  </button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">
                    Submit Assessment
                  </button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                  <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="border-b border-[#dce2eb] p-3">Cycle Name</th>
                      <th className="border-b border-[#dce2eb] p-3">Template Name</th>
                      <th className="border-b border-[#dce2eb] p-3">Self Score</th>
                      <th className="border-b border-[#dce2eb] p-3">Status</th>
                      <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAppraisals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                          No appraisals logged for you.
                        </td>
                      </tr>
                    ) : (
                      myAppraisals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition">
                          <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">{app.cycle?.name}</td>
                          <td className="border-b border-[#eef2f6] p-3 text-slate-600">{app.template?.name}</td>
                          <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-600">
                            {app.selfScore ? Number(app.selfScore).toFixed(2) : "-"}
                          </td>
                          <td className="border-b border-[#eef2f6] p-3">
                            <StatusPill tone={app.status === "COMPLETED" ? "green" : app.status === "MANAGER_DONE" ? "blue" : app.status === "SELF_DONE" ? "indigo" : "yellow"}>
                              {app.status}
                            </StatusPill>
                          </td>
                          <td className="border-b border-[#eef2f6] p-3 text-right">
                            {app.status === "PENDING" ? (
                              <button
                                className="rounded bg-brand text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-brand-dark transition"
                                onClick={() => setSelectedAppraisal(app)}
                              >
                                Self Assess
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold">Submitted</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TEAM APPRAISALS TAB (MANAGER / HR VIEW) */}
      {activeTab === "Team Appraisals" && (
        <div className="grid gap-5 mt-5">
          <h3 className="text-lg font-semibold text-slate-800">Team Appraisals</h3>

          {selectedAppraisal ? (
            <Card>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                  <h4 className="font-bold text-slate-800">Grade Performance</h4>
                  <p className="text-xs text-slate-400">Employee: {selectedAppraisal.employee?.firstName} {selectedAppraisal.employee?.lastName} ({selectedAppraisal.employee?.employeeCode})</p>
                </div>
                <button
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 text-xs font-semibold"
                  onClick={() => setSelectedAppraisal(null)}
                >
                  Back to List
                </button>
              </div>

              {selectedAppraisal.status === "SELF_DONE" ? (
                <form onSubmit={(e) => handleManagerRate(selectedAppraisal.id, e)} className="space-y-5">
                  {selectedAppraisal.template?.kras.map((kra: any) => {
                    const goal = selectedAppraisal.goals?.find((g: any) => g.kraId === kra.id);
                    return (
                      <div key={kra.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 text-sm">{kra.title}</span>
                          <span className="text-xs font-semibold text-slate-400">Weightage: {kra.weightagePercent}%</span>
                        </div>

                        <div className="text-xs border-l-4 border-slate-300 pl-3 py-1 space-y-1 bg-white rounded p-2">
                          <div className="font-semibold text-slate-500">Employee Self Score: {goal?.selfRating ? `${goal.selfRating}/5` : "Not rated"}</div>
                          <div className="text-slate-600 font-medium">Employee Notes: {goal?.description || "No notes submitted"}</div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Manager Rating (1-5)</label>
                          <select
                            className="min-h-10 w-full max-w-xs rounded-lg border px-3 text-sm bg-white font-semibold"
                            required
                            value={managerRatings[kra.id]?.rating || ""}
                            onChange={(e) =>
                              setManagerRatings({
                                ...managerRatings,
                                [kra.id]: {
                                  rating: Number(e.target.value),
                                },
                              })
                            }
                          >
                            <option value="">Select rating...</option>
                            <option value="5">5 - Outstanding</option>
                            <option value="4">4 - Exceeds Expectations</option>
                            <option value="3">3 - Meets Expectations</option>
                            <option value="2">2 - Needs Improvement</option>
                            <option value="1">1 - Unsatisfactory</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-2 border-t pt-4">
                    <button
                      className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
                      type="button"
                      onClick={() => setSelectedAppraisal(null)}
                    >
                      Cancel
                    </button>
                    <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">
                      Submit Ratings
                    </button>
                  </div>
                </form>
              ) : selectedAppraisal.status === "MANAGER_DONE" && isAdminView ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                      <span>Self Score: {selectedAppraisal.selfScore ? Number(selectedAppraisal.selfScore).toFixed(2) : "-"}</span>
                      <span>Manager Score: {selectedAppraisal.managerScore ? Number(selectedAppraisal.managerScore).toFixed(2) : "-"}</span>
                    </div>
                    <p className="text-xs text-slate-400">To finalize this appraisal, review and lock it below. If the score meets or exceeds the threshold, a 10% CTC increment suggestion will be created.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Increment Threshold Score</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="min-h-10 w-full max-w-xs rounded-lg border px-3 text-sm"
                        value={incrementThreshold}
                        onChange={(e) => setIncrementThreshold(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-4">
                    <button
                      className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50"
                      type="button"
                      onClick={() => setSelectedAppraisal(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                      type="button"
                      onClick={() => completeAppraisal(selectedAppraisal.id)}
                    >
                      Complete & Finalize
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 font-semibold">
                  This appraisal is currently in status: {selectedAppraisal.status}. No action is available.
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <div className="overflow-auto">
                <table className="w-full min-w-[800px] border-collapse text-sm text-left">
                  <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="border-b border-[#dce2eb] p-3">Employee</th>
                      <th className="border-b border-[#dce2eb] p-3">Cycle</th>
                      <th className="border-b border-[#dce2eb] p-3">Self Score</th>
                      <th className="border-b border-[#dce2eb] p-3">Manager Score</th>
                      <th className="border-b border-[#dce2eb] p-3">Status</th>
                      <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamAppraisals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          No report appraisals logged.
                        </td>
                      </tr>
                    ) : (
                      teamAppraisals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition">
                          <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">
                            {app.employee?.firstName} {app.employee?.lastName} ({app.employee?.employeeCode})
                          </td>
                          <td className="border-b border-[#eef2f6] p-3 text-slate-600">{app.cycle?.name}</td>
                          <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold">
                            {app.selfScore ? Number(app.selfScore).toFixed(2) : "-"}
                          </td>
                          <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold">
                            {app.managerScore ? Number(app.managerScore).toFixed(2) : "-"}
                          </td>
                          <td className="border-b border-[#eef2f6] p-3">
                            <StatusPill tone={app.status === "COMPLETED" ? "green" : app.status === "MANAGER_DONE" ? "blue" : app.status === "SELF_DONE" ? "indigo" : "yellow"}>
                              {app.status}
                            </StatusPill>
                          </td>
                          <td className="border-b border-[#eef2f6] p-3 text-right">
                            {app.status === "SELF_DONE" && (
                              <button
                                className="rounded bg-brand text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-brand-dark transition"
                                onClick={() => setSelectedAppraisal(app)}
                              >
                                Grade Report
                              </button>
                            )}
                            {app.status === "MANAGER_DONE" && isAdminView && (
                              <button
                                className="rounded bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-emerald-700 transition"
                                onClick={() => setSelectedAppraisal(app)}
                              >
                                Finalize (HR)
                              </button>
                            )}
                            {app.status === "COMPLETED" && (
                              <span className="text-xs text-slate-400 font-semibold">Completed</span>
                            )}
                            {app.status === "PENDING" && (
                              <span className="text-xs text-slate-400 font-semibold">Awaiting Employee</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === "Results" && (
        <div className="grid gap-5 mt-5">
          <h3 className="text-lg font-semibold text-slate-800">Appraisal Results Summary</h3>

          <Card>
            <div className="overflow-auto">
              <table className="w-full min-w-[800px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Employee</th>
                    <th className="border-b border-[#dce2eb] p-3">Cycle Name</th>
                    <th className="border-b border-[#dce2eb] p-3">Self Score</th>
                    <th className="border-b border-[#dce2eb] p-3">Manager Score</th>
                    <th className="border-b border-[#dce2eb] p-3">Final Score</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No appraisal results logged yet.
                      </td>
                    </tr>
                  ) : (
                    appraisals.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">
                          {app.employee?.firstName} {app.employee?.lastName} ({app.employee?.employeeCode})
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600">{app.cycle?.name}</td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold">
                          {app.selfScore ? Number(app.selfScore).toFixed(2) : "-"}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold">
                          {app.managerScore ? Number(app.managerScore).toFixed(2) : "-"}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-brand font-bold">
                          {app.finalScore ? Number(app.finalScore).toFixed(2) : "-"}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3">
                          <StatusPill tone={app.status === "COMPLETED" ? "green" : app.status === "MANAGER_DONE" ? "blue" : app.status === "SELF_DONE" ? "indigo" : "yellow"}>
                            {app.status}
                          </StatusPill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 360 FEEDBACK TAB */}
      {activeTab === "360 Feedback" && (
        <div className="grid gap-5 mt-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">360-Degree Peer Feedback Requests</h3>
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
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                    <th className="border-b border-[#dce2eb] p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                        No 360 feedback requests logged.
                      </td>
                    </tr>
                  ) : (
                    feedbackRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[#eef2f6] p-3 font-semibold text-slate-800">
                          {req.requestor?.firstName} {req.requestor?.lastName}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-slate-600 font-semibold">
                          {req.provider?.firstName} {req.provider?.lastName}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-xs text-slate-500 font-semibold">
                          {Array.isArray(req.questions) ? req.questions.join(", ") : String(req.questions)}
                        </td>
                        <td className="border-b border-[#eef2f6] p-3">
                          <StatusPill tone={req.status === "SUBMITTED" ? "green" : "yellow"}>
                            {req.status}
                          </StatusPill>
                        </td>
                        <td className="border-b border-[#eef2f6] p-3 text-right">
                          {req.status === "PENDING" && currentUser?.employeeId === req.providerId && (
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
                          {req.status === "PENDING" && currentUser?.employeeId !== req.providerId && (
                            <span className="text-xs text-slate-400 font-semibold">Pending Peer Review</span>
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
        </div>
      )}

      {/* CREATE CYCLE MODAL */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-md font-bold text-slate-800">Launch Appraisal Cycle</h4>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setShowCycleModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cycle Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border px-3 text-sm"
                  type="text"
                  required
                  placeholder="e.g. H2 2026 Mid-Year Review"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    className="min-h-10 w-full rounded-lg border px-3 text-sm"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    className="min-h-10 w-full rounded-lg border px-3 text-sm"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowCycleModal(false)}>Cancel</button>
                <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Create Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-md font-bold text-slate-800">Add Appraisal Template</h4>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setShowTemplateModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Template Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border px-3 text-sm"
                  type="text"
                  required
                  placeholder="e.g. Sales Team Template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Result Areas (KRAs)</h5>
                  <button
                    type="button"
                    className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
                    onClick={() => setKras([...kras, { title: "", weightagePercent: 0 }])}
                  >
                    <Plus className="h-3 w-3" /> Add KRA
                  </button>
                </div>

                {kras.map((kra, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input
                      className="min-h-10 flex-1 rounded-lg border px-3 text-sm"
                      type="text"
                      required
                      placeholder="KRA Title (e.g. Sales Volume)"
                      value={kra.title}
                      onChange={(e) => {
                        const next = [...kras];
                        next[idx].title = e.target.value;
                        setKras(next);
                      }}
                    />
                    <input
                      className="min-h-10 w-24 rounded-lg border px-3 text-sm text-center"
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="Wt %"
                      value={kra.weightagePercent || ""}
                      onChange={(e) => {
                        const next = [...kras];
                        next[idx].weightagePercent = Number(e.target.value);
                        setKras(next);
                      }}
                    />
                    <button
                      type="button"
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                      onClick={() => setKras(kras.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center border-t pt-3 mt-3">
                  <span className="text-xs font-semibold text-slate-500">Live Weightage Sum:</span>
                  <span className={`text-sm font-bold flex items-center gap-1 ${kraWeightageSum === 100 ? "text-emerald-600" : "text-rose-600"}`}>
                    {kraWeightageSum === 100 ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {kraWeightageSum}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                  type="submit"
                  disabled={kraWeightageSum !== 100}
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK APPRAISAL MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-md font-bold text-slate-800">Bulk Appraisal Creation</h4>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setShowBulkModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Appraisal Cycle</label>
                <select
                  className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white"
                  required
                  value={bulkCycleId}
                  onChange={(e) => setBulkCycleId(e.target.value)}
                >
                  <option value="">Select Cycle...</option>
                  {cycles.filter(c => c.status === "ACTIVE").map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select KRA Template</label>
                <select
                  className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white"
                  required
                  value={bulkTemplateId}
                  onChange={(e) => setBulkTemplateId(e.target.value)}
                >
                  <option value="">Select Template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400">This will automatically generate pending appraisals and KRA goals for all active employees.</p>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Create Appraisals</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH 360 MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-md font-bold text-slate-800">Request 360 Peer Review</h4>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => setShowRequestModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback Requestor (Employee being reviewed)</label>
                <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="requestorId" required>
                  <option value="">Select target employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback Provider (Reviewer)</label>
                <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="providerId" required>
                  <option value="">Select reviewer...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Competencies to Evaluate (comma separated)</label>
                <input
                  className="min-h-10 w-full rounded-lg border px-3 text-sm"
                  value={competenciesInput}
                  onChange={(e) => setCompetenciesInput(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Dispatch Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PEER REVIEW RESPONSE MODAL */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-md font-bold text-slate-800">Submit 360 Peer Review</h4>
                <p className="text-xs text-slate-400 mt-0.5">Target: {selectedRequest.requestor?.firstName} {selectedRequest.requestor?.lastName}</p>
              </div>
              <button className="p-1 hover:bg-slate-50 rounded" onClick={() => { setShowResponseModal(false); setSelectedRequest(null); }}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Competency Ratings</h5>
                {(Array.isArray(selectedRequest.questions) ? selectedRequest.questions : []).map((comp: string) => {
                  const cleanComp = comp.trim();
                  return (
                    <div key={cleanComp} className="flex justify-between items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700">{cleanComp}</span>
                      <select
                        className="min-h-10 rounded-lg border px-2 text-sm bg-white font-semibold"
                        value={peerRatings[cleanComp] || 4}
                        onChange={(e) => setPeerRatings({ ...peerRatings, [cleanComp]: Number(e.target.value) })}
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
    </>
  );
}
