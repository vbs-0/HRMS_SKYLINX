import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { ManagerMappingDto } from "./dto/manager-mapping.dto";
import { CreateDepartmentDto, CreateDesignationDto, CreateLocationDto, UpdateDepartmentDto, UpdateDesignationDto, UpdateLocationDto } from "./dto/organization.dto";
import { OrganizationService } from "./organization.service";

@Controller("organization")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get("chart")
  @RequirePermissions("organization.read")
  chart() {
    return this.organizationService.chart();
  }

  @Patch("employees/:id/manager")
  @RequirePermissions("organization.update")
  updateManager(@Param("id") id: string, @Body() body: ManagerMappingDto) {
    return this.organizationService.updateManager(id, body);
  }

  // Departments CRUD
  @Get("departments")
  @RequirePermissions("organization.read")
  getDepartments() {
    return this.organizationService.getDepartments();
  }

  @Post("departments")
  @RequirePermissions("organization.update")
  createDepartment(@Body() body: CreateDepartmentDto) {
    return this.organizationService.createDepartment(body);
  }

  @Patch("departments/:id")
  @RequirePermissions("organization.update")
  updateDepartment(@Param("id") id: string, @Body() body: UpdateDepartmentDto) {
    return this.organizationService.updateDepartment(id, body);
  }

  @Delete("departments/:id")
  @RequirePermissions("organization.update")
  deleteDepartment(@Param("id") id: string) {
    return this.organizationService.deleteDepartment(id);
  }

  // Designations CRUD
  @Get("designations")
  @RequirePermissions("organization.read")
  getDesignations() {
    return this.organizationService.getDesignations();
  }

  @Post("designations")
  @RequirePermissions("organization.update")
  createDesignation(@Body() body: CreateDesignationDto) {
    return this.organizationService.createDesignation(body);
  }

  @Patch("designations/:id")
  @RequirePermissions("organization.update")
  updateDesignation(@Param("id") id: string, @Body() body: UpdateDesignationDto) {
    return this.organizationService.updateDesignation(id, body);
  }

  @Delete("designations/:id")
  @RequirePermissions("organization.update")
  deleteDesignation(@Param("id") id: string) {
    return this.organizationService.deleteDesignation(id);
  }

  // Locations CRUD
  @Get("locations")
  @RequirePermissions("organization.read")
  getLocations() {
    return this.organizationService.getLocations();
  }

  @Post("locations")
  @RequirePermissions("organization.update")
  createLocation(@Body() body: CreateLocationDto) {
    return this.organizationService.createLocation(body);
  }

  @Patch("locations/:id")
  @RequirePermissions("organization.update")
  updateLocation(@Param("id") id: string, @Body() body: UpdateLocationDto) {
    return this.organizationService.updateLocation(id, body);
  }

  @Delete("locations/:id")
  @RequirePermissions("organization.update")
  deleteLocation(@Param("id") id: string) {
    return this.organizationService.deleteLocation(id);
  }
}

