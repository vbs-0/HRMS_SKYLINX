import { Body, Controller, Get, Param, Post, Patch, ForbiddenException } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PoliciesService } from "./policies.service";
import { CreatePolicyDto } from "./dto/policies.dto";

@Controller("policies")
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @RequirePermissions("policies.create")
  create(@Body() body: CreatePolicyDto) {
    return this.policiesService.create(body);
  }

  @Get()
  @RequirePermissions("policies.read")
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.policiesService.findAll(user);
  }

  @Get(":id")
  @RequirePermissions("policies.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.policiesService.findOne(id, user);
  }

  @Post(":id/acknowledge")
  @RequirePermissions("policies.read")
  acknowledge(
    @Param("id") id: string,
    @Body("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.employeeId && employeeId !== user.employeeId) {
      throw new ForbiddenException("Cannot acknowledge policy for another employee");
    }
    return this.policiesService.acknowledge(id, employeeId);
  }

  @Get(":id/acknowledgments")
  @RequirePermissions("policies.configure")
  getAcknowledgments(@Param("id") id: string) {
    return this.policiesService.getAcknowledgments(id);
  }

  @Patch(":id/archive")
  @RequirePermissions("policies.configure")
  archive(@Param("id") id: string) {
    return this.policiesService.archive(id);
  }
}
