# Quickstart Validation Guide: Flexible Billing Intervals

## Prerequisites

- Node.js LTS and pnpm installed
- Project dependencies installed: `pnpm install`
- Shared package built: `pnpm --filter @pcm/shared build`
- No running dev server (the validation commands start their own)

---

## 1. Unit & Integration Tests

Run all backend tests (unit + integration) to validate the schema, service logic, and API endpoints:

```bash
pnpm --filter @pcm/backend test
```

**Expected**: All tests pass, including:
- Schema tests: `BillingIntervalSchema` accepts all 5 values and rejects invalid strings
- `ContractService` tests: create/update/list with each billing interval; `amount` field stored and retrieved correctly
- `DashboardService` tests: monthly normalization — a `QUARTERLY` contract with `amount=30` contributes `10` to monthly total; a `LIFETIME` contract contributes `0`
- Integration: `POST /api/contracts` with `billingInterval: "YEARLY"` returns 201 with correct fields; `monthlyAmount` in body returns 400

Run all frontend unit tests:

```bash
pnpm --filter @pcm/frontend test
```

**Expected**: All tests pass, including:
- ContractForm renders billing interval selector with 5 options
- ContractTable renders amount and interval label (e.g., `€49.00 / Quarterly`)

---

## 2. Database Migration Validation

Start with an existing database that has the old `monthly_amount` column (or seed one):

```bash
# Reset to a known state
pnpm --filter @pcm/backend db:reset

# Run the migration
pnpm --filter @pcm/backend db:migrate
```

**Expected**: Migration completes without errors. Verify via the backend seed:

```bash
pnpm --filter @pcm/backend db:seed
```

Then start the backend and confirm the API returns `amount` and `billingInterval` (not `monthlyAmount`):

```bash
pnpm --filter @pcm/backend dev &
curl http://localhost:3001/api/contracts | jq '.[0] | {amount, billingInterval}'
```

**Expected output**: `{ "amount": <number>, "billingInterval": "<INTERVAL>" }` with no `monthlyAmount` field.

---

## 3. Manual UI Validation

Start the full dev stack:

```bash
pnpm dev
```

Open `http://localhost:5173/contracts`.

### Create a contract with each interval

For each billing interval (Weekly, Monthly, Quarterly, Yearly, Lifetime):
1. Click **Add contract**
2. Fill in name and amount, select the interval from the dropdown
3. Submit

**Expected**: Contract appears in the list with the correct `€X.XX / [Interval]` display.

### Verify the dashboard normalizes correctly

1. Add an **active** contract: amount `€120`, interval `Yearly`
2. Navigate to the dashboard (`/`)
3. Check **Monthly Spending** total

**Expected**: The contract contributes `€10.00 / month` to the total.

### Verify Lifetime is excluded from recurring totals

1. Add an **active** contract: amount `€199`, interval `Lifetime`
2. Navigate to the dashboard

**Expected**: The lifetime contract does NOT increase the monthly spending total.

### Verify Lifetime excluded from renewals

1. Ensure the lifetime contract above has an `endDate` set within the next 30 days
2. Navigate to the dashboard, check **Upcoming Renewals**

**Expected**: The lifetime contract does NOT appear in the upcoming renewals list.

---

## 4. End-to-End Tests

```bash
pnpm --filter @pcm/frontend test:e2e
```

**Expected**: All Playwright tests pass, including updated contract creation flow with interval selection, and dashboard spending total validation.

---

## Key Validation Scenarios Summary

| Scenario | How to check | Expected |
|----------|-------------|----------|
| All 5 intervals selectable | UI form, interval dropdown | 5 options visible |
| Amount stored per interval | Create + list via API | `amount` + `billingInterval` returned |
| `monthlyAmount` gone | GET /api/contracts | No `monthlyAmount` field |
| Quarterly normalization | Dashboard after adding €30/quarter contract | +€10/month |
| Yearly normalization | Dashboard after adding €120/year contract | +€10/month |
| Lifetime excluded from total | Dashboard | €0 contribution |
| Lifetime excluded from renewals | Dashboard renewals section | Not listed |
| Existing data migrated | db:migrate on old DB | All rows have `amount` + `billingInterval` |
