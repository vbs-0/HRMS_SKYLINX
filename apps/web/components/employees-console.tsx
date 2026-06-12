"use client";

import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { useActiveRole } from "../lib/role";
import { getCurrentCompanyId } from "../lib/session";
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
    verificationStatus?: string;
  } | null;
}

export function EmployeesConsole() {
  const [activeTab, setActiveTab] = useState("All Employees");
  const [searchQuery, setSearchQuery] = useState("");

  // Pick up ?q= from the global header search
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearchQuery(q);
  }, []);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployeeDetail | null>(null);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [expiries, setExpiries] = useState<any[]>([]);
  const [loadingExpiries, setLoadingExpiries] = useState(false);

  useEffect(() => {
    if (activeTab === "Document Expiry") {
      setLoadingExpiries(true);
      apiFetch<any[]>("/reminders/upcoming-expiries")
        .then((res) => {
          if (res.data) setExpiries(res.data);
        })
        .catch(() => undefined)
        .finally(() => setLoadingExpiries(false));
    }
  }, [activeTab]);

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
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });

  const [grades, setGrades] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [designationsList, setDesignationsList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<any[]>([]);

  function loadDropdowns() {
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
    loadDropdowns();
    
    apiFetch<any[]>(`/employees/grades/${getCurrentCompanyId()}`)
      .then((res) => {
        if (res.data) setGrades(res.data);
      })
      .catch(() => undefined);

    apiFetch<any[]>(`/employees/types/${getCurrentCompanyId()}`)
      .then((res) => {
        if (res.data) setEmploymentTypes(res.data);
      })
      .catch(() => undefined);

    return onDataRefresh("employees", () => {
      loadDropdowns();
    });
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
            accountHolderName: res.data.bankDetails?.accountHolderName || "",
            bankName: res.data.bankDetails?.bankName || "",
            accountNumber: "",
            ifsc: res.data.bankDetails?.ifsc || "",
            branch: res.data.bankDetails?.branch || "",
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
    // Capture the form element NOW — before any async work or state changes
    // unmount it from the DOM (setShowAddPanel(false) destroys the form).
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await apiFetch("/employees", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
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
      formEl?.reset();
      setShowAddPanel(false);
      setMessage("Employee profile added successfully!");
      requestDataRefresh("employees");
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
      // Bank details go through their own endpoint (encrypted, re-verification flow)
      if (editForm.accountNumber || editForm.bankName || editForm.ifsc) {
        if (editForm.accountNumber && editForm.bankName && editForm.ifsc && editForm.accountHolderName) {
          await apiFetch(`/employees/${selectedEmployeeId}/bank-details`, {
            method: "PATCH",
            body: JSON.stringify({
              accountHolderName: editForm.accountHolderName,
              bankName: editForm.bankName,
              accountNumber: editForm.accountNumber,
              ifsc: editForm.ifsc.toUpperCase(),
              branch: editForm.branch || undefined,
            }),
          });
        } else if (editForm.accountNumber) {
          throw new Error("To update bank details, fill account holder name, bank name, account number and IFSC together.");
        }
      }
      if (updated.data) {
        const refreshed = await apiFetch<ApiEmployeeDetail>(`/employees/${selectedEmployeeId}`);
        setSelectedEmployee(refreshed.data || updated.data);
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
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await apiFetch(`/employees/${myEmployeeId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          documentType: String(form.get("documentType")),
          fileUrl: String(form.get("fileUrl")),
          expiresAt: String(form.get("expiresAt")) || undefined,
        }),
      });
      formEl?.reset();
      setMessage("Document submitted for verification successfully.");
      requestDataRefresh("documents");
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

  // Dropdowns loaded dynamically from API in useEffect

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Directory"
        title="Employee Directory"
        summary="Search employees, manage profiles, bulk upload records, and verify documents."
        tabs={["All Employees", "My Profile", "Company Profile", "Verification", "Lifecycle", "Letter Templates", "Loans", "Custom Fields", "Document Expiry"]}
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
                        {selectedEmployee.bankDetails?.verificationStatus && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Verification</span>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              selectedEmployee.bankDetails.verificationStatus === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700"
                                : selectedEmployee.bankDetails.verificationStatus === "REJECTED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}>
                              {selectedEmployee.bankDetails.verificationStatus}
                            </span>
                          </div>
                        )}
                        {isEditing && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Account Holder</span>
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.accountHolderName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                              placeholder="Name as per bank"
                            />
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Bank Name</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.bankName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                              placeholder="e.g. HDFC Bank"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.bankName || "Not Set"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">IFSC Code</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs uppercase"
                              value={editForm.ifsc}
                              onChange={(e) => setEditForm(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                              placeholder="e.g. HDFC0001242"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.ifsc || "Not Set"}</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Account Number</span>
                          {isEditing ? (
                            <input
                              className="rounded-lg border px-2 py-0.5 text-xs"
                              value={editForm.accountNumber}
                              onChange={(e) => setEditForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))}
                              placeholder={selectedEmployee.bankDetails?.accountNumberMasked ? `Current: ${selectedEmployee.bankDetails.accountNumberMasked}` : "Enter account number"}
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{selectedEmployee.bankDetails?.accountNumberMasked || "Not Set"}</span>
                          )}
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
                      </div>
                    </div>
                  </div>

                  {/* Career History Section */}
                  <CareerHistoryPanel employeeId={selectedEmployee.id} />
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

      {activeTab === "Letter Templates" && (
        <LetterTemplatesPanel />
      )}

      {activeTab === "Loans" && (
        <EmployeeLoansPanel />
      )}

      {activeTab === "Custom Fields" && (
        <CustomFieldsPanel />
      )}

      {activeTab === "Document Expiry" && (
        <DocumentExpiryPanel expiries={expiries} loading={loadingExpiries} />
      )}
    </>
  );
}

function DocumentExpiryPanel({ expiries, loading }: { expiries: any[]; loading: boolean }) {
  return (
    <Card className="p-5 border border-[#e8edf4] text-left">
      <div className="mb-4 border-b pb-2 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800">Upcoming Document Expiries</h3>
          <p className="text-xs text-slate-400 mt-0.5">Documents expiring soon based on company rules & offsets.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs text-slate-650">
          <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
            <tr>
              <th className="p-2.5 text-left">Employee</th>
              <th className="p-2.5 text-left">Document Type</th>
              <th className="p-2.5 text-left">Expiry Date</th>
              <th className="p-2.5 text-left">Days Left</th>
              <th className="p-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-450">Loading upcoming expiries...</td>
              </tr>
            ) : !expiries || expiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">No documents set to expire soon.</td>
              </tr>
            ) : (
              expiries.map((doc: any) => {
                const expiryDate = new Date(doc.expiresAt);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let textColor = "text-slate-700";
                let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                let statusLabel = "Normal";

                if (diffDays < 7) {
                  textColor = "text-rose-600 font-bold animate-pulse";
                  badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                  statusLabel = "Critical";
                } else if (diffDays < 30) {
                  textColor = "text-amber-600 font-semibold";
                  badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                  statusLabel = "Warning";
                } else {
                  badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  statusLabel = "Good";
                }

                return (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-900">
                      {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "—"}
                    </td>
                    <td className="p-2.5">{doc.documentType}</td>
                    <td className="p-2.5">{expiryDate.toLocaleDateString("en-IN")}</td>
                    <td className={`p-2.5 ${textColor}`}>{diffDays} day{diffDays !== 1 ? "s" : ""}</td>
                    <td className="p-2.5">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LetterTemplatesPanel() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [renderedLetter, setRenderedLetter] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "OFFER",
    title: "",
    body: "Dear {{employeeName}},\n\nWe are pleased to offer you the position of {{designation}} in our {{department}} department. Your joining date is {{joiningDate}}.\n\nBest regards,\nSkylinx HR Team",
  });

  function load() {
    apiFetch<any[]>(`/employees/letter-templates/list/${getCurrentCompanyId()}`).then((res) => {
      if (res.data) setTemplates(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.body) {
      setError("Please fill in all template fields.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/employees/letter-templates", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          type: form.type,
          title: form.title,
          body: form.body,
        }),
      });
      setMessage("Template created successfully!");
      setForm({ type: "OFFER", title: "", body: "Dear {{employeeName}},\n\nWe are pleased to offer you the position of {{designation}} in our {{department}} department. Your joining date is {{joiningDate}}.\n\nBest regards,\nSkylinx HR Team" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRender() {
    if (!selectedTemplateId || !selectedEmployeeId) {
      setError("Please select both a template and an employee.");
      return;
    }
    setError("");
    setRenderedLetter(null);
    try {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (!emp) return;

      const placeholders = {
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
        email: emp.email,
        designation: emp.designation?.title || "Staff Member",
        department: emp.department?.name || "General Department",
      };

      const res = await apiFetch<any>("/employees/letter-templates/render", {
        method: "POST",
        body: JSON.stringify({
          templateId: selectedTemplateId,
          placeholders,
        }),
      });
      if (res.data) {
        setRenderedLetter(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to render letter.");
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold">{error}</div>}

      <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Create Document Template</h3>
          <form onSubmit={handleCreateTemplate} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select
                name="type"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="OFFER">Offer Letter</option>
                <option value="APPOINTMENT">Appointment Letter</option>
                <option value="RELIEVING">Relieving Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Template Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Developer Offer"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{"Body Text (use placeholders like {{employeeName}}, {{designation}})"}</label>
              <textarea
                rows={8}
                required
                className="w-full rounded-lg border border-slate-200 p-3 text-xs font-mono bg-slate-50"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
            >
              {submitting ? "Saving..." : "Save Template"}
            </button>
          </form>
        </Card>

        <div className="grid gap-6">
          <Card className="p-5 border border-[#e8edf4]">
            <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Generate & Print Preview</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Template</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Select Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Choose Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={handleRender}
                className="px-4 py-2 bg-brand text-white rounded text-xs font-bold hover:bg-brand/90"
              >
                Render Preview
              </button>
              {renderedLetter && (
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold hover:bg-slate-50"
                >
                  Print / Save PDF
                </button>
              )}
            </div>

            {renderedLetter ? (
              <div className="print-area border border-dashed border-slate-350 p-8 bg-white rounded-lg min-h-[300px] shadow-inner print:border-none print:shadow-none" id="print-area">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">Skylinx PeopleOS</h2>
                  <p className="text-[10px] text-slate-400">121 Innovation Way, Tech District, Mumbai</p>
                  <hr className="my-3 border-slate-200" />
                </div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Subject: {renderedLetter.title}</div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {renderedLetter.renderedBody}
                </p>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 p-8 text-center text-slate-400 rounded-lg bg-slate-50/50">
                Select template & employee to view preview
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmployeeLoansPanel() {
  const [loans, setLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { role } = useActiveRole();

  const [form, setForm] = useState({
    employeeId: "",
    principal: 10000,
    interestRate: 0,
    totalPayable: 10000,
    emiAmount: 1000,
    repaymentStart: new Date().toISOString().split("T")[0],
  });

  function load() {
    apiFetch<any[]>("/employees/loans/list/all").then((res) => {
      if (res.data) setLoans(res.data);
    });
    apiFetch<any[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const total = Number(form.principal) + (Number(form.principal) * (Number(form.interestRate) / 100));
    setForm((prev) => ({ ...prev, totalPayable: total }));
  }, [form.principal, form.interestRate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId || form.principal <= 0 || form.emiAmount <= 0) {
      setError("Please fill all required fields correctly.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/employees/loans", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          principal: Number(form.principal),
          interestRate: Number(form.interestRate),
          totalPayable: Number(form.totalPayable),
          emiAmount: Number(form.emiAmount),
          repaymentStart: form.repaymentStart,
        }),
      });
      setMessage("Loan application submitted successfully!");
      setForm({
        employeeId: "",
        principal: 10000,
        interestRate: 0,
        totalPayable: 10000,
        emiAmount: 1000,
        repaymentStart: new Date().toISOString().split("T")[0],
      });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create loan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(id: string, action: "APPROVED" | "REJECTED") {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/employees/loans/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setMessage(`Loan request marked ${action.toLowerCase()} successfully.`);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to decide loan request.");
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {message && <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a] font-semibold">{message}</div>}
      {error && <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37] font-semibold">{error}</div>}

      <div className="grid grid-cols-[1fr_2fr] gap-6 max-lg:grid-cols-1">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Apply for Employee Loan</h3>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
              <select
                name="employeeId"
                id="loan-employee-select"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">Principal Amount (₹)</label>
              <input
                type="number"
                required
                min="1000"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.principal}
                onChange={(e) => setForm({ ...form, principal: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                min="0"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Payable (₹)</label>
              <input
                type="number"
                disabled
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-slate-50 font-bold"
                value={form.totalPayable}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                required
                min="100"
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.emiAmount}
                onChange={(e) => setForm({ ...form, emiAmount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Repayment Start Date</label>
              <input
                type="date"
                required
                className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.repaymentStart}
                onChange={(e) => setForm({ ...form, repaymentStart: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-10 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 transition shadow-sm"
            >
              {submitting ? "Submitting..." : "Apply Loan"}
            </button>
          </form>
        </Card>

        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Active Loans & Outstanding EMI</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-slate-650">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-2.5">Employee</th>
                  <th className="p-2.5">Principal</th>
                  <th className="p-2.5">Total Payable</th>
                  <th className="p-2.5">EMI Amount</th>
                  <th className="p-2.5">Balance Amount</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loans.length ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">No active loans found.</td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-2.5 font-semibold text-slate-900">{loan.employee?.firstName} {loan.employee?.lastName}</td>
                      <td className="p-2.5">₹{Number(loan.principal).toLocaleString("en-IN")}</td>
                      <td className="p-2.5">₹{Number(loan.totalPayable).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 font-bold">₹{Number(loan.emiAmount).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 font-bold text-brand">₹{Number(loan.balanceAmount).toLocaleString("en-IN")}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={loan.status === "PENDING" ? "yellow" : loan.status === "APPROVED" ? "green" : "red"}>
                            {loan.status}
                          </StatusPill>
                          {loan.status === "PENDING" && role === "admin" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecide(loan.id, "APPROVED")}
                                className="bg-emerald-600 text-white rounded px-2 py-0.5 font-bold hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecide(loan.id, "REJECTED")}
                                className="border border-slate-200 text-slate-700 bg-white rounded px-2 py-0.5 font-bold hover:bg-slate-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CareerHistoryPanel({ employeeId }: { employeeId: string }) {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"promotions" | "transfers">("promotions");

  useEffect(() => {
    if (!employeeId) return;
    apiFetch<any[]>(`/employees/${employeeId}/promotions`).then((res) => {
      if (res.data) setPromotions(res.data);
    });
    apiFetch<any[]>(`/employees/${employeeId}/transfers`).then((res) => {
      if (res.data) setTransfers(res.data);
    });
  }, [employeeId]);

  return (
    <div className="rounded-xl border border-slate-200 p-5 mt-4 space-y-4 text-left">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>Career History Timeline</span>
        </h4>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setActiveHistoryTab("promotions")}
            className={`px-3 py-1 rounded-md font-bold transition ${activeHistoryTab === "promotions" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Promotions ({promotions.length})
          </button>
          <button
            onClick={() => setActiveHistoryTab("transfers")}
            className={`px-3 py-1 rounded-md font-bold transition ${activeHistoryTab === "transfers" ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Transfers ({transfers.length})
          </button>
        </div>
      </div>

      {activeHistoryTab === "promotions" ? (
        <div className="space-y-4">
          {!promotions.length ? (
            <p className="text-xs text-slate-400 italic">No promotions recorded.</p>
          ) : (
            promotions.map((p) => (
              <div key={p.id} className="relative border-l-2 border-brand/20 pl-4 py-1">
                <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand"></div>
                <div className="text-xs font-bold text-slate-800">
                  {p.fromDesignation?.title || "Designation"} → {p.toDesignation?.title || "New Designation"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Effective: {p.effectiveDate?.slice(0, 10)} | CTC Revision: {p.revisedCtc ? `₹${Number(p.revisedCtc).toLocaleString("en-IN")}` : "N/A"}
                </div>
                {p.reason && <p className="text-xs text-slate-500 mt-1">Reason: {p.reason}</p>}
                <div className="mt-1">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{p.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!transfers.length ? (
            <p className="text-xs text-slate-400 italic">No transfers recorded.</p>
          ) : (
            transfers.map((t) => (
              <div key={t.id} className="relative border-l-2 border-brand/20 pl-4 py-1">
                <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand"></div>
                <div className="text-xs font-bold text-slate-800">
                  Department: {t.fromDepartment?.name || "N/A"} → {t.toDepartment?.name || "N/A"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Location: {t.fromLocation?.name || "N/A"} → {t.toLocation?.name || "N/A"} | Effective: {t.effectiveDate?.slice(0, 10)}
                </div>
                <div className="mt-1">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{t.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Custom Fields Panel
// ==========================================
function CustomFieldsPanel() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any[]>>({});
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loading, setLoading] = useState(true);

  // Create field form
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Edit value
  const [editValue, setEditValue] = useState<Record<string, string>>({});
  const [savingValue, setSavingValue] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiFetch<any[]>("/custom-fields/definitions"),
      apiFetch<any[]>("/employees"),
    ])
      .then(([defs, emps]) => {
        setDefinitions(defs.data || []);
        setEmployees(emps.data || []);
        if (emps.data?.[0] && !selectedEmpId) setSelectedEmpId(emps.data[0].id);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedEmpId) return;
    apiFetch<any[]>(`/custom-fields/values/${selectedEmpId}`)
      .then((res) => setValues((prev) => ({ ...prev, [selectedEmpId]: res.data || [] })))
      .catch(() => undefined);
  }, [selectedEmpId]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/custom-fields/definitions", {
        method: "POST",
        body: JSON.stringify({ name: fieldName, label: fieldLabel, type: fieldType, required: fieldRequired }),
      });
      setMessage("Custom field created!");
      setFieldName("");
      setFieldLabel("");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create custom field");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveValue = async (definitionId: string) => {
    if (!selectedEmpId) return;
    setSavingValue(definitionId);
    try {
      await apiFetch("/custom-fields/values", {
        method: "POST",
        body: JSON.stringify({ employeeId: selectedEmpId, definitionId, value: editValue[definitionId] ?? "" }),
      });
      setMessage("Field value saved!");
      const res = await apiFetch<any[]>(`/custom-fields/values/${selectedEmpId}`);
      setValues((prev) => ({ ...prev, [selectedEmpId]: res.data || [] }));
    } catch (err: any) {
      setError(err.message || "Failed to save value");
    } finally {
      setSavingValue(null);
    }
  };

  const empValues = selectedEmpId ? (values[selectedEmpId] || []) : [];
  const valueMap = Object.fromEntries(empValues.map((v: any) => [v.definitionId, v.value]));

  return (
    <div className="grid grid-cols-[1fr_1.4fr] gap-6 max-lg:grid-cols-1">
      {/* Left: Definitions + Create */}
      <div className="space-y-4">
        <Card className="p-5 border border-[#e8edf4]">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Create Custom Field</h3>
          {message && <div className="mb-3 rounded bg-[#e6f5ef] p-2 text-xs text-green-700 font-semibold">{message}</div>}
          {error && <div className="mb-3 rounded bg-[#fde8e6] p-2 text-xs text-red-700 font-semibold">{error}</div>}
          <form onSubmit={handleCreateField} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="cf-name">
                  Field Key *
                </label>
                <input
                  id="cf-name"
                  name="cf-name"
                  required
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="e.g. bloodGroup"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="cf-label">
                  Display Label *
                </label>
                <input
                  id="cf-label"
                  name="cf-label"
                  required
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                  placeholder="e.g. Blood Group"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="cf-type">
                  Field Type
                </label>
                <select
                  id="cf-type"
                  name="cf-type"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                >
                  {["TEXT", "NUMBER", "DATE", "BOOLEAN", "SELECT"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 pt-4">
                <input
                  type="checkbox"
                  id="cf-required"
                  name="cf-required"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                <label htmlFor="cf-required" className="text-xs text-slate-600">Required</label>
              </div>
            </div>
            <button
              type="submit"
              id="create-cf-btn"
              disabled={saving}
              className="rounded bg-brand py-1.5 text-xs font-bold text-white hover:bg-brand/90 transition"
            >
              {saving ? "Creating…" : "Create Field"}
            </button>
          </form>
        </Card>

        <Card className="p-4 border border-[#e8edf4]">
          <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">All Field Definitions</h4>
          {loading ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : definitions.length === 0 ? (
            <p className="text-xs text-slate-400">No custom fields defined yet.</p>
          ) : (
            <div className="space-y-1.5">
              {definitions.map((def) => (
                <div key={def.id} className="flex items-center gap-2 text-xs rounded bg-slate-50 px-2 py-1.5">
                  <span className="font-mono text-slate-500">{def.name}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-700">{def.label}</span>
                  <span className="ml-auto text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{def.type}</span>
                  {def.required && <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded">req</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right: Employee Value Editor */}
      <Card className="p-5 border border-[#e8edf4]">
        <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Employee Custom Field Values</h3>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="cf-emp-select">
            Select Employee
          </label>
          <select
            id="cf-emp-select"
            name="cf-emp-select"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        {definitions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Create some custom fields first.</p>
        ) : (
          <div className="space-y-3">
            {definitions.map((def) => {
              const current = valueMap[def.id] ?? "";
              const editing = editValue[def.id] ?? current;
              return (
                <div key={def.id} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {def.label}
                      {def.required && <span className="text-red-500 ml-0.5">*</span>}
                      <span className="ml-1 text-[10px] text-slate-400">({def.type})</span>
                    </label>
                    {def.type === "BOOLEAN" ? (
                      <select
                        value={editing}
                        onChange={(e) => setEditValue((prev) => ({ ...prev, [def.id]: e.target.value }))}
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                        id={`cf-val-${def.id}`}
                        name={`cf-val-${def.id}`}
                      >
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type={def.type === "DATE" ? "date" : def.type === "NUMBER" ? "number" : "text"}
                        id={`cf-val-${def.id}`}
                        name={`cf-val-${def.id}`}
                        value={editing}
                        onChange={(e) => setEditValue((prev) => ({ ...prev, [def.id]: e.target.value }))}
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                        placeholder={current || `Enter ${def.label}`}
                      />
                    )}
                  </div>
                  <button
                    id={`save-cf-${def.id}`}
                    disabled={savingValue === def.id}
                    onClick={() => handleSaveValue(def.id)}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand/90 transition disabled:opacity-50"
                  >
                    {savingValue === def.id ? "…" : "Save"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
