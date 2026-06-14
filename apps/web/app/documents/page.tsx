import { AppShell } from "../../components/app-shell";
import { DocumentUploadPanel } from "../../components/action-panels";
import { DocumentsTable } from "../../components/live-tables";
import { ReferenceModuleHeader } from "../../components/reference-module";
import { ReferenceFlowStrip } from "../../components/reference-sections";
import { DocumentsVerificationWorkspace } from "../../components/reference-workspaces";
import { Card } from "../../components/ui";
import { Download, FileCheck2, LockKeyhole, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <AppShell title="Employee Documents" subtitle="Upload, secure and verify employee identity, education, bank and employment documents.">
      <ReferenceModuleHeader
        eyebrow="Documents"
        title="Document Verification"
        summary="Upload, review, secure and verify employee documents with status tracking and HR validation."
        tabs={["Pending", "Verified", "Rejected", "Expiring"]}
        activeTab="Pending"
        actions={[
          { label: "Upload", icon: <Upload className="h-4 w-4" />, tone: "primary" },
          { label: "Verify", icon: <FileCheck2 className="h-4 w-4" /> },
          { label: "Security", icon: <LockKeyhole className="h-4 w-4" /> },
          { label: "Export", icon: <Download className="h-4 w-4" /> },
        ]}
        stats={[
          { label: "Storage", value: "Secure", note: "File API" },
          { label: "Review", value: "HR", note: "Verification" },
          { label: "Audit", value: "On", note: "Tracked" },
        ]}
      />
      <ReferenceFlowStrip module="Documents" />
      <DocumentsVerificationWorkspace />
      <DocumentUploadPanel />
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Document Verification</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase text-muted">
              <tr>
                <th className="border-b border-[var(--border-default)] p-3">Employee</th>
                <th className="border-b border-[var(--border-default)] p-3">Document</th>
                <th className="border-b border-[var(--border-default)] p-3">Expiry</th>
                <th className="border-b border-[var(--border-default)] p-3">File</th>
                <th className="border-b border-[var(--border-default)] p-3">Status</th>
              </tr>
            </thead>
            <DocumentsTable />
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
