import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

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
}

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
