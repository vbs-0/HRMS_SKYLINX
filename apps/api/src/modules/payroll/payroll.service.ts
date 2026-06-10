import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePayrollRunDto, CreateSalaryStructureDto } from "./dto/payroll.dto";

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async salaryStructures() {
    const structures = await this.prisma.salaryStructure.findMany({
      include: { employee: true },
      orderBy: [{ effectiveFrom: "desc" }],
    });
    return response("payroll", "salaryStructures", structures);
  }

  async createSalaryStructure(data: CreateSalaryStructureDto) {
    const structure = await this.prisma.salaryStructure.create({
      data: {
        ...data,
        effectiveFrom: new Date(data.effectiveFrom),
        allowances: data.allowances || 0,
        employerPf: data.employerPf || 0,
        employeePf: data.employeePf || 0,
        esi: data.esi || 0,
        professionalTax: data.professionalTax || 0,
        tds: data.tds || 0,
      },
      include: { employee: true },
    });
    await this.audit("payroll", "salaryStructure.create", "salary_structure", structure.id, structure);
    return response("payroll", "salaryStructure.create", structure);
  }

  async runs() {
    const runs = await this.prisma.payrollRun.findMany({
      include: {
        company: true,
        payslips: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return response("payroll", "runs", runs);
  }

  async createRun(data: CreatePayrollRunDto) {
    const run = await this.prisma.payrollRun.upsert({
      where: {
        companyId_month_year: {
          companyId: data.companyId,
          month: data.month,
          year: data.year,
        },
      },
      update: {},
      create: {
        companyId: data.companyId,
        month: data.month,
        year: data.year,
        status: ApprovalStatus.DRAFT,
        processedBy: data.processedBy,
      },
    });
    await this.audit("payroll", "run.create", "payroll_run", run.id, run);
    return response("payroll", "run.create", run);
  }

  async calculate(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    if (run.status === ApprovalStatus.APPROVED || run.lockedAt) {
      throw new BadRequestException("Locked payroll runs cannot be recalculated");
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: run.companyId,
        status: "ACTIVE",
      },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const payslips = [];
      for (const employee of employees) {
        const structure = await tx.salaryStructure.findFirst({
          where: {
            employeeId: employee.id,
            status: "ACTIVE",
            effectiveFrom: { lte: new Date(run.year, run.month - 1, 1) },
          },
          orderBy: { effectiveFrom: "desc" },
        });
        if (!structure) continue;

        const startDate = new Date(run.year, run.month - 1, 1);
        const endDate = new Date(run.year, run.month, 0, 23, 59, 59, 999);
        const approvedExpenses = await tx.expense.findMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const expensePayout = approvedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        const monthlyBasic = this.monthly(structure.basic);
        const monthlyHra = this.monthly(structure.hra);
        const monthlyAllowances = this.monthly(structure.allowances);
        const employeePf = this.monthly(structure.employeePf);
        const esi = this.monthly(structure.esi);
        const professionalTax = this.monthly(structure.professionalTax);
        const tds = this.monthly(structure.tds);
        const grossPay = monthlyBasic + monthlyHra + monthlyAllowances + expensePayout;
        const deductions = employeePf + esi + professionalTax + tds;
        const netPay = grossPay - deductions;

        const payslip = await tx.payslip.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: run.id,
              employeeId: employee.id,
            },
          },
          update: {
            grossPay,
            deductions,
            netPay,
            status: ApprovalStatus.APPROVED,
          },
          create: {
            payrollRunId: run.id,
            employeeId: employee.id,
            grossPay,
            deductions,
            netPay,
            status: ApprovalStatus.APPROVED,
          },
        });

        await tx.payrollComponent.deleteMany({ where: { payslipId: payslip.id } });
        await tx.payrollComponent.createMany({
          data: [
            { payslipId: payslip.id, type: "EARNING", name: "Basic", amount: monthlyBasic },
            { payslipId: payslip.id, type: "EARNING", name: "HRA", amount: monthlyHra },
            { payslipId: payslip.id, type: "EARNING", name: "Allowances", amount: monthlyAllowances },
            { payslipId: payslip.id, type: "DEDUCTION", name: "Employee PF", amount: employeePf },
            { payslipId: payslip.id, type: "DEDUCTION", name: "ESI", amount: esi },
            { payslipId: payslip.id, type: "DEDUCTION", name: "Professional Tax", amount: professionalTax },
            { payslipId: payslip.id, type: "DEDUCTION", name: "TDS", amount: tds },
            ...(expensePayout > 0 ? [{ payslipId: payslip.id, type: "EARNING", name: "Expense Payout", amount: expensePayout }] : []),
          ],
        });

        await tx.expense.updateMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          data: {
            status: ApprovalStatus.PAID,
            reimbursedAt: new Date(),
          },
        });

        payslips.push(payslip);
      }

      const updatedRun = await tx.payrollRun.update({
        where: { id: run.id },
        data: {
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          lockedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          module: "payroll",
          action: "run.calculate",
          entityType: "payroll_run",
          entityId: run.id,
          newValueJson: { payslipCount: payslips.length },
        },
      });

      return { run: updatedRun, payslipCount: payslips.length };
    });

    return response("payroll", "run.calculate", result);
  }

  async lock(id: string) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException("Payroll run not found");
    if (run.lockedAt) throw new BadRequestException("Payroll run is already locked");

    const locked = await this.prisma.payrollRun.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        lockedAt: new Date(),
      },
      include: { payslips: true },
    });

    await this.prisma.payslip.updateMany({
      where: { payrollRunId: id },
      data: { status: ApprovalStatus.APPROVED },
    });

    const startDate = new Date(locked.year, locked.month - 1, 1);
    const endDate = new Date(locked.year, locked.month, 0, 23, 59, 59, 999);
    await this.prisma.expense.updateMany({
      where: {
        employeeId: { in: locked.payslips.map((p) => p.employeeId) },
        status: ApprovalStatus.APPROVED,
        claimDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      data: {
        status: ApprovalStatus.PAID,
        reimbursedAt: new Date(),
      },
    });
    await this.audit("payroll", "run.lock", "payroll_run", id, locked);
    return response("payroll", "run.lock", locked);
  }

  async payslips(id: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: id },
      include: {
        employee: {
          include: { bankDetails: true }
        },
        components: true,
      },
      orderBy: { employeeId: "asc" },
    });
    return response("payroll", "payslips", { payrollRunId: id, items: payslips });
  }

  async bankExport(id: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: id, status: ApprovalStatus.APPROVED },
      include: { employee: { include: { bankDetails: true } } },
    });
    return response("payroll", "bankExport", {
      payrollRunId: id,
      rows: payslips.map((payslip) => ({
        employeeCode: payslip.employee.employeeCode,
        employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        netPay: Number(payslip.netPay),
        bankName: payslip.employee.bankDetails?.bankName || "",
        ifsc: payslip.employee.bankDetails?.ifsc || "",
      })),
    });
  }

  private monthly(value: unknown) {
    return Math.round((Number(value) || 0) / 12);
  }

  private async audit(module: string, action: string, entityType: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module,
        action,
        entityType,
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
