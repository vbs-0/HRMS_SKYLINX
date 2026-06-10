"use client";

import { Activity, BadgeIndianRupee, BriefcaseBusiness, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackAnalytics } from "../lib/fallback-data";
import { emptyAnalytics } from "../lib/live-data";
import { Card, MetricCard, StatusPill } from "./ui";

type AnalyticsData = typeof fallbackAnalytics;
type Insight = AnalyticsData["insights"][number];
type Breakdown = AnalyticsData["departmentBreakdown"][number];
type Risk = AnalyticsData["risks"][number];

function money(value: number) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function toneFor(status: string) {
  return status === "GOOD" || status === "STABLE" ? "green" : status === "REVIEW" ? "yellow" : "green";
}

export function AnalyticsConsole() {
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);

  function load() {
    apiFetch<AnalyticsData>("/analytics")
      .then((body) => {
        if (body.data) setData(body.data);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  const maxDepartment = Math.max(...data.departmentBreakdown.map((item) => item.count), 1);
  const maxLocation = Math.max(...data.locationBreakdown.map((item) => item.count), 1);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Headcount" value={String(data.metrics.headcount)} note="Active employees" />
        <MetricCard label="Attendance Rate" value={`${data.metrics.attendanceRate}%`} note="Presence health" />
        <MetricCard label="Payroll Net" value={money(data.metrics.payrollNet)} note="Current payout" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Executive Insights</h2>
            <p className="mt-1 text-sm text-muted">Workforce, attendance, payroll and expenses signals.</p>
          </div>
          <StatusPill>Live HRMS Data</StatusPill>
        </div>
        <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
          {data.insights.map((insight: Insight) => (
            <div className="rounded-lg border border-[#dce2eb] p-4" key={insight.title}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <TrendingUp className="h-5 w-5 text-brand" />
                <StatusPill tone={toneFor(insight.status)}>{insight.status}</StatusPill>
              </div>
              <div className="text-sm text-muted">{insight.title}</div>
              <div className="mt-2 text-xl font-semibold">{insight.value}</div>
              <div className="mt-1 text-xs text-muted">{insight.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Department Mix</h2>
          <div className="grid gap-3">
            {data.departmentBreakdown.map((item: Breakdown) => (
              <div key={item.department}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.department}</span>
                  <span className="text-muted">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e8eef5]">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(10, (item.count / maxDepartment) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Location Mix</h2>
          <div className="grid gap-3">
            {data.locationBreakdown.map((item) => (
              <div key={item.location}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.location}</span>
                  <span className="text-muted">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e8eef5]">
                  <div className="h-2 rounded-full bg-[#31a9d8]" style={{ width: `${Math.max(10, (item.count / maxLocation) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <div className="mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-brand" /><h2 className="text-lg font-semibold">Workforce</h2></div>
          <div className="text-3xl font-semibold">{data.metrics.headcount}</div>
          <div className="mt-1 text-sm text-muted">{money(data.metrics.annualCtc)} annual CTC tracked</div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2"><BadgeIndianRupee className="h-5 w-5 text-brand" /><h2 className="text-lg font-semibold">Payroll</h2></div>
          <div className="text-3xl font-semibold">{money(data.metrics.monthlyPayroll)}</div>
          <div className="mt-1 text-sm text-muted">{money(data.metrics.payrollNet)} net payable</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Risk Signals</h2>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          {data.risks.map((risk: Risk) => (
            <div className="rounded-lg border border-[#dce2eb] p-4" key={risk.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Activity className="h-5 w-5 text-brand" />
                <StatusPill tone={toneFor(risk.status)}>{risk.status}</StatusPill>
              </div>
              <div className="font-semibold">{risk.name}</div>
              <div className="mt-1 text-sm text-muted">{risk.count} records need attention</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
