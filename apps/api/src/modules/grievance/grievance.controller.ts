import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { GrievanceService } from "./grievance.service";
import { CreateGrievanceDto, UpdateGrievanceDto } from "./dto/grievance.dto";

@Controller("grievance")
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Post()
  @RequirePermissions("grievance.create")
  create(@Body() body: CreateGrievanceDto) {
    return this.grievanceService.create(body);
  }

  @Get()
  @RequirePermissions("grievance.read")
  findAll() {
    return this.grievanceService.findAll();
  }

  @Get(":id")
  @RequirePermissions("grievance.read")
  findOne(@Param("id") id: string) {
    return this.grievanceService.findOne(id);
  }

  @Patch(":id")
  @RequirePermissions("grievance.approve")
  update(@Param("id") id: string, @Body() body: UpdateGrievanceDto) {
    return this.grievanceService.update(id, body);
  }
}
