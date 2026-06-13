import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from "class-validator";
import { EmployeeStatus } from "@prisma/client";

export class CreateEmployeeDto {
  @IsString()
  employeeCode!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsDateString()
  joiningDate!: string;

  // Optional initial status. Omitted → schema default ACTIVE. Set to PROBATION
  // for new hires so the confirm-probation flow becomes reachable (it requires
  // status === PROBATION). Validated against the EmployeeStatus enum.
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsString()
  companyId!: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  providentFundAccount?: string;

  @IsOptional()
  @IsString()
  uan?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  employmentTypeId?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educationHistory?: EducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyDetailDto)
  familyDetails?: FamilyDetailDto[];
}

export class AddressDto {
  @IsOptional() @IsString() id?: string;
  @IsString() type!: string;
  @IsString() addressLine1!: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsString() pinCode!: string;
  @IsOptional() @IsString() country?: string;
}

export class EducationDto {
  @IsOptional() @IsString() id?: string;
  @IsString() degree!: string;
  @IsString() institution!: string;
  @IsNumber() yearOfPassing!: number;
  @IsOptional() @IsNumber() percentage?: number;
}

export class FamilyDetailDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name!: string;
  @IsString() relationship!: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() phone?: string;
}
