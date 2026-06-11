import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import {
  CreateTrainingProgramDto,
  CreateTrainingEventDto,
  CreateTrainingFeedbackDto,
  CreateTrainingResultDto,
  CreateSkillDto,
  CreateEmployeeSkillMapDto,
  CreateDesignationSkillDto,
} from "./dto/training.dto";
import { TrainingService } from "./training.service";

@Controller("training")
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post("programs")
  @RequirePermissions("training.create")
  createProgram(@Body() body: CreateTrainingProgramDto) {
    return this.trainingService.createProgram(body);
  }

  @Get("programs")
  @RequirePermissions("training.read")
  listPrograms() {
    return this.trainingService.listPrograms();
  }

  @Post("events")
  @RequirePermissions("training.create")
  createEvent(@Body() body: CreateTrainingEventDto) {
    return this.trainingService.createEvent(body);
  }

  @Get("events")
  @RequirePermissions("training.read")
  listEvents() {
    return this.trainingService.listEvents();
  }

  @Post("events/:id/feedback")
  @RequirePermissions("training.update")
  submitFeedback(@Param("id") id: string, @Body() body: CreateTrainingFeedbackDto) {
    return this.trainingService.submitFeedback(id, body);
  }

  @Post("events/:id/result")
  @RequirePermissions("training.update")
  submitResult(@Param("id") id: string, @Body() body: CreateTrainingResultDto) {
    return this.trainingService.submitResult(id, body);
  }

  @Post("skills")
  @RequirePermissions("training.create")
  createSkill(@Body() body: CreateSkillDto) {
    return this.trainingService.createSkill(body);
  }

  @Get("skills")
  @RequirePermissions("training.read")
  listSkills() {
    return this.trainingService.listSkills();
  }

  @Post("skills/assess")
  @RequirePermissions("training.update")
  assessSkill(@Body() body: CreateEmployeeSkillMapDto) {
    return this.trainingService.assessSkill(body);
  }

  @Post("designations/skills")
  @RequirePermissions("training.create")
  mapDesignationSkill(@Body() body: CreateDesignationSkillDto) {
    return this.trainingService.mapDesignationSkill(body);
  }

  @Get("skills/gaps/:employeeId")
  @RequirePermissions("training.read")
  getSkillGaps(@Param("employeeId") employeeId: string) {
    return this.trainingService.getSkillGaps(employeeId);
  }
}
