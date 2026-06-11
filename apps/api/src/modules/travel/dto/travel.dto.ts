import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class CreateTravelRequestDto {
  @IsString()
  employeeId!: string;

  @IsString()
  purpose!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  sourceCity!: string;

  @IsString()
  destinationCity!: string;

  @IsNumber()
  @Min(0)
  estimatedCost!: number;

  @IsNumber()
  @Min(0)
  advanceAmount!: number;
}

export class CreateTravelItineraryDto {
  @IsString()
  modeOfTravel!: string; // FLIGHT, TRAIN, CAB, BUS, HOTEL

  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @IsOptional()
  @IsDateString()
  boardingAt?: string;

  @IsOptional()
  @IsString()
  details?: string;
}

export class DecideTravelRequestDto {
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;
}
