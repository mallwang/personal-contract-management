# Quickstart: Validating Contract Export and Import

## Prerequisites

- App running: `pnpm dev` from the project root
- At least two contracts exist (or seed the DB: `pnpm --filter backend db:seed`)
- Browser: Chrome or Firefox

---

## Scenario 1: Export to JSON

1. Open `http://localhost:5173/contracts`
2. Click **Export → Export to JSON**
3. A file named `contracts-YYYY-MM-DD.json` downloads

**Verify**:
- File is valid JSON (`JSON.parse` succeeds)
- Top level is an array; each element has all fields from `data-model.md` (Export JSON section)
- `cancellationPeriod` is a nested object `{ value, unit }` or `null`
- Field values match what is shown in the contracts list UI

---

## Scenario 2: Export to Excel

1. Open `http://localhost:5173/contracts`
2. Click **Export → Export to Excel**
3. A file named `contracts-YYYY-MM-DD.xlsx` downloads

**Verify** (open in Excel or LibreOffice Calc):
- Row 1 contains the column headers listed in `data-model.md` (Export Excel section), in order
- `cancellationPeriod.value` and `cancellationPeriod.unit` are separate columns
- One data row per contract; values match the UI

---

## Scenario 3: Import with Non-Standard Column Names

Create a test file with intentionally non-standard headers:

**Excel** (`test-import.xlsx`) — columns:
`Contract Name | Monthly Cost | Billing Frequency | Start Date | Type | Notes`

**JSON** (`test-import.json`):
```json
[
  {
    "Contract Name": "Test Subscription",
    "Monthly Cost": 9.99,
    "Billing Frequency": "MONTHLY",
    "Start Date": "2024-01-01",
    "Type": "SUBSCRIPTIONS",
    "Notes": "Imported via test"
  }
]
```

**Steps**:
1. Open `http://localhost:5173/contracts/import`
2. Upload the test file
3. Inspect the mapping preview:

   | Source column | Expected auto-mapping |
   |---|---|
   | Contract Name | `name` |
   | Monthly Cost | `amount` |
   | Billing Frequency | `billingInterval` |
   | Start Date | `startDate` |
   | Type | `category` |
   | Notes | `details` |

4. Click **Confirm**
5. Import result shows: 1 total, 1 created, 0 failed
6. Navigate to `/contracts` — the new contract appears with correct values

---

## Scenario 4: Manual Mapping Override

1. Create a file with a column named `"Vendor"` (not in the synonym table)
2. Upload at `http://localhost:5173/contracts/import`
3. **Verify**: "Vendor" column is shown as "Unmapped" in the preview
4. Change the assignment to **Skip**
5. Confirm — import proceeds without that column

**Also verify**: If you leave a required field (`name`, `amount`, `billingInterval`, `category`)
unmapped and click Confirm, the button should remain disabled and the required columns should
be highlighted.

---

## Scenario 5: Partial Import — Some Rows Fail

Create a file with two rows:
- Row 1: all required fields valid
- Row 2: `category` = `"INVALID"` (not a recognised enum value)

**Steps**:
1. Upload and confirm the import
2. Import result shows: 2 total, 1 created, 1 failed
3. The failed row lists row number 2 and a descriptive error message
4. The contract from row 1 exists in the contracts list

---

## Scenario 6: Round-Trip (Export then Re-Import)

1. Export all contracts to JSON (`contracts-YYYY-MM-DD.json`)
2. Navigate to `http://localhost:5173/contracts/import`
3. Upload the exported JSON file
4. **Verify mapping preview**: all columns auto-map correctly (all headers are exact database
   field names, so confidence = 1.0 on every column)
5. System-managed fields (`id`, `createdAt`, `updatedAt`) appear as auto-skipped rows in the
   preview, not as mappable columns
6. Confirm — new contracts are created (duplicates of the originals)

---

## Running Tests

**Unit tests** (column mapping, export formatting, import parsing):
```bash
pnpm --filter frontend test
```

Key files:
- `packages/frontend/tests/unit/columnMapping.test.ts`
- `packages/frontend/tests/unit/exportService.test.ts`
- `packages/frontend/tests/unit/importParsing.test.ts`

**E2E tests**:
```bash
pnpm --filter frontend test:e2e -- --grep "export|import"
```

Key file: `packages/frontend/tests/e2e/exportImport.spec.ts`

All tests must pass before the implementation is considered complete per the project constitution.
