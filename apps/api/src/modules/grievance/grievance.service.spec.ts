import { Test, TestingModule } from "@nestjs/testing";
import { GrievanceService } from "./grievance.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";

describe("GrievanceService", () => {
  let service: GrievanceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    grievance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievanceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GrievanceService>(GrievanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a grievance", async () => {
    const dto = {
      employeeId: "emp-1",
      title: "Workplace issues",
      description: "Too cold in the office",
      category: "WORK_ENVIRONMENT",
      anonymous: false,
    };

    mockPrismaService.grievance.create.mockResolvedValue({ id: "g-1", ...dto, status: "PENDING" });

    const res = await service.create(dto);
    expect(res.data).toBeDefined();
    expect(res.data!.id).toBe("g-1");
  });

  it("should get details of a grievance", async () => {
    mockPrismaService.grievance.findUnique.mockResolvedValue({ id: "g-1", title: "Test" });
    const res = await service.findOne("g-1");
    expect(res.data).toBeDefined();
    expect(res.data!.title).toBe("Test");
  });

  it("should fail if grievance not found", async () => {
    mockPrismaService.grievance.findUnique.mockResolvedValue(null);
    await expect(service.findOne("g-nonexistent")).rejects.toThrow(NotFoundException);
  });
});
