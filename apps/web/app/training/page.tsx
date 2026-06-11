import { AppShell } from "../../components/app-shell";
import { TrainingConsole } from "../../components/training-console";
import { PlanGate } from "../../components/plan-gate";

export default function TrainingPage() {
  return (
    <AppShell title="Training & Skill Assessments" subtitle="Schedule courses, collect feedback, record results and perform designation skill gap analysis.">
      <PlanGate moduleName="Training & Skills" requiredPlan="Standard">
        <TrainingConsole />
      </PlanGate>
    </AppShell>
  );
}
