import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { hasPlanAccess, type PlanName } from "../lib/plan-access";
import { getActivePlan } from "../lib/plan-server";
import { Card, StatusPill } from "./ui";

export async function PlanGate({ children, moduleName, requiredPlan }: { children: React.ReactNode; moduleName: string; requiredPlan: PlanName }) {
  const activePlan = await getActivePlan();

  if (hasPlanAccess(requiredPlan, activePlan)) {
    return <>{children}</>;
  }

  return (
    <Card className="mx-auto max-w-3xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fde8e6] text-[#ba3d37]">
        <LockKeyhole className="h-7 w-7" />
      </div>
      <div className="mt-5 flex justify-center gap-2">
        <StatusPill tone="yellow">{activePlan} Active</StatusPill>
        <StatusPill tone="red">{requiredPlan} Required</StatusPill>
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-[#172033]">{moduleName} is locked</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
        This module is part of the {requiredPlan} plan. Upgrade your PeopleOS subscription to unlock the full workflow.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link className="inline-flex min-h-10 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white" href="/saas">
          View Plans
        </Link>
        <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#dce2eb] bg-white px-5 text-sm font-semibold text-[#172033]" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </Card>
  );
}
