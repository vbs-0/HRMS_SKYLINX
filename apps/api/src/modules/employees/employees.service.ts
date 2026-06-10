import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateEmployeeDocumentDto, VerifyEmployeeDocumentDto } from "./dto/document.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const employees = await this.prisma.employee.findMany({
      orderBy: { employeeCode: "asc" },
      include: {
        department: true,
        designation: true,
        location: true,
        documents: true,
      },
    });
    return response("employees", "list", employees);
  }

  async create(data: CreateEmployeeDto) {
    const joiningDate = new Date(data.joiningDate);
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    const employee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          ...data,
          joiningDate,
          dateOfBirth,
        },
      });

      const leaveTypes = await tx.leaveType.findMany({
        where: {
          companyId: data.companyId,
          status: "ACTIVE",
        },
      });

      if (leaveTypes.length) {
        const year = joiningDate.getFullYear();
        await tx.leaveBalance.createMany({
          data: leaveTypes.map((leaveType) => ({
            employeeId: created.id,
            leaveTypeId: leaveType.id,
            year,
            openingBalance: leaveType.annualQuota,
            accrued: leaveType.annualQuota,
            used: 0,
            carriedForward: 0,
            available: leaveType.annualQuota,
          })),
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          module: "employees",
          action: "employee.create",
          entityType: "employee",
          entityId: created.id,
          newValueJson: { employee: created, leaveBalancesCreated: leaveTypes.length },
        },
      });

      return created;
    });
    return response("employees", "create", employee);
  }

  async documents() {
    const documents = await this.prisma.employeeDocument.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    return response("employees", "documents", documents);
  }

  bulkUpload(data: unknown) {
    return response("employees", "bulkUpload", data);
  }

  async detail(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        location: true,
        documents: true,
        bankDetails: true,
        leaveBalances: true,
        salaryStructures: true,
      },
    });
    if (!employee) throw new NotFoundException("Employee not found");
    return response("employees", "detail", employee);
  }

  async update(id: string, data: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
    return response("employees", "update", employee);
  }

  async uploadDocument(id: string, data: CreateEmployeeDocumentDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException("Employee not found");

    const document = await this.prisma.employeeDocument.create({
      data: {
        employeeId: id,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        verificationStatus: "VERIFIED",
      },
      include: { employee: true },
    });
    await this.audit("employees", "documents.upload", "employee_document", document.id, document);
    return response("employees", "documents.upload", document);
  }

  async verifyDocument(id: string, documentId: string, data: VerifyEmployeeDocumentDto) {
    const document = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        employeeId: id,
        verificationStatus: "VERIFIED",
        verifiedBy: data.verifiedBy,
        verifiedAt: new Date(),
      },
      include: { employee: true },
    });
    await this.audit("employees", "documents.verify", "employee_document", document.id, document);
    return response("employees", "documents.verify", document);
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
