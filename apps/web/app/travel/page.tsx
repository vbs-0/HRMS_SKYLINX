import { AppShell } from "../../components/app-shell";
import { TravelConsole } from "../../components/travel-console";
import { PlanGate } from "../../components/plan-gate";

export default function TravelPage() {
  return (
    <AppShell title="Travel Desk" subtitle="Manage business trip requests, plan flight and hotel itineraries, and process employee cash advances.">
      <PlanGate moduleName="Travel Management" requiredPlan="Standard">
        <TravelConsole />
      </PlanGate>
    </AppShell>
  );
}
