import { IsNumber, IsString, Min } from "class-validator";

export class CreateLeaveEncashmentDto {
  @IsString()
  employeeId!: string;

  @IsString()
  leaveTypeId!: string;

  @IsNumber()
  @Min(1)
  days!: number;
}
