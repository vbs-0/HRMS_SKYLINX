import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("test-secret"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("me", () => {
    it("should return formatted user profile response", () => {
      const userPayload = {
        sub: "user-123",
        email: "admin@skylinx.com",
        employeeId: "emp-123",
        tenantId: "company-123",
        roles: ["Admin"],
        permissions: ["employees.read"],
      };

      const result = service.me(userPayload);
      expect(result).toEqual({
        module: "auth",
        action: "me",
        message: "auth.me scaffold ready",
        data: userPayload,
      });
    });
  });

  describe("login", () => {
    it("should throw UnauthorizedException if user email is not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "wrong@skylinx.com", password: "Password@123" }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "wrong@skylinx.com" },
        include: expect.any(Object),
      });
    });
  });
});
