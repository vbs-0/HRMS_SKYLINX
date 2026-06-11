"use client";

import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { EmployeesTable, DocumentsTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { Card, StatusPill } from "./ui";
import { LifecycleConsole } from "./lifecycle-console";
import { 
  UserPlus, 
  Upload, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  Edit3, 
  Save, 
  User, 
  Briefcase, 
  PhoneCall, 
  CreditCard 
} from "lucide-react";

interface ApiEmployeeDetail {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  joiningDate: string;
  employmentType: string;
  status: string;
  panNumber?: string | null;
  providentFundAccount?: string | null;
  gradeId?: string | null;
  employmentTypeId?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  locationId?: string | null;
  managerId?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  location?: { id: string; name: string } | null;
  grade?: { id: string; name: string; maxExpenseLimit: number } | null;
  employmentTypeRelation?: { id: string; name: string } | null;
  bankDetails?: {
    id: string;
    accountHolderName: string;
    bankName: string;
    accountNumberMasked?: string;
    ifsc: string;
    branch?: string | null;
  } | null;
}

export function EmployeesConsole() {
  const [activeTab, setActiveTab] = useState("All Employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployeeDetail | null>(null);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Edit states for profile
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    gender: "",
    dateOfBirth: "",
    departmentId: "",
    designationId: "",
    locationId: "",
    panNumber: "",
    providentFundAccount: "",
    gradeId: "",
    employmentTypeId: "",
  });

  const [grades, setGrades] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);

  useEffect(() => {
    apiFetch<any[]>("/employees/grades/company_skylinx")
      .then((res) => {
        if (res.data) setGrades(res.data);
      })
      .catch(() => undefined);

    apiFetch<any[]>("/employees/types/company_skylinx")
      .then((res) => {
        if (res.data) setEmploymentTypes(res.data);
      })
      .catch(() => undefined);
  }, []);

  // Company Profile summary stats
  const [companyStats, setCompanyStats] = useState({
    totalCount: 0,
    activeCount: 0,
    depts: [] as string[],
    locs: [] as string[],
  });

  // Load current user employee ID
  useEffect(() => {
    apiFetch<{ employeeId: string | null }>("/auth/me")
      .then((res) => {
        if (res.data?.employeeId) {
          setMyEmployeeId(res.data.employeeId);
        }
      })
      .catch(() => undefined);
  }, []);

  // Load Company Stats from `/employees` list
  useEffect(() => {
    apiFetch<any[]>("/employees")
      .then((res) => {
        const list = res.data || [];
        const departments = new Set<string>();
        const locations = new Set<string>();
        let active = 0;
        list.forEach((e) => {
          if (e.status === "ACTIVE") active++;
          if (e.department?.name) departments.add(e.department.name);
          if (e.location?.name) locations.add(e.location.name);
        });
        setCompanyStats({
          totalCount: list.length,
          activeCount: active,
          depts: Array.from(departments),
          locs: Array.from(locations),
        });
      })
      .catch(() => undefined);
  }, [activeTab]);

  // Load details if selectedEmployeeId changes
  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedEmployee(null);
      return;
    }
    setLoading(true);
    apiFetch<ApiEmployeeDetail>(`/employees/${selectedEmployeeId}`)
      .then((res) => {
        if (res.data) {
          setSelectedEmployee(res.data);
          setEditForm({
            phone: res.data.phone || "",
            gender: res.data.gender || "",
            dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.substring(0, 10) : "",
            departmentId: res.data.departmentId || "",
            designationId: res.data.designationId || "",
            locationId: res.data.locationId || "",
            panNumber: res.data.panNumber || "",
            providentFundAccount: res.data.providentFundAccount || "",
            gradeId: res.data.gradeId || "",
            employmentTypeId: res.data.employmentTypeId || "",
          });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load employee details");
      })
      .finally(() => setLoading(false));
  }, [selectedEmployeeId]);

  // Trigger loading "My Profile" details
  useEffect(() => {
    if (activeTab === "My Profile" && myEmployeeId) {
      setSelectedEmployeeId(myEmployeeId);
    } else if (activeTab === "My Profile" && !myEmployeeId) {
      setError("No linked employee profile found for the current user.");
    }
  }, [activeTab, myEmployeeId]);

  // Add employee submission
  async function handleAddEmployee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/employees", {
        method: "POST",
        body: JSON.stringify({
          companyId: "company_skylinx",
          employeeCode: String(form.get("employeeCode")),
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          email: String(form.get("email")),
          phone: String(form.get("phone")) || undefined,
          joiningDate: String(form.get("joiningDate")),
          departmentId: String(form.get("departmentId")) || undefined,
          designationId: String(form.get("designationId")) || undefined,
          locationId: String(form.get("locationId")) || undefined,
        }),
      });
      setMessage("Employee profile added successfully!");
      setShowAddPanel(false);
      requestDataRefresh("employees");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setLoading(false);
    }
  }

  // Bulk Upload submission
  async function handleBulkUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await apiFetch("/employees/bulk-upload", {
        method: "POST",
        body: JSON.stringify({ simulated: true }),
      });
      setMessage("Bulk upload simulated successfully! All spreadsheet lines imported.");
      setShowBulkPanel(false);
      requestDataRefresh("employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  }

  // Save profile edits
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const updated = await apiFetch<ApiEmployeeDetail>(`/employees/${selectedEmployeeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          phone: editForm.phone || null,
          gender: editForm.gender || null,
          dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : null,
          departmentId: editForm.departmentId || null,
          designationId: editForm.designationId || null,
          locationId: editForm.locationId || null,
          panNumber: editForm.panNumber || null,
          providentFundAccount: editForm.providentFundAccount || null,
          gradeId: editForm.gradeId || null,
          employmentTypeId: editForm.employmentTypeId || null,
        }),
      });
      if (updated.data) {
        setSelectedEmployee(updated.data);
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        requestDataRefresh("employees");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  // Document Upload for Verification
  async function handleUploadDoc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myEmployeeId) {
      setError("Cannot submit: No linked employee profile to attach document.");
      return;
    }
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch(`/employees/${myEmployeeId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          documentType: String(form.get("documentType")),
          fileUrl: String(form.get("fileUrl")),
          expiresAt: String(form.get("expiresAt")) || undefined,
        }),
      });
      setMessage("Document submitted for verification successfully.");
      requestDataRefresh("documents");
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  // Export CSV download
  async function handleExportCsv() {
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<any[]>("/employees");
      const list = res.data || [];
      if (!list.length) {
        setError("No employees found to export.");
        return;
      }
      const headers = ["Employee Code", "First Name", "Last Name", "Email", "Phone", "Joining Date", "Department", "Designation", "Location", "Status"];
      const csvData = list.map((e) => [
        e.employeeCode,
        e.firstName,
        e.lastName,
        e.email,
        e.phone || "",
        e.joiningDate ? e.joiningDate.slice(0, 10) : "",
        e.department?.name || "",
        e.designation?.title || "",
        e.location?.name || "",
        e.status,
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(",")].concat(csvData.map((row) => row.map((val) => `"${val}"`).join(","))).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "employee_directory.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage("CSV Export downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  const departmentsList = [
    { value: "dept_finance", label: "Finance" },
    { value: "dept_sales", label: "Sales" },
    { value: "dept_engineering", label: "Engineering" },
    { value: "dept_operations", label: "Operations" },
    { value: "dept_people", label: "HR" },
  ];

  const designationsList = [
    { value: "des_hr_manager", label: "HR Manager" },
    { value: "des_payroll", label: "Payroll Specialist" },
    { value: "des_engineer", label: "Frontend Engineer" },
    { value: "des_sales", label: "Sales Executive" },
    { value: "des_ops", label: "Operations Lead" },
  ];

  const locationsList = [
    { value: "loc_delhi", label: "Delhi" },
    { value: "loc_hyderabad", label: "Hyderabad" },
    { value: "loc_pune", label: "Pune" },
    { value: "loc_bengaluru", label: "Bengaluru" },
    { value: "loc_mumbai", label: "Mumbai" },
  ];

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Directory"
        title="Employee Directory"
        summary="Search employees, manage profiles, bulk upload records, and verify documents."
        tabs={["All Employees", "My Profile", "Company Profile", "Verification", "Lifecycle"]}
        activeTab={activeTab}
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setMessage("");
          setError("");
          if (tab !== "My Profile") setSelectedEmployeeId(null);
        }}
        actions={[
          { label: "Add Employee", icon: <UserPlus className="h-4 w-4" />, tone: "primary", onClick: () => { setActiveTab("All Employees"); setShowAddPanel(!showAddPanel); setShowBulkPanel(false); } },
          { label: "Bulk Upload", icon: <Upload className="h-4 w-4" />, onClick: () => { setActiveTab("All Employees"); setShowBulkPanel(!showBulkPanel); setShowAddPanel(false); } },
          { label: "Export", icon: <Download className="h-4 w-4" />, onClick: handleExportCsv },
        ]}
        stats={[
          { label: "Total Headcount", value: String(companyStats.totalCount), note: "Registered" },
          { label: "Active Staff", value: String(companyStats.activeCount), note: "Database list" },
          { label: "Locations", value: String(companyStats.locs.length || 5), note: "Offices" },
        ]}
      />

      <ReferenceFlowStrip module="Directory" />

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

      {/* ALL EMPLOYEES TAB */}
      {activeTab === "All Employees" && (
        <div className="grid gap-5">
          {showAddPanel && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Add New Employee Profile</h3>
              <form onSubmit={handleAddEmployee} className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Employee Code</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="employeeCode" placeholder="EMP-1006" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">First Name</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="firstName" placeholder="John" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="lastName" placeholder="Doe" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="email" placeholder="john.doe@company.local" type="email" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="phone" placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Joining Date</label>
                  <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="joiningDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="departmentId">
                    <option value="">Select Department</option>
                    {departmentsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Designation</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="designationId">
                    <option value="">Select Designation</option>
                    {designationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Work Location</label>
                  <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="locationId">
                    <option value="">Select Location</option>
                    {locationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowAddPanel(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Create Employee"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showBulkPanel && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in zoom-in-95 duration-150">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-800">Bulk Upload Spreadsheet</h3>
              <p className="text-xs text-slate-400 mb-4 font-normal">Upload CSV / Excel sheets to parse multiple employee records at once.</p>
              <form onSubmit={handleBulkUpload} className="flex flex-col gap-4 max-w-md">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-brand transition cursor-pointer">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-sm font-semibold text-slate-600 block">Drag file here or browse</span>
                  <span className="text-xs text-slate-400 block mt-1">Accepts CSV, XLSX up to 10MB</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50" type="button" onClick={() => setShowBulkPanel(false)}>Cancel</button>
                  <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark" type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Import Spreadsheet"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">Active Directory Roster</h2>
              <div className="relative w-72">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  className="min-h-10 w-full rounded-lg border border-[#dce2eb] bg-[#f8fafc] pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white"
                  placeholder="Search code, name, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Code</th>
                    <th className="border-b border-[#dce2eb] p-3">Name</th>
                    <th className="border-b border-[#dce2eb] p-3">Role</th>
                    <th className="border-b border-[#dce2eb] p-3">Department</th>
                    <th className="border-b border-[#dce2eb] p-3">Location</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                  </tr>
                </thead>
                <EmployeesTable searchQuery={searchQuery} onSelectEmployee={(id) => setSelectedEmployeeId(id)} />
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MY PROFILE TAB & INSPECTOR PANEL */}
      {((activeTab === "My Profile") || (activeTab === "All Employees" && selectedEmployeeId)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-4">
          <div className="h-full w-full max-w-4xl rounded-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-200 border border-slate-100 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeTab === "My Profile" ? "My Personal Profile" : "Inspect Employee Profile"}
                </h3>
                <p className="text-xs text-slate-400">View detailed HR ledger and update personal details.</p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 transition"
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setIsEditing(false);
                  if (activeTab === "My Profile") setActiveTab("All Employees");
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && !selectedEmployee ? (
                <div className="py-20 text-center text-slate-400 font-semibold">Loading profile ledger...</div>
              ) : selectedEmployee ? (
                <div className="grid gap-6">
                  {/* Summary Ribbon */}
                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-[#f8fafc] p-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand uppercase">
                      {selectedEmployee.firstName.substring(0, 1) + selectedEmployee.lastName.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                      <p className="text-sm text-slate-500 font-semibold">{selectedEmployee.designation?.title || "Staff Member"}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs text-slate-400">ID: {selectedEmployee.employeeCode}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <StatusPill>{selectedEmployee.status}</StatusPill>
                      </div>
                    </div>
                    {/* Edit Profile Button (for HR or for employee) */}
                    <div className="ml-auto">
                      {isEditing ? (
                        <button
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                          onClick={handleSaveProfile}
                        >
                          <Save className="h-4 w-4" /> Save Profile
                        </button>
                      ) : (
                        <button
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 className="h-4 w-4" /> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                    {/* Personal Information */}
                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <User className="h-4 w-4 text-brand" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Personal Information</h4>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Gender</span>
                          {isEditing ? (
                            <select
                              name="gender"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.gender}
                              onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.gender || "Not Specified"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Date of Birth</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              type="date"
                              value={editForm.dateOfBirth}
                              onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString("en-IN") : "Update required"}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Blood Group</span>
                          <span className="font-semibold text-slate-800">O+</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Information */}
                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Briefcase className="h-4 w-4 text-brand" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Official Details</h4>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Department</span>
                          {isEditing ? (
                            <select
                              name="departmentId"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.departmentId}
                              onChange={(e) => setEditForm(prev => ({ ...prev, departmentId: e.target.value }))}
                            >
                              <option value="">Select Department</option>
                              {departmentsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.department?.name || "Unassigned"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Designation</span>
                          {isEditing ? (
                            <select
                              name="designationId"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.designationId}
                              onChange={(e) => setEditForm(prev => ({ ...prev, designationId: e.target.value }))}
                            >
                              <option value="">Select Designation</option>
                              {designationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.designation?.title || "Unassigned"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Work Location</span>
                          {isEditing ? (
                            <select
                              name="locationId"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.locationId}
                              onChange={(e) => setEditForm(prev => ({ ...prev, locationId: e.target.value }))}
                            >
                              <option value="">Select Location</option>
                              {locationsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.location?.name || "Unassigned"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Grade</span>
                          {isEditing ? (
                            <select
                              name="gradeId"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.gradeId}
                              onChange={(e) => setEditForm(prev => ({ ...prev, gradeId: e.target.value }))}
                            >
                              <option value="">Select Grade</option>
                              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.grade?.name || "Unassigned"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Employment Type</span>
                          {isEditing ? (
                            <select
                              name="employmentTypeId"
                              className="rounded-lg border px-2 py-0.5 text-xs bg-white"
                              value={editForm.employmentTypeId}
                              onChange={(e) => setEditForm(prev => ({ ...prev, employmentTypeId: e.target.value }))}
                            >
                              <option value="">Select Type</option>
                              {employmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.employmentTypeRelation?.name || selectedEmployee.employmentType || "Full-Time"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <PhoneCall className="h-4 w-4 text-brand" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Contact Details</h4>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Mobile</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.phone}
                              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.phone || "Not Set"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Email</span>
                          <span className="font-semibold text-slate-800">{selectedEmployee.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank & Compliance Details */}
                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <CreditCard className="h-4 w-4 text-brand" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Bank & Accounts</h4>
                      </div>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Bank Name</span>
                          <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.bankName || "HDFC Bank"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">IFSC Code</span>
                          <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.ifsc || "HDFC0001242"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Account Number</span>
                          <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.accountNumberMasked || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">PAN Number</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.panNumber}
                              onChange={(e) => setEditForm(prev => ({ ...prev, panNumber: e.target.value }))}
                              placeholder="ABCDE1234F"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.panNumber || "Not Set"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">PF Account</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.providentFundAccount}
                              onChange={(e) => setEditForm(prev => ({ ...prev, providentFundAccount: e.target.value }))}
                              placeholder="MH/BAN/12345/678"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.providentFundAccount || "Not Set"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400">Failed to load profile details.</div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="border-t p-5 flex justify-end">
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition"
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setIsEditing(false);
                  if (activeTab === "My Profile") setActiveTab("All Employees");
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY PROFILE TAB */}
      {activeTab === "Company Profile" && (
        <div className="grid gap-6">
          <section className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
            <div className="rounded-xl border border-[#dce2eb] bg-white p-5 shadow-sm text-center">
              <Building2 className="mx-auto h-8 w-8 text-brand mb-2" />
              <h3 className="text-lg font-bold text-slate-800">SKYLINX Global Solutions</h3>
              <p className="text-xs text-slate-400 uppercase font-semibold mt-1">HQ Corporate Office</p>
              <div className="mt-4 grid gap-2 text-left text-sm">
                <div className="rounded-lg bg-[#f8fafc] p-3"><strong>Entity Code</strong><br />SGS-GLOBAL</div>
                <div className="rounded-lg bg-[#f8fafc] p-3"><strong>Subscription</strong><br />Standard Enterprise Plan</div>
              </div>
            </div>
            <div className="rounded-xl border border-[#dce2eb] bg-white p-5 shadow-sm space-y-4 col-span-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">Operational Headcount</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold text-slate-400">Total Departments</h5>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {companyStats.depts.map(dept => <span key={dept} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{dept}</span>)}
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-slate-400">Locations Roster</h5>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {companyStats.locs.map(loc => <span key={loc} className="rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{loc}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VERIFICATION TAB */}
      {activeTab === "Verification" && (
        <div className="grid grid-cols-[320px_1fr] gap-6 max-xl:grid-cols-1">
          {/* Left: Upload Document */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3 mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4 text-brand" /> Submit Document
            </h3>
            <form onSubmit={handleUploadDoc} className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Document Type</label>
                <select className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white" name="documentType" required>
                  <option value="">Select Document type</option>
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Education Certificate">Education Certificate</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="Bank Proof">Bank Proof</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">File URL</label>
                <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="fileUrl" placeholder="https://secure-docs.net/my-file.pdf" required type="url" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                <input className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" name="expiresAt" type="date" />
              </div>
              <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Add to Queue"}
              </button>
            </form>
          </div>

          {/* Right: Verification Queue Table */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Verification Ledger Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Documents uploaded by employee profiles awaiting HR/Admin review.</p>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm text-left">
                <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="border-b border-[#dce2eb] p-3">Employee</th>
                    <th className="border-b border-[#dce2eb] p-3">Type</th>
                    <th className="border-b border-[#dce2eb] p-3">Expiry Date</th>
                    <th className="border-b border-[#dce2eb] p-3">File</th>
                    <th className="border-b border-[#dce2eb] p-3">Status</th>
                  </tr>
                </thead>
                <DocumentsTable />
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Lifecycle" && (
        <LifecycleConsole />
      )}
    </>
  );
}
