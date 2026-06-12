import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { response } from "../../common/crud-response";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthenticatedUser } from "../../common/auth/auth.types";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto, RequestOtpDto, VerifyOtpDto } from "./dto/otp.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        employee: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordOk = await compare(data.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const roles = user.roles.map((item) => item.role.name);
    const permissions = user.roles.flatMap((item) =>
      item.role.permissions.map(({ permission }) => `${permission.module}.${permission.action}`),
    );

    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      employeeId: user.employeeId,
      tenantId: user.tenantId,
      roles,
      permissions: [...new Set(permissions)],
    };

    const tenantId = user.tenantId;
    const subscriptionSetting = tenantId
      ? await this.prisma.moduleSetting.findUnique({
          where: { companyId_module: { companyId: tenantId, module: "subscription" } },
        })
      : null;
    const activePlan =
      subscriptionSetting?.settingsJson &&
      typeof subscriptionSetting.settingsJson === "object" &&
      "activePlan" in subscriptionSetting.settingsJson
        ? (subscriptionSetting.settingsJson as { activePlan?: string }).activePlan
        : "Standard";

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        tenantId: user.tenantId,
        module: "auth",
        action: "login",
        entityType: "user",
        entityId: user.id,
      },
    });

    return response("auth", "login", {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET") || "dev-access-secret",
      }),
      tokenType: "Bearer",
      expiresIn: 900,
      user: payload,
      activePlan,
    });
  }

  requestOtp(data: RequestOtpDto) {
    return response("auth", "otp.request", data);
  }

  verifyOtp(data: VerifyOtpDto) {
    return response("auth", "otp.verify", data);
  }

  forgotPassword(data: ForgotPasswordDto) {
    return response("auth", "forgotPassword", data);
  }

  me(user: AuthenticatedUser) {
    return response("auth", "me", user);
  }
}
