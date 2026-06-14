"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { Card, StatusPill } from "./ui";
import { Landmark, FileCheck2, FileSpreadsheet, Plus, Trash2, ArrowRight, ShieldCheck, Check, X, SlidersHorizontal } from "lucide-react";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface TaxDeclaration {
  id: string;
  employeeId: string;
  financialYear: string;
  regime: string;
  section80C: string;
  section80D: string;
  section24: string;
  section80E?: string;
  section80G?: string;
  section80TTA?: string;
  section80TTB?: string;
  section80CCD?: string;
  hra?: string;
  lta?: string;
  housePropertyLoss?: string;
  previousEmployerIncome?: string;
  reimbursements?: string;
  section80CBreakdown?: any;
  otherExemptions: string;
  status: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
}

interface ProofSubmission {
  id: string;
  employeeId: string;
  financialYear: string;
  sectionType: string;
  declaredAmount: string;
  actualAmount: string;
  fileUrl: string;
  status: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
}

interface BenefitClaim {
  id: string;
  employeeId: string;
  benefitName: string;
  claimAmount: string;
  claimDate: string;
  receiptUrl?: string | null;
  status: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
}

interface AdditionalSalary {
  id: string;
  employeeId: string;
  amount: string;
  type: string;
  name: string;
  date: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
}

// Indian financial year (Apr–Mar) for the current date
function currentFinancialYear() {
  const d = new Date();
  const y = d.getFullYear();
  return d.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function ComplianceDash() {
  const [activeTab, setActiveTab] = useState("Declarations");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Tax Declarations states
  const [decEmp, setDecEmp] = useState("");
  const [decYear, setDecYear] = useState(currentFinancialYear);
  const [decRegime, setDecRegime] = useState("NEW");
  const [dec80C, setDec80C] = useState("0");
  const [dec80CBreakdown, setDec80CBreakdown] = useState({ lic: 0, fd: 0, elss: 0, ulip: 0, epf: 0, ppf: 0, nsc: 0, homeLoanPrincipal: 0, pension80CCC: 0, tuitionFees: 0, sukanyaSamridhi: 0, nabard: 0, vpf: 0, other80C: 0 });
  const [dec80D, setDec80D] = useState("0");
  const [dec24, setDec24] = useState("0");
  const [dec80E, setDec80E] = useState("0");
  const [dec80G, setDec80G] = useState("0");
  const [dec80TTA, setDec80TTA] = useState("0");
  const [dec80TTB, setDec80TTB] = useState("0");
  const [dec80CCD, setDec80CCD] = useState("0");
  const [decHRA, setDecHRA] = useState("0");
  const [decLTA, setDecLTA] = useState("0");
  const [decHousePropertyLoss, setDecHousePropertyLoss] = useState("0");
  const [decPrevEmployerIncome, setDecPrevEmployerIncome] = useState("0");
  const [decReimbursements, setDecReimbursements] = useState("0");
  const [decOther, setDecOther] = useState("0");
  const [userDeclaration, setUserDeclaration] = useState<TaxDeclaration | null>(null);

  useEffect(() => {
    const total80C = Object.values(dec80CBreakdown).reduce((acc, val) => acc + (Number(val) || 0), 0);
    setDec80C(String(total80C));
  }, [dec80CBreakdown]);

  // Proof Submissions states
  const [proofEmp, setProofEmp] = useState("");
  const [proofYear, setProofYear] = useState(currentFinancialYear);
  const [proofSection, setProofSection] = useState("80C");
  const [proofDeclared, setProofDeclared] = useState("0");
  const [proofActual, setProofActual] = useState("0");
  const [proofFile, setProofFile] = useState("");
  const [proofs, setProofs] = useState<ProofSubmission[]>([]);

  // Flexible Benefits states
  const [benefitEmp, setBenefitEmp] = useState("");
  const [benefitName, setBenefitName] = useState("Medical Reimbursement");
  const [benefitMax, setBenefitMax] = useState("25000");
  const [claimName, setClaimName] = useState("Medical Reimbursement");
  const [claimAmount, setClaimAmount] = useState("0");
  const [claimDate, setClaimDate] = useState("");
  const [claimReceipt, setClaimReceipt] = useState("");
  const [claims, setClaims] = useState<BenefitClaim[]>([]);

  // Additional Salary states
  const [addEmp, setAddEmp] = useState("");
  const [addAmount, setAddAmount] = useState("0");
  const [addType, setAddType] = useState("ADDITION");
  const [addName, setAddName] = useState("Performance Bonus");
  const [addDate, setAddDate] = useState("");
  const [additions, setAdditions] = useState<AdditionalSalary[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
    return onDataRefresh("compliance", loadAll);
  }, [activeTab]);

  // Load employee tax declaration when employee is selected
  useEffect(() => {
    if (decEmp) {
      apiFetch<TaxDeclaration>(`/payroll/tax-declarations/${decEmp}`)
        .then((res) => {
          if (res.data) {
            setUserDeclaration(res.data);
            setDecYear(res.data.financialYear);
            setDecRegime(res.data.regime);
            setDec80C(String(res.data.section80C));
            if (res.data.section80CBreakdown) setDec80CBreakdown(res.data.section80CBreakdown);
            setDec80D(String(res.data.section80D));
            setDec24(String(res.data.section24));
            setDec80E(String(res.data.section80E || "0"));
            setDec80G(String(res.data.section80G || "0"));
            setDec80TTA(String(res.data.section80TTA || "0"));
            setDec80TTB(String(res.data.section80TTB || "0"));
            setDec80CCD(String(res.data.section80CCD || "0"));
            setDecHRA(String(res.data.hra || "0"));
            setDecLTA(String(res.data.lta || "0"));
            setDecHousePropertyLoss(String(res.data.housePropertyLoss || "0"));
            setDecPrevEmployerIncome(String(res.data.previousEmployerIncome || "0"));
            setDecReimbursements(String(res.data.reimbursements || "0"));
            setDecOther(String(res.data.otherExemptions));
          } else {
            setUserDeclaration(null);
          }
        })
        .catch(() => {
          setUserDeclaration(null);
        });
    } else {
      setUserDeclaration(null);
    }
  }, [decEmp]);

  function loadAll() {
    setLoading(true);
    // Fetch base lists
    apiFetch<EmployeeOption[]>("/employees").then((res) => {
      if (res.data) setEmployees(res.data);
    });

    if (activeTab === "Proofs") {
      apiFetch<ProofSubmission[]>("/payroll/tax-proofs").then((res) => {
        if (res.data) setProofs(res.data);
      });
    } else if (activeTab === "Benefits") {
      apiFetch<BenefitClaim[]>("/payroll/benefits/claims").then((res) => {
        if (res.data) setClaims(res.data);
      });
    } else if (activeTab === "Additional") {
      apiFetch<AdditionalSalary[]>("/payroll/additional-salary").then((res) => {
        if (res.data) setAdditions(res.data);
      });
    }
    setLoading(false);
  }

  // Tax Declaration Submit
  const handleDeclarationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!decEmp) throw new Error("Please select an employee");
      const res = await apiFetch<TaxDeclaration>("/payroll/tax-declarations", {
        method: "POST",
        body: JSON.stringify({
          employeeId: decEmp,
          financialYear: decYear,
          regime: decRegime,
          section80C: Number(dec80C),
          section80CBreakdown: dec80CBreakdown,
          section80D: Number(dec80D),
          section24: Number(dec24),
          section80E: Number(dec80E),
          section80G: Number(dec80G),
          section80TTA: Number(dec80TTA),
          section80TTB: Number(dec80TTB),
          section80CCD: Number(dec80CCD),
          hra: Number(decHRA),
          lta: Number(decLTA),
          housePropertyLoss: Number(decHousePropertyLoss),
          previousEmployerIncome: Number(decPrevEmployerIncome),
          reimbursements: Number(decReimbursements),
          otherExemptions: Number(decOther),
        }),
      });
      setMessage("Tax declaration saved successfully!");
      setUserDeclaration(res.data || null);
    } catch (err: any) {
      setError(err.message || "Failed to save declaration");
    }
  };

  // Proof Submission Submit
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!proofEmp || !proofFile) throw new Error("Please fill all required proof fields");
      await apiFetch("/payroll/tax-proofs", {
        method: "POST",
        body: JSON.stringify({
          employeeId: proofEmp,
          financialYear: proofYear,
          sectionType: proofSection,
          declaredAmount: Number(proofDeclared),
          actualAmount: Number(proofActual),
          fileUrl: proofFile,
        }),
      });
      setMessage("Tax exemption proof submitted for review.");
      setProofEmp("");
      setProofFile("");
      setProofDeclared("0");
      setProofActual("0");
      requestDataRefresh("compliance");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to submit proof");
    }
  };

  const handleDecideProof = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await apiFetch(`/payroll/tax-proofs/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`Tax proof submission marked ${status.toLowerCase()}.`);
      requestDataRefresh("compliance");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to process proof decision");
    }
  };

  // Flexible Benefit Limit submit
  const handleBenefitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!benefitEmp) throw new Error("Please select an employee");
      await apiFetch("/payroll/benefits/apply", {
        method: "POST",
        body: JSON.stringify({
          employeeId: benefitEmp,
          benefitName,
          annualMax: Number(benefitMax),
        }),
      });
      setMessage("Benefit allowance limit approved for employee.");
      setBenefitEmp("");
    } catch (err: any) {
      setError(err.message || "Failed to configure benefit limit");
    }
  };

  // Benefit Claim submit
  const handleBenefitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!benefitEmp || !claimAmount || !claimDate) throw new Error("Please select employee, amount and claim date");
      await apiFetch("/payroll/benefits/claim", {
        method: "POST",
        body: JSON.stringify({
          employeeId: benefitEmp,
          benefitName: claimName,
          claimAmount: Number(claimAmount),
          claimDate,
          receiptUrl: claimReceipt || undefined,
        }),
      });
      setMessage("Benefit claim submitted successfully!");
      setBenefitEmp("");
      setClaimAmount("0");
      setClaimDate("");
      setClaimReceipt("");
      requestDataRefresh("compliance");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Claim submission failed");
    }
  };

  const handleDecideClaim = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await apiFetch(`/payroll/benefits/claims/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`Flexible benefit claim marked ${status.toLowerCase()}.`);
      requestDataRefresh("compliance");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to process claim decision");
    }
  };

  // Additional Salary submit
  const handleAdditionalSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!addEmp || !addAmount || !addDate) throw new Error("Please select employee, amount and date");
      await apiFetch("/payroll/additional-salary", {
        method: "POST",
        body: JSON.stringify({
          employeeId: addEmp,
          amount: Number(addAmount),
          type: addType,
          name: addName,
          date: addDate,
        }),
      });
      setMessage("Additional salary entry created!");
      setAddEmp("");
      setAddAmount("0");
      setAddDate("");
      requestDataRefresh("compliance");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to create additional salary entry");
    }
  };

  return (
    <div className="grid gap-5 text-left">
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

      {/* SUB-TABS */}
      <div className="flex border-b border-slate-200 gap-4 mb-4">
        {[
          { label: "Tax Declarations", val: "Declarations" },
          { label: "Proof Submissions", val: "Proofs" },
          { label: "Flexible Benefits", val: "Benefits" },
          { label: "Additional Salary", val: "Additional" },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => {
              setActiveTab(tab.val);
              setMessage("");
              setError("");
            }}
            className={`pb-2.5 text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === tab.val ? "border-brand text-brand" : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAX DECLARATIONS TAB */}
      {activeTab === "Declarations" && (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          {/* Left: Input Declaration */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Landmark className="h-5 w-5 text-brand" /> Submit Annual Investment Declaration
            </h3>
            <form onSubmit={handleDeclarationSubmit} className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={decEmp}
                  onChange={(e) => setDecEmp(e.target.value)}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Financial Year</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={decYear}
                    onChange={(e) => setDecYear(e.target.value)}
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const yr = new Date().getFullYear() - 1 + i;
                      return <option key={yr} value={`${yr}-${yr + 1}`}>{yr}-{yr + 1}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tax Regime Choice</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={decRegime}
                    onChange={(e) => setDecRegime(e.target.value)}
                    required
                  >
                    <option value="NEW">New Tax Regime (Rebate up to 7L)</option>
                    <option value="OLD">Old Tax Regime (progressive)</option>
                  </select>
                </div>
              </div>

              {decRegime === "OLD" && (
                <div className="border-t pt-3 grid gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="font-semibold text-xs text-slate-400 uppercase tracking-wide">OLD regime exemptions (Declared limits)</div>
                  
                  <details className="group border border-slate-200 rounded-lg bg-slate-50">
                    <summary className="p-3 text-sm font-semibold cursor-pointer text-slate-700 hover:text-brand flex justify-between items-center">
                      <span>Section 80C — Investments (max ₹1,50,000)</span>
                      <span className="text-brand bg-brand-50 px-2 py-0.5 rounded text-xs">Total: ₹{dec80C}</span>
                    </summary>
                    <div className="p-3 pt-0 grid grid-cols-2 gap-3 bg-white border-t border-slate-200">
                      {[
                        { key: "lic", label: "LIC Premium" },
                        { key: "fd", label: "5-Year Fixed Deposit" },
                        { key: "elss", label: "ELSS / Mutual Funds" },
                        { key: "ulip", label: "ULIP" },
                        { key: "epf", label: "EPF (Auto-read)" },
                        { key: "ppf", label: "PPF" },
                        { key: "nsc", label: "NSC" },
                        { key: "homeLoanPrincipal", label: "Home Loan Principal" },
                        { key: "pension80CCC", label: "Pension Fund (80CCC)" },
                        { key: "tuitionFees", label: "Children's Tuition Fees" },
                        { key: "sukanyaSamridhi", label: "Sukanya Samridhi" },
                        { key: "nabard", label: "NABARD Rural Bonds" },
                        { key: "vpf", label: "VPF" },
                        { key: "other80C", label: "Other 80C Deductions" },
                      ].map(item => (
                        <div key={item.key}>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">{item.label}</label>
                          <input
                            className="min-h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            type="number"
                            readOnly={item.key === "epf"}
                            value={(dec80CBreakdown as any)[item.key]}
                            onChange={(e) => setDec80CBreakdown({...dec80CBreakdown, [item.key]: Number(e.target.value)})}
                          />
                        </div>
                      ))}
                    </div>
                  </details>

                  <div className="p-3 border border-slate-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Other Deductions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80D (Medical)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80D} onChange={e=>setDec80D(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80E (Edu Loan Int)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80E} onChange={e=>setDec80E(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80G (Donations)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80G} onChange={e=>setDec80G(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80TTA (Savings Int)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80TTA} onChange={e=>setDec80TTA(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80TTB (Senior Int)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80TTB} onChange={e=>setDec80TTB(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">80CCD(1B) (NPS)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec80CCD} onChange={e=>setDec80CCD(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Sec 24(b) (Home Int)</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={dec24} onChange={e=>setDec24(e.target.value)}/></div>
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Exemptions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">HRA</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={decHRA} onChange={e=>setDecHRA(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">LTA</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={decLTA} onChange={e=>setDecLTA(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">House Property Loss</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={decHousePropertyLoss} onChange={e=>setDecHousePropertyLoss(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Prev Employer Income</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={decPrevEmployerIncome} onChange={e=>setDecPrevEmployerIncome(e.target.value)}/></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Reimbursements</label><input className="w-full rounded border px-3 py-2 text-sm" type="number" value={decReimbursements} onChange={e=>setDecReimbursements(e.target.value)}/></div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm font-semibold bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 flex justify-between">
                    <span>Estimated Tax Saving (approx 30%)</span>
                    <span>₹{Math.round((Math.min(150000, Number(dec80C)) + Number(dec80D) + Number(dec24) + Number(dec80E) + Number(dec80G) + Number(dec80TTA) + Number(dec80TTB) + Number(dec80CCD) + Number(decHRA) + Number(decLTA) + Number(decHousePropertyLoss) + Number(decReimbursements) + Number(decOther)) * 0.3).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-2"
                type="submit"
              >
                Save Declaration
              </button>
            </form>
          </Card>

          {/* Right: Saved Declaration Details View */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <FileCheck2 className="h-5 w-5 text-brand" /> Current Active Declaration
            </h3>
            {userDeclaration ? (
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 font-semibold">Regime Scheme</span>
                  <span className="font-bold text-brand uppercase tracking-wide">{userDeclaration.regime} Regime</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 font-semibold">Financial Year</span>
                  <span className="font-semibold text-slate-800">{userDeclaration.financialYear}</span>
                </div>
                {userDeclaration.regime === "OLD" ? (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Section 80C</span>
                      <span className="font-semibold text-slate-800">INR {Number(userDeclaration.section80C).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Section 80D</span>
                      <span className="font-semibold text-slate-800">INR {Number(userDeclaration.section80D).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Section 24 (Housing)</span>
                      <span className="font-semibold text-slate-800">INR {Number(userDeclaration.section24).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Other Exemptions</span>
                      <span className="font-semibold text-slate-800">INR {Number(userDeclaration.otherExemptions).toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded bg-slate-50 p-3 text-xs text-slate-400 leading-relaxed mt-2">
                    Under the NEW Tax Regime, standard deductions are set to ₹75,000, and standard rebate policies under Section 87A are auto-applied. Extra exemptions under 80C, 80D, and 24 are not deductible.
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Status</span>
                  <StatusPill tone="green">{userDeclaration.status}</StatusPill>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border border-dashed rounded-lg text-center">
                <SlidersHorizontal className="h-10 w-10 text-slate-200 mb-2" />
                <div className="text-xs font-semibold">No declaration found. Select an employee to inspect.</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* PROOF SUBMISSIONS TAB */}
      {activeTab === "Proofs" && (
        <div className="grid grid-cols-[320px_1fr] gap-6 max-xl:grid-cols-1">
          {/* Left Form */}
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Landmark className="h-5 w-5 text-brand" /> Submit Tax Proof
            </h3>
            <form onSubmit={handleProofSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={proofEmp}
                  onChange={(e) => setProofEmp(e.target.value)}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    value={proofYear}
                    onChange={(e) => setProofYear(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Exempt Type</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={proofSection}
                    onChange={(e) => setProofSection(e.target.value)}
                    required
                  >
                    <option value="80C">80C (PPF/LIC)</option>
                    <option value="80D">80D (Medical)</option>
                    <option value="24">Section 24 (Home)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Declared</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={proofDeclared}
                    onChange={(e) => setProofDeclared(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Actual</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={proofActual}
                    onChange={(e) => setProofActual(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">File URL Proof</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="https://proof-links.com/file.pdf"
                  value={proofFile}
                  onChange={(e) => setProofFile(e.target.value)}
                  required
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-2"
                type="submit"
              >
                Submit Proof Document
              </button>
            </form>
          </Card>

          {/* Right Table */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3">
              Tax Exemption Proof Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">FY / Type</th>
                    <th className="p-3">Amounts (Declared/Actual)</th>
                    <th className="p-3">Attachment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {proofs.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {p.employee?.firstName} {p.employee?.lastName}
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.financialYear} / <span className="font-bold text-brand">{p.sectionType}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-slate-400">Dec: INR {Number(p.declaredAmount).toLocaleString("en-IN")}</div>
                        <div className="font-semibold text-slate-800">Act: INR {Number(p.actualAmount).toLocaleString("en-IN")}</div>
                      </td>
                      <td className="p-3">
                        <a className="font-bold text-brand hover:underline" href={p.fileUrl} rel="noreferrer" target="_blank">
                          Open File
                        </a>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={p.status === "PENDING" ? "yellow" : p.status === "REJECTED" ? "red" : "green"}>
                            {p.status}
                          </StatusPill>
                          {p.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecideProof(p.id, "APPROVED")}
                                className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDecideProof(p.id, "REJECTED")}
                                className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {proofs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-xs text-muted text-center">
                        No tax exemption proof files uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* FLEXIBLE BENEFITS TAB */}
      {activeTab === "Benefits" && (
        <div className="grid grid-cols-[320px_1fr] gap-6 max-xl:grid-cols-1">
          {/* Left forms */}
          <div className="grid gap-5 h-fit">
            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <ShieldCheck className="h-5 w-5 text-brand" /> Approve Benefit Limit
              </h3>
              <form onSubmit={handleBenefitApply} className="grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={benefitEmp}
                    onChange={(e) => setBenefitEmp(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Benefit Head</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={benefitName}
                    onChange={(e) => setBenefitName(e.target.value)}
                    required
                  >
                    <option value="Medical Reimbursement">Medical Reimbursement</option>
                    <option value="Leave Travel Allowance">Leave Travel Allowance (LTA)</option>
                    <option value="Car Maintenance">Car Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Annual Max limit</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={benefitMax}
                    onChange={(e) => setBenefitMax(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                  type="submit"
                >
                  Configure Limit
                </button>
              </form>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
                <Plus className="h-5 w-5 text-brand" /> Claim Flexible Benefit
              </h3>
              <form onSubmit={handleBenefitClaim} className="grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={benefitEmp}
                    onChange={(e) => setBenefitEmp(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Benefit Category</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    required
                  >
                    <option value="Medical Reimbursement">Medical Reimbursement</option>
                    <option value="Leave Travel Allowance">Leave Travel Allowance (LTA)</option>
                    <option value="Car Maintenance">Car Maintenance</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Claim Amount</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Claim Date</label>
                    <input
                      className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Receipt URL Attachment</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    placeholder="https://proof-links.com/receipt.jpg"
                    value={claimReceipt}
                    onChange={(e) => setClaimReceipt(e.target.value)}
                  />
                </div>
                <button
                  className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                  type="submit"
                >
                  Submit Benefit Claim
                </button>
              </form>
            </Card>
          </div>

          {/* Right Table */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3">
              Flexible Benefit Claims Queue
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Claim Date / Category</th>
                    <th className="p-3">Claim Amount</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {c.employee?.firstName} {c.employee?.lastName}
                      </td>
                      <td className="p-3 text-slate-600">
                        {c.claimDate?.slice(0, 10)} / <span className="font-bold text-brand">{c.benefitName}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        INR {Number(c.claimAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        {c.receiptUrl ? (
                          <a className="font-bold text-brand hover:underline" href={c.receiptUrl} rel="noreferrer" target="_blank">
                            Open
                          </a>
                        ) : "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <StatusPill tone={c.status === "PENDING" ? "yellow" : c.status === "REJECTED" ? "red" : "green"}>
                            {c.status}
                          </StatusPill>
                          {c.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDecideClaim(c.id, "APPROVED")}
                                className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDecideClaim(c.id, "REJECTED")}
                                className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-xs text-muted text-center">
                        No benefit reimbursement claims found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ADDITIONAL SALARY TAB */}
      {activeTab === "Additional" && (
        <div className="grid grid-cols-[320px_1fr] gap-6 max-xl:grid-cols-1">
          {/* Left Form */}
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Landmark className="h-5 w-5 text-brand" /> Additional Salary Adjustment
            </h3>
            <form onSubmit={handleAdditionalSalarySubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={addEmp}
                  onChange={(e) => setAddEmp(e.target.value)}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                  <select
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    required
                  >
                    <option value="ADDITION">Addition (Bonus)</option>
                    <option value="DEDUCTION">Deduction (Recovery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description / Name</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="e.g. Performance Bonus, Laptop Fine"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Effective Date</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-xs"
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-2"
                type="submit"
              >
                Apply Salary Adjustment
              </button>
            </form>
          </Card>

          {/* Right Table */}
          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3">
              Active Additional Salary Adjustment Records
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-sm text-left">
                <thead className="bg-[var(--surface-sunken)] text-xs uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Adjustment Type</th>
                    <th className="p-3">Adjustment Details</th>
                    <th className="p-3">Effective Date</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {additions.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800">
                        {a.employee?.firstName} {a.employee?.lastName}
                      </td>
                      <td className="p-3">
                        <StatusPill tone={a.type === "ADDITION" ? "green" : "red"}>{a.type}</StatusPill>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{a.name}</td>
                      <td className="p-3 text-slate-650">{a.date?.slice(0, 10)}</td>
                      <td className="p-3 font-bold text-slate-800">
                        INR {Number(a.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {additions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-xs text-muted text-center">
                        No additional salary adjustments configured for this cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
