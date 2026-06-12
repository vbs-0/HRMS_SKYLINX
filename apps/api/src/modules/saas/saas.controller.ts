import { Body, Controller, Get, Post, Patch, Param } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { SelectPlanDto } from "./dto/select-plan.dto";
import { OnboardTenantDto } from "./dto/onboard-tenant.dto";
import { SaasService } from "./saas.service";
import { Public } from "../../common/auth/public.decorator";

import { SettingsService } from "../settings/settings.service";

@Controller("saas")
export class SaasController {
  constructor(
    private readonly saasService: SaasService,
    private readonly settingsService: SettingsService
  ) {}

  @Public()
  @Post("signup")
  signup(@Body() data: OnboardTenantDto) {
    return this.saasService.onboardTenant(data);
  }

  @Get()
  @RequirePermissions("saas.read")
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.saasService.summary(user);
  }

  @Public()
  @Get("coupons")
  async getCoupons() {
    // SaaS frontend needs coupons without authentication during signup
    const rules = await this.settingsService.mergedRules();
    const branding = rules.branding as Record<string, unknown>;
    return {
      status: "success",
      data: {
        coupons: rules["coupons"] || [],
        supportEmail: branding?.supportEmail || "support@skylinx.com"
      }
    };
  }

  @Public()
  @Get("plans")
  async plans() {
    const data = await this.saasService.plans();
    return { status: "success", data };
  }

  @Get("logs")
  @RequirePermissions("saas.read")
  logs() {
    return this.saasService.logs();
  }

  @Patch("companies/:id/status")
  @RequirePermissions("saas.configure")
  updateCompanyStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.saasService.updateCompanyStatus(id, status);
  }

  @Post("invoice")
  @RequirePermissions("saas.configure")
  createInvoice(@CurrentUser() user: AuthenticatedUser) {
    return this.saasService.createInvoice(user);
  }

  @Post("license-refresh")
  @RequirePermissions("saas.configure")
  refreshLicense(@CurrentUser() user: AuthenticatedUser) {
    return this.saasService.refreshLicense(user);
  }

  @Post("select-plan")
  @RequirePermissions("saas.configure")
  selectPlan(@CurrentUser() user: AuthenticatedUser, @Body() data: SelectPlanDto) {
    return this.saasService.selectPlan(user, data.plan, data.paymentMethod, data.amount);
  }
}


