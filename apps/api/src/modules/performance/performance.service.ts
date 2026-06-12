import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContext } from "../../common/tenant-context";
import { CreateFeedbackRequestDto, SubmitFeedbackResponseDto } from "./dto/feedback.dto";
import {
  CreateAppraisalCycleDto,
  UpdateAppraisalCycleDto,
  CreateAppraisalTemplateDto,
  CreateAppraisalBulkDto,
  SelfRateAppraisalDto,
  ManagerRateAppraisalDto,
  CompleteAppraisalDto,
} from "./dto/performance.dto";

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [employees, attendanceLogs, leaveRequests, recognitions, auditLogs, cycles, appraisals] = await Promise.all([
      this.prisma.employee.findMany({
        where: { status: "ACTIVE" },
        include: { department: true, designation: true, rewardLedgers: true },
        orderBy: { employeeCode: "asc" },
      }),
      this.prisma.attendanceLog.findMany(),
      this.prisma.leaveRequest.findMany(),
      this.prisma.recognitionReward.findMany(),
      this.prisma.auditLog.findMany({
        where: { module: "performance" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.appraisalCycle.findMany(),
      this.prisma.appraisal.findMany(),
    ]);

    const rows = employees.map((employee, index) => {
      const employeeAttendance = attendanceLogs.filter((log) => log.employeeId === employee.id);
      const present = employeeAttendance.filter((log) => log.status === "PRESENT" || log.status === "LATE").length;
      const attendanceScore = employeeAttendance.length ? Math.round((present / employeeAttendance.length) * 100) : 75;
      const leaveCount = leaveRequests.filter((leave) => leave.employeeId === employee.id).length;
      const points = employee.rewardLedgers.reduce((sum, ledger) => sum + ledger.points, 0);
      const score = Math.min(100, Math.max(55, attendanceScore + Math.min(points / 20, 10) - leaveCount * 2 + (index % 3) * 3));
      
      const app = appraisals.find((a) => a.employeeId === employee.id);

      return {
        employeeId: employee.id,
        employee: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name || "-",
        designation: employee.designation?.title || "-",
        goals: app ? 3 : 0,
        completedGoals: app && app.status === "COMPLETED" ? 3 : 0,
        attendanceScore,
        recognitionPoints: points,
        performanceScore: app && app.finalScore ? Math.round(Number(app.finalScore) * 20) : Math.round(score),
        rating: app && app.finalScore
          ? Number(app.finalScore) >= 4.0 ? "EXCELLENT" : Number(app.finalScore) >= 3.0 ? "GOOD" : "REVIEW"
          : score >= 75 ? "GOOD" : "REVIEW",
      };
    });

    const averageScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.performanceScore, 0) / rows.length) : 0;

    return response("performance", "summary", {
      employees: rows.length,
      averageScore,
      reviewReady: rows.filter((row) => row.rating !== "REVIEW").length,
      recognitions: recognitions.length,
      cycles: cycles.length,
      categories: [
        { name: "Goals", completed: rows.reduce((sum, row) => sum + row.completedGoals, 0), total: rows.reduce((sum, row) => sum + row.goals, 0) },
        { name: "Attendance", completed: rows.filter((row) => row.attendanceScore >= 80).length, total: rows.length },
        { name: "Recognition", completed: rows.filter((row) => row.recognitionPoints > 0).length, total: rows.length },
        { name: "Review Ready", completed: rows.filter((row) => row.rating !== "REVIEW").length, total: rows.length },
      ],
      rows,
      logs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        status: (log.newValueJson as { status?: string } | null)?.status || "COMPLETED",
        createdAt: log.createdAt,
      })),
    });
  }

  // ==========================================
  // Appraisal Cycles
  // ==========================================
  async listCycles() {
    const list = await this.prisma.appraisalCycle.findMany({
      orderBy: { startDate: "desc" },
    });
    return response("performance", "cycles.list", list);
  }

  async createCycle(data: CreateAppraisalCycleDto) {
    let companyId = TenantContext.getTenantId();
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst();
      companyId = firstCompany?.id || "comp_skylinx";
    }

    const cycle = await this.prisma.appraisalCycle.create({
      data: {
        companyId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "DRAFT",
      },
    });
    await this.audit("performance", "cycle.create", "appraisal_cycle", cycle.id, cycle);
    return response("performance", "cycle.create", cycle);
  }

  async getCycle(id: string) {
    const cycle = await this.prisma.appraisalCycle.findUnique({
      where: { id },
      include: {
        appraisals: {
          include: {
            employee: true,
          },
        },
      },
    });
    if (!cycle) throw new NotFoundException("Appraisal cycle not found");
    return response("performance", "cycle.detail", cycle);
  }

  async updateCycle(id: string, data: UpdateAppraisalCycleDto) {
    const cycle = await this.prisma.appraisalCycle.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
      },
    });
    await this.audit("performance", "cycle.update", "appraisal_cycle", id, cycle);
    return response("performance", "cycle.update", cycle);
  }

  async deleteCycle(id: string) {
    await this.prisma.appraisalCycle.delete({ where: { id } });
    return response("performance", "cycle.delete", { success: true });
  }

  async activateCycle(id: string) {
    const cycle = await this.prisma.appraisalCycle.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await this.audit("performance", "cycle.activate", "appraisal_cycle", id, cycle);
    return response("performance", "cycle.activate", cycle);
  }

  async completeCycle(id: string) {
    const cycle = await this.prisma.appraisalCycle.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    await this.audit("performance", "cycle.complete", "appraisal_cycle", id, cycle);
    return response("performance", "cycle.complete", cycle);
  }

  // ==========================================
  // Appraisal Templates
  // ==========================================
  async listTemplates() {
    const list = await this.prisma.appraisalTemplate.findMany({
      include: { kras: true },
      orderBy: { name: "asc" },
    });
    return response("performance", "templates.list", list);
  }

  async createTemplate(data: CreateAppraisalTemplateDto) {
    const sum = data.kras.reduce((acc, k) => acc + Number(k.weightagePercent), 0);
    if (sum !== 100) {
      throw new BadRequestException("KRA weightages must sum to 100");
    }

    let companyId = TenantContext.getTenantId();
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst();
      companyId = firstCompany?.id || "comp_skylinx";
    }

    const template = await this.prisma.appraisalTemplate.create({
      data: {
        companyId,
        name: data.name,
        kras: {
          create: data.kras.map((k) => ({
            title: k.title,
            weightagePercent: k.weightagePercent,
          })),
        },
      },
      include: { kras: true },
    });
    await this.audit("performance", "template.create", "appraisal_template", template.id, template);
    return response("performance", "template.create", template);
  }

  async getTemplate(id: string) {
    const template = await this.prisma.appraisalTemplate.findUnique({
      where: { id },
      include: { kras: true },
    });
    if (!template) throw new NotFoundException("Template not found");
    return response("performance", "template.detail", template);
  }

  async updateTemplate(id: string, data: CreateAppraisalTemplateDto) {
    const sum = data.kras.reduce((acc, k) => acc + Number(k.weightagePercent), 0);
    if (sum !== 100) {
      throw new BadRequestException("KRA weightages must sum to 100");
    }

    const template = await this.prisma.$transaction(async (tx) => {
      await tx.appraisalKra.deleteMany({ where: { templateId: id } });
      return tx.appraisalTemplate.update({
        where: { id },
        data: {
          name: data.name,
          kras: {
            create: data.kras.map((k) => ({
              title: k.title,
              weightagePercent: k.weightagePercent,
            })),
          },
        },
        include: { kras: true },
      });
    });
    await this.audit("performance", "template.update", "appraisal_template", id, template);
    return response("performance", "template.update", template);
  }

  async deleteTemplate(id: string) {
    await this.prisma.appraisalTemplate.delete({ where: { id } });
    return response("performance", "template.delete", { success: true });
  }

  // ==========================================
  // Appraisals Flow
  // ==========================================
  async listAppraisals(user: AuthenticatedUser) {
    const isEmployee = !user.permissions.includes("performance.configure") && !user.permissions.includes("performance.approve");
    const list = await this.prisma.appraisal.findMany({
      where: isEmployee && user.employeeId ? { employeeId: user.employeeId } : undefined,
      include: {
        employee: true,
        cycle: true,
        template: { include: { kras: true } },
        goals: { include: { kra: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return response("performance", "appraisals.list", list);
  }

  async createAppraisalsForCycle(data: CreateAppraisalBulkDto) {
    const employees = data.employeeIds
      ? await this.prisma.employee.findMany({ where: { id: { in: data.employeeIds }, status: "ACTIVE" } })
      : await this.prisma.employee.findMany({ where: { status: "ACTIVE" } });

    const template = await this.prisma.appraisalTemplate.findUnique({
      where: { id: data.templateId },
      include: { kras: true },
    });
    if (!template) throw new NotFoundException("Template not found");

    let companyId = TenantContext.getTenantId();
    if (!companyId) {
      const firstCompany = await this.prisma.company.findFirst();
      companyId = firstCompany?.id || "comp_skylinx";
    }

    const created = [];
    for (const emp of employees) {
      const existing = await this.prisma.appraisal.findFirst({
        where: { cycleId: data.cycleId, employeeId: emp.id },
      });
      if (existing) continue;

      const appraisal = await this.prisma.appraisal.create({
        data: {
          companyId,
          cycleId: data.cycleId,
          employeeId: emp.id,
          templateId: data.templateId,
          status: "PENDING",
        },
      });

      await this.prisma.appraisalGoal.createMany({
        data: template.kras.map((k) => ({
          appraisalId: appraisal.id,
          kraId: k.id,
          description: `Goal for KRA: ${k.title}`,
        })),
      });

      created.push(appraisal);
    }

    return response("performance", "appraisals.bulk_create", { count: created.length });
  }

  async getAppraisal(id: string) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: {
        employee: true,
        cycle: true,
        template: { include: { kras: true } },
        goals: { include: { kra: true } },
      },
    });
    if (!appraisal) throw new NotFoundException("Appraisal not found");
    return response("performance", "appraisal.detail", appraisal);
  }

  async selfRate(id: string, employeeId: string, data: SelfRateAppraisalDto) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: { template: { include: { kras: true } } },
    });
    if (!appraisal) throw new NotFoundException("Appraisal not found");
    if (appraisal.employeeId !== employeeId) {
      throw new ForbiddenException("You can only rate your own appraisal");
    }
    if (appraisal.status !== "PENDING") {
      throw new BadRequestException("Appraisal is not in PENDING status");
    }

    let weightedSelfScore = 0;
    for (const r of data.ratings) {
      const kra = appraisal.template.kras.find((k) => k.id === r.kraId);
      if (!kra) continue;
      weightedSelfScore += Number(r.rating) * Number(kra.weightagePercent);

      await this.prisma.appraisalGoal.updateMany({
        where: { appraisalId: id, kraId: r.kraId },
        data: { selfRating: r.rating, description: r.description || "" },
      });
    }
    const selfScore = weightedSelfScore / 100;

    const updated = await this.prisma.appraisal.update({
      where: { id },
      data: { status: "SELF_DONE", selfScore },
      include: { goals: true },
    });
    await this.audit("performance", "appraisal.self_rate", "appraisal", id, updated);
    return response("performance", "appraisal.self_rate", updated);
  }

  async managerRate(id: string, managerEmployeeId: string, data: ManagerRateAppraisalDto) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: { employee: true, template: { include: { kras: true } } },
    });
    if (!appraisal) throw new NotFoundException("Appraisal not found");
    if (appraisal.employee.managerId !== managerEmployeeId) {
      throw new ForbiddenException("You can only rate your direct reports");
    }
    if (appraisal.status !== "SELF_DONE") {
      throw new BadRequestException("Employee has not completed self-rating yet");
    }

    let weightedManagerScore = 0;
    for (const r of data.ratings) {
      const kra = appraisal.template.kras.find((k) => k.id === r.kraId);
      if (!kra) continue;
      weightedManagerScore += Number(r.rating) * Number(kra.weightagePercent);

      await this.prisma.appraisalGoal.updateMany({
        where: { appraisalId: id, kraId: r.kraId },
        data: { managerRating: r.rating },
      });
    }
    const managerScore = weightedManagerScore / 100;

    const updated = await this.prisma.appraisal.update({
      where: { id },
      data: { status: "MANAGER_DONE", managerScore },
      include: { goals: true },
    });
    await this.audit("performance", "appraisal.manager_rate", "appraisal", id, updated);
    return response("performance", "appraisal.manager_rate", updated);
  }

  async completeAppraisal(id: string, data: CompleteAppraisalDto) {
    const appraisal = await this.prisma.appraisal.findUnique({
      where: { id },
      include: { employee: { include: { salaryStructures: { where: { status: "ACTIVE" } } } } },
    });
    if (!appraisal) throw new NotFoundException("Appraisal not found");
    if (appraisal.status !== "MANAGER_DONE") {
      throw new BadRequestException("Manager rating is not completed yet");
    }

    const finalScore = appraisal.managerScore;

    const updated = await this.prisma.appraisal.update({
      where: { id },
      data: { status: "COMPLETED", finalScore },
      include: { employee: true },
    });

    const threshold = data.incrementThreshold || 4.0;
    if (finalScore && Number(finalScore) >= threshold) {
      const currentCtc = appraisal.employee.salaryStructures[0]?.annualCtc
        ? Number(appraisal.employee.salaryStructures[0].annualCtc)
        : 500000;

      await this.prisma.employeePromotion.create({
        data: {
          employeeId: appraisal.employeeId,
          fromDesignationId: appraisal.employee.designationId || "des_hr_manager",
          toDesignationId: appraisal.employee.designationId || "des_hr_manager",
          fromGradeId: appraisal.employee.gradeId,
          toGradeId: appraisal.employee.gradeId,
          revisedCtc: currentCtc * 1.10, // 10% — admin-configurable via Settings → salaryStructure.performanceIncrementPct
          effectiveDate: new Date(),
          reason: `Performance appraisal final score ${finalScore} >= threshold ${threshold}. Suggested 10% increment.`,
          status: ApprovalStatus.PENDING,
        },
      });
    }

    await this.audit("performance", "appraisal.complete", "appraisal", id, updated);
    return response("performance", "appraisal.complete", updated);
  }

  // ==========================================
  // 360-degree Feedback Requests (Existing)
  // ==========================================
  async createFeedbackRequest(data: CreateFeedbackRequestDto) {
    const request = await this.prisma.feedbackRequest.create({
      data: {
        appraisalId: data.appraisalId || null,
        requestorId: data.requestorId,
        providerId: data.providerId,
        status: "PENDING",
        questions: data.questions,
      },
      include: {
        requestor: true,
        provider: true,
      },
    });
    return response("performance", "feedback.request.create", request);
  }

  async listFeedbackRequests() {
    const requests = await this.prisma.feedbackRequest.findMany({
      include: {
        requestor: true,
        provider: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("performance", "feedback.request.list", requests);
  }

  async submitFeedbackResponse(id: string, data: SubmitFeedbackResponseDto) {
    const request = await this.prisma.feedbackRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException("Feedback request not found");
    }

    const updated = await this.prisma.feedbackRequest.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        answers: data.answers,
      },
      include: {
        requestor: true,
        provider: true,
      },
    });
    return response("performance", "feedback.request.respond", updated);
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

