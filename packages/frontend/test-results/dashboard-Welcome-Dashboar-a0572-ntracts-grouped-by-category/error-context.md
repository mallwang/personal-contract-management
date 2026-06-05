# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Welcome Dashboard >> US2 – shows contracts grouped by category
- Location: tests/e2e/dashboard.spec.ts:14:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Contracts by category' }).getByRole('heading', { name: /by category/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('region', { name: 'Contracts by category' }).getByRole('heading', { name: /by category/i })

```

```yaml
- group "Language":
    - button "English" [pressed]
    - button "Deutsch"
- main:
    - heading "Dashboard" [level=1]
    - paragraph: Your contract overview
    - link "Manage Contracts":
        - /url: /contracts
    - region "Monthly Spending":
        - heading "Monthly Spending Monthly spending calculation info Average monthly cost across all active contracts. Yearly amounts ÷ 12, quarterly ÷ 3, weekly × 4.3. One-time (lifetime) contracts are excluded." [level=2]:
            - text: Monthly Spending
            - button "Monthly spending calculation info"
            - tooltip "Average monthly cost across all active contracts. Yearly amounts ÷ 12, quarterly ÷ 3, weekly × 4.3. One-time (lifetime) contracts are excluded."
        - paragraph: €2,015.88
        - paragraph: across all active contracts
    - region "By Category":
        - heading "By Category" [level=2]
        - table:
            - rowgroup:
                - row "Category Contracts Monthly Total":
                    - columnheader "Category"
                    - columnheader "Contracts"
                    - columnheader "Monthly Total"
            - rowgroup:
                - row "Housing 1 €1,200.00":
                    - cell "Housing"
                    - cell "1"
                    - cell "€1,200.00"
                - row "Subscriptions 41 €725.88":
                    - cell "Subscriptions"
                    - cell "41"
                    - cell "€725.88"
                - row "Utilities 2 €90.00":
                    - cell "Utilities"
                    - cell "2"
                    - cell "€90.00"
    - region "Upcoming Renewals":
        - heading "Upcoming Renewals" [level=2]
        - list:
            - listitem: Netflix Subscriptions 06/20/2026 15 days remaining
    - region "Expired Contracts":
        - heading "Expired Contracts" [level=2]
        - paragraph: No expired contracts.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Welcome Dashboard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:5174');
  6  |   });
  7  |
  8  |   test('US1 – shows total monthly spending', async ({ page }) => {
  9  |     await expect(page.getByRole('heading', { name: /monthly spending/i })).toBeVisible();
  10 |     const total = page.locator('.spending-overview__total');
  11 |     await expect(total).toBeVisible();
  12 |   });
  13 |
  14 |   test('US2 – shows contracts grouped by category', async ({ page }) => {
  15 |     const section = page.getByRole('region', { name: 'Contracts by category' });
> 16 |     await expect(section.getByRole('heading', { name: /by category/i })).toBeVisible();
     |                                                                          ^ Error: expect(locator).toBeVisible() failed
  17 |     await expect(section.getByText('Housing')).toBeVisible();
  18 |     await expect(section.getByText('Utilities')).toBeVisible();
  19 |     await expect(section.getByText('Subscriptions')).toBeVisible();
  20 |   });
  21 |
  22 |   test('US3 – shows upcoming renewals section', async ({ page }) => {
  23 |     await expect(page.getByRole('heading', { name: /upcoming renewals/i })).toBeVisible();
  24 |   });
  25 |
  26 |   test('all three sections visible without scrolling at 1280x800', async ({ page }) => {
  27 |     await page.setViewportSize({ width: 1280, height: 800 });
  28 |     await page.goto('http://localhost:5174');
  29 |
  30 |     const spending = page.getByRole('heading', { name: /monthly spending/i });
  31 |     const category = page.getByRole('heading', { name: /by category/i });
  32 |     const renewals = page.getByRole('heading', { name: /upcoming renewals/i });
  33 |
  34 |     await expect(spending).toBeInViewport();
  35 |     await expect(category).toBeInViewport();
  36 |     await expect(renewals).toBeInViewport();
  37 |   });
  38 |
  39 |   test('empty state – no contracts shows zero total', async ({ page }) => {
  40 |     await expect(
  41 |       page.locator('.spending-overview__total, .spending-overview__empty'),
  42 |     ).toBeVisible();
  43 |   });
  44 |
  45 |   test('US4 – shows expired contracts section heading', async ({ page }) => {
  46 |     await expect(page.getByRole('heading', { name: /expired contracts/i })).toBeVisible();
  47 |   });
  48 |
  49 |   test('US4 – expired contracts panel has neutral empty state when no contracts are expired', async ({
  50 |     page,
  51 |   }) => {
  52 |     await expect(page.getByText(/no expired contracts/i)).toBeVisible();
  53 |     const section = page.getByRole('region', { name: /expired contracts/i });
  54 |     await expect(section.locator('.border-amber-200')).toHaveCount(0);
  55 |   });
  56 | });
  57 |
```
