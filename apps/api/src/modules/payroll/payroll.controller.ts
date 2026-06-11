import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
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
import {
  CreateGratuityRuleDto,
  CreateGratuityDto,
  DecideGratuityDto,
  CreatePayrollCorrectionDto,
  DecidePayrollCorrectionDto,
  CreateTaxSlabDto,
} from "./dto/new-features.dto";
import { Delete } from "@nestjs/common";

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
  @RequirePermissions("payroll.approve")
  listAdditionalSalaries() {
    return this.payrollService.listAdditionalSalaries();
  }

  // ==========================================
  // Income Tax Slabs
  // ==========================================
  @Get("tax-slabs")
  @RequirePermissions("payroll.read")
  listTaxSlabs() {
    return this.payrollService.listTaxSlabs();
  }

  @Post("tax-slabs")
  @RequirePermissions("payroll.configure")
  createTaxSlab(@Body() body: CreateTaxSlabDto) {
    return this.payrollService.createTaxSlab(body);
  }

  @Delete("tax-slabs/:id")
  @RequirePermissions("payroll.configure")
  deleteTaxSlab(@Param("id") id: string) {
    return this.payrollService.deleteTaxSlab(id);
  }

  // ==========================================
  // Gratuity
  // ==========================================
  @Get("gratuity")
  @RequirePermissions("payroll.approve")
  listGratuities() {
    return this.payrollService.listGratuities();
  }

  @Get("gratuity/:employeeId/calculate")
  @RequirePermissions("payroll.read")
  calculateGratuity(@Param("employeeId") employeeId: string) {
    return this.payrollService.calculateGratuity(employeeId);
  }

  @Post("gratuity")
  @RequirePermissions("payroll.create")
  createGratuity(@Body() body: CreateGratuityDto) {
    return this.payrollService.createGratuity(body);
  }

  @Patch("gratuity/:id/decide")
  @RequirePermissions("payroll.approve")
  decideGratuity(
    @Param("id") id: string,
    @Body() body: DecideGratuityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.payrollService.decideGratuity(id, body);
  }

  // ==========================================
  // Payroll Corrections
  // ==========================================
  @Get("corrections")
  @RequirePermissions("payroll.approve")
  listCorrections() {
    return this.payrollService.listCorrections();
  }

  @Post("corrections")
  @RequirePermissions("payroll.create")
  createCorrection(@Body() body: CreatePayrollCorrectionDto) {
    return this.payrollService.createCorrection(body);
  }

  @Patch("corrections/:id/decide")
  @RequirePermissions("payroll.approve")
  decideCorrection(
    @Param("id") id: string,
    @Body() body: DecidePayrollCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.payrollService.decideCorrection(id, body);
  }
}
