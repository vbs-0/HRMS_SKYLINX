// Live API smoke across all new P1/P2/P3/Wave4 feature endpoints.
// Proves controller registration, permission guards, service and DB wiring.
const BASE = "http://localhost:4000/api/v1";

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.data.accessToken;
}

const results = [];
async function check(name, path, token, expect = 200) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const ok = res.status === expect;
    results.push(`${ok ? "PASS" : "FAIL"} [${res.status}] ${name} ${path}`);
  } catch (e) {
    results.push(`FAIL [ERR] ${name} ${path} :: ${String(e).slice(0, 80)}`);
  }
}

const hr = await login(process.env.HR_ADMIN_EMAIL || "admin@example.com", process.env.HR_ADMIN_PASSWORD || "password123");

// P1
await check("leave encashments", "/leave/encashments", hr);
await check("leave ledger", "/leave/ledger/emp_1003", hr);
await check("promotions", "/employees/emp_1003/promotions", hr);
await check("transfers", "/employees/emp_1003/transfers", hr);
await check("gratuity list", "/payroll/gratuity", hr);
await check("gratuity calc", "/payroll/gratuity/emp_1001/calculate", hr);
await check("corrections", "/payroll/corrections", hr);
await check("tax slabs", "/payroll/tax-slabs", hr);
await check("ff suggestions", "/employees/emp_1003/ff-suggestions", hr);
// P2
await check("comp-off conversions", "/leave/comp-off-conversions", hr);
await check("letter templates", "/employees/letter-templates/list/company_skylinx", hr);
await check("loans", "/employees/loans/list/emp_1003", hr);
await check("staffing plans", "/recruitment/staffing-plans/list/company_skylinx", hr);
await check("referrals", "/recruitment/referrals", hr);
// P3
await check("feedback requests", "/performance/feedback/requests", hr);
await check("grievances", "/grievance", hr);
await check("appraisal cycles", "/performance/cycles", hr);
await check("appraisal templates", "/performance/templates", hr);
await check("retention bonuses", "/payroll/retention-bonuses", hr);
await check("salary withholdings", "/payroll/withholdings", hr);

// Wave 4
await check("policies list", "/policies", hr);
await check("announcements list", "/announcements", hr);
await check("custom field definitions", "/custom-fields/definitions", hr);
await check("custom field values emp_1001", "/custom-fields/values/emp_1001", hr);
await check("dashboard celebrations", "/dashboard/celebrations", hr);
await check("form16 emp_1001", "/payroll/form16/emp_1001", hr);

// RBAC negative: EMPLOYEE must NOT list org-wide salary data.
const emp = await login(process.env.EMPLOYEE_EMAIL || "employee@example.com", process.env.EMPLOYEE_PASSWORD || "password123");
await check("RBAC employee blocked corrections", "/payroll/corrections", emp, 403);
await check("RBAC employee blocked gratuity list", "/payroll/gratuity", emp, 403);
await check("RBAC employee blocked addl salary", "/payroll/additional-salary", emp, 403);
await check("RBAC manager blocked corrections", "/payroll/corrections", await login(process.env.MANAGER_EMAIL || "manager@example.com", process.env.MANAGER_PASSWORD || "password123"), 403);

// RBAC negative: EMPLOYEE blocked from others' loans & tax declarations
await check("RBAC employee blocked other loans", "/employees/loans/list/emp_1004", emp, 403);
await check("RBAC employee blocked other tax dec", "/payroll/tax-declarations/emp_1004", emp, 403);
// But employee can see their own loans & tax declarations:
await check("RBAC employee allowed own loans", "/employees/loans/list/emp_1003", emp, 200);

// Wave 4 RBAC: Employees can read policies
await check("RBAC employee can read policies", "/policies", emp, 200);

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
process.exit(fails.length ? 1 : 0);
