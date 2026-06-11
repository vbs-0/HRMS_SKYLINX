import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreatePolicyDto } from "./dto/policies.dto";
import { AuthenticatedUser } from "../../common/auth/auth.types";

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePolicyDto) {
    const policy = await this.prisma.companyPolicy.create({
      data: {
        companyId: "", // Overwritten by tenant/company middleware
        title: dto.title,
        category: dto.category,
        description: dto.description,
        fileUrl: dto.fileUrl,
        contentHtml: dto.contentHtml,
        version: dto.version ?? "1.0",
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        requiresAcknowledgment: dto.requiresAcknowledgment ?? true,
        status: "ACTIVE",
      },
    });
    await this.audit("policies", "policy.create", "company_policy", policy.id, policy);
    return response("policies", "create", policy);
  }

  async findAll(user: AuthenticatedUser) {
    const policies = await this.prisma.companyPolicy.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (user.employeeId) {
      const acks = await this.prisma.policyAcknowledgment.findMany({
        where: { employeeId: user.employeeId },
      });
      const ackSet = new Set(acks.map((a) => a.policyId));
      const mapped = policies.map((p) => ({
        ...p,
        acknowledged: ackSet.has(p.id),
      }));
      return response("policies", "list", mapped);
    }

    return response("policies", "list", policies);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id },
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    let acknowledged = false;
    if (user.employeeId) {
      const ack = await this.prisma.policyAcknowledgment.findFirst({
        where: { policyId: id, employeeId: user.employeeId },
      });
      acknowledged = !!ack;
    }

    return response("policies", "detail", { ...policy, acknowledged });
  }

  async acknowledge(policyId: string, employeeId: string) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id: policyId },
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }
    if (policy.status === "ARCHIVED") {
      throw new BadRequestException("Cannot acknowledge an archived policy");
    }

    const ack = await this.prisma.policyAcknowledgment.upsert({
      where: {
        policyId_employeeId: { policyId, employeeId },
      },
      update: {},
      create: {
        policyId,
        employeeId,
      },
    });

    await this.audit("policies", "policy.acknowledge", "policy_acknowledgment", ack.id, ack);
    return response("policies", "acknowledge", ack);
  }

  async getAcknowledgments(policyId: string) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id: policyId },
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const acks = await this.prisma.policyAcknowledgment.findMany({
      where: { policyId },
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
      orderBy: { acknowledgedAt: "desc" },
    });

    return response("policies", "acknowledgments", acks);
  }

  async archive(id: string) {
    const policy = await this.prisma.companyPolicy.findUnique({
      where: { id },
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    const updated = await this.prisma.companyPolicy.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await this.audit("policies", "policy.archive", "company_policy", id, updated);
    return response("policies", "archive", updated);
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
