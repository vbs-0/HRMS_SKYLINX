import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CheckInDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  selfieUrl?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class CheckOutDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsDateString()
  checkOutAt?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  selfieUrl?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export type RegularizationType = "mark_present" | "mark_leave" | "exact_time" | "mark_lop";

export class RegularizationDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  attendanceLogId?: string;

  @IsOptional()
  @IsDateString()
  requestedCheckInAt?: string;

  @IsOptional()
  @IsDateString()
  requestedCheckOutAt?: string;

  @IsString()
  reason!: string;

  // Kredily-parity: 4 regularization modes
  @IsOptional()
  @IsEnum(["mark_present", "mark_leave", "exact_time", "mark_lop"])
  type?: RegularizationType;

  // Used when type = "mark_leave" or "mark_lop"
  @IsOptional()
  @IsString()
  leaveTypeId?: string;
}

export class DecideAttendanceDto {
  @IsOptional()
  @IsString()
  action?: "approve" | "reject";

  @IsOptional()
  @IsString()
  decidedByUserId?: string;
}

export class OvertimeDto {
  @IsString()
  employeeId!: string;

  @IsString()
  attendanceLogId!: string;

  @IsNumber()
  @Min(0.5)
  hours!: number;

  @IsString()
  reason!: string;
}

export class BulkRevertPenaltyLogsDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

export class PenaltyLogFilterDto {
  @IsOptional()
  @IsString()
  month?: string; // string from query params

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  anomalyType?: string;
}

export class EvaluateAnomaliesDto {
  @IsDateString()
  date!: string;
}

export class DecideAnomalyDto {
  @IsString()
  status!: string; // APPROVED | OVERRIDDEN

  @IsOptional()
  @IsString()
  decidedByUserId?: string;
}

export class AutoClockOutDto {
  @IsDateString()
  date!: string;
}

export class ConvertLopDto {
  @IsNumber()
  month!: number;

  @IsNumber()
  year!: number;
}
