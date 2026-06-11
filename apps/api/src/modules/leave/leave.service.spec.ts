import { Test, TestingModule } from "@nestjs/testing";
import { LeaveService } from "./leave.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ApprovalStatus } from "@prisma/client";

describe("LeaveService", () => {
  let service: LeaveService;
  let prisma: PrismaService;

  const mockPrismaService = {
    leaveType: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    clientRule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    leaveBalance: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    leaveLedgerEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    leaveRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    leaveBlockList: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    leaveBlockListDate: {
      create: jest.fn(),
    },
    leavePolicy: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leavePolicyAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leaveEncashment: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    leaveAccrualSchedule: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    salaryStructure: {
      findFirst: jest.fn(),
    },
    additionalSalary: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Leave Encashment", () => {
    it("should apply for leave encashment", async () => {
      const dto = { employeeId: "emp-1", leaveTypeId: "CL", days: 5 };
      mockPrismaService.salaryStructure.findFirst.mockResolvedValue({ basic: 30000 });
      mockPrismaService.leaveBalance.findUnique.mockResolvedValue({ available: 10 });
      mockPrismaService.leaveEncashment.create.mockResolvedValue({ id: "encash-1", ...dto, totalAmount: 5000 });

      const res = await service.createEncashment(dto);
      expect(res.data!.id).toBe("encash-1");
    });

    it("should approve leave encashment and deduct balance", async () => {
      let status: ApprovalStatus = ApprovalStatus.PENDING;
      mockPrismaService.leaveEncashment.findUnique.mockImplementation(() => Promise.resolve({
        id: "encash-1",
        employeeId: "emp-1",
        leaveTypeId: "CL",
        days: 5,
        totalAmount: 5000,
        status,
        leaveType: { name: "Casual Leave" },
      }));
      mockPrismaService.leaveBalance.findUnique.mockResolvedValue({ id: "bal-1", available: 10 });
      mockPrismaService.leaveBalance.update.mockResolvedValue({ id: "bal-1", available: 5 });
      mockPrismaService.leaveEncashment.update.mockImplementation(() => {
        status = ApprovalStatus.APPROVED;
        return Promise.resolve({ id: "encash-1", status });
      });

      const res = await service.decideEncashment("encash-1", { status: ApprovalStatus.APPROVED });
      expect(res.data!.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe("Earned Leave Accrual Engine", () => {
    it("should process accruals and credit balances", async () => {
      mockPrismaService.leaveAccrualSchedule.findMany.mockResolvedValue([
        {
          id: "sched-1",
          leavePolicyId: "policy-1",
          leaveTypeId: "CL",
          daysPerPeriod: 1.5,
          leaveType: { name: "Casual Leave" },
        },
      ]);
      mockPrismaService.leavePolicyAssignment.findMany.mockResolvedValue([
        { employeeId: "emp-1", employee: { id: "emp-1", firstName: "Kabir", lastName: "Sethi", status: "ACTIVE" } },
      ]);
      mockPrismaService.leaveLedgerEntry.findFirst.mockResolvedValue(null);

      const res = await service.processAccruals({ period: "2026-06" });
      expect(res.data).toBeDefined();
      expect(res.data![0].status).toBe("PROCESSED");
    });
  });
});
