const API_URL = "http://127.0.0.1:4000/api/v1";

async function runTests() {
  console.log("=== STARTING PAYROLL ENDPOINT VERIFICATION ===");
  
  // 1. Authenticate
  console.log("\n1. Authenticating as hr.admin@example.com...");
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
  const companyId = loginData.data.user.tenantId || "company_skylinx";
  console.log(`Authenticated. Token obtained. Company ID: ${companyId}`);
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // 2. Fetch Salary Structures
  console.log("\n2. Fetching salary structures...");
  const structuresRes = await fetch(`${API_URL}/payroll/salary-structures`, { headers });
  if (!structuresRes.ok) throw new Error(`Fetch structures failed: ${await structuresRes.text()}`);
  const structuresData = await structuresRes.json();
  console.log(`Success! Fetched ${structuresData.data.length} structures.`);

  // 3. Create a Salary Structure
  console.log("\n3. Creating new salary structure for employee emp_1005...");
  const newStructure = {
    employeeId: "emp_1005",
    effectiveFrom: new Date("2026-08-01").toISOString(),
    annualCtc: 480000,
    basic: 240000,
    hra: 96000,
    allowances: 100000,
    employerPf: 28800,
    employeePf: 28800,
    esi: 0,
    professionalTax: 2400,
    tds: 0
  };
  const createStructureRes = await fetch(`${API_URL}/payroll/salary-structures`, {
    method: "POST",
    headers,
    body: JSON.stringify(newStructure)
  });
  if (!createStructureRes.ok) {
    console.warn(`Create structure failed (might exist already): ${await createStructureRes.text()}`);
  } else {
    const createStructureData = await createStructureRes.json();
    console.log(`Success! Created structure ID: ${createStructureData.data.id}`);
  }

  // 4. Fetch Payroll Runs
  console.log("\n4. Fetching payroll runs...");
  const runsRes = await fetch(`${API_URL}/payroll/runs`, { headers });
  if (!runsRes.ok) throw new Error(`Fetch runs failed: ${await runsRes.text()}`);
  const runsData = await runsRes.json();
  console.log(`Success! Fetched ${runsData.data.length} runs.`);

  // 5. Create a Payroll Run
  const month = Math.floor(Math.random() * 12) + 1;
  const year = Math.floor(Math.random() * 5) + 2027;
  console.log(`\n5. Initializing new payroll run for ${month}/${year}...`);
  const createRunRes = await fetch(`${API_URL}/payroll/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ companyId, month, year })
  });
  if (!createRunRes.ok) throw new Error(`Create run failed: ${await createRunRes.text()}`);
  const createRunData = await createRunRes.json();
  const runId = createRunData.data.id;
  console.log(`Success! Created/Retrieved run ID: ${runId}`);

  // 6. Calculate Payroll Run
  console.log(`\n6. Calculating payroll components for run ${runId}...`);
  const calcRes = await fetch(`${API_URL}/payroll/runs/${runId}/calculate`, {
    method: "POST",
    headers
  });
  if (!calcRes.ok) throw new Error(`Calculate failed: ${await calcRes.text()}`);
  const calcData = await calcRes.json();
  console.log(`Success! Recalculated run. Payslips Count: ${calcData.data.payslipCount}`);

  // 7. Fetch Payslips
  console.log(`\n7. Fetching payslips for run ${runId}...`);
  const payslipsRes = await fetch(`${API_URL}/payroll/runs/${runId}/payslips`, { headers });
  if (!payslipsRes.ok) throw new Error(`Fetch payslips failed: ${await payslipsRes.text()}`);
  const payslipsData = await payslipsRes.json();
  console.log(`Success! Fetched ${payslipsData.data.items.length} payslips.`);
  payslipsData.data.items.forEach(p => {
    console.log(`  - Employee ID: ${p.employeeId}, Gross: ${p.grossPay}, Deductions: ${p.deductions}, Net: ${p.netPay}`);
  });

  // 8. Lock Payroll Run
  console.log(`\n8. Locking and approving payroll run ${runId}...`);
  const lockRes = await fetch(`${API_URL}/payroll/runs/${runId}/lock`, {
    method: "POST",
    headers
  });
  if (!lockRes.ok) throw new Error(`Lock failed: ${await lockRes.text()}`);
  const lockData = await lockRes.json();
  console.log(`Success! Locked run. Status is now: ${lockData.data.status}`);

  // 9. Bank Export
  console.log(`\n9. Exporting bank details for run ${runId}...`);
  const exportRes = await fetch(`${API_URL}/payroll/runs/${runId}/bank-export`, {
    method: "POST",
    headers
  });
  if (!exportRes.ok) throw new Error(`Bank export failed: ${await exportRes.text()}`);
  const exportData = await exportRes.json();
  console.log(`Success! Export rows:`, exportData.data.rows);

  console.log("\n=== ALL PAYROLL ENDPOINTS VERIFIED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("\nTEST FAILED:", err.message);
  process.exit(1);
});
