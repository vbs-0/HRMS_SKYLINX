import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();
const { hash } = bcrypt;

// Must mirror apps/api/src/common/crypto.util.ts so the API can decrypt.
const ENCRYPTION_KEY = process.env.OTP_SECRET || "skylinx-peopleos-local-otp-secret-long-enough-32-chars!!!";
function encryptField(text: string): string {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "company_skylinx" },
    update: {},
    create: {
      id: "company_skylinx",
      name: "SKYLINX PeopleOS",
      legalName: "SKYLINX HR Private Limited",
      logoUrl: "/skylinx-logo.png",
      workWeek: "Monday to Saturday",
      timezone: "Asia/Kolkata",
    },
  });

  const departments = await Promise.all(
    [
      ["dept_people", "HR", "PEO"],
      ["dept_finance", "Finance", "FIN"],
      ["dept_engineering", "Engineering", "ENG"],
      ["dept_sales", "Sales", "SAL"],
      ["dept_operations", "Operations", "OPS"],
    ].map(([id, name, code]) =>
      prisma.department.upsert({
        where: { companyId_code: { companyId: company.id, code } },
        update: { name },
        create: { id, companyId: company.id, name, code },
      }),
    ),
  );

  const locations = await Promise.all(
    [
      ["loc_mumbai", "Mumbai", "Mumbai", "Maharashtra"],
      ["loc_bengaluru", "Bengaluru", "Bengaluru", "Karnataka"],
      ["loc_delhi", "Delhi", "Delhi", "Delhi"],
      ["loc_hyderabad", "Hyderabad", "Hyderabad", "Telangana"],
      ["loc_pune", "Pune", "Pune", "Maharashtra"],
    ].map(([id, name, city, state]) =>
      prisma.location.upsert({
        where: { id },
        update: {},
        create: { id, companyId: company.id, name, city, state },
      }),
    ),
  );

  const roles = await Promise.all(
    [
      ["role_super_admin", "SUPER_ADMIN"],
      ["role_hr_admin", "HR_ADMIN"],
      ["role_manager", "MANAGER"],
      ["role_employee", "EMPLOYEE"],
    ].map(([id, name]) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { id, name, isSystemRole: true },
      }),
    ),
  );

  const permissions = ["employees", "attendance", "leave", "payroll", "expenses", "holidays", "insurance", "assets", "performance", "mobile", "backup", "testing", "analytics", "saas", "approvals", "notifications", "organization", "reports", "rewards", "settings", "social", "compliance", "recruitment", "training", "travel", "grievance", "policies", "surveys", "tickets"].flatMap((module) =>
    ["create", "read", "update", "delete", "approve", "export", "configure"].map((action) => ({ module, action })),
  );

  for (const item of permissions) {
    await prisma.permission.upsert({
      where: { module_action: item },
      update: {},
      create: item,
    });
  }

  const hrPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { module: { in: ["employees", "attendance", "leave", "payroll", "expenses", "holidays", "insurance", "assets", "performance", "mobile", "backup", "testing", "analytics", "saas", "approvals", "notifications", "organization", "reports", "rewards", "social", "compliance", "recruitment", "training", "travel", "grievance", "policies", "surveys", "tickets"] }, action: "read" },
        { module: { in: ["employees", "attendance", "leave", "payroll", "expenses", "holidays", "insurance", "notifications", "rewards", "social", "recruitment", "training", "travel", "grievance", "policies", "surveys", "tickets"] }, action: "create" },
        { module: { in: ["employees", "attendance", "leave", "payroll", "expenses", "holidays", "insurance", "notifications", "organization", "recruitment", "training", "travel", "grievance", "policies", "surveys", "tickets"] }, action: "update" },
        { module: { in: ["leave", "attendance", "expenses", "insurance", "recruitment", "grievance"] }, action: "approve" },
        { module: "approvals", action: "approve" },
        { module: "employees", action: "approve" },
        { module: "payroll", action: "approve" },
        { module: "payroll", action: "configure" },
        { module: "mobile", action: "configure" },
        { module: "backup", action: "configure" },
        { module: "testing", action: "configure" },
        { module: "saas", action: "configure" },
        { module: "assets", action: "configure" },
        { module: "performance", action: "configure" },
        { module: "settings", action: "configure" },
        { module: { in: ["leave", "employees", "recruitment", "travel", "training", "grievance", "policies", "surveys", "tickets"] }, action: "configure" },
        { module: "payroll", action: "export" },
        { module: "reports", action: "export" },
        { module: "compliance", action: "export" },
      ],
    },
  });
  const hrRole = roles.find((role) => role.name === "HR_ADMIN")!;
  for (const permission of hrPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: hrRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: hrRole.id, permissionId: permission.id },
    });
  }

  const peopleDept = departments.find((item) => item.code === "PEO")!;
  const financeDept = departments.find((item) => item.code === "FIN")!;
  const engineeringDept = departments.find((item) => item.code === "ENG")!;
  const salesDept = departments.find((item) => item.code === "SAL")!;
  const operationsDept = departments.find((item) => item.code === "OPS")!;

  const designationHrManager = await prisma.designation.upsert({
    where: { id: "des_hr_manager" },
    update: {},
    create: { id: "des_hr_manager", companyId: company.id, departmentId: peopleDept.id, title: "HR Manager" },
  });
  const designationPayroll = await prisma.designation.upsert({
    where: { id: "des_payroll" },
    update: {},
    create: { id: "des_payroll", companyId: company.id, departmentId: financeDept.id, title: "Payroll Specialist" },
  });
  const designationEngineer = await prisma.designation.upsert({
    where: { id: "des_engineer" },
    update: {},
    create: { id: "des_engineer", companyId: company.id, departmentId: engineeringDept.id, title: "Frontend Engineer" },
  });
  const designationSales = await prisma.designation.upsert({
    where: { id: "des_sales" },
    update: {},
    create: { id: "des_sales", companyId: company.id, departmentId: salesDept.id, title: "Sales Executive" },
  });
  const designationOps = await prisma.designation.upsert({
    where: { id: "des_ops" },
    update: {},
    create: { id: "des_ops", companyId: company.id, departmentId: operationsDept.id, title: "Operations Lead" },
  });

  const seedEmployees = [
    ["emp_1001", "EMP-1001", "Aarav", "Mehta", "aarav.mehta@skylinx.local", peopleDept.id, designationHrManager.id, locations[0].id, "1990-06-15", "2022-01-16"],
    ["emp_1002", "EMP-1002", "Priya", "Nair", "priya.nair@skylinx.local", financeDept.id, designationPayroll.id, locations[1].id, "1992-08-20", "2023-06-10"],
    ["emp_1003", "EMP-1003", "Kabir", "Sethi", "kabir.sethi@skylinx.local", engineeringDept.id, designationEngineer.id, locations[2].id, "1994-03-05", "2024-03-15"],
    ["emp_1004", "EMP-1004", "Sara", "Khan", "sara.khan@skylinx.local", salesDept.id, designationSales.id, locations[3].id, "1995-11-12", "2024-11-20"],
    ["emp_1005", "EMP-1005", "Rohan", "Iyer", "rohan.iyer@skylinx.local", operationsDept.id, designationOps.id, locations[4].id, "1991-06-25", "2025-06-01"],
  ];

  for (const [id, employeeCode, firstName, lastName, email, departmentId, designationId, locationId, dob, joining] of seedEmployees) {
    await prisma.employee.upsert({
      where: { email },
      update: {
        managerId: id === "emp_1001" ? null : id === "emp_1002" ? "emp_1001" : id === "emp_1005" ? "emp_1001" : "emp_1005",
        dateOfBirth: new Date(dob),
        joiningDate: new Date(joining),
      },
      create: {
        id,
        companyId: company.id,
        employeeCode,
        firstName,
        lastName,
        email,
        phone: "+91 98765 41000",
        joiningDate: new Date(joining),
        dateOfBirth: new Date(dob),
        departmentId,
        designationId,
        locationId,
        managerId: id === "emp_1001" ? null : id === "emp_1002" ? "emp_1001" : id === "emp_1005" ? "emp_1001" : "emp_1005",
      },
    });

    const demoAccountNumber = `501000${employeeCode.replace("EMP-", "")}77`;
    await prisma.employeeBankDetail.upsert({
      where: { employeeId: id },
      update: { accountNumberEncrypted: encryptField(demoAccountNumber) },
      create: {
        employeeId: id,
        accountHolderName: `${firstName} ${lastName}`,
        bankName: id === "emp_1001" || id === "emp_1003" ? "HDFC Bank" : "ICICI Bank",
        accountNumberEncrypted: encryptField(demoAccountNumber),
        ifsc: id === "emp_1001" || id === "emp_1003" ? "HDFC0000124" : "ICIC0000512",
        branch: "Madhapur, Hyderabad",
        verificationStatus: "VERIFIED",
      },
    });
  }

  const hrUser = await prisma.user.upsert({
    where: { email: "hr.admin@skylinx.local" },
    update: {
      passwordHash: await hash("Skylinx@123", 12),
      tenantId: company.id,
    },
    create: {
      email: "hr.admin@skylinx.local",
      phone: "+91 90000 00001",
      passwordHash: await hash("Skylinx@123", 12),
      employeeId: "emp_1001",
      tenantId: company.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hrUser.id, roleId: roles[1].id } },
    update: {},
    create: { userId: hrUser.id, roleId: roles[1].id },
  });

  // Create System Owner / Super Admin user
  const ownerUser = await prisma.user.upsert({
    where: { email: "skylinxcode@gmail.com" },
    update: {
      passwordHash: await hash("password123", 12),
      tenantId: company.id,
    },
    create: {
      email: "skylinxcode@gmail.com",
      phone: "+91 90000 00000",
      passwordHash: await hash("password123", 12),
      status: "ACTIVE",
      tenantId: company.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerUser.id, roleId: roles[0].id } },
    update: {},
    create: { userId: ownerUser.id, roleId: roles[0].id },
  });

  // MANAGER and EMPLOYEE login accounts (used by E2E role audits)
  const roleUsers: Array<[string, string, string, string]> = [
    ["rohan.iyer@skylinx.local", "+91 98765 41005", "emp_1005", "role_manager"],
    ["kabir.sethi@skylinx.local", "+91 98765 41003", "emp_1003", "role_employee"],
  ];
  for (const [email, phone, employeeId, roleId] of roleUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        passwordHash: await hash("Skylinx@123", 12),
        tenantId: company.id,
      },
      create: {
        email,
        phone,
        passwordHash: await hash("Skylinx@123", 12),
        employeeId,
        status: "ACTIVE",
        tenantId: company.id,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
  }

  const managerPermissionSpecs: Array<[string, string]> = [
    ["employees", "read"],
    ["attendance", "read"],
    ["attendance", "approve"],
    ["leave", "read"],
    ["leave", "approve"],
    ["expenses", "approve"],
    ["recruitment", "read"],
    ["training", "approve"],
    ["travel", "approve"],
    ["grievance", "read"],
    ["policies", "read"],
    ["surveys", "read"],
    ["surveys", "create"],
    ["surveys", "configure"],
    ["tickets", "read"],
    ["tickets", "create"],
  ];
  const employeePermissionSpecs: Array<[string, string]> = [
    ["employees", "read"],
    ["employees", "update"],
    ["attendance", "create"],
    ["leave", "create"],
    ["payroll", "read"],
    ["expenses", "create"],
    ["training", "create"],
    ["travel", "create"],
    ["grievance", "create"],
    ["grievance", "read"],
    ["policies", "read"],
    ["surveys", "read"],
    ["tickets", "read"],
    ["tickets", "create"],
  ];
  for (const [roleId, specs] of [
    ["role_manager", managerPermissionSpecs],
    ["role_employee", employeePermissionSpecs],
  ] as Array<[string, Array<[string, string]>]>) {
    for (const [module, action] of specs) {
      const permission = await prisma.permission.findFirst({ where: { module, action } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id },
      });
    }
  }

  const shift = await prisma.shift.upsert({
    where: { id: "shift_general" },
    update: {},
    create: {
      id: "shift_general",
      companyId: company.id,
      name: "General Shift",
      startTime: "09:30",
      endTime: "18:30",
      graceMinutes: 10,
    },
  });

  await prisma.attendanceRule.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      lateMarkAfterMinutes: 10,
      maxLateMarksPerMonth: 3,
      geoRequired: true,
      overtimeEnabled: true,
    },
  });

  for (const module of [
    "employees",
    "documents",
    "cards",
    "attendance",
    "leave",
    "holidays",
    "organization",
    "payroll",
    "expenses",
    "insurance",
    "assets",
    "performance",
    "approvals",
    "mobile",
    "backup",
    "testing",
    "analytics",
    "saas",
    "notifications",
    "social",
    "rewards",
    "compliance",
    "reports",
    "security",
    "grievance",
  ]) {
    await prisma.moduleSetting.upsert({
      where: { companyId_module: { companyId: company.id, module } },
      update: { enabled: true },
      create: { companyId: company.id, module, enabled: true },
    });
  }

  for (const employeeId of ["emp_1001", "emp_1002", "emp_1003", "emp_1004"]) {
    const date = new Date("2026-05-25");
    await prisma.attendanceLog.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {},
      create: {
        employeeId,
        shiftId: shift.id,
        date,
        checkInAt: employeeId === "emp_1004" ? null : new Date("2026-05-25T09:25:00+05:30"),
        checkOutAt: employeeId === "emp_1004" ? null : new Date("2026-05-25T18:35:00+05:30"),
        status: employeeId === "emp_1004" ? "ABSENT" : "PRESENT",
        source: "WEB",
      },
    });
  }

  for (const [id, name, date, type, locationId] of [
    ["holiday_republic_2026", "Republic Day", "2026-01-26", "MANDATORY", null],
    ["holiday_holi_2026", "Holi", "2026-03-04", "REGIONAL", locations[2].id],
    ["holiday_independence_2026", "Independence Day", "2026-08-15", "MANDATORY", null],
    ["holiday_diwali_2026", "Diwali", "2026-11-08", "OPTIONAL", null],
    ["holiday_christmas_2026", "Christmas", "2026-12-25", "MANDATORY", null],
  ] as const) {
    await prisma.holiday.upsert({
      where: { id },
      update: { name, date: new Date(date), type, locationId },
      create: {
        id,
        companyId: company.id,
        name,
        date: new Date(date),
        type,
        locationId,
        status: "ACTIVE",
      },
    });
  }

  const casualLeave = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: "CL" } },
    update: {},
    create: { companyId: company.id, name: "Casual Leave", code: "CL", annualQuota: 12 },
  });

  const sickLeave = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: "SL" } },
    update: {},
    create: { companyId: company.id, name: "Sick Leave", code: "SL", annualQuota: 8 },
  });

  for (const employeeId of ["emp_1001", "emp_1002", "emp_1003", "emp_1004", "emp_1005"]) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: casualLeave.id,
          year: 2026,
        },
      },
      update: {},
      create: {
        employeeId,
        leaveTypeId: casualLeave.id,
        year: 2026,
        openingBalance: 12,
        accrued: 12,
        used: 0,
        carriedForward: 0,
        available: 12,
      },
    });

    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: sickLeave.id,
          year: 2026,
        },
      },
      update: {},
      create: {
        employeeId,
        leaveTypeId: sickLeave.id,
        year: 2026,
        openingBalance: 8,
        accrued: 8,
        used: 0,
        carriedForward: 0,
        available: 8,
      },
    });
  }

  const leaveReqCount = await prisma.leaveRequest.count();
  if (leaveReqCount === 0) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: "emp_1003",
        leaveTypeId: casualLeave.id,
        fromDate: new Date("2026-05-28"),
        toDate: new Date("2026-05-29"),
        days: 2,
        reason: "Family function",
        status: "PENDING",
      },
    });
  }

  const payrollRun = await prisma.payrollRun.upsert({
    where: { companyId_month_year: { companyId: company.id, month: 5, year: 2026 } },
    update: {},
    create: { companyId: company.id, month: 5, year: 2026, status: "DRAFT" },
  });

  const salaryInputs = [
    ["emp_1001", 1450000, 580000, 290000, 390000, 21600, 0, 2400, 48000],
    ["emp_1002", 980000, 392000, 196000, 250000, 21600, 0, 2400, 30000],
    ["emp_1003", 1680000, 672000, 336000, 480000, 21600, 0, 2400, 60000],
    ["emp_1004", 820000, 328000, 164000, 210000, 21600, 0, 2400, 18000],
  ] as const;

  for (const [employeeId, annualCtc, basic, hra, allowances, employeePf, esi, professionalTax, tds] of salaryInputs) {
    const existing = await prisma.salaryStructure.findFirst({
      where: { employeeId, effectiveFrom: new Date("2026-04-01") },
    });
    if (!existing) {
      await prisma.salaryStructure.create({
        data: {
          employeeId,
          effectiveFrom: new Date("2026-04-01"),
          annualCtc,
          basic,
          hra,
          allowances,
          employeePf,
          esi,
          professionalTax,
          tds,
          status: "ACTIVE",
        },
      });
    }
  }

  await prisma.payslip.upsert({
    where: { payrollRunId_employeeId: { payrollRunId: payrollRun.id, employeeId: "emp_1001" } },
    update: {},
    create: {
      payrollRunId: payrollRun.id,
      employeeId: "emp_1001",
      grossPay: 120833,
      deductions: 16800,
      netPay: 104033,
      status: "DRAFT",
    },
  });

  const docCount = await prisma.employeeDocument.count();
  if (docCount === 0) {
    await prisma.employeeDocument.create({
      data: {
        employeeId: "emp_1001",
        documentType: "PAN",
        fileUrl: "s3://skylinx-peopleos/documents/emp_1001/pan.pdf",
        verificationStatus: "VERIFIED",
      },
    });
  }

  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.create({
      data: {
        employeeId: "emp_1004",
        category: "Travel",
        amount: 1850,
        receiptUrl: "https://storage.skylinx.local/expenses/emp_1004/travel-may.pdf",
        claimDate: new Date("2026-05-24"),
        status: "PENDING",
      },
    });
  }

  const insuranceCount = await prisma.employeeInsurance.count();
  if (insuranceCount === 0) {
    const insurancePolicy = await prisma.employeeInsurance.create({
      data: {
        employeeId: "emp_1002",
        provider: "SKYLINX Group Health",
        policyNumber: "SGH-2026-1002",
        policyType: "Group Mediclaim",
        coverageAmount: 500000,
        premiumAmount: 18500,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2027-03-31"),
        status: "ACTIVE",
      },
    });

    await prisma.insuranceDependent.create({
      data: {
        employeeId: "emp_1002",
        insuranceId: insurancePolicy.id,
        fullName: "Anika Nair",
        relationship: "Spouse",
        dateOfBirth: new Date("1995-07-12"),
        status: "ACTIVE",
      },
    });

    await prisma.insuranceClaim.create({
      data: {
        employeeId: "emp_1002",
        insuranceId: insurancePolicy.id,
        claimNumber: "CLM-2026-001",
        claimType: "Hospitalization",
        claimAmount: 42000,
        claimDate: new Date("2026-05-20"),
        documentUrl: "https://storage.skylinx.local/insurance/emp_1002/claim-001.pdf",
        status: "PENDING",
      },
    });
  }

  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    await prisma.notification.create({
      data: {
        userId: hrUser.id,
        channel: "EMAIL",
        title: "May payroll verification closes today",
        body: "Please review pending payroll items before locking the run.",
      },
    });

    await prisma.notification.create({
      data: {
        userId: hrUser.id,
        channel: "WHATSAPP",
        title: "Attendance reminder",
        body: "Four employees have not completed check-out for today.",
        status: "PENDING",
      },
    });

    await prisma.notification.create({
      data: {
        userId: hrUser.id,
        channel: "IN_APP",
        title: "Leave approval pending",
        body: "Kabir Sethi has a casual leave request awaiting HR action.",
        status: "SENT",
        sentAt: new Date("2026-05-25T11:00:00+05:30"),
      },
    });
  }

  const socialCount = await prisma.socialPost.count();
  if (socialCount === 0) {
    const announcement = await prisma.socialPost.create({
      data: {
        authorUserId: hrUser.id,
        type: "ANNOUNCEMENT",
        title: "May payroll review window",
        body: "Payroll verification for May is open. Managers should close attendance corrections before payroll lock.",
        pinned: true,
      },
    });

    const recognition = await prisma.socialPost.create({
      data: {
        authorUserId: hrUser.id,
        type: "RECOGNITION",
        title: "Employee recognition",
        body: "Congratulations to Sara Khan for closing the Hyderabad client onboarding ahead of schedule.",
      },
    });

    await prisma.socialLike.create({
      data: {
        postId: recognition.id,
        userId: hrUser.id,
      },
    });

    await prisma.socialComment.create({
      data: {
        postId: announcement.id,
        userId: hrUser.id,
        body: "Please coordinate any pending regularization by end of day.",
      },
    });
  }

  await prisma.rewardVoucher.upsert({
    where: { code: "SKY-COFFEE-500" },
    update: {},
    create: {
      code: "SKY-COFFEE-500",
      title: "Cafe Voucher",
      provider: "SKYLINX Benefits",
      valueAmount: 500,
      pointsCost: 250,
      status: "ACTIVE",
    },
  });

  const benefitCount = await prisma.benefitItem.count();
  if (benefitCount === 0) {
    await prisma.benefitItem.create({
      data: {
        title: "Health Checkup",
        provider: "SKYLINX Wellness",
        category: "Wellness",
        description: "Annual preventive health checkup for employees.",
        pointsCost: 1200,
        status: "ACTIVE",
      },
    });
  }

  const rewardLedgerCount = await prisma.rewardLedger.count();
  if (rewardLedgerCount === 0) {
    await prisma.rewardLedger.create({
      data: {
        employeeId: "emp_1004",
        points: 300,
        reason: "Client onboarding excellence",
        source: "RECOGNITION",
      },
    });
  }

  const recognitionRewardCount = await prisma.recognitionReward.count();
  if (recognitionRewardCount === 0) {
    await prisma.recognitionReward.create({
      data: {
        recipientEmployeeId: "emp_1004",
        givenByUserId: hrUser.id,
        title: "Client onboarding excellence",
        message: "Great ownership on the Hyderabad client onboarding.",
        points: 300,
      },
    });
  }

  const auditLogCount = await prisma.auditLog.count();
  if (auditLogCount === 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId: hrUser.id,
        module: "seed",
        action: "create",
        entityType: "database",
        entityId: company.id,
        newValueJson: { product: "SKYLINX PeopleOS" },
      },
    });
  }

  // Seed Employee Grades
  const gradesData = [
    { name: "Grade L1", maxExpenseLimit: 5000, description: "Junior Staff" },
    { name: "Grade L2", maxExpenseLimit: 15000, description: "Mid-level Staff" },
    { name: "Grade L3", maxExpenseLimit: 50000, description: "Senior Leadership" },
  ];
  for (const g of gradesData) {
    await prisma.employeeGrade.upsert({
      where: { companyId_name: { companyId: company.id, name: g.name } },
      update: { maxExpenseLimit: g.maxExpenseLimit, description: g.description },
      create: { companyId: company.id, name: g.name, maxExpenseLimit: g.maxExpenseLimit, description: g.description },
    });
  }

  // Seed Employment Types
  const empTypesData = ["Full-Time Regular", "Part-Time Regular", "Contractor", "Intern"];
  for (const t of empTypesData) {
    await prisma.employmentType.upsert({
      where: { companyId_name: { companyId: company.id, name: t } },
      update: {},
      create: { companyId: company.id, name: t },
    });
  }

  // Pending approval requests so the MANAGER approval inbox has demo items
  const kabirLog = await prisma.attendanceLog.findFirst({ where: { employeeId: "emp_1003" } });
  if (kabirLog) {
    const pendingReg = await prisma.attendanceRegularization.findFirst({
      where: { employeeId: "emp_1003", status: "PENDING" },
    });
    if (!pendingReg) {
      await prisma.attendanceRegularization.create({
        data: {
          employeeId: "emp_1003",
          attendanceLogId: kabirLog.id,
          requestedCheckInAt: new Date("2026-05-25T04:00:00.000Z"),
          requestedCheckOutAt: new Date("2026-05-25T13:00:00.000Z"),
          reason: "Biometric failure at entry gate",
          status: "PENDING",
        },
      });
    }
    const pendingOt = await prisma.overtimeRequest.findFirst({
      where: { employeeId: "emp_1003", status: "PENDING" },
    });
    if (!pendingOt) {
      await prisma.overtimeRequest.create({
        data: {
          employeeId: "emp_1003",
          attendanceLogId: kabirLog.id,
          hours: 2.5,
          reason: "Deploying critical patch to production",
          status: "PENDING",
        },
      });
    }
  }

  // Seed Gratuity Rule
  await prisma.gratuityRule.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      minYears: 5,
      multiplier: 0.5769, // 15/26
    },
  });

  // Seed Tax Slabs
  const taxSlabs = [
    { regime: "NEW", fromAmount: 0, toAmount: 300000, ratePercent: 0 },
    { regime: "NEW", fromAmount: 300000, toAmount: 700000, ratePercent: 5 },
    { regime: "NEW", fromAmount: 700000, toAmount: 1000000, ratePercent: 10 },
    { regime: "NEW", fromAmount: 1000000, toAmount: 1200000, ratePercent: 15 },
    { regime: "NEW", fromAmount: 1200000, toAmount: 1500000, ratePercent: 20 },
    { regime: "NEW", fromAmount: 1500000, toAmount: null, ratePercent: 30 },

    { regime: "OLD", fromAmount: 0, toAmount: 250000, ratePercent: 0 },
    { regime: "OLD", fromAmount: 250000, toAmount: 500000, ratePercent: 5 },
    { regime: "OLD", fromAmount: 500000, toAmount: 1000000, ratePercent: 20 },
    { regime: "OLD", fromAmount: 1000000, toAmount: null, ratePercent: 30 },
  ];

  await prisma.incomeTaxSlab.deleteMany({});
  for (const slab of taxSlabs) {
    await prisma.incomeTaxSlab.create({
      data: slab,
    });
  }

  // Seed Default Policy & Accrual Schedule
  const defaultPolicy = await prisma.leavePolicy.upsert({
    where: { id: "policy_default" },
    update: {},
    create: {
      id: "policy_default",
      companyId: company.id,
      name: "Standard Leave Policy",
      description: "Standard company leave policy",
    },
  });

  for (const empId of ["emp_1001", "emp_1002", "emp_1003", "emp_1004", "emp_1005"]) {
    await prisma.leavePolicyAssignment.upsert({
      where: { id: `assign_${empId}` },
      update: {},
      create: {
        id: `assign_${empId}`,
        employeeId: empId,
        policyId: defaultPolicy.id,
        effectiveFrom: new Date("2026-01-01"),
      },
    });
  }

  await prisma.leaveAccrualSchedule.upsert({
    where: { id: "accrual_cl" },
    update: {},
    create: {
      id: "accrual_cl",
      leavePolicyId: defaultPolicy.id,
      leaveTypeId: casualLeave.id,
      frequency: "MONTHLY",
      daysPerPeriod: 1.0,
    },
  });

  // P2: Comp-off Leave Type
  const compOffLeave = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId: company.id, code: "COMP-OFF" } },
    update: {},
    create: { companyId: company.id, name: "Compensatory Off", code: "COMP-OFF", annualQuota: 0 },
  });

  for (const employeeId of ["emp_1001", "emp_1002", "emp_1003", "emp_1004", "emp_1005"]) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: compOffLeave.id,
          year: 2026,
        },
      },
      update: {},
      create: {
        employeeId,
        leaveTypeId: compOffLeave.id,
        year: 2026,
        openingBalance: 0,
        accrued: 0,
        used: 0,
        carriedForward: 0,
        available: 0,
      },
    });
  }

  // P2: Letter Templates
  await prisma.letterTemplate.upsert({
    where: { id: "temp_offer" },
    update: {},
    create: {
      id: "temp_offer",
      companyId: company.id,
      type: "OFFER",
      title: "Standard Offer Letter",
      body: "Dear {{candidateName}},\n\nWe are pleased to offer you the position of {{designationTitle}} at SKYLINX. Your annual CTC will be INR {{annualCtc}}.\n\nBest regards,\nSKYLINX HR",
    },
  });

  await prisma.letterTemplate.upsert({
    where: { id: "temp_appointment" },
    update: {},
    create: {
      id: "temp_appointment",
      companyId: company.id,
      type: "APPOINTMENT",
      title: "Standard Appointment Letter",
      body: "Dear {{employeeName}},\n\nThis is to confirm your appointment as {{designationTitle}} starting {{joiningDate}}.\n\nSincerely,\nSKYLINX Management",
    },
  });

  await prisma.letterTemplate.upsert({
    where: { id: "temp_relieving" },
    update: {},
    create: {
      id: "temp_relieving",
      companyId: company.id,
      type: "RELIEVING",
      title: "Standard Relieving Letter",
      body: "To Whom It May Concern,\n\nThis is to certify that {{employeeName}} was employed with us as {{designationTitle}} from {{joiningDate}} to {{relievingDate}}.\n\nBest wishes,\nSKYLINX HR",
    },
  });

  // P2: Staffing Plan
  await prisma.staffingPlan.upsert({
    where: { companyId_departmentId_designationId: { companyId: company.id, departmentId: engineeringDept.id, designationId: designationEngineer.id } },
    update: {},
    create: {
      companyId: company.id,
      departmentId: engineeringDept.id,
      designationId: designationEngineer.id,
      budgetedHeadcount: 5,
      currentHeadcount: 1,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });

  // ==========================================
  // Wave 4 Seeding: Policies, Announcements, Custom Fields
  // ==========================================
  // 1. Company Policies
  const leavePolicy = await prisma.companyPolicy.upsert({
    where: { id: "policy_leave" },
    update: {},
    create: {
      id: "policy_leave",
      companyId: company.id,
      title: "Leave Policy",
      category: "Leave",
      description: "Annual leave allocations and guidelines.",
      contentHtml: "<p>Employees are entitled to 12 days of Casual Leave and 8 days of Sick Leave per year.</p>",
      version: "1.0",
      effectiveDate: new Date("2026-01-01"),
      requiresAcknowledgment: true,
      status: "ACTIVE",
    },
  });

  const conductPolicy = await prisma.companyPolicy.upsert({
    where: { id: "policy_conduct" },
    update: {},
    create: {
      id: "policy_conduct",
      companyId: company.id,
      title: "Code of Conduct",
      category: "Conduct",
      description: "Company standards of behavior.",
      contentHtml: "<p>All employees are expected to maintain professional behavior and integrity.</p>",
      version: "1.0",
      effectiveDate: new Date("2026-01-01"),
      requiresAcknowledgment: true,
      status: "ACTIVE",
    },
  });

  const securityPolicy = await prisma.companyPolicy.upsert({
    where: { id: "policy_security" },
    update: {},
    create: {
      id: "policy_security",
      companyId: company.id,
      title: "IT & Security Policy",
      category: "IT",
      description: "Data protection and system security rules.",
      contentHtml: "<p>Use authorized VPN, secure passwords, and report security incidents immediately.</p>",
      version: "1.1",
      effectiveDate: new Date("2026-01-01"),
      requiresAcknowledgment: false,
      status: "ACTIVE",
    },
  });

  // 2. Policy Acknowledgment (1 example)
  await prisma.policyAcknowledgment.upsert({
    where: { policyId_employeeId: { policyId: "policy_leave", employeeId: "emp_1001" } },
    update: {},
    create: {
      policyId: "policy_leave",
      employeeId: "emp_1001",
      acknowledgedAt: new Date("2026-06-01T10:00:00Z"),
    },
  });

  // 3. Announcements
  await prisma.announcement.upsert({
    where: { id: "announcement_hackathon" },
    update: {},
    create: {
      id: "announcement_hackathon",
      companyId: company.id,
      title: "Annual Hackathon 2026",
      body: "SKYLINX Annual Hackathon is scheduled for July 15-16. Registrations are open!",
      pinned: true,
      audience: "ALL",
      publishedAt: new Date("2026-06-05T09:00:00Z"),
    },
  });

  await prisma.announcement.upsert({
    where: { id: "announcement_quarterly" },
    update: {},
    create: {
      id: "announcement_quarterly",
      companyId: company.id,
      title: "Quarterly Review Meeting",
      body: "Join us for the Q2 review meeting on June 30 at 3 PM in the main conference hall.",
      pinned: false,
      audience: "ALL",
      publishedAt: new Date("2026-06-10T14:00:00Z"),
    },
  });

  // 4. Custom Field Definitions
  const tshirtField = await prisma.customFieldDefinition.upsert({
    where: { companyId_fieldKey: { companyId: company.id, fieldKey: "tshirt_size" } },
    update: {},
    create: {
      companyId: company.id,
      entityType: "EMPLOYEE",
      label: "T-Shirt Size",
      fieldKey: "tshirt_size",
      fieldType: "SELECT",
      optionsJson: '["S", "M", "L", "XL", "XXL"]',
      required: true,
    },
  });

  const contactField = await prisma.customFieldDefinition.upsert({
    where: { companyId_fieldKey: { companyId: company.id, fieldKey: "emergency_contact" } },
    update: {},
    create: {
      companyId: company.id,
      entityType: "EMPLOYEE",
      label: "Emergency Contact",
      fieldKey: "emergency_contact",
      fieldType: "TEXT",
      required: false,
    },
  });

  // 5. Custom Field Values
  // Kabir Sethi (emp_1003)
  await prisma.customFieldValue.upsert({
    where: { definitionId_employeeId: { definitionId: tshirtField.id, employeeId: "emp_1003" } },
    update: {},
    create: {
      definitionId: tshirtField.id,
      employeeId: "emp_1003",
      valueJson: '"L"',
    },
  });

  await prisma.customFieldValue.upsert({
    where: { definitionId_employeeId: { definitionId: contactField.id, employeeId: "emp_1003" } },
    update: {},
    create: {
      definitionId: contactField.id,
      employeeId: "emp_1003",
      valueJson: '"9876543210"',
    },
  });

  // Rohan Iyer (emp_1005)
  await prisma.customFieldValue.upsert({
    where: { definitionId_employeeId: { definitionId: tshirtField.id, employeeId: "emp_1005" } },
    update: {},
    create: {
      definitionId: tshirtField.id,
      employeeId: "emp_1005",
      valueJson: '"XL"',
    },
  });

  await prisma.customFieldValue.upsert({
    where: { definitionId_employeeId: { definitionId: contactField.id, employeeId: "emp_1005" } },
    update: {},
    create: {
      definitionId: contactField.id,
      employeeId: "emp_1005",
      valueJson: '"9988776655"',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
