import { Test, TestingModule } from "@nestjs/testing";
import { TravelService } from "./travel.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ApprovalStatus } from "@prisma/client";

describe("TravelService", () => {
  let service: TravelService;
  let prisma: PrismaService;

  const mockPrismaService = {
    travelRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    employeeAdvance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    travelItinerary: {
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
        TravelService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TravelService>(TravelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Travel Request & Advances Flow", () => {
    it("should create travel request and link employee advance if advanceAmount > 0", async () => {
      const mockEmployee = { id: "emp-1", firstName: "Alice", lastName: "Smith" };
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const mockRequest = {
        id: "req-1",
        employeeId: "emp-1",
        purpose: "Sales Pitch",
        estimatedCost: 20000,
        advanceAmount: 5000,
      };
      mockPrismaService.travelRequest.create.mockResolvedValue(mockRequest);

      const data = {
        employeeId: "emp-1",
        purpose: "Sales Pitch",
        startDate: "2026-06-15",
        endDate: "2026-06-20",
        sourceCity: "Mumbai",
        destinationCity: "Bangalore",
        estimatedCost: 20000,
        advanceAmount: 5000,
      };

      const result = await service.createRequest(data);
      expect(result.data).toEqual(mockRequest);
      expect(mockPrismaService.travelRequest.create).toHaveBeenCalled();
      expect(mockPrismaService.employeeAdvance.create).toHaveBeenCalledWith({
        data: {
          employeeId: "emp-1",
          requestId: "req-1",
          amount: 5000,
          status: "PENDING",
        },
      });
    });

    it("should disburse a pending employee advance", async () => {
      const mockAdvance = {
        id: "adv-1",
        employeeId: "emp-1",
        amount: 5000,
        status: "PENDING",
      };
      mockPrismaService.employeeAdvance.findUnique.mockResolvedValue(mockAdvance);

      const mockUpdatedAdvance = {
        id: "adv-1",
        employeeId: "emp-1",
        amount: 5000,
        status: "PAID",
        paymentDate: new Date(),
      };
      mockPrismaService.employeeAdvance.update.mockResolvedValue(mockUpdatedAdvance);

      const result = await service.disburseAdvance("adv-1");
      expect(result.data!.status).toBe("PAID");
      expect(mockPrismaService.employeeAdvance.update).toHaveBeenCalledWith({
        where: { id: "adv-1" },
        data: {
          status: "PAID",
          paymentDate: expect.any(Date),
        },
        include: { employee: true },
      });
    });
  });
});
