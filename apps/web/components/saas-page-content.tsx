"use client";

import { SaasConsole } from "./saas-console";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { SaasBillingWorkflowWorkspace } from "./reference-workspaces";
import { Building2, CreditCard, Layers3, RefreshCcw } from "lucide-react";

export function SaasPageContent() {
  return (
    <>
      <ReferenceModuleHeader
        eyebrow="SaaS"
        title="SaaS Billing"
        summary="Multi-company tenant setup, subscription plans, billing, license refresh and module entitlement controls."
        tabs={["Tenants", "Plans", "Billing", "License", "Modules"]}
        activeTab="Plans"
        actions={[
          { label: "Company", icon: Building2, tone: "primary" },
          { label: "Invoice", icon: CreditCard },
          { label: "Modules", icon: Layers3 },
          { label: "Refresh", icon: RefreshCcw },
        ]}
        stats={[
          { label: "Tenant", value: "PeopleOS", note: "Company" },
          { label: "Plan", value: "Standard", note: "Active" },
          { label: "Modules", value: "Plan-based", note: "Access" },
        ]}
      />
      <ReferenceFlowStrip module="SaaS" />
      <SaasBillingWorkflowWorkspace />
      <SaasConsole />
    </>
  );
}
