import { cookies } from "next/headers";
import { defaultActivePlan, isPlanName, type PlanName } from "./plan-access";

const PLAN_COOKIE = "peopleos_plan";

export async function getActivePlan(): Promise<PlanName> {
  const store = await cookies();
  const value = store.get(PLAN_COOKIE)?.value;
  return value && isPlanName(value) ? value : defaultActivePlan;
}

export { PLAN_COOKIE };
