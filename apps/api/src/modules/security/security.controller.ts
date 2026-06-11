import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { SecurityService } from "./security.service";

@Controller("security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get("audit-logs")
  @RequirePermissions("settings.configure")
  auditLogs() {
    return this.securityService.auditLogs();
  }

  @Get("notifications")
  @RequirePermissions("settings.configure")
  notifications() {
    return this.securityService.notifications();
  }

}
