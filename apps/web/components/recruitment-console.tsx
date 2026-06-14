"use client";

import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { getCurrentCompanyId } from "../lib/session";
import { Card, StatusPill } from "./ui";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import {
  Plus,
  Search,
  Calendar,
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  X,
  Star,
  FileSignature,
  Landmark,
  Clock,
  Users,
  MapPin,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface Requisition {
  id: string;
  title: string;
  openings: number;
  status: string;
  department: { name: string };
  requestedBy: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string } | null;
  reason?: string | null;
  createdAt: string;
}

interface JobPosting {
  id: string;
  title: string;
  openings: number;
  status: string;
  createdAt: string;
  requisition?: Requisition | null;
  applications?: any[];
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  source?: string | null;
  currentStage: string;
  createdAt: string;
  applications?: any[];
}

interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  mode: string;
  status: string;
  feedback?: string | null;
  application: {
    candidate: { fullName: string; email: string };
    jobPosting: { title: string };
  };
  interviewers: Array<{ employee: { firstName: string; lastName: string } }>;
  feedbacks: Array<{ interviewer: { firstName: string; lastName: string }; rating: number; comments: string; recommendation: string }>;
  round?: { name: string } | null;
}

interface JobOffer {
  id: string;
  offeredCtc: number;
  joiningDate: string;
  status: string;
  createdAt: string;
  application: {
    candidate: { fullName: string };
    jobPosting: { title: string };
  };
  terms: Array<{ title: string; description: string }>;
}

export function RecruitmentConsole() {
  const [activeTab, setActiveTab] = useState("Job Openings");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Panel toggles
  const [showAddPosting, setShowAddPosting] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showRequestRequisition, setShowRequestRequisition] = useState(false);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);

  // Inspector & detail states
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data states
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [staffingPlans, setStaffingPlans] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAddStaffingPlan, setShowAddStaffingPlan] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [designationsList, setDesignationsList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<any[]>([]);

  function loadOrgDropdowns() {
    apiFetch<any[]>("/organization/departments")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDepartmentsList(res.data.map((d: any) => ({ value: d.id, label: d.name })));
        }
      })
      .catch(() => undefined);

    apiFetch<any[]>("/organization/designations")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDesignationsList(res.data.map((d: any) => ({ value: d.id, label: d.title })));
        }
      })
      .catch(() => undefined);

    apiFetch<any[]>("/organization/locations")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setLocationsList(res.data.map((l: any) => ({ value: l.id, label: `${l.name} (${l.city})` })));
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    loadOrgDropdowns();
    return onDataRefresh("organization", () => {
      loadOrgDropdowns();
    });
  }, []);

  // Load user details
  useEffect(() => {
    apiFetch<any>("/auth/me")
      .then((res) => {
        if (res.data) setCurrentUser(res.data);
      })
      .catch(() => undefined);
  }, []);

  // Fetch data depending on active tab
  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  // Load helpers (employees)
  useEffect(() => {
    apiFetch<any[]>("/employees")
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch(() => undefined);
  }, []);

  async function fetchTabData() {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "Job Openings") {
        const res = await apiFetch<JobPosting[]>("/recruitment/job-postings");
        setJobPostings(res.data || []);
      } else if (activeTab === "Candidates") {
        const res = await apiFetch<Candidate[]>("/recruitment/candidates");
        setCandidates(res.data || []);
      } else if (activeTab === "Requisitions") {
        const res = await apiFetch<Requisition[]>("/recruitment/requisitions");
        setRequisitions(res.data || []);
      } else if (activeTab === "Interviews") {
        const res = await apiFetch<Interview[]>("/recruitment/interviews");
        setInterviews(res.data || []);
      } else if (activeTab === "Job Offers") {
        const res = await apiFetch<JobOffer[]>("/recruitment/job-offers");
        setJobOffers(res.data || []);
      } else if (activeTab === "Staffing Plans") {
        const res = await apiFetch<any[]>(`/recruitment/staffing-plans/list/${getCurrentCompanyId()}`);
        setStaffingPlans(res.data || []);
      } else if (activeTab === "Referrals") {
        const res = await apiFetch<any[]>("/recruitment/referrals");
        setReferrals(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Load detail candidate
  useEffect(() => {
    if (selectedCandidateId) {
      const cand = candidates.find(c => c.id === selectedCandidateId);
      if (cand) {
        setSelectedCandidate(cand);
      }
    } else {
      setSelectedCandidate(null);
    }
  }, [selectedCandidateId, candidates]);

  // Actions
  async function handleAddPosting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/recruitment/job-postings", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title")),
          departmentId: String(form.get("departmentId")) || undefined,
          locationId: String(form.get("locationId")) || undefined,
          openings: Number(form.get("openings")),
          requisitionId: String(form.get("requisitionId")) || undefined,
        }),
      });
      setMessage("Job Posting created successfully!");
      setShowAddPosting(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCandidate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const candRes = await apiFetch<Candidate>("/recruitment/candidates", {
        method: "POST",
        body: JSON.stringify({
          fullName: String(form.get("fullName")),
          email: String(form.get("email")),
          phone: String(form.get("phone")) || undefined,
          resumeUrl: String(form.get("resumeUrl")) || undefined,
          source: String(form.get("source")) || undefined,
        }),
      });

      const postingId = String(form.get("postingId"));
      if (postingId && candRes.data) {
        await apiFetch("/recruitment/applications", {
          method: "POST",
          body: JSON.stringify({
            jobPostingId: postingId,
            candidateId: candRes.data.id,
          }),
        });
      }

      setMessage("Candidate added successfully!");
      setShowAddCandidate(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Candidate addition failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestRequisition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/recruitment/requisitions", {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("title")),
          departmentId: String(form.get("departmentId")),
          designationId: String(form.get("designationId")),
          openings: Number(form.get("openings")),
          requestedById: currentUser?.employeeId || undefined,
        }),
      });
      setMessage("Headcount requisition submitted successfully!");
      setShowRequestRequisition(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleInterview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const interviewers = Array.from(form.getAll("interviewerIds")).map(String);
      await apiFetch("/recruitment/interviews", {
        method: "POST",
        body: JSON.stringify({
          applicationId: String(form.get("applicationId")),
          scheduledAt: new Date(String(form.get("scheduledAt"))).toISOString(),
          mode: String(form.get("mode")),
          roundName: String(form.get("roundName")),
          interviewerIds: interviewers,
        }),
      });
      setMessage("Interview scheduled successfully!");
      setShowScheduleInterview(false);
      if (selectedCandidateId) {
        // Refresh candidate list to update sub-records
        const res = await apiFetch<Candidate[]>("/recruitment/candidates");
        setCandidates(res.data || []);
      } else {
        fetchTabData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeedback(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedInterview) return;
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch(`/recruitment/interviews/${selectedInterview.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          interviewerEmployeeId: currentUser?.employeeId || undefined,
          rating: Number(form.get("rating")),
          comments: String(form.get("comments")),
          recommendation: String(form.get("recommendation")), // HIRE, REJECT, HOLD
        }),
      });
      setMessage("Interview scorecard submitted successfully!");
      setShowAddFeedback(false);
      setSelectedInterview(null);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/recruitment/job-offers", {
        method: "POST",
        body: JSON.stringify({
          applicationId: String(form.get("applicationId")),
          offeredCtc: Number(form.get("offeredCtc")),
          joiningDate: new Date(String(form.get("joiningDate"))).toISOString(),
          terms: [
            { title: "Probation Period", description: "6 months from the date of joining." },
            { title: "Notice Period", description: "90 days notice period applies on either side." },
          ],
        }),
      });
      setMessage("Job Offer created successfully!");
      setShowCreateOffer(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Offer creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecideRequisition(id: string, status: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/recruitment/requisitions/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          approvedById: currentUser?.employeeId || undefined,
          reason: `Approved via console by ${currentUser?.email}`,
        }),
      });
      setMessage(`Requisition ${status.toLowerCase()} successfully.`);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStage(applicationId: string, stage: string) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/recruitment/applications/${applicationId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });
      setMessage(`Candidate stage updated to ${stage}.`);
      
      // Refresh candidates list
      const res = await apiFetch<Candidate[]>("/recruitment/candidates");
      setCandidates(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stage update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStaffingPlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/recruitment/staffing-plans", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          departmentId: String(form.get("departmentId")),
          designationId: String(form.get("designationId")),
          budgetedHeadcount: Number(form.get("budgetedHeadcount")),
          startDate: new Date(String(form.get("startDate"))).toISOString(),
          endDate: new Date(String(form.get("endDate"))).toISOString(),
        }),
      });
      setMessage("Staffing plan created successfully!");
      setShowAddStaffingPlan(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan creation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddReferral(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/recruitment/referrals", {
        method: "POST",
        body: JSON.stringify({
          referrerId: currentUser?.employeeId || undefined,
          candidateName: String(form.get("candidateName")),
          candidateEmail: String(form.get("candidateEmail")),
          candidatePhone: String(form.get("candidatePhone")) || undefined,
          jobPostingId: String(form.get("jobPostingId")),
          bonusAmount: Number(form.get("bonusAmount")) || 0,
        }),
      });
      setMessage("Referral submitted successfully!");
      setShowAddReferral(false);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Referral submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecideReferral(id: string, status: string) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch(`/recruitment/referrals/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`Referral status updated to ${status}.`);
      fetchTabData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  // Filter lists based on search query
  const filteredPostings = jobPostings.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCandidates = candidates.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.currentStage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequisitions = requisitions.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInterviews = interviews.filter(i =>
    i.application.candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.application.jobPosting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOffers = jobOffers.filter(o =>
    o.application.candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isHrOrAdmin = currentUser?.roles?.includes("SUPER_ADMIN") || currentUser?.roles?.includes("HR_ADMIN");

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Recruitment"
        title="Recruitment Workspace"
        summary="Request headcount approvals, track active job vacancies, inspect candidate scorecard stages, and issue offer letters."
        tabs={["Job Openings", "Candidates", "Requisitions", "Interviews", "Job Offers", "Staffing Plans", "Referrals"]}
        activeTab={activeTab}
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setMessage("");
          setError("");
          setSelectedCandidateId(null);
          setSelectedInterview(null);
        }}
        actions={[
          { label: "Request Headcount", icon: <Plus className="h-4 w-4" />, tone: "primary", onClick: () => { setActiveTab("Requisitions"); setShowRequestRequisition(true); } },
          { label: "Add Candidate", icon: <User className="h-4 w-4" />, onClick: () => { setActiveTab("Candidates"); setShowAddCandidate(true); } },
          { label: "Create Job Vacancy", icon: <Briefcase className="h-4 w-4" />, onClick: () => { setActiveTab("Job Openings"); setShowAddPosting(true); } },
        ]}
        stats={[
          { label: "Active Job Vacancies", value: String(jobPostings.filter(p => p.status === "OPEN").length || 0), note: "Positions open" },
          { label: "Total Applicants", value: String(candidates.length || 0), note: "Candidate database" },
          { label: "Requisitions Pending", value: String(requisitions.filter(r => r.status === "PENDING").length || 0), note: "Awaiting HR approval" },
        ]}
      />

      <ReferenceFlowStrip module="Recruitment" />

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 animate-in fade-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}

      {/* JOB OPENINGS TAB */}
      {activeTab === "Job Openings" && (
        <div className="grid gap-5">
          {showAddPosting && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Create New Job Posting</h3>
              <form onSubmit={handleAddPosting} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Job Title</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="title" placeholder="NodeJS Backend Engineer" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="departmentId">
                    <option value="">Select Department</option>
                    {departmentsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Work Location</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="locationId">
                    <option value="">Select Location</option>
                    {locationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Open positions</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="openings" type="number" defaultValue={1} min={1} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Approved Requisition</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="requisitionId">
                    <option value="">Select Requisition (Optional)</option>
                    {requisitions
                      .filter(r => r.status === "APPROVED")
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.department.name})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddPosting(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Post Job Vacancy"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Job Board Vacancies</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search vacancies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Job ID</th>
                    <th className="border-b border-[var(--border-default)] p-3">Job Title</th>
                    <th className="border-b border-[var(--border-default)] p-3">Openings</th>
                    <th className="border-b border-[var(--border-default)] p-3">Applicants</th>
                    <th className="border-b border-[var(--border-default)] p-3">Linked Requisition</th>
                    <th className="border-b border-[var(--border-default)] p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPostings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No job postings found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    filteredPostings.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition cursor-pointer">
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-mono text-xs text-slate-500">{p.id.slice(-6).toUpperCase()}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800">{p.title}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold">{p.openings}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500 font-semibold">{p.applications?.length || 0} applicants</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-400">
                          {p.requisition ? `${p.requisition.title} (${p.requisition.id.slice(-4).toUpperCase()})` : "None"}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill tone={p.status === "OPEN" ? "green" : "red"}>{p.status}</StatusPill>
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

      {/* CANDIDATES TAB */}
      {activeTab === "Candidates" && (
        <div className="grid gap-5">
          {showAddCandidate && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Add Candidate Profile</h3>
              <form onSubmit={handleAddCandidate} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="fullName" placeholder="Rahul Sharma" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="email" type="email" placeholder="rahul@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="phone" placeholder="+91 99999 88888" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Resume Link</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="resumeUrl" placeholder="https://drive.google.com/resume.pdf" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Sourcing Channel</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="source">
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Direct Referral">Direct Referral</option>
                    <option value="Company Website">Company Careers</option>
                    <option value="Job Portal">Naukri/Indeed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Apply for Job Vacancy</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="postingId">
                    <option value="">Select open role...</option>
                    {jobPostings
                      .filter(p => p.status === "OPEN")
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddCandidate(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Add to Applicant Roster"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Applicant Tracking Database</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Applicant Name</th>
                    <th className="border-b border-[var(--border-default)] p-3">Applied Job</th>
                    <th className="border-b border-[var(--border-default)] p-3">Email</th>
                    <th className="border-b border-[var(--border-default)] p-3">Sourcing Channel</th>
                    <th className="border-b border-[var(--border-default)] p-3">Pipeline Stage</th>
                    <th className="border-b border-[var(--border-default)] p-3">Date Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No candidates found. Add one to track recruitment!
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => {
                      const app = c.applications?.[0];
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => setSelectedCandidateId(c.id)}
                        >
                          <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              {c.fullName.split(" ").map(n => n[0]).join("")}
                            </div>
                            {c.fullName}
                          </td>
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-600 font-semibold">
                            {app?.jobPosting?.title || "Direct Pool"}
                          </td>
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500">{c.email}</td>
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500 font-semibold">{c.source || "Unknown"}</td>
                          <td className="border-b border-[var(--surface-sunken)] p-3">
                            <StatusPill
                              tone={
                                c.currentStage === "JOINED" || c.currentStage === "HIRED"
                                  ? "green"
                                  : c.currentStage === "REJECTED"
                                  ? "red"
                                  : "yellow"
                              }
                            >
                              {c.currentStage}
                            </StatusPill>
                          </td>
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CANDIDATE INSPECTOR DRAWER */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-4">
          <div className="h-full w-full max-w-4xl rounded-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-200 border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Applicant Scorecard Profile</h3>
                <p className="text-xs text-slate-400">Track candidate interview lifecycle and submit hiring decisions.</p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 transition"
                onClick={() => {
                  setSelectedCandidateId(null);
                  setShowScheduleInterview(false);
                  setShowCreateOffer(false);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile card summary */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-[var(--surface-sunken)] p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand uppercase">
                  {selectedCandidate.fullName.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{selectedCandidate.fullName}</h4>
                  <p className="text-sm text-slate-500 font-semibold">{selectedCandidate.email}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-xs text-slate-400">Phone: {selectedCandidate.phone || "Not provided"}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <StatusPill tone={selectedCandidate.currentStage === "HIRED" ? "green" : selectedCandidate.currentStage === "REJECTED" ? "red" : "yellow"}>
                      {selectedCandidate.currentStage}
                    </StatusPill>
                  </div>
                </div>

                {selectedCandidate.applications?.[0] && (
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Pipeline Actions:</span>
                    <select
                      className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs bg-white font-semibold"
                      value={selectedCandidate.currentStage}
                      onChange={(e) => handleUpdateStage(selectedCandidate.applications![0].id, e.target.value)}
                    >
                      <option value="SCREENING">Screening</option>
                      <option value="TECHNICAL_INTERVIEW">Technical Round</option>
                      <option value="MANAGER_ROUND">Manager Round</option>
                      <option value="HR_ROUND">HR Round</option>
                      <option value="OFFER">Offer Issued</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Schedule interview and Create offer quick triggers */}
              {selectedCandidate.applications?.[0] && (
                <div className="flex gap-3">
                  <button
                    className="flex-1 min-h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition text-sm font-semibold flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowScheduleInterview(!showScheduleInterview);
                      setShowCreateOffer(false);
                    }}
                  >
                    <Calendar className="h-4 w-4 text-brand" />
                    Schedule Interview Round
                  </button>

                  {selectedCandidate.currentStage === "OFFER" && (
                    <button
                      className="flex-1 min-h-10 rounded-lg bg-brand text-white hover:bg-brand-dark transition text-sm font-semibold flex items-center justify-center gap-2"
                      onClick={() => {
                        setShowCreateOffer(!showCreateOffer);
                        setShowScheduleInterview(false);
                      }}
                    >
                      <FileSignature className="h-4 w-4" />
                      Create & Issue Job Offer
                    </button>
                  )}
                </div>
              )}

              {/* Schedule Interview Form Panel */}
              {showScheduleInterview && selectedCandidate.applications?.[0] && (
                <div className="rounded-xl border border-[var(--border-default)] bg-slate-50 p-5 space-y-4 animate-in zoom-in-95 duration-100">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand" /> Schedule Interview details
                  </h4>
                  <form onSubmit={handleScheduleInterview} className="grid grid-cols-2 gap-4">
                    <input type="hidden" name="applicationId" value={selectedCandidate.applications[0].id} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Round Name</label>
                      <input className="min-h-10 w-full rounded-lg border bg-white px-3 text-sm" name="roundName" placeholder="Technical Round 1" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Scheduled At</label>
                      <input className="min-h-10 w-full rounded-lg border bg-white px-3 text-sm" name="scheduledAt" type="datetime-local" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Interview Mode</label>
                      <select className="min-h-10 w-full rounded-lg border bg-white px-3 text-sm" name="mode">
                        <option value="ONLINE">Google Meet / Virtual</option>
                        <option value="IN_PERSON">In Office / Face to Face</option>
                        <option value="TELEPHONIC">Phone Call</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Interviewers (Ctrl + Click to multi-select)</label>
                      <select className="min-h-20 w-full rounded-lg border bg-white px-3 py-1 text-sm" name="interviewerIds" multiple required>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-1">
                      <button className="min-h-10 rounded-lg border bg-white px-4 text-sm font-semibold hover:bg-slate-100" type="button" onClick={() => setShowScheduleInterview(false)}>Cancel</button>
                      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Schedule Round</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Create Job Offer Form Panel */}
              {showCreateOffer && selectedCandidate.applications?.[0] && (
                <div className="rounded-xl border border-[var(--border-default)] bg-slate-50 p-5 space-y-4 animate-in zoom-in-95 duration-100">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-brand" /> Generate Job Offer Letter
                  </h4>
                  <form onSubmit={handleCreateOffer} className="grid grid-cols-2 gap-4">
                    <input type="hidden" name="applicationId" value={selectedCandidate.applications[0].id} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Offered Annual CTC (INR)</label>
                      <input className="min-h-10 w-full rounded-lg border bg-white px-3 text-sm" name="offeredCtc" type="number" placeholder="1200000" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Expected Joining Date</label>
                      <input className="min-h-10 w-full rounded-lg border bg-white px-3 text-sm" name="joiningDate" type="date" required />
                    </div>
                    <p className="col-span-2 text-xs text-slate-400">
                      Standard corporate guidelines like 6-month probation and 90-day notice period will be automatically appended to the offer terms.
                    </p>
                    <div className="col-span-2 flex justify-end gap-2 mt-1">
                      <button className="min-h-10 rounded-lg border bg-white px-4 text-sm font-semibold hover:bg-slate-100" type="button" onClick={() => setShowCreateOffer(false)}>Cancel</button>
                      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Issue Offer Letter</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Resume & Sourcing Metadata */}
              <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <FileText className="h-4 w-4 text-brand" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Application Documents</h4>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400 font-semibold block">Resume Profile:</span>
                    {selectedCandidate.resumeUrl ? (
                      <a
                        href={selectedCandidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-semibold hover:underline mt-1 inline-flex items-center gap-1.5"
                      >
                        <FileText className="h-4 w-4" /> Download Resume Document
                      </a>
                    ) : (
                      <span className="text-slate-500 font-normal italic block mt-1">No resume file uploaded yet.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <TrendingUp className="h-4 w-4 text-brand" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Interview Consensus</h4>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Status:</span>
                      <span className="font-semibold text-slate-800">{selectedCandidate.currentStage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Candidate Pool Sourcing:</span>
                      <span className="font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded text-xs">{selectedCandidate.source || "Careers Inflow"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-5 flex justify-end">
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition"
                onClick={() => {
                  setSelectedCandidateId(null);
                  setShowScheduleInterview(false);
                  setShowCreateOffer(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUISITIONS TAB */}
      {activeTab === "Requisitions" && (
        <div className="grid gap-5">
          {showRequestRequisition && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Request Headcount Budget Approval</h3>
              <form onSubmit={handleRequestRequisition} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Vacancy Job Title</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="title" placeholder="Lead Product Designer" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Department</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="departmentId" required>
                    <option value="">Select Department</option>
                    {departmentsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Designation</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="designationId" required>
                    <option value="">Select Designation</option>
                    {designationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Number of Openings</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="openings" type="number" defaultValue={1} min={1} required />
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowRequestRequisition(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Request Budget"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Headcount Requisitions</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Req ID</th>
                    <th className="border-b border-[var(--border-default)] p-3">Job Title Requested</th>
                    <th className="border-b border-[var(--border-default)] p-3">Department</th>
                    <th className="border-b border-[var(--border-default)] p-3">Openings</th>
                    <th className="border-b border-[var(--border-default)] p-3">Requested By</th>
                    <th className="border-b border-[var(--border-default)] p-3">Approval Status</th>
                    {isHrOrAdmin && <th className="border-b border-[var(--border-default)] p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        No requisitions found. Request headcount to initiate hiring budgets.
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-mono text-xs text-slate-500">{r.id.slice(-6).toUpperCase()}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800">{r.title}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-600 font-semibold">{r.department.name}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold">{r.openings}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500">
                          {r.requestedBy.firstName} {r.requestedBy.lastName}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill
                            tone={
                              r.status === "APPROVED"
                                ? "green"
                                : r.status === "REJECTED"
                                ? "red"
                                : "yellow"
                            }
                          >
                            {r.status}
                          </StatusPill>
                        </td>
                        {isHrOrAdmin && (
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-right space-x-1.5">
                            {r.status === "PENDING" && (
                              <>
                                <button
                                  className="rounded bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-emerald-700 transition"
                                  onClick={() => handleDecideRequisition(r.id, "APPROVED")}
                                >
                                  Approve
                                </button>
                                <button
                                  className="rounded bg-rose-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-rose-700 transition"
                                  onClick={() => handleDecideRequisition(r.id, "REJECTED")}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* INTERVIEWS TAB */}
      {activeTab === "Interviews" && (
        <div className="grid gap-5">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Scheduled Interview Rounds</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search interviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Applicant Name</th>
                    <th className="border-b border-[var(--border-default)] p-3">Target Vacancy</th>
                    <th className="border-b border-[var(--border-default)] p-3">Scheduled Date</th>
                    <th className="border-b border-[var(--border-default)] p-3">Format Mode</th>
                    <th className="border-b border-[var(--border-default)] p-3">Interviewers</th>
                    <th className="border-b border-[var(--border-default)] p-3">Feedback Consensus</th>
                    <th className="border-b border-[var(--border-default)] p-3">Status</th>
                    <th className="border-b border-[var(--border-default)] p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        No scheduled interviews found. Schedule a round from the candidate drawer profile.
                      </td>
                    </tr>
                  ) : (
                    filteredInterviews.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800">
                          {i.application.candidate.fullName}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-600 font-semibold">
                          {i.application.jobPosting.title}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-500 font-semibold">
                          {new Date(i.scheduledAt).toLocaleString("en-IN")}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500 font-semibold">{i.mode}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-500">
                          {i.interviewers.map(it => `${it.employee.firstName} ${it.employee.lastName}`).join(", ") || "None"}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-400 font-semibold">
                          {i.feedback || "Awaiting Scorecard"}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill tone={i.status === "COMPLETED" ? "green" : "yellow"}>{i.status}</StatusPill>
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-right">
                          {i.status === "SCHEDULED" && (
                            <button
                              className="rounded bg-brand text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-brand-dark transition"
                              onClick={() => {
                                setSelectedInterview(i);
                                setShowAddFeedback(true);
                              }}
                            >
                              Submit Scorecard
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* SUBMIT FEEDBACK SCORECARD FORM */}
          {showAddFeedback && selectedInterview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-100 p-5 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-md font-bold text-slate-800">Submit Interview Scorecard</h4>
                  <button className="p-1 hover:bg-slate-50 rounded" onClick={() => { setShowAddFeedback(false); setSelectedInterview(null); }}>
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleAddFeedback} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Rating (1 to 5 Stars)</label>
                    <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="rating" required>
                      <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                      <option value="4">⭐⭐⭐⭐ (Good)</option>
                      <option value="3">⭐⭐⭐ (Average)</option>
                      <option value="2">⭐⭐ (Below Average)</option>
                      <option value="1">⭐ (Poor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Hiring Recommendation</label>
                    <select className="min-h-10 w-full rounded-lg border px-3 text-sm bg-white" name="recommendation" required>
                      <option value="HIRE">HIRE (Recommended)</option>
                      <option value="HOLD">HOLD (Conditional)</option>
                      <option value="REJECT">REJECT (Not suitable)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Comments / Key observations</label>
                    <textarea
                      className="w-full rounded-lg border p-3 text-sm outline-none focus:border-brand h-24"
                      name="comments"
                      placeholder="Discuss technical proficiency, communication, domain expertise..."
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => { setShowAddFeedback(false); setSelectedInterview(null); }}>Cancel</button>
                    <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit">Submit Scorecard</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JOB OFFERS TAB */}
      {activeTab === "Job Offers" && (
        <div className="grid gap-5">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Issued Job Offers</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search offers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Offer ID</th>
                    <th className="border-b border-[var(--border-default)] p-3">Candidate</th>
                    <th className="border-b border-[var(--border-default)] p-3">Role Offered</th>
                    <th className="border-b border-[var(--border-default)] p-3">Offered CTC</th>
                    <th className="border-b border-[var(--border-default)] p-3">Expected Joining</th>
                    <th className="border-b border-[var(--border-default)] p-3">Status</th>
                    <th className="border-b border-[var(--border-default)] p-3">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        No issued job offers found. Mark a candidate's stage as 'OFFER' to generate one.
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-mono text-xs text-slate-500">{o.id.slice(-6).toUpperCase()}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800">{o.application.candidate.fullName}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-600 font-semibold">{o.application.jobPosting.title}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold">INR {o.offeredCtc.toLocaleString("en-IN")}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-500 font-semibold">
                          {new Date(o.joiningDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill
                            tone={
                              o.status === "ACCEPTED"
                                ? "green"
                                : o.status === "REJECTED"
                                ? "red"
                                : "yellow"
                            }
                          >
                            {o.status}
                          </StatusPill>
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-400">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
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

      {/* STAFFING PLANS TAB */}
      {activeTab === "Staffing Plans" && (
        <div className="grid gap-5">
          {showAddStaffingPlan && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Create Staffing Plan</h3>
              <form onSubmit={handleAddStaffingPlan} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="departmentId" required>
                    <option value="">Select Department</option>
                    {departmentsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="designationId" required>
                    <option value="">Select Designation</option>
                    {designationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Budgeted Headcount</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="budgetedHeadcount" type="number" defaultValue={1} min={1} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="startDate" type="date" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="endDate" type="date" required />
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddStaffingPlan(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Save Staffing Plan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Active Staffing Headcount Budgets</h2>
                <p className="text-xs text-slate-400 mt-1">Track vacancy opening counts linked to budgeted staff limits.</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
                  onClick={() => setShowAddStaffingPlan(true)}
                >
                  Create Staffing Plan
                </button>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Department</th>
                    <th className="border-b border-[var(--border-default)] p-3">Designation</th>
                    <th className="border-b border-[var(--border-default)] p-3">Budgeted Headcount</th>
                    <th className="border-b border-[var(--border-default)] p-3">Current Headcount</th>
                    <th className="border-b border-[var(--border-default)] p-3">Active Vacancies</th>
                    <th className="border-b border-[var(--border-default)] p-3">Validity Period</th>
                  </tr>
                </thead>
                <tbody>
                  {staffingPlans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No staffing plans active. Create one to monitor departments.
                      </td>
                    </tr>
                  ) : (
                    staffingPlans.map((sp) => (
                      <tr key={sp.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-800">{sp.department?.name || "Global"}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold text-slate-600">{sp.designation?.title || "Staff"}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-bold">{sp.budgetedHeadcount}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500 font-semibold">{sp.currentHeadcount}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill tone={sp.currentHeadcount >= sp.budgetedHeadcount ? "red" : "green"}>
                            {sp.budgetedHeadcount - sp.currentHeadcount} vacancies left
                          </StatusPill>
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-xs text-slate-500">
                          {new Date(sp.startDate).toLocaleDateString("en-IN")} to {new Date(sp.endDate).toLocaleDateString("en-IN")}
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

      {/* REFERRALS TAB */}
      {activeTab === "Referrals" && (
        <div className="grid gap-5">
          {showAddReferral && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Submit Employee Referral</h3>
              <form onSubmit={handleAddReferral} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Candidate Name</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="candidateName" placeholder="Sneha Patil" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Candidate Email</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="candidateEmail" type="email" placeholder="sneha@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Candidate Phone</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="candidatePhone" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Job Vacancy</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="jobPostingId" required>
                    <option value="">Select Job Vacancy</option>
                    {jobPostings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Referral Bonus Amount (INR)</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="bonusAmount" type="number" defaultValue={25000} min={0} required />
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddReferral(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Referral"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Employee Referral Program</h2>
                <p className="text-xs text-slate-400 mt-1">Submit candidates for open roles and track bonus eligibility.</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
                  onClick={() => setShowAddReferral(true)}
                >
                  Refer a Friend
                </button>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[var(--border-default)] p-3">Candidate</th>
                    <th className="border-b border-[var(--border-default)] p-3">Job Posting</th>
                    <th className="border-b border-[var(--border-default)] p-3">Referrer</th>
                    <th className="border-b border-[var(--border-default)] p-3">Bonus Amount</th>
                    <th className="border-b border-[var(--border-default)] p-3">Status</th>
                    {isHrOrAdmin && <th className="border-b border-[var(--border-default)] p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No referrals submitted yet. Start referring!
                      </td>
                    </tr>
                  ) : (
                    referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50 transition">
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <div className="font-semibold text-slate-800">{ref.candidateName}</div>
                          <div className="text-xs text-slate-400">{ref.candidateEmail}</div>
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-600 font-semibold">{ref.jobPosting?.title || "Unknown Position"}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 text-slate-500">
                          {ref.referrer?.firstName} {ref.referrer?.lastName}
                        </td>
                        <td className="border-b border-[var(--surface-sunken)] p-3 font-semibold">INR {ref.bonusAmount.toLocaleString("en-IN")}</td>
                        <td className="border-b border-[var(--surface-sunken)] p-3">
                          <StatusPill tone={ref.status === "APPROVED" || ref.status === "PAID" ? "green" : "yellow"}>
                            {ref.status}
                          </StatusPill>
                        </td>
                        {isHrOrAdmin && (
                          <td className="border-b border-[var(--surface-sunken)] p-3 text-right space-x-1.5">
                            {ref.status === "PENDING" && (
                              <button
                                className="rounded bg-emerald-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-emerald-700 transition"
                                onClick={() => handleDecideReferral(ref.id, "APPROVED")}
                              >
                                Mark Hired
                              </button>
                            )}
                            {ref.status === "APPROVED" && (
                              <button
                                className="rounded bg-indigo-600 text-white font-semibold text-xs px-2.5 py-1.5 hover:bg-indigo-700 transition"
                                onClick={() => handleDecideReferral(ref.id, "PAID")}
                              >
                                Release Bonus
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
