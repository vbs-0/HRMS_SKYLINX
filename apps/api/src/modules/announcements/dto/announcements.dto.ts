import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsEnum } from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsString()
  @IsOptional()
  audience?: string;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
