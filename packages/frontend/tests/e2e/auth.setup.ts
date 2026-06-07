import { test as setup, expect } from '@playwright/test';

const memberAuthFile = 'playwright/.auth/member.json';
const adminAuthFile = 'playwright/.auth/admin.json';

async function signInAndSave(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  authFile: string,
) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: authFile });
}

setup('authenticate as seeded member account', async ({ page }) => {
  await signInAndSave(page, 'member@example.test', 'dev-member-pass', memberAuthFile);
});

setup('authenticate as seeded admin account', async ({ page }) => {
  await signInAndSave(page, 'admin@example.test', 'dev-admin-pass', adminAuthFile);
});
