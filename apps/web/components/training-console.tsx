"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { Card, MetricCard, StatusPill } from "./ui";
import {
  GraduationCap,
  Plus,
  Award,
  BookOpen,
  UserCheck,
  BarChart2,
  AlertCircle,
  Check,
  X,
  MapPin,
  Calendar,
  Briefcase
} from "lucide-react";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation?: {
    id: string;
    title: string;
  };
}

interface DesignationOption {
  id: string;
  title: string;
}

interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  events?: any[];
}

interface TrainingEvent {
  id: string;
  programId: string;
  eventName: string;
  trainerName: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  program: {
    name: string;
  };
  feedbacks?: any[];
  results?: any[];
}

interface Skill {
  id: string;
  name: string;
  description?: string;
}

interface SkillGapItem {
  skillName: string;
  required: string;
  actual: string;
}

export function TrainingConsole() {
  const [activeTab, setActiveTab] = useState("Events");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Form states
  const [progName, setProgName] = useState("");
  const [progDesc, setProgDesc] = useState("");

  const [evtProgId, setEvtProgId] = useState("");
  const [evtName, setEvtName] = useState("");
  const [evtTrainer, setEvtTrainer] = useState("");
  const [evtStart, setEvtStart] = useState("");
  const [evtEnd, setEvtEnd] = useState("");
  const [evtLoc, setEvtLoc] = useState("");

  const [feedEvtId, setFeedEvtId] = useState("");
  const [feedEmpId, setFeedEmpId] = useState("");
  const [feedRating, setFeedRating] = useState("5");
  const [feedComment, setFeedComment] = useState("");

  const [resEvtId, setResEvtId] = useState("");
  const [resEmpId, setResEmpId] = useState("");
  const [resStatus, setResStatus] = useState("PASSED");
  const [resComment, setResComment] = useState("");

  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");

  const [mapEmpId, setMapEmpId] = useState("");
  const [mapSkillId, setMapSkillId] = useState("");
  const [mapProficiency, setMapProficiency] = useState("BEGINNER");

  const [desId, setDesId] = useState("");
  const [desSkillId, setDesSkillId] = useState("");
  const [desRequired, setDesRequired] = useState("INTERMEDIATE");

  // Skill gap search state
  const [gapEmpId, setGapEmpId] = useState("");
  const [gapsData, setGapsData] = useState<{ gaps: SkillGapItem[]; met: SkillGapItem[] } | null>(null);

  // Status states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
    return onDataRefresh("training", loadAll);
  }, [activeTab]);

  useEffect(() => {
    if (gapEmpId) {
      apiFetch<{ gaps: SkillGapItem[]; met: SkillGapItem[] }>(`/training/skills/gaps/${gapEmpId}`)
        .then((res) => {
          if (res.data) setGapsData(res.data);
        })
        .catch(() => setGapsData(null));
    } else {
      setGapsData(null);
    }
  }, [gapEmpId]);

  function loadAll() {
    setLoading(true);
    // Fetch employees, programs, events, skills — derive designations from employees
    // (no /organization/designations endpoint exists; designations are embedded in employee records)
    Promise.all([
      apiFetch<any[]>("/employees").catch(() => ({ data: [] as any[] })),
      apiFetch<TrainingProgram[]>("/training/programs").catch(() => ({ data: [] as TrainingProgram[] })),
      apiFetch<TrainingEvent[]>("/training/events").catch(() => ({ data: [] as TrainingEvent[] })),
      apiFetch<Skill[]>("/training/skills").catch(() => ({ data: [] as Skill[] })),
    ]).then(([empRes, progRes, evtRes, skillRes]) => {
      const employees: EmployeeOption[] = empRes.data ?? [];
      if (employees.length) setEmployees(employees);

      // Derive unique designations from employee records
      const desMap = new Map<string, DesignationOption>();
      for (const emp of employees) {
        if (emp.designation && emp.designation.id && !desMap.has(emp.designation.id)) {
          desMap.set(emp.designation.id, { id: emp.designation.id, title: emp.designation.title });
        }
      }
      setDesignations(Array.from(desMap.values()));

      if (progRes.data) setPrograms(progRes.data);
      if (evtRes.data) setEvents(evtRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/training/programs", {
        method: "POST",
        body: JSON.stringify({ name: progName, description: progDesc || undefined }),
      });
      setMessage("Training Program created successfully!");
      setProgName("");
      setProgDesc("");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to create program");
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!evtProgId) throw new Error("Please select a training program");
      await apiFetch("/training/events", {
        method: "POST",
        body: JSON.stringify({
          programId: evtProgId,
          eventName: evtName,
          trainerName: evtTrainer,
          startDate: evtStart,
          endDate: evtEnd,
          location: evtLoc || undefined,
        }),
      });
      setMessage("Training Event scheduled successfully!");
      setEvtName("");
      setEvtTrainer("");
      setEvtStart("");
      setEvtEnd("");
      setEvtLoc("");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to schedule event");
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!feedEvtId || !feedEmpId) throw new Error("Please select event and employee");
      await apiFetch(`/training/events/${feedEvtId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: feedEmpId,
          rating: Number(feedRating),
          comments: feedComment || undefined,
        }),
      });
      setMessage("Training feedback logged.");
      setFeedComment("");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback");
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!resEvtId || !resEmpId) throw new Error("Please select event and employee");
      await apiFetch(`/training/events/${resEvtId}/result`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: resEmpId,
          status: resStatus,
          comments: resComment || undefined,
        }),
      });
      setMessage("Training outcome result submitted.");
      setResComment("");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to submit result");
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiFetch("/training/skills", {
        method: "POST",
        body: JSON.stringify({ name: skillName, description: skillDesc || undefined }),
      });
      setMessage("New Skill created in Catalog!");
      setSkillName("");
      setSkillDesc("");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to create skill");
    }
  };

  const handleMapSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!mapEmpId || !mapSkillId) throw new Error("Please select employee and skill");
      await apiFetch("/training/skills/assess", {
        method: "POST",
        body: JSON.stringify({
          employeeId: mapEmpId,
          skillId: mapSkillId,
          proficiency: mapProficiency,
        }),
      });
      setMessage("Employee Skill proficiency mapped successfully!");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to map skill");
    }
  };

  const handleDesignationSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!desId || !desSkillId) throw new Error("Please select designation and skill");
      await apiFetch("/training/designations/skills", {
        method: "POST",
        body: JSON.stringify({
          designationId: desId,
          skillId: desSkillId,
          requiredProficiency: desRequired,
        }),
      });
      setMessage("Designation Skill requirements updated!");
      requestDataRefresh("training");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to map designation skill");
    }
  };

  return (
    <div className="grid gap-5 text-left">
      {message && (
        <div className="rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg animate-in fade-in duration-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm font-semibold text-danger-fg animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* SUB-TABS */}
      <div className="flex border-b border-line gap-4 mb-4">
        {[
          { label: "Programs & Events", val: "Events" },
          { label: "Assessments & Outcomes", val: "Outcomes" },
          { label: "Skills Catalog", val: "Skills" },
          { label: "Skill Gap Analysis", val: "Gaps" },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => {
              setActiveTab(tab.val);
              setMessage("");
              setError("");
            }}
            className={`pb-2.5 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === tab.val ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* EVENTS TAB */}
      {activeTab === "Events" && (
        <div className="grid grid-cols-[360px_1fr] gap-6 max-xl:grid-cols-1">
          <div className="grid gap-5 h-fit">
            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
                <BookOpen className="h-5 w-5 text-brand" /> Create Program
              </h3>
              <form onSubmit={handleProgramSubmit} className="grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Program Name</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                    placeholder="e.g. AWS Cloud Architect"
                    value={progName}
                    onChange={(e) => setProgName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"
                    placeholder="Brief description of the course..."
                    value={progDesc}
                    onChange={(e) => setProgDesc(e.target.value)}
                  />
                </div>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                  type="submit"
                >
                  Create Program
                </button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
                <Plus className="h-5 w-5 text-brand" /> Schedule Event
              </h3>
              <form onSubmit={handleEventSubmit} className="grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Training Program</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                    value={evtProgId}
                    onChange={(e) => setEvtProgId(e.target.value)}
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Event Session Name</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                    placeholder="e.g. AWS Architecture Cohort 1"
                    value={evtName}
                    onChange={(e) => setEvtName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Trainer Name</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                    placeholder="e.g. Dr. Robert Vance"
                    value={evtTrainer}
                    onChange={(e) => setEvtTrainer(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                      type="date"
                      value={evtStart}
                      onChange={(e) => setEvtStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">End Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                      type="date"
                      value={evtEnd}
                      onChange={(e) => setEvtEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Location / Link</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                    placeholder="e.g. Conference Room A / Zoom Link"
                    value={evtLoc}
                    onChange={(e) => setEvtLoc(e.target.value)}
                  />
                </div>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                  type="submit"
                >
                  Schedule Event
                </button>
              </form>
            </Card>
          </div>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary border-b pb-3">
              Scheduled Events Calendar
            </h3>
            {loading ? (
              <div className="text-center p-8 text-text-muted text-sm">Loading events...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {events.map((e) => (
                  <div key={e.id} className="rounded-xl border border-line bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand bg-brand/10 px-2 py-0.5 rounded">
                          {e.program.name}
                        </span>
                        <StatusPill tone={e.status === "SCHEDULED" ? "yellow" : e.status === "COMPLETED" ? "green" : "red"}>
                          {e.status}
                        </StatusPill>
                      </div>
                      <h4 className="font-semibold text-text-primary mt-2 text-sm">{e.eventName}</h4>
                      <p className="text-xs text-text-muted mt-1">Trainer: <span className="font-semibold text-text-primary">{e.trainerName}</span></p>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-text-secondary border-t pt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-text-muted" />
                          <span>{new Date(e.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-text-muted" />
                          <span className="truncate">{e.location || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-text-muted text-xs border border-dashed rounded-lg">
                    No scheduled events found. Schedule one on the left.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* OUTCOMES TAB */}
      {activeTab === "Outcomes" && (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <GraduationCap className="h-5 w-5 text-brand" /> Log Event Feedback
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Event</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={feedEvtId}
                  onChange={(e) => setFeedEvtId(e.target.value)}
                  required
                >
                  <option value="">Choose Event</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.eventName} ({evt.program.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Employee attendee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={feedEmpId}
                  onChange={(e) => setFeedEmpId(e.target.value)}
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Rating (1 to 5 Stars)</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={feedRating}
                  onChange={(e) => setFeedRating(e.target.value)}
                  required
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (Good)</option>
                  <option value="3">⭐⭐⭐ (Average)</option>
                  <option value="2">⭐⭐ (Fair)</option>
                  <option value="1">⭐ (Poor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Comments</label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"
                  placeholder="Feedback comments..."
                  value={feedComment}
                  onChange={(e) => setFeedComment(e.target.value)}
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Log Feedback
              </button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <Award className="h-5 w-5 text-brand" /> Submit Course Result
            </h3>
            <form onSubmit={handleResultSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Event</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={resEvtId}
                  onChange={(e) => setResEvtId(e.target.value)}
                  required
                >
                  <option value="">Choose Event</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.eventName} ({evt.program.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Employee attendee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={resEmpId}
                  onChange={(e) => setResEmpId(e.target.value)}
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Status Outcome</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={resStatus}
                  onChange={(e) => setResStatus(e.target.value)}
                  required
                >
                  <option value="PASSED">PASSED / CERTIFIED</option>
                  <option value="FAILED">FAILED / INCOMPLETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Performance Details</label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"
                  placeholder="Exam score, certification code, etc..."
                  value={resComment}
                  onChange={(e) => setResComment(e.target.value)}
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Log Outcome Result
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* SKILLS TAB */}
      {activeTab === "Skills" && (
        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <Plus className="h-5 w-5 text-brand" /> Create Skill catalog
            </h3>
            <form onSubmit={handleSkillSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Skill Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
                  placeholder="e.g. Next.js, Docker, Figma"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Skill Description</label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-line p-3 text-sm"
                  placeholder="e.g. React server components, server actions, optimization..."
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Create Skill
              </button>
            </form>
          </Card>

          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <UserCheck className="h-5 w-5 text-brand" /> Assess Employee Skill
            </h3>
            <form onSubmit={handleMapSkillSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={mapEmpId}
                  onChange={(e) => setMapEmpId(e.target.value)}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Skill</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={mapSkillId}
                  onChange={(e) => setMapSkillId(e.target.value)}
                  required
                >
                  <option value="">Choose Skill</option>
                  {skills.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Proficiency Level</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={mapProficiency}
                  onChange={(e) => setMapProficiency(e.target.value)}
                  required
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="EXPERT">EXPERT</option>
                </select>
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Assess Proficiency
              </button>
            </form>
          </Card>

          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <Briefcase className="h-5 w-5 text-brand" /> Map Designation Skill
            </h3>
            <form onSubmit={handleDesignationSkillSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Designation</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={desId}
                  onChange={(e) => setDesId(e.target.value)}
                  required
                >
                  <option value="">Select Designation</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Select Skill</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={desSkillId}
                  onChange={(e) => setDesSkillId(e.target.value)}
                  required
                >
                  <option value="">Choose Skill</option>
                  {skills.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Required Proficiency</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                  value={desRequired}
                  onChange={(e) => setDesRequired(e.target.value)}
                  required
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="EXPERT">EXPERT</option>
                </select>
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Save Designation Requirement
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* GAPS TAB */}
      {activeTab === "Gaps" && (
        <div className="grid grid-cols-[320px_1fr] gap-6 max-lg:grid-cols-1">
          {/* Selector */}
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2 border-b pb-3">
              <BarChart2 className="h-5 w-5 text-brand" /> Select Employee
            </h3>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Choose Employee to Analyze</label>
              <select
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-white"
                value={gapEmpId}
                onChange={(e) => setGapEmpId(e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
                This engine compares the employee's assessed skill levels against their designation's required proficiency levels to find educational gaps.
              </p>
            </div>
          </Card>

          {/* Gaps Visualizations */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary border-b pb-3">
              Skill Gap Matrix Analysis
            </h3>
            {gapsData ? (
              <div className="grid gap-6">
                <div>
                  <h4 className="text-danger-fg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <AlertCircle className="h-4 w-4" /> Detected Skill Gaps ({gapsData.gaps.length})
                  </h4>
                  <div className="grid gap-3">
                    {gapsData.gaps.map((item) => (
                      <div key={item.skillName} className="flex items-center justify-between border border-danger-border bg-danger-bg p-3 rounded-lg text-sm">
                        <span className="font-semibold text-text-primary">{item.skillName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-danger-fg bg-rose-150 px-2.5 py-0.5 rounded font-bold">
                            Required: {item.required}
                          </span>
                          <span className="text-xs text-text-secondary">
                            Actual: <span className="font-semibold text-text-primary">{item.actual}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                    {gapsData.gaps.length === 0 && (
                      <div className="text-xs text-text-muted p-4 border border-dashed rounded-lg text-center bg-sunken">
                        Excellent! No skill gaps detected for this employee.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-success-fg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Check className="h-4 w-4" /> Fulfilled / Met Requirements ({gapsData.met.length})
                  </h4>
                  <div className="grid gap-3">
                    {gapsData.met.map((item) => (
                      <div key={item.skillName} className="flex items-center justify-between border border-success-border bg-success-bg p-3 rounded-lg text-sm">
                        <span className="font-semibold text-text-primary">{item.skillName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-success-fg bg-success-bg px-2.5 py-0.5 rounded font-bold">
                            Required: {item.required}
                          </span>
                          <span className="text-xs text-text-secondary">
                            Actual: <span className="font-semibold text-text-primary">{item.actual}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                    {gapsData.met.length === 0 && (
                      <div className="text-xs text-text-muted p-4 border border-dashed rounded-lg text-center bg-sunken">
                        No fulfilled skills listed yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-text-muted text-center border border-dashed rounded-lg">
                <BarChart2 className="h-10 w-10 text-text-muted mb-2" />
                <div className="text-xs font-semibold">Select an employee from the sidebar to generate analysis.</div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
