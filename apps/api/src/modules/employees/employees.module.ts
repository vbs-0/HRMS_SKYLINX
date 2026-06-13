import { Module } from "@nestjs/common";
import { EmployeesController } from "./employees.controller";
import { LoansController } from "./loans.controller";
import { EmployeesService } from "./employees.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  controllers: [EmployeesController, LoansController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
