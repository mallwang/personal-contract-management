import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';

const MEMBER = {
  email: 'member@example.test',
  password: 'dev-member-pass',
  displayName: 'Dev Member',
};
const ADMIN = {
  email: 'admin@example.test',
  password: 'dev-admin-pass',
  displayName: 'Dev Administrator',
};

async function signIn(
  page: import('@playwright/test').Page,
  account: { email: string; password: string },
) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/password/i).fill(account.password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function createContract(page: import('@playwright/test').Page, name: string) {
  await page.goto('/contracts');
  await page.getByRole('link', { name: /add contract/i }).click();
  await expect(page).toHaveURL(/\/contracts\/new/);
  await page.getByLabel(/^name/i).fill(name);
  await page.getByLabel(/^amount/i).fill('42.50');
  await page.getByLabel(/billing interval/i).selectOption('MONTHLY');
  await page.getByRole('button', { name: /add contract/i }).click();
  await expect(page).toHaveURL(/\/contracts$/);
}

async function exportedNames(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto('/contracts');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export/i }).click();
  await page.getByRole('menuitem', { name: /json/i }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  const parsed = JSON.parse(fs.readFileSync(filePath!, 'utf-8')) as Array<{ name: string }>;
  return parsed.map((c) => c.name);
}

test.describe('Multi-user sign-in and isolation', () => {
  test('US1 – signing in as a seeded account reaches the dashboard under that identity', async ({
    page,
  }) => {
    await signIn(page, MEMBER);
    await expect(page).toHaveURL('/');
    await expect(page.getByText(MEMBER.displayName)).toBeVisible();
  });

  test('US1 – signing out returns to the sign-in page', async ({ page }) => {
    await signIn(page, MEMBER);
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/sign-in');
  });

  test('US2 – a contract created by one account is invisible to another account', async ({
    browser,
  }) => {
    const memberContext = await browser.newContext();
    const adminContext = await browser.newContext();
    try {
      const memberPage = await memberContext.newPage();
      const adminPage = await adminContext.newPage();

      await signIn(memberPage, MEMBER);
      await signIn(adminPage, ADMIN);

      await expect(memberPage).toHaveURL('/');
      await expect(adminPage).toHaveURL('/');

      const memberContractName = `Member-only ${Date.now()}`;
      const adminContractName = `Admin-only ${Date.now()}`;

      await createContract(memberPage, memberContractName);
      await createContract(adminPage, adminContractName);

      // Contract list: each account sees its own contract but never the other's
      await memberPage.goto('/contracts');
      await expect(memberPage.locator('tr').filter({ hasText: memberContractName })).toBeVisible();
      await expect(memberPage.locator('tr').filter({ hasText: adminContractName })).toHaveCount(0);

      await adminPage.goto('/contracts');
      await expect(adminPage.locator('tr').filter({ hasText: adminContractName })).toBeVisible();
      await expect(adminPage.locator('tr').filter({ hasText: memberContractName })).toHaveCount(0);

      // Export: each account's export contains only its own contracts
      const memberExportNames = await exportedNames(memberPage);
      expect(memberExportNames).toContain(memberContractName);
      expect(memberExportNames).not.toContain(adminContractName);

      const adminExportNames = await exportedNames(adminPage);
      expect(adminExportNames).toContain(adminContractName);
      expect(adminExportNames).not.toContain(memberContractName);
    } finally {
      await memberContext.close();
      await adminContext.close();
    }
  });
});
