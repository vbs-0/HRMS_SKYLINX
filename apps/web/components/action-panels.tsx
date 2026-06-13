"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { useEmployeeOptions, useInsurancePolicyOptions, useLeaveTypeOptions, usePayrollRunOptions } from "../lib/options";
import { requestDataRefresh } from "../lib/refresh-events";
import { getCurrentCompanyId } from "../lib/session";

function Result({ message, error }: { message: string; error: string }) {
  if (!message && !error) return null;
  return (
    <div className={`rounded-lg p-3 text-sm ${error ? "bg-[#fde8e6] text-[#ba3d37]" : "bg-[#e6f5ef] text-[#18865a]"}`}>
      {error || message}
    </div>
  );
}

function inputClass() {
  return "min-h-10 rounded-lg border border-[#dce2eb] px-3 text-sm text-ink";
}

export function EmployeeCreatePanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    try {
      await apiFetch("/employees", {
        method: "POST",
        body: JSON.stringify({
          companyId: String(form.get("companyId")),
          employeeCode: String(form.get("employeeCode")),
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          joiningDate: String(form.get("joiningDate")),
        }),
      });
      setMessage("Employee created. Refresh the table to see the latest record.");
      requestDataRefresh("employees");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Employee creation failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <input className={inputClass()} name="companyId" defaultValue={getCurrentCompanyId()} placeholder="Company ID" />
      <input className={inputClass()} name="employeeCode" placeholder="Employee Code" required />
      <input className={inputClass()} name="firstName" placeholder="First Name" required />
      <input className={inputClass()} name="lastName" placeholder="Last Name" required />
      <input className={inputClass()} name="email" placeholder="Email" required type="email" />
      <input className={inputClass()} name="phone" placeholder="Phone" />
      <input className={inputClass()} name="joiningDate" required type="date" />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Add Employee</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function DocumentUploadPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const employees = useEmployeeOptions();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const formData = new FormData(currentForm);
    const employeeId = String(formData.get("employeeId"));
    const expiresAt = String(formData.get("expiresAt"));
    const documentType = String(formData.get("documentType"));
    const file = formData.get("file");

    if (!file || (file instanceof File && file.size === 0)) {
      setError("Please select a file to upload.");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);

    try {
      setMessage("Uploading document file...");
      const uploadRes = await apiFetch<{ fileUrl: string }>(`/employees/${employeeId}/documents/upload`, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.data?.fileUrl) {
        throw new Error("Failed to retrieve uploaded file URL.");
      }

      setMessage("Saving document metadata...");
      await apiFetch(`/employees/${employeeId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          documentType,
          fileUrl: uploadRes.data.fileUrl,
          expiresAt: expiresAt || undefined,
        }),
      });

      setMessage("Document submitted successfully.");
      requestDataRefresh("documents");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="employeeId" required>
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <select className={inputClass()} name="documentType" required>
        <option value="">Document type</option>
        <option value="Aadhaar">Aadhaar</option>
        <option value="PAN">PAN</option>
        <option value="Passport">Passport</option>
        <option value="Education Certificate">Education Certificate</option>
        <option value="Experience Letter">Experience Letter</option>
        <option value="Bank Proof">Bank Proof</option>
      </select>
      <input className={inputClass()} name="file" required type="file" />
      <input className={inputClass()} name="expiresAt" type="date" />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Add Document</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function ExpenseClaimPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [gradeLimit, setGradeLimit] = useState<number | null>(null);
  const employees = useEmployeeOptions();

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].value);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    function load() {
      if (!selectedEmployeeId) {
        setGradeLimit(null);
        return;
      }
      apiFetch<any>(`/employees/${selectedEmployeeId}`)
        .then((res) => {
          if (res.data?.grade) {
            setGradeLimit(Number(res.data.grade.maxExpenseLimit));
          } else {
            setGradeLimit(null);
          }
        })
        .catch(() => {
          setGradeLimit(null);
        });
    }

    load();

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ scope: string }>;
      if (custom.detail?.scope === "employees" || custom.detail?.scope === "all") {
        load();
      }
    };
    window.addEventListener("skylinx:data-refresh", handler);
    return () => window.removeEventListener("skylinx:data-refresh", handler);
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (gradeLimit !== null && amount !== "" && Number(amount) > gradeLimit) {
      setWarning(`Warning: Amount exceeds employee's grade maximum expense limit of ₹${gradeLimit}.`);
    } else {
      setWarning("");
    }
  }, [amount, gradeLimit]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);

    try {
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          employeeId: String(form.get("employeeId")),
          category: String(form.get("category")),
          amount: Number(form.get("amount")),
          receiptUrl: String(form.get("receiptUrl")) || undefined,
          claimDate: String(form.get("claimDate")),
        }),
      });
      setMessage("Expense claim submitted.");
      requestDataRefresh("expenses");
      setAmount("");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Expense claim failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select
        className={inputClass()}
        name="employeeId"
        required
        value={selectedEmployeeId}
        onChange={(e) => setSelectedEmployeeId(e.target.value)}
      >
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <select className={inputClass()} name="category" required>
        <option value="">Expense category</option>
        <option value="Travel">Travel</option>
        <option value="Meals">Meals</option>
        <option value="Fuel">Fuel</option>
        <option value="Client Visit">Client Visit</option>
        <option value="Office Supplies">Office Supplies</option>
      </select>
      <input
        className={inputClass()}
        name="amount"
        min="1"
        placeholder="Amount"
        required
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value !== "" ? Number(e.target.value) : "")}
      />
      <input className={inputClass()} name="claimDate" required type="date" />
      <input className={inputClass()} name="receiptUrl" placeholder="Receipt URL" type="url" />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Submit Claim</button>
      {warning && (
        <div className="col-span-full rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-semibold">
          {warning}
        </div>
      )}
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function HolidayCreatePanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);

    try {
      await apiFetch("/holidays", {
        method: "POST",
        body: JSON.stringify({
          companyId: getCurrentCompanyId(),
          name: String(form.get("name")),
          date: String(form.get("date")),
          type: String(form.get("type")),
        }),
      });
      setMessage("Holiday added to calendar.");
      requestDataRefresh("holidays");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Holiday creation failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <input className={inputClass()} name="name" placeholder="Holiday name" required />
      <input className={inputClass()} name="date" required type="date" />
      <select className={inputClass()} name="type" required>
        <option value="">Holiday type</option>
        <option value="MANDATORY">Mandatory</option>
        <option value="OPTIONAL">Optional</option>
        <option value="REGIONAL">Regional</option>
      </select>
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Add Holiday</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function ManagerMappingPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const employees = useEmployeeOptions();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const employeeId = String(form.get("employeeId"));
    const managerId = String(form.get("managerId"));

    try {
      await apiFetch(`/organization/employees/${employeeId}/manager`, {
        method: "PATCH",
        body: JSON.stringify({ managerId: managerId || undefined }),
      });
      setMessage("Manager mapping updated.");
      requestDataRefresh("organization");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manager mapping failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-[1fr_1fr_auto] gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="employeeId" required>
        <option value="">Select employee</option>
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <select className={inputClass()} name="managerId">
        <option value="">No manager</option>
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Map Manager</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function InsuranceActionPanel({ defaultAction = "policy" }: { defaultAction?: "policy" | "dependent" | "claim" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [action, setAction] = useState<"policy" | "dependent" | "claim">(defaultAction);
  const employees = useEmployeeOptions();
  const { options: policies, setOptions: setPolicies } = useInsurancePolicyOptions();

  useEffect(() => {
    setAction(defaultAction);
  }, [defaultAction]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);

    try {
      if (action === "policy") {
        const body = await apiFetch<{ id: string }>("/insurance/policies", {
          method: "POST",
          body: JSON.stringify({
            employeeId: String(form.get("employeeId")),
            provider: String(form.get("provider")),
            policyNumber: String(form.get("policyNumber")),
            policyType: String(form.get("policyType")),
            coverageAmount: Number(form.get("coverageAmount")),
            premiumAmount: Number(form.get("premiumAmount")),
            startDate: String(form.get("startDate")),
            endDate: String(form.get("endDate")),
          }),
        });
        setPolicyId(body.data?.id || "");
        if (body.data?.id) {
          setPolicies((current) => [
            { label: `${String(form.get("provider"))} - ${String(form.get("policyNumber"))}`, value: body.data!.id },
            ...current.filter((item) => item.value !== body.data!.id),
          ]);
        }
        setMessage("Insurance policy created.");
      }

      if (action === "dependent") {
        await apiFetch("/insurance/dependents", {
          method: "POST",
          body: JSON.stringify({
            employeeId: String(form.get("employeeId")),
            insuranceId: String(form.get("insuranceId")) || undefined,
            fullName: String(form.get("fullName")),
            relationship: String(form.get("relationship")),
            dateOfBirth: String(form.get("dateOfBirth")) || undefined,
          }),
        });
        setMessage("Dependent added.");
      }

      if (action === "claim") {
        await apiFetch("/insurance/claims", {
          method: "POST",
          body: JSON.stringify({
            employeeId: String(form.get("employeeId")),
            insuranceId: String(form.get("insuranceId")),
            claimNumber: String(form.get("claimNumber")) || undefined,
            claimType: String(form.get("claimType")),
            claimAmount: Number(form.get("claimAmount")),
            claimDate: String(form.get("claimDate")),
            documentUrl: String(form.get("documentUrl")) || undefined,
          }),
        });
        setMessage("Insurance claim submitted.");
      }

      requestDataRefresh("insurance");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Insurance action failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="action" value={action} onChange={(event) => setAction(event.target.value as any)} required>
        <option value="policy">Create Policy</option>
        <option value="dependent">Add Dependent</option>
        <option value="claim">Submit Claim</option>
      </select>
      <select className={inputClass()} name="employeeId" required>
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <select className={inputClass()} name="insuranceId" value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
        <option value="">Select policy for dependent/claim</option>
        {policies.map((policy) => <option key={policy.value} value={policy.value}>{policy.label}</option>)}
      </select>
      <input className={inputClass()} name="provider" defaultValue="" placeholder="Provider" />
      <input className={inputClass()} name="policyNumber" placeholder="Policy Number" />
      <input className={inputClass()} name="policyType" defaultValue="Group Mediclaim" placeholder="Policy Type" />
      <input className={inputClass()} name="coverageAmount" min="1" placeholder="Coverage Amount" type="number" />
      <input className={inputClass()} name="premiumAmount" min="0" placeholder="Premium Amount" type="number" />
      <input className={inputClass()} name="startDate" type="date" />
      <input className={inputClass()} name="endDate" type="date" />
      <input className={inputClass()} name="fullName" placeholder="Dependent Name" />
      <input className={inputClass()} name="relationship" placeholder="Relationship" />
      <input className={inputClass()} name="dateOfBirth" type="date" />
      <input className={inputClass()} name="claimNumber" placeholder="Claim Number" />
      <input className={inputClass()} name="claimType" placeholder="Claim Type" />
      <input className={inputClass()} name="claimAmount" min="1" placeholder="Claim Amount" type="number" />
      <input className={inputClass()} name="claimDate" type="date" />
      <input className={inputClass()} name="documentUrl" placeholder="Claim Document URL" type="url" />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Save Insurance</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function NotificationSendPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);

    try {
      await apiFetch("/notifications", {
        method: "POST",
        body: JSON.stringify({
          audience: String(form.get("audience")),
          channel: String(form.get("channel")),
          title: String(form.get("title")),
          body: String(form.get("body")),
        }),
      });
      setMessage("Notification queued.");
      requestDataRefresh("notifications");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notification failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="audience" required>
        <option value="ALL">All active users</option>
        <option value="HR">HR/Admin users</option>
      </select>
      <select className={inputClass()} name="channel" required>
        <option value="EMAIL">Email</option>
        <option value="WHATSAPP">WhatsApp</option>
        <option value="IN_APP">In App</option>
        <option value="PUSH">Push</option>
      </select>
      <input className={inputClass()} name="title" placeholder="Alert title" required />
      <input className={inputClass()} name="body" placeholder="Alert message" required />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Queue Alert</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function SocialPostPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);

    try {
      await apiFetch("/social/posts", {
        method: "POST",
        body: JSON.stringify({
          type: String(form.get("type")),
          title: String(form.get("title")) || undefined,
          body: String(form.get("body")),
          pinned: form.get("pinned") === "on",
        }),
      });
      setMessage("Post published.");
      requestDataRefresh("social");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post creation failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="type" required>
        <option value="ANNOUNCEMENT">Announcement</option>
        <option value="POST">Employee Post</option>
        <option value="BIRTHDAY">Birthday Wish</option>
        <option value="RECOGNITION">Recognition</option>
      </select>
      <input className={inputClass()} name="title" placeholder="Title" />
      <input className={inputClass()} name="body" placeholder="Message" required />
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#dce2eb] px-3 text-sm">
        <input name="pinned" type="checkbox" /> Pin
      </label>
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Publish</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function RewardsActionPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const employees = useEmployeeOptions();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    const action = String(form.get("action"));

    try {
      if (action === "recognition") {
        await apiFetch("/rewards/recognitions", {
          method: "POST",
          body: JSON.stringify({
            recipientEmployeeId: String(form.get("employeeId")),
            title: String(form.get("title")),
            message: String(form.get("message")),
            points: Number(form.get("points")) || 0,
          }),
        });
        setMessage("Recognition saved.");
      }
      if (action === "points") {
        await apiFetch("/rewards/points", {
          method: "POST",
          body: JSON.stringify({
            employeeId: String(form.get("employeeId")),
            points: Number(form.get("points")),
            reason: String(form.get("title")),
            source: "HR",
          }),
        });
        setMessage("Reward points awarded.");
      }
      if (action === "voucher") {
        await apiFetch("/rewards/vouchers", {
          method: "POST",
          body: JSON.stringify({
            code: String(form.get("code")),
            title: String(form.get("title")),
            provider: String(form.get("provider")),
            valueAmount: Number(form.get("valueAmount")),
            pointsCost: Number(form.get("pointsCost")),
          }),
        });
        setMessage("Voucher created.");
      }
      if (action === "benefit") {
        await apiFetch("/rewards/benefits", {
          method: "POST",
          body: JSON.stringify({
            title: String(form.get("title")),
            provider: String(form.get("provider")),
            category: String(form.get("category")),
            description: String(form.get("message")),
            pointsCost: Number(form.get("pointsCost")) || undefined,
          }),
        });
        setMessage("Benefit created.");
      }
      requestDataRefresh("rewards");
      currentForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewards action failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-4 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="action" required>
        <option value="recognition">Recognition</option>
        <option value="points">Award Points</option>
        <option value="voucher">Create Voucher</option>
        <option value="benefit">Create Benefit</option>
      </select>
      <select className={inputClass()} name="employeeId">
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <input className={inputClass()} name="title" placeholder="Title / Reason" />
      <input className={inputClass()} name="message" placeholder="Message / Description" />
      <input className={inputClass()} name="points" placeholder="Points" type="number" />
      <input className={inputClass()} name="code" placeholder="Voucher Code" />
      <input className={inputClass()} name="provider" placeholder="Provider" />
      <input className={inputClass()} name="category" placeholder="Category" />
      <input className={inputClass()} name="valueAmount" placeholder="Value Amount" type="number" />
      <input className={inputClass()} name="pointsCost" placeholder="Points Cost" type="number" />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Save Reward</button>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}



export function AttendanceActionPanel() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const employees = useEmployeeOptions();
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    if (employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].value);
    }
  }, [employees, employeeId]);

  async function action(path: string, employeeId: string) {
    if (!employeeId) return;
    setMessage("");
    setError("");
    try {
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ employeeId, shiftId: "shift_general" }),
      });
      setMessage(`${path.includes("check-in") ? "Check-in" : "Check-out"} saved.`);
      requestDataRefresh("attendance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attendance action failed");
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 max-md:grid-cols-1">
        <select className={inputClass()} id="attendance-employee-select" name="employeeId" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
          <option value="">Select employee</option>
          {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
        </select>
        <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white" onClick={() => action("/attendance/check-in", employeeId)}>
          Check In
        </button>
        <button className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold" onClick={() => action("/attendance/check-out", employeeId)}>
          Check Out
        </button>
      </div>
      <div className="mt-3"><Result message={message} error={error} /></div>
    </div>
  );
}

export function LeaveApplyPanel({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [days, setDays] = useState("1");
  const employees = useEmployeeOptions();
  const leaveTypes = useLeaveTypeOptions();

  // Auto-calculate days from the selected date range (inclusive)
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0) {
          setDays(String(diffDays));
        }
      }
    }
  }, [fromDate, toDate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    try {
      await apiFetch("/leave/requests", {
        method: "POST",
        body: JSON.stringify({
          employeeId: String(form.get("employeeId")),
          leaveTypeId: String(form.get("leaveTypeId")),
          fromDate: String(form.get("fromDate")),
          toDate: String(form.get("toDate")),
          days: Number(form.get("days")),
          reason: String(form.get("reason")),
        }),
      });
      setMessage("Leave request submitted.");
      requestDataRefresh("leave");
      currentForm.reset();
      setFromDate("");
      setToDate("");
      setDays("1");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leave request failed");
    }
  }

  return (
    <form className="mb-5 grid grid-cols-3 gap-3 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm max-lg:grid-cols-2 max-md:grid-cols-1" onSubmit={submit}>
      <select className={inputClass()} name="employeeId">
        {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
      </select>
      <select className={inputClass()} name="leaveTypeId" required>
        <option value="">Select leave type</option>
        {leaveTypes.map((leaveType) => <option key={leaveType.value} value={leaveType.value}>{leaveType.label}</option>)}
      </select>
      <input className={inputClass()} name="fromDate" required type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <input className={inputClass()} name="toDate" required type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <input className={inputClass()} name="days" min="0.5" required step="0.5" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
      <input className={inputClass()} name="reason" placeholder="Reason" required />
      <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">Apply Leave</button>
      <p className="col-span-full text-xs text-muted">Leave types and employees load automatically after login. Fallback options remain visible if the API is offline.</p>
      <div className="col-span-full"><Result message={message} error={error} /></div>
    </form>
  );
}

export function PayrollActionPanel() {
  const [runId, setRunId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { options: payrollRuns, setOptions: setPayrollRuns } = usePayrollRunOptions();

  async function createRun() {
    setMessage("");
    setError("");
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const body = await apiFetch<{ id: string }>("/payroll/runs", {
        method: "POST",
        body: JSON.stringify({ companyId: getCurrentCompanyId(), month, year }),
      });
      setRunId(body.data?.id || "");
      if (body.data?.id) {
        setPayrollRuns((current) => [{ label: `${month}/${year} - DRAFT`, value: body.data!.id }, ...current.filter((item) => item.value !== body.data!.id)]);
      }
      setMessage(`Payroll run ready for ${month}/${year}.`);
      requestDataRefresh("payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payroll run creation failed");
    }
  }

  async function runAction(path: string, success: string) {
    setMessage("");
    setError("");
    if (!runId) {
      setError("Enter or create a payroll run ID first.");
      return;
    }
    try {
      await apiFetch(`/payroll/runs/${runId}${path}`, { method: "POST" });
      setMessage(success);
      requestDataRefresh("payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payroll action failed");
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-[#dce2eb] bg-white p-4 shadow-sm" id="payroll-actions">
      <div className="grid grid-cols-[1fr_repeat(4,auto)] gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <select className={inputClass()} id="payroll-run-select" name="payrollRunId" value={runId} onChange={(event) => setRunId(event.target.value)}>
          <option value="">Select payroll run</option>
          {payrollRuns.map((run) => <option key={run.value} value={run.value}>{run.label}</option>)}
        </select>
        <button className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white" onClick={createRun}>Create Run</button>
        <button className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold" onClick={() => runAction("/calculate", "Payroll calculated.")}>Calculate</button>
        <button className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold" onClick={() => runAction("/lock", "Payroll locked.")}>Lock</button>
        <button className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-4 text-sm font-semibold" onClick={() => runAction("/bank-export", "Bank export generated.")}>Bank Export</button>
      </div>
      <div className="mt-3"><Result message={message} error={error} /></div>
    </div>
  );
}
