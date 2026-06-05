import { test, expect } from '@playwright/test';

test.describe('Contract Anonymization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
  });

  test('US1 – anonymization toggle button is visible on the contracts page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /hide|show|anonymi/i })).toBeVisible();
  });

  test('US1 – activating global toggle hides real contract names', async ({ page }) => {
    // Seed at least one contract if needed — assume test data exists
    const toggle = page.getByRole('button', { name: /hide|show|anonymi/i });

    // Capture real names before toggling
    const rows = page.getByRole('row');
    const firstNameCell = rows.nth(1).getByRole('cell').first();
    const realName = await firstNameCell.textContent();

    if (!realName || realName.trim() === '') {
      test.skip();
      return;
    }

    await toggle.click();
    // After toggle, real name should not be visible in that cell
    await expect(firstNameCell).not.toHaveText(realName.trim());
    expect((await firstNameCell.textContent())?.trim()).not.toBe('');
  });

  test('US1 – deactivating global toggle restores real contract names', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /hide|show|anonymi/i });
    const rows = page.getByRole('row');
    const firstNameCell = rows.nth(1).getByRole('cell').first();
    const realName = await firstNameCell.textContent();

    if (!realName || realName.trim() === '') {
      test.skip();
      return;
    }

    await toggle.click(); // hide
    await toggle.click(); // show
    await expect(firstNameCell).toHaveText(realName.trim());
  });

  test('US1 – anonymization state persists after page reload', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /hide|show|anonymi/i });

    // Record state before toggling
    const rows = page.getByRole('row');
    const firstNameCell = rows.nth(1).getByRole('cell').first();
    const realName = await firstNameCell.textContent();

    if (!realName || realName.trim() === '') {
      test.skip();
      return;
    }

    await toggle.click(); // activate
    await page.reload();
    await page.waitForLoadState('networkidle');

    // After reload, name should still be hidden (no animation)
    const cellAfterReload = page.getByRole('row').nth(1).getByRole('cell').first();
    await expect(cellAfterReload).not.toHaveText(realName.trim());

    // Clean up
    await page.getByRole('button', { name: /hide|show|anonymi/i }).click();
  });

  test('US2 – per-contract anonymization shows fantasy name with global toggle OFF', async ({
    page,
  }) => {
    // Navigate to contracts and edit the first one
    const editLinks = page.getByRole('link', { name: /edit/i });
    const count = await editLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Get the real name from the first row
    const firstNameCell = page.getByRole('row').nth(1).getByRole('cell').first();
    const realName = await firstNameCell.textContent();

    await editLinks.first().click();
    await page.waitForURL(/\/edit/);

    const checkbox = page.getByLabel(/anonymize/i);
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForURL('/contracts');

    // Global toggle is off — but per-contract anonymization should be active
    if (realName) {
      const nameCell = page.getByRole('row').nth(1).getByRole('cell').first();
      await expect(nameCell).not.toHaveText(realName.trim());
    }

    // Cleanup: uncheck the anonymize flag
    await page.getByRole('link', { name: /edit/i }).first().click();
    await page.waitForURL(/\/edit/);
    const cb = page.getByLabel(/anonymize/i);
    await cb.uncheck();
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForURL('/contracts');
  });
});
