import { test, expect } from "@playwright/test";

test.describe("PeopleOS HRMS E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
  });

  test("should successfully authenticate and navigate through core modules", async ({ page }) => {
    // Fill credentials using label matching
    await page.getByLabel("Email").fill(process.env.HR_ADMIN_EMAIL || "admin@example.com");
    await page.getByLabel("Password").fill(process.env.HR_ADMIN_PASSWORD || "password123");

    // Click Sign In button
    await page.getByRole("button", { name: "Sign In" }).click();

    // Verify redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    // Verify dashboard metrics render
    await expect(page.getByText("Active workforce").first()).toBeVisible();

    // 1. Navigation check: Directory / Employees Console
    await page.goto("/employees");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Employee Directory" }).first()).toBeVisible();

    // 2. Navigation check: Recruitment ATS Console
    await page.goto("/recruitment");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Recruitment Pipeline").first()).toBeVisible();

    // 3. Navigation check: Payroll Console
    await page.goto("/payroll");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Payroll Workflow Tracker").first()).toBeVisible();

    // 4. Navigation check: Training & Skills Console
    await page.goto("/training");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Training & Skill Assessments").first()).toBeVisible();

    // 5. Navigation check: Travel Desk Console
    await page.goto("/travel");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Travel Desk").first()).toBeVisible();
  });
});
