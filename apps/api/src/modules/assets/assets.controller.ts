import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { AssetsService } from "./assets.service";
import { CreateAssetDto } from "./dto/create-asset.dto";

@Controller("assets")
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermissions("assets.read")
  summary() {
    return this.assetsService.summary();
  }

  @Post()
  @RequirePermissions("assets.configure")
  create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateAssetDto) {
    return this.assetsService.create(user, data);
  }

  @Post(":assetTag/assign")
  @RequirePermissions("assets.configure")
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetTag") assetTag: string,
    @Body("employeeId") employeeId?: string,
  ) {
    return this.assetsService.assign(user, assetTag, employeeId);
  }

  @Post(":assetTag/return")
  @RequirePermissions("assets.configure")
  returnAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetTag") assetTag: string,
    @Body("condition") condition?: string,
  ) {
    return this.assetsService.returnAsset(user, assetTag, condition);
  }

  @Delete(":assetTag")
  @RequirePermissions("assets.configure")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("assetTag") assetTag: string) {
    return this.assetsService.deleteAsset(user, assetTag);
  }
}
