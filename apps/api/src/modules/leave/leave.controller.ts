import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { LeaveService } from "./leave.service";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { DecideLeaveRequestDto } from "./dto/decide-leave-request.dto";
import { CreateLeaveEncashmentDto } from "./dto/create-leave-encashment.dto";
import { DecideLeaveEncashmentDto } from "./dto/decide-leave-encashment.dto";
import { ProcessLeaveAccrualDto } from "./dto/process-leave-accrual.dto";
import { CreateCompOffConversionDto } from "./dto/comp-off-conversion.dto";
import { ApprovalStatus } from "@prisma/client";

@Controller("leave")
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get("types")
  @RequirePermissions("leave.read")
  types() {
    return this.leaveService.types();
  }

  @Patch("types/:id")
  @RequirePermissions("leave.configure")
  updateType(@Param("id") id: string, @Body() body: any) {
    return this.leaveService.updateType(id, body);
  }

  @Post("types")
  @RequirePermissions("leave.configure")
  createType(@Body() body: any) {
    return this.leaveService.createType(body);
  }

  @Get("assignments")
  @RequirePermissions("leave.read")
  getAssignments() {
    return this.leaveService.getAssignments();
  }

  @Post("assignments")
  @RequirePermissions("leave.configure")
  assignRules(@Body() body: any) {
    return this.leaveService.assignRules(body);
  }

  @Post("assignments/delete")
  @RequirePermissions("leave.configure")
  unassignRules(@Body() body: any) {
    return this.leaveService.unassignRules(body);
  }

  @Get("balances")
  @RequirePermissions("leave.read")
  balances() {
    return this.leaveService.balances();
  }

  @Get("requests")
  @RequirePermissions("leave.read")
  requests(@CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.requests(user);
  }

  @Post("requests")
  @RequirePermissions("leave.create")
  request(@Body() body: CreateLeaveRequestDto) {
    return this.leaveService.request(body);
  }

  @Patch("requests/:id/approve")
  @RequirePermissions("leave.approve")
  approve(
    @Param("id") id: string,
    @Body() body: DecideLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.leaveService.approve(id, body);
  }

  @Patch("requests/:id/reject")
  @RequirePermissions("leave.approve")
  reject(
    @Param("id") id: string,
    @Body() body: DecideLeaveRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.leaveService.reject(id, body);
  }

  @Post("block-lists")
  @RequirePermissions("leave.configure")
  createBlockList(@Body() body: any) {
    return this.leaveService.createBlockList(body);
  }

  @Get("block-lists/:companyId")
  @RequirePermissions("leave.read")
  listBlockLists(@Param("companyId") companyId: string) {
    return this.leaveService.listBlockLists(companyId);
  }

  @Post("block-lists/:id/dates")
  @RequirePermissions("leave.configure")
  addBlockListDate(@Param("id") id: string, @Body() body: any) {
    return this.leaveService.addBlockListDate(id, body);
  }

  @Get("ledger/:employeeId")
  @RequirePermissions("leave.read")
  getLedgerEntries(@Param("employeeId") employeeId: string) {
    return this.leaveService.getLedgerEntries(employeeId);
  }

  @Post("policies")
  @RequirePermissions("leave.configure")
  createPolicy(@Body() body: any) {
    return this.leaveService.createPolicy(body);
  }

  @Get("policies/:companyId")
  @RequirePermissions("leave.read")
  listPolicies(@Param("companyId") companyId: string) {
    return this.leaveService.listPolicies(companyId);
  }

  @Post("policies/assign")
  @RequirePermissions("leave.configure")
  assignPolicy(@Body() body: any) {
    return this.leaveService.assignPolicy(body);
  }

  @Get("policies/assignments/:companyId")
  @RequirePermissions("leave.read")
  listPolicyAssignments(@Param("companyId") companyId: string) {
    return this.leaveService.listPolicyAssignments(companyId);
  }

  // ==========================================
  // Leave Encashment
  // ==========================================
  @Get("encashments")
  @RequirePermissions("leave.read")
  encashments() {
    return this.leaveService.listEncashments();
  }

  @Post("encashments")
  @RequirePermissions("leave.create")
  createEncashment(@Body() body: CreateLeaveEncashmentDto) {
    return this.leaveService.createEncashment(body);
  }

  @Patch("encashments/:id/decide")
  @RequirePermissions("leave.approve")
  decideEncashment(
    @Param("id") id: string,
    @Body() body: DecideLeaveEncashmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!body.decidedByUserId) {
      body.decidedByUserId = user.sub;
    }
    return this.leaveService.decideEncashment(id, body);
  }

  // ==========================================
  // Earned-Leave Accrual
  // ==========================================
  @Post("accruals/process")
  @RequirePermissions("leave.configure")
  processAccruals(@Body() body: ProcessLeaveAccrualDto) {
    return this.leaveService.processAccruals(body);
  }

  // ==========================================
  // Compensatory Leave Conversion
  // ==========================================
  @Post("comp-off-conversions")
  @RequirePermissions("leave.create")
  createCompOffConversion(@Body() body: CreateCompOffConversionDto) {
    return this.leaveService.createCompOffConversion(body);
  }

  @Get("comp-off-conversions")
  @RequirePermissions("leave.read")
  listCompOffConversions() {
    return this.leaveService.listCompOffConversions();
  }

  @Patch("comp-off-conversions/:id/approve")
  @RequirePermissions("leave.approve")
  approveCompOffConversion(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.decideCompOffConversion(id, ApprovalStatus.APPROVED, user.sub);
  }

  @Patch("comp-off-conversions/:id/reject")
  @RequirePermissions("leave.approve")
  rejectCompOffConversion(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.leaveService.decideCompOffConversion(id, ApprovalStatus.REJECTED, user.sub);
  }
}

