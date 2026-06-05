# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multilanguage.spec.ts >> Multilanguage Support >> US1 – switching back to English reverts all text
- Location: tests/e2e/multilanguage.spec.ts:66:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Vertragsübersicht|Monatliche/i)
Expected: visible
Error: strict mode violation: getByText(/Vertragsübersicht|Monatliche/i) resolved to 2 elements:
    1) <p class="text-sm text-[--color-muted-foreground]">Ihre Vertragsübersicht</p> aka getByText('Ihre Vertragsübersicht')
    2) <span role="tooltip" class="pointer-events-none absolute left-0 top-full z-50 mt-1 w-64 rounded bg-foreground px-2.5 py-2 text-xs leading-relaxed text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Durchschnittliche monatliche Kosten aller aktiven…</span> aka getByRole('tooltip', { name: 'Durchschnittliche monatliche' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Vertragsübersicht|Monatliche/i)

```

# Page snapshot

```yaml
- generic [ref=e2]:
    - group "Language" [ref=e4]:
        - button "English" [ref=e5]
        - button "Deutsch" [active] [pressed] [ref=e6]
    - main [ref=e8]:
        - generic [ref=e9]:
            - generic [ref=e10]:
                - heading "Dashboard" [level=1] [ref=e11]
                - paragraph [ref=e12]: Ihre Vertragsübersicht
            - link "Verträge verwalten" [ref=e13] [cursor=pointer]:
                - /url: /contracts
        - generic [ref=e14]:
            - region "Monatliche Ausgaben" [ref=e15]:
                - generic [ref=e16]:
                    - generic [ref=e17]:
                        - heading "Monatliche Ausgaben Monthly spending calculation info Durchschnittliche monatliche Kosten aller aktiven Verträge. Jährliche Beträge ÷ 12, vierteljährliche ÷ 3, wöchentliche × 4,3. Einmalige Verträge werden nicht berücksichtigt." [level=2] [ref=e18]:
                            - generic [ref=e19]:
                                - text: Monatliche Ausgaben
                                - generic [ref=e20]:
                                    - button "Monthly spending calculation info" [ref=e21]:
                                        - img [ref=e22]
                                    - tooltip "Durchschnittliche monatliche Kosten aller aktiven Verträge. Jährliche Beträge ÷ 12, vierteljährliche ÷ 3, wöchentliche × 4,3. Einmalige Verträge werden nicht berücksichtigt."
                        - img [ref=e24]
                    - generic [ref=e27]:
                        - paragraph [ref=e28]: 2.065,87 €
                        - paragraph [ref=e29]: über alle aktiven Verträge
            - region "Nach Kategorie" [ref=e30]:
                - generic [ref=e31]:
                    - heading "Nach Kategorie" [level=2] [ref=e33]
                    - table [ref=e35]:
                        - rowgroup [ref=e36]:
                            - row "Kategorie Verträge Monatssumme" [ref=e37]:
                                - columnheader "Kategorie" [ref=e38]
                                - columnheader "Verträge" [ref=e39]
                                - columnheader "Monatssumme" [ref=e40]
                        - rowgroup [ref=e41]:
                            - row "Housing 1 1.200,00 €" [ref=e42]:
                                - cell "Housing" [ref=e43]
                                - cell "1" [ref=e44]
                                - cell "1.200,00 €" [ref=e45]
                            - row "Subscriptions 43 775,87 €" [ref=e46]:
                                - cell "Subscriptions" [ref=e47]
                                - cell "43" [ref=e48]
                                - cell "775,87 €" [ref=e49]
                            - row "Utilities 2 90,00 €" [ref=e50]:
                                - cell "Utilities" [ref=e51]
                                - cell "2" [ref=e52]
                                - cell "90,00 €" [ref=e53]
            - region "Bevorstehende Verlängerungen" [ref=e54]:
                - generic [ref=e55]:
                    - generic [ref=e56]:
                        - heading "Bevorstehende Verlängerungen" [level=2] [ref=e57]
                        - img [ref=e58]
                    - list [ref=e63]:
                        - listitem [ref=e64]:
                            - generic [ref=e65]:
                                - generic [ref=e66]: Netflix
                                - generic [ref=e67]: Abonnements
                            - generic [ref=e68]:
                                - generic [ref=e69]: 20.06.2026
                                - generic [ref=e70]: 15 Tage verbleibend
            - region "Abgelaufene Verträge" [ref=e71]:
                - generic [ref=e72]:
                    - generic [ref=e73]:
                        - heading "Abgelaufene Verträge" [level=2] [ref=e74]
                        - img [ref=e75]
                    - paragraph [ref=e78]: Keine abgelaufenen Verträge.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   |
  3   | test.describe('Multilanguage Support', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Clear stored language preference before each test
  6   |     await page.goto('http://localhost:5174');
  7   |     await page.evaluate(() => localStorage.removeItem('pcm-lang'));
  8   |   });
  9   |
  10  |   // US1: Instant language switching
  11  |   test('US1 – language switcher is visible on the dashboard', async ({ page }) => {
  12  |     await page.goto('http://localhost:5174');
  13  |     await expect(
  14  |       page
  15  |         .getByRole('button', { name: /Deutsch|DE/i })
  16  |         .or(page.locator('select').filter({ hasText: /Deutsch|DE/i })),
  17  |     ).toBeVisible();
  18  |   });
  19  |
  20  |   test('US1 – switching from English to German updates all visible text without page reload', async ({
  21  |     page,
  22  |   }) => {
  23  |     await page.goto('http://localhost:5174');
  24  |     // Verify English heading is shown
  25  |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  26  |
  27  |     // Switch to German - detect if it's a button or select
  28  |     const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
  29  |     if (await deButton.isVisible()) {
  30  |       await deButton.click();
  31  |     } else {
  32  |       await page
  33  |         .locator('select')
  34  |         .filter({ hasText: /Deutsch|DE/i })
  35  |         .selectOption('de');
  36  |     }
  37  |
  38  |     // Page should NOT have reloaded - check URL hasn't changed
  39  |     await expect(page).toHaveURL('http://localhost:5174/');
  40  |
  41  |     // German text should now be visible (subtitle changes)
  42  |     await expect(page.getByText(/Vertragsübersicht|Verträge verwalten|Monatliche/i)).toBeVisible();
  43  |   });
  44  |
  45  |   test('US1 – switching language preserves form input state', async ({ page }) => {
  46  |     await page.goto('http://localhost:5174/contracts/new');
  47  |
  48  |     // Type a value in the name field
  49  |     await page.getByLabel(/^name/i).fill('Test Contract');
  50  |
  51  |     // Switch to German
  52  |     const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
  53  |     if (await deButton.isVisible()) {
  54  |       await deButton.click();
  55  |     } else {
  56  |       await page
  57  |         .locator('select')
  58  |         .filter({ hasText: /Deutsch|DE/i })
  59  |         .selectOption('de');
  60  |     }
  61  |
  62  |     // Form data must still be present
  63  |     await expect(page.getByLabel(/^name/i)).toHaveValue('Test Contract');
  64  |   });
  65  |
  66  |   test('US1 – switching back to English reverts all text', async ({ page }) => {
  67  |     await page.goto('http://localhost:5174');
  68  |
  69  |     // Switch to German
  70  |     const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
  71  |     if (await deButton.isVisible()) {
  72  |       await deButton.click();
  73  |     }
> 74  |     await expect(page.getByText(/Vertragsübersicht|Monatliche/i)).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  75  |
  76  |     // Switch back to English
  77  |     const enButton = page.getByRole('button', { name: /English|EN/i });
  78  |     if (await enButton.isVisible()) {
  79  |       await enButton.click();
  80  |     }
  81  |     await expect(page.getByText(/Your contract overview/i)).toBeVisible();
  82  |   });
  83  |
  84  |   // US2: Language preference persistence
  85  |   test('US2 – selected language is persisted after page reload', async ({ page }) => {
  86  |     await page.goto('http://localhost:5174');
  87  |
  88  |     // Switch to German
  89  |     const deButton = page.getByRole('button', { name: /Deutsch|DE/i });
  90  |     if (await deButton.isVisible()) {
  91  |       await deButton.click();
  92  |     }
  93  |
  94  |     // Reload the page
  95  |     await page.reload();
  96  |
  97  |     // Should still be in German
  98  |     await expect(page.getByText(/Vertragsübersicht|Monatliche|Verträge verwalten/i)).toBeVisible();
  99  |   });
  100 |
  101 |   test('US2 – first-time user sees English by default', async ({ page }) => {
  102 |     await page.goto('http://localhost:5174');
  103 |     await expect(page.getByText(/Your contract overview/i)).toBeVisible();
  104 |   });
  105 |
  106 |   // US3: Switcher accessible from all pages
  107 |   test('US3 – language switcher is visible on contract list page', async ({ page }) => {
  108 |     await page.goto('http://localhost:5174/contracts');
  109 |     const switcher = page.getByRole('button', { name: /Deutsch|EN|DE/i }).first();
  110 |     await expect(switcher).toBeVisible();
  111 |   });
  112 |
  113 |   test('US3 – language switcher is visible on add contract page', async ({ page }) => {
  114 |     await page.goto('http://localhost:5174/contracts/new');
  115 |     const switcher = page.getByRole('button', { name: /Deutsch|EN|DE/i }).first();
  116 |     await expect(switcher).toBeVisible();
  117 |   });
  118 | });
  119 |
```
