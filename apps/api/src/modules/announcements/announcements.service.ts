import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateAnnouncementDto } from "./dto/announcements.dto";
import { AuthenticatedUser } from "../../common/auth/auth.types";

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        companyId: "", // Overwritten by tenant/company middleware
        title: dto.title,
        body: dto.body,
        pinned: dto.pinned ?? false,
        audience: dto.audience ?? "ALL",
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    await this.audit("announcements", "announcement.create", "announcement", announcement.id, announcement);
    return response("announcements", "create", announcement);
  }

  async findAll(user: AuthenticatedUser) {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: {
        publishedAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: [
        { pinned: "desc" },
        { publishedAt: "desc" },
      ],
    });

    if (user.employeeId) {
      const reads = await this.prisma.announcementRead.findMany({
        where: { employeeId: user.employeeId },
      });
      const readSet = new Set(reads.map((r) => r.announcementId));
      const mapped = announcements.map((a) => ({
        ...a,
        read: readSet.has(a.id),
      }));
      return response("announcements", "list", mapped);
    }

    return response("announcements", "list", announcements);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    let read = false;
    if (user.employeeId) {
      const readRecord = await this.prisma.announcementRead.findFirst({
        where: { announcementId: id, employeeId: user.employeeId },
      });
      read = !!readRecord;
    }

    return response("announcements", "detail", { ...announcement, read });
  }

  async togglePin(id: string, pinned: boolean) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { pinned },
    });

    await this.audit("announcements", "announcement.pin", "announcement", id, updated);
    return response("announcements", "pin", updated);
  }

  async markAsRead(announcementId: string, employeeId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    const read = await this.prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: { announcementId, employeeId },
      },
      update: {},
      create: {
        announcementId,
        employeeId,
      },
    });

    await this.audit("announcements", "announcement.read", "announcement_read", read.id, read);
    return response("announcements", "read", read);
  }

  async getReads(announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    const reads = await this.prisma.announcementRead.findMany({
      where: { announcementId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { readAt: "desc" },
    });

    return response("announcements", "reads", reads);
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
