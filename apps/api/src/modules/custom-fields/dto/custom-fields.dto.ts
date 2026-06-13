import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from "class-validator";

export class CreateCustomFieldDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(["TEXT", "NUMBER", "DATE", "SELECT", "BOOLEAN"])
  fieldType: string;

  @IsString()
  @IsOptional()
  optionsJson?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class UpdateCustomFieldDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  @IsEnum(["TEXT", "NUMBER", "DATE", "SELECT", "BOOLEAN"])
  fieldType?: string;

  @IsString()
  @IsOptional()
  optionsJson?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}
