const { PrismaClient, ApprovalStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const API_URL = "http://127.0.0.1:4000/api/v1";

async function main() {
  console.log("=== STARTING INTEGRATION TEST ===");

  // 1. Find the May 2026 run
  const run = await prisma.payrollRun.findFirst({
    where: { month: 5, year: 2026 }
  });
  if (!run) {
    throw new Error("May 2026 payroll run not found");
  }
  console.log(`Found May 2026 payroll run: ID=${run.id}, Status=${run.status}`);

  // Revert status to DRAFT so we can recalculate it
  await prisma.payrollRun.update({
    where: { id: run.id },
    data: { status: ApprovalStatus.DRAFT, lockedAt: null }
  });
  console.log(`Reverted run status to DRAFT`);

  // Ensure Sara Khan has the two approved expenses in May 2026
  const sara = await prisma.employee.findFirst({
    where: { email: "sara.khan@example.com" }
  });
  if (!sara) {
    throw new Error("Sara Khan not found");
  }

  // Set the expenses of Sara Khan in May 2026 back to APPROVED and reimbursedAt = null
  const resetResult = await prisma.expense.updateMany({
    where: {
      employeeId: sara.id,
      claimDate: {
        gte: new Date(2026, 4, 1),
        lte: new Date(2026, 4, 31, 23, 59, 59, 999)
      }
    },
    data: {
      status: ApprovalStatus.APPROVED,
      reimbursedAt: null
    }
  });
  console.log(`Reset ${resetResult.count} expenses for Sara Khan in May 2026 to APPROVED`);

  // 2. Authenticate
  console.log("Authenticating...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr.admin@example.com", password: "Skylinx@123" })
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  console.log("Authenticated successfully.");

  // 3. Calculate payroll run via API
  console.log(`Calculating payroll for run ${run.id}...`);
  const calcRes = await fetch(`${API_URL}/payroll/runs/${run.id}/calculate`, {
    method: "POST",
    headers
  });
  if (!calcRes.ok) {
    throw new Error(`Calculation failed: ${await calcRes.text()}`);
  }
  const calcData = await calcRes.json();
  console.log("Calculation API response:", JSON.stringify(calcData.data));

  // 4. Verify Sara Khan's payslip
  const payslip = await prisma.payslip.findFirst({
    where: { payrollRunId: run.id, employeeId: sara.id },
    include: { components: true }
  });
  if (!payslip) {
    throw new Error("Payslip for Sara Khan not found in May 2026 run");
  }
  console.log("\n--- Payslip for Sara Khan ---");
  console.log(`Gross Pay: ${payslip.grossPay}`);
  console.log(`Deductions: ${payslip.deductions}`);
  console.log(`Net Pay: ${payslip.netPay}`);
  console.log("Components:");
  payslip.components.forEach(c => {
    console.log(`  - Type: ${c.type}, Name: ${c.name}, Amount: ${c.amount}`);
  });

  const expensePayoutComponent = payslip.components.find(c => c.name === "Expense Payout");
  if (!expensePayoutComponent) {
    throw new Error("Expense Payout component missing from payslip!");
  }
  if (Number(expensePayoutComponent.amount) !== 3700) {
    throw new Error(`Expected Expense Payout to be 3700, but got ${expensePayoutComponent.amount}`);
  }
  console.log("Expense Payout component has the correct amount (3700)!");

  // 5. Lock the run via API
  console.log(`\nLocking payroll run ${run.id}...`);
  const lockRes = await fetch(`${API_URL}/payroll/runs/${run.id}/lock`, {
    method: "POST",
    headers
  });
  if (!lockRes.ok) {
    throw new Error(`Lock failed: ${await lockRes.text()}`);
  }
  const lockData = await lockRes.json();
  console.log("Lock API response status:", lockData.data.status);

  // 6. Verify expense status transitions in DB
  const expenses = await prisma.expense.findMany({
    where: {
      employeeId: sara.id,
      claimDate: {
        gte: new Date(2026, 4, 1),
        lte: new Date(2026, 4, 31, 23, 59, 59, 999)
      }
    }
  });

  console.log("\n--- Verification of Expenses after Lock ---");
  expenses.forEach(e => {
    console.log(`Expense ID: ${e.id}, Status: ${e.status}, ReimbursedAt: ${e.reimbursedAt}`);
    if (e.status !== ApprovalStatus.PAID) {
      throw new Error(`Expected expense ${e.id} to be PAID, but got ${e.status}`);
    }
    if (!e.reimbursedAt) {
      throw new Error(`Expected expense ${e.id} to have a reimbursedAt date, but got null`);
    }
  });

  console.log("\n=== INTEGRATION TEST PASSED SUCCESSFULLY! ===");
}

main()
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
