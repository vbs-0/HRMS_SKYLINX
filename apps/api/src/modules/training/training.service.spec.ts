import { Test, TestingModule } from "@nestjs/testing";
import { TrainingService } from "./training.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("TrainingService", () => {
  let service: TrainingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    trainingProgram: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    trainingEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    trainingFeedback: {
      create: jest.fn(),
    },
    trainingResult: {
      create: jest.fn(),
    },
    skill: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    employeeSkillMap: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    designationSkill: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Skill Gap Engine", () => {
    it("should calculate skill gaps correctly when employee lacks some designation skills", async () => {
      const mockEmployee = { id: "emp-1", name: "John Doe", designationId: "des-1" };
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const mockDesignationSkills = [
        {
          id: "ds-1",
          designationId: "des-1",
          skillId: "skill-react",
          requiredProficiency: "EXPERT",
          skill: { id: "skill-react", name: "ReactJS" },
        },
        {
          id: "ds-2",
          designationId: "des-1",
          skillId: "skill-node",
          requiredProficiency: "INTERMEDIATE",
          skill: { id: "skill-node", name: "NodeJS" },
        },
      ];
      mockPrismaService.designationSkill.findMany.mockResolvedValue(mockDesignationSkills);

      // Employee has ReactJS at INTERMEDIATE (which is a GAP since EXPERT is required)
      // Employee does not have NodeJS mapped (which is a GAP)
      const mockEmployeeSkills = [
        {
          id: "esm-1",
          employeeId: "emp-1",
          skillId: "skill-react",
          proficiency: "INTERMEDIATE",
          skill: { id: "skill-react", name: "ReactJS" },
        },
      ];
      mockPrismaService.employeeSkillMap.findMany.mockResolvedValue(mockEmployeeSkills);

      const result = await service.getSkillGaps("emp-1");
      expect(result.data).toBeDefined();
      expect(result.data!.gaps).toHaveLength(2);
      expect(result.data!.gaps).toContainEqual({
        skillName: "ReactJS",
        required: "EXPERT",
        actual: "INTERMEDIATE",
      });
      expect(result.data!.gaps).toContainEqual({
        skillName: "NodeJS",
        required: "INTERMEDIATE",
        actual: "NONE",
      });
      expect(result.data!.met).toHaveLength(0);
    });

    it("should identify skills as met when employee matches or exceeds required proficiency", async () => {
      const mockEmployee = { id: "emp-2", name: "Jane Doe", designationId: "des-1" };
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const mockDesignationSkills = [
        {
          id: "ds-1",
          designationId: "des-1",
          skillId: "skill-react",
          requiredProficiency: "INTERMEDIATE",
          skill: { id: "skill-react", name: "ReactJS" },
        },
      ];
      mockPrismaService.designationSkill.findMany.mockResolvedValue(mockDesignationSkills);

      // Employee has ReactJS at EXPERT (exceeds requirement)
      const mockEmployeeSkills = [
        {
          id: "esm-1",
          employeeId: "emp-2",
          skillId: "skill-react",
          proficiency: "EXPERT",
          skill: { id: "skill-react", name: "ReactJS" },
        },
      ];
      mockPrismaService.employeeSkillMap.findMany.mockResolvedValue(mockEmployeeSkills);

      const result = await service.getSkillGaps("emp-2");
      expect(result.data!.gaps).toHaveLength(0);
      expect(result.data!.met).toHaveLength(1);
      expect(result.data!.met[0]).toEqual({
        skillName: "ReactJS",
        required: "INTERMEDIATE",
        actual: "EXPERT",
      });
    });
  });
});
