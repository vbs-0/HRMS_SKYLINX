import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from "class-validator";

export class CreateReminderRuleDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsNumber()
  @IsNotEmpty()
  daysOffset: number;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsNotEmpty()
  templateSubject: string;

  @IsString()
  @IsNotEmpty()
  templateBody: string;
}

export class UpdateReminderRuleDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  templateSubject?: string;

  @IsString()
  @IsOptional()
  templateBody?: string;
}
