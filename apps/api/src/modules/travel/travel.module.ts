import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { TravelController } from "./travel.controller";
import { TravelService } from "./travel.service";

@Module({
  imports: [PrismaModule],
  controllers: [TravelController],
  providers: [TravelService],
  exports: [TravelService],
})
export class TravelModule {}
