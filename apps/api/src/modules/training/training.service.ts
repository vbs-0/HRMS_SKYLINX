import { Injectable, NotFoundException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTrainingProgramDto,
  CreateTrainingEventDto,
  CreateTrainingFeedbackDto,
  CreateTrainingResultDto,
  CreateSkillDto,
  CreateEmployeeSkillMapDto,
  CreateDesignationSkillDto,
} from "./dto/training.dto";

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  // Programs
  async createProgram(data: CreateTrainingProgramDto) {
    const program = await this.prisma.trainingProgram.create({ data });
    await this.audit("program.create", "training_program", program.id, program);
    return response("training", "program.create", program);
  }

  async listPrograms() {
    const programs = await this.prisma.trainingProgram.findMany({
      include: { events: true },
      orderBy: { createdAt: "desc" },
    });
    return response("training", "programs.list", programs);
  }

  // Events
  async createEvent(data: CreateTrainingEventDto) {
    const event = await this.prisma.trainingEvent.create({
      data: {
        programId: data.programId,
        eventName: data.eventName,
        trainerName: data.trainerName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
      },
      include: { program: true },
    });
    await this.audit("event.create", "training_event", event.id, event);
    return response("training", "event.create", event);
  }

  async listEvents() {
    const events = await this.prisma.trainingEvent.findMany({
      include: {
        program: true,
        feedbacks: { include: { employee: true } },
        results: { include: { employee: true } },
      },
      orderBy: { startDate: "desc" },
    });
    return response("training", "events.list", events);
  }

  // Feedback & Results
  async submitFeedback(eventId: string, data: CreateTrainingFeedbackDto) {
    const feedback = await this.prisma.trainingFeedback.create({
      data: {
        eventId,
        employeeId: data.employeeId,
        rating: data.rating,
        comments: data.comments,
      },
      include: { employee: true, event: true },
    });
    await this.audit("feedback.submit", "training_feedback", feedback.id, feedback);
    return response("training", "feedback.submit", feedback);
  }

  async submitResult(eventId: string, data: CreateTrainingResultDto) {
    const result = await this.prisma.trainingResult.create({
      data: {
        eventId,
        employeeId: data.employeeId,
        status: data.status,
        comments: data.comments,
      },
      include: { employee: true, event: true },
    });
    await this.audit("result.submit", "training_result", result.id, result);
    return response("training", "result.submit", result);
  }

  // Skills
  async createSkill(data: CreateSkillDto) {
    const skill = await this.prisma.skill.create({ data });
    await this.audit("skill.create", "skill", skill.id, skill);
    return response("training", "skill.create", skill);
  }

  async listSkills() {
    const skills = await this.prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    return response("training", "skills.list", skills);
  }

  // Assess/Map Skill
  async assessSkill(data: CreateEmployeeSkillMapDto) {
    const map = await this.prisma.employeeSkillMap.upsert({
      where: {
        employeeId_skillId: {
          employeeId: data.employeeId,
          skillId: data.skillId,
        },
      },
      update: {
        proficiency: data.proficiency,
      },
      create: {
        employeeId: data.employeeId,
        skillId: data.skillId,
        proficiency: data.proficiency,
      },
      include: { employee: true, skill: true },
    });
    await this.audit("skill.map", "employee_skill_map", map.id, map);
    return response("training", "skill.map", map);
  }

  // Designation Skills Mapping
  async mapDesignationSkill(data: CreateDesignationSkillDto) {
    const dSkill = await this.prisma.designationSkill.upsert({
      where: {
        designationId_skillId: {
          designationId: data.designationId,
          skillId: data.skillId,
        },
      },
      update: {
        requiredProficiency: data.requiredProficiency,
      },
      create: {
        designationId: data.designationId,
        skillId: data.skillId,
        requiredProficiency: data.requiredProficiency,
      },
      include: { designation: true, skill: true },
    });
    await this.audit("designation_skill.map", "designation_skill", dSkill.id, dSkill);
    return response("training", "designation_skill.map", dSkill);
  }

  // Skill Gap Engine
  async getSkillGaps(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { designation: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    if (!employee.designationId) {
      return response("training", "skill_gaps", { gaps: [], met: [] });
    }

    // Required skills for designation
    const requiredSkills = await this.prisma.designationSkill.findMany({
      where: { designationId: employee.designationId },
      include: { skill: true },
    });

    // Actual employee skills
    const actualSkills = await this.prisma.employeeSkillMap.findMany({
      where: { employeeId },
      include: { skill: true },
    });

    const levelMap: Record<string, number> = {
      BEGINNER: 1,
      INTERMEDIATE: 2,
      EXPERT: 3,
    };

    const gaps: Array<{ skillName: string; required: string; actual: string }> = [];
    const met: Array<{ skillName: string; required: string; actual: string }> = [];

    for (const req of requiredSkills) {
      const actual = actualSkills.find((a) => a.skillId === req.skillId);
      const reqVal = levelMap[req.requiredProficiency] || 0;
      const actVal = actual ? levelMap[actual.proficiency] || 0 : 0;

      if (actVal < reqVal) {
        gaps.push({
          skillName: req.skill.name,
          required: req.requiredProficiency,
          actual: actual ? actual.proficiency : "NONE",
        });
      } else {
        met.push({
          skillName: req.skill.name,
          required: req.requiredProficiency,
          actual: actual!.proficiency,
        });
      }
    }

    return response("training", "skill_gaps", { gaps, met });
  }

  private async audit(action: string, entityType: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "training",
        action,
        entityType,
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
