import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsArray, ValidateNested, IsObject } from "class-validator";
import { Type } from "class-transformer";

export class SurveyQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  kind: string;

  @IsOptional()
  optionsJson?: any;
}

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions: SurveyQuestionDto[];
}

export class SubmitSurveyResponseDto {
  @IsObject()
  answersJson: Record<string, any>;
}
