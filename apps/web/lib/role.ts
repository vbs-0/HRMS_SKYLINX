"use client";

import { useEffect, useState } from "react";

export type UserRole = "hr" | "admin";

export const ROLE_CHANGE_EVENT = "peopleos:role-change";

export function getActiveRole(): UserRole {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("peopleos_role");
    return stored === "admin" ? "admin" : "hr";
  }
  return "hr";
}

export function setActiveRole(role: UserRole) {
  if (typeof window !== "undefined") {
    localStorage.setItem("peopleos_role", role);
    window.dispatchEvent(new CustomEvent(ROLE_CHANGE_EVENT, { detail: { role } }));
  }
}

export function useActiveRole() {
  const [role, setRoleState] = useState<UserRole>("hr");

  useEffect(() => {
    setRoleState(getActiveRole());

    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ role: UserRole }>;
      if (custom.detail?.role) {
        setRoleState(custom.detail.role);
      } else {
        setRoleState(getActiveRole());
      }
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(ROLE_CHANGE_EVENT, handler);
  }, []);

  const changeRole = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  return { role, toggleRole: changeRole };
}
