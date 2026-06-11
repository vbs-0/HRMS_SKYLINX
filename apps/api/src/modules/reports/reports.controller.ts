import { Controller, Get, Post, Body } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("employees")
  @RequirePermissions("reports.read")
  employees() {
    return this.reportsService.report("employees");
  }

  @Get("attendance")
  @RequirePermissions("reports.read")
  attendance() {
    return this.reportsService.report("attendance");
  }

  @Get("leave")
  @RequirePermissions("reports.read")
  leave() {
    return this.reportsService.report("leave");
  }

  @Get("payroll")
  @RequirePermissions("reports.read")
  payroll() {
    return this.reportsService.report("payroll");
  }

  @Get("expenses")
  @RequirePermissions("reports.read")
  expenses() {
    return this.reportsService.report("expenses");
  }

  @Get("compliance")
  @RequirePermissions("reports.read")
  compliance() {
    return this.reportsService.report("compliance");
  }

  @Post("export")
  @RequirePermissions("reports.export")
  export() {
    return this.reportsService.export();
  }

  @Post("custom")
  @RequirePermissions("reports.read")
  buildCustomReport(@Body() body: any) {
    return this.reportsService.buildCustomReport(body);
  }
}
