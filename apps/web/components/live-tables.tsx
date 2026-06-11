"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackAttendance, fallbackDepartments, fallbackDocuments, fallbackEmployees, fallbackExpenses, fallbackHolidays, fallbackInsuranceClaims, fallbackInsurancePolicies, fallbackLeaves, fallbackNotifications, fallbackOrgEmployees, fallbackPayroll } from "../lib/fallback-data";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { Card, StatusPill } from "./ui";

type EmployeeRow = (typeof fallbackEmployees)[number];
type AttendanceRow = (typeof fallbackAttendance)[number];
type LeaveRow = (typeof fallbackLeaves)[number];
type PayrollRow = (typeof fallbackPayroll)[number];
type DocumentRow = (typeof fallbackDocuments)[number];
type ExpenseRow = (typeof fallbackExpenses)[number];
type HolidayRow = (typeof fallbackHolidays)[number];
type InsurancePolicyRow = (typeof fallbackInsurancePolicies)[number];
type InsuranceClaimRow = (typeof fallbackInsuranceClaims)[number];
type NotificationRow = (typeof fallbackNotifications)[number];
interface OrgEmployeeRow {
  id: string;
  employeeCode: string;
  name: string;
  managerId: string | null;
  managerName: string | null;
  department: string;
  designation: string;
  location: string;
  status: string;
  reports: number;
}
type DepartmentRow = (typeof fallbackDepartments)[number];
type LeaveDisplayRow = LeaveRow & { id?: string };

interface ApiEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: { name: string } | null;
  designation?: { title: string } | null;
  location?: { name: string } | null;
}

interface ApiAttendance {
  date: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status: string;
  employee: { firstName: string; lastName: string };
}

interface ApiLeaveBalance {
  available: string;
  year: number;
  employee: { firstName: string; lastName: string };
  leaveType: { name: string };
}

interface ApiLeaveRequest {
  id: string;
  fromDate: string;
  toDate: string;
  days: string;
  status: string;
  employee: { firstName: string; lastName: string };
  leaveType: { name: string };
}

interface ApiRegularization {
  id: string;
  reason: string;
  status: string;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  employee: { firstName: string; lastName: string };
}

interface ApiPayslip {
  grossPay: string;
  deductions: string;
  netPay: string;
  status: string;
  employee: { firstName: string; lastName: string };
}

interface ApiDocument {
  id: string;
  employeeId: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: string;
  expiresAt?: string | null;
  employee: { firstName: string; lastName: string };
}

interface ApiExpense {
  id: string;
  category: string;
  amount: string;
  receiptUrl?: string | null;
  claimDate: string;
  status: string;
  employee: { firstName: string; lastName: string };
}

interface ApiHoliday {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
  location?: { name: string } | null;
}

interface ApiOrgNode {
  id: string;
  employeeCode: string;
  name: string;
  managerId?: string | null;
  managerName?: string | null;
  department: string;
  designation: string;
  location: string;
  status: string;
  reports?: ApiOrgNode[];
}

interface ApiOrgChart {
  employees: ApiOrgNode[];
  departmentTree: Array<{ department: string; count: number; employees: ApiOrgNode[] }>;
}

interface ApiInsurancePolicy {
  id: string;
  employeeId: string;
  provider: string;
  policyNumber: string;
  policyType: string;
  coverageAmount: string;
  premiumAmount: string;
  endDate: string;
  status: string;
  employee: { firstName: string; lastName: string };
  dependents: unknown[];
}

interface ApiInsuranceClaim {
  id: string;
  claimNumber?: string | null;
  claimType: string;
  claimAmount: string;
  claimDate: string;
  documentUrl?: string | null;
  status: string;
  employee: { firstName: string; lastName: string };
  insurance: { provider: string };
}

interface ApiInsuranceDependent {
  id: string;
  employeeId: string;
  insuranceId: string | null;
  fullName: string;
  relationship: string;
  dateOfBirth?: string | null;
  status: string;
  employee: { firstName: string; lastName: string };
  insurance?: { provider: string; policyNumber: string } | null;
}

interface ApiNotification {
  id: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
  user: {
    email: string;
    employee?: { firstName: string; lastName: string } | null;
  };
}

function time(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <tr>
      <td className="border-b border-[#dce2eb] p-4 text-sm text-muted" colSpan={columns}>{message}</td>
    </tr>
  );
}

export function EmployeesTable({ searchQuery = "", onSelectEmployee }: { searchQuery?: string; onSelectEmployee?: (id: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<any[]>("/employees")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((employee) => ({
            id: employee.employeeCode,
            realId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.designation?.title || "-",
            department: employee.department?.name || "-",
            location: employee.location?.name || "-",
            status: employee.status,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("employees", load);
  }, []);

  const filteredRows = rows.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={6} message="Loading employees from database..." /> : null}
      {loaded && !filteredRows.length ? <EmptyRow columns={6} message="No employees found." /> : null}
      {filteredRows.map((employee) => (
        <tr 
          key={employee.id} 
          onClick={() => onSelectEmployee?.(employee.realId)}
          className={onSelectEmployee ? "cursor-pointer hover:bg-slate-50 transition" : ""}
        >
          <td className="border-b border-[#dce2eb] p-3">{employee.id}</td>
          <td className="border-b border-[#dce2eb] p-3 font-semibold text-brand hover:underline">{employee.name}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.role}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.department}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.location}</td>
          <td className="border-b border-[#dce2eb] p-3"><StatusPill>{employee.status}</StatusPill></td>
        </tr>
      ))}
    </tbody>
  );
}

export function DocumentsTable() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiDocument[]>("/employees/documents")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((document) => ({
            id: document.id,
            employeeId: document.employeeId,
            employee: `${document.employee.firstName} ${document.employee.lastName}`,
            type: document.documentType,
            expires: document.expiresAt ? document.expiresAt.slice(0, 10) : "-",
            status: document.verificationStatus,
            fileUrl: document.fileUrl,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("documents", load);
  }, []);

  async function verify(employeeId: string, documentId: string) {
    await apiFetch(`/employees/${employeeId}/documents/${documentId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verifiedBy: "hr.admin@skylinx.local" }),
    });
    setMessage("Document verified.");
    requestDataRefresh("documents");
  }

  return (
    <>
      <tbody>
        {!loaded ? <EmptyRow columns={5} message="Loading documents from database..." /> : null}
        {loaded && !rows.length ? <EmptyRow columns={5} message="No employee documents found in database." /> : null}
        {rows.map((document) => (
          <tr key={document.id}>
            <td className="border-b border-[#dce2eb] p-3 font-semibold">{document.employee}</td>
            <td className="border-b border-[#dce2eb] p-3">{document.type}</td>
            <td className="border-b border-[#dce2eb] p-3">{document.expires}</td>
            <td className="border-b border-[#dce2eb] p-3">
              <a className="font-semibold text-brand" href={document.fileUrl} rel="noreferrer" target="_blank">Open</a>
            </td>
            <td className="border-b border-[#dce2eb] p-3">
              <div className="flex items-center gap-2">
                <StatusPill tone={document.status === "PENDING" || document.status === "Pending" ? "yellow" : "green"}>{document.status}</StatusPill>
                {document.status === "PENDING" || document.status === "Pending" ? (
                  <button className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white" onClick={() => verify(document.employeeId, document.id)}>Verify</button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      {message ? <caption className="caption-bottom p-3 text-left text-sm text-[#18865a]">{message}</caption> : null}
    </>
  );
}

interface ExpensesTableProps {
  mode?: "claims" | "approvals" | "receipts" | "reimbursement";
  search?: string;
  status?: string;
  month?: string;
}

export function ExpensesTable({
  mode = "claims",
  search = "",
  status = "All",
  month = "",
}: ExpensesTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiExpense[]>("/expenses")
      .then((body) => {
        if (!body.data) return;
        setRows(body.data);
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("expenses", load);
  }, []);

  async function decide(id: string, action: "manager-approve" | "hr-approve" | "reject" | "reimburse") {
    try {
      await apiFetch(`/expenses/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ decidedBy: "hr.admin@skylinx.local" }),
      });
      setMessage(`Expense ${action.replace("-", " ")} saved.`);
      requestDataRefresh("expenses");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = rows.filter((r) => {
    const empName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
    const category = (r.category || "").toLowerCase();
    const searchMatch =
      !search ||
      empName.includes(search.toLowerCase()) ||
      category.includes(search.toLowerCase());

    const dateMatch =
      !month ||
      (r.claimDate && r.claimDate.startsWith(month));

    if (mode === "approvals") {
      if (r.status !== "PENDING" && r.status !== "HOLD") return false;
    } else if (mode === "reimbursement") {
      if (r.status !== "APPROVED") return false;
    } else if (mode === "receipts") {
      if (!r.receiptUrl) return false;
    }

    if (mode === "claims" && status !== "All") {
      if (r.status.toLowerCase() !== status.toLowerCase()) return false;
    }

    return searchMatch && dateMatch;
  });

  function tone(status: string) {
    if (status === "REJECTED") return "red";
    if (status === "PENDING" || status === "HOLD") return "yellow";
    return "green";
  }

  return (
    <>
      <tbody>
        {!loaded ? <EmptyRow columns={6} message="Loading expenses from database..." /> : null}
        {loaded && !filtered.length ? <EmptyRow columns={6} message="No expense claims found in database." /> : null}
        {filtered.map((expense) => (
          <tr key={expense.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
            <td className="p-3 font-semibold text-[#172033]">
              {expense.employee?.firstName} {expense.employee?.lastName}
            </td>
            <td className="p-3 text-slate-650">{expense.category}</td>
            <td className="p-3 text-slate-650">{expense.claimDate.slice(0, 10)}</td>
            <td className="p-3 font-semibold text-[#172033]">
              INR {Number(expense.amount).toLocaleString("en-IN")}
            </td>
            <td className="p-3">
              {expense.receiptUrl ? (
                <a className="font-semibold text-brand hover:underline" href={expense.receiptUrl} rel="noreferrer" target="_blank">
                  Open
                </a>
              ) : "-"}
            </td>
            <td className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={tone(expense.status)}>{expense.status}</StatusPill>
                {mode === "approvals" && expense.status === "PENDING" ? (
                  <button className="rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand/90 transition shadow-sm" onClick={() => decide(expense.id, "manager-approve")}>
                    Approve (Manager)
                  </button>
                ) : null}
                {mode === "approvals" && expense.status === "HOLD" ? (
                  <button className="rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand/90 transition shadow-sm" onClick={() => decide(expense.id, "hr-approve")}>
                    Approve (HR)
                  </button>
                ) : null}
                {mode === "reimbursement" && expense.status === "APPROVED" ? (
                  <button className="rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand/90 transition shadow-sm" onClick={() => decide(expense.id, "reimburse")}>
                    Reimburse
                  </button>
                ) : null}
                {(mode === "approvals" || mode === "reimbursement") && expense.status !== "PAID" && expense.status !== "REJECTED" ? (
                  <button className="rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition" onClick={() => decide(expense.id, "reject")}>
                    Reject
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      {message ? <caption className="caption-bottom p-3 text-left text-sm text-[#18865a] bg-[#e6f5ef] rounded mt-2">{message}</caption> : null}
    </>
  );
}

export function HolidaysTable() {
  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiHoliday[]>("/holidays")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((holiday) => ({
            id: holiday.id,
            name: holiday.name,
            date: holiday.date.slice(0, 10),
            type: holiday.type,
            location: holiday.location?.name || "All Locations",
            status: holiday.status,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("holidays", load);
  }, []);

  async function setStatus(id: string, status: string) {
    await apiFetch(`/holidays/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setMessage(`Holiday marked ${status.toLowerCase()}.`);
    requestDataRefresh("holidays");
  }

  return (
    <>
      <tbody>
        {!loaded ? <EmptyRow columns={5} message="Loading holidays from database..." /> : null}
        {loaded && !rows.length ? <EmptyRow columns={5} message="No holidays found in database." /> : null}
        {rows.map((holiday) => (
          <tr key={holiday.id}>
            <td className="border-b border-[#dce2eb] p-3 font-semibold">{holiday.name}</td>
            <td className="border-b border-[#dce2eb] p-3">{holiday.date}</td>
            <td className="border-b border-[#dce2eb] p-3">{holiday.type}</td>
            <td className="border-b border-[#dce2eb] p-3">{holiday.location}</td>
            <td className="border-b border-[#dce2eb] p-3">
              <div className="flex items-center gap-2">
                <StatusPill tone={holiday.status === "ACTIVE" ? "green" : "red"}>{holiday.status}</StatusPill>
                {holiday.status === "ACTIVE" ? (
                  <button className="rounded-lg border border-[#dce2eb] px-3 py-1 text-xs font-semibold" onClick={() => setStatus(holiday.id, "INACTIVE")}>Disable</button>
                ) : (
                  <button className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white" onClick={() => setStatus(holiday.id, "ACTIVE")}>Enable</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      {message ? <caption className="caption-bottom p-3 text-left text-sm text-[#18865a]">{message}</caption> : null}
    </>
  );
}

export function OrganizationSummary() {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);

  function load() {
    apiFetch<ApiOrgChart>("/organization/chart")
      .then((body) => {
        if (!body.data) return;
        setDepartments(body.data.departmentTree.map((item) => ({ department: item.department, count: item.count })));
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
    return onDataRefresh("organization", load);
  }, []);

  return (
    <div className="mb-5 grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
      {departments.map((department) => (
        <div className="rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm" key={department.department}>
          <div className="text-xs uppercase text-muted">{department.department}</div>
          <div className="mt-2 text-2xl font-semibold">{department.count}</div>
          <div className="mt-1 text-xs text-[#18865a]">Employees mapped</div>
        </div>
      ))}
    </div>
  );
}

export function OrganizationTable({ search = "", status = "All" }: { search?: string; status?: string }) {
  const [rows, setRows] = useState<OrgEmployeeRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<ApiOrgChart>("/organization/chart")
      .then((body) => {
        if (!body.data) return;
        const reportCounts = new Map(body.data.employees.map((node) => [node.id, body.data!.employees.filter((candidate) => candidate.managerId === node.id).length]));
        setRows(
          body.data.employees.map((node) => ({
            id: node.id,
            employeeCode: node.employeeCode,
            name: node.name,
            managerId: node.managerId || null,
            managerName: node.managerName || null,
            department: node.department,
            designation: node.designation,
            location: node.location,
            status: node.status,
            reports: reportCounts.get(node.id) || 0,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("organization", load);
  }, []);

  const filteredRows = rows.filter((row) => {
    // 1. Status Filter
    if (status !== "All") {
      const s = status.toUpperCase();
      if (s === "PENDING" && row.status !== "PENDING") return false;
      if (s === "APPROVED" && row.status !== "ACTIVE" && row.status !== "APPROVED") return false;
      if (s === "REJECTED" && row.status !== "INACTIVE" && row.status !== "REJECTED") return false;
      if (s === "ACTIVE" && row.status !== "ACTIVE") return false;
    }

    // 2. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = row.name.toLowerCase().includes(q);
      const matchCode = row.employeeCode.toLowerCase().includes(q);
      const matchDept = row.department.toLowerCase().includes(q);
      const matchDesig = row.designation.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept && !matchDesig) return false;
    }

    return true;
  });

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={7} message="Loading organization chart from database..." /> : null}
      {loaded && !filteredRows.length ? <EmptyRow columns={7} message="No organization records found matching filters." /> : null}
      {filteredRows.map((employee) => (
        <tr key={employee.id}>
          <td className="border-b border-[#dce2eb] p-3">{employee.employeeCode}</td>
          <td className="border-b border-[#dce2eb] p-3 font-semibold">{employee.name}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.designation}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.department}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.managerName || "Leadership"}</td>
          <td className="border-b border-[#dce2eb] p-3">{employee.reports}</td>
          <td className="border-b border-[#dce2eb] p-3"><StatusPill>{employee.status}</StatusPill></td>
        </tr>
      ))}
    </tbody>
  );
}

interface InsurancePoliciesTableProps {
  search?: string;
}

export function InsurancePoliciesTable({ search = "" }: InsurancePoliciesTableProps) {
  const [rows, setRows] = useState<InsurancePolicyRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<ApiInsurancePolicy[]>("/insurance/policies")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((policy) => ({
            id: policy.id,
            employeeId: policy.employeeId,
            employee: `${policy.employee.firstName} ${policy.employee.lastName}`,
            provider: policy.provider,
            policyNumber: policy.policyNumber,
            policyType: policy.policyType,
            coverage: `INR ${Number(policy.coverageAmount).toLocaleString("en-IN")}`,
            premium: `INR ${Number(policy.premiumAmount).toLocaleString("en-IN")}`,
            validTill: policy.endDate.slice(0, 10),
            status: policy.status,
            dependents: policy.dependents.length,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("insurance", load);
  }, []);

  const filtered = rows.filter((policy) => {
    const empName = policy.employee.toLowerCase();
    const provider = policy.provider.toLowerCase();
    const policyNum = policy.policyNumber.toLowerCase();
    const policyType = policy.policyType.toLowerCase();

    return (
      !search ||
      empName.includes(search.toLowerCase()) ||
      provider.includes(search.toLowerCase()) ||
      policyNum.includes(search.toLowerCase()) ||
      policyType.includes(search.toLowerCase())
    );
  });

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={8} message="Loading insurance policies from database..." /> : null}
      {loaded && !filtered.length ? <EmptyRow columns={8} message="No insurance policies found in database." /> : null}
      {filtered.map((policy) => (
        <tr key={policy.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
          <td className="p-3 font-semibold text-[#172033]">{policy.employee}</td>
          <td className="p-3 text-slate-650">{policy.provider}</td>
          <td className="p-3 text-slate-650">{policy.policyNumber}</td>
          <td className="p-3 text-slate-650">{policy.policyType}</td>
          <td className="p-3 font-semibold text-[#172033]">{policy.coverage}</td>
          <td className="p-3 text-slate-650">{policy.validTill}</td>
          <td className="p-3 text-slate-650">{policy.dependents}</td>
          <td className="p-3">
            <StatusPill tone={policy.status === "ACTIVE" ? "green" : "red"}>{policy.status}</StatusPill>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

interface InsuranceDependentsTableProps {
  search?: string;
}

export function InsuranceDependentsTable({ search = "" }: InsuranceDependentsTableProps) {
  const [rows, setRows] = useState<ApiInsuranceDependent[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<ApiInsuranceDependent[]>("/insurance/dependents")
      .then((body) => {
        if (!body.data) return;
        setRows(body.data);
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("insurance", load);
  }, []);

  const filtered = rows.filter((r) => {
    const empName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
    const depName = (r.fullName || "").toLowerCase();
    const relation = (r.relationship || "").toLowerCase();
    const provider = (r.insurance?.provider || "").toLowerCase();
    const policyNo = (r.insurance?.policyNumber || "").toLowerCase();

    return (
      !search ||
      empName.includes(search.toLowerCase()) ||
      depName.includes(search.toLowerCase()) ||
      relation.includes(search.toLowerCase()) ||
      provider.includes(search.toLowerCase()) ||
      policyNo.includes(search.toLowerCase())
    );
  });

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={6} message="Loading dependents from database..." /> : null}
      {loaded && !filtered.length ? <EmptyRow columns={6} message="No dependents found in database." /> : null}
      {filtered.map((dep) => (
        <tr key={dep.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
          <td className="p-3 font-semibold text-[#172033]">
            {dep.employee?.firstName} {dep.employee?.lastName}
          </td>
          <td className="p-3 text-slate-650">
            {dep.insurance ? `${dep.insurance.provider} (${dep.insurance.policyNumber})` : "-"}
          </td>
          <td className="p-3 font-semibold text-[#172033]">{dep.fullName}</td>
          <td className="p-3 text-slate-650">{dep.relationship}</td>
          <td className="p-3 text-slate-650">
            {dep.dateOfBirth ? dep.dateOfBirth.slice(0, 10) : "-"}
          </td>
          <td className="p-3">
            <StatusPill tone={dep.status === "ACTIVE" ? "green" : "red"}>{dep.status}</StatusPill>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

interface InsuranceClaimsTableProps {
  search?: string;
  status?: string;
}

export function InsuranceClaimsTable({ search = "", status = "All" }: InsuranceClaimsTableProps) {
  const [rows, setRows] = useState<InsuranceClaimRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiInsuranceClaim[]>("/insurance/claims")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((claim) => ({
            id: claim.id,
            employee: `${claim.employee.firstName} ${claim.employee.lastName}`,
            provider: claim.insurance.provider,
            claimNumber: claim.claimNumber || "-",
            claimType: claim.claimType,
            amount: `INR ${Number(claim.claimAmount).toLocaleString("en-IN")}`,
            claimDate: claim.claimDate.slice(0, 10),
            status: claim.status,
            documentUrl: claim.documentUrl || "",
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("insurance", load);
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    try {
      await apiFetch(`/insurance/claims/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ decidedBy: "hr.admin@skylinx.local" }),
      });
      setMessage(`Insurance claim ${action}d successfully.`);
      requestDataRefresh("insurance");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = rows.filter((claim) => {
    const empName = claim.employee.toLowerCase();
    const provider = claim.provider.toLowerCase();
    const claimNum = claim.claimNumber.toLowerCase();
    const claimType = claim.claimType.toLowerCase();
    const searchMatch =
      !search ||
      empName.includes(search.toLowerCase()) ||
      provider.includes(search.toLowerCase()) ||
      claimNum.includes(search.toLowerCase()) ||
      claimType.includes(search.toLowerCase());

    const statusMatch =
      status === "All" ||
      claim.status.toLowerCase() === status.toLowerCase();

    return searchMatch && statusMatch;
  });

  return (
    <>
      <tbody>
        {!loaded ? <EmptyRow columns={8} message="Loading insurance claims from database..." /> : null}
        {loaded && !filtered.length ? <EmptyRow columns={8} message="No insurance claims found in database." /> : null}
        {filtered.map((claim) => (
          <tr key={claim.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
            <td className="p-3 font-semibold text-[#172033]">{claim.employee}</td>
            <td className="p-3 text-slate-650">{claim.provider}</td>
            <td className="p-3 text-slate-650">{claim.claimNumber}</td>
            <td className="p-3 text-slate-650">{claim.claimType}</td>
            <td className="p-3 font-semibold text-[#172033]">{claim.amount}</td>
            <td className="p-3 text-slate-650">{claim.claimDate}</td>
            <td className="p-3 text-slate-650">
              {claim.documentUrl ? <a className="font-semibold text-brand hover:underline" href={claim.documentUrl} rel="noreferrer" target="_blank">Open</a> : "-"}
            </td>
            <td className="p-3">
              <div className="flex items-center gap-2">
                <StatusPill tone={claim.status === "PENDING" ? "yellow" : claim.status === "REJECTED" ? "red" : "green"}>{claim.status}</StatusPill>
                {claim.status === "PENDING" ? (
                  <div className="flex gap-1.5 ml-2">
                    <button
                      className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                      onClick={() => decide(claim.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      onClick={() => decide(claim.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      {message ? <caption className="caption-bottom p-3 text-left text-sm text-[#18865a] bg-[#e6f5ef] rounded mt-2">{message}</caption> : null}
    </>
  );
}

export function NotificationsTable({
  activeTab = "Queue",
  search = "",
  status = "All",
}: {
  activeTab?: string;
  search?: string;
  status?: string;
}) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiNotification[]>("/notifications")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((notification) => ({
            id: notification.id,
            recipient: notification.user.employee ? `${notification.user.employee.firstName} ${notification.user.employee.lastName}` : notification.user.email,
            channel: notification.channel,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            createdAt: notification.createdAt.slice(0, 10),
            sentAt: notification.sentAt ? notification.sentAt.slice(0, 10) : "-",
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("notifications", load);
  }, []);

  async function markSent(id: string) {
    await apiFetch(`/notifications/${id}/sent`, { method: "PATCH" });
    setMessage("Notification marked sent.");
    requestDataRefresh("notifications");
  }

  function tone(status: string) {
    if (status === "FAILED") return "red";
    if (status === "PENDING") return "yellow";
    return "green";
  }

  const filteredRows = rows.filter((row) => {
    // 1. Channel Filter
    if (activeTab === "Email" && row.channel !== "EMAIL") return false;
    if (activeTab === "Push" && row.channel !== "PUSH" && row.channel !== "IN_APP") return false;

    // 2. Status Filter
    if (status !== "All") {
      const s = status.toUpperCase();
      if (s === "PENDING" && row.status !== "PENDING") return false;
      if (s === "APPROVED" && row.status !== "SENT" && row.status !== "ACTIVE") return false;
      if (s === "REJECTED" && row.status !== "FAILED") return false;
      if (s === "ACTIVE" && row.status !== "SENT" && row.status !== "ACTIVE") return false;
    }

    // 3. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRecipient = row.recipient.toLowerCase().includes(q);
      const matchTitle = row.title.toLowerCase().includes(q);
      const matchBody = row.body.toLowerCase().includes(q);
      const matchChannel = row.channel.toLowerCase().includes(q);
      if (!matchRecipient && !matchTitle && !matchBody && !matchChannel) return false;
    }

    return true;
  });

  return (
    <>
      <tbody>
        {!loaded ? <EmptyRow columns={6} message="Loading notifications from database..." /> : null}
        {loaded && !filteredRows.length ? <EmptyRow columns={6} message="No notifications found in database." /> : null}
        {filteredRows.map((notification) => (
          <tr key={notification.id}>
            <td className="border-b border-[#dce2eb] p-3 font-semibold">{notification.recipient}</td>
            <td className="border-b border-[#dce2eb] p-3">{notification.channel}</td>
            <td className="border-b border-[#dce2eb] p-3">
              <div className="font-semibold">{notification.title}</div>
              <div className="mt-1 max-w-[420px] text-xs text-muted">{notification.body}</div>
            </td>
            <td className="border-b border-[#dce2eb] p-3">{notification.createdAt}</td>
            <td className="border-b border-[#dce2eb] p-3">{notification.sentAt}</td>
            <td className="border-b border-[#dce2eb] p-3">
              <div className="flex items-center gap-2">
                <StatusPill tone={tone(notification.status)}>{notification.status}</StatusPill>
                {notification.status === "PENDING" ? (
                  <button className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white" onClick={() => markSent(notification.id)}>Mark Sent</button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      {message ? <caption className="caption-bottom p-3 text-left text-sm text-[#18865a]">{message}</caption> : null}
    </>
  );
}

export function AttendanceTable({ search = "", status = "All", month = "" }: { search?: string; status?: string; month?: string }) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<ApiAttendance[]>("/attendance/logs")
      .then((body) => {
        if (!body.data) return;
        setRows(
          body.data.map((log) => ({
            employee: `${log.employee.firstName} ${log.employee.lastName}`,
            date: log.date.slice(0, 10),
            checkIn: time(log.checkInAt),
            checkOut: time(log.checkOutAt),
            status: log.status,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("attendance", load);
  }, []);

  const filtered = rows.filter((r) => {
    const nameMatch = !search || r.employee.toLowerCase().includes(search.toLowerCase());
    const dateMatch = !month || r.date.startsWith(month);
    
    let statusMatch = true;
    if (status !== "All") {
      statusMatch = r.status.toLowerCase() === status.toLowerCase();
    }

    return nameMatch && dateMatch && statusMatch;
  });

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={5} message="Loading attendance logs from database..." /> : null}
      {loaded && !filtered.length ? <EmptyRow columns={5} message="No attendance logs found in database." /> : null}
      {filtered.map((row) => (
        <tr key={`${row.employee}-${row.date}`}>
          <td className="border-b border-[#dce2eb] p-3 font-semibold">{row.employee}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.date}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.checkIn}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.checkOut}</td>
          <td className="border-b border-[#dce2eb] p-3">
            <StatusPill tone={row.status === "ABSENT" || row.status === "Absent" ? "red" : row.status === "LATE" || row.status === "Late" ? "yellow" : "green"}>{row.status}</StatusPill>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function RegularizationsTable({ search = "", status = "All" }: { search?: string; status?: string }) {
  const [rows, setRows] = useState<ApiRegularization[]>([]);
  const [message, setMessage] = useState("");

  function load() {
    apiFetch<ApiRegularization[]>("/attendance/regularizations")
      .then((body) => setRows(body.data || []))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
    return onDataRefresh("attendance", load);
  }, []);

  async function approve(id: string) {
    await apiFetch(`/attendance/regularizations/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    setMessage("Regularization approved.");
    requestDataRefresh("attendance");
  }

  const filtered = rows.filter((r) => {
    const nameMatch = !search || `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(search.toLowerCase());
    
    let statusMatch = true;
    if (status !== "All") {
      statusMatch = r.status.toLowerCase() === status.toLowerCase();
    }

    return nameMatch && statusMatch;
  });

  if (!filtered.length && !rows.length) return null;

  return (
    <div className="mt-5 rounded-lg border border-[#dce2eb] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Regularization Requests</h2>
      {message ? <div className="mb-3 rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a]">{message}</div> : null}
      <div className="grid gap-3">
        {!filtered.length ? (
          <div className="text-sm text-muted p-2">No regularization requests match current filters.</div>
        ) : null}
        {filtered.map((row) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dce2eb] p-3" key={row.id}>
            <div>
              <div className="font-semibold">{row.employee.firstName} {row.employee.lastName}</div>
              <div className="text-sm text-muted">{row.reason} - {time(row.requestedCheckInAt)} to {time(row.requestedCheckOutAt)}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={row.status === "PENDING" ? "yellow" : "green"}>{row.status}</StatusPill>
              {row.status === "PENDING" ? <button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white" onClick={() => approve(row.id)}>Approve</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LeaveTableProps {
  mode?: "requests" | "balances";
  search?: string;
  status?: string;
  month?: string;
}

export function LeaveTable({
  mode = "requests",
  search = "",
  status = "All",
  month = "",
}: LeaveTableProps) {
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    setLoaded(false);
    Promise.all([
      apiFetch<any[]>("/leave/balances").then((body) => {
        if (body.data) setBalances(body.data);
      }),
      apiFetch<any[]>("/leave/requests").then((body) => {
        if (body.data) setRequests(body.data);
      }),
    ])
      .catch((err) => console.error("Error loading leave data", err))
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("leave", load);
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    try {
      await apiFetch(`/leave/requests/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      setMessage(`Leave request ${action}d successfully.`);
      requestDataRefresh("leave");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error("Failed to decide leave request", err);
    }
  }

  const filteredRequests = requests.filter((r) => {
    const empName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
    const leaveName = (r.leaveType?.name || "").toLowerCase();
    const searchMatch =
      !search ||
      empName.includes(search.toLowerCase()) ||
      leaveName.includes(search.toLowerCase());

    const statusMatch =
      status === "All" ||
      r.status.toLowerCase() === status.toLowerCase();

    const monthMatch =
      !month ||
      (r.fromDate && r.fromDate.startsWith(month));

    return searchMatch && statusMatch && monthMatch;
  });

  const filteredBalances = balances.filter((b) => {
    const empName = `${b.employee?.firstName || ""} ${b.employee?.lastName || ""}`.toLowerCase();
    const leaveName = (b.leaveType?.name || "").toLowerCase();
    const searchMatch =
      !search ||
      empName.includes(search.toLowerCase()) ||
      leaveName.includes(search.toLowerCase());

    return searchMatch;
  });

  return (
    <Card className="border border-[#e8edf4]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#172033]">
          {mode === "requests" ? "Leave Requests Roster" : "Employee Leave Balances"}
        </h2>
        {message ? <span className="text-xs font-semibold text-[#18865a] bg-[#e6f5ef] px-2.5 py-1 rounded">{message}</span> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm text-[#49637f]">
          <thead className="bg-[#f8fafc] text-xs uppercase font-bold text-slate-500 border-b">
            {mode === "requests" ? (
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Days</th>
                <th className="p-3">Status & Actions</th>
              </tr>
            ) : (
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Type</th>
                <th className="p-3">Year</th>
                <th className="p-3">Opening</th>
                <th className="p-3">Used</th>
                <th className="p-3">Available</th>
              </tr>
            )}
          </thead>
          {mode === "requests" ? (
            <tbody>
              {!loaded ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted text-xs font-semibold">Loading leave requests from database...</td>
                </tr>
              ) : null}
              {loaded && !filteredRequests.length ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted text-xs font-semibold">No leave requests found in database.</td>
                </tr>
              ) : null}
              {loaded && filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                  <td className="p-3 font-semibold text-[#172033]">
                    {request.employee?.firstName} {request.employee?.lastName}
                  </td>
                  <td className="p-3 font-medium">{request.leaveType?.name}</td>
                  <td className="p-3 font-medium">
                    {request.fromDate?.slice(0, 10)} to {request.toDate?.slice(0, 10)}
                  </td>
                  <td className="p-3 font-semibold">{Number(request.days)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={request.status === "PENDING" ? "yellow" : request.status === "REJECTED" ? "red" : "green"}>
                        {request.status}
                      </StatusPill>
                      {request.status === "PENDING" ? (
                        <div className="flex gap-1.5 ml-2">
                          <button
                            className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
                            onClick={() => decide(request.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            onClick={() => decide(request.id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              {!loaded ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted text-xs font-semibold">Loading leave balances from database...</td>
                </tr>
              ) : null}
              {loaded && !filteredBalances.length ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted text-xs font-semibold">No leave balances found in database.</td>
                </tr>
              ) : null}
              {loaded && filteredBalances.map((bal) => (
                <tr key={bal.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                  <td className="p-3 font-semibold text-[#172033]">
                    {bal.employee?.firstName} {bal.employee?.lastName}
                  </td>
                  <td className="p-3 font-medium">{bal.leaveType?.name}</td>
                  <td className="p-3 font-semibold">{bal.year}</td>
                  <td className="p-3 font-semibold">{Number(bal.openingBalance)}</td>
                  <td className="p-3 font-semibold">{Number(bal.used)}</td>
                  <td className="p-3 font-bold text-[#172033]">{Number(bal.available)}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </Card>
  );
}

export function PayrollTable() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    apiFetch<Array<{ id: string }>>("/payroll/runs")
      .then(async (runs) => {
        const firstRun = runs.data?.[0];
        if (!firstRun) return;
        const payslips = await apiFetch<{ items: ApiPayslip[] }>(`/payroll/runs/${firstRun.id}/payslips`);
        if (!payslips.data?.items) return;
        setRows(
          payslips.data.items.map((payslip) => ({
            employee: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
            month: "Current Run",
            gross: `INR ${Number(payslip.grossPay).toLocaleString("en-IN")}`,
            deductions: `INR ${Number(payslip.deductions).toLocaleString("en-IN")}`,
            net: `INR ${Number(payslip.netPay).toLocaleString("en-IN")}`,
            status: payslip.status,
          })),
        );
      })
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load();
    return onDataRefresh("payroll", load);
  }, []);

  return (
    <tbody>
      {!loaded ? <EmptyRow columns={6} message="Loading payslips from database..." /> : null}
      {loaded && !rows.length ? <EmptyRow columns={6} message="No payslips found in database." /> : null}
      {rows.map((row) => (
        <tr key={row.employee}>
          <td className="border-b border-[#dce2eb] p-3 font-semibold">{row.employee}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.month}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.gross}</td>
          <td className="border-b border-[#dce2eb] p-3">{row.deductions}</td>
          <td className="border-b border-[#dce2eb] p-3 font-semibold">{row.net}</td>
          <td className="border-b border-[#dce2eb] p-3"><StatusPill tone="yellow">{row.status}</StatusPill></td>
        </tr>
      ))}
    </tbody>
  );
}
