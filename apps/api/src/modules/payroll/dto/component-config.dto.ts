import { IsString, IsBoolean, IsOptional, IsInt, IsIn } from "class-validator";

export class CreateComponentConfigDto {
  @IsString()
  name: string;

  @IsString()
  @IsIn(["BASE", "RECURRING", "VARIABLE", "ADHOC"])
  category: string;

  @IsString()
  @IsIn(["ALLOWANCE", "REIMBURSEMENT", "DEDUCTION"])
  kind: string;

  @IsBoolean()
  taxable: boolean;

  @IsOptional()
  @IsInt()
  annualLimit?: number;

  @IsBoolean()
  individualOverride: boolean;

  @IsBoolean()
  proofRequired: boolean;

  @IsBoolean()
  esiApplicable: boolean;

  @IsBoolean()
  includedInCtc: boolean;
}

export class UpdateComponentConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(["BASE", "RECURRING", "VARIABLE", "ADHOC"])
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(["ALLOWANCE", "REIMBURSEMENT", "DEDUCTION"])
  kind?: string;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsOptional()
  @IsInt()
  annualLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  individualOverride?: boolean;

  @IsOptional()
  @IsBoolean()
  proofRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  esiApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  includedInCtc?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ToggleComponentConfigDto {
  @IsBoolean()
  enabled: boolean;
}
