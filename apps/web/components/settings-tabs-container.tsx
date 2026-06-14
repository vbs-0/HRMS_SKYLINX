"use client";

import { useState } from "react";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { SettingsSetupWorkspace } from "./reference-workspaces";
import { SettingsConsole } from "./settings-console";
import { LeaveSettingsConsole } from "./leave-settings-console";
import { OrganizationSettingsConsole } from "./organization-settings-console";
import { Building2, Download, SlidersHorizontal } from "lucide-react";

export function SettingsTabsContainer() {
  const [activeTab, setActiveTab] = useState("Company Profile");

  return (
    <>
      <ReferenceModuleHeader
        eyebrow="Admin"
        title="Company Settings"
        summary="Configure company profile, work week, departments, roles, permissions, branding, modules and import/export controls."
        tabs={["Company Profile", "Organization", "Modules", "Roles", "Attendance", "Leave", "Payroll"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: "Company", icon: Building2, tone: "primary" },
          { label: "Modules", icon: SlidersHorizontal },
          { label: "Export", icon: Download },
        ]}
        stats={[
          { label: "Branding", value: "PeopleOS", note: "Logo locked" },
          { label: "Access", value: "RBAC", note: "Permissions" },
          { label: "Modules", value: "Live", note: "Controls" },
        ]}
      />
      <ReferenceFlowStrip module="Settings" />

      {activeTab === "Company Profile" ? (
        <>
          <SettingsSetupWorkspace />
          <SettingsConsole />
        </>
      ) : activeTab === "Leave" ? (
        <LeaveSettingsConsole />
      ) : activeTab === "Organization" ? (
        <OrganizationSettingsConsole />
      ) : (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-10 text-center text-sm font-semibold text-muted">
          Configuration settings for {activeTab} will be integrated based on active license subscriptions.
        </div>
      )}
    </>
  );
}
