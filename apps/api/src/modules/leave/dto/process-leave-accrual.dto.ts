import { IsString } from "class-validator";

export class ProcessLeaveAccrualDto {
  @IsString()
  period!: string; // e.g., "2026-06" or "2026-Q2"
}
