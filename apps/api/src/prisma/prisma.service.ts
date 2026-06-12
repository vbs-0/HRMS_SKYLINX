import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { TenantContext } from "../common/tenant-context";

class PrismaFieldsHelper {
  private static companyModels = new Set([
    "Department", "Designation", "Location", "Employee", "Shift", "AttendanceRule",
    "LeaveType", "PayrollRun", "Holiday", "JobPosting", "ModuleSetting", "ClientRule",
    "GratuityRule", "AppraisalCycle", "AppraisalTemplate", "Appraisal", "RetentionBonus",
    "SalaryWithholding", "CompanyPolicy", "Announcement", "CustomFieldDefinition", "CompanyAsset",
    "LeavePolicy", "LeaveBlockList", "EmployeeGrade", "EmploymentType", "LetterTemplate", "StaffingPlan",
    "SalaryStructureTemplate", "PayrollComponentConfig", "PenaltyLog"
  ]);

  private static tenantModels = new Set([
    "User", "Role", "AuditLog", "Ticket", "Subscription"
  ]);

  static getTenantField(modelName: string): "companyId" | "tenantId" | null {
    if (this.companyModels.has(modelName)) {
      return "companyId";
    }
    if (this.tenantModels.has(modelName)) {
      return "tenantId";
    }
    return null;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const tenantId = TenantContext.getTenantId();

      // Only apply filters if tenantId is set and the user is NOT a system owner
      if (tenantId && !TenantContext.isOwner()) {
        const modelName = params.model;
        if (modelName) {
          const field = PrismaFieldsHelper.getTenantField(modelName);
          if (field) {
            params.args = params.args || {};

            // 1. Intercept read operations
            const readOperations = ["findUnique", "findFirst", "findMany", "count", "aggregate", "groupBy"];
            if (readOperations.includes(params.action)) {
              if (params.action === "findUnique") {
                params.action = "findFirst";
                // findFirst does not accept compound-unique selectors
                // (e.g. companyId_module: { ... }) — flatten them to plain fields.
                const where = (params.args.where || {}) as Record<string, unknown>;
                const flattened: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(where)) {
                  if (value && typeof value === "object" && !Array.isArray(value) && !["AND", "OR", "NOT"].includes(key)) {
                    Object.assign(flattened, value);
                  } else {
                    flattened[key] = value;
                  }
                }
                params.args.where = flattened;
              }
              params.args.where = params.args.where || {};
              params.args.where[field] = tenantId;
            }

            // 2. Intercept write operations (updates, deletes)
            const writeOperations = ["update", "updateMany", "delete", "deleteMany"];
            if (writeOperations.includes(params.action)) {
              params.args.where = params.args.where || {};
              params.args.where[field] = tenantId;
            }

            // 3. Intercept create operations — tenant context always wins over
            // any client-supplied companyId/tenantId to guarantee isolation.
            if (params.action === "create") {
              params.args.data = params.args.data || {};
              params.args.data[field] = tenantId;
            } else if (params.action === "createMany") {
              params.args.data = params.args.data || [];
              if (Array.isArray(params.args.data)) {
                for (const item of params.args.data) {
                  item[field] = tenantId;
                }
              }
            }
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

