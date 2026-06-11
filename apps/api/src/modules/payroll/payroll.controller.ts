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
  CreateRetentionBonusDto,
  DecideRetentionBonusDto,
  CreateSalaryWithholdingDto,
} from "./dto/new-features.dto";
import { Delete } from "@nestjs/common";

@Controller("payroll")
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get("salary-structures")
  @RequirePermissions("payroll.read")
  salaryStructures(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.salaryStructures(user);
  }

  @Post("salary-structures")
  @RequirePermissions("payroll.configure")
  createSalaryStructure(@Body() body: CreateSalaryStructureDto) {
    return this.payrollService.createSalaryStructure(body);
  }

  @Get("runs")
  @RequirePermissions("payroll.read")
  runs(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.runs(user);
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
  payslips(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.payslips(id, user);
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
  listBenefitApplications(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.listBenefitApplications(user);
  }

  @Post("benefits/claim")
  @RequirePermissions("payroll.update")
  claimBenefit(@Body() body: CreateBenefitClaimDto) {
    return this.payrollService.claimBenefit(body);
  }

  @Get("benefits/claims")
  @RequirePermissions("payroll.read")
  listBenefitClaims(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.listBenefitClaims(user);
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
  getTaxDeclaration(@Param("employeeId") employeeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.getTaxDeclaration(employeeId, user);
  }

  @Post("tax-proofs")
  @RequirePermissions("payroll.update")
  submitProof(@Body() body: CreateProofSubmissionDto) {
    return this.payrollService.submitProof(body);
  }

  @Get("tax-proofs")
  @RequirePermissions("payroll.read")
  listProofs(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.listProofs(user);
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
  calculateGratuity(@Param("employeeId") employeeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.calculateGratuity(employeeId, user);
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

  // ==========================================
  // Retention Bonuses
  // ==========================================
  @Post("retention-bonuses")
  @RequirePermissions("payroll.create")
  createRetentionBonus(@Body() body: CreateRetentionBonusDto) {
    return this.payrollService.createRetentionBonus(body);
  }

  @Get("retention-bonuses")
  @RequirePermissions("payroll.read")
  listRetentionBonuses(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.listRetentionBonuses(user);
  }

  @Patch("retention-bonuses/:id/decide")
  @RequirePermissions("payroll.approve")
  decideRetentionBonus(
    @Param("id") id: string,
    @Body() body: DecideRetentionBonusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.payrollService.decideRetentionBonus(id, body);
  }

  // ==========================================
  // Salary Withholding
  // ==========================================
  @Post("withholdings")
  @RequirePermissions("payroll.create")
  createWithholding(@Body() body: CreateSalaryWithholdingDto) {
    return this.payrollService.createWithholding(body);
  }

  @Get("withholdings")
  @RequirePermissions("payroll.read")
  listWithholdings(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.listWithholdings(user);
  }

  @Post("withholdings/:id/release")
  @RequirePermissions("payroll.update")
  releaseWithholding(@Param("id") id: string) {
    return this.payrollService.releaseWithholding(id);
  }

  // ==========================================
  // Form 16 - Annual Tax Summary
  // ==========================================
  @Get("form16/:employeeId")
  @RequirePermissions("payroll.read")
  getForm16(
    @Param("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const now = new Date();
    // FY runs April–March; if current month is Jan–March it's still the previous FY start year
    const fy = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
    return this.payrollService.getForm16(employeeId, fy, user);
  }
}
