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

export class Section80CBreakdownDto {
  @IsNumber() @IsOptional() lic?: number;
  @IsNumber() @IsOptional() fd?: number;
  @IsNumber() @IsOptional() elss?: number;
  @IsNumber() @IsOptional() ulip?: number;
  @IsNumber() @IsOptional() epf?: number;
  @IsNumber() @IsOptional() ppf?: number;
  @IsNumber() @IsOptional() nsc?: number;
  @IsNumber() @IsOptional() homeLoanPrincipal?: number;
  @IsNumber() @IsOptional() pension80CCC?: number;
  @IsNumber() @IsOptional() tuitionFees?: number;
  @IsNumber() @IsOptional() sukanyaSamridhi?: number;
  @IsNumber() @IsOptional() nabard?: number;
  @IsNumber() @IsOptional() vpf?: number;
  @IsNumber() @IsOptional() other80C?: number;
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
  regime: string; // NEW | OLD

  @IsNumber() @IsOptional() section80C?: number;
  @IsOptional() section80CBreakdown?: Section80CBreakdownDto;
  @IsNumber() @IsOptional() section80D?: number;
  @IsNumber() @IsOptional() section24?: number;
  @IsNumber() @IsOptional() section80E?: number;
  @IsNumber() @IsOptional() section80G?: number;
  @IsNumber() @IsOptional() section80TTA?: number;
  @IsNumber() @IsOptional() section80TTB?: number;
  @IsNumber() @IsOptional() section80CCD?: number;
  @IsNumber() @IsOptional() hra?: number;
  @IsNumber() @IsOptional() lta?: number;
  @IsNumber() @IsOptional() housePropertyLoss?: number;
  @IsNumber() @IsOptional() previousEmployerIncome?: number;
  @IsNumber() @IsOptional() reimbursements?: number;
  @IsNumber() @IsOptional() otherExemptions?: number;
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

  @IsString()
  @IsOptional()
  hrRemarks?: string;
}
