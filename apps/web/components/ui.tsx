import * as React from "react";
import { toneForStatus, toneFromLegacy, labelize, type Tone } from "../lib/status-map";

/* ============================================================================
   PeopleOS UI v2 primitive library (sections/02).
   Token-styled, dependency-free (React + Tailwind + lucide only).
   Legacy exports (Card, StatusPill, MetricCard, DataState) keep their original
   signatures so all existing consoles compile — restyled to v2 tokens.
   ============================================================================ */

const TONE_CHIP: Record<Tone, string> = {
  success: "bg-success-bg text-success-fg border-success-border",
  warning: "bg-warning-bg text-warning-fg border-warning-border",
  danger: "bg-danger-bg text-danger-fg border-danger-border",
  info: "bg-info-bg text-info-fg border-info-border",
  brand: "bg-brand-50 text-brand-700 border-brand-300",
  neutral: "bg-sunken text-text-secondary border-line",
};

/* ---- Card ---- */
export function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-card border border-line bg-raised shadow-e1 ${className.includes("p-") ? "" : "p-5"} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, className = "" }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 border-b border-line-subtle px-5 py-3 ${className}`}>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

/* ---- StatusPill (backward-compatible: legacy `tone`, new `status`) ---- */
export function StatusPill({
  children,
  tone,
  status,
}: {
  children?: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "indigo" | "purple" | Tone;
  status?: string;
}) {
  const t: Tone = status ? toneForStatus(status) : tone ? toneFromLegacy(tone) : "neutral";
  const label = children ?? (status ? labelize(status) : "");
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-xs font-semibold ${TONE_CHIP[t]}`}>
      {label}
    </span>
  );
}

export const Badge = StatusPill;

/* ---- Button ---- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
};
const BTN_VARIANT: Record<string, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 border border-transparent",
  secondary: "bg-raised text-text-primary border border-line-strong hover:bg-surface-hover",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-hover border border-transparent",
  danger: "bg-danger-bg text-danger-fg border border-danger-border hover:brightness-95",
  link: "bg-transparent text-brand-700 underline-offset-2 hover:underline border-0 px-0",
};
const BTN_SIZE: Record<string, string> = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-sm" };
export function Button({ variant = "secondary", size = "md", loading, icon, children, className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors ease2 disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---- Form field + inputs ---- */
export function Field({ label, required, help, error, children }: { label: string; required?: boolean; help?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-text-secondary">
        {label} {required ? <span className="text-danger-fg">*</span> : <span className="text-text-muted font-normal">(optional)</span>}
      </span>
      {children}
      {error ? <span className="text-xs text-danger-fg">{error}</span> : help ? <span className="text-xs text-text-muted">{help}</span> : null}
    </label>
  );
}
const FIELD_CLS = "h-10 w-full rounded-control border border-line-strong bg-raised px-3 text-sm text-text-primary placeholder:text-text-muted";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...p }, ref) {
  return <input ref={ref} className={`${FIELD_CLS} ${className}`} {...p} />;
});
export function Textarea({ className = "", ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-[80px] w-full rounded-control border border-line-strong bg-raised px-3 py-2 text-sm text-text-primary ${className}`} {...p} />;
}
export function Select({ className = "", children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_CLS} ${className}`} {...p}>{children}</select>;
}

/* ---- MetricCard / KpiCard ---- */
export function MetricCard({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular text-text-primary">{value}</div>
      {note ? <div className="mt-1 text-xs text-text-muted">{note}</div> : null}
    </Card>
  );
}
export function KpiCard({ label, value, deltaText, deltaTone = "neutral" }: { label: string; value: React.ReactNode; deltaText?: string; deltaTone?: Tone }) {
  const tone = { success: "text-success-fg", danger: "text-danger-fg", warning: "text-warning-fg", info: "text-info-fg", brand: "text-brand-700", neutral: "text-text-muted" }[deltaTone];
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-2 text-[28px] font-semibold leading-none tabular text-text-primary">{value}</div>
      {deltaText ? <div className={`mt-1.5 text-xs ${tone}`}>{deltaText}</div> : null}
    </Card>
  );
}

/* ---- States ---- */
export function DataState({ message, tone = "loading" }: { message: string; tone?: "loading" | "empty" | "error" }) {
  const cls = {
    loading: "border-line bg-sunken text-text-muted",
    empty: "border-line bg-raised text-text-muted",
    error: "border-danger-border bg-danger-bg text-danger-fg",
  }[tone];
  return <div className={`rounded-card border p-4 text-sm ${cls}`}>{message}</div>;
}
export function EmptyState({ icon, title, message, action }: { icon?: React.ReactNode; title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-raised px-6 py-12 text-center">
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {message ? <p className="max-w-sm text-sm text-text-muted">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-sunken ${className}`} />;
}
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return <div className="grid gap-2">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}

/* ---- Avatar ---- */
const AV_TONES = ["bg-brand-50 text-brand-700", "bg-info-bg text-info-fg", "bg-success-bg text-success-fg", "bg-warning-bg text-warning-fg"];
export function Avatar({ name = "", size = 32 }: { name?: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const tone = AV_TONES[(name.charCodeAt(0) || 0) % AV_TONES.length];
  return (
    <span className={`inline-grid place-items-center rounded-full font-semibold ${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

/* ---- Tabs (controlled, accessible) ---- */
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: React.ReactNode }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-card border border-line bg-sunken p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-control px-3 py-1.5 text-sm transition-colors ease2 ${value === t.id ? "bg-raised font-semibold text-text-primary shadow-e1" : "text-text-secondary hover:text-text-primary"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
