import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateFeedbackRequestDto {
  @IsString()
  @IsOptional()
  appraisalId?: string;

  @IsString()
  @IsNotEmpty()
  requestorId!: string;

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsNotEmpty()
  questions!: any;
}

export class SubmitFeedbackResponseDto {
  @IsNotEmpty()
  answers!: any;
}
