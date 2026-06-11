import { Injectable } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(panel: string) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [employeeCount, presentToday, pendingLeaves, payroll, pendingCompliance, pendingApprovals] =
      await Promise.all([
        this.prisma.employee.count({ where: { status: "ACTIVE" } }),
        this.prisma.attendanceLog.count({
          where: { date: { gte: startOfDay, lte: endOfDay }, status: { in: ["PRESENT", "LATE"] } },
        }),
        this.prisma.leaveRequest.count({ where: { status: "PENDING" } }),
        this.prisma.payslip.aggregate({ _sum: { netPay: true } }),
        this.prisma.auditLog.count({ where: { module: "compliance", action: "pending" } }),
        this.prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      ]);

    return response("dashboard", panel, {
      employeeCount,
      presentToday,
      pendingLeaves,
      payrollNetPay: Number(payroll._sum.netPay || 0),
      pendingCompliance,
      pendingApprovals,
    });
  }

  async celebrations() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = Jan, 5 = Jun, etc.
    const currentYear = today.getFullYear();

    const employees = await this.prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        joiningDate: true,
        designation: { select: { title: true } },
      },
    });

    const list = [];
    for (const emp of employees) {
      if (emp.dateOfBirth) {
        const dob = new Date(emp.dateOfBirth);
        if (dob.getMonth() === currentMonth) {
          list.push({
            id: `${emp.id}_bday`,
            employeeId: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            designation: emp.designation?.title || "Employee",
            type: "BIRTHDAY",
            date: dob.getDate(),
          });
        }
      }

      if (emp.joiningDate) {
        const joining = new Date(emp.joiningDate);
        if (joining.getMonth() === currentMonth) {
          const years = currentYear - joining.getFullYear();
          if (years >= 0) {
            list.push({
              id: `${emp.id}_anniv`,
              employeeId: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              designation: emp.designation?.title || "Employee",
              type: "ANNIVERSARY",
              date: joining.getDate(),
              years,
            });
          }
        }
      }
    }

    list.sort((a, b) => a.date - b.date);
    return response("dashboard", "celebrations", list);
  }
}
