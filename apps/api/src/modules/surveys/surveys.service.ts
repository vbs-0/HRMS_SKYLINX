import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateSurveyDto, SubmitSurveyResponseDto } from "./dto/surveys.dto";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { TenantContext } from "../../common/tenant-context";

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSurveyDto) {
    const survey = await this.prisma.survey.create({
      data: {
        companyId: "", // Overwritten by middleware
        title: dto.title,
        type: dto.type,
        anonymous: dto.anonymous ?? false,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        status: dto.status ?? "DRAFT",
        questions: {
          create: dto.questions.map((q, i) => ({
            text: q.text,
            kind: q.kind,
            optionsJson: q.optionsJson,
            order: i,
            companyId: TenantContext.getTenantId() || "",
          }))
        }
      },
      include: { questions: true }
    });
    
    await this.audit("surveys", "survey.create", "survey", survey.id, survey);
    return response("surveys", "create", survey);
  }

  async findAll(user: AuthenticatedUser) {
    const surveys = await this.prisma.survey.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    if (user.employeeId) {
      const responses = await this.prisma.surveyResponse.findMany({
        where: { employeeId: user.employeeId },
      });
      const responseSet = new Set(responses.map((r) => r.surveyId));
      const mapped = surveys.map((s) => ({
        ...s,
        hasResponded: responseSet.has(s.id),
      }));
      return response("surveys", "list", mapped);
    }

    return response("surveys", "list", surveys);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } }
    });
    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    let hasResponded = false;
    if (user.employeeId) {
      const resp = await this.prisma.surveyResponse.findFirst({
        where: { surveyId: id, employeeId: user.employeeId },
      });
      hasResponded = !!resp;
    }

    return response("surveys", "detail", { ...survey, hasResponded });
  }

  async submitResponse(surveyId: string, dto: SubmitSurveyResponseDto, user: AuthenticatedUser) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
    });
    
    if (!survey) {
      throw new NotFoundException(`Survey with ID ${surveyId} not found`);
    }
    if (survey.status !== "ACTIVE") {
      throw new BadRequestException("Survey is not active");
    }

    if (user.employeeId) {
      const existing = await this.prisma.surveyResponse.findFirst({
        where: { surveyId, employeeId: user.employeeId },
      });
      if (existing) {
        throw new BadRequestException("You have already submitted a response for this survey");
      }
    }

    const surveyResponse = await this.prisma.surveyResponse.create({
      data: {
        surveyId,
        employeeId: user.employeeId ?? null,
        answersJson: dto.answersJson as any,
      },
    });

    await this.audit("surveys", "survey.submit_response", "survey_response", surveyResponse.id, surveyResponse);
    return response("surveys", "submit", surveyResponse);
  }

  async getResults(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        responses: true,
      }
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    // Basic summary returning raw responses. Protect identity if anonymous.
    const results = survey.responses.map(r => {
      if (survey.anonymous) {
        return { ...r, employeeId: null };
      }
      return r;
    });

    return response("surveys", "results", { ...survey, responses: results });
  }

  async close(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
    });
    if (!survey) {
      throw new NotFoundException(`Survey with ID ${id} not found`);
    }

    const updated = await this.prisma.survey.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    await this.audit("surveys", "survey.close", "survey", id, updated);
    return response("surveys", "close", updated);
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
