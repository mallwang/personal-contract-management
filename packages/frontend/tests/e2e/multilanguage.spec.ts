import { test, expect } from '@playwright/test';

test.describe('Multilanguage Support', () => {
  test.beforeEach(async ({ page }) => {
    // Clear stored language preference before each test
    await page.goto('http://localhost:5174');
    await page.evaluate(() => localStorage.removeItem('pcm-lang'));
  });

  // US1: Instant language switching
  test('US1 – language switcher is visible on the dashboard', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await expect(
      page
        .getByRole('button', { name: /Deutsch|DE/i })
        .or(page.locator('select').filter({ hasText: /Deutsch|DE/i })),
    ).toBeVisible();
  });

  test('US1 – switching from English to German updates all visible text without page reload', async ({
    page,
  }) => {
    await page.goto('http://localhost:5174');
    // Verify English heading is shown
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Switch to German - detect if it's a button or select
    const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
    if (await deButton.isVisible()) {
      await deButton.click();
    } else {
      await page
        .locator('select')
        .filter({ hasText: /Deutsch|DE/i })
        .selectOption('de');
    }

    // Page should NOT have reloaded - check URL hasn't changed
    await expect(page).toHaveURL('http://localhost:5174/');

    // German text should now be visible (subtitle changes)
    await expect(page.getByText(/Vertragsübersicht|Verträge verwalten|Monatliche/i)).toBeVisible();
  });

  test('US1 – switching language preserves form input state', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/new');

    // Type a value in the name field
    await page.getByLabel(/^name/i).fill('Test Contract');

    // Switch to German
    const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
    if (await deButton.isVisible()) {
      await deButton.click();
    } else {
      await page
        .locator('select')
        .filter({ hasText: /Deutsch|DE/i })
        .selectOption('de');
    }

    // Form data must still be present
    await expect(page.getByLabel(/^name/i)).toHaveValue('Test Contract');
  });

  test('US1 – switching back to English reverts all text', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Switch to German
    const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
    if (await deButton.isVisible()) {
      await deButton.click();
    }
    await expect(page.getByText(/Vertragsübersicht|Monatliche/i)).toBeVisible();

    // Switch back to English
    const enButton = page.getByRole('button', { name: /English|EN/i });
    if (await enButton.isVisible()) {
      await enButton.click();
    }
    await expect(page.getByText(/Your contract overview/i)).toBeVisible();
  });

  // US2: Language preference persistence
  test('US2 – selected language is persisted after page reload', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Switch to German
    const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
    if (await deButton.isVisible()) {
      await deButton.click();
    }

    // Reload the page
    await page.reload();

    // Should still be in German
    await expect(page.getByText(/Vertragsübersicht|Monatliche|Verträge verwalten/i)).toBeVisible();
  });

  test('US2 – first-time user sees English by default', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await expect(page.getByText(/Your contract overview/i)).toBeVisible();
  });

  // US3: Switcher accessible from all pages
  test('US3 – language switcher is visible on contract list page', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts');
    const switcher = page.getByRole('button', { name: /Deutsch|EN|DE/i }).first();
    await expect(switcher).toBeVisible();
  });

  test('US3 – language switcher is visible on add contract page', async ({ page }) => {
    await page.goto('http://localhost:5174/contracts/new');
    const switcher = page.getByRole('button', { name: /Deutsch|EN|DE/i }).first();
    await expect(switcher).toBeVisible();
  });
});
