import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { decrypt, sanitizeBankDetail } from "../../common/crypto.util";
import { PrismaService } from "../../prisma/prisma.service";
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

  async listBenefitApplications() {
    const items = await this.prisma.employeeBenefitApplication.findMany({
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

  async listBenefitClaims() {
    const items = await this.prisma.employeeBenefitClaim.findMany({
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

  async getTaxDeclaration(employeeId: string) {
    const dec = await this.prisma.employeeTaxExemptionDeclaration.findUnique({
      where: { employeeId },
    });
    if (!dec) throw new NotFoundException("Tax declaration not found");
    return response("payroll", "tax.declaration_get", dec);
  }

  async submitProof(data: CreateProofSubmissionDto) {
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

  async listProofs() {
    const items = await this.prisma.employeeTaxExemptionProofSubmission.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("payroll", "tax_proofs.list", items);
  }

  async decideProof(id: string, data: DecideProofDto) {
    const proof = await this.prisma.employeeTaxExemptionProofSubmission.update({
      where: { id },
      data: { status: data.status },
      include: { employee: true },
    });
    await this.audit("payroll", "tax.proof_decide", "tax_proof_submission", id, proof);
    return response("payroll", "tax.proof_decide", proof);
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

        // Monthly salary components from structure (divided by 12)
        const monthlyBasic = this.monthly(structure.basic);
        const monthlyHra = this.monthly(structure.hra);
        const monthlyAllowances = this.monthly(structure.allowances);

        // 4. Indian Statutory EPF Calculation (12% of Basic, optionally capped at basic of 15,000)
        // Check if capping is active (default is true for compliance)
        const pfBasicBasis = monthlyBasic > 15000 ? 15000 : monthlyBasic;
        const employeePf = Math.round(pfBasicBasis * 0.12);
        const employerPf = Math.round(pfBasicBasis * 0.12);

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

        // Gross salary before statutory deductions
        const grossSalary = monthlyBasic + monthlyHra + monthlyAllowances + additionsSum + benefitsSum + correctionAdditions;

        // 5. Indian Statutory ESIC Calculation (0.75% Employee, 3.25% Employer, if Gross <= 21,000)
        let esi = 0;
        let employerEsi = 0;
        if (grossSalary <= 21000) {
          esi = Math.round(grossSalary * 0.0075);
          employerEsi = Math.round(grossSalary * 0.0325);
        }

        // 6. Professional Tax (PT) Slab Calculation
        const professionalTax = grossSalary > 15000 ? 200 : 0;

        // 7. Income Tax (TDS) Slabs Calculation
        let tds = 0;
        const taxDeclaration = await tx.employeeTaxExemptionDeclaration.findUnique({
          where: { employeeId: employee.id },
        });

        if (taxDeclaration) {
          const annualGross = grossSalary * 12;
          const regime = taxDeclaration.regime || "NEW";
          const standardDeduction = regime === "NEW" ? 75000 : 50000;

          let exemptions = 0;
          if (regime === "OLD") {
            // Apply OLD regime tax deduction caps
            const capped80C = Math.min(Number(taxDeclaration.section80C || 0), 150000);
            const capped80D = Math.min(Number(taxDeclaration.section80D || 0), 25000);
            const capped24 = Math.min(Number(taxDeclaration.section24 || 0), 200000);
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
        const totalDeductions = employeePf + esi + professionalTax + tds + recoveryDeductionsSum;
        const netPay = finalGrossPay - totalDeductions;

        const payslip = await tx.payslip.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: run.id,
              employeeId: employee.id,
            },
          },
          update: {
            grossPay: finalGrossPay,
            deductions: totalDeductions,
            netPay,
            status: ApprovalStatus.APPROVED,
          },
          create: {
            payrollRunId: run.id,
            employeeId: employee.id,
            grossPay: finalGrossPay,
            deductions: totalDeductions,
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
            ...(additionsSum > 0 ? [{ payslipId: payslip.id, type: "EARNING", name: "Additional Salary (Add)", amount: additionsSum }] : []),
            ...(benefitsSum > 0 ? [{ payslipId: payslip.id, type: "EARNING", name: "Flexible Benefits Claimed", amount: benefitsSum }] : []),
            ...(recoveryDeductionsSum > 0 ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Additional Salary (Ded)", amount: recoveryDeductionsSum }] : []),
            ...approvedCorrections.map((c) => ({
              payslipId: payslip.id,
              type: "EARNING",
              name: `Correction: ${c.type}`,
              amount: c.amount,
            })),
            ...(totalLoanEmiDeduction > 0 ? [{ payslipId: payslip.id, type: "DEDUCTION", name: "Loan EMI Deduction", amount: totalLoanEmiDeduction }] : []),
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
    const sanitized = payslips.map((payslip) => ({
      ...payslip,
      employee: { ...payslip.employee, bankDetails: sanitizeBankDetail(payslip.employee.bankDetails) },
    }));
    return response("payroll", "payslips", { payrollRunId: id, items: sanitized });
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
        // Bank files need the real account number — decrypted only here,
        // behind the payroll export permission, and audit-logged.
        accountNumber: payslip.employee.bankDetails?.accountNumberEncrypted
          ? decrypt(payslip.employee.bankDetails.accountNumberEncrypted)
          : "",
      })),
    });
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
  async calculateGratuity(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const yearsOfService = (Date.now() - employee.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const completedYears = Math.floor(yearsOfService);

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
