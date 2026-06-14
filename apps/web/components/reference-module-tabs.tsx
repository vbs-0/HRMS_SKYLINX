"use client";

import * as React from "react";

export function ReferenceModuleTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap rounded-full bg-[var(--surface-sunken)] p-1">
      {tabs.map((tab) => (
        <button
          className={`min-h-9 rounded-full px-4 text-sm font-semibold ${
            tab === activeTab ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]"
          }`}
          key={tab}
          type="button"
          onClick={() => onTabChange?.(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
