import { Body, Controller, Get, Param, Post, Patch, Delete, ForbiddenException } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PerformanceService } from "./performance.service";
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

@Controller("performance")
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @RequirePermissions("performance.read")
  summary() {
    return this.performanceService.summary();
  }

  // ==========================================
  // Appraisal Cycles CRUD
  // ==========================================
  @Get("cycles")
  @RequirePermissions("performance.read")
  listCycles() {
    return this.performanceService.listCycles();
  }

  @Post("cycles")
  @RequirePermissions("performance.configure")
  createCycle(@Body() body: CreateAppraisalCycleDto) {
    return this.performanceService.createCycle(body);
  }

  @Get("cycles/:id")
  @RequirePermissions("performance.read")
  getCycle(@Param("id") id: string) {
    return this.performanceService.getCycle(id);
  }

  @Patch("cycles/:id")
  @RequirePermissions("performance.configure")
  updateCycle(@Param("id") id: string, @Body() body: UpdateAppraisalCycleDto) {
    return this.performanceService.updateCycle(id, body);
  }

  @Delete("cycles/:id")
  @RequirePermissions("performance.configure")
  deleteCycle(@Param("id") id: string) {
    return this.performanceService.deleteCycle(id);
  }

  @Post("cycles/:id/activate")
  @RequirePermissions("performance.configure")
  activateCycle(@Param("id") id: string) {
    return this.performanceService.activateCycle(id);
  }

  @Post("cycles/:id/complete")
  @RequirePermissions("performance.configure")
  completeCycle(@Param("id") id: string) {
    return this.performanceService.completeCycle(id);
  }

  // ==========================================
  // Appraisal Templates CRUD
  // ==========================================
  @Get("templates")
  @RequirePermissions("performance.read")
  listTemplates() {
    return this.performanceService.listTemplates();
  }

  @Post("templates")
  @RequirePermissions("performance.configure")
  createTemplate(@Body() body: CreateAppraisalTemplateDto) {
    return this.performanceService.createTemplate(body);
  }

  @Get("templates/:id")
  @RequirePermissions("performance.read")
  getTemplate(@Param("id") id: string) {
    return this.performanceService.getTemplate(id);
  }

  @Patch("templates/:id")
  @RequirePermissions("performance.configure")
  updateTemplate(@Param("id") id: string, @Body() body: CreateAppraisalTemplateDto) {
    return this.performanceService.updateTemplate(id, body);
  }

  @Delete("templates/:id")
  @RequirePermissions("performance.configure")
  deleteTemplate(@Param("id") id: string) {
    return this.performanceService.deleteTemplate(id);
  }

  // ==========================================
  // Appraisals CRUD & Flow
  // ==========================================
  @Get("appraisals")
  @RequirePermissions("performance.read")
  listAppraisals(@CurrentUser() user: AuthenticatedUser) {
    return this.performanceService.listAppraisals(user);
  }

  @Post("appraisals/create-for-cycle")
  @RequirePermissions("performance.configure")
  createAppraisalsForCycle(@Body() body: CreateAppraisalBulkDto) {
    return this.performanceService.createAppraisalsForCycle(body);
  }

  @Get("appraisals/:id")
  @RequirePermissions("performance.read")
  getAppraisal(@Param("id") id: string) {
    return this.performanceService.getAppraisal(id);
  }

  @Post("appraisals/:id/self-rate")
  @RequirePermissions("performance.read")
  selfRate(
    @Param("id") id: string,
    @Body() body: SelfRateAppraisalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException("Only employees can submit self-ratings");
    }
    return this.performanceService.selfRate(id, user.employeeId, body);
  }

  @Post("appraisals/:id/manager-rate")
  @RequirePermissions("performance.approve")
  managerRate(
    @Param("id") id: string,
    @Body() body: ManagerRateAppraisalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException("Only direct managers can submit manager-ratings");
    }
    return this.performanceService.managerRate(id, user.employeeId, body);
  }

  @Post("appraisals/:id/complete")
  @RequirePermissions("performance.configure")
  completeAppraisal(@Param("id") id: string, @Body() body: CompleteAppraisalDto) {
    return this.performanceService.completeAppraisal(id, body);
  }

  // ==========================================
  // 360-degree Feedback Requests (Existing)
  // ==========================================
  @Post("feedback/requests")
  @RequirePermissions("performance.create")
  createFeedbackRequest(@Body() body: CreateFeedbackRequestDto) {
    return this.performanceService.createFeedbackRequest(body);
  }

  @Get("feedback/requests")
  @RequirePermissions("performance.read")
  listFeedbackRequests() {
    return this.performanceService.listFeedbackRequests();
  }

  @Post("feedback/requests/:id/respond")
  @RequirePermissions("performance.create")
  submitFeedbackResponse(
    @Param("id") id: string,
    @Body() body: SubmitFeedbackResponseDto,
  ) {
    return this.performanceService.submitFeedbackResponse(id, body);
  }
}

