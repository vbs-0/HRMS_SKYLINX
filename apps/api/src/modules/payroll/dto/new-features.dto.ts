import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class CreateGratuityRuleDto {
  @IsString()
  companyId!: string;

  @IsNumber()
  @Min(0)
  minYears!: number;

  @IsNumber()
  @Min(0)
  multiplier!: number;
}

export class CreateGratuityDto {
  @IsString()
  employeeId!: string;
}

export class DecideGratuityDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;
}

export class CreatePayrollCorrectionDto {
  @IsString()
  payslipId!: string;

  @IsString()
  type!: string; // ARREAR / DEDUCTION_REVERSAL / BONUS_ADJUSTMENT

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  targetRunId?: string;
}

export class DecidePayrollCorrectionDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;
}

export class CreateTaxSlabDto {
  @IsString()
  regime!: string; // OLD / NEW

  @IsNumber()
  @Min(0)
  fromAmount!: number;

  @IsNumber()
  @IsOptional()
  toAmount?: number;

  @IsNumber()
  @Min(0)
  ratePercent!: number;

  @IsNumber()
  @IsOptional()
  surcharge?: number;
}

export class CreateRetentionBonusDto {
  @IsString()
  employeeId!: string;

  @IsNumber()
  @Min(0)
  bonusAmount!: number;

  @IsString()
  bonusDate!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class DecideRetentionBonusDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;
}

export class CreateSalaryWithholdingDto {
  @IsString()
  employeeId!: string;

  @IsString()
  fromDate!: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
