import { test, expect } from '@playwright/test';

test.describe('Contract List & CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
  });

  test('US1 – contract list page renders with table headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /category/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /monthly/i })).toBeVisible();
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

  test('US2 – create a new contract and see it in the list', async ({ page }) => {
    const uniqueName = `Test Contract ${Date.now()}`;

    await page.getByRole('link', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts\/new/);
    await expect(page.getByRole('heading', { name: /add contract/i })).toBeVisible();

    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/monthly amount/i).fill('29.99');
    await page.getByRole('button', { name: /add contract/i }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('US2 – create form shows validation error when name is empty', async ({ page }) => {
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/monthly amount/i).fill('10');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/contracts\/new/);
  });

  test('US2 – cancel from create form returns to contract list', async ({ page }) => {
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);
  });

  test('US3 – edit a contract and see the updated value', async ({ page }) => {
    // First create a contract to edit
    const uniqueName = `Edit Me ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/monthly amount/i).fill('10');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    // Click Edit on the newly created contract
    const row = page.getByRole('row', { name: new RegExp(uniqueName) });
    await row.getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/contracts\/.+\/edit/);
    await expect(page.getByRole('heading', { name: /edit contract/i })).toBeVisible();

    // Update monthly amount
    await page.getByLabel(/monthly amount/i).clear();
    await page.getByLabel(/monthly amount/i).fill('99.99');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    const updatedRow = page.getByRole('row', { name: new RegExp(uniqueName) });
    await expect(updatedRow.getByText(/99\.99/)).toBeVisible();
  });

  test('US4 – delete contract with Cancel keeps it in the list', async ({ page }) => {
    const uniqueName = `Delete Cancel ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/monthly amount/i).fill('5');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    const row = page.getByRole('row', { name: new RegExp(uniqueName) });
    await row.getByRole('button', { name: /delete/i }).click();
    // Confirm button should appear
    await expect(row.getByRole('button', { name: /confirm/i })).toBeVisible();
    // Click Cancel
    await row.getByRole('button', { name: /cancel/i }).click();
    // Contract should still be visible
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('US4 – delete contract with Confirm removes it from the list', async ({ page }) => {
    const uniqueName = `Delete Me ${Date.now()}`;
    await page.getByRole('link', { name: /add contract/i }).click();
    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/monthly amount/i).fill('5');
    await page.getByRole('button', { name: /add contract/i }).click();
    await expect(page).toHaveURL(/\/contracts$/);

    const row = page.getByRole('row', { name: new RegExp(uniqueName) });
    await row.getByRole('button', { name: /delete/i }).click();
    await row.getByRole('button', { name: /confirm/i }).click();

    // Contract should no longer appear
    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 5000 });
  });
});
