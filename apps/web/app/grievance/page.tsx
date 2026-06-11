import { AppShell } from "../../components/app-shell";
import { ReferenceModuleHeader } from "../../components/reference-module";
import { ReferenceFlowStrip } from "../../components/reference-sections";
import { GrievanceConsole } from "../../components/grievance-console";
import { AlertOctagon, HelpCircle } from "lucide-react";

export default function GrievancePage() {
  return (
    <AppShell title="Grievances" subtitle="File formal complaints, workplace policies resolution, and tracking.">
      <ReferenceModuleHeader
        eyebrow="Grievances"
        title="Formal Grievances Desk"
        summary="A secure, distinct channel to voice concerns, request policy reviews, and track dispute resolutions confidentially."
        tabs={["Dispute Logs"]}
        activeTab="Dispute Logs"
        actions={[
          { label: "File Grievance", icon: <AlertOctagon className="h-4 w-4" />, tone: "primary" },
          { label: "Help & Policy", icon: <HelpCircle className="h-4 w-4" /> },
        ]}
        stats={[
          { label: "Channel Type", value: "Confidential", note: "Anonymity supported" },
          { label: "HR Contacts", value: "Aarav Mehta", note: "Primary investigator" },
          { label: "Escalation Policy", value: "Level-3", note: "CEO Escalation" },
        ]}
      />
      <ReferenceFlowStrip module="Grievance" />
      <GrievanceConsole />
    </AppShell>
  );
}
