import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Exhaustive page sweep: every route x every role.
// Captures per page: console errors, failed/5xx API responses, horizontal
// overflow (layout break), and a full-page screenshot for the audit evidence.

const ROUTES = [
  "/dashboard", "/employees", "/attendance", "/leave", "/payroll", "/expenses",
  "/holidays", "/insurance", "/recruitment", "/training", "/travel",
  "/performance", "/approvals", "/organization", "/analytics", "/reports",
  "/rewards", "/social", "/notifications", "/compliance", "/assets",
  "/support", "/security", "/settings", "/saas", "/saas-admin",
  "/cards", "/documents",
];

const ROLES = [
  { name: "HR_ADMIN", email: "hr.admin@skylinx.local", password: "Skylinx@123" },
  { name: "MANAGER", email: "rohan.iyer@skylinx.local", password: "Skylinx@123" },
  { name: "EMPLOYEE", email: "kabir.sethi@skylinx.local", password: "Skylinx@123" },
];

const IMAGES_ROOT = path.resolve(process.cwd(), "../../docs/reference_blueprint/images");
const RESULTS_ROOT = path.resolve(process.cwd(), "../../docs/reference_blueprint");

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

for (const role of ROLES) {
  test(`full page sweep as ${role.name}`, async ({ page }) => {
    test.setTimeout(600000);
    const dir = path.join(IMAGES_ROOT, `${role.name}_DEEP`);
    fs.mkdirSync(dir, { recursive: true });

    const results: Array<Record<string, unknown>> = [];
    let consoleErrors: string[] = [];
    let badResponses: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
    });
    page.on("response", (res) => {
      if (res.status() >= 500) badResponses.push(`${res.status()} ${res.url()}`);
    });

    await login(page, role.email, role.password);

    let index = 0;
    for (const route of ROUTES) {
      index += 1;
      consoleErrors = [];
      badResponses = [];
      let status = "PASS";
      let note = "";
      try {
        const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2500); // let client data fetches settle
        if (response && response.status() >= 400) {
          status = "FAIL";
          note = `page returned HTTP ${response.status()}`;
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        const bodyText = (await page.locator("body").innerText()).slice(0, 4000);
        const blank = bodyText.trim().length < 40;
        const buttons = await page.locator("button:visible").count();
        const inputs = await page.locator("input:visible, select:visible, textarea:visible").count();
        if (blank) { status = "FAIL"; note += " page appears blank/empty;"; }
        if (overflow > 8) { status = status === "FAIL" ? "FAIL" : "WARN"; note += ` horizontal overflow ${overflow}px;`; }
        if (badResponses.length) { status = "FAIL"; note += ` 5xx: ${badResponses.join(", ")};`; }
        if (consoleErrors.length) {
          if (status === "PASS") status = "WARN";
          note += ` console errors: ${[...new Set(consoleErrors)].slice(0, 3).join(" | ")};`;
        }
        const file = `${String(index).padStart(2, "0")}_${route.replace(/\//g, "")}.png`;
        await page.screenshot({ path: path.join(dir, file), fullPage: true });
        results.push({ route, status, note: note.trim(), buttons, inputs, screenshot: `${role.name}_DEEP/${file}` });
      } catch (err) {
        results.push({ route, status: "FAIL", note: `navigation error: ${String(err).slice(0, 200)}` });
      }
    }

    fs.writeFileSync(
      path.join(RESULTS_ROOT, `audit-results-${role.name}.json`),
      JSON.stringify(results, null, 2)
    );

    const failures = results.filter((r) => r.status === "FAIL");
    expect(failures, `FAIL pages for ${role.name}: ${failures.map((f) => f.route).join(", ")}`).toHaveLength(0);
  });
}
