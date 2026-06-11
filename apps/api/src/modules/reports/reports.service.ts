import { Injectable } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContext } from "../../common/tenant-context";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async report(type: string) {
    const handlers: Record<string, () => Promise<unknown>> = {
      employees: () => this.employeeReport(),
      attendance: () => this.attendanceReport(),
      leave: () => this.leaveReport(),
      payroll: () => this.payrollReport(),
      expenses: () => this.expenseReport(),
      compliance: () => this.complianceReport(),
    };
    const data = await (handlers[type] || handlers.employees)();
    return response("reports", type, data);
  }

  async export() {
    const audit = await this.prisma.auditLog.create({
      data: {
        module: "reports",
        action: "export.queue",
        entityType: "report_export",
        entityId: `export_${Date.now()}`,
        newValueJson: {
          format: "xlsx",
          status: "QUEUED",
          queuedAt: new Date().toISOString(),
        },
      },
    });
    return response("reports", "export", { format: "xlsx", status: "queued", auditId: audit.id });
  }

  async buildCustomReport(body: any) {
    const tenantId = TenantContext.getTenantId();
    const { model, fields, where } = body;

    const whitelist: Record<string, { prismaModel: string; fields: Record<string, string> }> = {
      employee: {
        prismaModel: "employee",
        fields: {
          employeeCode: "Employee ID",
          firstName: "First Name",
          lastName: "Last Name",
          email: "Email",
          phone: "Phone Number",
          gender: "Gender",
          joiningDate: "Joining Date",
          status: "Status",
          panNumber: "PAN Number",
        },
      },
      attendanceLog: {
        prismaModel: "attendanceLog",
        fields: {
          date: "Date",
          checkInAt: "Check-In",
          checkOutAt: "Check-Out",
          status: "Attendance Status",
          overtimeMinutes: "Overtime (Min)",
        },
      },
      leaveRequest: {
        prismaModel: "leaveRequest",
        fields: {
          fromDate: "From Date",
          toDate: "To Date",
          days: "Leave Days",
          status: "Status",
          reason: "Reason",
        },
      },
      payslip: {
        prismaModel: "payslip",
        fields: {
          grossPay: "Gross Pay",
          deductions: "Deductions",
          netPay: "Net Pay",
          status: "Status",
        },
      },
      expense: {
        prismaModel: "expense",
        fields: {
          category: "Category",
          amount: "Amount",
          claimDate: "Claim Date",
          status: "Status",
          description: "Description",
        },
      },
    };

    const whitelistConfig = whitelist[model];
    if (!whitelistConfig) {
      throw new Error(`Invalid or non-whitelisted model: ${model}`);
    }

    const prismaModel = whitelistConfig.prismaModel;
    const allowedFields = whitelistConfig.fields;

    // Filter requested fields to only allow whitelisted ones
    const selectedFields = (fields || []).filter((f: string) => f in allowedFields);
    if (selectedFields.length === 0) {
      // Default to all whitelisted fields if none specified
      selectedFields.push(...Object.keys(allowedFields));
    }

    // Safely construct select block
    const selectObj: any = {};
    for (const f of selectedFields) {
      selectObj[f] = true;
    }

    // Set up where filters safely
    const queryWhere: any = {};
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (key === "status" && typeof value === "string" && value) {
          queryWhere.status = value;
        }
      }
    }

    // For non-employee models, always join employee to show who it belongs to
    const headers: Record<string, string> = {};
    if (model !== "employee") {
      headers["employeeCode"] = "Employee ID";
      headers["employeeName"] = "Employee Name";
      selectObj.employee = {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
        },
      };
    }

    for (const f of selectedFields) {
      headers[f] = allowedFields[f];
    }

    // Scope to current company
    if (model === "employee") {
      queryWhere.companyId = tenantId;
    } else {
      queryWhere.employee = { companyId: tenantId };
    }

    // Enforce max take limit of 5000
    const limit = Math.min(Number(body.take) || 5000, 5000);

    const rawData = await (this.prisma as any)[prismaModel].findMany({
      where: queryWhere,
      select: selectObj,
      take: limit,
    });

    // Flatten / map to readable values
    const rows = rawData.map((row: any) => {
      const mapped: any = {};
      if (model !== "employee" && row.employee) {
        mapped["employeeCode"] = row.employee.employeeCode;
        mapped["employeeName"] = `${row.employee.firstName} ${row.employee.lastName}`;
      }
      for (const f of selectedFields) {
        let val = row[f];
        if (val instanceof Date) {
          val = val.toISOString().split("T")[0];
        }
        mapped[f] = val;
      }
      return mapped;
    });

    return response("reports", "custom", {
      headers,
      rows,
      total: rows.length,
    });
  }


  private async employeeReport() {
    const tenantId = TenantContext.getTenantId();
    const employees = await this.prisma.employee.findMany({
      where: tenantId ? { companyId: tenantId } : {},
      include: { department: true, designation: true, location: true },
      orderBy: { employeeCode: "asc" },
    });
    return {
      type: "employees",
      total: employees.length,
      rows: employees.map((employee) => ({
        code: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name || "-",
        designation: employee.designation?.title || "-",
        location: employee.location?.name || "-",
        status: employee.status,
      })),
    };
  }

  private async attendanceReport() {
    const tenantId = TenantContext.getTenantId();
    const logs = await this.prisma.attendanceLog.findMany({
      where: tenantId ? { employee: { companyId: tenantId } } : {},
      include: { employee: true, shift: true },
      orderBy: { date: "desc" },
      take: 100,
    });
    return {
      type: "attendance",
      total: logs.length,
      present: logs.filter((log) => log.status === "PRESENT").length,
      late: logs.filter((log) => log.status === "LATE").length,
      absent: logs.filter((log) => log.status === "ABSENT").length,
      rows: logs.map((log) => ({
        employee: `${log.employee.firstName} ${log.employee.lastName}`,
        date: log.date,
        shift: log.shift?.name || "-",
        checkInAt: log.checkInAt,
        checkOutAt: log.checkOutAt,
        status: log.status,
      })),
    };
  }

  private async leaveReport() {
    const tenantId = TenantContext.getTenantId();
    const requests = await this.prisma.leaveRequest.findMany({
      where: tenantId ? { employee: { companyId: tenantId } } : {},
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      type: "leave",
      total: requests.length,
      pending: requests.filter((request) => request.status === "PENDING").length,
      approved: requests.filter((request) => request.status === "APPROVED").length,
      rows: requests.map((request) => ({
        employee: `${request.employee.firstName} ${request.employee.lastName}`,
        leaveType: request.leaveType.name,
        fromDate: request.fromDate,
        toDate: request.toDate,
        days: request.days,
        status: request.status,
      })),
    };
  }

  private async payrollReport() {
    const tenantId = TenantContext.getTenantId();
    const payslips = await this.prisma.payslip.findMany({
      where: tenantId ? { employee: { companyId: tenantId } } : {},
      include: { employee: true, payrollRun: true },
      orderBy: [{ payrollRun: { year: "desc" } }, { payrollRun: { month: "desc" } }],
    });
    const gross = payslips.reduce((sum, item) => sum + Number(item.grossPay), 0);
    const deductions = payslips.reduce((sum, item) => sum + Number(item.deductions), 0);
    const net = payslips.reduce((sum, item) => sum + Number(item.netPay), 0);
    return {
      type: "payroll",
      total: payslips.length,
      gross,
      deductions,
      net,
      rows: payslips.map((payslip) => ({
        employee: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
        month: payslip.payrollRun.month,
        year: payslip.payrollRun.year,
        grossPay: payslip.grossPay,
        deductions: payslip.deductions,
        netPay: payslip.netPay,
        status: payslip.status,
      })),
    };
  }

  private async expenseReport() {
    const tenantId = TenantContext.getTenantId();
    const expenses = await this.prisma.expense.findMany({
      where: tenantId ? { employee: { companyId: tenantId } } : {},
      include: { employee: true },
      orderBy: { claimDate: "desc" },
    });
    return {
      type: "expenses",
      total: expenses.length,
      amount: expenses.reduce((sum, item) => sum + Number(item.amount), 0),
      pending: expenses.filter((expense) => expense.status === "PENDING").length,
      rows: expenses.map((expense) => ({
        employee: `${expense.employee.firstName} ${expense.employee.lastName}`,
        category: expense.category,
        amount: expense.amount,
        claimDate: expense.claimDate,
        status: expense.status,
      })),
    };
  }

  private async complianceReport() {
    const tenantId = TenantContext.getTenantId();
    const salaryStructures = await this.prisma.salaryStructure.findMany({
      where: tenantId ? { employee: { companyId: tenantId } } : {},
      include: { employee: true },
    });
    const payrollRuns = await this.prisma.payrollRun.findMany({
      where: tenantId ? { companyId: tenantId } : {},
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return {
      type: "compliance",
      totalEmployees: salaryStructures.length,
      payrollRuns: payrollRuns.length,
      pf: salaryStructures.reduce((sum, item) => sum + Number(item.employeePf), 0),
      esi: salaryStructures.reduce((sum, item) => sum + Number(item.esi), 0),
      professionalTax: salaryStructures.reduce((sum, item) => sum + Number(item.professionalTax), 0),
      tds: salaryStructures.reduce((sum, item) => sum + Number(item.tds), 0),
      rows: salaryStructures.map((salary) => ({
        employee: `${salary.employee.firstName} ${salary.employee.lastName}`,
        employeePf: salary.employeePf,
        esi: salary.esi,
        professionalTax: salary.professionalTax,
        tds: salary.tds,
      })),
    };
  }
}
