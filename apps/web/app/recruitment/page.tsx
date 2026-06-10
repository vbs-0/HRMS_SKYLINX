import { AppShell } from "../../components/app-shell";
import { RecruitmentConsole } from "../../components/recruitment-console";

export default function RecruitmentPage() {
  return (
    <AppShell title="Recruitment Pipeline" subtitle="Manage open job postings, candidate scorecards, interview panels, and issued offers.">
      <RecruitmentConsole />
    </AppShell>
  );
}
