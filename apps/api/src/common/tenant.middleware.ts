import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { tenantLocalStorage, TenantStore } from "./tenant-context";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // The tenant is derived from the authenticated JWT — NEVER from a
    // client-supplied header for normal users (that would let any logged-in
    // user read another company's data by sending x-tenant-id).
    let tenantId: string | null = null;
    let userId: string | null = null;
    let isOwner = false;
    let jwtTenantId: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.verify(token) as any;
        if (decoded) {
          userId = decoded.sub || null;
          jwtTenantId = decoded.tenantId || null;
          if (decoded.roles && (decoded.roles.includes("SUPER_ADMIN") || decoded.roles.includes("SYSTEM_OWNER"))) {
            isOwner = true;
          }
        }
      } catch (e) {
        // Ignore decode failures
      }
    }

    // Default: the JWT's own tenant.
    tenantId = jwtTenantId;

    // Cross-tenant override via x-tenant-id is permitted ONLY for platform
    // owners (SUPER_ADMIN / SYSTEM_OWNER) who legitimately manage all tenants.
    const headerTenant = (req.headers["x-tenant-id"] as string) || null;
    if (headerTenant && isOwner) {
      tenantId = headerTenant;
    }

    const store: TenantStore = {
      tenantId,
      userId,
      isOwner,
    };

    tenantLocalStorage.run(store, () => {
      next();
    });
  }
}
