import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { ApprovalStatus } from "@prisma/client";
import {
  CreateTravelRequestDto,
  CreateTravelItineraryDto,
  DecideTravelRequestDto,
} from "./dto/travel.dto";

@Injectable()
export class TravelService {
  constructor(private readonly prisma: PrismaService) {}

  // Travel Requests
  async createRequest(data: CreateTravelRequestDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException("Employee not found");

    const req = await this.prisma.$transaction(async (tx) => {
      const created = await tx.travelRequest.create({
        data: {
          employeeId: data.employeeId,
          purpose: data.purpose,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          sourceCity: data.sourceCity,
          destinationCity: data.destinationCity,
          estimatedCost: data.estimatedCost,
          advanceAmount: data.advanceAmount,
          status: ApprovalStatus.PENDING,
        },
      });

      // If advance amount is requested, create EmployeeAdvance record
      if (data.advanceAmount > 0) {
        await tx.employeeAdvance.create({
          data: {
            employeeId: data.employeeId,
            requestId: created.id,
            amount: data.advanceAmount,
            status: "PENDING",
          },
        });
      }

      return created;
    });

    await this.audit("travel.create", "travel_request", req.id, req);
    return response("travel", "travel.create", req);
  }

  async listRequests() {
    const requests = await this.prisma.travelRequest.findMany({
      include: {
        employee: true,
        itineraries: true,
        advances: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("travel", "requests.list", requests);
  }

  async decideRequest(id: string, data: DecideTravelRequestDto) {
    const req = await this.prisma.travelRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException("Travel request not found");

    const updated = await this.prisma.$transaction(async (tx) => {
      const uRequest = await tx.travelRequest.update({
        where: { id },
        data: { status: data.status },
        include: { employee: true },
      });

      // If request is REJECTED, reject any pending advances
      if (data.status === ApprovalStatus.REJECTED) {
        await tx.employeeAdvance.updateMany({
          where: { requestId: id, status: "PENDING" },
          data: { status: "REJECTED" },
        });
      }

      return uRequest;
    });

    await this.audit("travel.decide", "travel_request", id, updated);
    return response("travel", "travel.decide", updated);
  }

  // Itinerary
  async addItinerary(requestId: string, data: CreateTravelItineraryDto) {
    const req = await this.prisma.travelRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Travel request not found");

    const itin = await this.prisma.travelItinerary.create({
      data: {
        requestId,
        modeOfTravel: data.modeOfTravel,
        ticketNumber: data.ticketNumber,
        boardingAt: data.boardingAt ? new Date(data.boardingAt) : null,
        details: data.details,
      },
    });

    await this.audit("itinerary.create", "travel_itinerary", itin.id, itin);
    return response("travel", "itinerary.create", itin);
  }

  // Advances
  async listAdvances() {
    const advances = await this.prisma.employeeAdvance.findMany({
      include: {
        employee: true,
        travelRequest: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return response("travel", "advances.list", advances);
  }

  async disburseAdvance(id: string) {
    const adv = await this.prisma.employeeAdvance.findUnique({ where: { id } });
    if (!adv) throw new NotFoundException("Employee advance not found");
    if (adv.status !== "PENDING") {
      throw new BadRequestException("Advance is not pending disbursement");
    }

    const updated = await this.prisma.employeeAdvance.update({
      where: { id },
      data: {
        status: "PAID",
        paymentDate: new Date(),
      },
      include: { employee: true },
    });

    await this.audit("advance.disburse", "employee_advance", id, updated);
    return response("travel", "advance.disburse", updated);
  }

  private async audit(action: string, entityType: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "travel",
        action,
        entityType,
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
