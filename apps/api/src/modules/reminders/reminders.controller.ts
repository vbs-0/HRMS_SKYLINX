import { Body, Controller, Get, Param, Post, Patch } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { RemindersService } from "./reminders.service";
import { CreateReminderRuleDto, UpdateReminderRuleDto } from "./dto/reminders.dto";

@Controller("reminders")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @RequirePermissions("settings.configure")
  create(@Body() body: CreateReminderRuleDto) {
    return this.remindersService.create(body);
  }

  @Get()
  @RequirePermissions("settings.configure")
  findAll() {
    return this.remindersService.findAll();
  }

  @Patch(":id")
  @RequirePermissions("settings.configure")
  update(@Param("id") id: string, @Body() body: UpdateReminderRuleDto) {
    return this.remindersService.update(id, body);
  }

  @Post("process")
  @RequirePermissions("settings.configure")
  processReminders() {
    return this.remindersService.processReminders();
  }

  @Get("upcoming-expiries")
  @RequirePermissions("employees.read")
  getUpcomingExpiries() {
    return this.remindersService.getUpcomingExpiries();
  }
}
