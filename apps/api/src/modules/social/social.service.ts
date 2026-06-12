import { Injectable, NotFoundException } from "@nestjs/common";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSocialCommentDto, CreateSocialPostDto, SocialActorDto } from "./dto/social.dto";

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async feed() {
    const posts = await this.prisma.socialPost.findMany({
      include: {
        author: { include: { employee: true } },
        likes: { include: { user: { include: { employee: true } } } },
        comments: {
          include: { user: { include: { employee: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return response("social", "feed", posts);
  }

  async createPost(data: CreateSocialPostDto) {
    const authorUserId = await this.resolveUserId(data.authorUserId);
    const author = await this.prisma.user.findUnique({ where: { id: authorUserId } });
    if (!author) throw new NotFoundException("Author user not found");

    const post = await this.prisma.socialPost.create({
      data: {
        authorUserId,
        type: data.type || "POST",
        title: data.title,
        body: data.body,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        pinned: data.pinned || false,
      },
      include: {
        author: { include: { employee: true } },
        likes: true,
        comments: true,
      },
    });

    await this.audit("post.create", post.id, post);
    return response("social", "post.create", post);
  }

  async like(postId: string, data: SocialActorDto) {
    await this.ensurePost(postId);
    const userId = await this.resolveUserId(data.userId);
    const like = await this.prisma.socialLike.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    await this.audit("post.like", postId, like);
    return response("social", "post.like", like);
  }

  async unlike(postId: string, data: SocialActorDto) {
    await this.ensurePost(postId);
    const userId = await this.resolveUserId(data.userId);
    await this.prisma.socialLike.deleteMany({ where: { postId, userId } });
    await this.audit("post.unlike", postId, { postId, userId });
    return response("social", "post.unlike", { postId, userId });
  }

  async comment(postId: string, data: CreateSocialCommentDto) {
    await this.ensurePost(postId);
    const userId = await this.resolveUserId(data.userId);
    const comment = await this.prisma.socialComment.create({
      data: {
        postId,
        userId,
        body: data.body,
      },
      include: { user: { include: { employee: true } } },
    });
    await this.audit("post.comment", postId, comment);
    return response("social", "post.comment", comment);
  }

  private async ensurePost(postId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("Social post not found");
    return post;
  }

  private async resolveUserId(userId?: string) {
    if (userId) return userId;
    // No hardcoded fallback — the caller must supply the authenticated user's ID
    throw new NotFoundException("User ID is required and must be supplied by the authenticated request context.");
  }

  private async audit(action: string, entityId: string, data: unknown) {
    await this.prisma.auditLog.create({
      data: {
        module: "social",
        action,
        entityType: "social_post",
        entityId,
        newValueJson: JSON.parse(JSON.stringify(data)),
      },
    });
  }
}
