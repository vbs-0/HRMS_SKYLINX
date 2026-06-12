import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SaasController } from "./saas.controller";
import { SaasService } from "./saas.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [SaasController],
  providers: [SaasService],
})
export class SaasModule {}
