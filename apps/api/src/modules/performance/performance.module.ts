import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { PerformanceController } from "./performance.controller";
import { PerformanceService } from "./performance.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
