import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ApprovalStatus, AttendanceStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const leaveRequests = await this.prisma.leaveRequest.findMany({
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: "desc" },
    });

    const regularizations = await this.prisma.attendanceRegularization.findMany({
      include: { employee: true, attendanceLog: true },
      orderBy: { createdAt: "desc" },
    });

    const items = [
      ...leaveRequests.map((item) => ({
        id: item.id,
        type: "Leave",
        module: "leave",
        requester: `${item.employee.firstName} ${item.employee.lastName}`,
        title: item.leaveType.name,
        amount: Number(item.days),
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...regularizations.map((item) => ({
        id: item.id,
        type: "Attendance",
        module: "attendance",
        requester: `${item.employee.firstName} ${item.employee.lastName}`,
        title: item.reason || "Missed Punch",
        amount: 0,
        status: item.status,
        createdAt: item.createdAt,
      }))
    ];

    const pending = items.filter((item) => ["PENDING", "DRAFT", "ACTIVE"].includes(String(item.status))).length;
    const approved = items.filter((item) => ["APPROVED", "PAID", "OFFERED"].includes(String(item.status))).length;

    return response("approvals", "summary", {
      total: items.length,
      pending,
      approved,
      rejected: items.filter((item) => item.status === "REJECTED").length,
      modules: [
        { module: "leave", count: leaveRequests.length },
        { module: "attendance", count: regularizations.length },
      ],
      items: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  }

  async decide(user: AuthenticatedUser, module: string, id: string, decision: "approve" | "reject") {
    const status = decision === "approve" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
    let result: unknown;

    if (module === "leave") {
      result = await this.prisma.leaveRequest.update({ where: { id }, data: { status, decidedAt: new Date() } });
    } else if (module === "attendance") {
      result = await this.prisma.$transaction(async (tx) => {
        const reg = await tx.attendanceRegularization.findUnique({ where: { id } });
        if (!reg) throw new NotFoundException("Regularization not found");

        if (decision === "approve") {
          let attendanceLogId = reg.attendanceLogId;
          
          if (!attendanceLogId) {
            if (!reg.requestedCheckInAt) {
              throw new BadRequestException("Requested check-in is required when attendance log is missing");
            }
            
            // startOfDay logic equivalent since we don't have this.startOfDay here
            const date = new Date(reg.requestedCheckInAt);
            date.setUTCHours(0, 0, 0, 0);

            const created = await tx.attendanceLog.upsert({
              where: {
                employeeId_date: {
                  employeeId: reg.employeeId,
                  date: date,
                },
              },
              update: {},
              create: {
                employeeId: reg.employeeId,
                date: date,
                status: AttendanceStatus.PRESENT,
                source: "REGULARIZATION",
              },
            });
            attendanceLogId = created.id;
          }

          await tx.attendanceLog.update({
            where: { id: attendanceLogId },
            data: {
              checkInAt: reg.requestedCheckInAt || undefined,
              checkOutAt: reg.requestedCheckOutAt || undefined,
              status: AttendanceStatus.PRESENT,
              approvedBy: user.sub,
            },
          });

          return await tx.attendanceRegularization.update({
            where: { id },
            data: { status, decidedAt: new Date(), decidedBy: user.sub, attendanceLogId },
          });
        } else {
          return await tx.attendanceRegularization.update({
            where: { id },
            data: { status, decidedAt: new Date(), decidedBy: user.sub },
          });
        }
      });
    } else if (module === "expenses") {
      result = await this.prisma.expense.update({ where: { id }, data: { status, hrApprovedBy: decision === "approve" ? user.sub : undefined } });
    } else if (module === "insurance") {
      result = await this.prisma.insuranceClaim.update({ where: { id }, data: { status, decidedBy: user.sub, decidedAt: new Date() } });
    } else if (module === "payroll") {
      result = await this.prisma.payrollRun.update({ where: { id }, data: { status, processedBy: user.sub, processedAt: new Date() } });
    } else {
      throw new NotFoundException("Approval module not found");
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        module: "approvals",
        action: `approval.${decision}`,
        entityType: module,
        entityId: id,
        newValueJson: JSON.parse(JSON.stringify(result)),
      },
    });

    return response("approvals", decision, result);
  }
}
