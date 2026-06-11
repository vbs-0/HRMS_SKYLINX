import { Body, Controller, Get, Param, Post, Patch, ForbiddenException } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementDto } from "./dto/announcements.dto";

@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @RequirePermissions("employees.configure")
  create(@Body() body: CreateAnnouncementDto) {
    return this.announcementsService.create(body);
  }

  @Get()
  @RequirePermissions("employees.read")
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.findAll(user);
  }

  @Get(":id")
  @RequirePermissions("employees.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.announcementsService.findOne(id, user);
  }

  @Patch(":id/pin")
  @RequirePermissions("employees.configure")
  togglePin(@Param("id") id: string, @Body("pinned") pinned: boolean) {
    return this.announcementsService.togglePin(id, pinned);
  }

  @Post(":id/read")
  @RequirePermissions("employees.read")
  markAsRead(
    @Param("id") id: string,
    @Body("employeeId") employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.employeeId && employeeId !== user.employeeId) {
      throw new ForbiddenException("Cannot mark announcement as read for another employee");
    }
    return this.announcementsService.markAsRead(id, employeeId);
  }

  @Get(":id/reads")
  @RequirePermissions("employees.configure")
  getReads(@Param("id") id: string) {
    return this.announcementsService.getReads(id);
  }
}
