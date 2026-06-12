import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantContext } from "../../common/tenant-context";
import { ManagerMappingDto } from "./dto/manager-mapping.dto";
import { CreateDepartmentDto, CreateDesignationDto, CreateLocationDto, UpdateDepartmentDto, UpdateDesignationDto, UpdateLocationDto } from "./dto/organization.dto";


@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async chart() {
    const employees = await this.prisma.employee.findMany({
      include: {
        department: true,
        designation: true,
        location: true,
        documents: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    const managerNames = new Map(employees.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`]));
    const nodes = employees.map((employee) => {
      const photoDoc = employee.documents?.find((d) => d.documentType === "Profile Photo");
      return {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
        managerId: employee.managerId,
        managerName: employee.managerId ? managerNames.get(employee.managerId) || "Unmapped Manager" : null,
        department: employee.department?.name || "Unassigned",
        designation: employee.designation?.title || "Unassigned",
        location: employee.location?.name || "Unassigned",
        status: employee.status,
        photoUrl: photoDoc ? photoDoc.fileUrl : null,
      };
    });

    const departmentTree = Object.values(
      nodes.reduce<Record<string, { department: string; count: number; employees: typeof nodes }>>((groups, node) => {
        groups[node.department] ??= { department: node.department, count: 0, employees: [] };
        groups[node.department].count += 1;
        groups[node.department].employees.push(node);
        return groups;
      }, {}),
    ).sort((a, b) => a.department.localeCompare(b.department));

    const reportingTree = nodes.map((node) => ({
      ...node,
      reports: nodes.filter((candidate) => candidate.managerId === node.id),
    }));

    return response("organization", "chart", {
      employees: nodes,
      departmentTree,
      reportingTree,
      unmappedEmployees: nodes.filter((node) => !node.managerId),
    });
  }

  async updateManager(employeeId: string, data: ManagerMappingDto) {
    if (employeeId === data.managerId) {
      throw new BadRequestException("An employee cannot report to themselves");
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    if (data.managerId) {
      const manager = await this.prisma.employee.findUnique({ where: { id: data.managerId } });
      if (!manager) throw new NotFoundException("Manager not found");
    }

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: data.managerId || null },
      include: {
        department: true,
        designation: true,
        location: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "manager.update",
        entityType: "employee",
        entityId: employeeId,
        oldValueJson: employee,
        newValueJson: updated,
      },
    });

    return response("organization", "manager.update", updated);
  }

  // ── Departments CRUD ──────────────────────────────────────────────────────
  async getDepartments() {
    const list = await this.prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return response("organization", "departments.list", list);
  }

  async createDepartment(data: CreateDepartmentDto) {
    const created = await this.prisma.department.create({
      data: {
        companyId: TenantContext.getTenantId()!,
        name: data.name,
        code: data.code,
        managerEmployeeId: data.managerEmployeeId || null,
        status: data.status || "ACTIVE",
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "departments.create",
        entityType: "department",
        entityId: created.id,
        newValueJson: created,
      },
    });

    return response("organization", "departments.create", created);
  }

  async updateDepartment(id: string, data: UpdateDepartmentDto) {
    const current = await this.prisma.department.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Department not found");

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        managerEmployeeId: data.managerEmployeeId !== undefined ? data.managerEmployeeId : undefined,
        status: data.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "departments.update",
        entityType: "department",
        entityId: id,
        oldValueJson: current,
        newValueJson: updated,
      },
    });

    return response("organization", "departments.update", updated);
  }

  async deleteDepartment(id: string) {
    const current = await this.prisma.department.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Department not found");

    await this.prisma.department.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "departments.delete",
        entityType: "department",
        entityId: id,
        oldValueJson: current,
      },
    });

    return response("organization", "departments.delete", { id });
  }

  // ── Designations CRUD ─────────────────────────────────────────────────────
  async getDesignations() {
    const list = await this.prisma.designation.findMany({
      include: { department: true },
      orderBy: { title: "asc" },
    });
    return response("organization", "designations.list", list);
  }

  async createDesignation(data: CreateDesignationDto) {
    const created = await this.prisma.designation.create({
      data: {
        companyId: TenantContext.getTenantId()!,
        title: data.title,
        departmentId: data.departmentId || null,
        grade: data.grade || null,
        status: data.status || "ACTIVE",
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "designations.create",
        entityType: "designation",
        entityId: created.id,
        newValueJson: created,
      },
    });

    return response("organization", "designations.create", created);
  }

  async updateDesignation(id: string, data: UpdateDesignationDto) {
    const current = await this.prisma.designation.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Designation not found");

    const updated = await this.prisma.designation.update({
      where: { id },
      data: {
        title: data.title,
        departmentId: data.departmentId !== undefined ? data.departmentId : undefined,
        grade: data.grade !== undefined ? data.grade : undefined,
        status: data.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "designations.update",
        entityType: "designation",
        entityId: id,
        oldValueJson: current,
        newValueJson: updated,
      },
    });

    return response("organization", "designations.update", updated);
  }

  async deleteDesignation(id: string) {
    const current = await this.prisma.designation.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Designation not found");

    await this.prisma.designation.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "designations.delete",
        entityType: "designation",
        entityId: id,
        oldValueJson: current,
      },
    });

    return response("organization", "designations.delete", { id });
  }

  // ── Locations CRUD ────────────────────────────────────────────────────────
  async getLocations() {
    const list = await this.prisma.location.findMany({
      orderBy: { name: "asc" },
    });
    return response("organization", "locations.list", list);
  }

  async createLocation(data: CreateLocationDto) {
    const created = await this.prisma.location.create({
      data: {
        companyId: TenantContext.getTenantId()!,
        name: data.name,
        address: data.address || null,
        city: data.city,
        state: data.state,
        country: data.country || "India",
        status: data.status || "ACTIVE",
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "locations.create",
        entityType: "location",
        entityId: created.id,
        newValueJson: created,
      },
    });

    return response("organization", "locations.create", created);
  }

  async updateLocation(id: string, data: UpdateLocationDto) {
    const current = await this.prisma.location.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Location not found");

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address !== undefined ? data.address : undefined,
        city: data.city,
        state: data.state,
        country: data.country,
        status: data.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "locations.update",
        entityType: "location",
        entityId: id,
        oldValueJson: current,
        newValueJson: updated,
      },
    });

    return response("organization", "locations.update", updated);
  }

  async deleteLocation(id: string) {
    const current = await this.prisma.location.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Location not found");

    await this.prisma.location.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        module: "organization",
        action: "locations.delete",
        entityType: "location",
        entityId: id,
        oldValueJson: current,
      },
    });

    return response("organization", "locations.delete", { id });
  }
}
