import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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
import { CreatePromotionDto, DecidePromotionDto, CreateTransferDto, DecideTransferDto } from "./dto/career.dto";
import { ApprovalStatus } from "@prisma/client";

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

  // ==========================================
  // Career: Promotions & Transfers
  // ==========================================
  async getPromotions(employeeId: string) {
    const promotions = await this.prisma.employeePromotion.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: "desc" },
    });
    return response("employees", "promotions.list", promotions);
  }

  async createPromotion(employeeId: string, data: CreatePromotionDto) {
    const promo = await this.prisma.employeePromotion.create({
      data: {
        employeeId,
        fromDesignationId: data.fromDesignationId,
        toDesignationId: data.toDesignationId,
        fromGradeId: data.fromGradeId,
        toGradeId: data.toGradeId,
        revisedCtc: data.revisedCtc,
        effectiveDate: new Date(data.effectiveDate),
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
    });

    await this.audit("employees", "promotion.create", "employee_promotion", promo.id, promo);
    return response("employees", "promotion.create", promo);
  }

  async decidePromotion(promoId: string, data: DecidePromotionDto) {
    const promo = await this.prisma.employeePromotion.findUnique({
      where: { id: promoId },
    });
    if (!promo) throw new NotFoundException("Promotion record not found");
    if (promo.status !== ApprovalStatus.PENDING) {
      throw new NotFoundException("Promotion is already decided");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.status === ApprovalStatus.APPROVED) {
        // Apply change to employee
        await tx.employee.update({
          where: { id: promo.employeeId },
          data: {
            designationId: promo.toDesignationId,
            gradeId: promo.toGradeId || undefined,
          },
        });

        // Revised CTC logic
        if (promo.revisedCtc) {
          // Deactivate old active salary structures
          await tx.salaryStructure.updateMany({
            where: { employeeId: promo.employeeId, status: "ACTIVE" },
            data: { status: "INACTIVE" },
          });

          // Calculate standard ratios: Basic = 40% of CTC, HRA = 50% of Basic, allowances = remainder
          const annualCtc = Number(promo.revisedCtc);
          const basic = Math.round(annualCtc * 0.40);
          const hra = Math.round(basic * 0.50);
          // Let's deduct standard items: EPF = 12% of Basic capped at 15000/mo (annual basic capped = 180000)
          const annualBasicCapped = basic > 180000 ? 180000 : basic;
          const employeePf = Math.round(annualBasicCapped * 0.12);
          const employerPf = Math.round(annualBasicCapped * 0.12);
          // ESI (if CTC <= 252000 per year, which is gross 21000/mo)
          const esi = (annualCtc / 12) <= 21000 ? Math.round((annualCtc / 12) * 0.0075) * 12 : 0;
          const professionalTax = 200 * 12;
          const allowances = Math.max(annualCtc - basic - hra - employerPf, 0);

          await tx.salaryStructure.create({
            data: {
              employeeId: promo.employeeId,
              effectiveFrom: promo.effectiveDate,
              annualCtc,
              basic,
              hra,
              allowances,
              employeePf,
              employerPf,
              esi,
              professionalTax,
              tds: Math.round(annualCtc * 0.05), // default 5% TDS estimation
              status: "ACTIVE",
            },
          });
        }
      }

      return tx.employeePromotion.update({
        where: { id: promoId },
        data: {
          status: data.status,
          decidedBy: data.decidedByUserId,
          decidedAt: new Date(),
        },
      });
    });

    await this.audit("employees", "promotion.decide", "employee_promotion", promoId, updated);
    return response("employees", "promotion.decide", updated);
  }

  async getTransfers(employeeId: string) {
    const transfers = await this.prisma.employeeTransfer.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: "desc" },
    });
    return response("employees", "transfers.list", transfers);
  }

  async createTransfer(employeeId: string, data: CreateTransferDto) {
    const transfer = await this.prisma.employeeTransfer.create({
      data: {
        employeeId,
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        newManagerId: data.newManagerId,
        effectiveDate: new Date(data.effectiveDate),
        status: ApprovalStatus.PENDING,
      },
    });

    await this.audit("employees", "transfer.create", "employee_transfer", transfer.id, transfer);
    return response("employees", "transfer.create", transfer);
  }

  async decideTransfer(transferId: string, data: DecideTransferDto) {
    const transfer = await this.prisma.employeeTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) throw new NotFoundException("Transfer record not found");
    if (transfer.status !== ApprovalStatus.PENDING) {
      throw new NotFoundException("Transfer is already decided");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.status === ApprovalStatus.APPROVED) {
        await tx.employee.update({
          where: { id: transfer.employeeId },
          data: {
            departmentId: transfer.toDepartmentId || undefined,
            locationId: transfer.toLocationId || undefined,
            managerId: transfer.newManagerId || undefined,
          },
        });
      }

      return tx.employeeTransfer.update({
        where: { id: transferId },
        data: {
          status: data.status,
          decidedBy: data.decidedByUserId,
          decidedAt: new Date(),
        },
      });
    });

    await this.audit("employees", "transfer.decide", "employee_transfer", transferId, updated);
    return response("employees", "transfer.decide", updated);
  }

  async getFfSuggestions(employeeId: string) {
    // 1. Gratuity auto-suggest
    let gratuityDues = 0;
    try {
      const gratuityCalc = await this.prisma.gratuity.findFirst({
        where: { employeeId, status: ApprovalStatus.APPROVED },
      });
      if (gratuityCalc) {
        gratuityDues = Number(gratuityCalc.amount);
      }
    } catch (e) {}

    // 2. Leave encashment dues
    let encashmentDues = 0;
    try {
      const encashments = await this.prisma.leaveEncashment.findMany({
        where: { employeeId, status: ApprovalStatus.APPROVED },
      });
      encashmentDues = encashments.reduce((sum, e) => sum + Number(e.totalAmount), 0);
    } catch (e) {}

    // 3. Outstanding loan balance
    let outstandingLoanBalance = 0;
    try {
      const loans = await this.prisma.employeeLoan.findMany({
        where: { employeeId, status: ApprovalStatus.APPROVED, balanceAmount: { gt: 0 } },
      });
      outstandingLoanBalance = loans.reduce((sum, l) => sum + Number(l.balanceAmount), 0);
    } catch (e) {}

    return response("employees", "ff_suggestions", { gratuityDues, encashmentDues, outstandingLoanBalance });
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

  // ==========================================
  // Letter Templates
  // ==========================================
  async createLetterTemplate(data: any) {
    const template = await this.prisma.letterTemplate.create({
      data: {
        companyId: data.companyId,
        type: data.type,
        title: data.title,
        body: data.body,
      },
    });
    return response("employees", "letterTemplate.create", template);
  }

  async listLetterTemplates(companyId: string) {
    const list = await this.prisma.letterTemplate.findMany({
      where: { companyId },
      orderBy: { title: "asc" },
    });
    return response("employees", "letterTemplate.list", list);
  }

  async renderLetterTemplate(data: any) {
    const template = await this.prisma.letterTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template) throw new NotFoundException("Letter template not found");

    let renderedBody = template.body;
    const placeholders = data.placeholders || {};
    for (const [key, val] of Object.entries(placeholders)) {
      renderedBody = renderedBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val));
    }

    return response("employees", "letterTemplate.render", {
      ...template,
      renderedBody,
    });
  }

  // ==========================================
  // Employee Loans
  // ==========================================
  async createLoan(data: any) {
    const loan = await this.prisma.employeeLoan.create({
      data: {
        employeeId: data.employeeId,
        principal: data.principal,
        interestRate: data.interestRate || 0,
        totalPayable: data.totalPayable,
        emiAmount: data.emiAmount,
        balanceAmount: data.totalPayable,
        repaymentStart: new Date(data.repaymentStart),
        status: ApprovalStatus.PENDING,
      },
      include: { employee: true },
    });
    return response("employees", "loan.create", loan);
  }

  async listLoans(employeeId: string) {
    const list = await this.prisma.employeeLoan.findMany({
      where: employeeId && employeeId !== "all" ? { employeeId } : undefined,
      include: { employee: true, repayments: true },
      orderBy: { createdAt: "desc" },
    });
    return response("employees", "loan.list", list);
  }

  async decideLoan(id: string, data: any) {
    const loan = await this.prisma.employeeLoan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException("Loan record not found");
    if (loan.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Loan is already decided");
    }

    const updated = await this.prisma.employeeLoan.update({
      where: { id },
      data: { status: data.status as ApprovalStatus },
      include: { employee: true },
    });
    return response("employees", "loan.decide", updated);
  }
}
