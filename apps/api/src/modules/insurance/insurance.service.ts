import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus } from "@prisma/client";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDependentDto, CreateInsuranceClaimDto, CreateInsuranceDto, DecideInsuranceClaimDto } from "./dto/insurance.dto";

@Injectable()
export class InsuranceService {
  constructor(private readonly prisma: PrismaService) {}

  async policies() {
    const policies = await this.prisma.employeeInsurance.findMany({
      include: {
        employee: true,
        dependents: true,
        claims: true,
      },
      orderBy: { endDate: "asc" },
    });
    return response("insurance", "policies", policies);
  }

  async dependents() {
    const dependents = await this.prisma.insuranceDependent.findMany({
      include: {
        employee: true,
        insurance: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("insurance", "dependents", dependents);
  }

  async claims() {
    const claims = await this.prisma.insuranceClaim.findMany({
      include: {
        employee: true,
        insurance: true,
      },
      orderBy: { claimDate: "desc" },
    });
    return response("insurance", "claims", claims);
  }

  async createPolicy(data: CreateInsuranceDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const policy = await this.prisma.employeeInsurance.create({
      data: {
        employeeId: data.employeeId,
        provider: data.provider,
        policyNumber: data.policyNumber,
        policyType: data.policyType,
        coverageAmount: data.coverageAmount,
        premiumAmount: data.premiumAmount || 0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "ACTIVE",
      },
      include: {
        employee: true,
        dependents: true,
        claims: true,
      },
    });

    await this.audit("policy.create", "employee_insurance", policy.id, undefined, policy);
    return response("insurance", "policy.create", policy);
  }

  async addDependent(data: CreateDependentDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    if (data.insuranceId) {
      const policy = await this.prisma.employeeInsurance.findUnique({ where: { id: data.insuranceId } });
      if (!policy) throw new NotFoundException("Insurance policy not found");
      if (policy.employeeId !== data.employeeId) throw new BadRequestException("Dependent must belong to the selected policy employee");
    }

    const dependent = await this.prisma.insuranceDependent.create({
      data: {
        employeeId: data.employeeId,
        insuranceId: data.insuranceId,
        fullName: data.fullName,
        relationship: data.relationship,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        status: "ACTIVE",
      },
      include: {
        employee: true,
        insurance: true,
      },
    });

    await this.audit("dependent.create", "insurance_dependent", dependent.id, undefined, dependent);
    return response("insurance", "dependent.create", dependent);
  }

  async createClaim(data: CreateInsuranceClaimDto) {
    const policy = await this.prisma.employeeInsurance.findUnique({ where: { id: data.insuranceId } });
    if (!policy) throw new NotFoundException("Insurance policy not found");
    if (policy.employeeId !== data.employeeId) throw new BadRequestException("Claim employee must match policy employee");

    const claim = await this.prisma.insuranceClaim.create({
      data: {
        employeeId: data.employeeId,
        insuranceId: data.insuranceId,
        claimNumber: data.claimNumber,
        claimType: data.claimType,
        claimAmount: data.claimAmount,
        claimDate: new Date(data.claimDate),
        documentUrl: data.documentUrl,
        status: ApprovalStatus.PENDING,
      },
      include: {
        employee: true,
        insurance: true,
      },
    });

    await this.audit("claim.create", "insurance_claim", claim.id, undefined, claim);
    return response("insurance", "claim.create", claim);
  }

  async decideClaim(id: string, action: "approve" | "reject", data: DecideInsuranceClaimDto) {
    const current = await this.prisma.insuranceClaim.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Insurance claim not found");
    if (current.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Only pending insurance claims can be decided");
    }

    const claim = await this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        status: action === "approve" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        decidedBy: data.decidedBy,
        decidedAt: new Date(),
      },
      include: {
        employee: true,
        insurance: true,
      },
    });

    await this.audit(`claim.${action}`, "insurance_claim", claim.id, current, claim);
    return response("insurance", `claim.${action}`, claim);
  }

  private async audit(action: string, entityType: string, entityId: string, oldValueJson?: unknown, newValueJson?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "insurance",
        action,
        entityType,
        entityId,
        oldValueJson: oldValueJson ?? undefined,
        newValueJson: newValueJson ?? undefined,
      },
    });
  }
}
