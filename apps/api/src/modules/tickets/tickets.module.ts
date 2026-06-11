import { Module } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketsController } from "./tickets.controller";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
