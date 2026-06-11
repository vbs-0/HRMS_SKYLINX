import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  assetTag: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  item: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}
