import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus, AttendanceStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckInDto, CheckOutDto, DecideAttendanceDto, OvertimeDto, RegularizationDto } from "./dto/attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

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
    const shift = data.shiftId
      ? await this.prisma.shift.findUnique({ where: { id: data.shiftId } })
      : await this.prisma.shift.findFirst({ where: { status: "ACTIVE" } });
    if (!shift) throw new BadRequestException("Active shift is not configured");

    const status = this.calculateStatus(checkInAt, shift.startTime, shift.graceMinutes);
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
          status: ApprovalStatus.APPROVED,
          decidedBy: data.employeeId,
          decidedAt: new Date(),
        },
        include: {
          employee: true,
          attendanceLog: true,
        },
      });

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

      await tx.attendanceLog.update({
        where: { id: attendanceLogId },
        data: {
          checkInAt: regularization.requestedCheckInAt || undefined,
          checkOutAt: regularization.requestedCheckOutAt || undefined,
          status: AttendanceStatus.PRESENT,
          approvedBy: data.employeeId,
        },
      });

      const finalReg = await tx.attendanceRegularization.update({
        where: { id: regularization.id },
        data: { attendanceLogId },
        include: { employee: true, attendanceLog: true },
      });

      return finalReg;
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
}
