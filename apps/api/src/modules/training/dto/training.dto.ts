import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateTrainingProgramDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTrainingEventDto {
  @IsString()
  programId!: string;

  @IsString()
  eventName!: string;

  @IsString()
  trainerName!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class CreateTrainingFeedbackDto {
  @IsString()
  employeeId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateTrainingResultDto {
  @IsString()
  employeeId!: string;

  @IsString()
  status!: string; // PASSED, FAILED

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateSkillDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEmployeeSkillMapDto {
  @IsString()
  employeeId!: string;

  @IsString()
  skillId!: string;

  @IsString()
  proficiency!: string; // BEGINNER, INTERMEDIATE, EXPERT
}

export class CreateDesignationSkillDto {
  @IsString()
  designationId!: string;

  @IsString()
  skillId!: string;

  @IsString()
  requiredProficiency!: string; // BEGINNER, INTERMEDIATE, EXPERT
}
