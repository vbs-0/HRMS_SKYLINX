import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PerformanceService } from "./performance.service";
import { CreateFeedbackRequestDto, SubmitFeedbackResponseDto } from "./dto/feedback.dto";

@Controller("performance")
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @RequirePermissions("performance.read")
  summary() {
    return this.performanceService.summary();
  }

  @Post("cycle")
  @RequirePermissions("performance.configure")
  launchCycle(@CurrentUser() user: AuthenticatedUser) {
    return this.performanceService.launchCycle(user);
  }

  // ==========================================
  // 360-degree Feedback Requests
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
