import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceService } from "./attendance.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ApprovalStatus } from "@prisma/client";

describe("AttendanceService (Roster)", () => {
  let service: AttendanceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    shiftAssignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    shiftRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    holiday: {
      findFirst: jest.fn(),
    },
    attendanceLog: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    attendanceRule: {
      findUnique: jest.fn(),
    },
    shiftLocation: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("assignShift", () => {
    it("should upsert a shift assignment", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1", date: "2026-06-10" };
      mockPrismaService.shiftAssignment.upsert.mockResolvedValue({ id: "assign-1", ...dto });

      const result = await service.assignShift(dto);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.shiftAssignment.upsert).toHaveBeenCalled();
    });
  });

  describe("bulkAssignShift", () => {
    it("should assign shift to multiple employees across date range", async () => {
      const dto = {
        employeeIds: ["emp-1", "emp-2"],
        shiftId: "shift-1",
        startDate: "2026-06-10",
        endDate: "2026-06-12",
      };
      mockPrismaService.shiftAssignment.upsert.mockResolvedValue({ id: "assign-1" });

      const result = await service.bulkAssignShift(dto);
      expect(result.data).toEqual({ count: 6 }); // 2 employees * 3 days = 6 assignments
    });
  });

  describe("requestShift", () => {
    it("should create a shift request", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1", requestedDate: "2026-06-10", reason: "Personal" };
      mockPrismaService.shiftRequest.create.mockResolvedValue({ id: "req-1", ...dto, status: "PENDING" });

      const result = await service.requestShift(dto);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.shiftRequest.create).toHaveBeenCalled();
    });
  });

  describe("decideShiftRequest", () => {
    it("should decide shift request and create assignment if approved", async () => {
      const id = "req-1";
      const dto = { status: ApprovalStatus.APPROVED };
      mockPrismaService.shiftRequest.findUnique.mockResolvedValue({ id, employeeId: "emp-1", shiftId: "shift-1", requestedDate: new Date() });
      mockPrismaService.shiftRequest.update.mockResolvedValue({ id, status: ApprovalStatus.APPROVED });
      mockPrismaService.shiftAssignment.upsert.mockResolvedValue({ id: "assign-1" });

      const result = await service.decideShiftRequest(id, dto);
      expect(result.data).toBeDefined();
      expect(mockPrismaService.shiftRequest.update).toHaveBeenCalled();
      expect(mockPrismaService.shiftAssignment.upsert).toHaveBeenCalled();
    });
  });

  describe("checkIn", () => {
    it("should succeed checkIn when geoRequired is false", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1", latitude: 12.9716, longitude: 77.5946 };
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1", companyId: "company-1" });
      mockPrismaService.shift.findUnique.mockResolvedValue({ id: "shift-1", startTime: "09:00", graceMinutes: 15 });
      mockPrismaService.attendanceRule.findUnique.mockResolvedValue({ geoRequired: false });
      mockPrismaService.shiftLocation.findMany.mockResolvedValue([]);
      mockPrismaService.attendanceLog.upsert.mockResolvedValue({ id: "log-1", employeeId: "emp-1", date: new Date() });

      const result = await service.checkIn(dto);
      expect(result.data).toBeDefined();
    });

    it("should fail checkIn when geoRequired is true and coordinates are missing", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1" };
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1", companyId: "company-1" });
      mockPrismaService.shift.findUnique.mockResolvedValue({ id: "shift-1", startTime: "09:00", graceMinutes: 15 });
      mockPrismaService.attendanceRule.findUnique.mockResolvedValue({ geoRequired: true });
      mockPrismaService.shiftLocation.findMany.mockResolvedValue([
        { location: { latitude: 12.9716, longitude: 77.5946 } }
      ]);

      await expect(service.checkIn(dto)).rejects.toThrow("GPS coordinates are required for check-in");
    });

    it("should fail checkIn when geoRequired is true and coordinates are outside the authorized geofence radius", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1", latitude: 13.0827, longitude: 80.2707 }; // Chennai
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1", companyId: "company-1" });
      mockPrismaService.shift.findUnique.mockResolvedValue({ id: "shift-1", startTime: "09:00", graceMinutes: 15 });
      mockPrismaService.attendanceRule.findUnique.mockResolvedValue({ geoRequired: true });
      mockPrismaService.shiftLocation.findMany.mockResolvedValue([
        { location: { latitude: 12.9716, longitude: 77.5946 } } // Bengaluru
      ]);

      await expect(service.checkIn(dto)).rejects.toThrow("You are outside the authorized geofenced location");
    });

    it("should succeed checkIn when geoRequired is true and coordinates are inside the authorized geofence radius", async () => {
      const dto = { employeeId: "emp-1", shiftId: "shift-1", latitude: 12.9717, longitude: 77.5947 };
      mockPrismaService.employee.findUnique.mockResolvedValue({ id: "emp-1", companyId: "company-1" });
      mockPrismaService.shift.findUnique.mockResolvedValue({ id: "shift-1", startTime: "09:00", graceMinutes: 15 });
      mockPrismaService.attendanceRule.findUnique.mockResolvedValue({ geoRequired: true });
      mockPrismaService.shiftLocation.findMany.mockResolvedValue([
        { location: { latitude: 12.9716, longitude: 77.5946 } }
      ]);
      mockPrismaService.attendanceLog.upsert.mockResolvedValue({ id: "log-1", employeeId: "emp-1", date: new Date() });

      const result = await service.checkIn(dto);
      expect(result.data).toBeDefined();
    });
  });
});
