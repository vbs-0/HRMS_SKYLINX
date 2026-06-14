"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAccessToken, getAccessToken } from "../lib/session";

export function AuthActions() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
  }, []);

  return (
    <button
      className="min-h-10 rounded-lg border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-semibold text-ink"
      type="button"
      onClick={() => {
        if (hasToken) {
          clearAccessToken();
          setHasToken(false);
          router.push("/login");
        } else {
          router.push("/login");
        }
      }}
    >
      {hasToken ? "Logout" : "Login"}
    </button>
  );
}
