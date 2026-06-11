import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  workWeek?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateModuleDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsObject()
  settingsJson?: Record<string, unknown>;
}

export class UpdateClientRulesDto {
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  attendance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  leave?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  payroll?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  approvals?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  support?: Record<string, unknown>;
}
