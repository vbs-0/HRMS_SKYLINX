"use client";

export const ACCESS_TOKEN_KEY = "skylinx_peopleos_access_token";

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
  if (!token) return "company_skylinx";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.tenantId || "company_skylinx";
  } catch {
    return "company_skylinx";
  }
}
