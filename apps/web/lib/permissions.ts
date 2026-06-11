"use client";

import { getAccessToken } from "./session";
import permissionMap from "./permission-map.json";

interface JwtPayload {
  roles?: string[];
  permissions?: string[];
}

const OWNER_ROLES = ["SUPER_ADMIN", "SYSTEM_OWNER"];

function decodeToken(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getMyRoles(): string[] {
  return decodeToken()?.roles ?? [];
}

export function getMyPermissions(): string[] | null {
  const payload = decodeToken();
  if (!payload) return null;
  return payload.permissions ?? [];
}

/** True when the current JWT grants `module.action` (owners pass everything). */
export function hasPermission(permission: string): boolean {
  const payload = decodeToken();
  // No/undecodable token: let the request through so the API decides (401 redirect).
  if (!payload) return true;
  if ((payload.roles ?? []).some((r) => OWNER_ROLES.includes(r))) return true;
  return (payload.permissions ?? []).includes(permission);
}

const compiledMap = (permissionMap as Array<{ pattern: string; permission: string }>).map((e) => ({
  regex: new RegExp(e.pattern),
  permission: e.permission,
}));

/**
 * Returns the permission a GET to `path` requires, or null when the route is
 * unmapped/public. Derived from the API's @RequirePermissions decorators —
 * regenerate with `node scripts/generate-permission-map.js`.
 */
export function requiredPermissionFor(path: string): string | null {
  const clean = path.split("?")[0];
  for (const entry of compiledMap) {
    if (entry.regex.test(clean)) return entry.permission;
  }
  return null;
}

/** Error thrown locally instead of issuing a request the JWT cannot pass. */
export class PermissionDeniedError extends Error {
  constructor(permission: string) {
    super(`Missing required permission: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}
