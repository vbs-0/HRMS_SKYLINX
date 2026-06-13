import { metrics as fallbackMetrics } from "./modules";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000/api/v1";

interface ApiResponse<T> {
  data?: T;
}

export interface DashboardMetricsDto {
  employeeCount: number;
  presentToday: number;
  pendingLeaves: number;
  payrollNetPay: number;
  pendingCompliance: number;
  pendingApprovals: number;
}

interface PublicProfileDto {
  company?: {
    name?: string | null;
    legalName?: string | null;
    logoUrl?: string | null;
  } | null;
  branding?: Record<string, unknown>;
}

export interface CompanyProfile {
  name: string;
  legalName: string;
  logoUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  xUrl: string;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatInrShort(value: number) {
  if (value >= 100000) return `INR ${(value / 100000).toFixed(2)}L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const fallback = {
    name: "PeopleOS",
    legalName: "Acme Corp",
    logoUrl: "/skylinx-logo-display.png",
    linkedinUrl: "",
    facebookUrl: "",
    xUrl: "",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/settings/public-profile`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) throw new Error("Company profile request failed");
    const body = (await response.json()) as ApiResponse<PublicProfileDto>;
    const branding = body.data?.branding || {};
    const company = body.data?.company;
    return {
      name: asString(branding.clientDisplayName) || company?.name || fallback.name,
      legalName: company?.legalName || company?.name || fallback.legalName,
      logoUrl: asString(branding.logoDataUrl) || company?.logoUrl || fallback.logoUrl,
      linkedinUrl: asString(branding.linkedinUrl),
      facebookUrl: asString(branding.facebookUrl),
      xUrl: asString(branding.xUrl),
    };
  } catch {
    return fallback;
  }
}

export async function getDashboardMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/admin`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) throw new Error("Dashboard request failed");
    const body = (await response.json()) as ApiResponse<DashboardMetricsDto>;
    if (!body.data) throw new Error("Dashboard response missing data");
    return [
      { label: "Employees", value: String(body.data.employeeCount), note: "Active workforce" },
      { label: "Present Today", value: String(body.data.presentToday), note: "Attendance live" },
      { label: "Pending Leaves", value: String(body.data.pendingLeaves), note: "Manager approval" },
      { label: "Payroll Net", value: formatInrShort(body.data.payrollNetPay), note: "Current run" },
      { label: "Compliance", value: String(body.data.pendingCompliance), note: "Due filings" },
      { label: "Approvals", value: String(body.data.pendingApprovals), note: "Across workflows" },
    ];
  } catch {
    return fallbackMetrics;
  }
}
