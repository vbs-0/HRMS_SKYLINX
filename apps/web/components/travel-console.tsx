"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { onDataRefresh, requestDataRefresh } from "../lib/refresh-events";
import { Card, StatusPill } from "./ui";
import {
  Plane,
  Plus,
  Compass,
  FileSpreadsheet,
  Check,
  X,
  Calendar,
  DollarSign,
  User,
  CreditCard
} from "lucide-react";

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface TravelRequest {
  id: string;
  employeeId: string;
  purpose: string;
  startDate: string;
  endDate: string;
  sourceCity: string;
  destinationCity: string;
  estimatedCost: string;
  advanceAmount: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  itineraries?: any[];
  advances?: any[];
}

interface EmployeeAdvance {
  id: string;
  employeeId: string;
  requestId?: string | null;
  amount: string;
  status: string;
  paymentDate?: string | null;
  employee: {
    firstName: string;
    lastName: string;
  };
  travelRequest?: {
    purpose: string;
    destinationCity: string;
  } | null;
}

export function TravelConsole() {
  const [activeTab, setActiveTab] = useState("Requests");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);

  // Form states
  const [reqEmpId, setReqEmpId] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");
  const [reqStart, setReqStart] = useState("");
  const [reqEnd, setReqEnd] = useState("");
  const [reqSource, setReqSource] = useState("");
  const [reqDest, setReqDest] = useState("");
  const [reqCost, setReqCost] = useState("0");
  const [reqAdvance, setReqAdvance] = useState("0");

  const [itiReqId, setItiReqId] = useState("");
  const [itiMode, setItiMode] = useState("FLIGHT");
  const [itiTicket, setItiTicket] = useState("");
  const [itiBoarding, setItiBoarding] = useState("");
  const [itiDetails, setItiDetails] = useState("");

  // Status states
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
    return onDataRefresh("travel", loadAll);
  }, [activeTab]);

  function loadAll() {
    setLoading(true);
    Promise.all([
      apiFetch<EmployeeOption[]>("/employees"),
      apiFetch<TravelRequest[]>("/travel/requests"),
      apiFetch<EmployeeAdvance[]>("/travel/advances"),
    ]).then(([empRes, reqRes, advRes]) => {
      if (empRes.data) setEmployees(empRes.data);
      if (reqRes.data) setRequests(reqRes.data);
      if (advRes.data) setAdvances(advRes.data);
      setLoading(false);
    });
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!reqEmpId) throw new Error("Please select an employee");
      await apiFetch("/travel/requests", {
        method: "POST",
        body: JSON.stringify({
          employeeId: reqEmpId,
          purpose: reqPurpose,
          startDate: new Date(reqStart).toISOString(),
          endDate: new Date(reqEnd).toISOString(),
          sourceCity: reqSource,
          destinationCity: reqDest,
          estimatedCost: Number(reqCost),
          advanceAmount: Number(reqAdvance),
        }),
      });
      setMessage("Travel Request submitted successfully!");
      setReqPurpose("");
      setReqStart("");
      setReqEnd("");
      setReqSource("");
      setReqDest("");
      setReqCost("0");
      setReqAdvance("0");
      requestDataRefresh("travel");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    }
  };

  const handleDecideRequest = async (id: string, status: "APPROVED" | "REJECTED") => {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/travel/requests/${id}/decide`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(`Travel request marked ${status.toLowerCase()}.`);
      requestDataRefresh("travel");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to submit decision");
    }
  };

  const handleItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (!itiReqId) throw new Error("Please select a travel request");
      await apiFetch(`/travel/requests/${itiReqId}/itinerary`, {
        method: "POST",
        body: JSON.stringify({
          modeOfTravel: itiMode,
          ticketNumber: itiTicket || undefined,
          boardingAt: itiBoarding || undefined,
          details: itiDetails || undefined,
        }),
      });
      setMessage("Itinerary item added successfully!");
      setItiTicket("");
      setItiBoarding("");
      setItiDetails("");
      requestDataRefresh("travel");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to add itinerary");
    }
  };

  const handleDisburseAdvance = async (id: string) => {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/travel/advances/${id}/disburse`, {
        method: "PATCH",
      });
      setMessage("Cash advance disbursed and paid.");
      requestDataRefresh("travel");
      loadAll();
    } catch (err: any) {
      setError(err.message || "Failed to disburse advance");
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
          { label: "Travel Requests", val: "Requests" },
          { label: "Itinerary Booking", val: "Itinerary" },
          { label: "Cash Advances", val: "Advances" },
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

      {/* REQUESTS TAB */}
      {activeTab === "Requests" && (
        <div className="grid grid-cols-[360px_1fr] gap-6 max-xl:grid-cols-1">
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Plane className="h-5 w-5 text-brand" /> New Travel Request
            </h3>
            <form onSubmit={handleRequestSubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={reqEmpId}
                  onChange={(e) => setReqEmpId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-500 mb-1">Purpose of Travel</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="e.g. Sales pitch with Client X"
                  value={reqPurpose}
                  onChange={(e) => setReqPurpose(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="date"
                    value={reqStart}
                    onChange={(e) => setReqStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="date"
                    value={reqEnd}
                    onChange={(e) => setReqEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Source City</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    placeholder="e.g. Mumbai"
                    value={reqSource}
                    onChange={(e) => setReqSource(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Destination City</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    placeholder="e.g. Bangalore"
                    value={reqDest}
                    onChange={(e) => setReqDest(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Est. Cost (INR)</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={reqCost}
                    onChange={(e) => setReqCost(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Advance Requested</label>
                  <input
                    className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    type="number"
                    value={reqAdvance}
                    onChange={(e) => setReqAdvance(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Submit Travel Request
              </button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3">
              Travel Request Ledger
            </h3>
            {loading ? (
              <div className="text-center p-8 text-slate-400 text-sm">Loading travel logs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] border-collapse text-sm text-left">
                  <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 border-b">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Destination & Dates</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3 text-right">Est. Cost / Advance</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {r.employee.firstName} {r.employee.lastName}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{r.sourceCity} ➔ {r.destinationCity}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 truncate max-w-[180px]">{r.purpose}</td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-slate-800">₹{Number(r.estimatedCost).toLocaleString("en-IN")}</div>
                          <div className="text-xs text-slate-400 font-mono">Adv: ₹{Number(r.advanceAmount).toLocaleString("en-IN")}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <StatusPill tone={r.status === "PENDING" ? "yellow" : r.status === "REJECTED" ? "red" : "green"}>
                              {r.status}
                            </StatusPill>
                            {r.status === "PENDING" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDecideRequest(r.id, "APPROVED")}
                                  className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDecideRequest(r.id, "REJECTED")}
                                  className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
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
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                          No travel requests found. Create one using the form on the left.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ITINERARY TAB */}
      {activeTab === "Itinerary" && (
        <div className="grid grid-cols-[360px_1fr] gap-6 max-xl:grid-cols-1">
          <Card className="h-fit">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-3">
              <Compass className="h-5 w-5 text-brand" /> Book Itinerary Item
            </h3>
            <form onSubmit={handleItinerarySubmit} className="grid gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Approved Travel Request</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={itiReqId}
                  onChange={(e) => setItiReqId(e.target.value)}
                  required
                >
                  <option value="">Select Request</option>
                  {requests
                    .filter((r) => r.status === "APPROVED")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.employee.firstName} - {r.destinationCity} ({r.purpose})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
                <select
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white"
                  value={itiMode}
                  onChange={(e) => setItiMode(e.target.value)}
                  required
                >
                  <option value="FLIGHT">FLIGHT ✈️</option>
                  <option value="TRAIN">TRAIN 🚂</option>
                  <option value="HOTEL">HOTEL 🏨</option>
                  <option value="CAB">CAB 🚖</option>
                  <option value="BUS">BUS 🚌</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ticket / Booking Number</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  placeholder="e.g. PNR-1234567 / Booking ID"
                  value={itiTicket}
                  onChange={(e) => setItiTicket(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Boarding / Check-in Date-Time</label>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  type="datetime-local"
                  value={itiBoarding}
                  onChange={(e) => setItiBoarding(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Travel / Booking Details</label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm"
                  placeholder="e.g. Flight AI-101 Departs 10:00 AM, Indigo economy seat 12B..."
                  value={itiDetails}
                  onChange={(e) => setItiDetails(e.target.value)}
                />
              </div>
              <button
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark transition shadow-sm mt-1"
                type="submit"
              >
                Save Itinerary Item
              </button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-3">
              Itinerary Directory
            </h3>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              {requests.map((r) => {
                if (!r.itineraries || r.itineraries.length === 0) return null;
                return (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-4 shadow-sm">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 border-b pb-2 flex justify-between items-center">
                      <span>Trip: {r.employee.firstName} to {r.destinationCity}</span>
                      <StatusPill tone="green">ACTIVE</StatusPill>
                    </h4>
                    <div className="grid gap-3">
                      {r.itineraries.map((it) => (
                        <div key={it.id} className="rounded-lg bg-white border border-slate-100 p-3 text-xs leading-relaxed">
                          <div className="flex justify-between font-bold text-slate-700 uppercase tracking-wide text-[10px]">
                            <span>{it.modeOfTravel}</span>
                            <span className="text-brand">{it.ticketNumber || "NO TICKET"}</span>
                          </div>
                          {it.boardingAt && (
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Boarding/Check-in: {new Date(it.boardingAt).toLocaleString()}
                            </div>
                          )}
                          <p className="text-slate-500 mt-2 italic font-mono">{it.details || "No comments"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {requests.every((r) => !r.itineraries || r.itineraries.length === 0) && (
                <div className="col-span-2 py-8 text-center text-slate-400 text-xs border border-dashed rounded-lg">
                  No itineraries scheduled yet. Add one using the form on the left.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ADVANCES TAB */}
      {activeTab === "Advances" && (
        <Card>
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
              <h3 className="text-base font-semibold">Travel Cash Advances</h3>
              <p className="text-xs text-muted">Upfront cash advance allocations generated through corporate trip requests.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="border-b p-3">Employee</th>
                  <th className="border-b p-3">Trip Purpose</th>
                  <th className="border-b p-3">Amount Requested</th>
                  <th className="border-b p-3">Payment Date</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/50">
                    <td className="border-b p-3 font-semibold text-slate-800">
                      {adv.employee.firstName} {adv.employee.lastName}
                    </td>
                    <td className="border-b p-3">
                      {adv.travelRequest ? (
                        <div>
                          <div className="font-semibold text-slate-800">{adv.travelRequest.destinationCity}</div>
                          <span className="text-xs text-slate-400">{adv.travelRequest.purpose}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Standalone Advance</span>
                      )}
                    </td>
                    <td className="border-b p-3 font-semibold text-slate-800">₹{Number(adv.amount).toLocaleString("en-IN")}</td>
                    <td className="border-b p-3 font-mono text-xs">
                      {adv.paymentDate ? new Date(adv.paymentDate).toLocaleDateString() : "Pending disbursement"}
                    </td>
                    <td className="border-b p-3">
                      <StatusPill tone={adv.status === "PENDING" ? "yellow" : adv.status === "REJECTED" ? "red" : "green"}>
                        {adv.status}
                      </StatusPill>
                    </td>
                    <td className="border-b p-3 text-right">
                      {adv.status === "PENDING" && (
                        <button
                          onClick={() => handleDisburseAdvance(adv.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-xs font-semibold transition cursor-pointer shadow-sm"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Disburse Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {advances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No cash advances found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
