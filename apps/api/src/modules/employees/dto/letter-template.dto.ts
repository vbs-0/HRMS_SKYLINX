import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateLetterTemplateDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  type!: string; // APPOINTMENT, OFFER, RELIEVING

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class RenderLetterDto {
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsOptional()
  placeholders?: Record<string, string>;
}
