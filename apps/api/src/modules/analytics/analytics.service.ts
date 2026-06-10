import { Injectable } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [employees, attendanceLogs, leaveRequests, payslips, expenses] = await Promise.all([
      this.prisma.employee.findMany({
        include: {
          department: true,
          location: true,
          salaryStructures: { orderBy: { effectiveFrom: "desc" }, take: 1 },
        },
      }),
      this.prisma.attendanceLog.findMany(),
      this.prisma.leaveRequest.findMany(),
      this.prisma.payslip.findMany(),
      this.prisma.expense.findMany(),
    ]);

    const activeEmployees = employees.filter((employee) => employee.status === "ACTIVE");
    const presentLogs = attendanceLogs.filter((log) => log.status === "PRESENT" || log.status === "LATE").length;
    const attendanceRate = attendanceLogs.length ? Math.round((presentLogs / attendanceLogs.length) * 100) : 0;
    const approvedLeaves = leaveRequests.filter((leave) => leave.status === "APPROVED").length;
    const leaveApprovalRate = leaveRequests.length ? Math.round((approvedLeaves / leaveRequests.length) * 100) : 0;
    const payrollNet = payslips.reduce((sum, payslip) => sum + Number(payslip.netPay), 0);


    const departmentMap = new Map<string, number>();
    for (const employee of activeEmployees) {
      const name = employee.department?.name || "Unassigned";
      departmentMap.set(name, (departmentMap.get(name) || 0) + 1);
    }

    const locationMap = new Map<string, number>();
    for (const employee of activeEmployees) {
      const name = employee.location?.city || "Unassigned";
      locationMap.set(name, (locationMap.get(name) || 0) + 1);
    }

    const monthlyPayroll = payslips.reduce((sum, payslip) => sum + Number(payslip.grossPay), 0);
    const annualCtc = employees.reduce((sum, employee) => sum + Number(employee.salaryStructures[0]?.annualCtc || 0), 0);

    return response("analytics", "summary", {
      metrics: {
        headcount: activeEmployees.length,
        attendanceRate,
        leaveApprovalRate,
        monthlyPayroll,
        payrollNet,
        pendingExpenses: expenses.filter((expense) => expense.status === "PENDING").length,
        annualCtc,
      },
      insights: [
        { title: "Workforce Strength", value: `${activeEmployees.length} active`, note: `${departmentMap.size} departments covered`, status: "STABLE" },
        { title: "Attendance Health", value: `${attendanceRate}%`, note: `${attendanceLogs.length} attendance logs analysed`, status: attendanceRate >= 85 ? "GOOD" : "REVIEW" },
        { title: "Payroll Load", value: `INR ${monthlyPayroll.toLocaleString("en-IN")}`, note: `${payslips.length} payslips in current sample`, status: "TRACKING" },
      ],
      departmentBreakdown: Array.from(departmentMap.entries()).map(([department, count]) => ({ department, count })),
      locationBreakdown: Array.from(locationMap.entries()).map(([location, count]) => ({ location, count })),
      trend: [
        { label: "Headcount", value: activeEmployees.length },
        { label: "Attendance", value: attendanceRate },
        { label: "Leave", value: leaveApprovalRate },
        { label: "Expenses", value: expenses.filter((expense) => expense.status === "PENDING").length },
      ],
      risks: [
        { name: "Pending Expenses", count: expenses.filter((expense) => expense.status === "PENDING").length, status: expenses.filter((expense) => expense.status === "PENDING").length > 0 ? "REVIEW" : "GOOD" },
        { name: "Leave Approval", count: leaveRequests.length - approvedLeaves, status: leaveRequests.length - approvedLeaves > 0 ? "REVIEW" : "GOOD" },
      ],
    });
  }
}
