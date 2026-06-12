import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { ApprovalStatus, AttendanceStatus, AnomalyType, AnomalyStatus } from "@prisma/client";
import { TenantContext } from "../../common/tenant-context";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { CheckInDto, CheckOutDto, DecideAttendanceDto, OvertimeDto, RegularizationDto, BulkRevertPenaltyLogsDto, PenaltyLogFilterDto, DecideAnomalyDto } from "./dto/attendance.dto";
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

  async getAttendanceDefaults() {
    const rulesRes = await this.settingsService.rules();
    const rule = (rulesRes.data as any).attendance || {};
    return {
      workWeek: rule.workWeek || "Monday to Saturday",
      shiftStart: rule.shiftStart || "09:30",
      shiftEnd: rule.shiftEnd || "18:30",
      graceMinutes: rule.graceMinutes ?? 10,
      halfDayMinutes: rule.halfDayMinutes || 240,
      geoAttendance: rule.geoAttendance ?? true,
      geofenceRadiusMeters: rule.geofenceRadiusMeters ?? 200,
      penaltyMapping: rule.penaltyMapping || {
        ABSENT: "FULL_DAY",
        LATE: "HALF_DAY",
        EARLY_EXIT: "HALF_DAY",
        MISSED_PUNCH: "HALF_DAY",
        OUT_TIME: "HALF_DAY",
        SHORT_HOURS: "HALF_DAY",
      }
    };
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

    const attendanceRule = await this.getAttendanceDefaults();

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
          const radius = attendanceRule.geofenceRadiusMeters;
          if (distance <= radius) {
            inRange = true;
            break;
          }
        }
      }

      if (!inRange) {
        throw new BadRequestException("You are outside the authorized geofenced location");
      }
    }

    const status = this.calculateStatus(checkInAt, shift.startTime || attendanceRule.shiftStart, shift.graceMinutes ?? attendanceRule.graceMinutes);
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

      // Anomaly type inferred from the attendance log status
      // (AttendanceStatus enum: PRESENT, LATE, ABSENT, HALF_DAY, HOLIDAY, WEEK_OFF)
      let anomalyType = "LATE";
      if (rejected.attendanceLog?.status === "ABSENT") anomalyType = "ABSENT";
      else if (rejected.attendanceLog?.status === "HALF_DAY") anomalyType = "OUT_TIME";
      else if (!rejected.attendanceLog) anomalyType = "MISSED_PUNCH";

      // If it's a full day absence, penalty is FULL_DAY, else HALF_DAY
      const penaltyType = anomalyType === "ABSENT" ? "FULL_DAY" : "HALF_DAY";
      const deductionDays = penaltyType === "FULL_DAY" ? 1 : 0.5;
      
      const logDate = rejected.attendanceLog?.date || new Date();

      await tx.penaltyLog.create({
        data: {
          employeeId: rejected.employeeId,
          companyId: rejected.employee.companyId,
          anomalyType,
          penaltyType,
          leaveType: "Loss of Pay",
          deductionDays,
          month: logDate.getMonth() + 1,
          year: logDate.getFullYear(),
          status: "CONVERTED_LOP",
        }
      });

      return rejected;
    });

    return response("attendance", "regularization.reject", result);
  }

  async getPenaltyLogs(filters: PenaltyLogFilterDto) {
    const where: any = {};
    if (filters.month) where.month = parseInt(filters.month, 10);
    if (filters.year) where.year = parseInt(filters.year, 10);
    if (filters.anomalyType) where.anomalyType = filters.anomalyType;

    const logs = await this.prisma.penaltyLog.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { appliedOn: "desc" }
    });
    return response("attendance", "penalty_logs", logs);
  }

  async bulkRevertPenaltyLogs(userId: string, data: BulkRevertPenaltyLogsDto) {
    const result = await this.prisma.penaltyLog.updateMany({
      where: {
        id: { in: data.ids },
        status: { not: "REVERTED" }
      },
      data: {
        status: "REVERTED",
        revertedBy: userId,
      }
    });

    await this.audit("attendance", "penalty_log.bulk_revert", "penalty_log", "bulk", { count: result.count, ids: data.ids });
    return response("attendance", "penalty_log.bulk_revert", { count: result.count });
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

    const attendanceRule = await this.getAttendanceDefaults();
    const workWeek = attendanceRule.workWeek;

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
        const status = this.calculateStatus(log.checkInAt, shift.startTime || attendanceRule.shiftStart, shift.graceMinutes ?? attendanceRule.graceMinutes);
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

  async bulkUpload(fileBuffer: Buffer) {
    let records: any[];
    try {
      const csvContent = fileBuffer.toString("utf-8");
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new BadRequestException("Failed to parse CSV file");
    }

    if (!records || records.length === 0) {
      throw new BadRequestException("CSV file is empty or invalid format");
    }

    const results = [];
    const shift = await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
    if (!shift) throw new BadRequestException("No active shift configured");

    for (const record of records) {
      const employeeId = record.employeeId || record.EmployeeId || record["Employee ID"];
      const dateStr = record.date || record.Date;
      const checkInAtStr = record.checkInAt || record.CheckInAt || record["Check In"];
      const checkOutAtStr = record.checkOutAt || record.CheckOutAt || record["Check Out"];
      const statusStr = record.status || record.Status || "PRESENT";

      if (!employeeId || !dateStr) continue;

      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) continue;
      parsedDate.setHours(0, 0, 0, 0);

      const parsedCheckIn = checkInAtStr ? new Date(checkInAtStr) : null;
      if (checkInAtStr && parsedCheckIn && isNaN(parsedCheckIn.getTime())) continue;

      const parsedCheckOut = checkOutAtStr ? new Date(checkOutAtStr) : null;
      if (checkOutAtStr && parsedCheckOut && isNaN(parsedCheckOut.getTime())) continue;

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
          status: statusStr as AttendanceStatus,
          source: "BULK_UPLOAD",
        },
        create: {
          employeeId,
          shiftId: shift.id,
          date: parsedDate,
          checkInAt: parsedCheckIn,
          checkOutAt: parsedCheckOut,
          status: statusStr as AttendanceStatus,
          source: "BULK_UPLOAD",
        },
      });
      results.push(log);
    }

    await this.audit("attendance", "bulk-upload", "attendance_log", "bulk", { count: results.length });
    return response("attendance", "bulkUpload", { count: results.length, items: results });
  }

  // ==========================================
  // Attendance Anomaly Engine
  // ==========================================

  async evaluateAnomalies(dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const logs = await this.prisma.attendanceLog.findMany({
      where: { date: targetDate },
      include: { shift: true },
    });

    const results = [];
    const attendanceRule = await this.getAttendanceDefaults();
    const graceMinutes = attendanceRule.graceMinutes;
    const halfDayMinutes = attendanceRule.halfDayMinutes;

    for (const log of logs) {
      if (!log.checkInAt || !log.checkOutAt) continue;

      const shift = log.shift || await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
      if (!shift) continue;

      const [shiftStartH, shiftStartM] = (shift.startTime || "09:30").split(":").map(Number);
      const [shiftEndH, shiftEndM] = (shift.endTime || "18:30").split(":").map(Number);
      const shiftDurationMinutes = (shiftEndH * 60 + shiftEndM) - (shiftStartH * 60 + shiftStartM);

      // Late check-in
      const checkInMinutes = log.checkInAt.getHours() * 60 + log.checkInAt.getMinutes();
      const expectedStartMinutes = shiftStartH * 60 + shiftStartM;
      if (checkInMinutes > expectedStartMinutes + graceMinutes) {
        const diff = checkInMinutes - expectedStartMinutes;
        await this.createAnomalyIfNotExists(log.id, log.employeeId, AnomalyType.LATE, shift.id, shift.startTime, `${Math.floor(checkInMinutes / 60)}:${String(checkInMinutes % 60).padStart(2, "0")}`, diff);
        results.push({ logId: log.id, type: "LATE", diffMinutes: diff });
      }

      // Early exit
      const checkOutMinutes = log.checkOutAt.getHours() * 60 + log.checkOutAt.getMinutes();
      const expectedEndMinutes = shiftEndH * 60 + shiftEndM;
      if (checkOutMinutes < expectedEndMinutes - graceMinutes) {
        const diff = expectedEndMinutes - checkOutMinutes;
        await this.createAnomalyIfNotExists(log.id, log.employeeId, AnomalyType.EARLY_EXIT, shift.id, shift.endTime, `${Math.floor(checkOutMinutes / 60)}:${String(checkOutMinutes % 60).padStart(2, "0")}`, diff);
        results.push({ logId: log.id, type: "EARLY_EXIT", diffMinutes: diff });
      }

      // Short hours: total worked < half-day threshold
      const workedMinutes = (log.checkOutAt.getTime() - log.checkInAt.getTime()) / 60000;
      if (workedMinutes < halfDayMinutes) {
        await this.createAnomalyIfNotExists(log.id, log.employeeId, AnomalyType.SHORT_HOURS, shift.id, `${shiftDurationMinutes}min`, `${Math.round(workedMinutes)}min`, Math.round(shiftDurationMinutes - workedMinutes));
        results.push({ logId: log.id, type: "SHORT_HOURS", workedMinutes: Math.round(workedMinutes) });
      }
    }

    return response("attendance", "anomalies.evaluate", { evaluated: logs.length, anomaliesCreated: results.length, details: results });
  }

  private async createAnomalyIfNotExists(
    attendanceLogId: string, employeeId: string, type: AnomalyType,
    shiftId: string | null, expectedTime: string | null, actualTime: string | null, diffMinutes: number,
  ) {
    const existing = await this.prisma.attendanceAnomaly.findFirst({
      where: { attendanceLogId, type, status: AnomalyStatus.OPEN },
    });
    if (existing) return existing;

    return this.prisma.attendanceAnomaly.create({
      data: { attendanceLogId, employeeId, type, shiftId, expectedTime, actualTime, diffMinutes },
    });
  }

  async listAnomalies() {
    const anomalies = await this.prisma.attendanceAnomaly.findMany({
      include: { attendanceLog: { include: { employee: true, shift: true } } },
      orderBy: { createdAt: "desc" },
    });
    return response("attendance", "anomalies.list", anomalies);
  }

  async decideAnomaly(id: string, data: DecideAnomalyDto) {
    const anomaly = await this.prisma.attendanceAnomaly.findUnique({ where: { id } });
    if (!anomaly) throw new NotFoundException("Anomaly not found");
    if (anomaly.status !== AnomalyStatus.OPEN) {
      throw new BadRequestException("Only open anomalies can be decided");
    }

    const newStatus = data.status === "OVERRIDDEN" ? AnomalyStatus.OVERRIDDEN : AnomalyStatus.APPROVED;
    const updated = await this.prisma.attendanceAnomaly.update({
      where: { id },
      data: { status: newStatus, decidedBy: data.decidedByUserId, decidedAt: new Date() },
    });

    await this.audit("attendance", "anomaly.decide", "attendance_anomaly", id, updated);
    return response("attendance", "anomaly.decide", updated);
  }

  // ==========================================
  // Auto Clock-Out
  // ==========================================

  async autoClockOut(dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const openLogs = await this.prisma.attendanceLog.findMany({
      where: {
        date: targetDate,
        checkInAt: { not: null },
        checkOutAt: null,
        autoClockOut: false,
      },
      include: { shift: true },
    });

    const attendanceRule = await this.getAttendanceDefaults();

    const processed = [];
    for (const log of openLogs) {
      const shift = log.shift || await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
      if (!shift) continue;

      const [endH, endM] = (shift.endTime || attendanceRule.shiftEnd).split(":").map(Number);
      const autoCheckOut = new Date(log.date);
      autoCheckOut.setHours(endH, endM, 0, 0);

      await this.prisma.$transaction(async (tx) => {
        await tx.attendanceLog.update({
          where: { id: log.id },
          data: {
            checkOutAt: autoCheckOut,
            autoClockOut: true,
            status: AttendanceStatus.AUTO_CLOCK_OUT,
          },
        });

        // Create missed-punch anomaly
        await tx.attendanceAnomaly.create({
          data: {
            attendanceLogId: log.id,
            employeeId: log.employeeId,
            type: AnomalyType.MISSED_PUNCH,
            shiftId: shift.id,
            expectedTime: shift.endTime,
            actualTime: "auto-closed",
            diffMinutes: 0,
          },
        });
      });

      processed.push(log.id);
    }

    await this.audit("attendance", "auto-clock-out", "attendance_log", "batch", { date: dateStr, count: processed.length });
    return response("attendance", "autoClockOut", { date: dateStr, processed: processed.length });
  }

  // ==========================================
  // LOP Conversion (Month-End)
  // ==========================================

  async convertAnomaliesToLOP(month: number, year: number) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context is required");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const openAnomalies = await this.prisma.attendanceAnomaly.findMany({
      where: {
        status: AnomalyStatus.OPEN,
        attendanceLog: {
          date: { gte: startDate, lte: endDate },
        },
      },
      include: { attendanceLog: true },
    });

    const attendanceRule = await this.getAttendanceDefaults();
    const results: any[] = [];
    let totalLopDays = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const a of openAnomalies) {
        const penaltyType = (attendanceRule.penaltyMapping as any)[a.type] || "HALF_DAY";
        const deduction = penaltyType === "FULL_DAY" ? 1 : 0.5;

        await tx.attendanceAnomaly.update({
          where: { id: a.id },
          data: { status: AnomalyStatus.CONVERTED_TO_LOP },
        });

        await tx.penaltyLog.create({
          data: {
            companyId: tenantId,
            employeeId: a.employeeId,
            anomalyType: a.type,
            penaltyType,
            leaveType: "Loss of Pay",
            deductionDays: deduction,
            month,
            year,
            status: "CONVERTED_LOP"
          },
        });

        totalLopDays += deduction;
        results.push({ anomalyId: a.id, employeeId: a.employeeId, deduction });
      }
    });

    await this.audit("attendance", "lop.convert", "attendance_anomaly", "batch", { month, year, anomaliesCount: openAnomalies.length, totalLopDays });
    return response("attendance", "lop.convert", { anomaliesConverted: openAnomalies.length, totalLopDays, details: results });
  }
}
