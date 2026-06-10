export type PlanName = "Basic" | "Standard" | "Pro";

export const defaultActivePlan: PlanName = "Standard";

const planRank: Record<PlanName, number> = {
  Basic: 1,
  Standard: 2,
  Pro: 3,
};

export const modulePlanAccess: Record<string, PlanName> = {
  dashboard: "Basic",
  setup: "Basic",
  employees: "Basic",
  documents: "Basic",
  attendance: "Basic",
  leave: "Basic",
  holidays: "Basic",
  reports: "Basic",
  settings: "Basic",
  support: "Basic",
  cards: "Standard",
  organization: "Standard",
  payroll: "Standard",
  expenses: "Standard",
  insurance: "Standard",
  notifications: "Standard",
  social: "Standard",
  approvals: "Standard",
  assets: "Standard",
  performance: "Standard",
  compliance: "Pro",
  security: "Pro",
  rewards: "Pro",
  analytics: "Pro",
  saas: "Pro",
};

export function moduleKeyFromHref(href: string) {
  return href.replace("/", "") || "dashboard";
}

export function requiredPlanForModule(module: string): PlanName {
  return modulePlanAccess[module] || "Pro";
}

export function isPlanName(value: string): value is PlanName {
  return value === "Basic" || value === "Standard" || value === "Pro";
}

export function hasPlanAccess(requiredPlan: PlanName, currentPlan: PlanName = defaultActivePlan) {
  return planRank[currentPlan] >= planRank[requiredPlan];
}

export function planTone(plan: PlanName) {
  if (plan === "Basic") return "green";
  if (plan === "Standard") return "yellow";
  return "red";
}
