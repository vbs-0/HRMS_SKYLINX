import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { RequirePermissions } from "../../common/auth/permissions.decorator";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @RequirePermissions("tickets.create")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user, dto);
  }

  @Get()
  @RequirePermissions("tickets.read")
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.findAll(user);
  }

  @Get(":id")
  @RequirePermissions("tickets.read")
  findOne(@Param("id") id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post(":id/comments")
  @RequirePermissions("tickets.create")
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.ticketsService.addComment(user, id, dto);
  }

  @Patch(":id/status")
  @RequirePermissions("tickets.update")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.ticketsService.updateStatus(user, id, status);
  }
}
