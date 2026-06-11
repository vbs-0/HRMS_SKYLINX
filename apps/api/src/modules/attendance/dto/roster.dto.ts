import { IsString, IsArray, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsNumber } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class AssignShiftDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class BulkAssignShiftDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  employeeIds: string[];

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class RequestShiftDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsDateString()
  @IsNotEmpty()
  requestedDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class DecideShiftRequestDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;
}
