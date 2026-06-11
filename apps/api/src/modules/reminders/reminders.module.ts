import { Module } from "@nestjs/common";
import { RemindersController } from "./reminders.controller";
import { RemindersService } from "./reminders.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { MailModule } from "../../common/mail/mail.module";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
