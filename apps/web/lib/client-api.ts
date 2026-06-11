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
    let errorMessage = text || `Request failed with ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.message === "string") {
          errorMessage = parsed.message;
        } else if (Array.isArray(parsed.message)) {
          errorMessage = parsed.message.join(", ");
        } else if (parsed.error) {
          errorMessage = parsed.error;
        }
      }
    } catch {
      // fall back to raw text
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as ApiResponse<T>;
}
