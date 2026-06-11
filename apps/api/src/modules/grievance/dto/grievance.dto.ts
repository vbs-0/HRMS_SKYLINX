import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class CreateGrievanceDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}

export class UpdateGrievanceDto {
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  resolution?: string;
}
