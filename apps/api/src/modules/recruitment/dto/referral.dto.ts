import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber } from "class-validator";

export class CreateReferralDto {
  @IsString()
  @IsNotEmpty()
  referrerId!: string;

  @IsString()
  @IsNotEmpty()
  candidateName!: string;

  @IsEmail()
  @IsNotEmpty()
  candidateEmail!: string;

  @IsString()
  @IsOptional()
  candidatePhone?: string;

  @IsString()
  @IsNotEmpty()
  jobPostingId!: string;

  @IsNumber()
  @IsOptional()
  bonusAmount?: number;
}

export class DecideReferralDto {
  @IsString()
  @IsNotEmpty()
  status!: string; // PENDING, HIRED, PAID
}
