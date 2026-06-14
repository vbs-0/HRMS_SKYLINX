"use client";

import { FileKey2, Fingerprint, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { fallbackAuditLogs, fallbackNotifications } from "../lib/fallback-data";
import { Card, MetricCard, StatusPill } from "./ui";

type AuditRow = (typeof fallbackAuditLogs)[number];
type NotificationRow = (typeof fallbackNotifications)[number];

interface ApiAuditLog {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: { email: string; employee?: { firstName: string; lastName: string } | null } | null;
  newValueJson?: { status?: string } | null;
}

interface ApiNotification {
  id: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
  user: { email: string; employee?: { firstName: string; lastName: string } | null };
}

const controls = [
  { label: "2FA / OTP", note: "OTP login endpoints and token expiry controls", icon: KeyRound, tone: "green" as const },
  { label: "Audit Logs", note: "Every sensitive workflow writes an audit trail", icon: ShieldCheck, tone: "green" as const },
  { label: "Payroll Encryption", note: "Payroll and bank fields isolated for encryption policy", icon: LockKeyhole, tone: "yellow" as const },
  { label: "Document Security", note: "Document URLs and verification status are controlled", icon: FileKey2, tone: "green" as const },
  { label: "Activity Tracking", note: "Admin actions visible by module and entity", icon: Fingerprint, tone: "green" as const },
];

export function SecurityConsole() {
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  function load() {
    apiFetch<ApiAuditLog[]>("/security/audit-logs")
      .then((body) => {
        if (!body.data) return;
        setAuditLogs(body.data.map((log) => ({
          id: log.id,
          module: log.module,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId || "-",
          actor: log.actor?.employee ? `${log.actor.employee.firstName} ${log.actor.employee.lastName}` : log.actor?.email || "System",
          createdAt: log.createdAt.slice(0, 10),
        })));
      })
      .catch(() => undefined);

    apiFetch<ApiNotification[]>("/notifications")
      .then((body) => {
        if (!body.data) return;
        setNotifications(body.data.map((notification) => ({
          id: notification.id,
          recipient: notification.user.employee ? `${notification.user.employee.firstName} ${notification.user.employee.lastName}` : notification.user.email,
          channel: notification.channel,
          title: notification.title,
          body: notification.body,
          status: notification.status,
          createdAt: notification.createdAt.slice(0, 10),
          sentAt: notification.sentAt ? notification.sentAt.slice(0, 10) : "-",
        })));
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        <MetricCard label="Audit Events" value={String(auditLogs.length)} note="Recent activity" />
        <MetricCard label="Alerts" value={String(notifications.length)} note="Notification records" />
        <MetricCard label="Controls" value={String(controls.length)} note="Security checks" />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Security Controls</h2>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {controls.map(({ label, note, icon: Icon, tone }) => (
            <div className="rounded-lg border border-[var(--border-default)] p-4" key={label}>
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-brand" />
                <StatusPill tone={tone}>{tone === "green" ? "Active" : "Configured"}</StatusPill>
              </div>
              <div className="mt-3 font-semibold">{label}</div>
              <div className="mt-1 text-sm text-muted">{note}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Audit Logs</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[var(--border-default)] p-3">Module</th>
                <th className="border-b border-[var(--border-default)] p-3">Action</th>
                <th className="border-b border-[var(--border-default)] p-3">Entity</th>
                <th className="border-b border-[var(--border-default)] p-3">Actor</th>
                <th className="border-b border-[var(--border-default)] p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="border-b border-[var(--border-default)] p-3 font-semibold">{log.module}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.action}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.entityType} / {log.entityId}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.actor}</td>
                  <td className="border-b border-[var(--border-default)] p-3">{log.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
