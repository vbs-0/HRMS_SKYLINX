import { Injectable, NotFoundException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFeedbackRequestDto, SubmitFeedbackResponseDto } from "./dto/feedback.dto";

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [employees, attendanceLogs, leaveRequests, recognitions, auditLogs] = await Promise.all([
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
    ]);

    const rows = employees.map((employee, index) => {
      const employeeAttendance = attendanceLogs.filter((log) => log.employeeId === employee.id);
      const present = employeeAttendance.filter((log) => log.status === "PRESENT" || log.status === "LATE").length;
      const attendanceScore = employeeAttendance.length ? Math.round((present / employeeAttendance.length) * 100) : 75;
      const leaveCount = leaveRequests.filter((leave) => leave.employeeId === employee.id).length;
      const points = employee.rewardLedgers.reduce((sum, ledger) => sum + ledger.points, 0);
      const score = Math.min(100, Math.max(55, attendanceScore + Math.min(points / 20, 10) - leaveCount * 2 + (index % 3) * 3));
      return {
        employeeId: employee.id,
        employee: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name || "-",
        designation: employee.designation?.title || "-",
        goals: 3 + (index % 2),
        completedGoals: 2 + (index % 2),
        attendanceScore,
        recognitionPoints: points,
        performanceScore: Math.round(score),
        rating: score >= 90 ? "EXCELLENT" : score >= 75 ? "GOOD" : "REVIEW",
      };
    });

    const averageScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.performanceScore, 0) / rows.length) : 0;

    return response("performance", "summary", {
      employees: rows.length,
      averageScore,
      reviewReady: rows.filter((row) => row.rating !== "REVIEW").length,
      recognitions: recognitions.length,
      cycles: auditLogs.filter((log) => log.action === "cycle.launch").length,
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

  async launchCycle(user: AuthenticatedUser) {
    const log = await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        module: "performance",
        action: "cycle.launch",
        entityType: "performance_cycle",
        entityId: `cycle_${Date.now()}`,
        newValueJson: {
          status: "ACTIVE",
          cycle: "Mid-year appraisal",
          launchedAt: new Date().toISOString(),
        },
      },
    });

    return response("performance", "cycle.launch", log);
  }

  // ==========================================
  // 360-degree Feedback Requests
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
}
