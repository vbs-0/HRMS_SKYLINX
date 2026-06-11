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
});
