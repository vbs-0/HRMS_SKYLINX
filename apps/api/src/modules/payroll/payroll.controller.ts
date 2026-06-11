import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PayrollService } from "./payroll.service";
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

@Controller("payroll")
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get("salary-structures")
  @RequirePermissions("payroll.read")
  salaryStructures() {
    return this.payrollService.salaryStructures();
  }

  @Post("salary-structures")
  @RequirePermissions("payroll.configure")
  createSalaryStructure(@Body() body: CreateSalaryStructureDto) {
    return this.payrollService.createSalaryStructure(body);
  }

  @Get("runs")
  @RequirePermissions("payroll.read")
  runs() {
    return this.payrollService.runs();
  }

  @Post("runs")
  @RequirePermissions("payroll.create")
  createRun(@Body() body: CreatePayrollRunDto) {
    return this.payrollService.createRun(body);
  }

  @Post("runs/:id/calculate")
  @RequirePermissions("payroll.update")
  calculate(@Param("id") id: string) {
    return this.payrollService.calculate(id);
  }

  @Post("runs/:id/lock")
  @RequirePermissions("payroll.approve")
  lock(@Param("id") id: string) {
    return this.payrollService.lock(id);
  }

  @Get("runs/:id/payslips")
  @RequirePermissions("payroll.read")
  payslips(@Param("id") id: string) {
    return this.payrollService.payslips(id);
  }

  @Post("runs/:id/bank-export")
  @RequirePermissions("payroll.export")
  bankExport(@Param("id") id: string) {
    return this.payrollService.bankExport(id);
  }

  // ==========================================
  // Flexible Benefits
  // ==========================================
  @Post("benefits/apply")
  @RequirePermissions("payroll.configure")
  applyBenefit(@Body() body: CreateBenefitApplicationDto) {
    return this.payrollService.applyBenefit(body);
  }

  @Get("benefits/applications")
  @RequirePermissions("payroll.read")
  listBenefitApplications() {
    return this.payrollService.listBenefitApplications();
  }

  @Post("benefits/claim")
  @RequirePermissions("payroll.update")
  claimBenefit(@Body() body: CreateBenefitClaimDto) {
    return this.payrollService.claimBenefit(body);
  }

  @Get("benefits/claims")
  @RequirePermissions("payroll.read")
  listBenefitClaims() {
    return this.payrollService.listBenefitClaims();
  }

  @Patch("benefits/claims/:id/decide")
  @RequirePermissions("payroll.approve")
  decideBenefitClaim(@Param("id") id: string, @Body() body: DecideClaimDto) {
    return this.payrollService.decideBenefitClaim(id, body);
  }

  // ==========================================
  // Tax Declarations & Proofs
  // ==========================================
  @Post("tax-declarations")
  @RequirePermissions("payroll.update")
  submitTaxDeclaration(@Body() body: CreateTaxDeclarationDto) {
    return this.payrollService.submitTaxDeclaration(body);
  }

  @Get("tax-declarations/:employeeId")
  @RequirePermissions("payroll.read")
  getTaxDeclaration(@Param("employeeId") employeeId: string) {
    return this.payrollService.getTaxDeclaration(employeeId);
  }

  @Post("tax-proofs")
  @RequirePermissions("payroll.update")
  submitProof(@Body() body: CreateProofSubmissionDto) {
    return this.payrollService.submitProof(body);
  }

  @Get("tax-proofs")
  @RequirePermissions("payroll.read")
  listProofs() {
    return this.payrollService.listProofs();
  }

  @Patch("tax-proofs/:id/decide")
  @RequirePermissions("payroll.approve")
  decideProof(@Param("id") id: string, @Body() body: DecideProofDto) {
    return this.payrollService.decideProof(id, body);
  }

  // ==========================================
  // Additional Salary (Bonus / Recovery)
  // ==========================================
  @Post("additional-salary")
  @RequirePermissions("payroll.update")
  createAdditionalSalary(@Body() body: CreateAdditionalSalaryDto) {
    return this.payrollService.createAdditionalSalary(body);
  }

  @Get("additional-salary")
  @RequirePermissions("payroll.read")
  listAdditionalSalaries() {
    return this.payrollService.listAdditionalSalaries();
  }
}
