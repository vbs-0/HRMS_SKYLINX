import { IsString, IsArray, IsNotEmpty, IsOptional, IsDateString, IsNumber, ValidateNested, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export class ActivityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assignedRole?: string;
}

export class CreateOnboardingTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  designationId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities: ActivityDto[];
}

export class CreateSeparationTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities: ActivityDto[];
}

export class CreateExitInterviewDto {
  @IsDateString()
  @IsNotEmpty()
  exitDate: string;

  @IsString()
  @IsNotEmpty()
  reasonForLeaving: string;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  interviewerEmployeeId?: string;
}

export class AssetRecoveryDto {
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsNumber()
  @IsOptional()
  recoveryCost?: number;
}

export class CreateFullAndFinalStatementDto {
  @IsDateString()
  @IsNotEmpty()
  exitDate: string;

  @IsDateString()
  @IsNotEmpty()
  resignationDate: string;

  @IsNumber()
  @IsOptional()
  noticeDays?: number;

  @IsNumber()
  @IsNotEmpty()
  lastDrawnSalary: number;

  @IsNumber()
  @IsOptional()
  gratuityDues?: number;

  @IsNumber()
  @IsOptional()
  encashmentDues?: number;

  @IsNumber()
  @IsOptional()
  recoveryDues?: number;

  @IsNumber()
  @IsOptional()
  unpaidSalary?: number;

  @IsNumber()
  @IsOptional()
  noticeShortfall?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetRecoveryDto)
  assets: AssetRecoveryDto[];
}

export class UpdateFfAssetDto {
  @IsString()
  @IsNotEmpty()
  returnedStatus: string; // PENDING, RETURNED, RECOVER_COST

  @IsNumber()
  @IsOptional()
  recoveryCost?: number;
}
