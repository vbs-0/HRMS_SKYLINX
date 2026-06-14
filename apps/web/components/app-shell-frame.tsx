"use client";

import { Bell, LockKeyhole, Menu, Moon, Plus, Search, Sun, X, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { AuthActions } from "./auth-actions";
import { groupedNav, nav } from "./nav-items";
import { hasPlanAccess, moduleKeyFromHref, requiredPlanForModule } from "../lib/plan-access";
import type { PlanName } from "../lib/plan-access";
import { useTheme } from "../lib/theme";

const ALWAYS_VISIBLE = new Set([
  "/dashboard", "/social", "/policies", "/surveys", "/support", "/grievance",
  "/documents", "/cards", "/holidays", "/setup", "/leave", "/attendance",
]);
const MODULE_ALIAS: Record<string, string> = { security: "settings", "saas-admin": "saas", reminders: "notifications" };
const LEGACY_BRAND = "#078ced"; // seed default — do NOT override the v2 identity with it (sections/02 §7)

export function AppShellFrame({
  children, title, subtitle, activePlan,
}: { children: React.ReactNode; title: string; subtitle: string; activePlan: PlanName }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const pathname = usePathname() || "";
  const { pref, cycleTheme } = useTheme();

  const [isOwner, setIsOwner] = React.useState(false);
  const [perms, setPerms] = React.useState<string[] | null>(null);
  const [brand, setBrand] = React.useState<{ platformBrand: string; logo: string; company: string }>({
    platformBrand: "PeopleOS", logo: "/skylinx-logo-display.png", company: "My Company",
  });

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("peopleos_access_token") : null;
    if (token) {
      try {
        const p = JSON.parse(atob(token.split(".")[1]));
        if (p?.isSuperAdmin === true || (p?.roles || []).includes("super_admin") || (p?.roles || []).includes("SUPER_ADMIN") || (p?.permissions || []).includes("saas.admin")) setIsOwner(true);
        if (Array.isArray(p?.permissions)) setPerms(p.permissions);
      } catch { /* ignore */ }
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";
    if (token) {
      fetch(`${base}/settings/rules`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((b) => {
          const br = b?.data?.branding, c = b?.data?.company;
          setBrand((s) => ({
            platformBrand: br?.platformBrand || s.platformBrand,
            logo: br?.logoDataUrl || c?.logoUrl || s.logo,
            company: c?.name || br?.clientDisplayName || s.company,
          }));
          // white-label: apply tenant colour only if it isn't the legacy seed blue (keep v2 indigo otherwise)
          const col = String(br?.primaryColor || "").toLowerCase();
          if (col && col !== LEGACY_BRAND) document.documentElement.style.setProperty("--color-brand-600", col);
        })
        .catch(() => undefined);
    }
  }, []);

  const canSee = React.useCallback((href: string) => {
    if (href === "/saas-admin") return isOwner;
    if (isOwner || perms === null) return true;
    if (ALWAYS_VISIBLE.has(href)) return true;
    const m = moduleKeyFromHref(href);
    const key = MODULE_ALIAS[m] || m;
    return perms.some((p) => p.startsWith(`${key}.`));
  }, [isOwner, perms]);

  const crumbItem = nav.find((n) => n.href === ("/" + pathname.split("/")[1]));
  const groups = groupedNav();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    window.location.href = term ? `/employees?q=${encodeURIComponent(term)}` : "/employees";
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary lg:grid lg:grid-cols-[260px_1fr]">
      {/* scrim (mobile) */}
      {open ? <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] overflow-y-auto border-r border-line bg-raised transition-transform duration-200 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-8 w-8 place-items-center rounded-control bg-brand-600 text-sm font-bold text-white">{brand.platformBrand[0]}</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{brand.platformBrand}</span>
              <span className="block text-[11px] text-text-muted">{brand.company}</span>
            </span>
          </Link>
          <button aria-label="Close menu" className="ml-auto grid h-8 w-8 place-items-center rounded-control hover:bg-surface-hover lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5 text-text-muted" /></button>
        </div>
        <nav className="px-3 py-3">
          {groups.map(({ group, items }) => {
            const visible = items.filter((it) => canSee(it.href));
            if (visible.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                <div className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">{group}</div>
                {visible.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  const allowed = hasPlanAccess(requiredPlanForModule(moduleKeyFromHref(href)), activePlan) || href === "/saas";
                  return (
                    <Link
                      key={href} href={href} onClick={() => setOpen(false)}
                      title={allowed ? label : `${label} — upgrade required`}
                      className={`relative flex min-h-9 items-center gap-2.5 rounded-control px-2.5 text-[13.5px] transition-colors ease2 ${active ? "bg-selected font-semibold text-brand-700" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"}`}
                    >
                      {active ? <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded bg-brand-600" /> : null}
                      <Icon className={`h-[17px] w-[17px] ${allowed ? "" : "opacity-50"}`} strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {!allowed ? <LockKeyhole className="h-3.5 w-3.5 text-text-muted" /> : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-5 backdrop-blur">
          <button aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-control hover:bg-surface-hover lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <nav aria-label="Breadcrumb" className="hidden text-sm text-text-muted sm:block">
            {brand.company} <span className="px-1">/</span> <span className="font-semibold text-text-primary">{crumbItem?.label || title}</span>
          </nav>
          <form onSubmit={submitSearch} className="ml-auto hidden items-center gap-2 rounded-control border border-line-strong bg-raised px-3 md:flex">
            <Search className="h-4 w-4 text-text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, pages…" aria-label="Search" className="h-9 w-44 bg-transparent text-sm outline-none placeholder:text-text-muted" />
          </form>
          <Link href={"/employees" as any} className="grid h-9 w-9 place-items-center rounded-control text-text-secondary hover:bg-surface-hover" title="Quick add"><Plus className="h-[18px] w-[18px]" /></Link>
          <button onClick={cycleTheme} className="grid h-9 w-9 place-items-center rounded-control text-text-secondary hover:bg-surface-hover" title={`Theme: ${pref}`} aria-label="Toggle theme">
            {pref === "dark" ? <Moon className="h-[18px] w-[18px]" /> : pref === "light" ? <Sun className="h-[18px] w-[18px]" /> : <MonitorSmartphone className="h-[18px] w-[18px]" />}
          </button>
          <Link href={"/notifications" as any} className="relative grid h-9 w-9 place-items-center rounded-control text-text-secondary hover:bg-surface-hover" title="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-600" />
          </Link>
          <span className="hidden rounded-pill border border-line bg-sunken px-2.5 py-1 text-[11px] font-semibold uppercase text-text-secondary sm:inline">{activePlan}</span>
          <AuthActions />
        </header>

        <main className="px-6 py-6 max-lg:px-4">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
