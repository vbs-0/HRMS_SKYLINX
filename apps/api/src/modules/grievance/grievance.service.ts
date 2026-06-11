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
    return response("grievance", "create", grievance);
  }

  async findAll() {
    const grievances = await this.prisma.grievance.findMany({
      include: {
        employee: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("grievance", "list", grievances);
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
    return response("grievance", "update", updated);
  }
}
