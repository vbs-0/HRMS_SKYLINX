import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class CreateBenefitApplicationDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  benefitName: string;

  @IsNumber()
  @IsNotEmpty()
  annualMax: number;
}

export class CreateBenefitClaimDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  benefitName: string;

  @IsNumber()
  @IsNotEmpty()
  claimAmount: number;

  @IsDateString()
  @IsNotEmpty()
  claimDate: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class CreateTaxDeclarationDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  financialYear: string;

  @IsString()
  @IsNotEmpty()
  regime: string; // NEW, OLD

  @IsNumber()
  @IsOptional()
  section80C?: number;

  @IsNumber()
  @IsOptional()
  section80D?: number;

  @IsNumber()
  @IsOptional()
  section24?: number;

  @IsNumber()
  @IsOptional()
  otherExemptions?: number;
}

export class CreateProofSubmissionDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  financialYear: string;

  @IsString()
  @IsNotEmpty()
  sectionType: string;

  @IsNumber()
  @IsNotEmpty()
  declaredAmount: number;

  @IsNumber()
  @IsNotEmpty()
  actualAmount: number;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

export class CreateAdditionalSalaryDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  type: string; // ADDITION, DEDUCTION

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class DecideClaimDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;
}

export class DecideProofDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;
}
