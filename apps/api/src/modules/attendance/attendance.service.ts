import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus, AttendanceStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { CheckInDto, CheckOutDto, DecideAttendanceDto, OvertimeDto, RegularizationDto } from "./dto/attendance.dto";
import { AssignShiftDto, BulkAssignShiftDto, RequestShiftDto, DecideShiftRequestDto } from "./dto/roster.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async logs() {
    const logs = await this.prisma.attendanceLog.findMany({
      include: {
        employee: true,
        shift: true,
        regularizations: true,
        overtimeRequests: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return response("attendance", "logs", logs);
  }

  async checkIn(data: CheckInDto) {
    const checkInAt = data.checkInAt ? new Date(data.checkInAt) : new Date();
    const date = this.startOfDay(checkInAt);

    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { company: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    const companyId = employee.companyId;

    const shift = data.shiftId
      ? await this.prisma.shift.findUnique({ where: { id: data.shiftId } })
      : await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
    if (!shift) throw new BadRequestException("Active shift is not configured");

    const rulesRes = await this.settingsService.rules();
    const attendanceRule = (rulesRes.data as any).attendance;

    const shiftLocations = await this.prisma.shiftLocation.findMany({
      where: { shiftId: shift.id },
      include: { location: true },
    });

    if (attendanceRule?.geoAttendance && shiftLocations.length > 0) {
      if (data.latitude === undefined || data.longitude === undefined || data.latitude === null || data.longitude === null) {
        throw new BadRequestException("GPS coordinates are required for check-in");
      }

      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in meters
      };

      let inRange = false;
      for (const sl of shiftLocations) {
        if (sl.location.latitude !== null && sl.location.longitude !== null) {
          const distance = getDistance(
            Number(data.latitude),
            Number(data.longitude),
            Number(sl.location.latitude),
            Number(sl.location.longitude),
          );
          if (distance <= 200) {
            inRange = true;
            break;
          }
        }
      }

      if (!inRange) {
        throw new BadRequestException("You are outside the authorized geofenced location");
      }
    }

    const status = this.calculateStatus(checkInAt, shift.startTime || attendanceRule?.shiftStart || "09:30", shift.graceMinutes ?? attendanceRule?.graceMinutes ?? 10);
    const log = await this.prisma.attendanceLog.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        shiftId: shift.id,
        checkInAt,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        checkInAccuracy: data.accuracy,
        status,
        source: "WEB",
      },
      create: {
        employeeId: data.employeeId,
        shiftId: shift.id,
        date,
        checkInAt,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        checkInAccuracy: data.accuracy,
        status,
        source: "WEB",
      },
      include: { employee: true, shift: true },
    });

    await this.audit("attendance", "check-in", "attendance_log", log.id, log);
    return response("attendance", "checkIn", log);
  }

  async checkOut(data: CheckOutDto) {
    const checkOutAt = data.checkOutAt ? new Date(data.checkOutAt) : new Date();
    const date = this.startOfDay(checkOutAt);
    const existing = await this.prisma.attendanceLog.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
    });
    if (!existing) throw new NotFoundException("Check-in record not found for today");

    const log = await this.prisma.attendanceLog.update({
      where: { id: existing.id },
      data: {
        checkOutAt,
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
        checkOutAccuracy: data.accuracy,
      },
      include: { employee: true, shift: true },
    });

    await this.audit("attendance", "check-out", "attendance_log", log.id, log);
    return response("attendance", "checkOut", log);
  }

  async shifts() {
    const shifts = await this.prisma.shift.findMany({
      orderBy: { name: "asc" },
    });
    return response("attendance", "shifts", shifts);
  }

  async regularizations() {
    const regularizations = await this.prisma.attendanceRegularization.findMany({
      include: {
        employee: true,
        attendanceLog: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("attendance", "regularizations", regularizations);
  }

  async regularize(data: RegularizationDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const regularization = await tx.attendanceRegularization.create({
        data: {
          employeeId: data.employeeId,
          attendanceLogId: data.attendanceLogId,
          requestedCheckInAt: data.requestedCheckInAt ? new Date(data.requestedCheckInAt) : undefined,
          requestedCheckOutAt: data.requestedCheckOutAt ? new Date(data.requestedCheckOutAt) : undefined,
          reason: data.reason,
          status: ApprovalStatus.PENDING,
        },
        include: {
          employee: true,
          attendanceLog: true,
        },
      });

      return regularization;
    });

    await this.audit("attendance", "regularization.create", "attendance_regularization", result.id, result);
    return response("attendance", "regularization.create", result);
  }

  async approveRegularization(id: string, data: DecideAttendanceDto) {
    const regularization = await this.prisma.attendanceRegularization.findUnique({
      where: { id },
    });
    if (!regularization) throw new NotFoundException("Regularization request not found");
    if (regularization.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending regularizations can be approved");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let attendanceLogId = regularization.attendanceLogId;
      if (!attendanceLogId) {
        if (!regularization.requestedCheckInAt) {
          throw new BadRequestException("Requested check-in is required when attendance log is missing");
        }
        const created = await tx.attendanceLog.upsert({
          where: {
            employeeId_date: {
              employeeId: regularization.employeeId,
              date: this.startOfDay(regularization.requestedCheckInAt),
            },
          },
          update: {},
          create: {
            employeeId: regularization.employeeId,
            date: this.startOfDay(regularization.requestedCheckInAt),
            status: AttendanceStatus.PRESENT,
            source: "REGULARIZATION",
          },
        });
        attendanceLogId = created.id;
      }

      const updatedLog = await tx.attendanceLog.update({
        where: { id: attendanceLogId },
        data: {
          checkInAt: regularization.requestedCheckInAt || undefined,
          checkOutAt: regularization.requestedCheckOutAt || undefined,
          status: AttendanceStatus.PRESENT,
          approvedBy: data.decidedByUserId,
        },
      });

      const approved = await tx.attendanceRegularization.update({
        where: { id },
        data: {
          attendanceLogId,
          status: ApprovalStatus.APPROVED,
          decidedBy: data.decidedByUserId,
          decidedAt: new Date(),
        },
        include: { employee: true, attendanceLog: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.decidedByUserId,
          module: "attendance",
          action: "regularization.approve",
          entityType: "attendance_regularization",
          entityId: id,
          oldValueJson: regularization,
          newValueJson: { approved, updatedLog },
        },
      });

      return approved;
    });

    return response("attendance", "regularization.approve", result);
  }

  async rejectRegularization(id: string, data: DecideAttendanceDto) {
    const regularization = await this.prisma.attendanceRegularization.findUnique({
      where: { id },
    });
    if (!regularization) throw new NotFoundException("Regularization request not found");
    if (regularization.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending regularizations can be rejected");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const rejected = await tx.attendanceRegularization.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          decidedBy: data.decidedByUserId,
          decidedAt: new Date(),
        },
        include: { employee: true, attendanceLog: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.decidedByUserId,
          module: "attendance",
          action: "regularization.reject",
          entityType: "attendance_regularization",
          entityId: id,
          oldValueJson: regularization,
          newValueJson: rejected,
        },
      });

      return rejected;
    });

    return response("attendance", "regularization.reject", result);
  }

  async overtime(data: OvertimeDto) {
    const attendanceLog = await this.prisma.attendanceLog.findUnique({
      where: { id: data.attendanceLogId },
    });
    if (!attendanceLog) throw new NotFoundException("Attendance log not found");

    const overtime = await this.prisma.overtimeRequest.create({
      data: {
        employeeId: data.employeeId,
        attendanceLogId: data.attendanceLogId,
        hours: data.hours,
        reason: data.reason,
        status: ApprovalStatus.APPROVED,
      },
      include: { employee: true, attendanceLog: true },
    });

    await this.audit("attendance", "overtime.create", "overtime_request", overtime.id, overtime);
    return response("attendance", "overtime.create", overtime);
  }

  async assignShift(data: AssignShiftDto) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const assignment = await this.prisma.shiftAssignment.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date,
        },
      },
      update: {
        shiftId: data.shiftId,
      },
      create: {
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        date,
      },
      include: {
        employee: true,
        shift: true,
      },
    });

    await this.audit("attendance", "shift.assign", "shift_assignment", assignment.id, assignment);
    return response("attendance", "shift.assign", assignment);
  }

  async bulkAssignShift(data: BulkAssignShiftDto) {
    const results = [];
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    for (const employeeId of data.employeeIds) {
      const current = new Date(start);
      while (current <= end) {
        const date = new Date(current);
        date.setHours(0, 0, 0, 0);

        const assignment = await this.prisma.shiftAssignment.upsert({
          where: {
            employeeId_date: {
              employeeId,
              date,
            },
          },
          update: {
            shiftId: data.shiftId,
          },
          create: {
            employeeId,
            shiftId: data.shiftId,
            date,
          },
        });
        results.push(assignment);
        current.setDate(current.getDate() + 1);
      }
    }

    await this.audit("attendance", "shift.bulk_assign", "shift_assignment", "bulk", { count: results.length });
    return response("attendance", "shift.bulk_assign", { count: results.length });
  }

  async requestShift(data: RequestShiftDto) {
    const requestedDate = new Date(data.requestedDate);
    requestedDate.setHours(0, 0, 0, 0);

    const request = await this.prisma.shiftRequest.create({
      data: {
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        requestedDate,
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
      include: {
        employee: true,
        shift: true,
      },
    });

    await this.audit("attendance", "shift.request", "shift_request", request.id, request);
    return response("attendance", "shift.request", request);
  }

  async listShiftRequests() {
    const items = await this.prisma.shiftRequest.findMany({
      include: {
        employee: true,
        shift: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("attendance", "shift_requests.list", items);
  }

  async decideShiftRequest(id: string, data: DecideShiftRequestDto) {
    const request = await this.prisma.shiftRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException("Shift request not found");

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.shiftRequest.update({
        where: { id },
        data: { status: data.status },
        include: { employee: true, shift: true },
      });

      if (data.status === ApprovalStatus.APPROVED) {
        await tx.shiftAssignment.upsert({
          where: {
            employeeId_date: {
              employeeId: request.employeeId,
              date: request.requestedDate,
            },
          },
          update: { shiftId: request.shiftId },
          create: {
            employeeId: request.employeeId,
            shiftId: request.shiftId,
            date: request.requestedDate,
          },
        });
      }

      return updatedRequest;
    });

    await this.audit("attendance", "shift.request_decide", "shift_request", id, result);
    return response("attendance", "shift.request_decide", result);
  }

  async listShiftAssignments() {
    const items = await this.prisma.shiftAssignment.findMany({
      include: {
        employee: true,
        shift: true,
      },
      orderBy: { date: "desc" },
    });
    return response("attendance", "shift_assignments.list", items);
  }

  async processAutoAttendance(dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const employeesList = await this.prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        shiftAssignments: {
          where: { date: targetDate },
          include: { shift: true },
        },
        attendanceLogs: {
          where: { date: targetDate },
        },
      },
    });

    const rulesRes = await this.settingsService.rules();
    const attendanceRule = (rulesRes.data as any).attendance;
    const workWeek = attendanceRule?.workWeek || "Monday to Friday";

    const processed = [];

    for (const emp of employeesList) {
      const activeShift = emp.shiftAssignments?.[0]?.shift;
      const log = emp.attendanceLogs?.[0];

      // If no shift assigned, default to general shift if any
      const shift = activeShift || await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
      if (!shift) continue;

      if (!log) {
        // No clock logs: check if it's a weekend or holiday
        const day = targetDate.getDay();
        let isWeekend = day === 0; // Sunday weekend off by default
        if (workWeek === "Monday to Friday" && day === 6) {
          isWeekend = true;
        }

        const holiday = await this.prisma.holiday.findFirst({
          where: {
            date: targetDate,
            OR: [
              { locationId: emp.locationId },
              { locationId: null },
            ],
          },
        });

        let status: AttendanceStatus = AttendanceStatus.ABSENT;
        if (holiday) {
          status = AttendanceStatus.HOLIDAY;
        } else if (isWeekend) {
          status = AttendanceStatus.WEEK_OFF;
        }

        const newLog = await this.prisma.attendanceLog.create({
          data: {
            employeeId: emp.id,
            shiftId: shift.id,
            date: targetDate,
            status,
            source: "AUTO_PROCESS",
          },
        });
        processed.push(newLog);
      } else if (log.checkInAt && log.status === AttendanceStatus.PRESENT) {
        // Check if actually late
        const status = this.calculateStatus(log.checkInAt, shift.startTime || attendanceRule?.shiftStart || "09:30", shift.graceMinutes ?? attendanceRule?.graceMinutes ?? 10);
        if (status !== log.status) {
          const updatedLog = await this.prisma.attendanceLog.update({
            where: { id: log.id },
            data: { status },
          });
          processed.push(updatedLog);
        }
      }
    }

    return response("attendance", "auto_process", { count: processed.length });
  }

  private startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private calculateStatus(checkInAt: Date, shiftStartTime: string, graceMinutes: number) {
    const [hours, minutes] = shiftStartTime.split(":").map(Number);
    const threshold = new Date(checkInAt);
    threshold.setHours(hours, minutes + graceMinutes, 0, 0);
    return checkInAt > threshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
  }

  private async audit(module: string, action: string, entityType: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module,
        action,
        entityType,
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }

  async bulkUpload(records: any[]) {
    const results = [];
    const shift = await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
    if (!shift) throw new BadRequestException("No active shift configured");

    for (const record of records) {
      const { employeeId, date, checkInAt, checkOutAt, status } = record;
      const parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);

      const parsedCheckIn = checkInAt ? new Date(checkInAt) : null;
      const parsedCheckOut = checkOutAt ? new Date(checkOutAt) : null;

      const log = await this.prisma.attendanceLog.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: parsedDate,
          },
        },
        update: {
          shiftId: shift.id,
          checkInAt: parsedCheckIn,
          checkOutAt: parsedCheckOut,
          status: status || AttendanceStatus.PRESENT,
          source: "BULK_UPLOAD",
        },
        create: {
          employeeId,
          shiftId: shift.id,
          date: parsedDate,
          checkInAt: parsedCheckIn,
          checkOutAt: parsedCheckOut,
          status: status || AttendanceStatus.PRESENT,
          source: "BULK_UPLOAD",
        },
      });
      results.push(log);
    }

    await this.audit("attendance", "bulk-upload", "attendance_log", "bulk", { count: results.length });
    return response("attendance", "bulkUpload", { count: results.length, items: results });
  }
}
