"use client";

import { useState, useEffect, FormEvent } from "react";
import { Bell, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "../../../lib/client-api";
import { ReferenceModuleHeader } from "../../../components/reference-module";

interface ReminderRule {
  id: string;
  event: string;
  daysOffset: number;
  channel: string;
  templateSubject: string;
  enabled: boolean;
}

export default function RemindersPage() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function loadRules() {
    try {
      const res = await apiFetch<ReminderRule[]>("/reminders");
      setRules(res.data || []);
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function toggleRule(rule: ReminderRule) {
    try {
      await apiFetch(`/reminders/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      );
      setMessage(`Rule "${rule.event.replace(/_/g, " ")}" ${!rule.enabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule.");
    }
  }

  async function processReminders() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch<{ processedCount: number }>("/reminders/process", {
        method: "POST",
      });
      setMessage(`Processed ${res.data?.processedCount ?? 0} reminder rules.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/reminders", {
        method: "POST",
        body: JSON.stringify({
          event: String(form.get("event")),
          daysOffset: Number(form.get("daysOffset")),
          channel: String(form.get("channel")),
          templateSubject: String(form.get("templateSubject")),
          templateBody: String(form.get("templateBody")),
        }),
      });
      formEl.reset();
      setShowAdd(false);
      setMessage("Reminder rule created successfully.");
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule.");
    } finally {
      setLoading(false);
    }
  }

  const CHANNEL_COLORS: Record<string, string> = {
    EMAIL: "bg-info-bg text-info-fg",
    SMS: "bg-success-bg text-success-fg",
    IN_APP: "bg-brand-50 text-brand-700",
  };

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Settings"
        title="Email Automations & Reminders"
        summary="Configure automated notifications for key HR events like birthdays, anniversaries, and document expiries."
        tabs={[]}
        activeTab=""
        onTabChange={() => undefined}
        actions={[
          {
            label: loading ? "Processing…" : "Process Now",
            icon: Bell,
            onClick: processReminders,
          },
          {
            label: "New Rule",
            icon: <Plus className="h-4 w-4" />,
            tone: "primary" as const,
            onClick: () => { setShowAdd((v) => !v); setMessage(""); setError(""); },
          },
        ]}
        stats={[
          { label: "Total Rules", value: String(rules.length), note: "Configured" },
          { label: "Active", value: String(rules.filter((r) => r.enabled).length), note: "Enabled" },
        ]}
      />

      {message && (
        <div className="mb-4 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg p-4 text-sm font-semibold text-danger-fg">
          {error}
        </div>
      )}

      {/* Add Rule Form */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-line bg-raised p-5 shadow-sm animate-in zoom-in-95 duration-150">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-primary">
            New Reminder Rule
          </h3>
          <form onSubmit={handleAddRule} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Event</label>
              <select
                name="event"
                required
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-raised"
              >
                <option value="">Select event</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="WORK_ANNIVERSARY">Work Anniversary</option>
                <option value="DOCUMENT_EXPIRY">Document Expiry</option>
                <option value="LEAVE_BALANCE">Leave Balance</option>
                <option value="PROBATION_END">Probation End</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Days Offset (before event)</label>
              <input
                name="daysOffset"
                type="number"
                defaultValue={7}
                min={0}
                max={365}
                required
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Channel</label>
              <select
                name="channel"
                required
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm bg-raised"
              >
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email Subject</label>
              <input
                name="templateSubject"
                placeholder="Happy Birthday, {{name}}!"
                required
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
              />
            </div>
            <div className="col-span-2 max-md:col-span-1">
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email Body</label>
              <input
                name="templateBody"
                placeholder="Dear {{name}}, wishing you a great day..."
                required
                className="min-h-10 w-full rounded-lg border border-line px-3 text-sm"
              />
            </div>
            <div className="col-span-full flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="min-h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-sunken"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {loading ? "Saving…" : "Create Rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Grid */}
      {rules.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="text-sm font-semibold text-text-secondary">No automation rules configured yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Click &ldquo;New Rule&rdquo; to add your first reminder.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-xl border bg-raised p-5 shadow-sm transition ${
                rule.enabled ? "border-line" : "border-line opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-text-primary capitalize">
                  {rule.event.replace(/_/g, " ")}
                </h3>
                <button
                  onClick={() => toggleRule(rule)}
                  className="flex-shrink-0 text-text-muted hover:text-brand transition"
                  title={rule.enabled ? "Disable" : "Enable"}
                >
                  {rule.enabled ? (
                    <ToggleRight className="h-6 w-6 text-success-fg" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Trigger</span>
                  <span className="font-semibold text-text-primary">{rule.daysOffset}d before</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Channel</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                      CHANNEL_COLORS[rule.channel] ?? "bg-sunken text-text-secondary"
                    }`}
                  >
                    {rule.channel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Subject</span>
                  <span className="font-semibold text-text-primary truncate max-w-[140px]" title={rule.templateSubject}>
                    {rule.templateSubject}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
