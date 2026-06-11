import { Module } from "@nestjs/common";
import { GrievanceService } from "./grievance.service";
import { GrievanceController } from "./grievance.controller";

@Module({
  controllers: [GrievanceController],
  providers: [GrievanceService],
  exports: [GrievanceService],
})
export class GrievanceModule {}
