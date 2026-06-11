import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class DecideLeaveEncashmentDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @IsString()
  @IsOptional()
  decidedByUserId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
