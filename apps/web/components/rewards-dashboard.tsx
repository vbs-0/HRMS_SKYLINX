"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackRewards } from "../lib/fallback-data";
import { onDataRefresh } from "../lib/refresh-events";
import { Card, MetricCard, StatusPill } from "./ui";

type RewardsState = typeof fallbackRewards;

interface ApiRewards {
  totalPoints: number;
  vouchers: Array<{ id: string; code: string; title: string; provider: string; valueAmount: string; pointsCost: number; status: string }>;
  benefits: Array<{ id: string; title: string; provider: string; category: string; description: string; pointsCost?: number | null; status: string }>;
  recognitions: Array<{ id: string; title: string; message: string; points: number; createdAt: string; recipient: { firstName: string; lastName: string } }>;
  ledger: Array<{ id: string; points: number; reason: string; source: string; createdAt: string; employee: { firstName: string; lastName: string } }>;
}

export function RewardsDashboard() {
  const [data, setData] = useState<RewardsState>({ totalPoints: 0, vouchers: [], benefits: [], recognitions: [], ledger: [] });

  function load() {
    apiFetch<ApiRewards>("/rewards")
      .then((body) => {
        if (!body.data) return;
        setData({
          totalPoints: body.data.totalPoints,
          vouchers: body.data.vouchers.map((voucher) => ({
            id: voucher.id,
            code: voucher.code,
            title: voucher.title,
            provider: voucher.provider,
            value: `INR ${Number(voucher.valueAmount).toLocaleString("en-IN")}`,
            pointsCost: voucher.pointsCost,
            status: voucher.status,
          })),
          benefits: body.data.benefits.map((benefit) => ({
            id: benefit.id,
            title: benefit.title,
            provider: benefit.provider,
            category: benefit.category,
            description: benefit.description,
            pointsCost: benefit.pointsCost || 0,
            status: benefit.status,
          })),
          recognitions: body.data.recognitions.map((recognition) => ({
            id: recognition.id,
            employee: `${recognition.recipient.firstName} ${recognition.recipient.lastName}`,
            title: recognition.title,
            message: recognition.message,
            points: recognition.points,
            createdAt: recognition.createdAt.slice(0, 10),
          })),
          ledger: body.data.ledger.map((entry) => ({
            id: entry.id,
            employee: `${entry.employee.firstName} ${entry.employee.lastName}`,
            points: entry.points,
            reason: entry.reason,
            source: entry.source,
            createdAt: entry.createdAt.slice(0, 10),
          })),
        });
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
    return onDataRefresh("rewards", load);
  }, []);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Reward Points" value={String(data.totalPoints)} note="Total issued" />
        <MetricCard label="Vouchers" value={String(data.vouchers.length)} note="Active rewards" />
        <MetricCard label="Benefits" value={String(data.benefits.length)} note="Marketplace items" />
        <MetricCard label="Recognitions" value={String(data.recognitions.length)} note="Employee wins" />
      </div>

      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Vouchers</h2>
          <div className="grid gap-3">
            {data.vouchers.map((voucher) => (
              <div className="rounded-lg border border-[var(--border-default)] p-3" key={voucher.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{voucher.title}</div>
                    <div className="text-xs text-muted">{voucher.provider} - {voucher.code}</div>
                  </div>
                  <StatusPill>{voucher.status}</StatusPill>
                </div>
                <div className="mt-2 text-sm">{voucher.value} / {voucher.pointsCost} points</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Benefits Marketplace</h2>
          <div className="grid gap-3">
            {data.benefits.map((benefit) => (
              <div className="rounded-lg border border-[var(--border-default)] p-3" key={benefit.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{benefit.title}</div>
                    <div className="text-xs text-muted">{benefit.provider} - {benefit.category}</div>
                  </div>
                  <StatusPill>{benefit.status}</StatusPill>
                </div>
                <div className="mt-2 text-sm text-muted">{benefit.description}</div>
                <div className="mt-2 text-sm font-semibold">{benefit.pointsCost} points</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Recognition & Points Ledger</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[var(--border-default)] p-3">Employee</th>
                <th className="border-b border-[var(--border-default)] p-3">Reason</th>
                <th className="border-b border-[var(--border-default)] p-3">Source</th>
                <th className="border-b border-[var(--border-default)] p-3">Points</th>
                <th className="border-b border-[var(--border-default)] p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className="border-b border-[var(--border-default)] p-3 font-semibold">{entry.employee}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{entry.reason}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{entry.source}</td>
                  <td className="border-b border-[var(--border-default)] p-3 font-semibold">{entry.points}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{entry.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
