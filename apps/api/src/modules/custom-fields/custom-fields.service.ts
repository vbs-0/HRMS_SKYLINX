import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { response } from "../../common/crud-response";
import { CreateCustomFieldDto, UpdateCustomFieldDto } from "./dto/custom-fields.dto";

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDefinition(dto: CreateCustomFieldDto, companyId: string) {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { companyId, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new BadRequestException(`Custom field with key '${dto.fieldKey}' already exists`);
    }

    const definition = await this.prisma.customFieldDefinition.create({
      data: {
        companyId,
        label: dto.label,
        fieldKey: dto.fieldKey,
        fieldType: dto.fieldType,
        optionsJson: dto.optionsJson,
        required: dto.required ?? false,
      },
    });

    await this.audit("settings", "custom_field.create", "custom_field_definition", definition.id, definition);
    return response("custom-fields", "create", definition);
  }

  async findAllDefinitions(companyId: string) {
    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    return response("custom-fields", "list", definitions);
  }

  async findOneDefinition(id: string, companyId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id, companyId },
    });
    if (!definition) {
      throw new NotFoundException(`Custom field definition with ID ${id} not found`);
    }
    return response("custom-fields", "detail", definition);
  }

  async updateDefinition(id: string, dto: UpdateCustomFieldDto, companyId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id, companyId },
    });
    if (!definition) {
      throw new NotFoundException(`Custom field definition with ID ${id} not found`);
    }

    const updated = await this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        label: dto.label,
        fieldType: dto.fieldType,
        optionsJson: dto.optionsJson,
        required: dto.required,
      },
    });

    await this.audit("settings", "custom_field.update", "custom_field_definition", id, updated);
    return response("custom-fields", "update", updated);
  }

  async deleteDefinition(id: string, companyId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id, companyId },
    });
    if (!definition) {
      throw new NotFoundException(`Custom field definition with ID ${id} not found`);
    }

    await this.prisma.customFieldDefinition.delete({
      where: { id },
    });

    await this.audit("settings", "custom_field.delete", "custom_field_definition", id, { id });
    return response("custom-fields", "delete", { id });
  }

  async getEmployeeValues(employeeId: string, companyId: string) {
    // Verify employee exists and belongs to company
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Get all definitions for company
    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });

    // Get current values for employee
    const values = await this.prisma.customFieldValue.findMany({
      where: { employeeId },
    });

    const valueMap = new Map(values.map((v) => [v.definitionId, v.valueJson]));

    const merged = definitions.map((d) => {
      const rawVal = valueMap.get(d.id);
      let value = null;
      if (rawVal) {
        try {
          value = JSON.parse(rawVal);
        } catch {
          value = rawVal;
        }
      }
      return {
        id: d.id,
        label: d.label,
        fieldKey: d.fieldKey,
        fieldType: d.fieldType,
        optionsJson: d.optionsJson,
        required: d.required,
        value,
      };
    });

    return response("custom-fields", "employee-values", merged);
  }

  async updateEmployeeValues(employeeId: string, values: Record<string, any>, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const updatedRecords = [];

    for (const [fieldKey, value] of Object.entries(values)) {
      const definition = await this.prisma.customFieldDefinition.findFirst({
        where: { companyId, fieldKey },
      });
      if (!definition) {
        continue;
      }

      const valRecord = await this.prisma.customFieldValue.upsert({
        where: {
          definitionId_employeeId: { definitionId: definition.id, employeeId },
        },
        update: {
          valueJson: JSON.stringify(value),
        },
        create: {
          definitionId: definition.id,
          employeeId,
          valueJson: JSON.stringify(value),
        },
      });
      updatedRecords.push(valRecord);
    }

    await this.audit("settings", "custom_field_value.update", "employee", employeeId, { employeeId, values });
    return response("custom-fields", "update-employee-values", updatedRecords);
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
