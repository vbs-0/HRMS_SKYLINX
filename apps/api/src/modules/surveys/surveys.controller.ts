import { Body, Controller, Get, Param, Post, Patch } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { SurveysService } from "./surveys.service";
import { CreateSurveyDto, SubmitSurveyResponseDto } from "./dto/surveys.dto";

@Controller("surveys")
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @RequirePermissions("surveys.create")
  create(@Body() body: CreateSurveyDto) {
    return this.surveysService.create(body);
  }

  @Get()
  @RequirePermissions("surveys.read")
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.surveysService.findAll(user);
  }

  @Get(":id")
  @RequirePermissions("surveys.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.surveysService.findOne(id, user);
  }

  @Post(":id/submit")
  @RequirePermissions("surveys.read")
  submitResponse(
    @Param("id") id: string,
    @Body() body: SubmitSurveyResponseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.surveysService.submitResponse(id, body, user);
  }

  @Get(":id/results")
  @RequirePermissions("surveys.configure")
  getResults(@Param("id") id: string) {
    return this.surveysService.getResults(id);
  }

  @Patch(":id/close")
  @RequirePermissions("surveys.configure")
  close(@Param("id") id: string) {
    return this.surveysService.close(id);
  }
}
