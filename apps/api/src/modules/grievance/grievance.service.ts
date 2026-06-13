import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateGrievanceDto, UpdateGrievanceDto } from "./dto/grievance.dto";

@Injectable()
export class GrievanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGrievanceDto) {
    const grievance = await this.prisma.grievance.create({
      data: {
        employeeId: dto.employeeId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        anonymous: dto.anonymous ?? false,
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });
    if (grievance.anonymous) {
      (grievance as any).employee = null;
      grievance.employeeId = "ANON";
    }
    return response("grievance", "create", grievance);
  }

  async findAll() {
    const grievances = await this.prisma.grievance.findMany({
      include: {
        employee: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const sanitized = grievances.map((g) => {
      if (g.anonymous) {
        return { ...g, employee: null, employeeId: "ANON" };
      }
      return g;
    });
    return response("grievance", "list", sanitized);
  }

  async findOne(id: string) {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });
    if (!grievance) {
      throw new NotFoundException(`Grievance with ID ${id} not found`);
    }
    if (grievance.anonymous) {
      (grievance as any).employee = null;
      grievance.employeeId = "ANON";
    }
    return response("grievance", "detail", grievance);
  }

  async update(id: string, dto: UpdateGrievanceDto) {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
    });
    if (!grievance) {
      throw new NotFoundException(`Grievance with ID ${id} not found`);
    }

    const updated = await this.prisma.grievance.update({
      where: { id },
      data: {
        status: dto.status,
        assignedToId: dto.assignedToId,
        resolution: dto.resolution,
      },
      include: {
        employee: true,
      },
    });
    if (updated.anonymous) {
      (updated as any).employee = null;
      updated.employeeId = "ANON";
    }
    return response("grievance", "update", updated);
  }
}
