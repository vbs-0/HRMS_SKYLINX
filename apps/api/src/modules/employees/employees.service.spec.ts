import { Test, TestingModule } from "@nestjs/testing";
import { EmployeesService } from "./employees.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("EmployeesService (Lifecycle)", () => {
  let service: EmployeesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    employee: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    employeeGrade: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    employmentType: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    employeeOnboardingTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    employeeSeparationTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    exitInterview: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    fullAndFinalStatement: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    fullAndFinalAsset: {
      update: jest.fn(),
    },
    leaveType: {
      findMany: jest.fn(),
    },
    leaveBalance: {
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("PAN & PF Encryption/Decryption", () => {
    it("should encrypt sensitive fields on create and decrypt them on detail", async () => {
      const createDto = {
        employeeCode: "EMP-X",
        firstName: "Alice",
        lastName: "Sec",
        email: "alice@sec.local",
        joiningDate: "2026-06-01",
        companyId: "company-1",
        panNumber: "ABCDE1234F",
        providentFundAccount: "PF-12345",
      };

      // Mock database save (returns encrypted values)
      mockPrismaService.employee.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: "emp-x",
          ...data,
        });
      });

      mockPrismaService.leaveType.findMany.mockResolvedValue([]);

      const createdRes = await service.create(createDto);
      expect(createdRes.data!.panNumber).not.toBe("ABCDE1234F");
      expect(createdRes.data!.panNumber).toContain(":"); // Encrypted format iv:hex

      // Mock database load (returns encrypted values)
      mockPrismaService.employee.findUnique.mockResolvedValue({
        id: "emp-x",
        ...createdRes.data,
      });

      const detailRes = await service.detail("emp-x");
      expect(detailRes.data!.panNumber).toBe("ABCDE1234F");
      expect(detailRes.data!.providentFundAccount).toBe("PF-12345");
    });
  });

  describe("createGrade & listGrades", () => {
    it("should create and list employee grades", async () => {
      const dto = { companyId: "company-1", name: "Grade L1", maxExpenseLimit: 5000 };
      mockPrismaService.employeeGrade.create.mockResolvedValue({ id: "grade-1", ...dto });
      mockPrismaService.employeeGrade.findMany.mockResolvedValue([{ id: "grade-1", ...dto }]);

      const createRes = await service.createGrade(dto);
      expect(createRes.data!.name).toBe("Grade L1");

      const listRes = await service.listGrades("company-1");
      expect(listRes.data).toHaveLength(1);
    });
  });

  describe("createEmploymentType & listEmploymentTypes", () => {
    it("should create and list employment types", async () => {
      const dto = { companyId: "company-1", name: "Full-Time Contractor" };
      mockPrismaService.employmentType.create.mockResolvedValue({ id: "type-1", ...dto });
      mockPrismaService.employmentType.findMany.mockResolvedValue([{ id: "type-1", ...dto }]);

      const createRes = await service.createEmploymentType(dto);
      expect(createRes.data!.name).toBe("Full-Time Contractor");

      const listRes = await service.listEmploymentTypes("company-1");
      expect(listRes.data).toHaveLength(1);
    });
  });

  describe("createOnboardingTemplate", () => {
    it("should create an onboarding template with activities", async () => {
      const dto = {
        name: "Engineering Onboarding",
        activities: [{ title: "IT Setup", description: "Get laptop", assignedRole: "HR" }],
        companyId: "company-1",
      };
      mockPrismaService.employeeOnboardingTemplate.create.mockResolvedValue({ id: "temp-1", ...dto });

      const result = await service.createOnboardingTemplate(dto as any);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.employeeOnboardingTemplate.create).toHaveBeenCalled();
    });
  });

  describe("submitExitInterview", () => {
    it("should submit/upsert exit interview details", async () => {
      const dto = { exitDate: "2026-06-30", reasonForLeaving: "Better offer", feedback: "Good workplace" };
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1" });
      mockPrismaService.exitInterview.upsert.mockResolvedValue({ id: "exit-1", ...dto });

      const result = await service.submitExitInterview("emp-1", dto);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.exitInterview.upsert).toHaveBeenCalled();
    });
  });

  describe("calculateFullAndFinal", () => {
    it("should calculate gratuity and net pay for exit settlement", async () => {
      const dto = {
        exitDate: "2026-06-30",
        resignationDate: "2026-03-31",
        lastDrawnSalary: 80000,
        gratuityDues: 0,
        encashmentDues: 10000,
        recoveryDues: 5000,
        assets: [{ assetName: "MacBook Pro", serialNumber: "MB-123", recoveryCost: 0 }],
      };
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1", joiningDate: new Date("2024-01-01") });
      mockPrismaService.fullAndFinalStatement.upsert.mockResolvedValue({ id: "stmt-1", netPayable: 85000 });

      const result = await service.calculateFullAndFinal("emp-1", dto);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.fullAndFinalStatement.upsert).toHaveBeenCalled();
    });
  });
});
