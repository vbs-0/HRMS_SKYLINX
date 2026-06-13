import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContext } from "../../common/tenant-context";
import { CreateAssetDto } from "./dto/create-asset.dto";

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantId(): string {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new UnauthorizedException("No tenant context");
    return tenantId;
  }

  async summary() {
    const tenantId = this.getTenantId();

    // 1. Query assets from database
    let assets = await this.prisma.companyAsset.findMany({
      where: { companyId: tenantId },
      include: {
        assignedTo: {
          include: { department: true },
        },
      },
      orderBy: { assetTag: "asc" },
    });

    // The asset register reflects real data only — no mock self-seeding.
    // (Previously fabricated 5 demo assets when empty, which meant the
    // register could never be empty and deleted assets resurrected.)

    // 3. Fetch audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { module: "assets", tenantId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const rows = assets.map((asset) => ({
      id: asset.id,
      assetTag: asset.assetTag,
      type: asset.type,
      item: asset.item,
      assignedTo: asset.assignedTo
        ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`
        : "-",
      employeeStatus: asset.assignedTo?.status || null,
      department: asset.assignedTo?.department?.name || "-",
      status: asset.status,
      condition: asset.condition,
    }));

    const total = assets.length;
    const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
    const available = assets.filter((a) => a.status === "AVAILABLE" || a.status === "RETURNED").length;
    const returned = auditLogs.filter((log) => log.action === "asset.return").length;
    const handoverPending = assets.filter((a) => a.status === "ASSIGNED" && (a.condition === "POOR" || a.assignedTo?.status === "EXITED")).length;

    const categories = [
      { type: "Laptop", count: assets.filter((a) => a.type === "Laptop").length },
      { type: "ID Card", count: assets.filter((a) => a.type === "ID Card").length },
      { type: "Phone", count: assets.filter((a) => a.type === "Phone").length },
      { type: "Accessories", count: assets.filter((a) => a.type === "Accessories").length },
    ];

    return response("assets", "summary", {
      total,
      assigned,
      available,
      returned,
      handoverPending,
      categories,
      rows,
      logs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        assetTag: log.entityId || "-",
        status: (log.newValueJson as { status?: string } | null)?.status || "COMPLETED",
        createdAt: log.createdAt,
      })),
    });
  }

  async create(user: AuthenticatedUser, data: CreateAssetDto) {
    const tenantId = this.getTenantId();

    const existing = await this.prisma.companyAsset.findUnique({
      where: { assetTag: data.assetTag },
    });
    if (existing) {
      throw new BadRequestException(`Asset with tag "${data.assetTag}" already exists.`);
    }

    const asset = await this.prisma.companyAsset.create({
      data: {
        companyId: tenantId,
        assetTag: data.assetTag,
        type: data.type,
        item: data.item,
        status: data.status || "AVAILABLE",
        condition: data.condition || "GOOD",
        assignedToId: data.assignedToId || null,
      },
    });

    await this.audit(user, "asset.create", data.assetTag, asset.status);

    return response("assets", "create", asset);
  }

  async assign(user: AuthenticatedUser, assetTag: string, employeeId?: string) {
    const tenantId = this.getTenantId();

    const asset = await this.prisma.companyAsset.findFirst({
      where: { assetTag, companyId: tenantId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset tag "${assetTag}" not found.`);
    }

    let targetEmployeeId = employeeId;
    if (!targetEmployeeId) {
      // Fallback: assign to the first active employee of the tenant
      const firstEmp = await this.prisma.employee.findFirst({
        where: { companyId: tenantId, status: "ACTIVE" },
      });
      if (!firstEmp) {
        throw new BadRequestException("No active employees found to assign this asset to.");
      }
      targetEmployeeId = firstEmp.id;
    }

    const updated = await this.prisma.companyAsset.update({
      where: { id: asset.id },
      data: {
        status: "ASSIGNED",
        assignedToId: targetEmployeeId,
      },
    });

    await this.audit(user, "asset.assign", assetTag, "ASSIGNED");

    return response("assets", "assign", updated);
  }

  async returnAsset(user: AuthenticatedUser, assetTag: string, condition?: string) {
    const tenantId = this.getTenantId();

    const asset = await this.prisma.companyAsset.findFirst({
      where: { assetTag, companyId: tenantId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset tag "${assetTag}" not found.`);
    }

    const updated = await this.prisma.companyAsset.update({
      where: { id: asset.id },
      data: {
        status: "RETURNED",
        assignedToId: null,
        condition: condition || asset.condition,
      },
    });

    await this.audit(user, "asset.return", assetTag, "RETURNED");

    return response("assets", "return", updated);
  }

  async deleteAsset(user: AuthenticatedUser, assetTag: string) {
    const tenantId = this.getTenantId();

    const asset = await this.prisma.companyAsset.findFirst({
      where: { assetTag, companyId: tenantId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset tag "${assetTag}" not found.`);
    }

    await this.prisma.companyAsset.delete({
      where: { id: asset.id },
    });

    await this.audit(user, "asset.delete", assetTag, "DELETED");

    return response("assets", "delete", { success: true, assetTag });
  }

  private async audit(user: AuthenticatedUser, action: string, assetTag: string, status: string) {
    const tenantId = this.getTenantId();
    const log = await this.prisma.auditLog.create({
      data: {
        actorUserId: user.sub,
        tenantId,
        module: "assets",
        action,
        entityType: "company_asset",
        entityId: assetTag,
        newValueJson: {
          status,
          actionedAt: new Date().toISOString(),
        },
      },
    });
    return log;
  }
}
