import { test, expect } from '@playwright/test';
test.use({ baseURL: 'http://localhost:3000' });

async function login(page: any, email: string, pass: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  // wait for redirect to dashboard or other authenticated page
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
}

test.describe('Frontend Fixes Verification', () => {
  test.setTimeout(45000);


  test('T1 — SaaS owner console gate (F6)', async ({ page }) => {
    await login(page, 'superadmin@example.com', 'password123');
    await page.goto('/saas-admin');
    
    // Check gate message is absent
    await expect(page.getByText('Owner Credentials Required')).toBeHidden({ timeout: 5000 });
    
    // Check owner content is present
    await expect(page.getByText(/Tenant Organization Directories|Tenant Directory/i).first()).toBeVisible();
  });

  test('T2 — Bulk upload file input (F7)', async ({ page }) => {
    await login(page, 'admin@example.com', 'password123');
    await page.goto('/employees');
    
    // Click bulk upload tab/button
    await page.getByRole('button', { name: 'Bulk Upload' }).click();
    
    // Assert input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
    
    // Upload an in-memory CSV (no filesystem / __dirname dependency).
    await fileInput.setInputFiles({
      name: 'dummy-upload.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('employeeCode,firstName,lastName,email\nE9001,Test,User,t.user9001@example.com'),
    });

    await page.getByRole('button', { name: 'Import Spreadsheet' }).click();
    await page.waitForTimeout(1500);

    // The fix is proven by getting PAST the "Please select a file" client guard:
    // before the fix there was no <input type="file"> so the file never attached and
    // this guard always fired. Import success/failure is server-side and not asserted.
    await expect(page.getByText(/Please select a CSV or Excel file/i)).toBeHidden();
  });

  test('T3 — Employee profile edit persists name (F8)', async ({ page }) => {
    await login(page, 'admin@example.com', 'password123');
    await page.goto('/employees');

    // Search filters by employeeCode / NAME / role — search by the displayed name.
    await page.getByPlaceholder('Search code, name, role...').fill('Priya');
    await page.waitForTimeout(800);

    // Open the matching roster row (the <tr> is the click target).
    await page.getByRole('row', { name: /Priya/ }).first().click();

    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.getByPlaceholder('First Name').fill('PriyaTEST');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();

    // Reload and reopen to prove the change persisted server-side (PATCH sent the field).
    await page.reload();
    await page.getByPlaceholder('Search code, name, role...').fill('PriyaTEST');
    await page.waitForTimeout(800);
    await page.getByRole('row', { name: /PriyaTEST/ }).first().click();
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await expect(page.getByPlaceholder('First Name')).toHaveValue('PriyaTEST');

    // Restore original name so the test is idempotent.
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();
  });

  test('T4 — Regularization Reject button', async ({ page }) => {
    await login(page, 'admin@example.com', 'password123');
    await page.goto('/attendance');
    
    await page.getByRole('button', { name: 'Regularization', exact: true }).click();
    await page.waitForTimeout(1200);

    // The row is a flex item containing the PENDING pill plus Approve/Reject buttons.
    const pendingRow = page
      .locator('div.flex.items-center.justify-between')
      .filter({ hasText: 'PENDING' })
      .first();

    if ((await pendingRow.count()) === 0) {
      console.log('no pending regularization present — skipping reject click');
      test.skip(true, 'requires a seeded PENDING regularization');
      return;
    }

    // Both buttons must render on a pending row (this was the fix).
    await expect(pendingRow.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(pendingRow.getByRole('button', { name: 'Reject' })).toBeVisible();

    // Actually reject it and confirm the action fired.
    await pendingRow.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText(/Regularization reject/i)).toBeVisible({ timeout: 5000 });
  });

});
