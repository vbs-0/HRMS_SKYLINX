"use client";

import { getAccessToken } from "./session";
import { clearAccessToken } from "./session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

async function request<T>(path: string, options: RequestInit, token: string | null) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  } as Record<string, string>;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  return response;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const response = await request<T>(path, options, token);
  if (response.status === 401) {
    clearAccessToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as ApiResponse<T>;
}
