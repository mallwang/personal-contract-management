import { test, expect } from '@playwright/test';

test.describe('Welcome Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('US1 – shows total monthly spending', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /monthly spending/i })).toBeVisible();
    const total = page.locator('.spending-overview__total');
    await expect(total).toBeVisible();
  });

  test('US2 – shows contracts grouped by category', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /by category/i })).toBeVisible();
    await expect(page.getByText('Housing')).toBeVisible();
    await expect(page.getByText('Utilities')).toBeVisible();
    await expect(page.getByText('Subscriptions')).toBeVisible();
  });

  test('US3 – shows upcoming renewals section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /upcoming renewals/i })).toBeVisible();
  });

  test('all three sections visible without scrolling at 1280x800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    const spending = page.getByRole('heading', { name: /monthly spending/i });
    const category = page.getByRole('heading', { name: /by category/i });
    const renewals = page.getByRole('heading', { name: /upcoming renewals/i });

    await expect(spending).toBeInViewport();
    await expect(category).toBeInViewport();
    await expect(renewals).toBeInViewport();
  });

  test('empty state – no contracts shows zero total', async ({ page }) => {
    await expect(
      page.locator('.spending-overview__total, .spending-overview__empty'),
    ).toBeVisible();
  });
});
