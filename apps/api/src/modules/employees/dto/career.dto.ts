import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class CreatePromotionDto {
  @IsString()
  fromDesignationId!: string;

  @IsString()
  toDesignationId!: string;

  @IsString()
  @IsOptional()
  fromGradeId?: string;

  @IsString()
  @IsOptional()
  toGradeId?: string;

  @IsNumber()
  @IsOptional()
  revisedCtc?: number;

  @IsDateString()
  effectiveDate!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class DecidePromotionDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;
}

export class CreateTransferDto {
  @IsString()
  @IsOptional()
  fromDepartmentId?: string;

  @IsString()
  @IsOptional()
  toDepartmentId?: string;

  @IsString()
  @IsOptional()
  fromLocationId?: string;

  @IsString()
  @IsOptional()
  toLocationId?: string;

  @IsString()
  @IsOptional()
  newManagerId?: string;

  @IsDateString()
  effectiveDate!: string;
}

export class DecideTransferDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;
}
