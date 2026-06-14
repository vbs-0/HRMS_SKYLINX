import { AppShell } from "../../components/app-shell";
import { SetupWizardConsole } from "../../components/setup-wizard-console";
import { Card } from "../../components/ui";

export default function SetupPage() {
  return (
    <AppShell title="Setup Wizard" subtitle="Configure company profile, modules, policies and core HRMS readiness.">
      <Card>
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Client setup</div>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Setup Wizard</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Configure company branding, work week, role permissions, attendance settings and leave rules from one database-backed setup flow.
        </p>
      </Card>
      <SetupWizardConsole />
    </AppShell>
  );
}
