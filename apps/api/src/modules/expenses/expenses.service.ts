import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateExpenseDto, DecideExpenseDto } from "./dto/expense.dto";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const expenses = await this.prisma.expense.findMany({
      include: { employee: true },
      orderBy: { claimDate: "desc" },
    });
    return response("expenses", "list", expenses);
  }

  async create(data: CreateExpenseDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const expense = await this.prisma.expense.create({
      data: {
        employeeId: data.employeeId,
        category: data.category,
        amount: data.amount,
        receiptUrl: data.receiptUrl,
        claimDate: new Date(data.claimDate),
        status: ApprovalStatus.APPROVED,
      },
      include: { employee: true },
    });

    await this.audit("claim.create", expense.id, undefined, expense);
    return response("expenses", "claim.create", expense);
  }

  async managerApprove(id: string, data: DecideExpenseDto) {
    const expense = await this.findPending(id);
    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        managerApprovedBy: data.decidedBy,
        status: ApprovalStatus.HOLD,
      },
      include: { employee: true },
    });
    await this.audit("claim.manager_approve", id, expense, { expense: updated, note: data.note });
    return response("expenses", "claim.manager_approve", updated);
  }

  async hrApprove(id: string, data: DecideExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException("Expense claim not found");
    if (expense.status !== ApprovalStatus.PENDING && expense.status !== ApprovalStatus.HOLD) {
      throw new BadRequestException("Only pending or manager-approved claims can be HR approved");
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        hrApprovedBy: data.decidedBy,
        status: ApprovalStatus.APPROVED,
      },
      include: { employee: true },
    });
    await this.audit("claim.hr_approve", id, expense, { expense: updated, note: data.note });
    return response("expenses", "claim.hr_approve", updated);
  }

  async reject(id: string, data: DecideExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException("Expense claim not found");
    if (expense.status === ApprovalStatus.PAID || expense.status === ApprovalStatus.REJECTED) {
      throw new BadRequestException("Paid or rejected claims cannot be rejected again");
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: { status: ApprovalStatus.REJECTED },
      include: { employee: true },
    });
    await this.audit("claim.reject", id, expense, { expense: updated, decidedBy: data.decidedBy, note: data.note });
    return response("expenses", "claim.reject", updated);
  }

  async reimburse(id: string, data: DecideExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException("Expense claim not found");
    if (expense.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException("Only HR-approved claims can be reimbursed");
    }

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: ApprovalStatus.PAID,
        reimbursedAt: new Date(),
      },
      include: { employee: true },
    });
    await this.audit("claim.reimburse", id, expense, { expense: updated, reimbursedBy: data.decidedBy, note: data.note });
    return response("expenses", "claim.reimburse", updated);
  }

  private async findPending(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException("Expense claim not found");
    if (expense.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending claims can be manager approved");
    }
    return expense;
  }

  private async audit(action: string, entityId: string, oldValueJson?: unknown, newValueJson?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "expenses",
        action,
        entityType: "expense",
        entityId,
        oldValueJson: oldValueJson ?? undefined,
        newValueJson: newValueJson ?? undefined,
      },
    });
  }
}
