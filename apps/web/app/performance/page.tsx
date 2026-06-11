import { AppShell } from "../../components/app-shell";
import { PerformanceReviewWorkspace } from "../../components/reference-workspaces";
import { PerformanceConsole } from "../../components/performance-console";

export default function PerformancePage() {
  return (
    <AppShell title="Performance" subtitle="Goals, review readiness, ratings and appraisal cycle tracking.">
      <PerformanceReviewWorkspace />
      <PerformanceConsole />
    </AppShell>
  );
}
