import Link from "next/link";
import { AppShell, nav } from "../../components/app-shell";
import { LiveMetrics } from "../../components/live-metrics";
import { DashboardWidgets } from "../../components/dashboard-widgets";
import { Card, StatusPill } from "../../components/ui";
import { getCompanyProfile, getDashboardMetrics } from "../../lib/api";
import { hasPlanAccess, moduleKeyFromHref, requiredPlanForModule } from "../../lib/plan-access";
import { getActivePlan } from "../../lib/plan-server";

export default async function DashboardPage() {
  const [metrics, companyProfile] = await Promise.all([getDashboardMetrics(), getCompanyProfile()]);
  const activePlan = await getActivePlan();
  const hiddenFromQuickGrid = ["/dashboard", "/saas"] as string[];
  const availableModules = nav.filter(
    (item) => !hiddenFromQuickGrid.includes(item.href) && hasPlanAccess(requiredPlanForModule(moduleKeyFromHref(item.href)), activePlan),
  );
  const lockedModules = nav.filter(
    (item) => !hiddenFromQuickGrid.includes(item.href) && !hasPlanAccess(requiredPlanForModule(moduleKeyFromHref(item.href)), activePlan),
  );

  return (
    <AppShell title="SKYLINX PeopleOS" subtitle="Company workspace, employee operations and HR workflows.">
      <LiveMetrics initial={metrics} />

      <section className="mt-6 grid grid-cols-[280px_1fr_300px] gap-6 max-2xl:grid-cols-[260px_1fr] max-xl:grid-cols-1">
        {/* Left column */}
        <div className="grid content-start gap-5">
          <Card className="text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-brand bg-[#dff7ff] text-4xl font-bold text-brand select-none">
              {companyProfile.name ? companyProfile.name.slice(0, 2).toUpperCase() : "SL"}
            </div>
            <h2 className="mt-4 text-xl font-semibold">{companyProfile.name}</h2>
            <div className="mt-3 flex justify-center gap-2">
              {[
                { label: "in", href: companyProfile.linkedinUrl },
                { label: "f", href: companyProfile.facebookUrl },
                { label: "x", href: companyProfile.xUrl },
              ].map((item) =>
                item.href ? (
                  <a className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white" href={item.href} key={item.label} rel="noreferrer" target="_blank">{item.label}</a>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#aab8ca] text-xs font-bold text-white" key={item.label}>{item.label}</span>
                ),
              )}
            </div>
          </Card>

          <div className="overflow-hidden rounded-lg bg-[#8424e8] p-5 text-white shadow-sm">
            <div className="font-bold">Tasks and Notifications</div>
            <div className="mt-5 text-sm font-semibold">Leave approvals, payroll review and attendance regularization are ready for HR action.</div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#38a7f4] bg-white shadow-sm">
            <div className="bg-[#38a7f4] p-2 text-center font-bold text-white">SKYLINX HR Desk</div>
            <div className="grid gap-1 p-4 text-xs">
              <div><strong>Company</strong> {companyProfile.legalName}</div>
              <div><strong>HR Owner</strong> SKYLINX HR</div>
              <div><strong>Support</strong> support@example.com</div>
              <div><strong>Queries</strong> 555-0199</div>
            </div>
          </div>
        </div>

        {/* Center column — modules grid */}
        <Card className="min-h-[520px]">
          <div className="mb-5 rounded-lg bg-[#0f6676] p-6 text-white">
            <StatusPill>Payroll Ready</StatusPill>
            <div className="mt-3 text-2xl font-bold">June payroll workspace is ready for review</div>
            <p className="mt-1 text-sm text-white/80">Check attendance inputs, leave deductions, statutory compliance and payslip generation before locking the run.</p>
            <Link className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#ff7a1a] px-5 text-sm font-bold text-white" href="/payroll">Open Payroll</Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#172033]">Available Modules</h2>
              <p className="text-sm text-muted">{activePlan} plan access is active for this workspace.</p>
            </div>
            <Link className="rounded-lg border border-[#dce2eb] px-4 py-2 text-sm font-semibold text-[#172033]" href="/saas">Manage Plan</Link>
          </div>

          <div className="grid grid-cols-5 gap-x-8 gap-y-7 max-2xl:grid-cols-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {availableModules.map(({ href, label, icon: Icon }) => (
              <Link className="grid justify-items-center gap-3 text-center text-sm font-semibold text-[#172033]" href={href} key={href}>
                <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#f8fafc] shadow-sm">
                  <Icon className="h-10 w-10 text-brand" />
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-[#dce2eb] bg-[#f8fafc] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#172033]">Locked Pro Modules</h2>
                <p className="text-sm text-muted">Upgrade to Pro to unlock these advanced controls.</p>
              </div>
              <StatusPill tone="red">Requires Pro</StatusPill>
            </div>
            <div className="grid grid-cols-5 gap-3 max-2xl:grid-cols-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {lockedModules.map(({ href, label, icon: Icon }) => (
                <Link className="grid justify-items-center gap-2 rounded-lg border border-[#dce2eb] bg-white p-3 text-center text-xs font-semibold text-[#8ca0bf]" href="/saas" key={href}>
                  <Icon className="h-7 w-7 text-[#aab8ca]" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Right column — live dynamic widgets */}
        <div className="grid content-start gap-5 max-2xl:col-span-2 max-xl:col-span-1">
          <DashboardWidgets />

          <div className="rounded-lg bg-[#6254d9] p-5 text-white shadow-sm">
            <h2 className="font-bold">Support Desk</h2>
            <p className="mt-4 text-sm">For HRMS queries contact support@example.com or call +1-800-555-0199.</p>
            <Link className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-[#ed174f] px-4 text-sm font-bold text-white" href="/support">Open Support</Link>
          </div>

          <div className="rounded-lg bg-[#273963] p-6 text-white shadow-sm">
            <div className="text-center text-lg font-bold">WHAT&apos;S NEW</div>
            <div className="mt-3 text-center"><StatusPill tone="red">Policy Center</StatusPill></div>
            <p className="mt-4 text-center text-sm text-white/80">Company Policies, acknowledgment tracking, and custom employee fields are now live.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
