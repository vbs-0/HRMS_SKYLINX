import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class UpsertBankDetailDto {
  @IsString()
  @IsNotEmpty()
  accountHolderName!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6,20}$/, { message: "Account number must be 6-20 digits" })
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "Invalid IFSC code format" })
  ifsc!: string;

  @IsOptional()
  @IsString()
  branch?: string;
}

export class VerifyBankDetailDto {
  @IsIn(["VERIFIED", "REJECTED"])
  status!: "VERIFIED" | "REJECTED";
}
