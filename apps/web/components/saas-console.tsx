"use client";

import { Check, CreditCard, Download, Layers3, Printer, RefreshCcw, ReceiptText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackSaas } from "../lib/fallback-data";
import { emptySaas } from "../lib/live-data";
import { isPlanName } from "../lib/plan-access";
import { Card, MetricCard, StatusPill } from "./ui";

type SaasData = typeof fallbackSaas;
type Plan = SaasData["plans"][number];
type PlanMatrixRow = SaasData["planMatrix"][number];
type PlanAddOn = SaasData["planAddOns"][number];
type Entitlement = SaasData["entitlements"][number];
interface BillingEvent {
  id: string;
  action: string;
  status: string;
  amount: number;
  createdAt: string;
}
interface PaymentReceipt {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  plan: string;
  status: string;
}

function money(value: number) {
  return `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;
}

function displayPlanName(planName: string) {
  if (planName === "Basic") return "Free Forever";
  if (planName === "Standard") return "Professional";
  if (planName === "Pro") return "Enterprise";
  return planName;
}

function planColumnTitle(planName: string) {
  return `${displayPlanName(planName)} (${planName})`;
}

function displayAccessValue(value: string) {
  return value.replace(/INR\s*/g, "\u20B9").replace(/\?(?=\d)/g, "\u20B9");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function currentCookiePlan() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )peopleos_plan=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function writePlanCookie(planName: string) {
  document.cookie = `peopleos_plan=${encodeURIComponent(planName)}; path=/; max-age=31536000; SameSite=Lax`;
}

function billingSummaryForPlan(plan: Plan, current: SaasData["billingSummary"], employees?: number, years = 1, selectedAddOnKeys: string[] = [], couponKey = "none", quoteCoupons: { key: string; label: string; discountPercent: number }[] = [{ key: "none", label: "No Coupons", discountPercent: 0 }], quoteAddOns: { key: string; label: string; monthlyPrice: number }[] = []): SaasData["billingSummary"] {
  const billingEmployees = Math.max(1, Math.floor(employees || current.employees || 5));
  const billingYears = Math.max(1, Math.floor(years || 1));
  const extraEmployees = Math.max(0, billingEmployees - plan.employees);
  const additionalEmployeePrice = extraEmployees * plan.additionalEmployeePrice;
  const addOnMonthlyPrice = quoteAddOns
    .filter((addOn) => selectedAddOnKeys.includes(addOn.key))
    .reduce((total, addOn) => total + addOn.monthlyPrice, current.addOnMonthlyPrice || 0);
  const monthlyTotal = plan.monthlyPrice + additionalEmployeePrice + addOnMonthlyPrice;
  const itemTotal = monthlyTotal * 12 * billingYears;
  const coupon = quoteCoupons.find((item) => item.key === couponKey) || quoteCoupons[0] || { key: "none", label: "No Coupons", discountPercent: 0 };
  const discountAmount = Number(((itemTotal * coupon.discountPercent) / 100).toFixed(2));
  const discountPrice = Number(Math.max(0, itemTotal - discountAmount).toFixed(2));
  const gst = Number((discountPrice * 0.18).toFixed(2));

  return {
    ...current,
    plan: plan.name,
    duration: `${billingYears} Year${billingYears > 1 ? "s" : ""}`,
    employees: billingEmployees,
    basePlan: plan.monthlyPrice,
    additionalEmployeePrice,
    addOnMonthlyPrice,
    itemTotal,
    discountPrice,
    gst,
    grandTotal: Number((discountPrice + gst).toFixed(2)),
  };
}

function AccessValue({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const label = displayAccessValue(value);
  if (lower.includes("not included")) {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-[#ba3d37]" title="Not included">
        <X className="h-4 w-4" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  if (lower === "included") {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-[#078ced]" title="Included">
        <Check className="h-5 w-5" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (lower.includes("unlimited")) return <span className="font-bold text-[#111827]">{label}</span>;
  return <span className="font-semibold text-[#34465f]">{label}</span>;
}

export function SaasConsole() {
  const [data, setData] = useState<SaasData>(emptySaas);
  const [message, setMessage] = useState("");
  const [quoteEmployees, setQuoteEmployees] = useState(5);
  const [quoteYears, setQuoteYears] = useState(1);
  const [selectedQuoteAddOns, setSelectedQuoteAddOns] = useState<string[]>([]);
  const [selectedCouponKey, setSelectedCouponKey] = useState("none");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Bank Transfer");
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(null);
  const [quoteCoupons, setQuoteCoupons] = useState<{ key: string; label: string; discountPercent: number }[]>([{ key: "none", label: "No Coupons", discountPercent: 0 }]);
  const [quoteAddOns, setQuoteAddOns] = useState<{ key: string; label: string; monthlyPrice: number }[]>([]);
  const [supportEmail, setSupportEmail] = useState("support@example.com");

  function load() {
    apiFetch<SaasData>("/saas")
      .then((body) => {
        if (body.data) {
          setData(body.data);
          setQuoteEmployees(body.data.billingSummary.employees || body.data.activeEmployees || body.data.employeeLimit || 5);
          const durationMatch = String(body.data.billingSummary.duration || "1").match(/\d+/);
          setQuoteYears(durationMatch ? Number(durationMatch[0]) : 1);
          if (isPlanName(body.data.activePlan) && currentCookiePlan() !== body.data.activePlan) {
            writePlanCookie(body.data.activePlan);
          }
        }
      })
      .catch(() => undefined);

    apiFetch<{ coupons: any[], quoteAddOns: any[], supportEmail: string }>("/saas/coupons")
      .then((body) => {
        if (body.data) {
          if (Array.isArray(body.data.coupons) && body.data.coupons.length > 0) {
            // settings store { code, discountPercent }; UI expects { key, label, discountPercent }
            setQuoteCoupons(
              body.data.coupons.map((c: any) => ({
                key: c.key ?? c.code,
                label:
                  c.label ?? (c.code === "none" || !c.discountPercent ? "No Coupons" : `${c.code} — ${c.discountPercent}% off`),
                discountPercent: Number(c.discountPercent) || 0,
              })),
            );
          }
          if (Array.isArray(body.data.quoteAddOns) && body.data.quoteAddOns.length > 0) {
            setQuoteAddOns(body.data.quoteAddOns);
          }
          if (body.data.supportEmail) {
            setSupportEmail(body.data.supportEmail);
          }
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function run(path: string, label: string) {
    await apiFetch(path, { method: "POST" });
    setMessage(`${label} completed.`);
    load();
  }

  async function selectPlan(planName: string) {
    if (!isPlanName(planName)) return;

    if (planName === "Basic") {
      try {
        await apiFetch("/saas/select-plan", {
          method: "POST",
          body: JSON.stringify({ plan: planName }),
        });
        writePlanCookie(planName);
        setMessage("Switched to Basic plan successfully.");
        window.setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error("Select basic plan failed:", err);
        setMessage("Failed to switch plan. Please try again.");
      }
    } else {
      setData((current) => ({
        ...current,
        billingSummary: {
          ...current.billingSummary,
          plan: planName,
        },
      }));
      setMessage(`Upgrade to ${displayPlanName(planName)} selected. Please complete payment details below to purchase and activate the plan.`);
      
      const summaryEl = document.getElementById("billing-duration");
      if (summaryEl) {
        summaryEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  const quotedPlan = data.plans.find((plan) => plan.name === data.billingSummary.plan) || data.plans.find((plan) => plan.status === "ACTIVE") || data.plans[0];
  const quotedBillingSummary = quotedPlan ? billingSummaryForPlan(quotedPlan, data.billingSummary, quoteEmployees, quoteYears, selectedQuoteAddOns, selectedCouponKey, quoteCoupons, quoteAddOns) : data.billingSummary;
  const selectedAddOnNames = quoteAddOns.filter((addOn) => selectedQuoteAddOns.includes(addOn.key)).map((addOn) => addOn.label);
  const selectedCoupon = quoteCoupons.find((coupon) => coupon.key === selectedCouponKey) || quoteCoupons[0] || { key: "none", label: "No Coupons", discountPercent: 0 };
  const couponDiscountAmount = Number((quotedBillingSummary.itemTotal - quotedBillingSummary.discountPrice).toFixed(2));
  const invoiceNumber = `SKY-HRMS-${quotedBillingSummary.plan.toUpperCase()}-${quoteYears}Y-${quoteEmployees}E`;
  const billedToName = data.companies[0]?.name || "Client Company";
  const billedToLegalName = data.companies[0]?.legalName || "Legal entity pending";

  function downloadQuote() {
    const addOnLine = selectedAddOnNames.length
      ? `<tr><td>Selected add-ons</td><td>${selectedAddOnNames.length}</td><td>${escapeHtml(selectedAddOnNames.join(", "))}</td><td>${money(quotedBillingSummary.addOnMonthlyPrice * 12 * quoteYears)}</td></tr>`
      : "";
    const planEmployeeLimit = quotedPlan?.employees || 25;
    const extraEmployeeLine = quotedBillingSummary.additionalEmployeePrice
      ? `<tr><td>Additional employees above ${planEmployeeLimit}</td><td>${Math.max(0, quoteEmployees - planEmployeeLimit)} users</td><td>${money(quotedPlan?.additionalEmployeePrice || 0)}/user/month</td><td>${money(quotedBillingSummary.additionalEmployeePrice * 12 * quoteYears)}</td></tr>`
      : "";
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoiceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #172033; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #dce2eb; padding-bottom: 20px; }
    h1 { margin: 0; font-size: 24px; }
    .muted { color: #667892; font-size: 13px; }
    .box { border: 1px solid #dce2eb; border-radius: 8px; padding: 14px; margin-top: 18px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 14px; }
    th, td { border-bottom: 1px solid #dce2eb; padding: 12px; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    .total { background: #f8fafc; font-weight: 700; font-size: 16px; }
  </style>
</head>
<body>
  <div class="top">
    <div>
      <h1>SKYLINX PeopleOS Quote</h1>
      <div class="muted">Invoice No. ${escapeHtml(invoiceNumber)}</div>
    </div>
    <div>
      <strong>Draft Quote</strong><br />
      <span class="muted">Duration: ${escapeHtml(quotedBillingSummary.duration)} | GST: 18%</span>
    </div>
  </div>
  <div class="box">
    <strong>Billed From</strong><br />
    Acme Corp<br />
    SKYLINX PeopleOS HRMS<br />
    ${escapeHtml(supportEmail)} | +1-800-555-0199
  </div>
  <div class="box">
    <strong>Billed To</strong><br />
    ${escapeHtml(billedToName)}<br />
    ${escapeHtml(billedToLegalName)}<br />
    Plan: ${escapeHtml(displayPlanName(quotedBillingSummary.plan))} | Users: ${quoteEmployees}
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>${escapeHtml(displayPlanName(quotedBillingSummary.plan))} base plan</td><td>${quoteYears} year</td><td>${money(quotedBillingSummary.basePlan)}/month</td><td>${money(quotedBillingSummary.basePlan * 12 * quoteYears)}</td></tr>
      ${extraEmployeeLine}
      ${addOnLine}
      <tr><td colspan="3">Item total</td><td>${money(quotedBillingSummary.itemTotal)}</td></tr>
      <tr><td colspan="3">Coupon discount (${escapeHtml(selectedCoupon.label)})</td><td>-${money(couponDiscountAmount)}</td></tr>
      <tr><td colspan="3">GST (18%)</td><td>${money(quotedBillingSummary.gst)}</td></tr>
      <tr class="total"><td colspan="3">Grand total</td><td>${money(quotedBillingSummary.grandTotal)}</td></tr>
    </tbody>
  </table>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function confirmPayment() {
    try {
      const planName = quotedBillingSummary.plan;
      const amount = quotedBillingSummary.grandTotal;

      setMessage(`Processing payment of ${money(amount)} via ${paymentMethod}...`);

      const res = await apiFetch<any>("/saas/select-plan", {
        method: "POST",
        body: JSON.stringify({
          plan: planName,
          paymentMethod: paymentMethod,
          amount: amount,
        }),
      });

      if (res.data) {
        const receipt: PaymentReceipt = {
          id: `SKY-PAY-${Date.now().toString().slice(-8)}`,
          amount: amount,
          method: paymentMethod,
          paidAt: new Date().toISOString(),
          plan: displayPlanName(planName),
          status: "COMPLETED",
        };
        setPaymentReceipt(receipt);
        writePlanCookie(planName);
        setMessage(`Payment successful! ${displayPlanName(planName)} plan is now active. Reloading access controls...`);
        
        window.setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error("Payment failed:", err);
      setMessage(err instanceof Error ? err.message : "Payment processing failed. Please try again.");
    }
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="rounded-lg bg-[#e6f5ef] p-3 text-sm text-[#18865a]">{message}</div> : null}
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Tenants" value={`${data.activeTenants}/${data.tenants}`} note="Multi-company readiness" />
        <MetricCard label="Active Plan" value={data.activePlan} note={money(data.monthlyPrice)} />
        <MetricCard label="Employee Usage" value={`${data.activeEmployees}/${data.employeeLimit}`} note={`${data.usagePercent}% license usage`} />
        <MetricCard label="Modules Enabled" value={String(data.enabledModules)} note="Entitlement controls" />
      </div>

      <Card className="p-0">
        <div className="border-b-2 border-[#078ced]">
          <div className="inline-flex min-h-10 items-center bg-[#078ced] px-4 text-sm font-bold text-white">My Plan</div>
        </div>
        <div className="grid grid-cols-[1.35fr_repeat(3,minmax(170px,1fr))] overflow-hidden border border-[#d1d7df] border-b-0 max-xl:grid-cols-2 max-md:grid-cols-1">
          <div className="flex min-h-52 flex-col items-center justify-center border-r border-[#d1d7df] bg-white p-5 text-center max-xl:border-b max-md:border-r-0">
            <div className="relative h-28 w-36">
              <div className="absolute left-6 top-1 h-16 w-16 rotate-45 rounded-md border-[3px] border-[#ffa51f] bg-[#ffc13b]" />
              <div className="absolute right-5 top-9 h-16 w-16 rotate-45 rounded-md border-[3px] border-[#f02fa0] bg-[#f45dbc]" />
              <div className="absolute left-11 top-16 h-16 w-16 rotate-45 rounded-md border-[3px] border-[#21a863] bg-[#5bc878]" />
              <div className="absolute right-2 top-2 h-3.5 w-3.5 rounded bg-[#eef3ff]" />
              <div className="absolute left-2 bottom-5 h-3.5 w-3.5 rounded bg-[#eef3ff]" />
            </div>
            <div className="mt-1 text-xl font-semibold text-[#111827]">Features</div>
          </div>
          {data.plans.map((plan: Plan) => {
            const active = plan.status === "ACTIVE";
            const isBasic = plan.name === "Basic";
            const circleClass = plan.name === "Basic" ? "bg-[#4ec266]" : plan.name === "Standard" ? "bg-[#ffb11b]" : "bg-[#e83e93]";
            return (
              <div className={`flex min-h-52 flex-col items-center justify-center border-r border-[#d1d7df] p-5 text-center last:border-r-0 max-xl:border-b ${active ? "bg-[#ff8428] text-white" : "bg-white text-[#111827]"}`} key={plan.name}>
                <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${circleClass} text-white shadow-sm ring-4 ring-white/40`}>
                  <Layers3 className="h-7 w-7" />
                </div>
                <div className="text-2xl font-semibold">{displayPlanName(plan.name)}</div>
                {isBasic ? (
                  <>
                    <div className="mt-1 text-sm font-semibold">No Hidden Charges</div>
                    <div className="mt-1 text-sm font-semibold">No Credit Card Required</div>
                    <div className={`mt-2 text-lg ${active ? "text-white/80" : "text-[#9ca3af]"}`}>{money(0)}/month</div>
                    <button className="mt-5 min-h-9 rounded border border-transparent px-7 text-sm font-semibold text-[#078ced]" type="button" onClick={() => selectPlan(plan.name)}>
                      {active ? "Current Plan" : "Select Plan"}
                    </button>
                    <div className="mt-2 text-xs font-semibold text-[#006fd6]">*Subject to Active Usage Policy</div>
                  </>
                ) : (
                  <>
                    <div className={`mt-2 text-sm font-bold ${active ? "text-white" : "text-[#111827]"}`}>{money(plan.monthlyPrice)}/Month/upto {plan.employees} emp</div>
                    <div className={`mt-2 text-sm font-bold ${active ? "text-white" : "text-[#111827]"}`}>{money(plan.additionalEmployeePrice)} per additional emp {plan.employees}+</div>
                    <button className={`mt-6 min-h-10 rounded px-9 text-sm font-semibold ${active ? "border border-white bg-[#ff8428] text-white" : "bg-[#078ced] text-white"}`} type="button" onClick={() => selectPlan(plan.name)}>
                      {active ? "Current Plan" : "Select Plan"}
                    </button>
                    {active ? <div className="mt-3 text-sm text-white">Valid till 30/09/2026</div> : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="overflow-auto border-x border-[#d1d7df]">
          <table className="w-full min-w-[940px] border-collapse text-sm">
            <tbody>
              {data.planMatrix.map((row: PlanMatrixRow, index) => {
                const previous = data.planMatrix[index - 1];
                const showSection = !previous || previous.section !== row.section;
                return (
                  <tr key={`${row.section}-${row.feature}`}>
                    <td className="w-[35%] border-b border-r border-[#d1d7df] p-3">
                      {showSection ? <div className="mb-2 text-sm font-bold text-[#078ced]">{row.section}</div> : null}
                      <div className="text-sm text-[#111827]">{row.feature}</div>
                    </td>
                    <td className="w-[21.66%] border-b border-r border-[#d1d7df] p-3 text-center"><AccessValue value={row.basic} /></td>
                    <td className="w-[21.66%] border-x border-b border-[#ff8428] bg-[#fffaf5] p-3 text-center"><AccessValue value={row.standard} /></td>
                    <td className="w-[21.66%] border-b border-l border-[#d1d7df] p-3 text-center"><AccessValue value={row.pro} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-x border-b border-[#d1d7df] p-3">
          <button className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white" onClick={() => run("/saas/invoice", "Invoice queue")}>
            <ReceiptText className="h-4 w-4" /> Queue Invoice
          </button>
          <button className="flex min-h-10 items-center gap-2 rounded-lg border border-[#dce2eb] px-4 text-sm font-semibold hover:border-brand" onClick={() => run("/saas/license-refresh", "License refresh")}>
            <RefreshCcw className="h-4 w-4" /> Refresh License
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-[#dce2eb] p-5 text-center">
          <h2 className="text-xl font-semibold">Add Ons</h2>
          <p className="mt-1 text-sm text-muted">Optional modules and premium controls that can be added to Standard or included in Pro.</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[940px] border-collapse text-sm">
            <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[#dce2eb] p-3">Add On</th>
                <th className="border-b border-[#dce2eb] p-3">{planColumnTitle("Basic")}</th>
                <th className="border-b border-[#dce2eb] bg-[#fff3e8] p-3">{planColumnTitle("Standard")}</th>
                <th className="border-b border-[#dce2eb] p-3">{planColumnTitle("Pro")}</th>
              </tr>
            </thead>
            <tbody>
              {data.planAddOns.map((row: PlanAddOn) => (
                <tr key={row.feature}>
                  <td className="border-b border-[#dce2eb] p-3 font-semibold text-[#172033]">{row.feature}</td>
                  <td className="border-b border-[#dce2eb] p-3"><AccessValue value={row.basic} /></td>
                  <td className="border-b border-[#dce2eb] bg-[#fffaf5] p-3"><AccessValue value={row.standard} /></td>
                  <td className="border-b border-[#dce2eb] p-3"><AccessValue value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-[#dce2eb] p-5 text-center">
          <h2 className="text-xl font-semibold">Plan Summary</h2>
        </div>
        <div className="grid grid-cols-2 max-lg:grid-cols-1">
          <div className="border-r border-[#dce2eb] p-5 max-lg:border-r-0 max-lg:border-b">
            <h3 className="text-lg font-semibold text-[#172033]">{displayPlanName(quotedBillingSummary.plan)}</h3>
            <div className="mt-5 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#eef3f8] pb-3">
                <label className="text-muted" htmlFor="billing-duration">Duration</label>
                <select
                  className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm font-semibold text-[#172033]"
                  id="billing-duration"
                  value={quoteYears}
                  onChange={(event) => setQuoteYears(Number(event.target.value))}
                >
                  <option value={1}>1 Year</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[#eef3f8] pb-3">
                <label className="text-muted" htmlFor="billing-employees">No. of Employees</label>
                <input
                  className="min-h-10 w-28 rounded-lg border border-[#dce2eb] px-3 text-right text-sm font-semibold text-[#172033]"
                  id="billing-employees"
                  min={1}
                  type="number"
                  value={quoteEmployees}
                  onChange={(event) => setQuoteEmployees(Number(event.target.value))}
                />
              </div>
              <div className="flex items-center justify-between border-b border-[#eef3f8] pb-3">
                <span className="text-muted">Base Plan up to {quotedPlan?.employees || 25} Employees</span>
                <span className="font-semibold">{money(quotedBillingSummary.basePlan)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#eef3f8] pb-3">
                <span className="text-muted">Additional Employee Price</span>
                <span className="font-semibold">{money(quotedBillingSummary.additionalEmployeePrice)}</span>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Add ons</span>
                  <span className="font-semibold">{money(quotedBillingSummary.addOnMonthlyPrice)} / month</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
                  {quoteAddOns.map((addOn) => {
                    const checked = selectedQuoteAddOns.includes(addOn.key);
                    return (
                      <label className={`flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-xs font-semibold ${checked ? "border-brand bg-[#eef5ff] text-brand" : "border-[#dce2eb] text-[#34465f]"}`} key={addOn.key}>
                        <span>{addOn.label}</span>
                        <span className="flex items-center gap-2">
                          {money(addOn.monthlyPrice)}/mo
                          <input
                            checked={checked}
                            className="h-4 w-4 accent-[#4f46e5]"
                            onChange={(event) => {
                              setSelectedQuoteAddOns((current) => event.target.checked ? [...current, addOn.key] : current.filter((key) => key !== addOn.key));
                            }}
                            type="checkbox"
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#eef3f8] pt-3">
                <span className="text-muted">Total Add on Price</span>
                <span className="font-semibold">{money(quotedBillingSummary.addOnMonthlyPrice * 12 * quoteYears)} / {quotedBillingSummary.duration.toLowerCase()}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted">Selected Add Ons</span>
                <span className="text-right font-semibold">{selectedAddOnNames.length ? selectedAddOnNames.join(", ") : "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Apply Coupon</span>
                <select
                  className="min-h-10 rounded-lg border border-[#b8c2d1] bg-white px-3 text-sm font-semibold text-[#172033]"
                  value={selectedCouponKey}
                  onChange={(event) => setSelectedCouponKey(event.target.value)}
                >
                  {quoteCoupons.map((coupon) => (
                    <option key={coupon.key} value={coupon.key}>{coupon.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Coupon Savings</span>
                <span className="font-semibold">{selectedCoupon.discountPercent ? `${selectedCoupon.discountPercent}% (${money(couponDiscountAmount)})` : money(0)}</span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-lg font-semibold text-[#172033]">Billing Summary</h3>
            <div className="mt-5 grid gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Item Total</span>
                <span className="font-semibold">{money(quotedBillingSummary.itemTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Price after discount</span>
                <span className="font-semibold">{money(quotedBillingSummary.discountPrice)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#dce2eb] pb-4">
                <span className="text-muted">GST (18%)</span>
                <span className="font-semibold">{money(quotedBillingSummary.gst)}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-[#172033]">Grand Total</span>
                <span className="font-bold text-[#172033]">{money(quotedBillingSummary.grandTotal)}</span>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase text-muted" htmlFor="payment-method">Payment Method</label>
                <select
                  className="min-h-10 rounded-lg border border-[#dce2eb] bg-white px-3 text-sm font-semibold text-[#172033]"
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option>UPI / Bank Transfer</option>
                  <option>Credit / Debit Card</option>
                  <option>Net Banking</option>
                  <option>Manual Invoice</option>
                </select>
              </div>
              <button className="mt-2 min-h-11 rounded-lg bg-brand px-4 text-sm font-bold text-white" onClick={confirmPayment} type="button">
                Pay {money(quotedBillingSummary.grandTotal)}
              </button>
              {paymentReceipt ? (
                <div className="mt-3 rounded-lg border border-[#bfe6d2] bg-[#f1fbf6] p-4 text-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-bold text-[#172033]">Payment Confirmation</div>
                    <StatusPill tone="yellow">{paymentReceipt.status}</StatusPill>
                  </div>
                  <div className="grid gap-2 text-[#34465f]">
                    <div className="flex items-center justify-between gap-3">
                      <span>Receipt ID</span>
                      <span className="font-semibold text-[#172033]">{paymentReceipt.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Amount</span>
                      <span className="font-semibold text-[#172033]">{money(paymentReceipt.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Method</span>
                      <span className="font-semibold text-[#172033]">{paymentReceipt.method}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Plan</span>
                      <span className="font-semibold text-[#172033]">{paymentReceipt.plan}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Created</span>
                      <span className="font-semibold text-[#172033]">{new Date(paymentReceipt.paidAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted">Use this receipt for internal tracking until payment gateway verification is connected.</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 print-area">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce2eb] p-5">
          <div>
            <h2 className="text-xl font-semibold">Invoice Preview</h2>
            <p className="mt-1 text-sm text-muted">Client-ready quote generated from the selected plan, add-ons and coupon.</p>
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dce2eb] px-4 text-sm font-semibold text-[#172033] print-hide" onClick={() => window.print()} type="button">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white print-hide" onClick={downloadQuote} type="button">
            <Download className="h-4 w-4" /> Download Quote
          </button>
        </div>
        <div className="grid grid-cols-3 gap-5 p-5 max-lg:grid-cols-1">
          <div className="rounded-lg border border-[#dce2eb] p-4">
            <div className="text-xs font-bold uppercase text-muted">Billed From</div>
            <div className="mt-2 text-lg font-semibold text-[#172033]">Acme Corp</div>
            <div className="mt-1 text-sm text-muted">SKYLINX PeopleOS HRMS</div>
            <div className="mt-3 text-sm text-[#34465f]">{supportEmail}</div>
            <div className="text-sm text-[#34465f]">+1-800-555-0199</div>
          </div>
          <div className="rounded-lg border border-[#dce2eb] p-4">
            <div className="text-xs font-bold uppercase text-muted">Billed To</div>
            <div className="mt-2 text-lg font-semibold text-[#172033]">{billedToName}</div>
            <div className="mt-1 text-sm text-muted">{billedToLegalName}</div>
            <div className="mt-3 text-sm text-[#34465f]">Plan: {displayPlanName(quotedBillingSummary.plan)}</div>
            <div className="text-sm text-[#34465f]">Users: {quoteEmployees}</div>
          </div>
          <div className="rounded-lg border border-[#dce2eb] p-4">
            <div className="text-xs font-bold uppercase text-muted">Quote Details</div>
            <div className="mt-2 text-sm text-[#34465f]">Invoice No.</div>
            <div className="font-semibold text-[#172033]">{invoiceNumber}</div>
            <div className="mt-3 text-sm text-[#34465f]">Duration: {quotedBillingSummary.duration}</div>
            <div className="text-sm text-[#34465f]">GST: 18%</div>
            <StatusPill tone="yellow">Draft Quote</StatusPill>
          </div>
        </div>
        <div className="overflow-auto px-5 pb-5">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[#dce2eb] p-3">Description</th>
                <th className="border-b border-[#dce2eb] p-3">Qty</th>
                <th className="border-b border-[#dce2eb] p-3">Rate</th>
                <th className="border-b border-[#dce2eb] p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-[#dce2eb] p-3 font-semibold">{displayPlanName(quotedBillingSummary.plan)} base plan</td>
                <td className="border-b border-[#dce2eb] p-3">{quoteYears} year</td>
                <td className="border-b border-[#dce2eb] p-3">{money(quotedBillingSummary.basePlan)}/month</td>
                <td className="border-b border-[#dce2eb] p-3 text-right font-semibold">{money(quotedBillingSummary.basePlan * 12 * quoteYears)}</td>
              </tr>
              {quotedBillingSummary.additionalEmployeePrice ? (
                <tr>
                  <td className="border-b border-[#dce2eb] p-3 font-semibold">Additional employees above {quotedPlan?.employees || 25}</td>
                  <td className="border-b border-[#dce2eb] p-3">{Math.max(0, quoteEmployees - (quotedPlan?.employees || 25))} users</td>
                  <td className="border-b border-[#dce2eb] p-3">{money(quotedPlan?.additionalEmployeePrice || 0)}/user/month</td>
                  <td className="border-b border-[#dce2eb] p-3 text-right font-semibold">{money(quotedBillingSummary.additionalEmployeePrice * 12 * quoteYears)}</td>
                </tr>
              ) : null}
              {selectedAddOnNames.length ? (
                <tr>
                  <td className="border-b border-[#dce2eb] p-3 font-semibold">Selected add-ons</td>
                  <td className="border-b border-[#dce2eb] p-3">{selectedAddOnNames.length}</td>
                  <td className="border-b border-[#dce2eb] p-3">{selectedAddOnNames.join(", ")}</td>
                  <td className="border-b border-[#dce2eb] p-3 text-right font-semibold">{money(quotedBillingSummary.addOnMonthlyPrice * 12 * quoteYears)}</td>
                </tr>
              ) : null}
              <tr>
                <td className="p-3 text-muted" colSpan={3}>Item total</td>
                <td className="p-3 text-right font-semibold">{money(quotedBillingSummary.itemTotal)}</td>
              </tr>
              <tr>
                <td className="p-3 text-muted" colSpan={3}>Coupon discount ({selectedCoupon.label})</td>
                <td className="p-3 text-right font-semibold text-[#0f8a5f]">-{money(couponDiscountAmount)}</td>
              </tr>
              <tr>
                <td className="p-3 text-muted" colSpan={3}>GST (18%)</td>
                <td className="p-3 text-right font-semibold">{money(quotedBillingSummary.gst)}</td>
              </tr>
              <tr className="bg-[#f8fafc]">
                <td className="p-3 text-base font-bold text-[#172033]" colSpan={3}>Grand total</td>
                <td className="p-3 text-right text-base font-bold text-[#172033]">{money(quotedBillingSummary.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Companies</h2>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
                <tr>
                  <th className="border-b border-[#dce2eb] p-3">Company</th>
                  <th className="border-b border-[#dce2eb] p-3">Timezone</th>
                  <th className="border-b border-[#dce2eb] p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company) => (
                  <tr key={company.id}>
                    <td className="border-b border-[#dce2eb] p-3">
                      <div className="font-semibold">{company.name}</div>
                      <div className="text-xs text-muted">{company.legalName}</div>
                    </td>
                    <td className="border-b border-[#dce2eb] p-3">{company.timezone}</td>
                    <td className="border-b border-[#dce2eb] p-3"><StatusPill>{company.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Module Entitlements</h2>
          <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
            {data.entitlements.map((item: Entitlement) => (
              <div className="flex items-center justify-between rounded-lg border border-[#dce2eb] p-3 text-sm" key={item.id}>
                <span className="font-semibold">{item.module}</span>
                <StatusPill tone={item.enabled ? "green" : "yellow"}>{item.enabled ? "Enabled" : "Disabled"}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Billing Events</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-[#f8fafc] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[#dce2eb] p-3">Action</th>
                <th className="border-b border-[#dce2eb] p-3">Status</th>
                <th className="border-b border-[#dce2eb] p-3">Amount</th>
                <th className="border-b border-[#dce2eb] p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.billingEvents.map((event: BillingEvent) => (
                <tr key={event.id}>
                  <td className="border-b border-[#dce2eb] p-3 font-semibold">{event.action}</td>
                  <td className="border-b border-[#dce2eb] p-3"><StatusPill>{event.status}</StatusPill></td>
                  <td className="border-b border-[#dce2eb] p-3">{money(event.amount)}</td>
                  <td className="border-b border-[#dce2eb] p-3">{String(event.createdAt).slice(0, 10)}</td>
                </tr>
              ))}
              {!data.billingEvents.length ? (
                <tr>
                  <td className="border-b border-[#dce2eb] p-3 text-muted" colSpan={4}>No billing events yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
