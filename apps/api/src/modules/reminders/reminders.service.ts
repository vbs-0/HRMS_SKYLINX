import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateReminderRuleDto, UpdateReminderRuleDto } from "./dto/reminders.dto";
import { MailService } from "../../common/mail/mail.service";

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateReminderRuleDto) {
    const rule = await this.prisma.reminderRule.create({
      data: {
        companyId: "", // Overwritten by middleware
        event: dto.event,
        daysOffset: dto.daysOffset,
        channel: dto.channel,
        enabled: dto.enabled ?? true,
        templateSubject: dto.templateSubject,
        templateBody: dto.templateBody,
      },
    });

    await this.audit("reminders", "reminder.create", "reminder_rule", rule.id, rule);
    return response("reminders", "create", rule);
  }

  async findAll() {
    const rules = await this.prisma.reminderRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return response("reminders", "list", rules);
  }

  async update(id: string, dto: UpdateReminderRuleDto) {
    const rule = await this.prisma.reminderRule.findUnique({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException(`ReminderRule with ID ${id} not found`);
    }

    const updated = await this.prisma.reminderRule.update({
      where: { id },
      data: dto,
    });

    await this.audit("reminders", "reminder.update", "reminder_rule", id, updated);
    return response("reminders", "update", updated);
  }

  async processReminders() {
    // In a real scenario, this would be invoked by a CRON job.
    // It fetches rules, finds upcoming events (like birthdays), and sends emails.
    const rules = await this.prisma.reminderRule.findMany({
      where: { enabled: true },
    });

    let processedCount = 0;

    for (const rule of rules) {
      if (rule.event === "BIRTHDAY") {
        const today = new Date();
        // Just an example. In real life, proper date checking against DOBy.
        // We'll mock processing and log it.
      }
      processedCount++;
    }

    return response("reminders", "process", { processedCount });
  }

  private async audit(module: string, action: string, entityType: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module,
        action,
        entityType,
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
