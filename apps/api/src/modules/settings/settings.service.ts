import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TenantContext } from "../../common/tenant-context";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateClientRulesDto, UpdateCompanyDto, UpdateModuleDto } from "./dto/settings.dto";

const MODULES = [
  "employees",
  "documents",
  "cards",
  "attendance",
  "leave",
  "holidays",
  "organization",
  "payroll",
  "compliance",
  "expenses",
  "insurance",
  "approvals",
  "assets",
  "performance",
  "notifications",
  "social",
  "rewards",
  "reports",
  "analytics",
  "saas",
  "security",
  "settings",
];

const DEFAULT_RULES: Required<UpdateClientRulesDto> = {
  branding: {
    platformBrand: "PeopleOS",
    clientDisplayName: "My Company",
    logoDataUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    xUrl: "",
    showPoweredBy: true,
    primaryColor: "#078ced",
    supportEmail: "support@example.com",
    supportPhone: "+91-800-000-0000",
  },
  attendance: {
    workWeek: "Monday to Saturday",
    shiftStart: "09:30",
    shiftEnd: "18:30",
    graceMinutes: 10,
    halfDayMinutes: 240,
    geoAttendance: true,
    geofenceRadiusMeters: 200,
    biometricRequired: false,
    overtimeEnabled: true,
    clockInDevice: "Both",
    selfieRequired: false,
    penaltyRulesEnabled: false,
    penaltyMapping: {
      ABSENT: "FULL_DAY",
      LATE: "HALF_DAY",
      EARLY_EXIT: "HALF_DAY",
      MISSED_PUNCH: "HALF_DAY",
      OUT_TIME: "HALF_DAY",
      SHORT_HOURS: "HALF_DAY",
    },
  },
  leave: {
    approvalFlow: "Manager then HR",
    sandwichLeave: false,
    carryForward: false,
    compOffAllowed: true,
    leaveYear: "Calendar Year",
  },
  payroll: {
    salaryStructure: "Monthly CTC",
    pfEnabled: true,
    esiEnabled: true,
    professionalTaxEnabled: true,
    tdsEnabled: true,
    payrollLockDay: 28,
    // PF Rates (%)
    pfEmployeeRate: 12.0,
    pfEmployerRate: 12.0,
    pfWageCeiling: 15000,
    // ESI Rates (%)
    esiEmployeeRate: 0.75,
    esiEmployerRate: 3.25,
    esiWageCeiling: 21000,
    // Professional Tax slabs (JSON array: [{upto: number, monthly: number}])
    ptSlabs: [
      { upto: 10000, monthly: 0 },
      { upto: 15000, monthly: 110 },
      { upto: 20000, monthly: 130 },
      { upto: 999999, monthly: 200 },
    ],
    // TDS/Income Tax slabs (JSON array: [{from: number, upto: number, rate: number}])
    tdsSlabs: [
      { from: 0, upto: 250000, rate: 0 },
      { from: 250001, upto: 500000, rate: 5 },
      { from: 500001, upto: 750000, rate: 10 },
      { from: 750001, upto: 1000000, rate: 15 },
      { from: 1000001, upto: 1250000, rate: 20 },
      { from: 1250001, upto: 1500000, rate: 25 },
      { from: 1500001, upto: 999999999, rate: 30 },
    ],
  },
  approvals: {
    expenseApproval: "Manager then HR",
    documentVerification: "HR",
    payrollApproval: "HR Admin",
  },
  permissions: {
    superAdmin: ["all"],
    hrAdmin: ["employees", "documents", "attendance", "leave", "payroll", "reports", "settings"],
    manager: ["dashboard", "employees", "attendance", "leave", "approvals", "reports"],
    employee: ["dashboard", "attendance", "leave", "documents", "cards"],
  },
  support: {
    slaHighHours: 24,
    slaMediumHours: 48,
    slaLowHours: 72,
    defaultQueue: "HR Helpdesk",
    ticketPrefix: "TKT",
  },
  documents: {
    expiryReminderDays: 30,
  },
  taxCalc: {
    // Standard deduction (₹) — New Regime FY2025-26
    standardDeductionNew: 75000,
    // Standard deduction (₹) — Old Regime
    standardDeductionOld: 50000,
    // Section 80C cap (₹)
    section80CCap: 150000,
    // Section 80D cap (₹)
    section80DCap: 25000,
    // Section 24(b) home loan interest cap (₹)
    section24bCap: 200000,
    // Cess rate (fraction, e.g. 0.04 = 4%)
    cessPct: 0.04,
    // Surcharge rate (fraction, e.g. 0.10 = 10%)
    surchargePct: 0.10,
    // Surcharge applies above this annual taxable income (₹)
    surchargeThreshold: 5000000,
    // 87A rebate threshold (₹) — below this taxable income, tax is rebated to 0
    rebateLimitNew: 700000,
    rebateLimitOld: 500000,
  },
  salaryStructure: {
    // Basic as fraction of annual CTC (e.g. 0.40 = 40%)
    basicPct: 0.40,
    // HRA as fraction of Basic (e.g. 0.50 = 50%)
    hraPct: 0.50,
    // Default TDS estimation as fraction of CTC (e.g. 0.05 = 5%)
    defaultTdsPct: 0.05,
    // Suggested performance increment fraction (e.g. 0.10 = 10%)
    performanceIncrementPct: 0.10,
  },
  declarations: {
    windowEnabled: true,
    monthlyFromDay: 1,
    monthlyToDay: 10,
    fyCutoffMonth: 1, // January
    fyCutoffDay: 31,
    mandatoryProof: true,
    currentFiscalYearStart: "2024-04-01",
    fiscalYearDeadline: "2025-01-31",
  },
  bankExport: {
    format: "GENERIC_CSV",
    includeHeader: true,
    narrationPrefix: "SALARY",
  },
  performance: {
    scoreMin: 55,
    scoreMax: 100,
    ratingExcellent: 4.0,
    ratingGood: 3.0,
    scoreGoodThreshold: 75,
    attendanceCompleteThreshold: 80,
    promotionScoreThreshold: 4.0,
    incrementPct: 0.10,
  },
  coupons: [
    { code: "none", discountPercent: 0 },
    { code: "WELCOME10", discountPercent: 10 },
    { code: "ANNUAL15", discountPercent: 15 },
    { code: "LAUNCH20", discountPercent: 20 },
  ],
  quoteAddOns: [
    { key: "multicompany", label: "Multicompany Support", monthlyPrice: 20 },
    { key: "live-tracking", label: "Live Tracking", monthlyPrice: 50 },
    { key: "rewards", label: "Rewards and Recognition", monthlyPrice: 30 },
    { key: "roster", label: "Roster / Rotational Shift", monthlyPrice: 30 },
    { key: "performance", label: "Performance Management", monthlyPrice: 40 },
    { key: "attendance-ai", label: "Advanced Attendance System", monthlyPrice: 50 },
  ],
  exitRules: {
    defaultNoticeDays: 90,
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantIdOrThrow(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new UnauthorizedException("No tenant context found");
    return tenantId;
  }

  /**
   * Resolves the active tenant ID with a DB fallback via userId —
   * handles stale JWTs that carry tenantId=null.
   */
  private async resolveTenantId(): Promise<string> {
    const tenantId = TenantContext.getTenantId();
    if (tenantId) return tenantId;

    const userId = TenantContext.getUserId();
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });
      if (user?.tenantId) return user.tenantId;
    }

    throw new UnauthorizedException("No tenant context found. Please log out and log back in.");
  }

  async company() {
    const tenantId = this.getTenantIdOrThrow();
    const company = await this.prisma.company.findUnique({ where: { id: tenantId } });
    return response("settings", "company", company);
  }

  async updateCompany(data: UpdateCompanyDto) {
    const tenantId = this.getTenantIdOrThrow();
    const company = await this.prisma.company.update({
      where: { id: tenantId },
      data,
    });
    await this.audit("company.update", "company", company.id, company);
    return response("settings", "company.update", company);
  }

  async modules() {
    const tenantId = this.getTenantIdOrThrow();
    const existing = await this.prisma.moduleSetting.findMany({
      where: { companyId: tenantId },
      orderBy: { module: "asc" },
    });
    const byModule = new Map(existing.map((setting) => [setting.module, setting]));
    const modules = MODULES.map((module) => byModule.get(module) || { companyId: tenantId, module, enabled: true, settingsJson: null });
    return response("settings", "modules", modules);
  }

  async updateModule(module: string, data: UpdateModuleDto) {
    const tenantId = this.getTenantIdOrThrow();
    const settingsJson = data.settingsJson ? JSON.parse(JSON.stringify(data.settingsJson)) as Prisma.InputJsonValue : undefined;
    const setting = await this.prisma.moduleSetting.upsert({
      where: { companyId_module: { companyId: tenantId, module } },
      update: { enabled: data.enabled, settingsJson },
      create: { companyId: tenantId, module, enabled: data.enabled, settingsJson },
    });
    await this.audit("module.update", "module_setting", setting.id, setting);
    return response("settings", "module.update", setting);
  }

  async rules() {
    const tenantId = await this.resolveTenantId();
    const [company, merged, subscriptionSetting] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: tenantId } }),
      this.mergedRules(),
      this.prisma.moduleSetting.findUnique({
        where: { companyId_module: { companyId: tenantId, module: "subscription" } },
      }),
    ]);

    const activePlan =
      subscriptionSetting?.settingsJson &&
      typeof subscriptionSetting.settingsJson === "object" &&
      "activePlan" in subscriptionSetting.settingsJson
        ? (subscriptionSetting.settingsJson as { activePlan?: string }).activePlan
        : "Standard";

    return response("settings", "rules", {
      ...merged,
      company,
      activePlan,
    });
  }

  async publicProfile() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      // Return safe defaults for unauthenticated requests
      return response("settings", "publicProfile", {
        company: null,
        branding: DEFAULT_RULES.branding,
      });
    }
    const [company, rules] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: tenantId } }),
      this.mergedRules(),
    ]);
    return response("settings", "publicProfile", {
      company,
      branding: rules.branding,
    });
  }

  /** Returns merged rules: DEFAULT_RULES overridden by any tenant-specific ClientRule rows */
  public async mergedRules() {
    const tenantId = TenantContext.getTenantId();
    const rules = tenantId ? await this.prisma.clientRule.findMany({
      where: { companyId: tenantId, status: "ACTIVE" },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    }) : [];
    const merged: Record<string, Record<string, unknown>> = JSON.parse(JSON.stringify(DEFAULT_RULES));
    for (const rule of rules) {
      const category = rule.category as keyof UpdateClientRulesDto;
      if (category in merged) {
        merged[category] = {
          ...merged[category],
          [rule.key]: rule.valueJson,
        };
      }
    }
    return merged;
  }

  async updateRules(data: UpdateClientRulesDto) {
    const tenantId = this.getTenantIdOrThrow();
    const categories = Object.entries(data).filter(([, value]) => value && typeof value === "object");
    const saved = await this.prisma.$transaction(async (tx) => {
      const updates = [];
      for (const [category, values] of categories) {
        for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
          updates.push(
            await tx.clientRule.upsert({
              where: { companyId_category_key: { companyId: tenantId, category, key } },
              update: { valueJson: this.toJson(value), status: "ACTIVE" },
              create: { companyId: tenantId, category, key, valueJson: this.toJson(value), status: "ACTIVE" },
            }),
          );
        }
      }

      await tx.auditLog.create({
        data: {
          module: "settings",
          action: "clientRules.update",
          entityType: "client_rules",
          entityId: tenantId,
          newValueJson: this.toJson(data),
        },
      });

      return updates;
    });

    return response("settings", "rules.update", { saved: saved.length, rules: await this.rules() });
  }

  async logs() {
    const tenantId = this.getTenantIdOrThrow();
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId: tenantId,
        module: { in: ["settings", "auth", "employees", "attendance", "leave", "payroll", "expenses", "insurance"] },
      },
      include: {
        actor: {
          include: { employee: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return response("settings", "logs", logs);
  }

  /** Returns the active merged payroll rules for use by payroll calculations */
  async getPayrollRules(): Promise<Record<string, unknown>> {
    const merged = await this.mergedRules();
    // Payroll consumers also need the top-level taxCalc/declarations/bankExport sections.
    // (NOT salaryStructure — payroll.salaryStructure is already a display string.)
    return {
      ...(merged["payroll"] as Record<string, unknown>),
      taxCalc: merged["taxCalc"],
      declarations: merged["declarations"],
      bankExport: merged["bankExport"],
    };
  }

  async getPerformanceRules(): Promise<Record<string, unknown>> {
    const merged = await this.mergedRules();
    return (merged["performance"] as Record<string, unknown>) || {};
  }

  private async audit(action: string, entityType: string, entityId: string, data: unknown) {
    const tenantId = TenantContext.getTenantId();
    await this.prisma.auditLog.create({
      data: {
        module: "settings",
        action,
        entityType,
        entityId,
        tenantId: tenantId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
