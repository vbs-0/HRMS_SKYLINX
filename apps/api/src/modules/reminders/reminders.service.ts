import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateReminderRuleDto, UpdateReminderRuleDto } from "./dto/reminders.dto";
import { MailService } from "../../common/mail/mail.service";
import { TenantContext } from "../../common/tenant-context";

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
    const rules = await this.prisma.reminderRule.findMany({
      where: { enabled: true },
    });

    let processedCount = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    for (const rule of rules) {
      if (rule.event === "DOCUMENT_EXPIRY") {
        let offset = rule.daysOffset;
        try {
          const docRule = await this.prisma.clientRule.findUnique({
            where: {
              companyId_category_key: {
                companyId: rule.companyId,
                category: "documents",
                key: "expiryReminderDays",
              },
            },
          });
          if (docRule && docRule.valueJson !== undefined) {
            offset = Number(docRule.valueJson);
          }
        } catch (e) {
          // ignore fallback
        }

        const targetDateStart = new Date();
        targetDateStart.setDate(targetDateStart.getDate() + offset);
        targetDateStart.setHours(0, 0, 0, 0);

        const targetDateEnd = new Date(targetDateStart);
        targetDateEnd.setHours(23, 59, 59, 999);

        const documents = await this.prisma.employeeDocument.findMany({
          where: {
            expiresAt: {
              gte: targetDateStart,
              lte: targetDateEnd,
            },
            employee: {
              companyId: rule.companyId,
              status: "ACTIVE",
            },
          },
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        });

        for (const doc of documents) {
          const logsToday = await this.prisma.reminderLog.findMany({
            where: {
              ruleId: rule.id,
              employeeId: doc.employeeId,
              sentAt: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
          });
          const alreadySent = logsToday.some((log) => {
            const payload = log.payloadJson as any;
            return payload && payload.documentId === doc.id;
          });

          if (alreadySent) continue;

          const employee = doc.employee;
          if (employee.user) {
            await this.prisma.notification.create({
              data: {
                userId: employee.user.id,
                channel: "IN_APP",
                title: "Document Expiry Reminder",
                body: `Your document of type "${doc.documentType}" is set to expire on ${new Date(doc.expiresAt!).toLocaleDateString("en-IN")}. Please upload a renewed document.`,
                status: "SENT",
                sentAt: new Date(),
              },
            });

            if (rule.channel === "EMAIL" || rule.channel === "BOTH") {
              try {
                await this.mailService.send({
                  to: employee.user.email,
                  subject: `Document Expiry Reminder: ${doc.documentType}`,
                  text: `Dear ${employee.firstName},\n\nYour document of type "${doc.documentType}" is set to expire on ${new Date(doc.expiresAt!).toLocaleDateString("en-IN")}.\n\nPlease upload a renewed document in the Employee Portal.\n\nBest regards,\nHR Team`,
                  html: `<p>Dear ${employee.firstName},</p><p>Your document of type "<strong>${doc.documentType}</strong>" is set to expire on ${new Date(doc.expiresAt!).toLocaleDateString("en-IN")}.</p><p>Please upload a renewed document in the Employee Portal.</p><p>Best regards,<br/>HR Team</p>`,
                });
              } catch (mailError) {
                console.warn("Mail sending failed during processReminders:", mailError);
              }
            }
          }

          if (employee.managerId) {
            const managerUser = await this.prisma.user.findFirst({
              where: {
                employeeId: employee.managerId,
                status: "ACTIVE",
              },
            });
            if (managerUser) {
              await this.prisma.notification.create({
                data: {
                  userId: managerUser.id,
                  channel: "IN_APP",
                  title: `Document Expiry: ${employee.firstName} ${employee.lastName}`,
                  body: `The document of type "${doc.documentType}" for ${employee.firstName} ${employee.lastName} is set to expire on ${new Date(doc.expiresAt!).toLocaleDateString("en-IN")}.`,
                  status: "SENT",
                  sentAt: new Date(),
                },
              });
            }
          }

          await this.prisma.reminderLog.create({
            data: {
              ruleId: rule.id,
              employeeId: doc.employeeId,
              payloadJson: { documentId: doc.id },
            },
          });
        }
      } else if (rule.event === "BIRTHDAY") {
        const today = new Date();
      }
      processedCount++;
    }

    return response("reminders", "process", { processedCount });
  }

  async getUpcomingExpiries() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new UnauthorizedException("No tenant context found");

    let offset = 30;
    try {
      const docRule = await this.prisma.clientRule.findUnique({
        where: {
          companyId_category_key: {
            companyId: tenantId,
            category: "documents",
            key: "expiryReminderDays",
          },
        },
      });
      if (docRule && docRule.valueJson !== undefined) {
        offset = Number(docRule.valueJson);
      } else {
        const reminderRule = await this.prisma.reminderRule.findFirst({
          where: { companyId: tenantId, event: "DOCUMENT_EXPIRY", enabled: true },
        });
        if (reminderRule) offset = reminderRule.daysOffset;
      }
    } catch (e) {}

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);

    const documents = await this.prisma.employeeDocument.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
          lte: targetDate,
        },
        employee: {
          companyId: tenantId,
          status: "ACTIVE",
        },
      },
      include: {
        employee: true,
      },
      orderBy: { expiresAt: "asc" },
    });

    return response("reminders", "upcoming-expiries", documents);
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
