import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { AttendanceService } from "./attendance.service";
import { CheckInDto, CheckOutDto, DecideAttendanceDto, OvertimeDto, RegularizationDto, BulkRevertPenaltyLogsDto, PenaltyLogFilterDto } from "./dto/attendance.dto";
import { AssignShiftDto, BulkAssignShiftDto, RequestShiftDto, DecideShiftRequestDto } from "./dto/roster.dto";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get("logs")
  @RequirePermissions("attendance.read")
  logs() {
    return this.attendanceService.logs();
  }

  @Post("check-in")
  @RequirePermissions("attendance.create")
  checkIn(@Body() body: CheckInDto) {
    return this.attendanceService.checkIn(body);
  }

  @Post("check-out")
  @RequirePermissions("attendance.create")
  checkOut(@Body() body: CheckOutDto) {
    return this.attendanceService.checkOut(body);
  }

  @Get("shifts")
  @RequirePermissions("attendance.read")
  shifts() {
    return this.attendanceService.shifts();
  }

  @Get("regularizations")
  @RequirePermissions("attendance.read")
  regularizations() {
    return this.attendanceService.regularizations();
  }

  @Post("regularize")
  @RequirePermissions("attendance.create")
  regularize(@Body() body: RegularizationDto) {
    return this.attendanceService.regularize(body);
  }

  @Patch("regularize/:id")
  @RequirePermissions("attendance.approve")
  decideRegularization(@Param("id") id: string, @Body() body: DecideAttendanceDto) {
    if (body.action === "reject") {
      return this.attendanceService.rejectRegularization(id, body);
    }
    return this.attendanceService.approveRegularization(id, body);
  }

  @Post("overtime")
  @RequirePermissions("attendance.update")
  overtime(@Body() body: OvertimeDto) {
    return this.attendanceService.overtime(body);
  }

  @Post("shifts/assign")
  @RequirePermissions("attendance.update")
  assignShift(@Body() body: AssignShiftDto) {
    return this.attendanceService.assignShift(body);
  }

  @Post("shifts/bulk-assign")
  @RequirePermissions("attendance.update")
  bulkAssignShift(@Body() body: BulkAssignShiftDto) {
    return this.attendanceService.bulkAssignShift(body);
  }

  @Post("shifts/requests")
  @RequirePermissions("attendance.create")
  requestShift(@Body() body: RequestShiftDto) {
    return this.attendanceService.requestShift(body);
  }

  @Get("shifts/requests")
  @RequirePermissions("attendance.read")
  listShiftRequests() {
    return this.attendanceService.listShiftRequests();
  }

  @Patch("shifts/requests/:id/decide")
  @RequirePermissions("attendance.approve")
  decideShiftRequest(@Param("id") id: string, @Body() body: DecideShiftRequestDto) {
    return this.attendanceService.decideShiftRequest(id, body);
  }

  @Get("shifts/assignments")
  @RequirePermissions("attendance.read")
  listShiftAssignments() {
    return this.attendanceService.listShiftAssignments();
  }

  @Post("shifts/process-auto")
  @RequirePermissions("attendance.update")
  processAutoAttendance(@Body("date") date: string) {
    return this.attendanceService.processAutoAttendance(date);
  }

  @Post("bulk-upload")
  @RequirePermissions("attendance.create")
  @UseInterceptors(FileInterceptor("file"))
  bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("CSV file is required");
    }
    return this.attendanceService.bulkUpload(file.buffer);
  }

  @Get("penalty-logs")
  @RequirePermissions("attendance.read")
  getPenaltyLogs(@Query() query: PenaltyLogFilterDto) {
    return this.attendanceService.getPenaltyLogs(query);
  }

  @Post("penalty-logs/bulk-revert")
  @RequirePermissions("attendance.approve")
  bulkRevertPenaltyLogs(@CurrentUser() user: AuthenticatedUser, @Body() body: BulkRevertPenaltyLogsDto) {
    return this.attendanceService.bulkRevertPenaltyLogs(user.sub, body);
  }
}
