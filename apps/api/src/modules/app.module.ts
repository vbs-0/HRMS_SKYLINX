import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import { ErrorMonitoringFilter } from "../common/filters/error-monitoring.filter";
import { MailModule } from "../common/mail/mail.module";
import { TenantMiddleware } from "../common/tenant.middleware";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ApprovalsModule } from "./approvals/approvals.module";
import { AssetsModule } from "./assets/assets.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmployeesModule } from "./employees/employees.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { LeaveModule } from "./leave/leave.module";
import { PayrollModule } from "./payroll/payroll.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { HolidaysModule } from "./holidays/holidays.module";
import { InsuranceModule } from "./insurance/insurance.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OrganizationModule } from "./organization/organization.module";
import { PerformanceModule } from "./performance/performance.module";
import { ReportsModule } from "./reports/reports.module";
import { RewardsModule } from "./rewards/rewards.module";
import { SaasModule } from "./saas/saas.module";
import { SettingsModule } from "./settings/settings.module";
import { SecurityModule } from "./security/security.module";
import { SocialModule } from "./social/social.module";
import { HealthModule } from "./health/health.module";
import { TicketsModule } from "./tickets/tickets.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { PermissionsGuard } from "../common/auth/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    PrismaModule,
    MailModule,
    HealthModule,
    AnalyticsModule,
    ApprovalsModule,
    AssetsModule,
    AuthModule,
    DashboardModule,
    EmployeesModule,
    AttendanceModule,
    ComplianceModule,
    LeaveModule,
    PayrollModule,
    ExpensesModule,
    HolidaysModule,
    InsuranceModule,
    NotificationsModule,
    OrganizationModule,
    PerformanceModule,
    ReportsModule,
    RewardsModule,
    SaasModule,
    SettingsModule,
    SecurityModule,
    SocialModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorMonitoringFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
