import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from "class-validator";

export class CreateStaffingPlanDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @IsString()
  @IsNotEmpty()
  designationId!: string;

  @IsNumber()
  budgetedHeadcount!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
