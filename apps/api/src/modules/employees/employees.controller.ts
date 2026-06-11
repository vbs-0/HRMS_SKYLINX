import { Body, Controller, Get, Param, Patch, Post, UseInterceptors, UploadedFile, Req } from "@nestjs/common";
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
}
