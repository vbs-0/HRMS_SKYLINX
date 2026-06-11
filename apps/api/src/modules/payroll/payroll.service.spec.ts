import { Test, TestingModule } from "@nestjs/testing";
import { PayrollService } from "./payroll.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ApprovalStatus } from "@prisma/client";

describe("PayrollService (Indian Tax & Compliance Math)", () => {
  let service: PayrollService;
  let prisma: PrismaService;

  const mockPrismaService = {
    salaryStructure: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    payrollRun: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    additionalSalary: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    employeeBenefitClaim: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    employeeTaxExemptionDeclaration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    payslip: {
      upsert: jest.fn(),
    },
    payrollComponent: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    incomeTaxSlab: {
      findMany: jest.fn(),
    },
    payrollCorrection: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    employeeLoan: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    loanRepayment: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    prisma = module.get<PrismaService>(PrismaService);

    mockPrismaService.incomeTaxSlab.findMany.mockResolvedValue([]);
    mockPrismaService.payrollCorrection.findMany.mockResolvedValue([]);
    mockPrismaService.employeeLoan.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Indian Compliance Math Calculations", () => {
    it("should calculate PF with â‚¹15,000 wage ceiling and correct ESIC / PT slabs", async () => {
      const mockRun = { id: "run-1", companyId: "company-1", month: 6, year: 2026, status: ApprovalStatus.DRAFT };
      mockPrismaService.payrollRun.findUnique.mockResolvedValue(mockRun);
      
      const mockEmployees = [
        { id: "emp-high", companyId: "company-1", status: "ACTIVE" },
        { id: "emp-low", companyId: "company-1", status: "ACTIVE" }
      ];
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      // Setup high earning structure: Basic 60,000 (monthly 5000), HRA 24000 (monthly 2000), Allowance 12000 (monthly 1000)
      // Total monthly Gross = 8,000 -> ESI applicable (gross <= 21,000) -> 8,000 * 0.0075 = 60
      // PF: 12% of 5,000 (Basic < 15,000) = 600
      // PT: Gross 8,000 <= 15,000 -> PT = 0
      const structHigh = {
        employeeId: "emp-high",
        basic: 60000,
        hra: 24000,
        allowances: 12000,
        professionalTax: 0,
        employeePf: 0,
        esi: 0,
        tds: 0,
      };

      // Setup high earning structure: Basic 2,40,000 (monthly 20000), HRA 1,20,000 (monthly 10000)
      // Total monthly Gross = 30,000 -> ESI = 0 (gross > 21,000)
      // PF Basic cap: min(20000, 15000) = 15000. 12% of 15,000 = 1800
      // PT: Gross 30,000 > 15,000 -> PT = 200
      const structLow = {
        employeeId: "emp-low",
        basic: 240000,
        hra: 120000,
        allowances: 0,
        professionalTax: 0,
        employeePf: 0,
        esi: 0,
        tds: 0,
      };

      mockPrismaService.salaryStructure.findFirst
        .mockImplementation((args) => {
          if (args.where.employeeId === "emp-high") return Promise.resolve(structHigh);
          if (args.where.employeeId === "emp-low") return Promise.resolve(structLow);
          return Promise.resolve(null);
        });

      mockPrismaService.expense.findMany.mockResolvedValue([]);
      mockPrismaService.additionalSalary.findMany.mockResolvedValue([]);
      mockPrismaService.employeeBenefitClaim.findMany.mockResolvedValue([]);
      mockPrismaService.employeeTaxExemptionDeclaration.findUnique.mockResolvedValue(null);

      mockPrismaService.payslip.upsert.mockResolvedValue({ id: "payslip-1" });
      mockPrismaService.payrollComponent.createMany.mockResolvedValue({ count: 5 });
      mockPrismaService.payrollRun.update.mockResolvedValue({ ...mockRun, status: ApprovalStatus.APPROVED });

      const result = await service.calculate("run-1");
      expect(result.data).toBeDefined();

      // Verify transaction queries
      expect(mockPrismaService.salaryStructure.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.payslip.upsert).toHaveBeenCalledTimes(2);

      // Verify the calculations passed matching arguments inside upsert
      const firstUpsertCall = mockPrismaService.payslip.upsert.mock.calls[0][0];
      const secondUpsertCall = mockPrismaService.payslip.upsert.mock.calls[1][0];

      // Employee 1: emp-high (gross 8,000): PF = 600, ESI = 60, PT = 0. Deductions = 660. Net pay = 8000 - 660 = 7340
      expect(firstUpsertCall.create.grossPay).toBe(8000);
      expect(firstUpsertCall.create.deductions).toBe(660);

      // Employee 2: emp-low (gross 30,000): PF cap basic 15,000 -> PF = 1800, ESI = 0, PT = 200. Deductions = 2000. Net pay = 30000 - 2000 = 28000
      expect(secondUpsertCall.create.grossPay).toBe(30000);
      expect(secondUpsertCall.create.deductions).toBe(2000);
    });

    it("should calculate TDS under the NEW regime with standard rebate (auto zero if taxableIncome <= 700k)", async () => {
      const mockRun = { id: "run-2", companyId: "company-1", month: 6, year: 2026, status: ApprovalStatus.DRAFT };
      mockPrismaService.payrollRun.findUnique.mockResolvedValue(mockRun);

      const mockEmployees = [
        { id: "emp-tds-new", companyId: "company-1", status: "ACTIVE" }
      ];
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      // CTC 9,00,000 -> monthly Basic 37,500, HRA 15,000, Allowances 22,500. Monthly Gross = 75,000.
      // Annual Gross = 9,00,000.
      // Standard deduction = 75,000.
      // Taxable income = 9,00,000 - 75,000 = 8,25,000.
      // Slabs:
      // - Up to 3,00,000: 0
      // - 3,00,001 to 7,00,000: 4,00,000 * 0.05 = 20,000
      // - 7,00,001 to 8,25,000: 1,25,000 * 0.10 = 12,500
      // Total Tax Liability = 32,500.
      // Cess = 32,500 * 0.04 = 1,300.
      // Total annual tax = 33,800.
      // Monthly TDS = 33,800 / 12 = 2,817 (rounded).
      const structure = {
        employeeId: "emp-tds-new",
        basic: 450000,
        hra: 180000,
        allowances: 270000,
        professionalTax: 0,
        employeePf: 0,
        esi: 0,
        tds: 0,
      };
      mockPrismaService.salaryStructure.findFirst.mockResolvedValue(structure);

      const mockDeclaration = {
        id: "dec-1",
        employeeId: "emp-tds-new",
        financialYear: "2026-2027",
        regime: "NEW",
        section80C: 0,
        section80D: 0,
        section24: 0,
        otherExemptions: 0,
        status: "APPROVED",
      };
      mockPrismaService.employeeTaxExemptionDeclaration.findUnique.mockResolvedValue(mockDeclaration);

      await service.calculate("run-2");

      const upsertCall = mockPrismaService.payslip.upsert.mock.calls[0][0];
      // Gross payout = 75,000
      // Deductions: PF (capped basic 15,000 -> 1,800), ESI (gross > 21,000 -> 0), PT (gross > 15,000 -> 200), TDS (2,817).
      // Total deductions = 1800 + 0 + 200 + 2817 = 4,817
      expect(upsertCall.create.grossPay).toBe(75000);
      expect(upsertCall.create.deductions).toBe(4817);
    });

    it("should calculate TDS under the OLD regime with deductions (80C, 80D, 24)", async () => {
      const mockRun = { id: "run-3", companyId: "company-1", month: 6, year: 2026, status: ApprovalStatus.DRAFT };
      mockPrismaService.payrollRun.findUnique.mockResolvedValue(mockRun);

      const mockEmployees = [
        { id: "emp-tds-old", companyId: "company-1", status: "ACTIVE" }
      ];
      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);

      // CTC 12,00,000 -> Basic 50,000, HRA 20,000, Allowances 30,000. Monthly Gross = 1,00,000.
      // Annual Gross = 12,00,000.
      // Standard deduction = 50,000.
      // Declared exemptions: 80C = 1,50,000, 80D = 25,000, Sec 24 = 2,00,000. Total exemptions = 3,75,000.
      // Taxable income = 12,00,000 - 50,000 (standard deduction) - 3,75,000 = 7,75,000.
      // OLD Regime Slabs:
      // - Up to 2,50,000: 0
      // - 2,50,001 to 5,00,000: 2,50,000 * 0.05 = 12,500
      // - 5,00,001 to 7,75,000: 2,75,000 * 0.20 = 55,000
      // Total Tax Liability = 67,500.
      // Cess = 67,500 * 0.04 = 2,700.
      // Total annual tax = 70,200.
      // Monthly TDS = 70,200 / 12 = 5,850.
      const structure = {
        employeeId: "emp-tds-old",
        basic: 600000,
        hra: 240000,
        allowances: 360000,
        professionalTax: 0,
        employeePf: 0,
        esi: 0,
        tds: 0,
      };
      mockPrismaService.salaryStructure.findFirst.mockResolvedValue(structure);

      const mockDeclaration = {
        id: "dec-2",
        employeeId: "emp-tds-old",
        financialYear: "2026-2027",
        regime: "OLD",
        section80C: 150000,
        section80D: 25000,
        section24: 200000,
        otherExemptions: 0,
        status: "APPROVED",
      };
      mockPrismaService.employeeTaxExemptionDeclaration.findUnique.mockResolvedValue(mockDeclaration);

      await service.calculate("run-3");

      const upsertCall = mockPrismaService.payslip.upsert.mock.calls[0][0];
      // Gross payout = 100,000
      // Deductions: PF (capped basic 15,000 -> 1,800), ESI (gross > 21,000 -> 0), PT (gross > 15,000 -> 200), TDS (5,850).
      // Total deductions = 1800 + 0 + 200 + 5850 = 7,850
      expect(upsertCall.create.grossPay).toBe(100000);
      expect(upsertCall.create.deductions).toBe(7850);
    });
  });
});

