import { BadRequestException, Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { decrypt, sanitizeBankDetail } from "../../common/crypto.util";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContext } from "../../common/tenant-context";
import { CreatePayrollRunDto, CreateSalaryStructureDto } from "./dto/payroll.dto";
import {
  CreateBenefitApplicationDto,
  CreateBenefitClaimDto,
  CreateTaxDeclarationDto,
  CreateProofSubmissionDto,
  CreateAdditionalSalaryDto,
  DecideClaimDto,
  DecideProofDto,
} from "./dto/compliance.dto";
import {
  CreateRetentionBonusDto,
  DecideRetentionBonusDto,
  CreateSalaryWithholdingDto,
} from "./dto/new-features.dto";
import { SettingsService } from "../settings/settings.service";

type PtSlab = { upto: number; monthly: number };

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async salaryStructures(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const structures = await this.prisma.salaryStructure.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
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

  // ==========================================
  // Salary Structure Templates
  // ==========================================
  async listTemplates() {
    const templates = await this.prisma.salaryStructureTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "templates.list", templates);
  }

  async createTemplate(data: any) {
    const companyId = TenantContext.getTenantId();
    if (!companyId) throw new UnauthorizedException("No tenant context");
    
    const template = await this.prisma.salaryStructureTemplate.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE",
        components: data.components,
      },
    });
    await this.audit("payroll", "template.create", "salary_structure_templates", template.id, template);
    return response("payroll", "template.create", template);
  }

  async updateTemplate(id: string, data: any) {
    const template = await this.prisma.salaryStructureTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        components: data.components,
      },
    });
    await this.audit("payroll", "template.update", "salary_structure_templates", template.id, template);
    return response("payroll", "template.update", template);
  }

  async deleteTemplate(id: string) {
    await this.prisma.salaryStructureTemplate.delete({
      where: { id },
    });
    await this.audit("payroll", "template.delete", "salary_structure_templates", id, null);
    return response("payroll", "template.delete", { success: true });
  }

  // ==========================================
  // Payroll Component Configs
  // ==========================================
  async listComponentConfigs() {
    const configs = await this.prisma.payrollComponentConfig.findMany({
      orderBy: { name: "asc" },
    });
    return response("payroll", "component_configs.list", configs);
  }

  async createComponentConfig(data: any) {
    const companyId = TenantContext.getTenantId();
    if (!companyId) throw new UnauthorizedException("No tenant context");

    const config = await this.prisma.payrollComponentConfig.create({
      data: {
        ...data,
        companyId,
      },
    });
    await this.audit("payroll", "component_config.create", "payroll_component_configs", config.id, config);
    return response("payroll", "component_config.create", config);
  }

  async updateComponentConfig(id: string, data: any) {
    const config = await this.prisma.payrollComponentConfig.update({
      where: { id },
      data,
    });
    await this.audit("payroll", "component_config.update", "payroll_component_configs", config.id, config);
    return response("payroll", "component_config.update", config);
  }

  async deleteComponentConfig(id: string) {
    await this.prisma.payrollComponentConfig.delete({
      where: { id },
    });
    await this.audit("payroll", "component_config.delete", "payroll_component_configs", id, null);
    return response("payroll", "component_config.delete", { success: true });
  }

  async assignTemplate(id: string, data: { employeeIds: string[]; effectiveDate: string }) {
    const template = await this.prisma.salaryStructureTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException("Template not found");
    
    const components = template.components as Array<{ name: string; type: string; calcType: string; formula?: string; amount?: number }>;

    const passed: Array<{ employeeId: string; name: string }> = [];
    const failed: Array<{ employeeId: string; name: string; reason: string }> = [];

    for (const empId of data.employeeIds) {
      const employee = await this.prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) {
        failed.push({ employeeId: empId, name: empId, reason: "Employee not found" });
        continue;
      }
      const empName = `${employee.firstName} ${employee.lastName}`;

      // Get current CTC
      const currentStructure = await this.prisma.salaryStructure.findFirst({
        where: { employeeId: empId, status: "ACTIVE" },
        orderBy: { effectiveFrom: "desc" },
      });

      const ctc = currentStructure ? Number(currentStructure.annualCtc) : 0;
      if (ctc <= 0) {
        failed.push({ employeeId: empId, name: empName, reason: "No active salary structure with a CTC to apply formulas to" });
        continue;
      }
      
      let basic = 0;
      let hra = 0;
      let allowances = 0;
      let employeePf = 0;
      let professionalTax = 0;
      let tds = 0;
      let employerPf = 0;
      let esi = 0;
      
      for (const comp of components) {
        let amount = 0;
        
        if (comp.calcType === "FIXED" && comp.amount) {
          amount = comp.amount;
        } else if (comp.calcType === "FORMULA" && comp.formula) {
          const match = comp.formula.match(/^CTC\s*\*\s*([0-9.]+)$/);
          if (match && match[1]) {
            const multiplier = parseFloat(match[1]);
            amount = ctc * multiplier;
          }
        }
        
        const isDeduction = comp.type === "DEDUCTION";
        const nameLower = comp.name.toLowerCase();
        
        if (!isDeduction) {
          if (nameLower.includes("basic")) basic += amount;
          else if (nameLower.includes("hra")) hra += amount;
          else allowances += amount;
        } else {
          if (nameLower.includes("tds")) tds += amount;
          else if (nameLower.includes("pf") || nameLower.includes("provident")) {
            employeePf += amount; // We're simplifying based on name matching since there are limited fields in model
          } else if (nameLower.includes("esi")) {
            esi += amount;
          } else if (nameLower.includes("tax") || nameLower.includes("professional")) {
            professionalTax += amount;
          }
        }
      }
      
      const newStructure = await this.prisma.$transaction(async (tx) => {
        // Deactivate the old ACTIVE structure(s) so only one is ever ACTIVE per employee
        await tx.salaryStructure.updateMany({
          where: { employeeId: empId, status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
        return tx.salaryStructure.create({
          data: {
            employeeId: empId,
            effectiveFrom: new Date(data.effectiveDate),
            annualCtc: ctc,
            basic,
            hra,
            allowances,
            employerPf,
            employeePf,
            esi,
            professionalTax,
            tds,
            status: "ACTIVE",
          },
        });
      });
      passed.push({ employeeId: empId, name: empName });
      await this.audit("payroll", "salaryStructure.assign", "salary_structure", newStructure.id, newStructure);
    }

    return response("payroll", "template.assign", {
      success: failed.length === 0,
      passed,
      failed,
      count: passed.length,
    });
  }

  async runs(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const runs = await this.prisma.payrollRun.findMany({
      include: {
        company: true,
        payslips: isEmployee && user.employeeId
          ? { where: { employeeId: user.employeeId } }
          : true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return response("payroll", "runs", runs);
  }

  async createRun(data: CreatePayrollRunDto) {
    const companyId = TenantContext.getTenantId() || data.companyId;
    if (!companyId) throw new UnauthorizedException("No tenant context");
    const run = await this.prisma.payrollRun.upsert({
      where: {
        companyId_month_year: {
          companyId,
          month: data.month,
          year: data.year,
        },
      },
      update: {},
      create: {
        companyId,
        month: data.month,
        year: data.year,
        status: ApprovalStatus.DRAFT,
        processedBy: data.processedBy,
      },
    });
    await this.audit("payroll", "run.create", "payroll_run", run.id, run);
    return response("payroll", "run.create", run);
  }

  // ==========================================
  // Flexible Benefits
  // ==========================================
  async applyBenefit(data: CreateBenefitApplicationDto) {
    const app = await this.prisma.employeeBenefitApplication.create({
      data: {
        employeeId: data.employeeId,
        benefitName: data.benefitName,
        annualMax: data.annualMax,
        status: "APPROVED",
      },
      include: { employee: true },
    });
    await this.audit("payroll", "benefit.apply", "benefit_application", app.id, app);
    return response("payroll", "benefit.apply", app);
  }

  async listBenefitApplications(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const items = await this.prisma.employeeBenefitApplication.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "benefit_applications.list", items);
  }

  async claimBenefit(data: CreateBenefitClaimDto) {
    const claim = await this.prisma.employeeBenefitClaim.create({
      data: {
        employeeId: data.employeeId,
        benefitName: data.benefitName,
        claimAmount: data.claimAmount,
        claimDate: new Date(data.claimDate),
        receiptUrl: data.receiptUrl,
        status: ApprovalStatus.PENDING,
      },
      include: { employee: true },
    });
    await this.audit("payroll", "benefit.claim", "benefit_claim", claim.id, claim);
    return response("payroll", "benefit.claim", claim);
  }

  async listBenefitClaims(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const items = await this.prisma.employeeBenefitClaim.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: { employee: true },
      orderBy: { claimDate: "desc" },
    });
    return response("payroll", "benefit_claims.list", items);
  }

  async decideBenefitClaim(id: string, data: DecideClaimDto) {
    const claim = await this.prisma.employeeBenefitClaim.update({
      where: { id },
      data: { status: data.status },
      include: { employee: true },
    });
    await this.audit("payroll", "benefit.claim_decide", "benefit_claim", id, claim);
    return response("payroll", "benefit.claim_decide", claim);
  }

  // ==========================================
  // Tax Declarations & Proofs
  // ==========================================
  async submitTaxDeclaration(data: CreateTaxDeclarationDto) {
    const payrollRules = await this.settingsService.getPayrollRules();
    const declSettings = (payrollRules as any).declarations || {};

    if (declSettings.windowEnabled) {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // 1-12

      const fromDay = Number(declSettings.monthlyFromDay) || 1;
      const toDay = Number(declSettings.monthlyToDay) || 10;
      const cutoffMonth = Number(declSettings.fyCutoffMonth) || 1;
      const cutoffDay = Number(declSettings.fyCutoffDay) || 31;

      if (currentDay < fromDay || currentDay > toDay) {
        throw new BadRequestException(`Declaration window is only open from day ${fromDay} to ${toDay} of the month.`);
      }

      // FY cutoff: Indian FY runs Apr–Mar, so a cutoff in Jan–Mar means the
      // window closes once we pass that date within those end-of-FY months.
      const inFyTail = (m: number) => m >= 1 && m <= 3;
      if (inFyTail(cutoffMonth) && inFyTail(currentMonth)) {
        if (currentMonth > cutoffMonth || (currentMonth === cutoffMonth && currentDay > cutoffDay)) {
          throw new BadRequestException(`Declaration window is closed for this financial year (cutoff was ${cutoffDay}/${cutoffMonth}).`);
        }
      }
    }

    const declaration = await this.prisma.employeeTaxExemptionDeclaration.upsert({
      where: { employeeId: data.employeeId },
      update: {
        financialYear: data.financialYear,
        regime: data.regime,
        section80C: data.section80C || 0,
        section80D: data.section80D || 0,
        section24: data.section24 || 0,
        otherExemptions: data.otherExemptions || 0,
        status: "APPROVED",
      },
      create: {
        employeeId: data.employeeId,
        financialYear: data.financialYear,
        regime: data.regime,
        section80C: data.section80C || 0,
        section80D: data.section80D || 0,
        section24: data.section24 || 0,
        otherExemptions: data.otherExemptions || 0,
        status: "APPROVED",
      },
      include: { employee: true },
    });
    await this.audit("payroll", "tax.declaration_submit", "tax_exemption_declaration", declaration.id, declaration);
    return response("payroll", "tax.declaration_submit", declaration);
  }

  async getTaxDeclaration(employeeId: string, user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    if (isEmployee && user.employeeId && employeeId !== user.employeeId) {
      throw new ForbiddenException("Forbidden resource");
    }
    const dec = await this.prisma.employeeTaxExemptionDeclaration.findUnique({
      where: { employeeId },
    });
    if (!dec) throw new NotFoundException("Tax declaration not found");
    return response("payroll", "tax.declaration_get", dec);
  }

  async submitProof(data: CreateProofSubmissionDto, user?: AuthenticatedUser) {
    // Employees may only submit proofs for their own declaration
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    if (isEmployee && user?.employeeId && data.employeeId !== user.employeeId) {
      throw new ForbiddenException("You can only submit proofs for your own declaration");
    }
    const proof = await this.prisma.employeeTaxExemptionProofSubmission.create({
      data: {
        employeeId: data.employeeId,
        financialYear: data.financialYear,
        sectionType: data.sectionType,
        declaredAmount: data.declaredAmount,
        actualAmount: data.actualAmount,
        fileUrl: data.fileUrl,
        status: ApprovalStatus.PENDING,
      },
      include: { employee: true },
    });
    await this.audit("payroll", "tax.proof_submit", "tax_proof_submission", proof.id, proof);
    return response("payroll", "tax.proof_submit", proof);
  }

  async listProofs(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const items = await this.prisma.employeeTaxExemptionProofSubmission.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "tax_proofs.list", items);
  }

  async decideProof(id: string, data: DecideProofDto) {
    const proof = await this.prisma.employeeTaxExemptionProofSubmission.update({
      where: { id },
      data: {
        status: data.status,
        hrRemarks: data.hrRemarks,
        decidedAt: new Date(),
      },
      include: { employee: true },
    });
    // After any decision, recalculate per-section effective exemptions on the declaration
    await this.updateDeclarationFromProofs(proof.employeeId, proof.financialYear);
    await this.audit("payroll", "tax.proof_decide", "tax_proof_submission", id, proof);
    return response("payroll", "tax.proof_decide", proof);
  }

  /**
   * Recalculates effective exemption amounts in EmployeeTaxExemptionDeclaration based on
   * approved proofs for the given employee & financial year.
   *
   * Rule (Indian payroll practice):
   *   - For each section (80C, 80D, 24, other): if at least one APPROVED proof exists,
   *     effective exemption = min(declared, sum of APPROVED proof actualAmounts).
   *   - Sections with no proofs submitted retain the original declared amount.
   *   - Declaration status remains APPROVED (monthly TDS continues uninterrupted).
   */
  private async updateDeclarationFromProofs(employeeId: string, financialYear: string) {
    const declaration = await this.prisma.employeeTaxExemptionDeclaration.findUnique({
      where: { employeeId },
    });
    if (!declaration || declaration.financialYear !== financialYear) return;

    const approvedProofs = await this.prisma.employeeTaxExemptionProofSubmission.findMany({
      where: { employeeId, financialYear, status: ApprovalStatus.APPROVED },
    });

    const sumActual = (section: string) =>
      approvedProofs
        .filter((p) => p.sectionType === section)
        .reduce((sum, p) => sum + Number(p.actualAmount), 0);

    const hasProofs = (section: string) =>
      approvedProofs.some((p) => p.sectionType === section);

    const new80C = hasProofs("80C")
      ? Math.min(Number(declaration.section80C), sumActual("80C"))
      : Number(declaration.section80C);
    const new80D = hasProofs("80D")
      ? Math.min(Number(declaration.section80D), sumActual("80D"))
      : Number(declaration.section80D);
    const new24 = hasProofs("24")
      ? Math.min(Number(declaration.section24), sumActual("24"))
      : Number(declaration.section24);
    const newOther = hasProofs("other")
      ? Math.min(Number(declaration.otherExemptions), sumActual("other"))
      : Number(declaration.otherExemptions);

    await this.prisma.employeeTaxExemptionDeclaration.update({
      where: { employeeId },
      data: {
        section80C: new80C,
        section80D: new80D,
        section24: new24,
        otherExemptions: newOther,
      },
    });
  }

  // ==========================================
  // Additional Salary (Bonus / Recovery)
  // ==========================================
  async createAdditionalSalary(data: CreateAdditionalSalaryDto) {
    const item = await this.prisma.additionalSalary.create({
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        type: data.type,
        name: data.name,
        date: new Date(data.date),
      },
      include: { employee: true },
    });
    await this.audit("payroll", "additional_salary.create", "additional_salary", item.id, item);
    return response("payroll", "additional_salary.create", item);
  }

  async listAdditionalSalaries() {
    const items = await this.prisma.additionalSalary.findMany({
      include: { employee: true },
      orderBy: { date: "desc" },
    });
    return response("payroll", "additional_salaries.list", items);
  }

  // ==========================================
  // Compliance Math & Payroll Slip calculations
  // ==========================================
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

    // Statutory rates/slabs come from admin-configurable client rules (Settings → Payroll)
    const payrollRules = await this.settingsService.getPayrollRules();
    const num = (v: unknown, d: number) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const pfEnabled = payrollRules.pfEnabled !== false;
    const esiEnabled = payrollRules.esiEnabled !== false;
    const ptEnabled = payrollRules.professionalTaxEnabled !== false;
    const pfEmployeeRate = num(payrollRules.pfEmployeeRate, 12) / 100;
    const pfEmployerRate = num(payrollRules.pfEmployerRate, 12) / 100;
    const pfWageCeiling = num(payrollRules.pfWageCeiling, 15000);
    const esiEmployeeRate = num(payrollRules.esiEmployeeRate, 0.75) / 100;
    const esiEmployerRate = num(payrollRules.esiEmployerRate, 3.25) / 100;
    const esiWageCeiling = num(payrollRules.esiWageCeiling, 21000);
    const ptSlabs: PtSlab[] = Array.isArray(payrollRules.ptSlabs)
      ? (payrollRules.ptSlabs as PtSlab[]).filter((s) => s && Number.isFinite(Number(s.upto)))
          .sort((a, b) => Number(a.upto) - Number(b.upto))
      : [];

    const result = await this.prisma.$transaction(async (tx) => {
      const payslips = [];
      const startDate = new Date(run.year, run.month - 1, 1);
      const endDate = new Date(run.year, run.month, 0, 23, 59, 59, 999);

      // Recalculation safety: reverse loan repayments recorded by a previous
      // calculate() of this run, otherwise balances double-decrement.
      const priorRepayments = await tx.loanRepayment.findMany({
        where: { payslip: { payrollRunId: id } },
      });
      for (const repayment of priorRepayments) {
        await tx.employeeLoan.update({
          where: { id: repayment.loanId },
          data: { balanceAmount: { increment: repayment.amountPaid } },
        });
      }
      if (priorRepayments.length > 0) {
        await tx.loanRepayment.deleteMany({ where: { payslip: { payrollRunId: id } } });
      }

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

        // 1. Fetch Reimbursement Expenses
        const approvedExpenses = await tx.expense.findMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: { gte: startDate, lte: endDate },
          },
        });
        const expensePayout = approvedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        // 2. Fetch Additional Salaries (Bonus & Deductions)
        const additionalSalaries = await tx.additionalSalary.findMany({
          where: {
            employeeId: employee.id,
            date: { gte: startDate, lte: endDate },
          },
        });
        const additionsSum = additionalSalaries
          .filter((s) => s.type === "ADDITION")
          .reduce((sum, s) => sum + Number(s.amount), 0);
        let recoveryDeductionsSum = additionalSalaries
          .filter((s) => s.type === "DEDUCTION")
          .reduce((sum, s) => sum + Number(s.amount), 0);

        // P2 Loan EMI deductions
        const activeLoans = await tx.employeeLoan.findMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            balanceAmount: { gt: 0 },
            repaymentStart: { lte: endDate },
          },
        });

        let totalLoanEmiDeduction = 0;
        const loansToDeduct = [];
        for (const loan of activeLoans) {
          const balance = Number(loan.balanceAmount);
          const emi = Number(loan.emiAmount);
          const deductAmount = Math.min(balance, emi);
          if (deductAmount > 0) {
            totalLoanEmiDeduction += deductAmount;
            loansToDeduct.push({ loanId: loan.id, deductAmount });
          }
        }
        recoveryDeductionsSum += totalLoanEmiDeduction;

        // 3. Fetch Approved Benefit Claims
        const benefitClaims = await tx.employeeBenefitClaim.findMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: { gte: startDate, lte: endDate },
          },
        });
        const benefitsSum = benefitClaims.reduce((sum, c) => sum + Number(c.claimAmount), 0);

        // Fetch Penalty Logs (Loss of Pay)
        const penaltyLogs = await tx.penaltyLog.findMany({
          where: {
            employeeId: employee.id,
            month: run.month,
            year: run.year,
            status: "CONVERTED_LOP"
          }
        });
        const lopDays = penaltyLogs.reduce((sum, log) => sum + Number(log.deductionDays), 0);

        // Monthly salary components from structure (divided by 12)
        const monthlyBasic = this.monthly(structure.basic);
        const monthlyHra = this.monthly(structure.hra);
        const monthlyAllowances = this.monthly(structure.allowances);

        // 4. Statutory EPF — rates and wage ceiling are admin-configurable
        const pfBasicBasis = monthlyBasic > pfWageCeiling ? pfWageCeiling : monthlyBasic;
        const employeePf = pfEnabled ? Math.round(pfBasicBasis * pfEmployeeRate) : 0;
        const employerPf = pfEnabled ? Math.round(pfBasicBasis * pfEmployerRate) : 0;

        // Fetch approved corrections
        const approvedCorrections = await tx.payrollCorrection.findMany({
          where: {
            payslip: { employeeId: employee.id },
            status: ApprovalStatus.APPROVED,
            OR: [
              { targetRunId: null },
              { targetRunId: run.id },
            ],
          },
        });
        const correctionAdditions = approvedCorrections.reduce((sum, c) => sum + Number(c.amount), 0);

        // Update corrections with current run ID
        if (approvedCorrections.length > 0) {
          await tx.payrollCorrection.updateMany({
            where: {
              id: { in: approvedCorrections.map((c) => c.id) },
            },
            data: {
              targetRunId: run.id,
            },
          });
        }

        // Calculate Loss of Pay (LOP) amount
        const workingDays = new Date(run.year, run.month, 0).getDate();
        const lopAmount = lopDays > 0 ? Math.round((lopDays / workingDays) * (monthlyBasic + monthlyHra + monthlyAllowances)) : 0;

        // Gross salary before statutory deductions
        const grossSalary = monthlyBasic + monthlyHra + monthlyAllowances + additionsSum + benefitsSum + correctionAdditions;

        // 5. Statutory ESIC — rates and wage ceiling are admin-configurable
        let esi = 0;
        let employerEsi = 0;
        if (esiEnabled && grossSalary <= esiWageCeiling) {
          esi = Math.round(grossSalary * esiEmployeeRate);
          employerEsi = Math.round(grossSalary * esiEmployerRate);
        }

        // 6. Professional Tax — slab table is admin-configurable
        let professionalTax = 0;
        if (ptEnabled) {
          if (ptSlabs.length > 0) {
            const slab = ptSlabs.find((s) => grossSalary <= Number(s.upto)) || ptSlabs[ptSlabs.length - 1];
            professionalTax = num(slab?.monthly, 0);
          } else {
            // No PT slabs configured — use esiWageCeiling as threshold, 200 as default monthly
            professionalTax = grossSalary > num(payrollRules.pfWageCeiling, 15000) ? 200 : 0;
          }
        }

        // 7. Income Tax (TDS) Slabs Calculation
        let tds = 0;
        const taxDeclaration = await tx.employeeTaxExemptionDeclaration.findUnique({
          where: { employeeId: employee.id },
        });

        if (taxDeclaration) {
          const annualGross = grossSalary * 12;
          const regime = taxDeclaration.regime || "NEW";
          const taxCfg = (payrollRules as any).taxCalc || {};
          const stdDedNew = Number(taxCfg.standardDeductionNew ?? 75000);
          const stdDedOld = Number(taxCfg.standardDeductionOld ?? 50000);
          const cap80C = Number(taxCfg.section80CCap ?? 150000);
          const cap80D = Number(taxCfg.section80DCap ?? 25000);
          const cap24b = Number(taxCfg.section24bCap ?? 200000);
          const standardDeduction = regime === "NEW" ? stdDedNew : stdDedOld;

          let exemptions = 0;
          if (regime === "OLD") {
            const capped80C = Math.min(Number(taxDeclaration.section80C || 0), cap80C);
            const capped80D = Math.min(Number(taxDeclaration.section80D || 0), cap80D);
            const capped24 = Math.min(Number(taxDeclaration.section24 || 0), cap24b);
            exemptions = capped80C + capped80D + capped24 + Number(taxDeclaration.otherExemptions || 0);
          }

          const taxableIncome = Math.max(annualGross - standardDeduction - exemptions, 0);
          let taxLiability = 0;

          // Fetch slabs from database
          const dbSlabs = await tx.incomeTaxSlab.findMany({
            where: { regime },
            orderBy: { fromAmount: "asc" },
          });

          const rebateLimit = regime === "NEW" ? 700000 : 500000;

          if (taxableIncome > rebateLimit && dbSlabs.length > 0) {
            for (const slab of dbSlabs) {
              const from = Number(slab.fromAmount);
              const to = slab.toAmount ? Number(slab.toAmount) : Infinity;
              const rate = Number(slab.ratePercent) / 100;

              if (taxableIncome > from) {
                const taxableInThisSlab = Math.min(taxableIncome - from, to - from);
                taxLiability += taxableInThisSlab * rate;
              }
            }
          } else if (taxableIncome > rebateLimit) {
            // Fallback to old hardcoded slabs if DB slabs are empty
            if (regime === "NEW") {
              let temp = taxableIncome;
              if (temp > 1500000) {
                taxLiability += (temp - 1500000) * 0.30;
                temp = 1500000;
              }
              if (temp > 1200000) {
                taxLiability += (temp - 1200000) * 0.20;
                temp = 1200000;
              }
              if (temp > 1000000) {
                taxLiability += (temp - 1000000) * 0.15;
                temp = 1000000;
              }
              if (temp > 700000) {
                taxLiability += (temp - 700000) * 0.10;
                temp = 700000;
              }
              if (temp > 300000) {
                taxLiability += (temp - 300000) * 0.05;
              }
            } else {
              let temp = taxableIncome;
              if (temp > 1000000) {
                taxLiability += (temp - 1000000) * 0.30;
                temp = 1000000;
              }
              if (temp > 500000) {
                taxLiability += (temp - 500000) * 0.20;
                temp = 500000;
              }
              if (temp > 250000) {
                taxLiability += (temp - 250000) * 0.05;
              }
            }
          }

          // Cess calculation (4% cess on tax liability)
          const cess = taxLiability * 0.04;
          const totalAnnualTax = taxLiability + cess;
          tds = Math.round(totalAnnualTax / 12);
        } else {
          tds = this.monthly(structure.tds);
        }

        const finalGrossPay = grossSalary + expensePayout;
        const totalDeductions = employeePf + esi + professionalTax + tds + recoveryDeductionsSum + lopAmount;
        const netPay = finalGrossPay - totalDeductions;

        const withholding = await tx.salaryWithholding.findFirst({
          where: {
            employeeId: employee.id,
            status: "ACTIVE",
            fromDate: { lte: endDate },
            OR: [
              { toDate: null },
              { toDate: { gte: startDate } }
            ]
          }
        });

        const finalDeductions = withholding ? totalDeductions + netPay : totalDeductions;
        const finalNetPay = withholding ? 0 : netPay;

        const payslip = await tx.payslip.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: run.id,
              employeeId: employee.id,
            },
          },
          update: {
            grossPay: finalGrossPay,
            deductions: finalDeductions,
            netPay: finalNetPay,
            status: ApprovalStatus.APPROVED,
          },
          create: {
            payrollRunId: run.id,
            employeeId: employee.id,
            grossPay: finalGrossPay,
            deductions: finalDeductions,
            netPay: finalNetPay,
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
            ...(additionsSum > 0 ? [{ payslipId: payslip.id, type: "EARNING", name: "Additional Salary (Add)", amount: additionsSum }] : []),
            ...(benefitsSum > 0 ? [{ payslipId: payslip.id, type: "EARNING", name: "Flexible Benefits Claimed", amount: benefitsSum }] : []),
            ...(recoveryDeductionsSum > 0 ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Additional Salary (Ded)", amount: recoveryDeductionsSum }] : []),
            ...(lopAmount > 0 ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Loss of Pay", amount: lopAmount }] : []),
            ...approvedCorrections.map((c) => ({
              payslipId: payslip.id,
              type: "EARNING",
              name: `Correction: ${c.type}`,
              amount: c.amount,
            })),
            ...(totalLoanEmiDeduction > 0 ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Loan EMI Deduction", amount: totalLoanEmiDeduction }] : []),
            ...(withholding ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Salary Withholding", amount: netPay }] : []),
          ],
        });

        // Record repayments and update loan balances
        for (const repayment of loansToDeduct) {
          await tx.loanRepayment.create({
            data: {
              loanId: repayment.loanId,
              payslipId: payslip.id,
              amountPaid: repayment.deductAmount,
              paymentDate: new Date(),
            },
          });
          await tx.employeeLoan.update({
            where: { id: repayment.loanId },
            data: {
              balanceAmount: { decrement: repayment.deductAmount },
            },
          });
        }

        // Update Expenses status to PAID
        await tx.expense.updateMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: { gte: startDate, lte: endDate },
          },
          data: {
            status: ApprovalStatus.PAID,
            reimbursedAt: new Date(),
          },
        });

        // Update Benefit Claims to PAID
        await tx.employeeBenefitClaim.updateMany({
          where: {
            employeeId: employee.id,
            status: ApprovalStatus.APPROVED,
            claimDate: { gte: startDate, lte: endDate },
          },
          data: {
            status: ApprovalStatus.APPROVED,
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

  async payslips(id: string, user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const payslips = await this.prisma.payslip.findMany({
      where: {
        payrollRunId: id,
        employeeId: isEmployee && user.employeeId ? user.employeeId : undefined,
      },
      include: {
        employee: {
          include: { bankDetails: true }
        },
        components: true,
      },
      orderBy: { employeeId: "asc" },
    });
    const sanitized = payslips.map((payslip) => ({
      ...payslip,
      employee: { ...payslip.employee, bankDetails: sanitizeBankDetail(payslip.employee.bankDetails) },
    }));
    return response("payroll", "payslips", { payrollRunId: id, items: sanitized });
  }

  async getRunDetails(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    return run;
  }

  async generateBankFile(id: string) {
    const run = await this.getRunDetails(id);
    const payrollRules = await this.settingsService.getPayrollRules();
    const narrationPrefix = (payrollRules as any).bankExport?.narrationPrefix || "SALARY";
    
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthStr = monthNames[run.month - 1];
    
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: id, status: ApprovalStatus.APPROVED },
      include: { employee: { include: { bankDetails: true } } },
    });

    const rows = payslips
      .filter((payslip) => payslip.employee.bankDetails?.verificationStatus === "VERIFIED")
      .map((payslip) => {
        const bankDetails = payslip.employee.bankDetails!;
        const beneficiaryName = bankDetails.accountHolderName || `${payslip.employee.firstName} ${payslip.employee.lastName}`;
        const accountNumber = bankDetails.accountNumberEncrypted ? decrypt(bankDetails.accountNumberEncrypted) : "";
        const ifsc = bankDetails.ifsc || "";
        const amount = Number(payslip.netPay).toFixed(2);
        const narration = `${narrationPrefix} ${monthStr} ${run.year}`;
        
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
        
        return `${escapeCsv(beneficiaryName)},${escapeCsv(accountNumber)},${escapeCsv(ifsc)},${escapeCsv(amount)},${escapeCsv(narration)}`;
      });

    await this.audit("payroll", "run.bank_file_export", "payroll_run", id, { count: rows.length });

    const header = `"Beneficiary Name","Account Number","IFSC","Amount","Narration"`;
    const csvContent = [header, ...rows].join("\n");
    return csvContent;
  }

  async getSkippedBankFile(id: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: id, status: ApprovalStatus.APPROVED },
      include: { employee: { include: { bankDetails: true } } },
    });

    const skipped = payslips
      .filter((payslip) => payslip.employee.bankDetails?.verificationStatus !== "VERIFIED")
      .map((payslip) => ({
        employeeId: payslip.employeeId,
        employeeCode: payslip.employee.employeeCode,
        firstName: payslip.employee.firstName,
        lastName: payslip.employee.lastName,
        reason: payslip.employee.bankDetails ? "Bank details not verified" : "No bank details provided",
      }));

    return response("payroll", "bankExport.skipped", skipped);
  }

  // ==========================================
  // Income Tax Slabs
  // ==========================================
  async listTaxSlabs() {
    const slabs = await this.prisma.incomeTaxSlab.findMany({
      orderBy: [{ regime: "asc" }, { fromAmount: "asc" }],
    });
    return response("payroll", "taxSlabs.list", slabs);
  }

  async createTaxSlab(data: any) {
    const slab = await this.prisma.incomeTaxSlab.create({
      data: {
        regime: data.regime,
        fromAmount: data.fromAmount,
        toAmount: data.toAmount,
        ratePercent: data.ratePercent,
        surcharge: data.surcharge || 0,
      },
    });
    await this.audit("payroll", "taxSlab.create", "income_tax_slab", slab.id, slab);
    return response("payroll", "taxSlab.create", slab);
  }

  async deleteTaxSlab(id: string) {
    await this.prisma.incomeTaxSlab.delete({ where: { id } });
    return response("payroll", "taxSlab.delete", { success: true });
  }

  // ==========================================
  // Gratuity
  // ==========================================
  async calculateGratuity(employeeId: string, user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    if (isEmployee && user.employeeId && employeeId !== user.employeeId) {
      throw new ForbiddenException("Forbidden resource");
    }
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const yearsOfService = (Date.now() - employee.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const decimalPart = yearsOfService - Math.floor(yearsOfService);
    const completedYears = decimalPart >= 0.5 ? Math.ceil(yearsOfService) : Math.floor(yearsOfService);

    const structure = await this.prisma.salaryStructure.findFirst({
      where: { employeeId, status: "ACTIVE" },
      orderBy: { effectiveFrom: "desc" },
    });
    if (!structure) {
      throw new BadRequestException("Employee has no active salary structure to calculate basic pay");
    }

    const monthlyBasic = Number(structure.basic) / 12;

    const rule = await this.prisma.gratuityRule.findFirst({
      where: { companyId: employee.companyId },
    });
    const minYears = rule ? Number(rule.minYears) : 5;
    const multiplier = rule ? Number(rule.multiplier) : 15 / 26;

    let amount = 0;
    if (yearsOfService >= minYears) {
      amount = Math.round(monthlyBasic * multiplier * completedYears);
    }

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      yearsOfService,
      completedYears,
      lastBasic: monthlyBasic,
      amount,
      eligible: yearsOfService >= minYears,
    };
  }

  async createGratuity(data: any) {
    const calc = await this.calculateGratuity(data.employeeId);
    const gratuity = await this.prisma.gratuity.create({
      data: {
        employeeId: data.employeeId,
        yearsOfService: calc.yearsOfService,
        lastBasic: calc.lastBasic,
        amount: calc.amount,
        status: ApprovalStatus.PENDING,
      },
      include: { employee: true },
    });
    await this.audit("payroll", "gratuity.create", "gratuity", gratuity.id, gratuity);
    return response("payroll", "gratuity.create", gratuity);
  }

  async listGratuities() {
    const list = await this.prisma.gratuity.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "gratuities.list", list);
  }

  async decideGratuity(id: string, data: any) {
    const gratuity = await this.prisma.gratuity.findUnique({
      where: { id },
    });
    if (!gratuity) throw new NotFoundException("Gratuity record not found");
    if (gratuity.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Gratuity is already decided");
    }

    const updated = await this.prisma.gratuity.update({
      where: { id },
      data: {
        status: data.status,
        decidedBy: data.decidedByUserId,
        decidedAt: new Date(),
      },
      include: { employee: true },
    });

    await this.audit("payroll", "gratuity.decide", "gratuity", id, updated);
    return response("payroll", "gratuity.decide", updated);
  }

  // ==========================================
  // Payroll Corrections
  // ==========================================
  async createCorrection(data: any) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id: data.payslipId },
      include: { payrollRun: true },
    });
    if (!payslip) throw new NotFoundException("Payslip not found");
    if (payslip.payrollRun.lockedAt || payslip.payrollRun.status === ApprovalStatus.APPROVED) {
      throw new BadRequestException("Cannot apply correction to a locked payroll run");
    }

    const correction = await this.prisma.payrollCorrection.create({
      data: {
        payslipId: data.payslipId,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        targetRunId: data.targetRunId,
        status: ApprovalStatus.PENDING,
      },
      include: { payslip: { include: { employee: true } } },
    });

    await this.audit("payroll", "correction.create", "payroll_correction", correction.id, correction);
    return response("payroll", "correction.create", correction);
  }

  async listCorrections() {
    const list = await this.prisma.payrollCorrection.findMany({
      include: { payslip: { include: { employee: true } } },
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "corrections.list", list);
  }

  async decideCorrection(id: string, data: any) {
    const correction = await this.prisma.payrollCorrection.findUnique({
      where: { id },
    });
    if (!correction) throw new NotFoundException("Correction record not found");
    if (correction.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Correction is already decided");
    }

    const updated = await this.prisma.payrollCorrection.update({
      where: { id },
      data: {
        status: data.status,
        decidedBy: data.decidedByUserId,
        decidedAt: new Date(),
      },
      include: { payslip: { include: { employee: true } } },
    });

    await this.audit("payroll", "correction.decide", "payroll_correction", id, updated);
    return response("payroll", "correction.decide", updated);
  }

  // ==========================================
  // Retention Bonuses
  // ==========================================
  async createRetentionBonus(data: CreateRetentionBonusDto) {
    const companyId = TenantContext.getTenantId();
    if (!companyId) throw new UnauthorizedException("No tenant context");
    const bonus = await this.prisma.retentionBonus.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        bonusAmount: data.bonusAmount,
        bonusDate: new Date(data.bonusDate),
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
      include: { employee: true },
    });
    await this.audit("payroll", "retention_bonus.create", "retention_bonus", bonus.id, bonus);
    return response("payroll", "retention_bonus.create", bonus);
  }

  async listRetentionBonuses(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const list = await this.prisma.retentionBonus.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: { employee: true },
      orderBy: { bonusDate: "desc" },
    });
    return response("payroll", "retention_bonuses.list", list);
  }

  async decideRetentionBonus(id: string, data: DecideRetentionBonusDto) {
    const bonus = await this.prisma.retentionBonus.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!bonus) throw new NotFoundException("Retention bonus not found");
    if (bonus.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Retention bonus is already decided");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let additionalSalaryId = bonus.additionalSalaryId;
      if (data.status === ApprovalStatus.APPROVED) {
        const addSal = await tx.additionalSalary.create({
          data: {
            employeeId: bonus.employeeId,
            amount: bonus.bonusAmount,
            type: "ADDITION",
            name: `Retention Bonus - ${bonus.reason || "Scheduled Payout"}`,
            date: bonus.bonusDate,
          },
        });
        additionalSalaryId = addSal.id;
      }

      return tx.retentionBonus.update({
        where: { id },
        data: {
          status: data.status,
          additionalSalaryId,
        },
        include: { employee: true },
      });
    });

    await this.audit("payroll", "retention_bonus.decide", "retention_bonus", id, result);
    return response("payroll", "retention_bonus.decide", result);
  }

  // ==========================================
  // Salary Withholding
  // ==========================================
  async createWithholding(data: CreateSalaryWithholdingDto) {
    const companyId = TenantContext.getTenantId();
    if (!companyId) throw new UnauthorizedException("No tenant context");
    const withholding = await this.prisma.salaryWithholding.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        fromDate: new Date(data.fromDate),
        toDate: data.toDate ? new Date(data.toDate) : null,
        reason: data.reason,
        status: "ACTIVE",
      },
      include: { employee: true },
    });
    await this.audit("payroll", "withholding.create", "salary_withholding", withholding.id, withholding);
    return response("payroll", "withholding.create", withholding);
  }

  async listWithholdings(user?: AuthenticatedUser) {
    const isEmployee = user && !user.permissions.includes("payroll.approve");
    const list = await this.prisma.salaryWithholding.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: { employee: true },
      orderBy: { fromDate: "desc" },
    });
    return response("payroll", "withholdings.list", list);
  }

  async releaseWithholding(id: string) {
    const withholding = await this.prisma.salaryWithholding.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!withholding) throw new NotFoundException("Salary withholding record not found");
    if (withholding.status === "RELEASED") {
      throw new BadRequestException("Withholding is already released");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.salaryWithholding.update({
        where: { id },
        data: { status: "RELEASED" },
        include: { employee: true },
      });

      const components = await tx.payrollComponent.findMany({
        where: {
          name: "Salary Withholding",
          payslip: {
            employeeId: withholding.employeeId,
          },
        },
        include: { payslip: true },
      });

      for (const comp of components) {
        const existingCorrection = await tx.payrollCorrection.findFirst({
          where: {
            payslipId: comp.payslipId,
            type: "ARREAR",
          },
        });
        if (existingCorrection) continue;

        await tx.payrollCorrection.create({
          data: {
            payslipId: comp.payslipId,
            type: "ARREAR",
            amount: comp.amount,
            reason: `Release of withheld salary for run (Run ID: ${comp.payslip.payrollRunId})`,
            status: ApprovalStatus.APPROVED,
          },
        });
      }

      return updated;
    });

    await this.audit("payroll", "withholding.release", "salary_withholding", id, result);
    return response("payroll", "withholding.release", result);
  }

  async getForm16(employeeId: string, financialYear: number, user?: AuthenticatedUser) {
    // Own-record scoping: employees can only view their own Form 16
    const isSelf = user?.employeeId === employeeId;
    const isHrOrAdmin = user?.roles?.some((r) => ["HR_ADMIN", "SUPER_ADMIN"].includes(r));
    if (!isSelf && !isHrOrAdmin) {
      throw new BadRequestException("Access denied");
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { designation: true, department: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    // FY: April of financialYear to March of financialYear+1  (months 4..12 of FY, then 1..3 of FY+1)
    const fyMonths: Array<{ month: number; year: number }> = [];
    for (let m = 4; m <= 12; m++) fyMonths.push({ month: m, year: financialYear });
    for (let m = 1; m <= 3; m++) fyMonths.push({ month: m, year: financialYear + 1 });

    // Fetch all payslips in the FY months
    const payslips = await this.prisma.payslip.findMany({
      where: {
        employeeId,
        payrollRun: {
          OR: fyMonths.map(({ month, year }) => ({ month, year })),
        },
      },
      include: { components: true },
    });

    let grossPay = 0;
    let tdsDeducted = 0;

    for (const ps of payslips) {
      grossPay += Number(ps.grossPay || 0);
      // TDS stored as PayrollComponent with type "TDS"
      for (const comp of ps.components) {
        if (comp.type === "TDS" || comp.name?.toLowerCase().includes("tds")) {
          tdsDeducted += Number(comp.amount || 0);
        }
      }
    }

    // Standard deduction and tax calc params — read from admin-configurable settings
    const rules = await this.settingsService.getPayrollRules();
    const taxCalc = (rules as any).taxCalc || {};
    const standardDeduction = Number(taxCalc.standardDeductionNew ?? 75000);
    const cessPct = Number(taxCalc.cessPct ?? 0.04);
    const surchargePct = Number(taxCalc.surchargePct ?? 0.10);
    const surchargeThreshold = Number(taxCalc.surchargeThreshold ?? 5000000);

    const taxableIncome = Math.max(0, grossPay - standardDeduction);

    // Slab computation using admin-configurable tdsSlabs (New Regime)
    const tdsSlabs: Array<{ from: number; upto: number; rate: number }> = Array.isArray(rules.tdsSlabs)
      ? (rules.tdsSlabs as any[])
      : [
          { from: 0, upto: 300000, rate: 0 },
          { from: 300001, upto: 700000, rate: 5 },
          { from: 700001, upto: 1000000, rate: 10 },
          { from: 1000001, upto: 1200000, rate: 15 },
          { from: 1200001, upto: 1500000, rate: 20 },
          { from: 1500001, upto: 999999999, rate: 30 },
        ];

    const computeTax = (income: number): number => {
      let tax = 0;
      for (const slab of tdsSlabs) {
        const from = Number(slab.from);
        const upto = Number(slab.upto);
        const rate = Number(slab.rate) / 100;
        if (income > from) {
          tax += (Math.min(income, upto) - from) * rate;
        }
      }
      return tax;
    };

    const incomeTax = computeTax(taxableIncome);
    const surcharge = taxableIncome > surchargeThreshold ? incomeTax * surchargePct : 0;
    const cess = (incomeTax + surcharge) * cessPct;
    const totalTaxLiability = Math.round(incomeTax + surcharge + cess);
    const refundOrDue = tdsDeducted - totalTaxLiability;

    return response("payroll", "form16", {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      designation: employee.designation?.title || "",
      financialYear: `${financialYear}-${financialYear + 1}`,
      grossPay,
      standardDeduction,
      taxableIncome,
      incomeTax: Math.round(incomeTax),
      surcharge: Math.round(surcharge),
      cess: Math.round(cess),
      totalTaxLiability,
      tdsDeducted,
      refundOrDue,
      regime: "NEW",
      payslipCount: payslips.length,
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
