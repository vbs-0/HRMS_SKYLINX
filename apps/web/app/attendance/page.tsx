import { AppShell } from "../../components/app-shell";
import { AttendanceConsole } from "../../components/attendance-console";

export default function AttendancePage() {
  return (
    <AppShell title="Attendance Management" subtitle="Check-in/out, shift rules, late marks, regularization, overtime and geo attendance.">
      <AttendanceConsole />
    </AppShell>
  );
}
