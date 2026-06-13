import { test, expect } from '@playwright/test';

const ADMIN = {
  email: 'admin@example.test',
  password: 'dev-admin-pass',
};

const INVITEE_EMAIL = `invitee-e2e-${Date.now()}@example.test`;
const INVITEE_PASSWORD = 'a-strong-passphrase-e2e';

async function signInAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(ADMIN.email);
  await page.getByLabel(/password/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Invitation flow (US1 → US2)', () => {
  test('admin sends an invitation, invitee sets password and is signed in', async ({ page }) => {
    await signInAsAdmin(page);

    await page.goto('/admin/accounts');

    // Capture the token from the API response before submitting the invite form
    let invitationToken: string | null = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/invitations') && response.request().method() === 'POST') {
        try {
          const body = (await response.json()) as { token?: string };
          if (body.token) invitationToken = body.token;
        } catch {
          // ignore
        }
      }
    });

    // Fill and submit the invite form
    await page.getByLabel(/email/i).fill(INVITEE_EMAIL);
    await page.getByRole('button', { name: /send invitation/i }).click();

    // Wait for success message
    await expect(page.getByRole('status')).toBeVisible({ timeout: 10_000 });
    expect(invitationToken).not.toBeNull();

    // Sign out as admin
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/sign-in');

    // Invitee opens the invitation link
    await page.goto(`/invitations/${invitationToken!}`);
    await expect(page.getByRole('heading', { name: /set up your account/i })).toBeVisible();

    // Set a password
    await page.getByLabel(/^choose a password/i).fill(INVITEE_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(INVITEE_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should be redirected to the dashboard as the new member
    await expect(page).toHaveURL('/', { timeout: 10_000 });
  });

  test('already-used invitation link shows a clear message', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/accounts');

    let invitationToken: string | null = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/invitations') && response.request().method() === 'POST') {
        try {
          const body = (await response.json()) as { token?: string };
          if (body.token) invitationToken = body.token;
        } catch {
          // ignore
        }
      }
    });

    const uniqueEmail = `already-used-${Date.now()}@example.test`;
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole('button', { name: /send invitation/i }).click();
    await expect(page.getByRole('status')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /sign out/i }).click();

    // Use the link once
    await page.goto(`/invitations/${invitationToken!}`);
    await page.getByLabel(/^choose a password/i).fill('a-strong-passphrase-e2e');
    await page.getByLabel(/confirm password/i).fill('a-strong-passphrase-e2e');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10_000 });

    // Sign out the new member
    await page.getByRole('button', { name: /sign out/i }).click();

    // Try to use the same link again
    await page.goto(`/invitations/${invitationToken!}`);
    await expect(page.getByText(/already been used/i)).toBeVisible({ timeout: 10_000 });
  });
});
