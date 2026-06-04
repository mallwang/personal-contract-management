import { test, expect } from '@playwright/test';

test.describe('Contract List & CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
  });

  test('US1 – contract list page renders with table headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /category/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /amount.*interval/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('US1 – "Add Contract" and "← Dashboard" links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /add contract/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('US1 – dashboard has "Manage Contracts" navigation link', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await expect(page.getByRole('link', { name: /manage contracts/i })).toBeVisible();
    await page.getByRole('link', { name: /manage contracts/i }).click();
    await expect(page).toHaveURL(/\/contracts/);
  });

  test('US2 – create a new contract with MONTHLY interval and see it in the list', async ({ page }) => {
    const uniqueName = `Test Contract ${Date.now()}`;

    await page.getByRole('link', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts\/new/);
    await expect(page.getByRole('heading', { name: /add contract/i })).toBeVisible();

    await page.getByLabel(/^name/i).fill(uniqueName);
    await page.getByLabel(/^amount/i).fill('29.99');
    await page.getByLabel(/billing interval/i).selectOption('MONTHLY');
    await page.getByRole('button', { name: /add contract/i }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    const row = page.locator('tr').filter({ hasText: uniqueName });
    await expect(row.getByText(/29\.99/)).toBeVisible();
    await expect(row.getByText(/Monthly/)).toBeVisible();
  });

  test('US2 – create a contract with QUARTERLY interval and see interval label in list', async ({ page }) => {
    const uniqueName = `Quarterly ${Date.now()}`;

    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/^name/i).fill(uniqueName);
    await page.getByLabel(/^amount/i).fill('60');
    await page.getByLabel(/billing interval/i).selectOption('QUARTERLY');
    await page.getByRole('button', { name: /add contract/i }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    const quarterlyRow = page.locator('tr').filter({ hasText: uniqueName });
    await expect(quarterlyRow).toBeVisible();
    // The interval cell shows "60.00 / Quarterly" — check the amount column specifically
    await expect(quarterlyRow.getByRole('cell', { name: /\/\s*Quarterly/ })).toBeVisible();
  });

  test('US2 – billing interval selector has all 5 options', async ({ page }) => {
    await page.getByRole('link', { name: /add contract/i }).click();
    const select = page.getByLabel(/billing interval/i);
    await expect(select.locator('option[value="WEEKLY"]')).toBeAttached();
    await expect(select.locator('option[value="MONTHLY"]')).toBeAttached();
    await expect(select.locator('option[value="QUARTERLY"]')).toBeAttached();
    await expect(select.locator('option[value="YEARLY"]')).toBeAttached();
    await expect(select.locator('option[value="LIFETIME"]')).toBeAttached();
  });

  test('US2 – create form shows validation error when name is empty', async ({ page }) => {
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/^amount/i).fill('10');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/contracts\/new/);
  });

  test('US2 – cancel from create form returns to contract list', async ({ page }) => {
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);
  });

  test('US3 – edit a contract and update amount', async ({ page }) => {
    const uniqueName = `Edit Me ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/^name/i).fill(uniqueName);
    await page.getByLabel(/^amount/i).fill('10');
    await page.getByLabel(/billing interval/i).selectOption('MONTHLY');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    const row = page.locator('tr').filter({ hasText: uniqueName });
    await row.getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/contracts\/.+\/edit/);
    await expect(page.getByRole('heading', { name: /edit contract/i })).toBeVisible();

    await page.getByLabel(/^amount/i).clear();
    await page.getByLabel(/^amount/i).fill('99.99');
    await page.getByLabel(/billing interval/i).selectOption('YEARLY');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    const updatedRow = page.locator('tr').filter({ hasText: uniqueName });
    await expect(updatedRow.getByText(/99\.99/)).toBeVisible();
    await expect(updatedRow.getByText(/Yearly/)).toBeVisible();
  });

  test('US4 – delete contract with Cancel keeps it in the list', async ({ page }) => {
    const uniqueName = `Delete Cancel ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/^name/i).fill(uniqueName);
    await page.getByLabel(/^amount/i).fill('5');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    const row = page.locator('tr').filter({ hasText: uniqueName });
    await row.getByRole('button', { name: /delete/i }).click();
    await expect(row.getByRole('button', { name: /confirm/i })).toBeVisible();
    await row.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('US4 – delete contract with Confirm removes it from the list', async ({ page }) => {
    const uniqueName = `Delete Me ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/^name/i).fill(uniqueName);
    await page.getByLabel(/^amount/i).fill('5');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    const row = page.locator('tr').filter({ hasText: uniqueName });
    await row.getByRole('button', { name: /delete/i }).click();
    await row.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 5000 });
  });
});
