import { IsString, IsDecimal, IsNumber } from "class-validator";

export class CreateCompOffConversionDto {
  @IsString()
  employeeId!: string;

  @IsString()
  overtimeRequestId!: string;

  @IsString()
  leaveTypeId!: string;

  @IsNumber()
  daysGranted!: number;
}
