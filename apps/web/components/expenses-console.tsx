"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/client-api";
import { ExpenseClaimPanel } from "./action-panels";
import { ExpensesTable } from "./live-tables";
import { ReferenceModuleHeader } from "./reference-module";
import { ReferenceFlowStrip } from "./reference-sections";
import { ExpensePayoutWorkspace } from "./reference-workspaces";
import { Card } from "./ui";
import { Download, ReceiptText, WalletCards } from "lucide-react";

export function ExpensesConsole() {
  const [activeTab, setActiveTab] = useState("Claims");
  const [showClaimPanel, setShowClaimPanel] = useState(false);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [status, setStatus] = useState("All");

  const [expenses, setExpenses] = useState<any[]>([]);

  function load() {
    apiFetch<any[]>("/expenses").then((body) => {
      if (body.data) setExpenses(body.data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExport() {
    try {
      const res = await apiFetch<any[]>("/expenses");
      if (!res.data) return;
      const csvContent = [
        ["Employee", "Category", "Amount", "Claim Date", "Status", "Receipt"].join(","),
        ...res.data.map((e) => [
          `"${e.employee?.firstName || ""} ${e.employee?.lastName || ""}"`,
          `"${e.category}"`,
          e.amount,
          e.claimDate.slice(0, 10),
          e.status,
          `"${e.receiptUrl || ""}"`,
        ].join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `expenses_${Date.now()}.csv`);
      link.click();
    } catch (err) {
      console.error(err);
    }
  }

  const pendingCount = expenses.filter((e) => e.status === "PENDING" || e.status === "HOLD").length;
  const approvedCount = expenses.filter((e) => e.status === "APPROVED").length;
  const paidCount = expenses.filter((e) => e.status === "PAID").length;

  return (
    <div className="grid gap-5">
      <ReferenceModuleHeader
        eyebrow="Expense"
        title="Expense Payout"
        summary="Submit claims, upload receipts, approve payouts and track reimbursements like the reference expense workflow."
        tabs={["Claims", "Approvals", "Receipts", "Reimbursement"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={search}
        onSearchChange={setSearch}
        monthValue={month}
        onMonthChange={setMonth}
        statusValue={status}
        onStatusChange={setStatus}
        actions={[
          {
            label: "New Claim",
            icon: <ReceiptText className="h-4 w-4" />,
            tone: "primary",
            onClick: () => setShowClaimPanel(!showClaimPanel),
          },
          {
            label: "Approvals",
            icon: <WalletCards className="h-4 w-4" />,
            onClick: () => setActiveTab("Approvals"),
          },
          {
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExport,
          },
        ]}
        stats={[
          { label: "Pending Claims", value: String(pendingCount), note: "Awaiting approval" },
          { label: "Approved Claims", value: String(approvedCount), note: "Pending reimbursement" },
          { label: "Reimbursed", value: String(paidCount), note: "Paid out" },
        ]}
      />
      <ReferenceFlowStrip module="Expense" />

      {activeTab === "Claims" && (
        <div className="grid gap-5 text-left">
          <ExpensePayoutWorkspace />
          {showClaimPanel && <ExpenseClaimPanel />}
          <Card className="border border-[var(--border-subtle)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Claims & Payouts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-text-secondary border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Claim Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <ExpensesTable mode="claims" search={search} status={status} month={month} />
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Approvals" && (
        <div className="grid gap-5 text-left">
          <Card className="border border-[var(--border-subtle)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Pending Claim Approvals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-text-secondary border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Claim Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Approval Workflow Actions</th>
                  </tr>
                </thead>
                <ExpensesTable mode="approvals" search={search} month={month} />
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Receipts" && (
        <div className="grid gap-5 text-left">
          <Card className="border border-[var(--border-subtle)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Expense Claim Receipts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-text-secondary border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Claim Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <ExpensesTable mode="receipts" search={search} month={month} />
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Reimbursement" && (
        <div className="grid gap-5 text-left">
          <Card className="border border-[var(--border-subtle)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Pending Reimbursements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--surface-sunken)] text-left text-xs uppercase font-bold text-text-secondary border-b">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Claim Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Receipt</th>
                    <th className="p-3">Reimburse Action</th>
                  </tr>
                </thead>
                <ExpensesTable mode="reimbursement" search={search} month={month} />
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
