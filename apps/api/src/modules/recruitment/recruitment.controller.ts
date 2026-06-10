import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { RecruitmentService } from "./recruitment.service";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import {
  CreateRequisitionDto,
  DecideRequisitionDto,
  CreateJobPostingDto,
  CreateCandidateDto,
  CreateInterviewDto,
  SubmitFeedbackDto,
  CreateJobOfferDto,
  UpdateApplicationStageDto,
} from "./dto/recruitment.dto";

@Controller("recruitment")
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ==========================================
  // 1. Requisitions
  // ==========================================
  @Post("requisitions")
  @RequirePermissions("recruitment.create")
  createRequisition(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateRequisitionDto,
  ) {
    const companyId = user.tenantId || "default-company";
    return this.recruitmentService.createRequisition(companyId, body);
  }

  @Get("requisitions")
  @RequirePermissions("recruitment.read")
  listRequisitions(@CurrentUser() user: AuthenticatedUser) {
    const companyId = user.tenantId || "default-company";
    return this.recruitmentService.listRequisitions(companyId);
  }

  @Patch("requisitions/:id/decide")
  @RequirePermissions("recruitment.approve")
  decideRequisition(@Param("id") id: string, @Body() body: DecideRequisitionDto) {
    return this.recruitmentService.decideRequisition(id, body);
  }

  // ==========================================
  // 2. Job Postings
  // ==========================================
  @Post("job-postings")
  @RequirePermissions("recruitment.create")
  createJobPosting(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateJobPostingDto,
  ) {
    const companyId = user.tenantId || "default-company";
    return this.recruitmentService.createJobPosting(companyId, body);
  }

  @Get("job-postings")
  @RequirePermissions("recruitment.read")
  listJobPostings(@CurrentUser() user: AuthenticatedUser) {
    const companyId = user.tenantId || "default-company";
    return this.recruitmentService.listJobPostings(companyId);
  }

  // ==========================================
  // 3. Candidates & Applications
  // ==========================================
  @Post("candidates")
  @RequirePermissions("recruitment.create")
  createCandidate(@Body() body: CreateCandidateDto) {
    return this.recruitmentService.createCandidate(body);
  }

  @Get("candidates")
  @RequirePermissions("recruitment.read")
  listCandidates() {
    return this.recruitmentService.listCandidates();
  }

  @Post("applications")
  @RequirePermissions("recruitment.create")
  createApplication(
    @Body("jobPostingId") jobPostingId: string,
    @Body("candidateId") candidateId: string,
  ) {
    return this.recruitmentService.createApplication(jobPostingId, candidateId);
  }

  @Patch("applications/:id/stage")
  @RequirePermissions("recruitment.update")
  updateApplicationStage(
    @Param("id") id: string,
    @Body() body: UpdateApplicationStageDto,
  ) {
    return this.recruitmentService.updateApplicationStage(id, body);
  }

  @Get("applications/posting/:postingId")
  @RequirePermissions("recruitment.read")
  listApplications(@Param("postingId") postingId: string) {
    return this.recruitmentService.listApplicationsByPosting(postingId);
  }

  // ==========================================
  // 4. Interviews & Feedback
  // ==========================================
  @Post("interviews")
  @RequirePermissions("recruitment.update")
  scheduleInterview(@Body() body: CreateInterviewDto) {
    return this.recruitmentService.scheduleInterview(body);
  }

  @Get("interviews")
  @RequirePermissions("recruitment.read")
  listInterviews() {
    return this.recruitmentService.listInterviews();
  }

  @Post("interviews/:id/feedback")
  @RequirePermissions("recruitment.update")
  submitFeedback(@Param("id") id: string, @Body() body: SubmitFeedbackDto) {
    return this.recruitmentService.submitFeedback(id, body);
  }

  // ==========================================
  // 5. Job Offers
  // ==========================================
  @Post("job-offers")
  @RequirePermissions("recruitment.approve")
  createJobOffer(@Body() body: CreateJobOfferDto) {
    return this.recruitmentService.createJobOffer(body);
  }

  @Get("job-offers")
  @RequirePermissions("recruitment.read")
  listJobOffers() {
    return this.recruitmentService.listJobOffers();
  }

  @Get("job-offers/:id")
  @RequirePermissions("recruitment.read")
  getJobOffer(@Param("id") id: string) {
    return this.recruitmentService.getJobOffer(id);
  }
}
