import { Module } from "@nestjs/common";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";
import { SettingsService } from "../settings/settings.service";

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, SettingsService],
})
export class PayrollModule {}
