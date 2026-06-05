# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contracts.spec.ts >> Contract List & CRUD >> US1-new-fields – malformed service URL shows validation error
- Location: tests/e2e/contracts.spec.ts:167:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('alert')

```

```yaml
- group "Language":
    - button "English" [pressed]
    - button "Deutsch"
- main:
    - heading "Add Contract" [level=1]
    - text: Name *
    - textbox "Name *":
        - /placeholder: e.g. Netflix
        - text: Bad URL 1780669956806
    - text: Category *
    - combobox "Category *":
        - option "Utilities"
        - option "Subscriptions" [selected]
        - option "Insurance"
        - option "Housing"
        - option "Other"
    - text: Amount *
    - spinbutton "Amount *": '5'
    - text: Billing Interval *
    - combobox "Billing Interval *":
        - option "Weekly"
        - option "Monthly" [selected]
        - option "Quarterly"
        - option "Yearly"
        - option "Lifetime"
    - text: Status *
    - combobox "Status *":
        - option "Active" [selected]
        - option "Inactive"
    - text: Start Date
    - textbox "Start Date"
    - text: End Date
    - textbox "End Date"
    - text: Details
    - textbox "Details":
        - /placeholder: Additional notes about this contract
    - text: 0/2000 Service URL
    - textbox "Service URL":
        - /placeholder: https://example.com
        - text: bad-url
    - text: Cancellation Period
    - spinbutton "Cancellation Period"
    - combobox "Cancellation Unit":
        - option "Days"
        - option "Weeks"
        - option "Months" [selected]
    - checkbox "Anonymize this contract"
    - text: Anonymize this contract Always hide the name of this contract in the list view
    - button "Add Contract"
    - button "Cancel"
```

# Test source

```ts
  76  |   test('US2 – create form shows validation error when name is empty', async ({ page }) => {
  77  |     await page.getByRole('link', { name: /add contract/i }).click();
  78  |     await page.getByLabel(/^amount/i).fill('10');
  79  |     await page.getByRole('button', { name: /add contract/i }).click();
  80  |     await expect(page.getByRole('alert')).toBeVisible();
  81  |     await expect(page).toHaveURL(/\/contracts\/new/);
  82  |   });
  83  |
  84  |   test('US2 – cancel from create form returns to contract list', async ({ page }) => {
  85  |     await page.getByRole('link', { name: /add contract/i }).click();
  86  |     await page.getByRole('button', { name: /cancel/i }).click();
  87  |     await expect(page).toHaveURL(/\/contracts$/);
  88  |   });
  89  |
  90  |   test('US3 – edit a contract and update amount', async ({ page }) => {
  91  |     const uniqueName = `Edit Me ${Date.now()}`;
  92  |     await page.getByRole('link', { name: /add contract/i }).click();
  93  |     await page.getByLabel(/^name/i).fill(uniqueName);
  94  |     await page.getByLabel(/^amount/i).fill('10');
  95  |     await page.getByLabel(/billing interval/i).selectOption('MONTHLY');
  96  |     await page.getByRole('button', { name: /add contract/i }).click();
  97  |     await expect(page).toHaveURL(/\/contracts$/);
  98  |
  99  |     const row = page.locator('tr').filter({ hasText: uniqueName });
  100 |     await row.getByRole('link', { name: /edit/i }).click();
  101 |     await expect(page).toHaveURL(/\/contracts\/.+\/edit/);
  102 |     await expect(page.getByRole('heading', { name: /edit contract/i })).toBeVisible();
  103 |
  104 |     await page.getByLabel(/^amount/i).clear();
  105 |     await page.getByLabel(/^amount/i).fill('99.99');
  106 |     await page.getByLabel(/billing interval/i).selectOption('YEARLY');
  107 |     await page.getByRole('button', { name: /save changes/i }).click();
  108 |
  109 |     await expect(page).toHaveURL(/\/contracts$/);
  110 |     const updatedRow = page.locator('tr').filter({ hasText: uniqueName });
  111 |     await expect(updatedRow.getByText(/99\.99/)).toBeVisible();
  112 |     await expect(updatedRow.getByText(/Yearly/)).toBeVisible();
  113 |   });
  114 |
  115 |   test('US1-new-fields – create a contract with all four new fields and see it in the list', async ({
  116 |     page,
  117 |   }) => {
  118 |     const uniqueName = `New Fields ${Date.now()}`;
  119 |
  120 |     await page.getByRole('link', { name: /add contract/i }).click();
  121 |     await page.getByLabel(/^name/i).fill(uniqueName);
  122 |     await page.getByLabel(/^amount/i).fill('12.99');
  123 |     await page.getByLabel(/start date/i).fill('2024-01-15');
  124 |     await page.getByLabel(/details/i).fill('Auto-renews each year');
  125 |     await page.getByLabel(/service url/i).fill('https://example.com');
  126 |     await page.getByLabel(/cancellation period/i).fill('30');
  127 |     await page.getByLabel(/cancellation unit/i).selectOption('DAYS');
  128 |     await page.getByRole('button', { name: /add contract/i }).click();
  129 |
  130 |     await expect(page).toHaveURL(/\/contracts$/);
  131 |     await expect(page.locator('tr').filter({ hasText: uniqueName })).toBeVisible();
  132 |   });
  133 |
  134 |   test('US2-new-fields – edit round-trip preserves all four new fields', async ({ page }) => {
  135 |     const uniqueName = `Edit Fields ${Date.now()}`;
  136 |
  137 |     // Create with new fields
  138 |     await page.getByRole('link', { name: /add contract/i }).click();
  139 |     await page.getByLabel(/^name/i).fill(uniqueName);
  140 |     await page.getByLabel(/^amount/i).fill('9.99');
  141 |     await page.getByLabel(/start date/i).fill('2024-03-01');
  142 |     await page.getByLabel(/details/i).fill('Test notes');
  143 |     await page.getByLabel(/service url/i).fill('https://spotify.com');
  144 |     await page.getByLabel(/cancellation period/i).fill('14');
  145 |     await page.getByLabel(/cancellation unit/i).selectOption('WEEKS');
  146 |     await page.getByRole('button', { name: /add contract/i }).click();
  147 |     await expect(page).toHaveURL(/\/contracts$/);
  148 |
  149 |     // Open edit
  150 |     const row = page.locator('tr').filter({ hasText: uniqueName });
  151 |     await row.getByRole('link', { name: /edit/i }).click();
  152 |     await expect(page).toHaveURL(/\/contracts\/.+\/edit/);
  153 |
  154 |     // Assert all four new fields are pre-filled
  155 |     await expect(page.getByLabel(/start date/i)).toHaveValue('2024-03-01');
  156 |     await expect(page.getByLabel(/details/i)).toHaveValue('Test notes');
  157 |     await expect(page.getByLabel(/service url/i)).toHaveValue('https://spotify.com');
  158 |     await expect(page.getByLabel(/cancellation period/i)).toHaveValue('14');
  159 |     const unitSelect = page.getByLabel(/cancellation unit/i);
  160 |     await expect(unitSelect).toHaveValue('WEEKS');
  161 |
  162 |     // Save and confirm no error
  163 |     await page.getByRole('button', { name: /save changes/i }).click();
  164 |     await expect(page).toHaveURL(/\/contracts$/);
  165 |   });
  166 |
  167 |   test('US1-new-fields – malformed service URL shows validation error', async ({ page }) => {
  168 |     await page.getByRole('link', { name: /add contract/i }).click();
  169 |     await page.getByLabel(/^name/i).fill(`Bad URL ${Date.now()}`);
  170 |     await page.getByLabel(/^amount/i).fill('5');
  171 |     await page.getByLabel(/service url/i).fill('bad-url');
  172 |     await page.getByRole('button', { name: /add contract/i }).click();
  173 |
  174 |     // Should stay on the new contract page with an error
  175 |     await expect(page).toHaveURL(/\/contracts\/new/);
> 176 |     await expect(page.getByRole('alert')).toBeVisible();
      |                                           ^ Error: expect(locator).toBeVisible() failed
  177 |   });
  178 |
  179 |   test('US4 – delete contract with Cancel keeps it in the list', async ({ page }) => {
  180 |     const uniqueName = `Delete Cancel ${Date.now()}`;
  181 |     await page.getByRole('link', { name: /add contract/i }).click();
  182 |     await page.getByLabel(/^name/i).fill(uniqueName);
  183 |     await page.getByLabel(/^amount/i).fill('5');
  184 |     await page.getByRole('button', { name: /add contract/i }).click();
  185 |     await expect(page).toHaveURL(/\/contracts$/);
  186 |
  187 |     const row = page.locator('tr').filter({ hasText: uniqueName });
  188 |     await row.getByRole('button', { name: /delete/i }).click();
  189 |     await expect(row.getByRole('button', { name: /confirm/i })).toBeVisible();
  190 |     await row.getByRole('button', { name: /cancel/i }).click();
  191 |     await expect(page.getByText(uniqueName)).toBeVisible();
  192 |   });
  193 |
  194 |   test('US4 – delete contract with Confirm removes it from the list', async ({ page }) => {
  195 |     const uniqueName = `Delete Me ${Date.now()}`;
  196 |     await page.getByRole('link', { name: /add contract/i }).click();
  197 |     await page.getByLabel(/^name/i).fill(uniqueName);
  198 |     await page.getByLabel(/^amount/i).fill('5');
  199 |     await page.getByRole('button', { name: /add contract/i }).click();
  200 |     await expect(page).toHaveURL(/\/contracts$/);
  201 |
  202 |     const row = page.locator('tr').filter({ hasText: uniqueName });
  203 |     await row.getByRole('button', { name: /delete/i }).click();
  204 |     await row.getByRole('button', { name: /confirm/i }).click();
  205 |     await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 5000 });
  206 |   });
  207 | });
  208 |
```
