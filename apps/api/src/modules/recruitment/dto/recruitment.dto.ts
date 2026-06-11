import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail, IsArray, IsDateString, Min, Max, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @Min(1)
  openings!: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  requestedById!: string;

  @IsString()
  @IsNotEmpty()
  designationId!: string;
}

export class DecideRequisitionDto {
  @IsString()
  @IsNotEmpty()
  status!: "APPROVED" | "REJECTED";

  @IsString()
  @IsNotEmpty()
  approvedById!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @Min(1)
  openings!: number;

  @IsString()
  @IsOptional()
  requisitionId?: string;
}

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  mode!: string; // ONLINE, IN_PERSON

  @IsArray()
  @IsString({ each: true })
  interviewerIds!: string[];

  @IsString()
  @IsOptional()
  roundName?: string; // e.g., "Technical 1", "HR Round"
}

export class SubmitFeedbackDto {
  @IsString()
  @IsNotEmpty()
  interviewerEmployeeId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsNotEmpty()
  recommendation!: "HIRE" | "REJECT" | "HOLD";
}

export class OfferTermDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateJobOfferDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsNumber()
  @Min(0)
  offeredCtc!: number;

  @IsDateString()
  @IsNotEmpty()
  joiningDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferTermDto)
  terms!: OfferTermDto[];
}

export class UpdateApplicationStageDto {
  @IsString()
  @IsNotEmpty()
  stage!: "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
}
