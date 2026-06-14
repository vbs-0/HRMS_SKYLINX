"use client";

import * as React from "react";
import { Users, Inbox } from "lucide-react";
import {
  Card, CardHeader, Button, StatusPill, Badge, Field, Input, Textarea, Select,
  MetricCard, KpiCard, DataState, EmptyState, Skeleton, SkeletonRows, Avatar, Tabs,
} from "./ui";
import { DataTable, type Column } from "./data-table";

type Person = { id: string; name: string; code: string; dept: string; status: string };
const PEOPLE: Person[] = [
  { id: "1", name: "Asha Rao", code: "EMP-0142", dept: "Engineering", status: "ACTIVE" },
  { id: "2", name: "Kabir Sethi", code: "EMP-0096", dept: "Support", status: "PROBATION" },
  { id: "3", name: "Meera Nair", code: "EMP-0203", dept: "Sales", status: "NOTICE_PERIOD" },
  { id: "4", name: "Rahul Verma", code: "EMP-0011", dept: "Finance", status: "EXITED" },
];
const PEOPLE_COLS: Column<Person>[] = [
  { id: "name", header: "Name", sortBy: (r) => r.name, cell: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={26} />{r.name}</span> },
  { id: "code", header: "Emp code", sortBy: (r) => r.code, cell: (r) => <span className="font-mono text-[12.5px] text-text-secondary">{r.code}</span> },
  { id: "dept", header: "Department", sortBy: (r) => r.dept, cell: (r) => r.dept },
  { id: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-0">
      <CardHeader title={title} />
      <div className="flex flex-wrap items-end gap-3 p-5">{children}</div>
    </Card>
  );
}

export function StyleGallery() {
  const [tab, setTab] = React.useState("design");
  return (
    <div className="grid gap-5">
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "design", label: "Primitives" }, { id: "data", label: "Data & states" }]} />

      {tab === "design" ? (
        <>
          <Section title="Buttons">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" icon={<Users className="h-4 w-4" />}>With icon</Button>
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary" size="lg">Large</Button>
          </Section>

          <Section title="Status pills (semantic map + legacy tones)">
            <StatusPill status="APPROVED" />
            <StatusPill status="PENDING" />
            <StatusPill status="REJECTED" />
            <StatusPill status="IN_REVIEW" />
            <StatusPill status="ARCHIVED" />
            <StatusPill status="PROBATION" />
            <Badge tone="green">legacy green</Badge>
            <Badge tone="indigo">legacy indigo</Badge>
          </Section>

          <Section title="Avatars">
            <Avatar name="Asha Rao" size={24} />
            <Avatar name="Kabir Sethi" size={32} />
            <Avatar name="Meera Nair" size={40} />
            <Avatar name="Rahul Verma" size={64} />
          </Section>

          <Section title="Form controls">
            <div className="grid w-full gap-3 sm:grid-cols-3">
              <Field label="Employee name" required help="As on records"><Input placeholder="Asha Rao" /></Field>
              <Field label="Leave type"><Select><option>Casual</option><option>Sick</option><option>Earned</option></Select></Field>
              <Field label="PAN" error="Invalid PAN format"><Input defaultValue="ABCD" /></Field>
              <div className="sm:col-span-3"><Field label="Reason" help="Max 500 chars"><Textarea placeholder="Reason for leave…" /></Field></div>
            </div>
          </Section>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Headcount" value="218" note="+6 vs May" />
            <KpiCard label="Present today" value="91.7%" deltaText="187 in · 9 leave" deltaTone="neutral" />
            <KpiCard label="Attrition" value="8.4%" deltaText="▼ 1.1 pt vs FY25" deltaTone="success" />
            <KpiCard label="Net payout" value="₹1.53 Cr" deltaText="▲ 2.1% vs May" deltaTone="success" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-0"><CardHeader title="Loading" /><div className="p-5"><SkeletonRows rows={4} /></div></Card>
            <Card className="p-0"><CardHeader title="Empty" /><div className="p-5"><EmptyState icon={<Inbox className="h-8 w-8" />} title="Inbox zero" message="Nothing waiting on you." action={<Button variant="primary" size="sm">Refresh</Button>} /></div></Card>
            <Card className="p-0"><CardHeader title="States" /><div className="grid gap-2 p-5">
              <DataState tone="loading" message="Loading payslips…" />
              <DataState tone="empty" message="No records yet." />
              <DataState tone="error" message="Couldn't load — retry (ref a1b2)." />
              <Skeleton className="h-8 w-2/3" />
            </div></Card>
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-semibold text-text-primary">DataTable (sort · search · select · paginate · states)</h3>
            <DataTable<Person>
              columns={PEOPLE_COLS}
              rows={PEOPLE}
              rowKey={(r) => r.id}
              search={(r, q) => `${r.name} ${r.code} ${r.dept}`.toLowerCase().includes(q)}
              selectable
              onRowClick={() => undefined}
              rowActions={() => <Button variant="ghost" size="sm">Open</Button>}
              bulkBar={(keys) => <Button variant="secondary" size="sm">Export {keys.length}</Button>}
              emptyTitle="No people yet"
              emptyMessage="Add your first teammate."
            />
          </div>
        </>
      )}
    </div>
  );
}
