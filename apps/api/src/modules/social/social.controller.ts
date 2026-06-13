import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { CreateSocialCommentDto, CreateSocialPostDto, SocialActorDto } from "./dto/social.dto";
import { SocialService } from "./social.service";

@Controller("social")
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get("feed")
  @RequirePermissions("social.read")
  feed() {
    return this.socialService.feed();
  }

  @Post("posts")
  @RequirePermissions("social.create")
  createPost(@Body() body: CreateSocialPostDto, @CurrentUser() user: AuthenticatedUser) {
    body.authorUserId = user.sub;
    return this.socialService.createPost(body);
  }

  @Post("posts/:id/like")
  @RequirePermissions("social.create")
  like(@Param("id") id: string, @Body() body: SocialActorDto, @CurrentUser() user: AuthenticatedUser) {
    body.userId = user.sub;
    return this.socialService.like(id, body);
  }

  @Delete("posts/:id/like")
  @RequirePermissions("social.create")
  unlike(@Param("id") id: string, @Body() body: SocialActorDto, @CurrentUser() user: AuthenticatedUser) {
    body.userId = user.sub;
    return this.socialService.unlike(id, body);
  }

  @Post("posts/:id/comments")
  @RequirePermissions("social.create")
  comment(@Param("id") id: string, @Body() body: CreateSocialCommentDto, @CurrentUser() user: AuthenticatedUser) {
    body.userId = user.sub;
    return this.socialService.comment(id, body);
  }
}

