import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  contentHtml?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsBoolean()
  @IsOptional()
  requiresAcknowledgment?: boolean;
}
