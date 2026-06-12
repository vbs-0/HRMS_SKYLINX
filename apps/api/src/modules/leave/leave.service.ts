import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ApprovalStatus, LeaveLedgerEntryType } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { TenantContext } from "../../common/tenant-context";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { DecideLeaveRequestDto } from "./dto/decide-leave-request.dto";

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getLeaveYear(): Promise<number> {
    const rulesRes = await this.settingsService.rules();
    const leaveRules = (rulesRes.data as any).leave;
    const now = new Date();
    if (leaveRules?.leaveYear === "Financial Year") {
      return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
    }
    return now.getFullYear();
  }

  private tenantId(): string {
    const id = TenantContext.getTenantId();
    if (!id) throw new UnauthorizedException("No tenant context");
    return id;
  }

  async types() {
    // Ensure all 5 standard leave types exist
    const defaultTypes = [
      { name: "Event Leave", code: "EL", annualQuota: 5 },
      { name: "ON Duty Leave", code: "ODL", annualQuota: 30 },
      { name: "Paternity Leave", code: "PL", annualQuota: 7 },
      { name: "Sick Leave", code: "SL", annualQuota: 12 },
      { name: "Casual Leave", code: "CL", annualQuota: 12 },
    ];
    for (const dt of defaultTypes) {
      await this.prisma.leaveType.upsert({
        where: { companyId_code: { companyId: this.tenantId(), code: dt.code } },
        update: {},
        create: { companyId: this.tenantId(), name: dt.name, code: dt.code, annualQuota: dt.annualQuota },
      });
    }

    const leaveTypes = await this.prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    });

    const rules = await this.prisma.clientRule.findMany({
      where: { companyId: this.tenantId(), category: "leave_type_settings" },
    });
    const rulesMap = new Map(rules.map((r) => [r.key, r.valueJson]));

    const merged = leaveTypes.map((type) => {
      const extra = (rulesMap.get(type.id) as any) || {};
      return {
        ...type,
        description: extra.description || "This is a default description for the Leave Type. You can customise this.",
        weekendsBetweenLeave: extra.weekendsBetweenLeave || "Not Considered",
        holidaysBetweenLeave: extra.holidaysBetweenLeave || "Not Considered",
        creditableOnAccrual: extra.creditableOnAccrual ?? true,
        creditableOnPresentDay: extra.creditableOnPresentDay ?? false,
        accrualFrequency: extra.accrualFrequency || "Monthly",
        accrualPeriod: extra.accrualPeriod || "Start",
        allowedUnderProbation: extra.allowedUnderProbation ?? false,
        allowedUnderNoticePeriod: extra.allowedUnderNoticePeriod ?? false,
        leaveEncashEnabled: extra.leaveEncashEnabled ?? false,
        maxLeavesPerMonth: extra.maxLeavesPerMonth !== undefined ? Number(extra.maxLeavesPerMonth) : 31,
        maxContinuousLeaves: extra.maxContinuousLeaves !== undefined ? Number(extra.maxContinuousLeaves) : 31,
        negativeLeavesAllowed: extra.negativeLeavesAllowed ?? false,
        futureDatedLeavesAllowed: extra.futureDatedLeavesAllowed ?? false,
        backdatedLeavesAllowed: extra.backdatedLeavesAllowed ?? true,
        backdatedLeavesDaysLimit: extra.backdatedLeavesDaysLimit !== undefined ? Number(extra.backdatedLeavesDaysLimit) : 90,
        applyNextYearTillMonth: extra.applyNextYearTillMonth || "February",
      };
    });

    return response("leave", "types", merged);
  }

  async updateType(id: string, data: any) {
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!leaveType) throw new NotFoundException("Leave type not found");

    const updatedModel = await this.prisma.leaveType.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        code: data.code !== undefined ? data.code : undefined,
        annualQuota: data.annualQuota !== undefined ? Number(data.annualQuota) : undefined,
        carryForwardAllowed: data.carryForwardAllowed !== undefined ? Boolean(data.carryForwardAllowed) : undefined,
        sandwichRuleEnabled: data.sandwichRuleEnabled !== undefined ? Boolean(data.sandwichRuleEnabled) : undefined,
      },
    });

    const extraSettings = {
      description: data.description,
      weekendsBetweenLeave: data.weekendsBetweenLeave,
      holidaysBetweenLeave: data.holidaysBetweenLeave,
      creditableOnAccrual: data.creditableOnAccrual,
      creditableOnPresentDay: data.creditableOnPresentDay,
      accrualFrequency: data.accrualFrequency,
      accrualPeriod: data.accrualPeriod,
      allowedUnderProbation: data.allowedUnderProbation,
      allowedUnderNoticePeriod: data.allowedUnderNoticePeriod,
      leaveEncashEnabled: data.leaveEncashEnabled,
      maxLeavesPerMonth: data.maxLeavesPerMonth,
      maxContinuousLeaves: data.maxContinuousLeaves,
      negativeLeavesAllowed: data.negativeLeavesAllowed,
      futureDatedLeavesAllowed: data.futureDatedLeavesAllowed,
      backdatedLeavesAllowed: data.backdatedLeavesAllowed,
      backdatedLeavesDaysLimit: data.backdatedLeavesDaysLimit,
      applyNextYearTillMonth: data.applyNextYearTillMonth,
    };

    const filteredExtra: any = {};
    for (const [k, v] of Object.entries(extraSettings)) {
      if (v !== undefined) filteredExtra[k] = v;
    }

    if (Object.keys(filteredExtra).length > 0) {
      const existingRule = await this.prisma.clientRule.findUnique({
        where: {
          companyId_category_key: {
            companyId: this.tenantId(),
            category: "leave_type_settings",
            key: id,
          },
        },
      });
      const oldValue = existingRule ? (existingRule.valueJson as any) : {};
      const newValue = { ...oldValue, ...filteredExtra };

      await this.prisma.clientRule.upsert({
        where: {
          companyId_category_key: {
            companyId: this.tenantId(),
            category: "leave_type_settings",
            key: id,
          },
        },
        update: { valueJson: newValue },
        create: {
          companyId: this.tenantId(),
          category: "leave_type_settings",
          key: id,
          valueJson: newValue,
        },
      });
    }

    return response("leave", "type.update", updatedModel);
  }

  async createType(data: any) {
    const code = data.code ? data.code.toUpperCase() : `CUST_${Date.now().toString().slice(-4)}`;
    
    const existing = await this.prisma.leaveType.findFirst({
      where: { companyId: this.tenantId(), code },
    });
    if (existing) throw new BadRequestException(`Leave type with code ${code} already exists`);

    const newType = await this.prisma.leaveType.create({
      data: {
        companyId: this.tenantId(),
        name: data.name || "Custom Leave",
        code,
        annualQuota: data.annualQuota !== undefined ? Number(data.annualQuota) : 30,
        carryForwardAllowed: data.carryForwardAllowed !== undefined ? Boolean(data.carryForwardAllowed) : false,
        sandwichRuleEnabled: data.sandwichRuleEnabled !== undefined ? Boolean(data.sandwichRuleEnabled) : false,
        status: data.status || "ACTIVE",
      },
    });

    const extraSettings = {
      description: data.description || "Custom leave type configuration.",
      weekendsBetweenLeave: data.weekendsBetweenLeave || "Not Considered",
      holidaysBetweenLeave: data.holidaysBetweenLeave || "Not Considered",
      creditableOnAccrual: data.creditableOnAccrual !== undefined ? Boolean(data.creditableOnAccrual) : true,
      creditableOnPresentDay: data.creditableOnPresentDay !== undefined ? Boolean(data.creditableOnPresentDay) : false,
      accrualFrequency: data.accrualFrequency || "Monthly",
      accrualPeriod: data.accrualPeriod || "Start",
      allowedUnderProbation: data.allowedUnderProbation !== undefined ? Boolean(data.allowedUnderProbation) : false,
      allowedUnderNoticePeriod: data.allowedUnderNoticePeriod !== undefined ? Boolean(data.allowedUnderNoticePeriod) : false,
      leaveEncashEnabled: data.leaveEncashEnabled !== undefined ? Boolean(data.leaveEncashEnabled) : false,
      maxLeavesPerMonth: data.maxLeavesPerMonth !== undefined ? Number(data.maxLeavesPerMonth) : 31,
      maxContinuousLeaves: data.maxContinuousLeaves !== undefined ? Number(data.maxContinuousLeaves) : 31,
      negativeLeavesAllowed: data.negativeLeavesAllowed !== undefined ? Boolean(data.negativeLeavesAllowed) : false,
      futureDatedLeavesAllowed: data.futureDatedLeavesAllowed !== undefined ? Boolean(data.futureDatedLeavesAllowed) : false,
      backdatedLeavesAllowed: data.backdatedLeavesAllowed !== undefined ? Boolean(data.backdatedLeavesAllowed) : true,
      backdatedLeavesDaysLimit: data.backdatedLeavesDaysLimit !== undefined ? Number(data.backdatedLeavesDaysLimit) : 90,
      applyNextYearTillMonth: data.applyNextYearTillMonth || "February",
    };

    await this.prisma.clientRule.create({
      data: {
        companyId: this.tenantId(),
        category: "leave_type_settings",
        key: newType.id,
        valueJson: extraSettings,
      },
    });

    return response("leave", "type.create", newType);
  }

  async getAssignments() {
    const currentYear = await this.getLeaveYear();
    const employees = await this.prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        leaveBalances: {
          where: { year: currentYear },
          include: {
            leaveType: true,
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    const empMap = new Map(employees.map(emp => [emp.id, `${emp.firstName} ${emp.lastName}`]));

    const rows = employees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: `${emp.firstName} ${emp.lastName}`,
      managerName: emp.managerId ? (empMap.get(emp.managerId) || "-") : "-",
      employmentType: emp.employmentType,
      rulesApplied: emp.leaveBalances.map((b) => ({
        leaveTypeId: b.leaveTypeId,
        name: b.leaveType.name,
        code: b.leaveType.code,
      })),
    }));

    return response("leave", "assignments", rows);
  }

  async assignRules(data: { employeeIds: string[]; leaveTypeIds: string[]; effectiveDate?: string }) {
    const currentYear = await this.getLeaveYear();
    const { employeeIds, leaveTypeIds } = data;
    if (!employeeIds.length || !leaveTypeIds.length) {
      throw new BadRequestException("Employee IDs and Leave Type IDs are required");
    }

    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { id: { in: leaveTypeIds } },
    });

    const results = await this.prisma.$transaction(async (tx) => {
      const list = [];
      for (const empId of employeeIds) {
        for (const lt of leaveTypes) {
          const bal = await tx.leaveBalance.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: empId,
                leaveTypeId: lt.id,
                year: currentYear,
              },
            },
            update: {},
            create: {
              employeeId: empId,
              leaveTypeId: lt.id,
              year: currentYear,
              openingBalance: lt.annualQuota,
              accrued: lt.annualQuota,
              used: 0,
              carriedForward: 0,
              available: lt.annualQuota,
            },
          });
          
          await tx.leaveLedgerEntry.create({
            data: {
              employeeId: empId,
              leaveTypeId: lt.id,
              transactionDate: new Date(),
              transactionType: LeaveLedgerEntryType.ACCRUAL,
              days: lt.annualQuota,
              remarks: `Initial rule allocation of ${lt.annualQuota} days`,
            },
          });
          
          list.push(bal);
        }
      }
      return list;
    });

    return response("leave", "assignments.create", results);
  }

  async unassignRules(data: { employeeIds: string[]; leaveTypeIds: string[] }) {
    const currentYear = await this.getLeaveYear();
    const { employeeIds, leaveTypeIds } = data;
    
    await this.prisma.leaveBalance.deleteMany({
      where: {
        employeeId: { in: employeeIds },
        leaveTypeId: { in: leaveTypeIds },
        year: currentYear,
      },
    });

    return response("leave", "assignments.delete", { success: true });
  }



  async balances() {
    const balances = await this.prisma.leaveBalance.findMany({
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: [{ year: "desc" }],
    });
    return response("leave", "balances", balances);
  }

  async requests(user?: AuthenticatedUser) {
    const requests = await this.prisma.leaveRequest.findMany({
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!user || user.roles.includes("SUPER_ADMIN")) {
      return response("leave", "requests", requests);
    }

    // HR sees only leaves applied by non-HR employees (their own go to the Admin)
    const hrUsers = await this.prisma.userRole.findMany({
      where: { role: { name: "HR_ADMIN" } },
      select: { user: { select: { employeeId: true } } },
    });
    const hrEmployeeIds = new Set(hrUsers.map((u) => u.user?.employeeId).filter(Boolean));

    if (user.roles.includes("HR_ADMIN")) {
      const filtered = requests.filter((r) => !hrEmployeeIds.has(r.employeeId));
      return response("leave", "requests", filtered);
    }

    return response("leave", "requests", requests);
  }

  /** Leaves applied by HR can only be decided by the Admin (SUPER_ADMIN). */
  private async assertCanDecide(applierEmployeeId: string, decidedByUserId?: string) {
    const applierUser = await this.prisma.user.findUnique({
      where: { employeeId: applierEmployeeId },
      include: { roles: { include: { role: true } } },
    });
    const isHrApplier = applierUser?.roles.some((r) => r.role.name === "HR_ADMIN");
    if (!isHrApplier || !decidedByUserId) return;

    const deciderUser = await this.prisma.user.findUnique({
      where: { id: decidedByUserId },
      include: { roles: { include: { role: true } } },
    });
    const isDeciderSuperAdmin = deciderUser?.roles.some((r) => r.role.name === "SUPER_ADMIN");
    if (!isDeciderSuperAdmin) {
      throw new ForbiddenException("Leaves applied by HR can only be decided by the Admin");
    }
  }

  async request(data: CreateLeaveRequestDto) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
    });
    if (!leaveType) throw new NotFoundException("Leave type not found");

    // Check Leave Block Lists
    const blockLists = await this.prisma.leaveBlockList.findMany({
      where: { companyId: leaveType.companyId },
      include: { dates: true },
    });

    const requestedFrom = new Date(data.fromDate);
    const requestedTo = new Date(data.toDate);

    for (const bl of blockLists) {
      for (const bld of bl.dates) {
        const blDate = new Date(bld.date);
        const blStr = blDate.toDateString();
        let curr = new Date(requestedFrom);
        while (curr <= requestedTo) {
          if (curr.toDateString() === blStr) {
            throw new BadRequestException(
              `Cannot apply for leave on ${curr.toLocaleDateString()} as it is a blocked period: ${bld.reason}`
            );
          }
          curr.setDate(curr.getDate() + 1);
        }
      }
    }

    // Calculate days using Sandwich Rule check
    const calculatedDays = await this.calculateDaysCount(requestedFrom, requestedTo, data.leaveTypeId, data.employeeId);

    const year = requestedFrom.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year,
        },
      },
    });

    if (!balance) throw new BadRequestException("Leave balance is not configured for this employee");
    if (Number(balance.available) < calculatedDays) {
      throw new BadRequestException("Insufficient leave balance");
    }

    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        fromDate: requestedFrom,
        toDate: requestedTo,
        days: calculatedDays,
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "leave",
        action: "request.create",
        entityType: "leave_request",
        entityId: leaveRequest.id,
        newValueJson: leaveRequest,
      },
    });

    return response("leave", "request.create", leaveRequest);
  }

  async approve(id: string, data: DecideLeaveRequestDto) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!leaveRequest) throw new NotFoundException("Leave request not found");
    if (leaveRequest.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending leave requests can be approved");
    }

    await this.assertCanDecide(leaveRequest.employeeId, data.decidedByUserId);

    const year = leaveRequest.fromDate.getFullYear();
    const result = await this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year,
          },
        },
      });
      if (!balance) throw new BadRequestException("Leave balance is not configured for this employee");
      if (Number(balance.available) < Number(leaveRequest.days)) {
        throw new BadRequestException("Insufficient leave balance");
      }

      const updatedBalance = await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: { increment: leaveRequest.days },
          available: { decrement: leaveRequest.days },
        },
      });

      const approved = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: ApprovalStatus.APPROVED,
          managerId: data.decidedByUserId,
          decidedAt: new Date(),
        },
        include: {
          employee: true,
          leaveType: true,
        },
      });

      await tx.leaveLedgerEntry.create({
        data: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          transactionDate: new Date(),
          transactionType: LeaveLedgerEntryType.DEBIT,
          days: leaveRequest.days,
          remarks: `Approved leave request from ${leaveRequest.fromDate.toLocaleDateString()} to ${leaveRequest.toDate.toLocaleDateString()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.decidedByUserId,
          module: "leave",
          action: "request.approve",
          entityType: "leave_request",
          entityId: id,
          oldValueJson: leaveRequest,
          newValueJson: { leaveRequest: approved, balance: updatedBalance, note: data.note },
        },
      });

      return approved;
    });

    return response("leave", "request.approve", result);
  }

  async reject(id: string, data: DecideLeaveRequestDto) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!leaveRequest) throw new NotFoundException("Leave request not found");
    if (leaveRequest.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending leave requests can be rejected");
    }

    await this.assertCanDecide(leaveRequest.employeeId, data.decidedByUserId);

    const rejected = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        managerId: data.decidedByUserId,
        decidedAt: new Date(),
      },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: data.decidedByUserId,
        module: "leave",
        action: "request.reject",
        entityType: "leave_request",
        entityId: id,
        oldValueJson: leaveRequest,
        newValueJson: { leaveRequest: rejected, note: data.note },
      },
    });

    return response("leave", "request.reject", rejected);
  }
  async calculateDaysCount(fromDate: Date, toDate: Date, leaveTypeId: string, employeeId: string): Promise<number> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const companyId = employee.companyId;
    const workWeek = employee.company.workWeek;

    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });
    if (!leaveType) throw new NotFoundException("Leave type not found");

    const holidays = await this.prisma.holiday.findMany({
      where: {
        companyId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
        status: "ACTIVE",
      },
    });
    const holidayDates = new Set(holidays.map((h) => new Date(h.date).toDateString()));

    let count = 0;
    const current = new Date(fromDate);
    const end = new Date(toDate);

    const isWeekend = (date: Date, ww: string): boolean => {
      const day = date.getDay();
      if (ww === "Monday to Friday") {
        return day === 0 || day === 6;
      }
      return day === 0; // Default: Sunday
    };

    while (current <= end) {
      const isWk = isWeekend(current, workWeek);
      const isHol = holidayDates.has(current.toDateString());

      if (isWk || isHol) {
        if (leaveType.sandwichRuleEnabled) {
          count++;
        }
      } else {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async createBlockList(data: any) {
    const list = await this.prisma.leaveBlockList.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
      },
    });
    return response("leave", "blockList.create", list);
  }

  async listBlockLists(companyId: string) {
    companyId = TenantContext.getTenantId() || companyId;
    const lists = await this.prisma.leaveBlockList.findMany({
      where: { companyId },
      include: { dates: true },
      orderBy: { name: "asc" },
    });
    return response("leave", "blockList.list", lists);
  }

  async addBlockListDate(blockListId: string, data: any) {
    const blockListDate = await this.prisma.leaveBlockListDate.create({
      data: {
        blockListId,
        date: new Date(data.date),
        reason: data.reason,
      },
    });
    return response("leave", "blockList.date.add", blockListDate);
  }

  async getLedgerEntries(employeeId: string) {
    const entries = await this.prisma.leaveLedgerEntry.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { transactionDate: "desc" },
    });
    return response("leave", "ledger.list", entries);
  }

  async createPolicy(data: any) {
    const policy = await this.prisma.leavePolicy.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
      },
    });
    return response("leave", "policy.create", policy);
  }

  async listPolicies(companyId: string) {
    companyId = TenantContext.getTenantId() || companyId;
    const policies = await this.prisma.leavePolicy.findMany({
      where: { companyId },
      include: { assignments: { include: { employee: true } } },
      orderBy: { name: "asc" },
    });
    return response("leave", "policy.list", policies);
  }

  async assignPolicy(data: any) {
    const assignments = [];
    for (const employeeId of data.employeeIds) {
      const assignment = await this.prisma.leavePolicyAssignment.create({
        data: {
          employeeId,
          policyId: data.policyId,
          effectiveFrom: new Date(data.effectiveFrom),
        },
      });
      assignments.push(assignment);
    }
    return response("leave", "policy.assign", assignments);
  }

  async listPolicyAssignments(companyId: string) {
    companyId = TenantContext.getTenantId() || companyId;
    const assignments = await this.prisma.leavePolicyAssignment.findMany({
      where: {
        employee: { companyId },
      },
      include: {
        employee: true,
        policy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("leave", "policy.assignment.list", assignments);
  }

  // ==========================================
  // Leave Encashment
  // ==========================================
  async listEncashments() {
    const encashments = await this.prisma.leaveEncashment.findMany({
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("leave", "encashments.list", encashments);
  }

  async createEncashment(data: any) {
    const currentYear = await this.getLeaveYear();
    const structure = await this.prisma.salaryStructure.findFirst({
      where: { employeeId: data.employeeId, status: "ACTIVE" },
      orderBy: { effectiveFrom: "desc" },
    });
    if (!structure) {
      throw new BadRequestException("Employee has no active salary structure to calculate encashment rate");
    }

    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (!balance) {
      throw new BadRequestException("Leave balance is not configured for this employee");
    }

    if (Number(balance.available) < data.days) {
      throw new BadRequestException("Insufficient leave balance for encashment");
    }

    const amountPerDay = Number(structure.basic) / 30;
    const totalAmount = amountPerDay * data.days;

    const encashment = await this.prisma.leaveEncashment.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        days: data.days,
        amountPerDay,
        totalAmount,
        status: ApprovalStatus.PENDING,
      },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "leave",
        action: "encashment.create",
        entityType: "leave_encashment",
        entityId: encashment.id,
        newValueJson: JSON.parse(JSON.stringify(encashment)),
      },
    });

    return response("leave", "encashment.create", encashment);
  }

  async decideEncashment(id: string, data: any) {
    const currentYear = await this.getLeaveYear();
    const encashment = await this.prisma.leaveEncashment.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!encashment) throw new NotFoundException("Leave encashment record not found");
    if (encashment.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending leave encashments can be decided");
    }

    if (data.status === ApprovalStatus.APPROVED) {
      const balance = await this.prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: encashment.employeeId,
            leaveTypeId: encashment.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        throw new BadRequestException("Leave balance is not configured for this employee");
      }

      if (Number(balance.available) < Number(encashment.days)) {
        throw new BadRequestException("Insufficient leave balance");
      }

      // Decrement balance + add ledger entry + create AdditionalSalary
      await this.prisma.$transaction(async (tx) => {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: { increment: encashment.days },
            available: { decrement: encashment.days },
          },
        });

        await tx.leaveLedgerEntry.create({
          data: {
            employeeId: encashment.employeeId,
            leaveTypeId: encashment.leaveTypeId,
            transactionDate: new Date(),
            transactionType: LeaveLedgerEntryType.ENCASHMENT,
            days: encashment.days,
            remarks: `Approved leave encashment of ${encashment.days} days`,
          },
        });

        await tx.additionalSalary.create({
          data: {
            employeeId: encashment.employeeId,
            amount: encashment.totalAmount,
            type: "ADDITION",
            name: `Leave Encashment (${encashment.leaveType.name})`,
            date: new Date(),
          },
        });

        await tx.leaveEncashment.update({
          where: { id },
          data: {
            status: ApprovalStatus.APPROVED,
            decidedBy: data.decidedByUserId,
            decidedAt: new Date(),
          },
        });
      });
    } else {
      await this.prisma.leaveEncashment.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          decidedBy: data.decidedByUserId,
          decidedAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.leaveEncashment.findUnique({
      where: { id },
      include: { employee: true, leaveType: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: data.decidedByUserId,
        module: "leave",
        action: "encashment.decide",
        entityType: "leave_encashment",
        entityId: id,
        oldValueJson: JSON.parse(JSON.stringify(encashment)),
        newValueJson: JSON.parse(JSON.stringify(updated)),
      },
    });

    return response("leave", "encashment.decide", updated);
  }

  // ==========================================
  // Earned-Leave Accrual Engine
  // ==========================================
  async processAccruals(data: any) {
    const currentYear = await this.getLeaveYear();
    const schedules = await this.prisma.leaveAccrualSchedule.findMany({
      include: { leaveType: true },
    });

    const results = [];

    for (const schedule of schedules) {
      // Find policy assignments
      const assignments = await this.prisma.leavePolicyAssignment.findMany({
        where: { policyId: schedule.leavePolicyId },
        include: { employee: true },
      });

      for (const assignment of assignments) {
        const employee = assignment.employee;
        if (employee.status !== "ACTIVE") continue;

        // Check idempotency for this employee, leave type, policy, and period
        const remarksKey = `Accrual Policy:${schedule.leavePolicyId} Period:${data.period}`;
        const existingEntry = await this.prisma.leaveLedgerEntry.findFirst({
          where: {
            employeeId: employee.id,
            leaveTypeId: schedule.leaveTypeId,
            remarks: { contains: remarksKey },
          },
        });

        if (existingEntry) {
          results.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: schedule.leaveType.name,
            status: "SKIPPED",
            reason: "Already processed for this period",
          });
          continue;
        }

        // Apply accrual: increment balance
        await this.prisma.$transaction(async (tx) => {
          const balance = await tx.leaveBalance.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: employee.id,
                leaveTypeId: schedule.leaveTypeId,
                year: currentYear,
              },
            },
            update: {
              accrued: { increment: schedule.daysPerPeriod },
              available: { increment: schedule.daysPerPeriod },
            },
            create: {
              employeeId: employee.id,
              leaveTypeId: schedule.leaveTypeId,
              year: currentYear,
              openingBalance: 0,
              accrued: schedule.daysPerPeriod,
              used: 0,
              carriedForward: 0,
              available: schedule.daysPerPeriod,
            },
          });

          await tx.leaveLedgerEntry.create({
            data: {
              employeeId: employee.id,
              leaveTypeId: schedule.leaveTypeId,
              transactionDate: new Date(),
              transactionType: LeaveLedgerEntryType.ACCRUAL,
              days: schedule.daysPerPeriod,
              remarks: `Earned leave accrual. ${remarksKey}`,
            },
          });
        });

        // Update schedule lastProcessedPeriod
        await this.prisma.leaveAccrualSchedule.update({
          where: { id: schedule.id },
          data: { lastProcessedPeriod: data.period },
        });

        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          leaveType: schedule.leaveType.name,
          status: "PROCESSED",
          amount: schedule.daysPerPeriod,
        });
      }
    }

    return response("leave", "accruals.process", results);
  }

  // ==========================================
  // Compensatory Leave Conversion
  // ==========================================
  async createCompOffConversion(data: any) {
    const conversion = await this.prisma.compOffConversion.create({
      data: {
        employeeId: data.employeeId,
        overtimeRequestId: data.overtimeRequestId,
        leaveTypeId: data.leaveTypeId,
        daysGranted: data.daysGranted,
        status: ApprovalStatus.PENDING,
      },
      include: {
        employee: true,
        overtimeRequest: true,
        leaveType: true,
      },
    });
    return response("leave", "compOffConversion.create", conversion);
  }

  async listCompOffConversions() {
    const items = await this.prisma.compOffConversion.findMany({
      include: {
        employee: true,
        overtimeRequest: true,
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("leave", "compOffConversion.list", items);
  }

  async decideCompOffConversion(id: string, status: ApprovalStatus, decidedBy: string) {
    const conversion = await this.prisma.compOffConversion.findUnique({
      where: { id },
    });
    if (!conversion) throw new NotFoundException("Comp-off conversion request not found");
    if (conversion.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Comp-off conversion request has already been processed");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.compOffConversion.update({
        where: { id },
        data: {
          status,
          decidedBy,
          decidedAt: new Date(),
        },
        include: {
          employee: true,
          overtimeRequest: true,
          leaveType: true,
        },
      });

      if (status === ApprovalStatus.APPROVED) {
        // Find or create a leave balance for the year
        const year = new Date().getFullYear();
        const balance = await tx.leaveBalance.upsert({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: conversion.employeeId,
              leaveTypeId: conversion.leaveTypeId,
              year,
            },
          },
          update: {
            accrued: { increment: conversion.daysGranted },
            available: { increment: conversion.daysGranted },
          },
          create: {
            employeeId: conversion.employeeId,
            leaveTypeId: conversion.leaveTypeId,
            year,
            openingBalance: 0,
            accrued: conversion.daysGranted,
            used: 0,
            carriedForward: 0,
            available: conversion.daysGranted,
          },
        });

        // Add LeaveLedgerEntry
        await tx.leaveLedgerEntry.create({
          data: {
            employeeId: conversion.employeeId,
            leaveTypeId: conversion.leaveTypeId,
            transactionDate: new Date(),
            transactionType: "CREDIT",
            days: conversion.daysGranted,
            remarks: `Comp-off conversion from Overtime Request: ${conversion.overtimeRequestId}`,
          },
        });
      }

      return updated;
    });

    return response("leave", "compOffConversion.decide", result);
  }
}



