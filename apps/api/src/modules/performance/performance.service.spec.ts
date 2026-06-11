import { Test, TestingModule } from "@nestjs/testing";
import { PerformanceService } from "./performance.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("PerformanceService", () => {
  let service: PerformanceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    attendanceLog: {
      findMany: jest.fn(),
    },
    leaveRequest: {
      findMany: jest.fn(),
    },
    recognitionReward: {
      findMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    feedbackRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    appraisalCycle: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appraisalTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appraisal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appraisalGoal: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create feedback request", async () => {
    const dto = {
      appraisalId: "app-1",
      requestorId: "emp-1",
      providerId: "emp-2",
      questions: { question1: "Rate team player qualities" },
    };

    mockPrismaService.feedbackRequest.create.mockResolvedValue({ id: "f-1", ...dto, status: "PENDING" });

    const res = await service.createFeedbackRequest(dto);
    expect(res.data).toBeDefined();
    expect(res.data!.id).toBe("f-1");
  });

  it("should respond to feedback request", async () => {
    const dto = {
      answers: { question1: "5/5" },
    };

    mockPrismaService.feedbackRequest.findUnique.mockResolvedValue({ id: "f-1", status: "PENDING" });
    mockPrismaService.feedbackRequest.update.mockResolvedValue({ id: "f-1", status: "SUBMITTED", answers: dto.answers });

    const res = await service.submitFeedbackResponse("f-1", dto);
    expect(res.data).toBeDefined();
    expect(res.data!.status).toBe("SUBMITTED");
  });

  describe("Appraisal Templates & Math", () => {
    it("should reject template creation if KRA weightages do not sum to 100", async () => {
      const dto = {
        name: "Invalid Template",
        kras: [
          { title: "KRA 1", weightagePercent: 40 },
          { title: "KRA 2", weightagePercent: 40 },
        ],
      };

      await expect(service.createTemplate(dto)).rejects.toThrow("KRA weightages must sum to 100");
    });

    it("should accept template creation if KRA weightages sum to 100", async () => {
      const dto = {
        name: "Valid Template",
        kras: [
          { title: "KRA 1", weightagePercent: 40 },
          { title: "KRA 2", weightagePercent: 60 },
        ],
      };

      mockPrismaService.company.findFirst.mockResolvedValue({ id: "company-1" });
      mockPrismaService.appraisalTemplate.create.mockResolvedValue({ id: "temp-1", name: dto.name, kras: dto.kras });

      const res = await service.createTemplate(dto);
      expect(res.data).toBeDefined();
      expect(res.data!.name).toBe(dto.name);
    });

    it("should reject self-rating if employee attempts to rate another employee's appraisal", async () => {
      const dto = {
        ratings: [{ kraId: "kra-1", rating: 4, description: "Good" }],
      };

      mockPrismaService.appraisal.findUnique.mockResolvedValue({
        id: "app-1",
        employeeId: "emp-1",
        status: "PENDING",
      });

      await expect(service.selfRate("app-1", "emp-2", dto)).rejects.toThrow(
        "You can only rate your own appraisal",
      );
    });

    it("should calculate correct weighted score on self-rating", async () => {
      const dto = {
        ratings: [
          { kraId: "kra-1", rating: 4, description: "Good" },
          { kraId: "kra-2", rating: 5, description: "Excellent" },
        ],
      };

      mockPrismaService.appraisal.findUnique.mockResolvedValue({
        id: "app-1",
        employeeId: "emp-1",
        status: "PENDING",
        template: {
          kras: [
            { id: "kra-1", title: "KRA 1", weightagePercent: 40 },
            { id: "kra-2", title: "KRA 2", weightagePercent: 60 },
          ],
        },
      });

      mockPrismaService.appraisal.update.mockImplementation(({ data }) => ({
        id: "app-1",
        status: "SELF_DONE",
        selfScore: data.selfScore,
      }));

      const res = await service.selfRate("app-1", "emp-1", dto);
      expect(res.data).toBeDefined();
      // selfScore = (4 * 40 + 5 * 60) / 100 = (160 + 300) / 100 = 4.6
      expect(res.data!.selfScore).toBe(4.6);
    });
  });
});
