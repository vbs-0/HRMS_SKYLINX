import {
  fallbackAnalytics,
  fallbackApprovals,
  fallbackAssets,
  fallbackCompliance,
  fallbackIntegrations,
  fallbackPerformance,
  fallbackSaas,
} from "./fallback-data";

export const emptyAnalytics: typeof fallbackAnalytics = {
  ...fallbackAnalytics,
  metrics: {
    headcount: 0,
    attendanceRate: 0,
    leaveApprovalRate: 0,
    monthlyPayroll: 0,
    payrollNet: 0,
    pendingExpenses: 0,
    openJobs: 0,
    candidates: 0,
    annualCtc: 0,
  },
  insights: [],
  departmentBreakdown: [],
  locationBreakdown: [],
  trend: [],
  risks: [],
};

export const emptyApprovals: typeof fallbackApprovals = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  modules: [],
  items: [],
};

export const emptyAssets: typeof fallbackAssets = {
  total: 0,
  assigned: 0,
  available: 0,
  returned: 0,
  handoverPending: 0,
  categories: [],
  rows: [],
  logs: [],
};

export const emptyCompliance: typeof fallbackCompliance = {
  activeEmployees: 0,
  configuredEmployees: 0,
  payrollRuns: 0,
  totals: { pf: 0, esi: 0, professionalTax: 0, tds: 0 },
  checks: [],
  rows: [],
};

export const emptyIntegrations: typeof fallbackIntegrations = {
  connected: 0,
  configured: 0,
  total: 0,
  integrations: [],
  logs: [],
};



export const emptyPerformance: typeof fallbackPerformance = {
  employees: 0,
  averageScore: 0,
  reviewReady: 0,
  recognitions: 0,
  cycles: 0,
  categories: [],
  rows: [],
  logs: [],
};

export const emptySaas: typeof fallbackSaas = {
  tenants: 0,
  activeTenants: 0,
  activePlan: "-",
  employeeLimit: 0,
  activeEmployees: 0,
  usagePercent: 0,
  enabledModules: 0,
  monthlyPrice: 0,
  plans: [],
  planMatrix: [],
  planAddOns: [],
  billingSummary: fallbackSaas.billingSummary,
  companies: [],
  entitlements: [],
  billingEvents: [],
};
