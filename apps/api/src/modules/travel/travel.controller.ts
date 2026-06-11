import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import {
  CreateTravelRequestDto,
  CreateTravelItineraryDto,
  DecideTravelRequestDto,
} from "./dto/travel.dto";
import { TravelService } from "./travel.service";

@Controller("travel")
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post("requests")
  @RequirePermissions("travel.create")
  createRequest(@Body() body: CreateTravelRequestDto) {
    return this.travelService.createRequest(body);
  }

  @Get("requests")
  @RequirePermissions("travel.read")
  listRequests() {
    return this.travelService.listRequests();
  }

  @Patch("requests/:id/decide")
  @RequirePermissions("travel.approve")
  decideRequest(@Param("id") id: string, @Body() body: DecideTravelRequestDto) {
    return this.travelService.decideRequest(id, body);
  }

  @Post("requests/:id/itinerary")
  @RequirePermissions("travel.update")
  addItinerary(@Param("id") id: string, @Body() body: CreateTravelItineraryDto) {
    return this.travelService.addItinerary(id, body);
  }

  @Get("advances")
  @RequirePermissions("travel.read")
  listAdvances() {
    return this.travelService.listAdvances();
  }

  @Patch("advances/:id/disburse")
  @RequirePermissions("travel.approve")
  disburseAdvance(@Param("id") id: string) {
    return this.travelService.disburseAdvance(id);
  }
}
