"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import Link from "next/link";
import { PartyPopper, Megaphone, FileCheck2, Pin } from "lucide-react";

interface Celebration {
  type: "BIRTHDAY" | "ANNIVERSARY" | "WORK_ANNIVERSARY";
  employeeName: string;
  message: string;
  date: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  category: string;
  publishedAt: string;
}

interface Policy {
  id: string;
  title: string;
  category: string;
  requiresAcknowledgment: boolean;
  acknowledged: boolean;
  status: string;
}

export function DashboardWidgets() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingPolicies, setPendingPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    apiFetch<Celebration[]>("/dashboard/celebrations")
      .then((res) => setCelebrations(res.data || []))
      .catch(() => undefined);

    apiFetch<Announcement[]>("/announcements")
      .then((res) => {
        const all = res.data || [];
        setAnnouncements(all.filter((a: Announcement) => a.isPinned).slice(0, 3));
      })
      .catch(() => undefined);

    apiFetch<Policy[]>("/policies")
      .then((res) => {
        const pending = (res.data || []).filter(
          (p: Policy) => p.requiresAcknowledgment && !p.acknowledged && p.status !== "ARCHIVED",
        );
        setPendingPolicies(pending.slice(0, 3));
      })
      .catch(() => undefined);
  }, []);

  const typeIcon: Record<string, string> = {
    BIRTHDAY: "🎂",
    ANNIVERSARY: "💍",
    WORK_ANNIVERSARY: "🎉",
  };

  return (
    <div className="grid content-start gap-4">
      {/* Celebrations */}
      {celebrations.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-3">
            <PartyPopper className="h-4 w-4" /> Today&apos;s Celebrations
          </h3>
          <div className="space-y-2">
            {celebrations.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                <span className="text-base leading-tight">{typeIcon[c.type] || "🎉"}</span>
                <div>
                  <span className="font-semibold">{c.employeeName}</span>
                  <span className="text-amber-700 ml-1">— {c.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Announcements */}
      {announcements.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-blue-800 mb-3">
            <Pin className="h-3.5 w-3.5" /> Pinned Announcements
          </h3>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="border-l-2 border-blue-400 pl-2">
                <p className="text-xs font-semibold text-slate-800">{ann.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{ann.body}</p>
              </div>
            ))}
          </div>
          <Link href="/notifications" className="mt-3 block text-[10px] text-blue-600 hover:underline">
            View all announcements →
          </Link>
        </div>
      )}

      {/* Policy Alerts */}
      {pendingPolicies.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-orange-800 mb-3">
            <FileCheck2 className="h-4 w-4" /> Policies Awaiting Acknowledgment
          </h3>
          <div className="space-y-2">
            {pendingPolicies.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-orange-900 font-medium truncate max-w-[160px]">{p.title}</span>
                <span className="text-[10px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0 ml-2">
                  {p.category}
                </span>
              </div>
            ))}
          </div>
          <Link href="/policies" className="mt-3 block text-[10px] text-orange-700 font-semibold hover:underline">
            Review & Acknowledge →
          </Link>
        </div>
      )}
    </div>
  );
}
