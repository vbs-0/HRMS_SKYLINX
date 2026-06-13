"use client";

export const ACCESS_TOKEN_KEY = "peopleos_access_token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getCurrentCompanyId(): string {
  const token = getAccessToken();
  if (!token) {
    console.warn("[session] No access token — tenantId unavailable");
    return "";
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // No hardcoded tenant fallback: a missing tenantId must surface as a failed
    // request (the API derives the real tenant from the JWT), never silently
    // resolve to some other company's id.
    return payload.tenantId || "";
  } catch {
    return "";
  }
}

/** Decode the JWT and return the current logged-in user's info */
export function getCurrentUser(): {
  email: string;
  sub: string;
  employeeId: string | null;
  permissions: string[];
  roles: string[];
  tenantId: string;
} | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload.email || "",
      sub: payload.sub || "",
      employeeId: payload.employeeId || null,
      permissions: payload.permissions || [],
      roles: payload.roles || [],
      tenantId: payload.tenantId || "",
    };
  } catch {
    return null;
  }
}

/** Returns true if the current user has any of the given roles */
export function hasRole(...roles: string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

/** Returns true if the current user has the given permission */
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.permissions.includes(permission);
}
