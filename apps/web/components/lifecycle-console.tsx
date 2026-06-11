"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { Card } from "./ui";
import { ClipboardList, UserCheck, UserMinus, FileText, ArrowRight, UserCheck2, Landmark, Plus, Trash2, CheckSquare } from "lucide-react";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface Activity {
  title: string;
  description: string;
  assignedRole: string;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  activities: any[];
}

interface SeparationTemplate {
  id: string;
  name: string;
  activities: any[];
}

interface ExitInterview {
  id: string;
  exitDate: string;
  reasonForLeaving: string;
  feedback?: string | null;
  status: string;
}

interface FfAsset {
  id: string;
  assetName: string;
  serialNumber?: string | null;
  returnedStatus: string;
  recoveryCost: string;
}

interface FfStatement {
  id: string;
  exitDate: string;
  resignationDate: string;
  noticeDays: number;
  lastDrawnSalary: string;
  gratuityDues: string;
  encashmentDues: string;
  recoveryDues: string;
  netPayable: string;
  status: string;
  assets: FfAsset[];
}

export function LifecycleConsole() {
  const [activeTab, setActiveTab] = useState("Onboarding");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  
  // Onboarding States
  const [onbTemplates, setOnbTemplates] = useState<OnboardingTemplate[]>([]);
  const [selectedOnbEmp, setSelectedOnbEmp] = useState("");
  const [selectedOnbTemp, setSelectedOnbTemp] = useState("");
  const [newOnbTempName, setNewOnbTempName] = useState("");
  const [onbActivities, setOnbActivities] = useState<Activity[]>([{ title: "", description: "", assignedRole: "" }]);
  
  // Separation States
  const [sepTemplates, setSepTemplates] = useState<SeparationTemplate[]>([]);
  const [selectedSepEmp, setSelectedSepEmp] = useState("");
  const [selectedSepTemp, setSelectedSepTemp] = useState("");
  const [newSepTempName, setNewSepTempName] = useState("");
  const [sepActivities, setSepActivities] = useState<Activity[]>([{ title: "", description: "", assignedRole: "" }]);
  
  // Exit & F&F States
  const [exitEmp, setExitEmp] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  
  // F&F Calculations
  const [ffEmp, setFfEmp] = useState("");
  const [ffResignDate, setFfResignDate] = useState("");
  const [ffExitDate, setFfExitDate] = useState("");
  const [ffSalary, setFfSalary] = useState("0");
  const [ffNoticeDays, setFfNoticeDays] = useState("90");
  const [ffGratuity, setFfGratuity] = useState("0");
  const [ffEncashment, setFfEncashment] = useState("0");
  const [ffRecovery, setFfRecovery] = useState("0");
  const [ffAssets, setFfAssets] = useState<Array<{ assetName: string; serialNumber: string; recoveryCost: number }>>([
    { assetName: "", serialNumber: "", recoveryCost: 0 }
  ]);
  
  const [statement, setStatement] = useState<FfStatement | null>(null);
  const [exitInterview, setExitInterview] = useState<ExitInterview | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (!ffEmp) {
      setFfGratuity("0");
      setFfEncashment("0");
      setFfSalary("0");
      return;
    }
    apiFetch<any>(`/employees/${ffEmp}/ff-suggestions`)
      .then((res) => {
        if (res.data) {
          setFfGratuity(String(res.data.gratuityDues || 0));
          setFfEncashment(String(res.data.encashmentDues || 0));
        }
      })
      .catch((err) => console.error("Failed to fetch F&F suggestions:", err));

    apiFetch<any>(`/employees/${ffEmp}`)
      .then((res) => {
        if (res.data) {
          const emp = res.data;
          const activeSal = emp.salaryStructures?.find((s: any) => s.status === "ACTIVE");
          if (activeSal) {
            const monthlyBasic = Math.round(Number(activeSal.basic || 0) / 12);
            setFfSalary(String(monthlyBasic || 0));
          } else {
            setFfSalary("0");
          }
        }
      })
      .catch((err) => console.error("Failed to fetch employee details for F&F:", err));
  }, [ffEmp]);

  function loadData() {
    // Fetch Employees
    apiFetch<any[]>("/employees")
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch((err) => console.error(err));

    // Fetch Onboarding Templates
    apiFetch<any[]>("/employees/onboarding/templates")
      .then((res) => {
        if (res.data) setOnbTemplates(res.data);
      })
      .catch((err) => console.error(err));

    // Fetch Separation Templates
    apiFetch<any[]>("/employees/separation/templates")
      .then((res) => {
        if (res.data) setSepTemplates(res.data);
      })
      .catch((err) => console.error(err));
  }

  // Onboarding Template
  const addOnbActivity = () => {
    setOnbActivities([...onbActivities, { title: "", description: "", assignedRole: "" }]);
  };
  const removeOnbActivity = (idx: number) => {
    setOnbActivities(onbActivities.filter((_, i) => i !== idx));
  };
  const handleOnbActChange = (idx: number, field: keyof Activity, val: string) => {
    const next = [...onbActivities];
    next[idx][field] = val;
    setOnbActivities(next);
  };
  
  const handleCreateOnbTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const filteredActs = onbActivities.filter((a) => a.title.trim() !== "");
      if (!newOnbTempName.trim()) throw new Error("Template name is required");
      if (!filteredActs.length) throw new Error("At least one activity is required");
      
      await apiFetch("/employees/onboarding/templates", {
        method: "POST",
        body: JSON.stringify({
          name: newOnbTempName,
          activities: filteredActs,
        }),
      });
      setMessage("Onboarding template created successfully!");
      setNewOnbTempName("");
      setOnbActivities([{ title: "", description: "", assignedRole: "" }]);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create template");
    }
  };

  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!selectedOnbEmp || !selectedOnbTemp) throw new Error("Please select employee and template");
      const res = await apiFetch<any>(`/employees/${selectedOnbEmp}/onboarding/start`, {
        method: "POST",
        body: JSON.stringify({ templateId: selectedOnbTemp }),
      });
      setMessage(`Onboarding initialized successfully! ${res.data?.tasksInitialized} tasks created.`);
      setSelectedOnbEmp("");
      setSelectedOnbTemp("");
    } catch (err: any) {
      setError(err.message || "Failed to start onboarding");
    }
  };

  // Separation Template
  const addSepActivity = () => {
    setSepActivities([...sepActivities, { title: "", description: "", assignedRole: "" }]);
  };
  const removeSepActivity = (idx: number) => {
    setSepActivities(sepActivities.filter((_, i) => i !== idx));
  };
  const handleSepActChange = (idx: number, field: keyof Activity, val: string) => {
    const next = [...sepActivities];
    next[idx][field] = val;
    setSepActivities(next);
  };

  const handleCreateSepTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const filteredActs = sepActivities.filter((a) => a.title.trim() !== "");
      if (!newSepTempName.trim()) throw new Error("Template name is required");
      if (!filteredActs.length) throw new Error("At least one activity is required");
      
      await apiFetch("/employees/separation/templates", {
        method: "POST",
        body: JSON.stringify({
          name: newSepTempName,
          activities: filteredActs,
        }),
      });
      setMessage("Separation template created successfully!");
      setNewSepTempName("");
      setSepActivities([{ title: "", description: "", assignedRole: "" }]);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create template");
    }
  };

  const handleStartSeparation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!selectedSepEmp || !selectedSepTemp) throw new Error("Please select employee and template");
      const res = await apiFetch<any>(`/employees/${selectedSepEmp}/separation/start`, {
        method: "POST",
        body: JSON.stringify({ templateId: selectedSepTemp }),
      });
      setMessage(`Separation initialized successfully! ${res.data?.tasksInitialized} tasks created.`);
      setSelectedSepEmp("");
      setSelectedSepTemp("");
    } catch (err: any) {
      setError(err.message || "Failed to start separation");
    }
  };

  // Exit Interview Submit
  const handleExitInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!exitEmp || !exitDate || !reason) throw new Error("Please fill exit employee, date and reason");
      const res = await apiFetch<any>(`/employees/${exitEmp}/exit-interview`, {
        method: "POST",
        body: JSON.stringify({
          exitDate,
          reasonForLeaving: reason,
          feedback,
          interviewerEmployeeId: interviewerId || undefined,
        }),
      });
      setMessage("Exit Interview details recorded successfully!");
      setExitInterview(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to submit exit interview");
    }
  };

  // Full and Final Asset array helpers
  const addFfAsset = () => {
    setFfAssets([...ffAssets, { assetName: "", serialNumber: "", recoveryCost: 0 }]);
  };
  const removeFfAsset = (idx: number) => {
    setFfAssets(ffAssets.filter((_, i) => i !== idx));
  };
  const handleFfAssetChange = (idx: number, field: string, val: any) => {
    const next = [...ffAssets];
    (next[idx] as any)[field] = val;
    setFfAssets(next);
  };

  // F&F Calculations Submission
  const handleCalculateFnF = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!ffEmp || !ffResignDate || !ffExitDate || !ffSalary) {
        throw new Error("Resignation date, exit date, salary and employee are required");
      }
      
      const filteredAssets = ffAssets.filter((a) => a.assetName.trim() !== "");
      
      const res = await apiFetch<FfStatement>(`/employees/${ffEmp}/full-and-final`, {
        method: "POST",
        body: JSON.stringify({
          exitDate: ffExitDate,
          resignationDate: ffResignDate,
          lastDrawnSalary: Number(ffSalary),
          noticeDays: Number(ffNoticeDays),
          gratuityDues: ffGratuity ? Number(ffGratuity) : undefined,
          encashmentDues: Number(ffEncashment),
          recoveryDues: Number(ffRecovery),
          assets: filteredAssets,
        }),
      });
      setMessage("Full & Final settlement computed and approved!");
      setStatement(res.data || null);
    } catch (err: any) {
      setError(err.message || "Settlement calculation failed");
    }
  };

  const updateAssetStatus = async (assetId: string, status: string, cost?: number) => {
    try {
      await apiFetch(`/employees/full-and-final/assets/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify({
          returnedStatus: status,
          recoveryCost: cost,
        }),
      });
      setMessage(`Asset status updated to ${status}.`);
      if (ffEmp) {
        apiFetch<FfStatement>(`/employees/${ffEmp}/full-and-final`)
          .then((res) => {
            if (res.data) setStatement(res.data);
          })
          .catch(() => undefined);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update asset status");
    }
  };

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Lifecycle"
        title="Employee Lifecycle"
        summary="Manage employee onboarding activities, exit clearance check sheets, exit interview feedbacks, and Full & Final settlement statements."
        tabs={["Onboarding", "Exit Separation", "F&F Settlement"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: "Reload Lifecycle", icon: <ClipboardList className="h-4 w-4" />, onClick: loadData },
        ]}
        stats={[
          { label: "Active Employees", value: String(employees.length), note: "Roster details" },
          { label: "Onb Templates", value: String(onbTemplates.length), note: "Onboarding taskflows" },
          { label: "Exit Templates", value: String(sepTemplates.length), note: "Separation list" },
        ]}
      />

      <ReferenceFlowStrip module="Lifecycle" />

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in duration-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* ONBOARDING TAB */}
      {activeTab === "Onboarding" && (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1 text-left">
          {/* Left: Start Onboarding */}
          <div className="grid gap-6">
            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <UserCheck className="h-5 w-5 text-brand" /> Initialize Onboarding Workflow
              </h3>
              <form onSubmit={handleStartOnboarding} className="grid gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={selectedOnbEmp}
                    onChange={(e) => setSelectedOnbEmp(e.target.value)}
                    required
                  >
                    <option value="">Choose Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Onboarding Template</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={selectedOnbTemp}
                    onChange={(e) => setSelectedOnbTemp(e.target.value)}
                    required
                  >
                    <option value="">Select Onboarding Template</option>
                    {onbTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.activities?.length || 0} tasks)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                  type="submit"
                >
                  Start Onboarding <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">Existing Templates</h3>
              {onbTemplates.length === 0 ? (
                <p className="text-xs text-slate-400">No onboarding templates defined yet.</p>
              ) : (
                <div className="grid gap-3">
                  {onbTemplates.map((t) => (
                    <div key={t.id} className="rounded-lg border border-slate-150 p-3 bg-slate-50/50">
                      <div className="font-semibold text-slate-800">{t.name}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        {t.activities?.length} Activities:
                      </div>
                      <div className="mt-1 pl-3 text-xs text-slate-400 list-disc grid gap-1">
                        {t.activities?.map((a: any, i: number) => (
                          <div key={i}>
                            • <strong>{a.title}</strong> {a.assignedRole ? `(Assigned to ${a.assignedRole})` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Create Onboarding Template */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <ClipboardList className="h-5 w-5 text-brand" /> Create Onboarding Template
            </h3>
            <form onSubmit={handleCreateOnbTemplate} className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Template Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  value={newOnbTempName}
                  onChange={(e) => setNewOnbTempName(e.target.value)}
                  placeholder="e.g. Sales Onboarding, Tech Team Joining"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-slate-500">Activities & Tasks</label>
                  <button
                    type="button"
                    onClick={addOnbActivity}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Task
                  </button>
                </div>
                <div className="grid gap-3">
                  {onbActivities.map((act, idx) => (
                    <div key={idx} className="grid gap-2 border border-slate-100 rounded-lg p-3 bg-slate-50/30 relative">
                      {onbActivities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOnbActivity(idx)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div>
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Task Title (e.g. Issue laptop, Sign NDA)"
                          value={act.title}
                          onChange={(e) => handleOnbActChange(idx, "title", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Description (optional)"
                          value={act.description}
                          onChange={(e) => handleOnbActChange(idx, "description", e.target.value)}
                        />
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Assigned Role (e.g. HR, IT)"
                          value={act.assignedRole}
                          onChange={(e) => handleOnbActChange(idx, "assignedRole", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                type="submit"
              >
                Create Template
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* EXIT SEPARATION TAB */}
      {activeTab === "Exit Separation" && (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1 text-left">
          {/* Left: Separation Templates & Start */}
          <div className="grid gap-6">
            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <UserMinus className="h-5 w-5 text-brand" /> Start Separation Workflow
              </h3>
              <form onSubmit={handleStartSeparation} className="grid gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={selectedSepEmp}
                    onChange={(e) => setSelectedSepEmp(e.target.value)}
                    required
                  >
                    <option value="">Choose Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Separation Template</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={selectedSepTemp}
                    onChange={(e) => setSelectedSepTemp(e.target.value)}
                    required
                  >
                    <option value="">Select Separation Template</option>
                    {sepTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.activities?.length || 0} clearance steps)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                  type="submit"
                >
                  Initialize Exit Workflow <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">Existing Templates</h3>
              {sepTemplates.length === 0 ? (
                <p className="text-xs text-slate-400">No separation templates defined yet.</p>
              ) : (
                <div className="grid gap-3">
                  {sepTemplates.map((t) => (
                    <div key={t.id} className="rounded-lg border border-slate-150 p-3 bg-slate-50/50">
                      <div className="font-semibold text-slate-800">{t.name}</div>
                      <div className="mt-2 text-xs text-slate-500">
                        {t.activities?.length} Clearance Tasks:
                      </div>
                      <div className="mt-1 pl-3 text-xs text-slate-400 list-disc grid gap-1">
                        {t.activities?.map((a: any, i: number) => (
                          <div key={i}>
                            • <strong>{a.title}</strong> {a.assignedRole ? `(${a.assignedRole} review)` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Create Separation Template */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <ClipboardList className="h-5 w-5 text-brand" /> Create Separation Template
            </h3>
            <form onSubmit={handleCreateSepTemplate} className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Template Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  value={newSepTempName}
                  onChange={(e) => setNewSepTempName(e.target.value)}
                  placeholder="e.g. Standard Resignation, Termination list"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-slate-500">Clearance Checklist Items</label>
                  <button
                    type="button"
                    onClick={addSepActivity}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                <div className="grid gap-3">
                  {sepActivities.map((act, idx) => (
                    <div key={idx} className="grid gap-2 border border-slate-100 rounded-lg p-3 bg-slate-50/30 relative">
                      {sepActivities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSepActivity(idx)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div>
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Checklist Item (e.g. Return Laptop, Revoke Email access)"
                          value={act.title}
                          onChange={(e) => handleSepActChange(idx, "title", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Description (optional)"
                          value={act.description}
                          onChange={(e) => handleSepActChange(idx, "description", e.target.value)}
                        />
                        <input
                          className="min-h-9 w-full rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Assigned Role (e.g. IT, Finance, HR)"
                          value={act.assignedRole}
                          onChange={(e) => handleSepActChange(idx, "assignedRole", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                type="submit"
              >
                Create Template
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* F&F SETTLEMENT TAB */}
      {activeTab === "F&F Settlement" && (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1 text-left">
          {/* Left: Exit Interview & F&F Input */}
          <div className="grid gap-6">
            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <FileText className="h-5 w-5 text-brand" /> Record Exit Interview
              </h3>
              <form onSubmit={handleExitInterviewSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
                    <select
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                      value={exitEmp}
                      onChange={(e) => setExitEmp(e.target.value)}
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Exit Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Leaving</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Better opportunity, relocation, personal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback / Notes</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm h-20"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide additional details or employee comments..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Interviewer (Optional)</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={interviewerId}
                    onChange={(e) => setInterviewerId(e.target.value)}
                  >
                    <option value="">Select Interviewer</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                  type="submit"
                >
                  Save Exit Interview Details
                </button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <Landmark className="h-5 w-5 text-brand" /> Full & Final Dues Settlement
              </h3>
              <form onSubmit={handleCalculateFnF} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                    <select
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                      value={ffEmp}
                      onChange={(e) => setFfEmp(e.target.value)}
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Drawn Salary (Base)</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      type="number"
                      value={ffSalary}
                      onChange={(e) => setFfSalary(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Resignation Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="date"
                      value={ffResignDate}
                      onChange={(e) => setFfResignDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Working Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="date"
                      value={ffExitDate}
                      onChange={(e) => setFfExitDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Days</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="number"
                      value={ffNoticeDays}
                      onChange={(e) => setFfNoticeDays(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Gratuity (Auto-computed if empty)</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="number"
                      value={ffGratuity}
                      onChange={(e) => setFfGratuity(e.target.value)}
                      placeholder="Computed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Leave Encashment Dues</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="number"
                      value={ffEncashment}
                      onChange={(e) => setFfEncashment(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Deductions & Recoveries</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="number"
                      value={ffRecovery}
                      onChange={(e) => setFfRecovery(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase text-slate-500">Asset Clearances</label>
                    <button
                      type="button"
                      onClick={addFfAsset}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add Asset
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {ffAssets.map((asset, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          className="min-h-9 flex-1 rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Asset Name (e.g. MacBook Pro)"
                          value={asset.assetName}
                          onChange={(e) => handleFfAssetChange(idx, "assetName", e.target.value)}
                          required
                        />
                        <input
                          className="min-h-9 flex-1 rounded-md border border-slate-200 px-3 text-xs"
                          placeholder="Serial Number (optional)"
                          value={asset.serialNumber}
                          onChange={(e) => handleFfAssetChange(idx, "serialNumber", e.target.value)}
                        />
                        <input
                          className="min-h-9 w-24 rounded-md border border-slate-200 px-3 text-xs"
                          type="number"
                          placeholder="Recovery Cost"
                          value={asset.recoveryCost}
                          onChange={(e) => handleFfAssetChange(idx, "recoveryCost", Number(e.target.value))}
                        />
                        {ffAssets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFfAsset(idx)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm"
                  type="submit"
                >
                  Generate F&F Statement
                </button>
              </form>
            </Card>
          </div>

          {/* Right: Generated F&F Statement View */}
          <div>
            {statement ? (
              <Card className="border border-[#e8edf4]">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3 flex items-center justify-between">
                  <span>Generated Full & Final Statement</span>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {statement.status}
                  </span>
                </h3>

                <div className="grid gap-3 text-sm mb-5">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400">Resignation Date</span>
                      <div className="font-semibold text-slate-800">{statement.resignationDate?.slice(0, 10)}</div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400">Last Working Date</span>
                      <div className="font-semibold text-slate-800">{statement.exitDate?.slice(0, 10)}</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 grid gap-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Last Drawn Salary (Dues)</span>
                      <span className="font-semibold text-slate-800">INR {Number(statement.lastDrawnSalary).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Gratuity Payout</span>
                      <span className="font-semibold text-slate-800">INR {Number(statement.gratuityDues).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Leave Encashment</span>
                      <span className="font-semibold text-slate-800">INR {Number(statement.encashmentDues).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-rose-600">
                      <span>Deductions & Recovery</span>
                      <span className="font-semibold">- INR {Number(statement.recoveryDues).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-base font-bold text-brand">
                      <span>Net Payable Amount</span>
                      <span>INR {Number(statement.netPayable).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Asset Checklist Recovery</h4>
                  {statement.assets?.length === 0 ? (
                    <p className="text-xs text-slate-400">No assets mapped to this statement.</p>
                  ) : (
                    <div className="grid gap-3">
                      {statement.assets.map((asset) => (
                        <div key={asset.id} className="flex justify-between items-center rounded-lg border p-3">
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">{asset.assetName}</div>
                            <div className="text-[10px] text-slate-400">
                              SN: {asset.serialNumber || "-"} | Recovery Cost: INR {Number(asset.recoveryCost).toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className={`px-2 py-1 text-[10px] font-bold rounded ${asset.returnedStatus === "RETURNED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                              onClick={() => updateAssetStatus(asset.id, "RETURNED")}
                            >
                              Returned
                            </button>
                            <button
                              type="button"
                              className={`px-2 py-1 text-[10px] font-bold rounded ${asset.returnedStatus === "RECOVER_COST" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}
                              onClick={() => updateAssetStatus(asset.id, "RECOVER_COST")}
                            >
                              Recover Cost
                            </button>
                            <button
                              type="button"
                              className={`px-2 py-1 text-[10px] font-bold rounded ${asset.returnedStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"}`}
                              onClick={() => updateAssetStatus(asset.id, "PENDING")}
                            >
                              Pending
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 text-slate-400 min-h-[300px]">
                <CheckSquare className="h-10 w-10 text-slate-300 mb-2" />
                <div className="text-sm font-semibold">No Statement Loaded</div>
                <p className="text-xs text-slate-400 max-w-xs text-center mt-1">
                  Fill the settlement form on the left and submit to generate the employee Full & Final statement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
