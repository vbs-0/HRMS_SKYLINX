"use client";

import React, { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReferenceModuleTabs } from "./reference-module-tabs";

export interface ReferenceAction {
  label: string;
  icon: React.ReactNode | LucideIcon;
  href?: string;
  tone?: "primary" | "light";
  onClick?: () => void;
}

export interface ReferenceStat {
  label: string;
  value: string;
  note: string;
}

export function ReferenceModuleHeader({
  eyebrow,
  title,
  summary,
  tabs,
  activeTab,
  actions = [],
  stats = [],
  onTabChange,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  monthValue,
  onMonthChange,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  tabs: string[];
  activeTab: string;
  actions?: ReferenceAction[];
  stats?: ReferenceStat[];
  onTabChange?: (tab: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  statusValue?: string;
  onStatusChange?: (val: string) => void;
  monthValue?: string;
  onMonthChange?: (val: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [localMonth, setLocalMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [localStatus, setLocalStatus] = useState("All");

  const sVal = searchValue !== undefined ? searchValue : localSearch;
  const setSVal = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setLocalSearch(val);
  };

  const mVal = monthValue !== undefined ? monthValue : localMonth;
  const setMVal = (val: string) => {
    if (onMonthChange) onMonthChange(val);
    else setLocalMonth(val);
  };

  const stVal = statusValue !== undefined ? statusValue : localStatus;
  const setStVal = (val: string) => {
    if (onStatusChange) onStatusChange(val);
    else setLocalStatus(val);
  };

  return (
    <section className="mb-5 rounded-lg border border-[var(--border-default)] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-default)] p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">{eyebrow}</div>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(({ label, icon, href, tone = "light", onClick }) => {
            const className =
              tone === "primary"
                ? "inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white cursor-pointer"
                : "inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-4 text-sm font-semibold text-[var(--text-secondary)] cursor-pointer";
            
            const isElement = React.isValidElement(icon);
            const RenderIcon = !isElement && (
              typeof icon === "function" ||
              (typeof icon === "object" && icon !== null && "$$typeof" in icon)
            ) ? (icon as any) : null;
            const content = (
              <>
                {RenderIcon ? <RenderIcon className="h-4 w-4" /> : icon}
                {label}
              </>
            );
            if (onClick) {
              return (
                <button className={className} onClick={onClick} key={label} type="button">
                  {content}
                </button>
              );
            }
            return (
              <a className={className} href={href || "#module-workspace"} key={label}>
                {content}
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <ReferenceModuleTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {stats.length ? (
          <div className="grid min-w-[360px] grid-cols-3 gap-2 max-sm:min-w-0 max-sm:grid-cols-1">
            {stats.map((stat) => (
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3" key={stat.label}>
                <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">{stat.label}</div>
                <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{stat.value}</div>
                <div className="text-[11px] text-muted">{stat.note}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_180px_150px_auto] gap-3 border-t border-[var(--surface-sunken)] p-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm text-muted">
          <Search className="h-4 w-4 text-[var(--color-brand-600)]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Search employee or record"
            value={sVal}
            onChange={(e) => setSVal(e.target.value)}
          />
        </label>
        <input
          value={mVal}
          onChange={(e) => setMVal(e.target.value)}
          className="min-h-10 rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none"
          type="month"
        />
        <select
          value={stVal}
          onChange={(e) => setStVal(e.target.value)}
          className="min-h-10 rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Active">Active</option>
        </select>
        <div className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-sunken)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
          <CheckCircle2 className="h-4 w-4 text-[var(--success-fg)]" />
          {activeTab}
        </div>
      </div>
    </section>
  );
}
