"use client";

import { Bell, LockKeyhole, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AuthActions } from "./auth-actions";
import { nav } from "./nav-items";
import { usePathname } from "next/navigation";
import { hasPlanAccess, moduleKeyFromHref, requiredPlanForModule } from "../lib/plan-access";
import type { PlanName } from "../lib/plan-access";
import { useActiveRole } from "../lib/role";

interface PublicProfile {
  company?: { name?: string; logoUrl?: string } | null;
  branding?: {
    platformBrand?: string;
    clientDisplayName?: string;
    primaryColor?: string;
    logoDataUrl?: string;
    showPoweredBy?: boolean;
  };
}

export function AppShellFrame({
  children,
  title,
  subtitle,
  activePlan,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  activePlan: PlanName;
}) {
  const [open, setOpen] = React.useState(false);
  const [globalSearch, setGlobalSearch] = React.useState("");
  const { role, toggleRole } = useActiveRole();
  const pathname = usePathname() || "";
  const firstSegment = pathname.split("/")[1] || "";
  const isRoleSwitchVisible = ["leave", "attendance", "payroll", "performance"].includes(firstSegment);

  const [isOwner, setIsOwner] = React.useState(false);
  const [branding, setBranding] = React.useState<PublicProfile["branding"]>({
    platformBrand: "PeopleOS",
    clientDisplayName: "My Company",
    primaryColor: "#078ced",
    showPoweredBy: false,
  });
  const [companyName, setCompanyName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("/skylinx-logo-display.png");

  React.useEffect(() => {
    // Decode owner flag from JWT
    const token = typeof window !== "undefined" ? window.localStorage.getItem("skylinx_peopleos_access_token") : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload && payload.email === "skylinxcode@gmail.com") {
          setIsOwner(true);
        }
      } catch (e) {
        // ignore
      }
    }

    // Fetch dynamic branding from authenticated endpoint
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";
    const authToken = typeof window !== "undefined" ? window.localStorage.getItem("skylinx_peopleos_access_token") : null;
    if (authToken) {
      fetch(`${apiBase}/settings/rules`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
        .then((res) => res.json())
        .then((body) => {
          const b = body?.data?.branding;
          if (b) {
            setBranding(b);
            // Apply brand color as CSS variable
            const color = String(b.primaryColor || "#078ced");
            document.documentElement.style.setProperty("--color-brand", color);
          }
          const c = body?.data?.company;
          if (c?.name) setCompanyName(c.name);
          if (c?.logoUrl) setLogoUrl(c.logoUrl);
        })
        .catch(() => undefined);
    }
  }, []);

  const displayBrand = branding?.platformBrand || "PeopleOS";
  const displayLogo = branding?.logoDataUrl || logoUrl;
  const displayName = companyName || branding?.clientDisplayName || "My Company";

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      {open ? <button aria-label="Close menu overlay" className="fixed inset-0 z-30 bg-[#172033]/35" onClick={() => setOpen(false)} type="button" /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[255px] border-r border-[#dce2eb] bg-white text-[#172033] shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-[68px] items-center justify-between border-b border-[#dce2eb] px-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <img
              src={displayLogo}
              alt={displayBrand}
              className="h-10 max-w-[130px] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/skylinx-logo-display.png"; }}
            />
          </Link>
          <button aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#eef5ff]" onClick={() => setOpen(false)} type="button">
            <X className="h-5 w-5 text-[#49637f]" />
          </button>
        </div>
        <nav className="grid max-h-[calc(100vh-68px)] gap-1 overflow-auto p-3">
          {nav
            .filter(({ href }) => {
              if (href === "/saas-admin") return isOwner;
              return true;
            })
            .map(({ href, label, icon: Icon }) => {
            const requiredPlan = requiredPlanForModule(moduleKeyFromHref(href));
            const allowed = hasPlanAccess(requiredPlan, activePlan);
            return (
              <Link
                className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-[#eef5ff] hover:text-brand ${allowed || href === "/saas" ? "text-[#34465f]" : "text-[#8ca0bf]"}`}
                href={href}
                key={href}
                onClick={() => setOpen(false)}
                title={allowed ? `${label} included in ${activePlan}` : `${label} requires ${requiredPlan} plan`}
              >
                <Icon className={`h-4 w-4 ${allowed || href === "/saas" ? "text-[#38a7f4]" : "text-[#aab8ca]"}`} />
                <span className="min-w-0 flex-1">{label}</span>
                {!allowed && href !== "/saas" ? <LockKeyhole className="h-3.5 w-3.5 text-[#ba3d37]" /> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0">
        <header className="flex min-h-[68px] items-center gap-5 bg-[#1f2a44] px-8 text-white max-lg:px-5">
          <button aria-label="Open menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20" onClick={() => setOpen(true)} type="button">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="flex shrink-0 items-center">
            <img
              src={displayLogo}
              alt={displayBrand}
              className="h-10 max-w-[130px] object-contain brightness-0 invert"
              onError={(e) => { (e.target as HTMLImageElement).src = "/skylinx-logo-display.png"; }}
            />
          </Link>
          <div className="text-xl font-semibold max-xl:hidden">Hi, {displayName}!</div>
          <form
            className="flex max-w-[520px] flex-1 items-center rounded-lg border border-white/35 bg-white/5"
            onSubmit={(event) => {
              event.preventDefault();
              const term = globalSearch.trim();
              window.location.href = term ? `/employees?q=${encodeURIComponent(term)}` : "/employees";
            }}
          >
            <input
              id="global-employee-search"
              name="q"
              className="min-h-11 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/55 outline-none"
              placeholder="Search Employees"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
            <button aria-label="Search employees" className="flex h-11 w-12 items-center justify-center rounded-r-lg bg-white text-[#1f2a44]" type="submit">
              <Search className="h-5 w-5" />
            </button>
          </form>
          <div className="ml-auto flex items-center gap-4">
            {/* HR / Admin switch */}
            {isRoleSwitchVisible && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/15 text-xs font-semibold select-none max-sm:hidden">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition ${role === "hr" ? "bg-brand text-white shadow-sm" : "text-white/60 hover:text-white"}`}
                  onClick={() => toggleRole("hr")}
                >
                  HR View
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition ${role === "admin" ? "bg-brand text-white shadow-sm" : "text-white/60 hover:text-white"}`}
                  onClick={() => toggleRole("admin")}
                >
                  Admin View
                </button>
              </div>
            )}

            <Link className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white" href="/saas">
              {activePlan} Plan
            </Link>
            <div className="text-xs font-bold uppercase max-xl:hidden">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
            <Bell className="h-5 w-5" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dff7ff] text-sm font-bold text-brand">
              {displayName.substring(0, 2).toUpperCase()}
            </div>
            <AuthActions />
          </div>
        </header>

        <div className="p-8 max-lg:p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="m-0 text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
