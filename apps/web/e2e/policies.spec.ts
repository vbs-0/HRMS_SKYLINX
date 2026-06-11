import { test, expect } from "@playwright/test";

test.describe("Advanced Core Policies E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill("hr.admin@skylinx.local");
    await page.getByLabel("Password").fill("Skylinx@123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should enforce expense grade caps warning", async ({ page }) => {
    // 1. Assign Grade and Verify Expense Cap Warning
    await page.goto("/employees");
    await page.waitForLoadState("networkidle");

    // Click on Kabir Sethi (emp_1003) to inspect profile
    await page.getByText("Kabir Sethi").first().click();
    await page.waitForTimeout(1000); // Wait for drawer animation

    // Enable Edit Mode
    await page.getByRole("button", { name: "Edit Profile" }).first().click();

    // Select Grade L1 (which has a cap of ₹5000 in seed data)
    await page.locator("select[name='gradeId']").selectOption({ label: "Grade L1" });
    await page.getByRole("button", { name: "Save Profile" }).click();
    await page.waitForTimeout(1000);

    // Go to Expenses page
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle");

    // Click "New Claim" button
    await page.getByRole("button", { name: "New Claim" }).click();

    // Select Kabir Sethi
    await page.locator("select[name='employeeId']").selectOption({ label: "Kabir Sethi - EMP-1003" });
    
    // Choose Category
    await page.locator("select[name='category']").selectOption("Travel");

    // Enter Amount exceeding Grade L2 limit (e.g. ₹6000)
    await page.locator("input[name='amount']").fill("6000");

    // Expect warning message to be visible
    await expect(page.getByText(/Warning: Amount exceeds employee's grade maximum expense limit/)).toBeVisible();
  });

  test("should enforce leave block list date range validation", async ({ page }) => {
    // Navigate to Leave module
    await page.goto("/leave");
    await page.waitForLoadState("networkidle");

    // Toggle Admin view
    await page.getByRole("button", { name: "Admin View" }).click();
    await page.waitForTimeout(500);

    // Click Leave Policies tab
    await page.getByRole("button", { name: "Leave Policies" }).click();
    await page.waitForTimeout(500);

    // Create a new policy
    await page.getByRole("button", { name: "Add Policy" }).click();
    await page.locator("input[placeholder='e.g. Critical Release Freeze Policy']").fill("E2E Test Policy");
    await page.locator("textarea[placeholder='Describe target group or applicability...']").fill("Used in automated tests");
    await page.getByRole("button", { name: "Save Policy" }).click();
    await page.waitForTimeout(1000);

    // Verify it is in list
    await expect(page.getByText("E2E Test Policy").first()).toBeVisible();

    // Go to Leave Block Lists tab
    await page.getByRole("button", { name: "Leave Block Lists" }).click();
    await page.waitForTimeout(500);

    // Create Block List
    await page.getByRole("button", { name: "Add Block List" }).click();
    await page.locator("input[placeholder='e.g. Q4 Release Delivery Blackout']").fill("E2E Block Window");
    await page.locator("textarea[placeholder='e.g. Critical release window block list...']").fill("E2E block list description");
    await page.getByRole("button", { name: "Save Block List" }).click();
    await page.waitForTimeout(1000);

    // Click Add Date on the block list card
    await page.getByText("+ Add Date").first().click();
    await page.locator("input[type='date']").fill("2026-06-25");
    await page.locator("input[placeholder='e.g. Critical release sprint deadline']").fill("E2E Sprint Deadline");
    await page.getByRole("button", { name: "Add Date", exact: true }).click();
    await page.waitForTimeout(1000);

    // Toggle back to HR View
    await page.getByRole("button", { name: "HR View" }).click();
    await page.waitForTimeout(500);

    // Switch to Leave Requests tab and open Apply Leave Panel
    await page.getByRole("button", { name: "Leave Requests" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Apply Leave" }).click();

    // Select Kabir Sethi
    await page.locator("select[name='employeeId']").selectOption({ label: "Kabir Sethi - EMP-1003" });

    // Select Sick Leave
    await page.locator("select[name='leaveTypeId']").selectOption({ label: "Sick Leave (SL)" });

    // Apply for leave on 2026-06-25 (blocked date)
    await page.locator("input[name='fromDate']").fill("2026-06-25");
    await page.locator("input[name='toDate']").fill("2026-06-25");
    await page.locator("input[name='days']").fill("1");
    await page.locator("input[name='reason']").fill("E2E test apply leave on blocked date");

    // Click Apply Leave button
    await page.getByRole("button", { name: "Apply Leave" }).nth(1).click();
    await page.waitForTimeout(1000);

    // Expect validation rejection error message
    await expect(page.getByText(/Cannot apply for leave on (25\/06\/2026|6\/25\/2026) as it is a blocked period: E2E Sprint Deadline/)).toBeVisible();
  });
});
