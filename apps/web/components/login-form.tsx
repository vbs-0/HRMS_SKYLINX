"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAccessToken } from "../lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok || !body.data?.accessToken) {
        throw new Error(body.message || "Login failed");
      }
      setAccessToken(body.data.accessToken);
      if (body.data.activePlan) {
        document.cookie = `peopleos_plan=${encodeURIComponent(body.data.activePlan)}; path=/; max-age=31536000; SameSite=Lax`;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm text-muted">
        Email
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          className="min-h-11 rounded-lg border border-[#dce2eb] px-3 text-ink"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm text-muted">
        Password
        <input
          id="login-password"
          name="password"
          autoComplete="current-password"
          className="min-h-11 rounded-lg border border-[#dce2eb] px-3 text-ink"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
        />
      </label>
      {error ? <div className="rounded-lg bg-[#fde8e6] p-3 text-sm text-[#ba3d37]">{error}</div> : null}
      <button
        className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Signing In" : "Sign In"}
      </button>
    </form>
  );
}
