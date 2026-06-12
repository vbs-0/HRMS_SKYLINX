import { Body, Controller, Get, Param, Patch, Post, UseInterceptors, UploadedFile, Req, ForbiddenException, Query } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateEmployeeDocumentDto, VerifyEmployeeDocumentDto } from "./dto/document.dto";
import {
  CreateOnboardingTemplateDto,
  CreateSeparationTemplateDto,
  CreateExitInterviewDto,
  CreateFullAndFinalStatementDto,
  UpdateFfAssetDto,
} from "./dto/lifecycle.dto";
import { CreateEmployeeGradeDto, CreateEmploymentTypeDto } from "./dto/policy.dto";
import { EmployeesService } from "./employees.service";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CreatePromotionDto, DecidePromotionDto, CreateTransferDto, DecideTransferDto } from "./dto/career.dto";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { CreateLetterTemplateDto, RenderLetterDto } from "./dto/letter-template.dto";
import { CreateEmployeeLoanDto, DecideEmployeeLoanDto } from "./dto/employee-loan.dto";
import { UpsertBankDetailDto, VerifyBankDetailDto } from "./dto/bank-detail.dto";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions("employees.read")
  list() {
    return this.employeesService.list();
  }

  @Get("documents")
  @RequirePermissions("employees.read")
  documents() {
    return this.employeesService.documents();
  }

  @Post()
  @RequirePermissions("employees.create")
  create(@Body() body: CreateEmployeeDto) {
    return this.employeesService.create(body);
  }

  @Post("bulk-upload")
  @RequirePermissions("employees.create")
  bulkUpload(@Body() body: unknown) {
    return this.employeesService.bulkUpload(body);
  }

  @Get(":id")
  @RequirePermissions("employees.read")
  detail(@Param("id") id: string) {
    return this.employeesService.detail(id);
  }

  @Patch(":id")
  @RequirePermissions("employees.update")
  update(@Param("id") id: string, @Body() body: UpdateEmployeeDto) {
    return this.employeesService.update(id, body);
  }

  // Employee self-service (own record) or HR; ownership enforced in the service
  @Patch(":id/bank-details")
  @RequirePermissions("employees.read")
  upsertBankDetail(
    @Param("id") id: string,
    @Body() body: UpsertBankDetailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employeesService.upsertBankDetail(id, body, user);
  }

  @Patch(":id/bank-details/verify")
  @RequirePermissions("employees.approve")
  verifyBankDetail(
    @Param("id") id: string,
    @Body() body: VerifyBankDetailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employeesService.verifyBankDetail(id, body, user);
  }

  @Post(":id/documents/upload")
  @RequirePermissions("employees.update")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    const host = req.get("host");
    const fileUrl = `${req.protocol}://${host}/uploads/${file.filename}`;
    return { fileUrl };
  }

  @Post(":id/documents")
  @RequirePermissions("employees.update")
  uploadDocument(@Param("id") id: string, @Body() body: CreateEmployeeDocumentDto) {
    return this.employeesService.uploadDocument(id, body);
  }

  @Patch(":id/documents/:documentId/verify")
  @RequirePermissions("employees.approve")
  verifyDocument(@Param("id") id: string, @Param("documentId") documentId: string, @Body() body: VerifyEmployeeDocumentDto) {
    return this.employeesService.verifyDocument(id, documentId, body);
  }

  // ==========================================
  // Onboarding & Separation Lifecycle
  // ==========================================
  @Post("onboarding/templates")
  @RequirePermissions("employees.create")
  createOnboardingTemplate(@Body() body: CreateOnboardingTemplateDto) {
    return this.employeesService.createOnboardingTemplate(body);
  }

  @Get("onboarding/templates")
  @RequirePermissions("employees.read")
  listOnboardingTemplates() {
    return this.employeesService.listOnboardingTemplates();
  }

  @Post(":id/onboarding/start")
  @RequirePermissions("employees.update")
  startOnboarding(@Param("id") id: string, @Body("templateId") templateId: string) {
    return this.employeesService.startOnboarding(id, templateId);
  }

  @Post("separation/templates")
  @RequirePermissions("employees.create")
  createSeparationTemplate(@Body() body: CreateSeparationTemplateDto) {
    return this.employeesService.createSeparationTemplate(body);
  }

  @Get("separation/templates")
  @RequirePermissions("employees.read")
  listSeparationTemplates() {
    return this.employeesService.listSeparationTemplates();
  }

  @Post(":id/separation/start")
  @RequirePermissions("employees.update")
  startSeparation(@Param("id") id: string, @Body("templateId") templateId: string) {
    return this.employeesService.startSeparation(id, templateId);
  }

  @Post(":id/exit-interview")
  @RequirePermissions("employees.update")
  submitExitInterview(@Param("id") id: string, @Body() body: CreateExitInterviewDto) {
    return this.employeesService.submitExitInterview(id, body);
  }

  @Get(":id/exit-interview")
  @RequirePermissions("employees.read")
  getExitInterview(@Param("id") id: string) {
    return this.employeesService.getExitInterview(id);
  }

  @Post(":id/full-and-final")
  @RequirePermissions("employees.update")
  calculateFullAndFinal(@Param("id") id: string, @Body() body: CreateFullAndFinalStatementDto) {
    return this.employeesService.calculateFullAndFinal(id, body);
  }

  @Get(":id/full-and-final")
  @RequirePermissions("employees.read")
  getFullAndFinal(@Param("id") id: string) {
    return this.employeesService.getFullAndFinal(id);
  }

  @Patch("full-and-final/assets/:assetId")
  @RequirePermissions("employees.update")
  updateFfAsset(@Param("assetId") assetId: string, @Body() body: UpdateFfAssetDto) {
    return this.employeesService.updateFfAsset(assetId, body);
  }

  // ==========================================
  // Employee Grades & Employment Types CRUD
  // ==========================================
  @Post("grades")
  @RequirePermissions("employees.create")
  createGrade(@Body() body: CreateEmployeeGradeDto) {
    return this.employeesService.createGrade(body);
  }

  @Get("grades/:companyId")
  @RequirePermissions("employees.read")
  listGrades(@Param("companyId") companyId: string) {
    return this.employeesService.listGrades(companyId);
  }

  @Post("types")
  @RequirePermissions("employees.create")
  createEmploymentType(@Body() body: CreateEmploymentTypeDto) {
    return this.employeesService.createEmploymentType(body);
  }

  @Get("types/:companyId")
  @RequirePermissions("employees.read")
  listEmploymentTypes(@Param("companyId") companyId: string) {
    return this.employeesService.listEmploymentTypes(companyId);
  }

  // ==========================================
  // Promotions & Transfers
  // ==========================================
  @Get(":id/promotions")
  @RequirePermissions("employees.read")
  getPromotions(@Param("id") id: string) {
    return this.employeesService.getPromotions(id);
  }

  @Post(":id/promotions")
  @RequirePermissions("employees.create")
  createPromotion(@Param("id") id: string, @Body() body: CreatePromotionDto) {
    return this.employeesService.createPromotion(id, body);
  }

  @Patch("promotions/:promoId/decide")
  @RequirePermissions("employees.approve")
  decidePromotion(
    @Param("promoId") promoId: string,
    @Body() body: DecidePromotionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.employeesService.decidePromotion(promoId, body);
  }

  @Get(":id/transfers")
  @RequirePermissions("employees.read")
  getTransfers(@Param("id") id: string) {
    return this.employeesService.getTransfers(id);
  }

  @Post(":id/transfers")
  @RequirePermissions("employees.create")
  createTransfer(@Param("id") id: string, @Body() body: CreateTransferDto) {
    return this.employeesService.createTransfer(id, body);
  }

  @Patch("transfers/:transferId/decide")
  @RequirePermissions("employees.approve")
  decideTransfer(
    @Param("transferId") transferId: string,
    @Body() body: DecideTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.employeesService.decideTransfer(transferId, body);
  }

  @Get(":id/ff-suggestions")
  @RequirePermissions("employees.read")
  getFfSuggestions(
    @Param("id") id: string,
    @Query("resignationDate") resignationDate?: string,
    @Query("exitDate") exitDate?: string,
    @Query("noticeDays") noticeDays?: string,
  ) {
    return this.employeesService.getFfSuggestions(id, { resignationDate, exitDate, noticeDays });
  }

  // ==========================================
  // Letter Templates
  // ==========================================
  @Post("letter-templates")
  @RequirePermissions("employees.create")
  createLetterTemplate(@Body() body: CreateLetterTemplateDto) {
    return this.employeesService.createLetterTemplate(body);
  }

  @Get("letter-templates/list/:companyId")
  @RequirePermissions("employees.read")
  listLetterTemplates(@Param("companyId") companyId: string) {
    return this.employeesService.listLetterTemplates(companyId);
  }

  @Post("letter-templates/render")
  @RequirePermissions("employees.read")
  renderLetterTemplate(@Body() body: RenderLetterDto) {
    return this.employeesService.renderLetterTemplate(body);
  }

  // ==========================================
  // Employee Loans
  // ==========================================
  @Post("loans")
  @RequirePermissions("employees.create")
  createLoan(@Body() body: CreateEmployeeLoanDto) {
    return this.employeesService.createLoan(body);
  }

  @Get("loans/list/:employeeId")
  @RequirePermissions("employees.read")
  listLoans(
    @Param("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isEmployee = !user.permissions.includes("employees.approve") && !user.permissions.includes("payroll.approve");
    if (isEmployee && user.employeeId !== employeeId) {
      throw new ForbiddenException("You can only view your own loans");
    }
    return this.employeesService.listLoans(employeeId);
  }

  @Patch("loans/:id/decide")
  @RequirePermissions("employees.approve")
  decideLoan(@Param("id") id: string, @Body() body: DecideEmployeeLoanDto) {
    return this.employeesService.decideLoan(id, body);
  }
}
