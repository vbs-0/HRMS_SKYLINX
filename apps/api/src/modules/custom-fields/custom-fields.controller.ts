import { Body, Controller, Delete, Get, Param, Post, Put, ForbiddenException, NotFoundException } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { CustomFieldsService } from "./custom-fields.service";
import { CreateCustomFieldDto, UpdateCustomFieldDto } from "./dto/custom-fields.dto";

@Controller()
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Post(["settings/custom-fields", "custom-fields/definitions"])
  @RequirePermissions("employees.configure")
  create(@Body() body: CreateCustomFieldDto, @CurrentUser() user: AuthenticatedUser) {
    return this.customFieldsService.createDefinition(body, user.tenantId!);
  }

  @Get(["settings/custom-fields", "custom-fields/definitions"])
  @RequirePermissions("employees.read")
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customFieldsService.findAllDefinitions(user.tenantId!);
  }

  @Get(["settings/custom-fields/:id", "custom-fields/definitions/:id"])
  @RequirePermissions("employees.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customFieldsService.findOneDefinition(id, user.tenantId!);
  }

  @Put(["settings/custom-fields/:id", "custom-fields/definitions/:id"])
  @RequirePermissions("employees.configure")
  update(
    @Param("id") id: string,
    @Body() body: UpdateCustomFieldDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customFieldsService.updateDefinition(id, body, user.tenantId!);
  }

  @Delete(["settings/custom-fields/:id", "custom-fields/definitions/:id"])
  @RequirePermissions("employees.configure")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customFieldsService.deleteDefinition(id, user.tenantId!);
  }

  @Get(["employees/:id/custom-values", "custom-fields/values/:id"])
  @RequirePermissions("employees.read")
  getValues(@Param("id") employeeId: string, @CurrentUser() user: AuthenticatedUser) {
    const isSelf = user.employeeId === employeeId;
    const isHrOrManager = user.roles.includes("HR_ADMIN") || user.roles.includes("MANAGER");
    if (!isSelf && !isHrOrManager) {
      throw new ForbiddenException("Cannot view custom values of another employee");
    }
    return this.customFieldsService.getEmployeeValues(employeeId, user.tenantId!);
  }

  @Put("employees/:id/custom-values")
  @RequirePermissions("employees.configure")
  updateValues(
    @Param("id") employeeId: string,
    @Body() body: Record<string, any>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customFieldsService.updateEmployeeValues(employeeId, body, user.tenantId!);
  }

  @Post("custom-fields/values")
  @RequirePermissions("employees.configure")
  async saveSingleValue(
    @Body() body: { employeeId: string; definitionId: string; value: any },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const definition = await this.customFieldsService.findOneDefinition(body.definitionId, user.tenantId!);
    if (!definition || !definition.data) {
      throw new NotFoundException("Custom field definition not found");
    }
    const fieldKey = (definition.data as any).fieldKey;
    return this.customFieldsService.updateEmployeeValues(
      body.employeeId,
      { [fieldKey]: body.value },
      user.tenantId!,
    );
  }
}

