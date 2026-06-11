import { Injectable, NotFoundException } from "@nestjs/common";
import { TenantContext } from "../../common/tenant-context";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateHolidayDto, UpdateHolidayStatusDto } from "./dto/holiday.dto";

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const holidays = await this.prisma.holiday.findMany({
      include: {
        company: true,
        location: true,
      },
      orderBy: { date: "asc" },
    });
    return response("holidays", "list", holidays);
  }

  async create(data: CreateHolidayDto) {
    const tenantId = TenantContext.getTenantId();
    const holiday = await this.prisma.holiday.create({
      data: {
        companyId: tenantId || data.companyId || "company_skylinx",
        locationId: data.locationId || undefined,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        status: "ACTIVE",
      },
      include: {
        company: true,
        location: true,
      },
    });

    await this.audit("holiday.create", holiday.id, undefined, holiday);
    return response("holidays", "holiday.create", holiday);
  }


  async updateStatus(id: string, data: UpdateHolidayStatusDto) {
    const current = await this.prisma.holiday.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Holiday not found");

    const holiday = await this.prisma.holiday.update({
      where: { id },
      data: { status: data.status },
      include: {
        company: true,
        location: true,
      },
    });

    await this.audit("holiday.status_update", holiday.id, current, holiday);
    return response("holidays", "holiday.status_update", holiday);
  }

  private async audit(action: string, entityId: string, oldValueJson?: unknown, newValueJson?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "holidays",
        action,
        entityType: "holiday",
        entityId,
        oldValueJson: oldValueJson ?? undefined,
        newValueJson: newValueJson ?? undefined,
      },
    });
  }
}
