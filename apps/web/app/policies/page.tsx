import { AppShell } from "../../components/app-shell";
import { PoliciesConsole } from "../../components/policies-console";

export const metadata = {
  title: "Policy Center · Skylinx PeopleOS",
  description: "Company policies — view, acknowledge, and manage HR, Leave, Conduct, POSH, and IT policies.",
};

export default function PoliciesPage() {
  return (
    <AppShell title="Policy Center" subtitle="Company policies, acknowledgment tracking, and compliance records.">
      <PoliciesConsole />
    </AppShell>
  );
}
