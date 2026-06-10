import { Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
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

    const items = leaveRequests.map((item) => ({
      id: item.id,
      type: "Leave",
      module: "leave",
      requester: `${item.employee.firstName} ${item.employee.lastName}`,
      title: item.leaveType.name,
      amount: Number(item.days),
      status: item.status,
      createdAt: item.createdAt,
    }));

    const pending = items.filter((item) => ["PENDING", "DRAFT", "ACTIVE"].includes(String(item.status))).length;
    const approved = items.filter((item) => ["APPROVED", "PAID", "OFFERED"].includes(String(item.status))).length;

    return response("approvals", "summary", {
      total: items.length,
      pending,
      approved,
      rejected: items.filter((item) => item.status === "REJECTED").length,
      modules: [
        { module: "leave", count: leaveRequests.length },
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
      result = await this.prisma.attendanceRegularization.update({ where: { id }, data: { status, decidedAt: new Date(), decidedBy: user.sub } });
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
