import { Injectable, BadRequestException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { hash } from "bcryptjs";
import { OnboardTenantDto } from "./dto/onboard-tenant.dto";

const DEFAULT_COMPANY_ID = "company_skylinx";
type PlanName = "Basic" | "Standard" | "Pro";

@Injectable()
export class SaasService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    await this.ensurePlansSeeded();
    const [companies, employees, moduleSettings, billingLogs, subscriptionSetting] = await Promise.all([
      this.prisma.company.findMany({ orderBy: { createdAt: "desc" } }),
      this.prisma.employee.findMany({ where: { status: "ACTIVE" } }),
      this.prisma.moduleSetting.findMany({ orderBy: { module: "asc" } }),
      this.prisma.auditLog.findMany({
        where: { module: "saas" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.moduleSetting.findUnique({ where: { companyId_module: { companyId: DEFAULT_COMPANY_ID, module: "subscription" } } }),
    ]);

    const selectedPlan = this.resolveSelectedPlan(subscriptionSetting?.settingsJson);
    const plans = [
      {
        name: "Basic",
        employees: 5,
        monthlyPrice: 0,
        additionalEmployeePrice: 0,
        modules: 8,
        status: selectedPlan === "Basic" ? "ACTIVE" : "AVAILABLE",
        accessLevel: "Free Forever",
        features: ["No hidden charges", "No credit card required", "Employee directory", "Documents", "Web attendance", "Leave basics", "Holiday calendar", "Email support"],
      },
      {
        name: "Standard",
        employees: 25,
        monthlyPrice: 1749,
        additionalEmployeePrice: 70,
        modules: 18,
        status: selectedPlan === "Standard" ? "ACTIVE" : "AVAILABLE",
        accessLevel: "Professional HR access",
        features: ["Everything in Basic", "Payroll", "Expenses", "Insurance", "ID & visiting cards", "Organization chart", "Notifications", "Phone support"],
      },
      {
        name: "Pro",
        employees: 25,
        monthlyPrice: 3750,
        additionalEmployeePrice: 150,
        modules: 30,
        status: selectedPlan === "Pro" ? "ACTIVE" : "AVAILABLE",
        accessLevel: "Enterprise access",
        features: ["Everything in Standard", "Rewards", "Analytics", "Compliance", "Security", "SaaS controls"],
      },
    ];
    const planMatrix = [
      { section: "HR Management", feature: "Announcements", basic: "Included", standard: "Included", pro: "Included" },
      { section: "HR Management", feature: "Reminders and alerts", basic: "Included", standard: "Included", pro: "Included" },
      { section: "HR Management", feature: "Automated birthday and anniversary messages", basic: "Included", standard: "Included", pro: "Included" },
      { section: "HR Management", feature: "Employee database and KYC upload", basic: "Included", standard: "Included", pro: "Included" },
      { section: "HR Management", feature: "Login using OTP", basic: "Included", standard: "Included", pro: "Included" },
      { section: "HR Management", feature: "Data storage", basic: "250 MB", standard: "Unlimited", pro: "Unlimited" },
      { section: "HR Management", feature: "Verification dashboard", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Leave & Attendance", feature: "Web clock for attendance", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Leave & Attendance", feature: "Customizable leave rules", basic: "1 rule", standard: "Unlimited", pro: "Unlimited" },
      { section: "Leave & Attendance", feature: "Customizable attendance rules", basic: "1 rule", standard: "Unlimited", pro: "Unlimited" },
      { section: "Leave & Attendance", feature: "Attendance penalty rules", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Leave & Attendance", feature: "Selfie / GPS attendance", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Leave & Attendance", feature: "Attendance IP restriction", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
      { section: "Leave & Attendance", feature: "Geo-fencing", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
      { section: "Payroll", feature: "Customized salary structure", basic: "1 structure", standard: "Unlimited", pro: "Unlimited" },
      { section: "Payroll", feature: "Audit logs", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Salary payout through bank export", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Bank transfers through NEFT", basic: "Included", standard: "Unlimited", pro: "Unlimited" },
      { section: "Payroll", feature: "PF, ESI, PT and TDS statutory calculation", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "PF, ESI challan generation", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Form 16 and 12BB", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Income tax projections for employees", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Income tax computation", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
      { section: "Payroll", feature: "Overtime calculation", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Daily / weekly wages with OT", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Payslips bulk download", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
      { section: "Payroll", feature: "Mid month variable payout", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Payroll", feature: "Exit management", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
      { section: "Expense Management", feature: "Expense payout", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Expense Management", feature: "Expense approval workflow", basic: "Not included", standard: "Add-on \u20B920/user/month", pro: "Included" },
      { section: "Additional Features", feature: "ESS portal", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Letter generation", basic: "Not included", standard: "Add-on \u20B930/user/month", pro: "Included" },
      { section: "Additional Features", feature: "Asset management", basic: "Not included", standard: "Add-on \u20B910/user/month", pro: "Included" },
      { section: "Additional Features", feature: "SKYLINX Prime benefits", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Analytics and reports", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "SkyNexus employee social network", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Automated ID / visiting card", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Multicity calendar", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Realtime biometric integration", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Additional Features", feature: "Annual maintenance charges", basic: "Not included", standard: "\u20B95,000", pro: "\u20B95,000" },
      { section: "Implementation & Support", feature: "Setup support", basic: "2 hours", standard: "Included", pro: "Included" },
      { section: "Implementation & Support", feature: "Live webinar", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Implementation & Support", feature: "Support via email", basic: "Included", standard: "Included", pro: "Included" },
      { section: "Implementation & Support", feature: "Support via chat and phone", basic: "Not included", standard: "Included", pro: "Included" },
      { section: "Implementation & Support", feature: "Training for employees", basic: "Not included", standard: "Not included", pro: "Included" },
    ];
    const planAddOns = [
      { feature: "Multicompany support", basic: "Not included", standard: "\u20B920/user/month", pro: "\u20B920/user/month" },
      { feature: "Live tracking for Android", basic: "Not included", standard: "\u20B950/user/month", pro: "\u20B950/user/month" },
      { feature: "Rewards and recognition", basic: "Not included", standard: "\u20B930/user/month", pro: "Included" },
      { feature: "Roster / rotational shift", basic: "Not included", standard: "\u20B930/user/month", pro: "Included" },
      { feature: "Performance management", basic: "Not included", standard: "\u20B940/user/month", pro: "Included" },
      { feature: "Advanced attendance system", basic: "Not included", standard: "\u20B950/user/month", pro: "Included" },
      { feature: "Device attendance connector", basic: "Not included", standard: "\u20B950/user/month", pro: "Included" },
      { feature: "Custom branding", basic: "Not included", standard: "Included", pro: "Included" },
      { feature: "Timesheet", basic: "Not included", standard: "Coming soon", pro: "Coming soon" },
      { feature: "Background verification", basic: "Not included", standard: "Coming soon", pro: "Coming soon" },
    ];
    const activePlan = plans.find((plan) => plan.status === "ACTIVE")!;
    const billingSummary = this.billingSummaryForPlan(activePlan);
    const enabledModules = moduleSettings.filter((setting) => setting.enabled).length;
    const usagePercent = Math.round((employees.length / activePlan.employees) * 100);

    return response("saas", "summary", {
      tenants: companies.length,
      activeTenants: companies.filter((company) => company.status === "ACTIVE").length,
      activePlan: activePlan.name,
      employeeLimit: activePlan.employees,
      activeEmployees: employees.length,
      usagePercent,
      enabledModules,
      monthlyPrice: activePlan.monthlyPrice,
      plans,
      planMatrix,
      planAddOns,
      billingSummary,
      companies: companies.map((company) => ({
        id: company.id,
        name: company.name,
        legalName: company.legalName,
        status: company.status,
        timezone: company.timezone,
        createdAt: company.createdAt,
      })),
      entitlements: moduleSettings.map((setting) => ({
        id: setting.id,
        module: setting.module,
        enabled: setting.enabled,
      })),
      billingEvents: billingLogs.map((log) => ({
        id: log.id,
        action: log.action,
        status: (log.newValueJson as { status?: string } | null)?.status || "COMPLETED",
        amount: (log.newValueJson as { amount?: number } | null)?.amount || activePlan.monthlyPrice,
        createdAt: log.createdAt,
      })),
    });
  }

  async createInvoice(user: AuthenticatedUser) {
    return this.audit(user, "invoice.queue", "PENDING", 1749);
  }

  async refreshLicense(user: AuthenticatedUser) {
    return this.audit(user, "license.refresh", "ACTIVE", 1749);
  }

  async selectPlan(user: AuthenticatedUser, planName: PlanName, paymentMethod?: string, amount?: number) {
    const tenantId = user.tenantId || DEFAULT_COMPANY_ID;

    // 1. Resolve target plan details
    await this.ensurePlansSeeded();
    const planObj = await this.prisma.plan.findUnique({
      where: { name: planName },
    });
    if (!planObj) {
      throw new BadRequestException(`Target plan "${planName}" does not exist.`);
    }

    // 2. If paid plan, payment must be verified
    if (planName !== "Basic") {
      if (!paymentMethod || !amount || amount <= 0) {
        throw new BadRequestException(`Payment is required to subscribe to the ${planName} plan.`);
      }
    }

    // 3. Find or create tenant subscription
    let subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1-year subscription term

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          tenantId,
          planId: planObj.id,
          startDate: new Date(),
          expiryDate,
          status: "ACTIVE",
        },
      });
    } else {
      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: planObj.id,
          expiryDate,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });
    }

    // 4. Create Payment transaction record if it is a paid plan
    if (planName !== "Basic") {
      await this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: amount!,
          paymentMethod: paymentMethod!,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          status: "COMPLETED",
        },
      });
    }

    // 5. Update module setting entitlement
    const setting = await this.prisma.moduleSetting.upsert({
      where: { companyId_module: { companyId: tenantId, module: "subscription" } },
      update: { enabled: true, settingsJson: { activePlan: planName } },
      create: { companyId: tenantId, module: "subscription", enabled: true, settingsJson: { activePlan: planName } },
    });

    // 6. Audit logging
    await this.audit(user, "plan.select", "ACTIVE", amount || 0, planName);

    return response("saas", "plan.select", {
      activePlan: planName,
      setting,
    });
  }

  private resolveSelectedPlan(settingsJson: unknown): PlanName {
    if (settingsJson && typeof settingsJson === "object" && "activePlan" in settingsJson) {
      const activePlan = (settingsJson as { activePlan?: unknown }).activePlan;
      if (activePlan === "Basic" || activePlan === "Standard" || activePlan === "Pro") return activePlan;
    }
    return "Standard";
  }

  private billingSummaryForPlan(plan: { name: string; monthlyPrice: number; employees: number; additionalEmployeePrice: number }) {
    const billingEmployees = plan.employees;
    const extraEmployees = Math.max(0, billingEmployees - plan.employees);
    const additionalEmployeePrice = extraEmployees * plan.additionalEmployeePrice;
    const monthlyTotal = plan.monthlyPrice + additionalEmployeePrice;
    const itemTotal = monthlyTotal * 12;
    const discountPrice = itemTotal;
    const gst = Number((discountPrice * 0.18).toFixed(2));

    return {
      plan: plan.name,
      duration: "1 Year",
      employees: billingEmployees,
      basePlan: plan.monthlyPrice,
      additionalEmployeePrice,
      addOnMonthlyPrice: 0,
      itemTotal,
      discountPrice,
      gst,
      grandTotal: Number((discountPrice + gst).toFixed(2)),
    };
  }

  private async audit(user: AuthenticatedUser, action: string, status: string, amount: number, plan: PlanName = "Standard") {
    const log = await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        module: "saas",
        action,
        entityType: "subscription",
        entityId: `skylinx_${plan.toLowerCase()}_${Date.now()}`,
        newValueJson: {
          plan,
          status,
          amount,
          currency: "INR",
          period: "monthly",
          createdAt: new Date().toISOString(),
        },
      },
    });

    return response("saas", action, log);
  }

  async onboardTenant(data: OnboardTenantDto) {
    // 1. Check if company ID/code already exists
    const codeNormalized = data.companyCode.trim().toLowerCase();
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: codeNormalized },
    });
    if (existingCompany) {
      throw new BadRequestException(`Company code "${codeNormalized}" is already taken.`);
    }

    // 2. Check if admin user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.adminEmail.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new BadRequestException(`Email "${data.adminEmail}" is already registered.`);
    }

    // 3. Ensure plans are seeded
    await this.ensurePlansSeeded();

    const plan = await this.prisma.plan.findUnique({
      where: { name: data.planName },
    });
    if (!plan) {
      throw new BadRequestException(`Plan "${data.planName}" not found.`);
    }

    // 4. Create Company using the companyCode as ID
    const company = await this.prisma.company.create({
      data: {
        id: codeNormalized,
        name: data.companyName,
        legalName: data.companyLegalName,
        status: "ACTIVE",
      },
    });

    // 5. Create HR Admin Employee profile
    const employee = await this.prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: "EMP001",
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        email: data.adminEmail.toLowerCase().trim(),
        joiningDate: new Date(),
        status: "ACTIVE",
      },
    });

    // 6. Create Admin User
    const passwordHash = await hash(data.adminPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.adminEmail.toLowerCase().trim(),
        passwordHash,
        tenantId: company.id,
        employeeId: employee.id,
        status: "ACTIVE",
      },
    });

    // 7. Get or Create SUPER_ADMIN role (global)
    let superAdminRole = await this.prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });
    if (!superAdminRole) {
      superAdminRole = await this.prisma.role.create({
        data: {
          name: "SUPER_ADMIN",
          description: "Super Administrator with full access",
          isSystemRole: true,
        },
      });
    }

    // Associate admin user with SUPER_ADMIN role
    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    });

    // 8. Create Subscription
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 Year subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: company.id,
        planId: plan.id,
        startDate: new Date(),
        expiryDate,
        status: "ACTIVE",
      },
    });

    // 9. Create Payment
    await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod || "CARD",
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        status: "COMPLETED",
      },
    });

    // 10. Enable default modules based on subscription plan
    const modulesToEnable = data.planName === "Basic"
      ? ["directory", "documents", "attendance", "leave"]
      : data.planName === "Standard"
      ? ["directory", "documents", "attendance", "leave", "payroll", "expenses", "insurance"]
      : ["directory", "documents", "attendance", "leave", "payroll", "expenses", "insurance", "rewards", "analytics"];

    for (const mod of modulesToEnable) {
      await this.prisma.moduleSetting.create({
        data: {
          companyId: company.id,
          module: mod,
          enabled: true,
          settingsJson: {},
        },
      });
    }

    // 11. Create Onboarding Log
    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        tenantId: company.id,
        module: "saas",
        action: "tenant.onboard",
        entityType: "company",
        entityId: company.id,
        newValueJson: { companyName: company.name, plan: data.planName } as any,
      },
    });

    return response("saas", "onboard", {
      success: true,
      companyId: company.id,
      companyName: company.name,
      adminEmail: user.email,
      plan: data.planName,
    });
  }

  private async ensurePlansSeeded() {
    const planDetails = [
      { name: "Basic", monthlyPrice: 0, annualPrice: 0, employeeLimit: 5, features: ["No hidden charges", "No credit card required", "Employee directory", "Documents", "Web attendance", "Leave basics", "Holiday calendar", "Email support"] },
      { name: "Standard", monthlyPrice: 1749, annualPrice: 17490, employeeLimit: 25, features: ["Everything in Basic", "Payroll", "Expenses", "Insurance", "ID & visiting cards", "Organization chart", "Notifications", "Phone support"] },
      { name: "Pro", monthlyPrice: 3750, annualPrice: 37500, employeeLimit: 250, features: ["Everything in Standard", "Rewards", "Analytics", "Compliance", "Security", "SaaS controls"] }
    ];

    for (const p of planDetails) {
      await this.prisma.plan.upsert({
        where: { name: p.name },
        update: {
          monthlyPrice: p.monthlyPrice,
          annualPrice: p.annualPrice,
          employeeLimit: p.employeeLimit,
          features: p.features,
        },
        create: {
          name: p.name,
          monthlyPrice: p.monthlyPrice,
          annualPrice: p.annualPrice,
          employeeLimit: p.employeeLimit,
          features: p.features,
        }
      });
    }
  }

  async logs() {
    const [errorLogs, systemLogs] = await Promise.all([
      this.prisma.errorLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.systemLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
    ]);

    return response("saas", "logs", {
      errorLogs,
      systemLogs,
    });
  }

  async updateCompanyStatus(companyId: string, status: string) {
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { status },
    });

    return response("saas", "updateCompanyStatus", company);
  }
}
