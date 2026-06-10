import { Test, TestingModule } from "@nestjs/testing";
import { RecruitmentController } from "./recruitment.controller";
import { RecruitmentService } from "./recruitment.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { response } from "../../common/crud-response";

describe("RecruitmentController", () => {
  let controller: RecruitmentController;
  let service: RecruitmentService;

  const mockRecruitmentService = {
    createRequisition: jest.fn().mockImplementation((companyId, dto) => Promise.resolve(response("recruitment", "requisition.create", { id: "req-1", ...dto }))),
    listRequisitions: jest.fn().mockImplementation((companyId) => Promise.resolve(response("recruitment", "requisitions.list", []))),
    decideRequisition: jest.fn().mockImplementation((id, dto) => Promise.resolve(response("recruitment", "requisition.decide", { id, status: dto.status }))),
    createJobPosting: jest.fn().mockImplementation((companyId, dto) => Promise.resolve(response("recruitment", "jobposting.create", { id: "post-1", ...dto }))),
    listJobPostings: jest.fn().mockImplementation((companyId) => Promise.resolve(response("recruitment", "jobpostings.list", []))),
    createCandidate: jest.fn().mockImplementation((dto) => Promise.resolve(response("recruitment", "candidate.create", { id: "cand-1", ...dto }))),
    listCandidates: jest.fn().mockImplementation(() => Promise.resolve(response("recruitment", "candidates.list", []))),
    createApplication: jest.fn().mockImplementation((jobPostingId, candidateId) => Promise.resolve(response("recruitment", "application.create", { id: "app-1", jobPostingId, candidateId }))),
    updateApplicationStage: jest.fn().mockImplementation((id, dto) => Promise.resolve(response("recruitment", "application.stageUpdate", { id, stage: dto.stage }))),
    listApplicationsByPosting: jest.fn().mockImplementation((postingId) => Promise.resolve(response("recruitment", "applications.list", []))),
    scheduleInterview: jest.fn().mockImplementation((dto) => Promise.resolve(response("recruitment", "interview.schedule", { id: "int-1", ...dto }))),
    submitFeedback: jest.fn().mockImplementation((id, dto) => Promise.resolve(response("recruitment", "interview.feedback", { id, ...dto }))),
    createJobOffer: jest.fn().mockImplementation((dto) => Promise.resolve(response("recruitment", "joboffer.create", { id: "offer-1", ...dto }))),
    listJobOffers: jest.fn().mockImplementation(() => Promise.resolve(response("recruitment", "joboffers.list", []))),
    getJobOffer: jest.fn().mockImplementation((id) => Promise.resolve(response("recruitment", "joboffer.detail", { id }))),
    listInterviews: jest.fn().mockImplementation(() => Promise.resolve(response("recruitment", "interviews.list", []))),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecruitmentController],
      providers: [
        { provide: RecruitmentService, useValue: mockRecruitmentService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RecruitmentController>(RecruitmentController);
    service = module.get<RecruitmentService>(RecruitmentService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("requisitions", () => {
    it("should call createRequisition on service", async () => {
      const user = { sub: "u-1", email: "admin@skylinx.com", tenantId: "company-1", roles: [], permissions: [] };
      const dto = { departmentId: "dept-1", title: "QA", openings: 1, requestedById: "emp-1" };
      
      const res = await controller.createRequisition(user, dto);
      expect(res.data).toBeDefined();
      expect(service.createRequisition).toHaveBeenCalledWith("company-1", dto);
    });

    it("should call listRequisitions on service", async () => {
      const user = { sub: "u-1", email: "admin@skylinx.com", tenantId: "company-1", roles: [], permissions: [] };
      const res = await controller.listRequisitions(user);
      expect(res.data).toEqual([]);
      expect(service.listRequisitions).toHaveBeenCalledWith("company-1");
    });
  });

  describe("postings", () => {
    it("should call createJobPosting on service", async () => {
      const user = { sub: "u-1", email: "admin@skylinx.com", tenantId: "company-1", roles: [], permissions: [] };
      const dto = { title: "Dev", openings: 1 };
      const res = await controller.createJobPosting(user, dto);
      expect(res.data).toBeDefined();
      expect(service.createJobPosting).toHaveBeenCalledWith("company-1", dto);
    });
  });

  describe("interviews and offers lists", () => {
    it("should call listInterviews", async () => {
      const res = await controller.listInterviews();
      expect(res.data).toEqual([]);
      expect(service.listInterviews).toHaveBeenCalled();
    });

    it("should call listJobOffers", async () => {
      const res = await controller.listJobOffers();
      expect(res.data).toEqual([]);
      expect(service.listJobOffers).toHaveBeenCalled();
    });
  });
});
