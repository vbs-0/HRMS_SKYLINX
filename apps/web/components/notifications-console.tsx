"use client";

import { useState } from "react";
import { NotificationsTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { NotificationsWorkflowWorkspace } from "./reference-workspaces";
import { Card } from "./ui";

const notificationTemplates = [
  {
    title: "Payroll Run Verification Alert",
    trigger: "Triggered on payroll cut-off dates",
    channels: ["Email", "In-App"],
    subject: "May payroll verification closes today",
    body: "Please review pending payroll items before locking the run.",
  },
  {
    title: "Leave Request Approval Pending",
    trigger: "Triggered when employee submits a leave request",
    channels: ["Email", "Push"],
    subject: "Leave approval pending",
    body: "[Employee Name] has a [Leave Type] request awaiting action.",
  },
  {
    title: "Daily Attendance Check-out Reminder",
    trigger: "Triggered at shift end if no check-out log is found",
    channels: ["Push"],
    subject: "Attendance reminder",
    body: "You have not completed check-out for today.",
  },
  {
    title: "HR Announcement Broadcast",
    trigger: "Triggered when posting a pinned company announcement",
    channels: ["Email", "In-App"],
    subject: "[Announcement Title]",
    body: "[Announcement Body Summary]",
  },
];

export function NotificationsConsole() {
  const [activeTab, setActiveTab] = useState("Queue");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Notifications"
        title="Notifications & Alerts"
        summary="Inspect and receive email, push, and in-app alerts for updates in attendance, leaves, payroll, and announcements."
        tabs={["Queue", "Email", "Push", "Templates"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        statusValue={status}
        onStatusChange={setStatus}
      />
      <ReferenceFlowStrip module="Notifications" />
      <NotificationsWorkflowWorkspace />

      {activeTab === "Templates" ? (
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification Templates</h2>
            <p className="text-xs text-muted">Pre-configured templates for automated alerts triggered by payroll, leave, attendance, and social updates.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {notificationTemplates.map((template) => (
              <div className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-sm" key={template.title}>
                <div className="flex items-center justify-between border-b border-[var(--surface-sunken)] pb-2">
                  <span className="font-semibold text-[var(--text-primary)]">{template.title}</span>
                  <div className="flex gap-1">
                    {template.channels.map((ch) => (
                      <span className="rounded bg-[var(--color-brand-50)] px-2 py-0.5 text-[10px] font-bold text-brand" key={ch}>
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-xs">
                  <div className="mb-2">
                    <strong className="text-[var(--text-muted)] uppercase text-[9px] block">Trigger Condition</strong>
                    <span className="text-ink font-semibold">{template.trigger}</span>
                  </div>
                  <div className="mb-2">
                    <strong className="text-[var(--text-muted)] uppercase text-[9px] block">Subject Line</strong>
                    <span className="text-ink font-semibold">{template.subject}</span>
                  </div>
                  <div>
                    <strong className="text-[var(--text-muted)] uppercase text-[9px] block">Message Body</strong>
                    <span className="text-muted block mt-0.5 rounded bg-[var(--surface-sunken)] p-2 border border-[var(--border-subtle)]">{template.body}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Notification Queue</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
                <tr>
                  <th className="border-b border-[var(--border-default)] p-3">Recipient</th>
                  <th className="border-b border-[var(--border-default)] p-3">Channel</th>
                  <th className="border-b border-[var(--border-default)] p-3">Message</th>
                  <th className="border-b border-[var(--border-default)] p-3">Queued</th>
                  <th className="border-b border-[var(--border-default)] p-3">Sent</th>
                  <th className="border-b border-[var(--border-default)] p-3">Status</th>
                </tr>
              </thead>
              <NotificationsTable activeTab={activeTab} search={search} status={status} />
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
