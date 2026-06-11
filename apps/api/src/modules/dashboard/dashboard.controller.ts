import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("admin")
  @RequirePermissions("reports.read")
  admin() {
    return this.dashboardService.metrics("admin");
  }

  @Get("manager")
  @RequirePermissions("attendance.read")
  manager() {
    return this.dashboardService.metrics("manager");
  }

  @Get("employee")
  @RequirePermissions("employees.read")
  employee() {
    return this.dashboardService.metrics("employee");
  }

  @Get("super-admin")
  @RequirePermissions("settings.configure")
  superAdmin() {
    return this.dashboardService.metrics("super-admin");
  }

  @Get("celebrations")
  @RequirePermissions("employees.read")
  celebrations() {
    return this.dashboardService.celebrations();
  }
}
