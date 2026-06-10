import { Test, TestingModule } from "@nestjs/testing";
import { RecruitmentService } from "./recruitment.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("RecruitmentService", () => {
  let service: RecruitmentService;
  let prisma: PrismaService;

  const mockPrismaService = {
    jobRequisition: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    jobPosting: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    candidate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    jobApplication: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    interviewRound: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    interview: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    interviewer: {
      createMany: jest.fn(),
    },
    interviewFeedback: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    jobOffer: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecruitmentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RecruitmentService>(RecruitmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Requisitions", () => {
    it("should successfully create a job requisition", async () => {
      const dto = {
        departmentId: "dept-123",
        title: "Software Engineer",
        openings: 2,
        reason: "Expansion",
        requestedById: "emp-111",
      };

      const mockRequisition = { id: "req-999", ...dto, status: "PENDING" };
      mockPrismaService.jobRequisition.create.mockResolvedValue(mockRequisition);

      const result = await service.createRequisition("company-123", dto);

      expect(result.data).toBeDefined();
      expect(result.data).toEqual(mockRequisition);
      expect(mockPrismaService.jobRequisition.create).toHaveBeenCalledWith({
        data: {
          companyId: "company-123",
          departmentId: dto.departmentId,
          title: dto.title,
          openings: dto.openings,
          requestedById: dto.requestedById,
          status: "PENDING",
        },
        include: { department: true, requestedBy: true },
      });
    });

    it("should approve or reject a requisition", async () => {
      const mockRequisition = { id: "req-999", status: "PENDING" };
      mockPrismaService.jobRequisition.findUnique.mockResolvedValue(mockRequisition);
      mockPrismaService.jobRequisition.update.mockResolvedValue({
        id: "req-999",
        status: "APPROVED",
        approvedById: "mgr-222",
      });

      const result = await service.decideRequisition("req-999", {
        status: "APPROVED",
        approvedById: "mgr-222",
        reason: "Approved budget",
      });

      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("APPROVED");
    });
  });

  describe("Job Postings", () => {
    it("should create job posting linked to approved requisition", async () => {
      const dto = {
        title: "Developer",
        openings: 1,
        requisitionId: "req-123",
      };

      mockPrismaService.jobRequisition.findUnique.mockResolvedValue({
        id: "req-123",
        status: "APPROVED",
      });

      mockPrismaService.jobPosting.create.mockResolvedValue({ id: "post-123", ...dto });

      const result = await service.createJobPosting("company-123", dto);

      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe("post-123");
    });

    it("should fail to create job posting if requisition is not approved", async () => {
      const dto = {
        title: "Developer",
        openings: 1,
        requisitionId: "req-123",
      };

      mockPrismaService.jobRequisition.findUnique.mockResolvedValue({
        id: "req-123",
        status: "PENDING",
      });

      await expect(service.createJobPosting("company-123", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("Candidates & Applications", () => {
    it("should create candidate and register application", async () => {
      const dto = {
        fullName: "Jane Doe",
        email: "jane@doe.com",
        phone: "12345678",
      };

      mockPrismaService.candidate.findFirst.mockResolvedValue(null);
      mockPrismaService.candidate.create.mockResolvedValue({ id: "cand-123", ...dto });
      mockPrismaService.jobApplication.findFirst.mockResolvedValue(null);
      mockPrismaService.jobApplication.create.mockResolvedValue({
        id: "app-123",
        jobPostingId: "post-123",
        candidateId: "cand-123",
        stage: "SCREENING",
      });

      const candRes = await service.createCandidate(dto);
      expect(candRes.data).toBeDefined();
      const appRes = await service.createApplication("post-123", candRes.data!.id);

      expect(appRes.data).toBeDefined();
      expect(appRes.data!.stage).toBe("SCREENING");
    });
  });

  describe("Interviews & Feedback", () => {
    it("should schedule interview and create interviewer maps", async () => {
      const dto = {
        applicationId: "app-123",
        scheduledAt: new Date().toISOString(),
        mode: "ONLINE",
        interviewerIds: ["emp-1"],
        roundName: "Technical 1",
      };

      mockPrismaService.jobApplication.findUnique.mockResolvedValue({ id: "app-123" });
      mockPrismaService.interviewRound.findFirst.mockResolvedValue({ id: "round-1" });
      mockPrismaService.interview.create.mockResolvedValue({ id: "int-1", roundId: "round-1" });
      mockPrismaService.interviewer.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.interview.findUnique.mockResolvedValue({
        id: "int-1",
        interviewers: [{ employee: { id: "emp-1" } }],
      });

      const result = await service.scheduleInterview(dto);

      expect(result.data).toBeDefined();
      expect(mockPrismaService.interviewer.createMany).toHaveBeenCalled();
    });

    it("should aggregate feedback ratings on last interviewer scorecard submission", async () => {
      const mockInterview = {
        id: "int-1",
        roundId: "round-1",
        interviewers: [{ employeeId: "emp-1" }, { employeeId: "emp-2" }],
      };

      mockPrismaService.interview.findUnique.mockResolvedValue(mockInterview);
      mockPrismaService.interviewFeedback.upsert.mockResolvedValue({});
      mockPrismaService.interviewFeedback.findMany.mockResolvedValue([
        { interviewerEmployeeId: "emp-1", rating: 4, recommendation: "HIRE", comments: "Good" },
        { interviewerEmployeeId: "emp-2", rating: 5, recommendation: "HIRE", comments: "Great" },
      ]);
      mockPrismaService.interview.update.mockResolvedValue({});
      mockPrismaService.interviewRound.update.mockResolvedValue({});

      const result = await service.submitFeedback("int-1", {
        interviewerEmployeeId: "emp-2",
        rating: 5,
        recommendation: "HIRE",
        comments: "Great",
      });

      expect(result.data).toBeDefined();
      expect(mockPrismaService.interview.update).toHaveBeenCalledWith({
        where: { id: "int-1" },
        data: {
          status: "COMPLETED",
          feedback: "Consensus: HIRE (Unanimous). Avg Rating: 4.5/5. Comments: Good | Great",
        },
      });
    });
  });
});
