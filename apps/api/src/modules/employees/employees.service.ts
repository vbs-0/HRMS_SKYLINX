import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateEmployeeDocumentDto, VerifyEmployeeDocumentDto } from "./dto/document.dto";
import { CreateEmployeeGradeDto, CreateEmploymentTypeDto } from "./dto/policy.dto";
import {
  CreateOnboardingTemplateDto,
  CreateSeparationTemplateDto,
  CreateExitInterviewDto,
  CreateFullAndFinalStatementDto,
  UpdateFfAssetDto,
} from "./dto/lifecycle.dto";
import { encrypt, decrypt, sanitizeBankDetail } from "../../common/crypto.util";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const employees = await this.prisma.employee.findMany({
      orderBy: { employeeCode: "asc" },
      include: {
        department: true,
        designation: true,
        location: true,
        documents: true,
        grade: true,
        employmentTypeRelation: true,
      },
    });

    const decrypted = employees.map(emp => ({
      ...emp,
      panNumber: emp.panNumber ? decrypt(emp.panNumber) : null,
      providentFundAccount: emp.providentFundAccount ? decrypt(emp.providentFundAccount) : null,
    }));

    return response("employees", "list", decrypted);
  }

  async create(data: CreateEmployeeDto) {
    const joiningDate = new Date(data.joiningDate);
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    const encryptedPan = data.panNumber ? encrypt(data.panNumber) : undefined;
    const encryptedPf = data.providentFundAccount ? encrypt(data.providentFundAccount) : undefined;

    const employee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          ...data,
          joiningDate,
          dateOfBirth,
          panNumber: encryptedPan,
          providentFundAccount: encryptedPf,
        },
      });

      const leaveTypes = await tx.leaveType.findMany({
        where: {
          companyId: data.companyId,
          status: "ACTIVE",
        },
      });

      if (leaveTypes.length) {
        const year = joiningDate.getFullYear();
        await tx.leaveBalance.createMany({
          data: leaveTypes.map((leaveType) => ({
            employeeId: created.id,
            leaveTypeId: leaveType.id,
            year,
            openingBalance: leaveType.annualQuota,
            accrued: leaveType.annualQuota,
            used: 0,
            carriedForward: 0,
            available: leaveType.annualQuota,
          })),
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          module: "employees",
          action: "employee.create",
          entityType: "employee",
          entityId: created.id,
          newValueJson: { employee: created, leaveBalancesCreated: leaveTypes.length },
        },
      });

      return created;
    });
    return response("employees", "create", employee);
  }

  async documents() {
    const documents = await this.prisma.employeeDocument.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("employees", "documents", documents);
  }

  bulkUpload(data: unknown) {
    return response("employees", "bulkUpload", data);
  }

  async detail(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        location: true,
        documents: true,
        bankDetails: true,
        leaveBalances: true,
        salaryStructures: true,
        grade: true,
        employmentTypeRelation: true,
      },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    const decrypted = {
      ...employee,
      panNumber: employee.panNumber ? decrypt(employee.panNumber) : null,
      providentFundAccount: employee.providentFundAccount ? decrypt(employee.providentFundAccount) : null,
      bankDetails: sanitizeBankDetail(employee.bankDetails),
    };

    return response("employees", "detail", decrypted);
  }

  async update(id: string, data: UpdateEmployeeDto) {
    const encryptedPan = data.panNumber ? encrypt(data.panNumber) : undefined;
    const encryptedPf = data.providentFundAccount ? encrypt(data.providentFundAccount) : undefined;

    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        panNumber: encryptedPan,
        providentFundAccount: encryptedPf,
      },
    });

    const decrypted = {
      ...employee,
      panNumber: employee.panNumber ? decrypt(employee.panNumber) : null,
      providentFundAccount: employee.providentFundAccount ? decrypt(employee.providentFundAccount) : null,
    };

    return response("employees", "update", decrypted);
  }

  async uploadDocument(id: string, data: CreateEmployeeDocumentDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException("Employee not found");

    const document = await this.prisma.employeeDocument.create({
      data: {
        employeeId: id,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        verificationStatus: "VERIFIED",
      },
      include: { employee: true },
    });
    await this.audit("employees", "documents.upload", "employee_document", document.id, document);
    return response("employees", "documents.upload", document);
  }

  async verifyDocument(id: string, documentId: string, data: VerifyEmployeeDocumentDto) {
    const document = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        employeeId: id,
        verificationStatus: "VERIFIED",
        verifiedBy: data.verifiedBy,
        verifiedAt: new Date(),
      },
      include: { employee: true },
    });
    await this.audit("employees", "documents.verify", "employee_document", document.id, document);
    return response("employees", "documents.verify", document);
  }

  async createOnboardingTemplate(data: CreateOnboardingTemplateDto) {
    const template = await this.prisma.employeeOnboardingTemplate.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        designationId: data.designationId,
        activities: {
          create: data.activities.map((a) => ({
            title: a.title,
            description: a.description,
            assignedRole: a.assignedRole,
          })),
        },
      },
      include: {
        activities: true,
      },
    });
    return response("employees", "onboarding.template.create", template);
  }

  async listOnboardingTemplates() {
    const templates = await this.prisma.employeeOnboardingTemplate.findMany({
      include: { activities: true },
      orderBy: { createdAt: "desc" },
    });
    return response("employees", "onboarding.templates.list", templates);
  }

  async startOnboarding(employeeId: string, templateId: string) {
    const template = await this.prisma.employeeOnboardingTemplate.findUnique({
      where: { id: templateId },
      include: { activities: true },
    });
    if (!template) throw new NotFoundException("Onboarding Template not found");

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { status: "ACTIVE" },
    });

    return response("employees", "onboarding.start", {
      employeeId,
      templateName: template.name,
      tasksInitialized: template.activities.length,
      activities: template.activities,
    });
  }

  async createSeparationTemplate(data: CreateSeparationTemplateDto) {
    const template = await this.prisma.employeeSeparationTemplate.create({
      data: {
        name: data.name,
        activities: {
          create: data.activities.map((a) => ({
            title: a.title,
            description: a.description,
            assignedRole: a.assignedRole,
          })),
        },
      },
      include: {
        activities: true,
      },
    });
    return response("employees", "separation.template.create", template);
  }

  async listSeparationTemplates() {
    const templates = await this.prisma.employeeSeparationTemplate.findMany({
      include: { activities: true },
      orderBy: { createdAt: "desc" },
    });
    return response("employees", "separation.templates.list", templates);
  }

  async startSeparation(employeeId: string, templateId: string) {
    const template = await this.prisma.employeeSeparationTemplate.findUnique({
      where: { id: templateId },
      include: { activities: true },
    });
    if (!template) throw new NotFoundException("Separation Template not found");

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { status: "EXITED" },
    });

    return response("employees", "separation.start", {
      employeeId,
      templateName: template.name,
      tasksInitialized: template.activities.length,
      activities: template.activities,
    });
  }

  async submitExitInterview(employeeId: string, data: CreateExitInterviewDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const exitInterview = await this.prisma.exitInterview.upsert({
      where: { employeeId },
      update: {
        exitDate: new Date(data.exitDate),
        reasonForLeaving: data.reasonForLeaving,
        feedback: data.feedback,
        interviewerEmployeeId: data.interviewerEmployeeId,
        status: "COMPLETED",
      },
      create: {
        employeeId,
        exitDate: new Date(data.exitDate),
        reasonForLeaving: data.reasonForLeaving,
        feedback: data.feedback,
        interviewerEmployeeId: data.interviewerEmployeeId,
        status: "COMPLETED",
      },
    });

    return response("employees", "exit_interview.submit", exitInterview);
  }

  async getExitInterview(employeeId: string) {
    const exitInterview = await this.prisma.exitInterview.findUnique({
      where: { employeeId },
      include: { interviewer: true },
    });
    if (!exitInterview) throw new NotFoundException("Exit interview not found for employee");
    return response("employees", "exit_interview.detail", exitInterview);
  }

  async calculateFullAndFinal(employeeId: string, data: CreateFullAndFinalStatementDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const exitDate = new Date(data.exitDate);
    const resignationDate = new Date(data.resignationDate);

    const serviceYears = (exitDate.getTime() - employee.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    let gratuityDues = 0;
    if (serviceYears >= 5) {
      gratuityDues = Math.round((15 / 26) * data.lastDrawnSalary * serviceYears);
    }
    if (data.gratuityDues !== undefined) {
      gratuityDues = data.gratuityDues;
    }

    const encashmentDues = data.encashmentDues || 0;
    const recoveryDues = data.recoveryDues || 0;
    
    const grossDues = Number(data.lastDrawnSalary) + Number(gratuityDues) + Number(encashmentDues);
    const netPayable = grossDues - Number(recoveryDues);

    const statement = await this.prisma.fullAndFinalStatement.upsert({
      where: { employeeId },
      update: {
        exitDate,
        resignationDate,
        noticeDays: data.noticeDays || 90,
        lastDrawnSalary: data.lastDrawnSalary,
        gratuityDues,
        encashmentDues,
        recoveryDues,
        netPayable,
        status: "APPROVED",
        assets: {
          deleteMany: {},
          create: data.assets.map((a) => ({
            assetName: a.assetName,
            serialNumber: a.serialNumber,
            returnedStatus: "PENDING",
            recoveryCost: a.recoveryCost || 0,
          })),
        },
      },
      create: {
        employeeId,
        exitDate,
        resignationDate,
        noticeDays: data.noticeDays || 90,
        lastDrawnSalary: data.lastDrawnSalary,
        gratuityDues,
        encashmentDues,
        recoveryDues,
        netPayable,
        status: "APPROVED",
        assets: {
          create: data.assets.map((a) => ({
            assetName: a.assetName,
            serialNumber: a.serialNumber,
            returnedStatus: "PENDING",
            recoveryCost: a.recoveryCost || 0,
          })),
        },
      },
      include: {
        assets: true,
      },
    });

    return response("employees", "full_and_final.calculate", statement);
  }

  async getFullAndFinal(employeeId: string) {
    const statement = await this.prisma.fullAndFinalStatement.findUnique({
      where: { employeeId },
      include: { assets: true },
    });
    if (!statement) throw new NotFoundException("Full & Final statement not found for employee");
    return response("employees", "full_and_final.detail", statement);
  }

  async updateFfAsset(assetId: string, data: UpdateFfAssetDto) {
    const updated = await this.prisma.fullAndFinalAsset.update({
      where: { id: assetId },
      data: {
        returnedStatus: data.returnedStatus,
        recoveryCost: data.recoveryCost,
      },
    });
    return response("employees", "full_and_final.asset_update", updated);
  }

  async createGrade(data: CreateEmployeeGradeDto) {
    const grade = await this.prisma.employeeGrade.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        maxExpenseLimit: data.maxExpenseLimit,
      }
    });
    return response("employees", "grade.create", grade);
  }

  async listGrades(companyId: string) {
    const grades = await this.prisma.employeeGrade.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
    return response("employees", "grade.list", grades);
  }

  async createEmploymentType(data: CreateEmploymentTypeDto) {
    const type = await this.prisma.employmentType.create({
      data: {
        companyId: data.companyId,
        name: data.name,
      }
    });
    return response("employees", "employmentType.create", type);
  }

  async listEmploymentTypes(companyId: string) {
    const types = await this.prisma.employmentType.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
    return response("employees", "employmentType.list", types);
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
