"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAccessToken } from "../lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("hr.admin@skylinx.local");
  const [password, setPassword] = useState("Skylinx@123");
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
        document.cookie = `skylinx_peopleos_plan=${encodeURIComponent(body.data.activePlan)}; path=/; max-age=31536000; SameSite=Lax`;
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
        <input id="login-email" name="email" type="email" autoComplete="username" className="min-h-11 rounded-lg border border-[#dce2eb] px-3 text-ink" value={email} onChange={(event) => setEmail(event.target.value)} />
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
      <button className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Signing In" : "Sign In"}
      </button>

      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="font-semibold text-slate-700">Quick Access Logins:</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail("hr.admin@skylinx.local");
              setPassword("Skylinx@123");
            }}
            className="flex-1 rounded border border-slate-200 bg-white py-1.5 px-2 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium cursor-pointer"
          >
            HR Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("skylinxcode@gmail.com");
              setPassword("password123");
            }}
            className="flex-1 rounded border border-brand/20 bg-brand/5 py-1.5 px-2 text-brand hover:bg-brand/10 font-medium cursor-pointer"
          >
            System Owner
          </button>
        </div>
      </div>
    </form>
  );
}
