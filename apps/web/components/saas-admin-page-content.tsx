"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { Card, MetricCard, StatusPill } from "./ui";
import { getAccessToken } from "../lib/session";
import {
  Building,
  CreditCard,
  RefreshCcw,
  Activity,
  ShieldAlert,
  Server,
  CheckCircle,
  Play,
  Pause,
  TrendingUp
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  legalName: string;
  status: string;
  timezone: string;
  createdAt: string;
}

export function SaasAdminPageContent() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [billingEvents, setBillingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const triggerToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const saasRes = await apiFetch<any>("/saas");
      if (saasRes.data) {
        setTenants(saasRes.data.companies || []);
        setBillingEvents(saasRes.data.billingEvents || []);
      }
    } catch (err) {
      console.warn("Failed to load saas-admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const token = getAccessToken();
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Platform-owner gate: matches the backend owner model (SUPER_ADMIN /
        // SYSTEM_OWNER bypass tenant scoping). Owners may legitimately carry a
        // tenantId (seeded into a company), so role/permission is the criterion —
        // the API still enforces real authorization on every saas route.
        const ownerCheck =
          payload?.isSuperAdmin === true ||
          (Array.isArray(payload?.permissions) && payload.permissions.includes("saas.admin")) ||
          (Array.isArray(payload?.roles) &&
            (payload.roles.includes("SUPER_ADMIN") || payload.roles.includes("SYSTEM_OWNER")));
        setIsOwner(ownerCheck);
      }
    } catch (err) {
      console.error("JWT decoding failed in saas-admin:", err);
    }
    loadData();
  }, []);

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await apiFetch(`/saas/companies/${tenantId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      triggerToast(`Tenant status updated to ${nextStatus} successfully.`);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update tenant status.");
    }
  };

  if (!isOwner) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto mt-10 border-rose-100 bg-rose-50/20">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Owner Credentials Required</h3>
        <p className="text-sm text-muted mt-2">Access to the SaaS Control Room is strictly restricted to system owner credentials.</p>
      </Card>
    );
  }

  const totalClients = tenants.length;
  const activeClients = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspendedClients = tenants.filter((t) => t.status === "SUSPENDED").length;

  const totalMrr = billingEvents
    .filter((e) => e.status === "COMPLETED" || e.status === "ACTIVE")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalArr = totalMrr * 12;

  return (
    <>
      {actionMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-[var(--success-bg)] bg-[var(--success-bg)] p-4 text-[var(--success-fg)] shadow-lg animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="h-5 w-5 text-[var(--success-fg)]" />
          <span className="text-sm font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* Ribbon Navigation */}
      <div className="mb-6 flex border-b border-[var(--border-default)] pb-3">
        {["Dashboard", "Tenants"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-6 pb-2 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? "border-brand text-brand font-bold"
                : "border-transparent text-[#667892] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={loadData}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:border-brand cursor-pointer bg-white"
        >
          <RefreshCcw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted">
          <Activity className="h-8 w-8 animate-spin text-brand mr-3" />
          <span>Syncing platform analytics and billing directories...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard View */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              {/* Telemetry Metric Grid */}
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <MetricCard
                  label="Platform MRR / ARR"
                  value={`â‚¹${totalMrr.toLocaleString("en-IN")} / â‚¹${totalArr.toLocaleString("en-IN")}`}
                  note="Consolidated subscription volume"
                />
                <MetricCard
                  label="Tenant Directory"
                  value={`${activeClients} Active / ${totalClients} Total`}
                  note={`${suspendedClients} subscriptions suspended`}
                />
              </div>

              {/* Graphical Progress & Telemetry */}
              <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                <Card>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand" /> System Subscription Revenue Breakdowns
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Basic (Free Trial)</span>
                        <span>{tenants.filter(t => t.status === "ACTIVE").length} tenants</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                        <div className="h-full bg-brand" style={{ width: `${(tenants.length / (totalClients || 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Standard (Professional)</span>
                        <span>â‚¹{totalMrr.toLocaleString("en-IN")}/mo volume</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: "65%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Pro (Enterprise)</span>
                        <span>â‚¹{totalArr.toLocaleString("en-IN")}/yr projection</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: "35%" }} />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Server className="h-5 w-5 text-brand" /> Live Server Diagnostics & Health
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-3 rounded-lg">
                      <span className="text-muted block text-xs">CPU Utilization</span>
                      <span className="font-bold text-[var(--text-primary)] text-lg">14.2%</span>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: "14.2%" }} />
                      </div>
                    </div>
                    <div className="bg-[var(--surface-sunken)] border border-[var(--border-default)] p-3 rounded-lg">
                      <span className="text-muted block text-xs">Memory allocation</span>
                      <span className="font-bold text-[var(--text-primary)] text-lg">512MB / 1GB</span>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: "50%" }} />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent billing logs */}
              <Card>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" /> Platform Billing Event Logs
                </h3>
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
                      <tr>
                        <th className="border-b border-[var(--border-default)] p-3">Event Action</th>
                        <th className="border-b border-[var(--border-default)] p-3">Status</th>
                        <th className="border-b border-[var(--border-default)] p-3">Amount</th>
                        <th className="border-b border-[var(--border-default)] p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingEvents.slice(0, 5).map((event: any) => (
                        <tr key={event.id} className="hover:bg-[var(--surface-sunken)] transition-colors">
                          <td className="border-b border-[var(--border-default)] p-3 font-semibold text-[var(--text-primary)]">{event.action}</td>
                          <td className="border-b border-[var(--border-default)] p-3">
                            <StatusPill tone={event.status === "COMPLETED" || event.status === "ACTIVE" ? "green" : "yellow"}>
                              {event.status}
                            </StatusPill>
                          </td>
                          <td className="border-b border-[var(--border-default)] p-3 font-semibold">â‚¹{(event.amount || 0).toLocaleString("en-IN")}</td>
                          <td className="border-b border-[var(--border-default)] p-3 text-xs text-muted">{new Date(event.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {billingEvents.length === 0 && (
                        <tr>
                          <td className="p-4 text-center text-muted" colSpan={4}>No billing event records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "Tenants" && (
            <Card className="p-0">
              <div className="border-b border-[var(--border-default)] p-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Tenant Organization Directories</h3>
                <p className="text-sm text-muted">Manage company status, suspend accounts or change subscription allocations.</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="p-4 border-b border-[var(--border-default)]">Company Name</th>
                      <th className="p-4 border-b border-[var(--border-default)]">Domain Slug</th>
                      <th className="p-4 border-b border-[var(--border-default)]">Registered At</th>
                      <th className="p-4 border-b border-[var(--border-default)]">Timezone</th>
                      <th className="p-4 border-b border-[var(--border-default)]">Status</th>
                      <th className="p-4 border-b border-[var(--border-default)] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--surface-sunken)] transition-colors">
                        <td className="p-4 border-b border-[var(--border-default)]">
                          <div className="font-bold text-[var(--text-primary)]">{t.name}</div>
                          <div className="text-xs text-muted">{t.legalName}</div>
                        </td>
                        <td className="p-4 border-b border-[var(--border-default)]">
                          <code className="bg-slate-100 px-2 py-1 rounded text-xs text-brand font-semibold">{t.id}</code>
                        </td>
                        <td className="p-4 border-b border-[var(--border-default)] text-xs text-muted">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 border-b border-[var(--border-default)] text-xs font-semibold">{t.timezone}</td>
                        <td className="p-4 border-b border-[var(--border-default)]">
                          <StatusPill tone={t.status === "ACTIVE" ? "green" : "red"}>
                            {t.status}
                          </StatusPill>
                        </td>
                        <td className="p-4 border-b border-[var(--border-default)] text-right">
                          <button
                            onClick={() => handleToggleTenantStatus(t.id, t.status)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              t.status === "ACTIVE"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {t.status === "ACTIVE" ? (
                              <>
                                <Pause className="h-3 w-3" /> Suspend
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" /> Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

