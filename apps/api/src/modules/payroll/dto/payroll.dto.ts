import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSalaryStructureDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsNumber()
  @Min(0)
  annualCtc!: number;

  @IsNumber()
  @Min(0)
  basic!: number;

  @IsNumber()
  @Min(0)
  hra!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employerPf?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employeePf?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  esi?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  professionalTax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tds?: number;
}

export class CreatePayrollRunDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  year!: number;

  @IsOptional()
  @IsString()
  processedBy?: string;
}
