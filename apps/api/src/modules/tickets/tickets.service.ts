import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../../common/mail/mail.service";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { response } from "../../common/crud-response";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateTicketDto) {
    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new BadRequestException("User must be associated with a tenant to create a ticket.");
    }

    const rulesRes = await this.settingsService.rules();
    const rules = rulesRes.data as any;
    const supportRules = rules.support;

    const prefix = supportRules.ticketPrefix;
    const ticketNumber = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const queue = dto.queue || supportRules.defaultQueue;
    const priority = dto.priority || "Medium";

    // Calculate SLA Deadline based on priority
    const slaDeadline = new Date();
    if (priority === "High") {
      slaDeadline.setHours(slaDeadline.getHours() + Number(supportRules.slaHighHours));
    } else if (priority === "Medium") {
      slaDeadline.setHours(slaDeadline.getHours() + Number(supportRules.slaMediumHours));
    } else {
      slaDeadline.setHours(slaDeadline.getHours() + Number(supportRules.slaLowHours));
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        queue,
        priority,
        status: "Open",
        slaDeadline,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        tenantId,
        module: "support",
        action: "ticket.create",
        entityType: "ticket",
        entityId: ticket.id,
        newValueJson: ticket as any,
      },
    });

    // Dispatch SMTP email notification asynchronously (fire-and-forget with internal retry)
    this.mail
      .sendTicketNotification({
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || "Medium",
        queue,
        createdAt: ticket.createdAt,
      })
      .then((sent) => {
        if (sent) {
          this.logger.log(`Ticket email dispatched for ${ticketNumber}`);
        } else {
          this.logger.warn(`Ticket email NOT sent for ${ticketNumber} — check SMTP config`);
        }
      })
      .catch((err) => {
        this.logger.error(`Ticket email error for ${ticketNumber}: ${err.message}`);
      });

    return response("tickets", "create", ticket);
  }

  async findAll(user: AuthenticatedUser) {
    const isOwner = user.roles.includes("SUPER_ADMIN") || user.roles.includes("SYSTEM_OWNER");

    // If global admin/system owner, they might want to view tickets across all tenants.
    // However, PrismaService middleware automatically filters by tenantId if tenantId is present in TenantContext.
    // Since TenantMiddleware sets tenantId = decoded.tenantId, if the owner is logged in under their system tenant,
    // they would only see that tenant. But system owners don't have a tenantId constraint if they query globally.
    // Let's write the query and let the Prisma middleware handle it, or explicitly query if they are SUPER_ADMIN.
    const tickets = await this.prisma.ticket.findMany({
      include: {
        company: {
          select: {
            name: true,
            legalName: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                email: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return response("tickets", "list", tickets);
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id },
      include: {
        company: {
          select: {
            name: true,
            legalName: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found.`);
    }

    return response("tickets", "get", ticket);
  }

  async addComment(user: AuthenticatedUser, ticketId: string, dto: CreateCommentDto) {
    // Verify ticket exists (respecting tenant boundaries)
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${ticketId}" not found.`);
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        userId: user.sub,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update ticket's updatedAt
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        tenantId: ticket.tenantId,
        module: "support",
        action: "ticket.comment",
        entityType: "ticketComment",
        entityId: comment.id,
        newValueJson: comment as any,
      },
    });

    return response("tickets", "comment", comment);
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found.`);
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        tenantId: ticket.tenantId,
        module: "support",
        action: "ticket.status_update",
        entityType: "ticket",
        entityId: id,
        oldValueJson: { status: ticket.status },
        newValueJson: { status },
      },
    });

    return response("tickets", "updateStatus", updated);
  }
}
