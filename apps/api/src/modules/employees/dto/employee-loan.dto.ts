import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from "class-validator";

export class CreateEmployeeLoanDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsNumber()
  principal!: number;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsNumber()
  totalPayable!: number;

  @IsNumber()
  emiAmount!: number;

  @IsDateString()
  repaymentStart!: string;
}

export class DecideEmployeeLoanDto {
  @IsString()
  @IsNotEmpty()
  status!: string; // APPROVED, REJECTED
}
