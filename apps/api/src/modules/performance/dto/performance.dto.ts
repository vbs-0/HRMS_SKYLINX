import { IsString, IsNotEmpty, IsDateString, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class CreateAppraisalCycleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsOptional()
  status?: string; // DRAFT, ACTIVE, COMPLETED
}

export class UpdateAppraisalCycleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateKraDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  weightagePercent!: number;
}

export class CreateAppraisalTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKraDto)
  kras!: CreateKraDto[];
}

export class CreateAppraisalBulkDto {
  @IsString()
  @IsNotEmpty()
  cycleId!: string;

  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  employeeIds?: string[]; // If omitted, targets all active employees
}

export class GoalRatingDto {
  @IsString()
  @IsNotEmpty()
  kraId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number; // selfRating or managerRating
}

export class SelfRateAppraisalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalRatingDto)
  ratings!: GoalRatingDto[];
}

export class ManagerRateAppraisalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalRatingDto)
  ratings!: GoalRatingDto[];
}

export class CompleteAppraisalDto {
  @IsNumber()
  @IsOptional()
  incrementThreshold?: number; // threshold to suggest increment, e.g. 4.0
}
