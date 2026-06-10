import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateRequisitionDto,
  DecideRequisitionDto,
  CreateJobPostingDto,
  CreateCandidateDto,
  CreateInterviewDto,
  SubmitFeedbackDto,
  CreateJobOfferDto,
  UpdateApplicationStageDto,
} from "./dto/recruitment.dto";

@Injectable()
export class RecruitmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. Requisitions
  // ==========================================
  async createRequisition(companyId: string, data: CreateRequisitionDto) {
    const requisition = await this.prisma.jobRequisition.create({
      data: {
        companyId,
        departmentId: data.departmentId,
        title: data.title,
        openings: data.openings,
        requestedById: data.requestedById,
        status: "PENDING",
      },
      include: {
        department: true,
        requestedBy: true,
      },
    });
    return response("recruitment", "requisition.create", requisition);
  }

  async listRequisitions(companyId: string) {
    const items = await this.prisma.jobRequisition.findMany({
      where: { companyId },
      include: {
        department: true,
        requestedBy: true,
        approvedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("recruitment", "requisitions.list", items);
  }

  async decideRequisition(id: string, data: DecideRequisitionDto) {
    const requisition = await this.prisma.jobRequisition.findUnique({
      where: { id },
    });
    if (!requisition) {
      throw new NotFoundException("Requisition not found");
    }

    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: data.status,
        approvedById: data.approvedById,
        approvedAt: new Date(),
        reason: data.reason,
      },
      include: {
        department: true,
        requestedBy: true,
        approvedBy: true,
      },
    });
    return response("recruitment", "requisition.decide", updated);
  }

  // ==========================================
  // 2. Job Postings
  // ==========================================
  async createJobPosting(companyId: string, data: CreateJobPostingDto) {
    // If requisition is provided, verify it is approved
    if (data.requisitionId) {
      const req = await this.prisma.jobRequisition.findUnique({
        where: { id: data.requisitionId },
      });
      if (!req) {
        throw new NotFoundException("Job Requisition not found");
      }
      if (req.status !== "APPROVED") {
        throw new BadRequestException("Requisition must be APPROVED to open a job posting");
      }
    }

    const posting = await this.prisma.jobPosting.create({
      data: {
        companyId,
        title: data.title,
        departmentId: data.departmentId,
        locationId: data.locationId,
        openings: data.openings,
        status: "OPEN",
        requisitionId: data.requisitionId,
      },
      include: {
        requisition: true,
      },
    });
    return response("recruitment", "jobposting.create", posting);
  }

  async listJobPostings(companyId: string) {
    const items = await this.prisma.jobPosting.findMany({
      where: { companyId },
      include: {
        applications: {
          include: {
            candidate: true,
          },
        },
        requisition: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("recruitment", "jobpostings.list", items);
  }

  // ==========================================
  // 3. Candidates & Applications
  // ==========================================
  async createCandidate(data: CreateCandidateDto) {
    let candidate = await this.prisma.candidate.findFirst({
      where: { email: data.email.toLowerCase() },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          resumeUrl: data.resumeUrl,
          source: data.source,
          currentStage: "SCREENING",
        },
      });
    }
    return response("recruitment", "candidate.create", candidate);
  }

  async listCandidates() {
    const items = await this.prisma.candidate.findMany({
      include: {
        applications: {
          include: {
            jobPosting: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return response("recruitment", "candidates.list", items);
  }

  async createApplication(jobPostingId: string, candidateId: string) {
    const exists = await this.prisma.jobApplication.findFirst({
      where: { jobPostingId, candidateId },
    });

    if (exists) {
      throw new BadRequestException("Candidate has already applied for this job posting");
    }

    const app = await this.prisma.jobApplication.create({
      data: {
        jobPostingId,
        candidateId,
        stage: "SCREENING",
        status: "ACTIVE",
      },
      include: {
        jobPosting: true,
        candidate: true,
      },
    });
    return response("recruitment", "application.create", app);
  }

  async updateApplicationStage(id: string, data: UpdateApplicationStageDto) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
    });
    if (!app) {
      throw new NotFoundException("Job Application not found");
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        stage: data.stage,
      },
      include: {
        jobPosting: true,
        candidate: true,
      },
    });

    // Sync currentStage to Candidate model
    await this.prisma.candidate.update({
      where: { id: app.candidateId },
      data: { currentStage: data.stage },
    });

    return response("recruitment", "application.stageUpdate", updated);
  }

  async listApplicationsByPosting(jobPostingId: string) {
    const items = await this.prisma.jobApplication.findMany({
      where: { jobPostingId },
      include: {
        candidate: true,
        interviews: {
          include: {
            interviewers: { include: { employee: true } },
            feedbacks: true,
          },
        },
        jobOffers: true,
      },
    });
    return response("recruitment", "applications.list", items);
  }

  // ==========================================
  // 4. Interviews & Feedback
  // ==========================================
  async scheduleInterview(data: CreateInterviewDto) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: data.applicationId },
    });
    if (!app) {
      throw new NotFoundException("Job Application not found");
    }

    // Retrieve or create InterviewRound
    const roundName = data.roundName || "General Interview";
    let round = await this.prisma.interviewRound.findFirst({
      where: { applicationId: data.applicationId, name: roundName },
    });

    if (!round) {
      const existingRounds = await this.prisma.interviewRound.count({
        where: { applicationId: data.applicationId },
      });
      round = await this.prisma.interviewRound.create({
        data: {
          applicationId: data.applicationId,
          name: roundName,
          roundNumber: existingRounds + 1,
          status: "PENDING",
        },
      });
    }

    // Create Interview
    const interview = await this.prisma.interview.create({
      data: {
        applicationId: data.applicationId,
        scheduledAt: new Date(data.scheduledAt),
        mode: data.mode,
        status: "SCHEDULED",
        roundId: round.id,
      },
    });

    // Assign Interviewers
    if (data.interviewerIds && data.interviewerIds.length > 0) {
      await this.prisma.interviewer.createMany({
        data: data.interviewerIds.map((employeeId) => ({
          interviewId: interview.id,
          employeeId,
        })),
      });
    }

    const detailedInterview = await this.prisma.interview.findUnique({
      where: { id: interview.id },
      include: {
        interviewers: {
          include: { employee: true },
        },
        round: true,
      },
    });

    return response("recruitment", "interview.schedule", detailedInterview);
  }

  async submitFeedback(interviewId: string, data: SubmitFeedbackDto) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: { interviewers: true },
    });
    if (!interview) {
      throw new NotFoundException("Interview not found");
    }

    // Verify interviewer is assigned
    const assigned = interview.interviewers.some((it) => it.employeeId === data.interviewerEmployeeId);
    if (!assigned) {
      throw new BadRequestException("Interviewer is not assigned to this interview");
    }

    // Create or update Feedback scorecard
    const feedback = await this.prisma.interviewFeedback.upsert({
      where: {
        interviewId_interviewerEmployeeId: {
          interviewId,
          interviewerEmployeeId: data.interviewerEmployeeId,
        },
      },
      update: {
        rating: data.rating,
        comments: data.comments,
        recommendation: data.recommendation,
      },
      create: {
        interviewId,
        interviewerEmployeeId: data.interviewerEmployeeId,
        rating: data.rating,
        comments: data.comments,
        recommendation: data.recommendation,
      },
    });

    // Auto-completion aggregation logic
    const allFeedbacks = await this.prisma.interviewFeedback.findMany({
      where: { interviewId },
    });

    if (allFeedbacks.length === interview.interviewers.length) {
      // Calculate average rating
      const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const avgRating = Math.round((totalRating / allFeedbacks.length) * 10) / 10;
      
      // Determine overall consensus
      const rejects = allFeedbacks.filter((f) => f.recommendation === "REJECT");
      const hires = allFeedbacks.filter((f) => f.recommendation === "HIRE");
      
      let finalFeedback = "Consensus: ";
      if (rejects.length > 0) {
        finalFeedback += `REJECT (${rejects.length} reject votes)`;
      } else if (hires.length === allFeedbacks.length) {
        finalFeedback += "HIRE (Unanimous)";
      } else {
        finalFeedback += "HOLD (Mixed reviews)";
      }

      await this.prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: "COMPLETED",
          feedback: `${finalFeedback}. Avg Rating: ${avgRating}/5. Comments: ${allFeedbacks.map((f) => f.comments).filter(Boolean).join(" | ")}`,
        },
      });

      // Mark the round completed
      if (interview.roundId) {
        await this.prisma.interviewRound.update({
          where: { id: interview.roundId },
          data: { status: "COMPLETED" },
        });
      }
    }

    return response("recruitment", "interview.feedback", feedback);
  }

  async listInterviews() {
    const items = await this.prisma.interview.findMany({
      include: {
        application: {
          include: {
            candidate: true,
            jobPosting: true,
          },
        },
        interviewers: {
          include: {
            employee: true,
          },
        },
        feedbacks: {
          include: {
            interviewer: true,
          },
        },
        round: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
    return response("recruitment", "interviews.list", items);
  }

  // ==========================================
  // 5. Job Offers
  // ==========================================
  async createJobOffer(data: CreateJobOfferDto) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: data.applicationId },
    });
    if (!app) {
      throw new NotFoundException("Job Application not found");
    }

    const offer = await this.prisma.jobOffer.create({
      data: {
        applicationId: data.applicationId,
        offeredCtc: data.offeredCtc,
        joiningDate: new Date(data.joiningDate),
        status: "DRAFT",
        terms: {
          create: data.terms.map((t) => ({
            title: t.title,
            description: t.description,
          })),
        },
      },
      include: {
        terms: true,
      },
    });

    return response("recruitment", "joboffer.create", offer);
  }

  async listJobOffers() {
    const items = await this.prisma.jobOffer.findMany({
      include: {
        terms: true,
        application: {
          include: {
            candidate: true,
            jobPosting: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return response("recruitment", "joboffers.list", items);
  }

  async getJobOffer(id: string) {
    const offer = await this.prisma.jobOffer.findUnique({
      where: { id },
      include: {
        terms: true,
        application: {
          include: {
            candidate: true,
            jobPosting: true,
          },
        },
      },
    });
    if (!offer) {
      throw new NotFoundException("Job Offer not found");
    }
    return response("recruitment", "joboffer.detail", offer);
  }
}
