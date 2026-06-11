import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CreateEmployeeGradeDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  maxExpenseLimit?: number;
}

export class CreateEmploymentTypeDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
