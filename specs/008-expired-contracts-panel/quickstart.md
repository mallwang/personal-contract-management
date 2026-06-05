# Quickstart & Validation Guide: Expired Contracts Dashboard Panel

## Prerequisites

- Node.js LTS and pnpm installed
- Repo cloned, dependencies installed: `pnpm install`
- No running dev server (the guide starts a fresh one)

---

## Setup: Seed an Expired Contract

The easiest way to validate the feature is to insert a contract with a past end date via the seed script or the API. Alternatively, use the UI to create a contract and then manually update its end date via the database.

### Option A — SQLite direct (fastest)

```bash
# From repo root; adjust path if DB location differs
sqlite3 packages/backend/data/contracts.db \
  "INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
   VALUES (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
           'Expired Gym Membership', 'OTHER', 29.99, 'MONTHLY', 'ACTIVE', '2026-03-01',
           datetime('now'), datetime('now'));"
```

### Option B — Via UI

1. Start the dev server: `pnpm dev`
2. Open `http://localhost:5173`
3. Navigate to **Manage Contracts** → **Add Contract**
4. Fill in any name, select a category, enter an amount and billing interval
5. Set **End Date** to any date in the past (e.g., 2026-01-15)
6. Save the contract
7. Return to the Dashboard

---

## Validation Scenarios

### Scenario 1 — Expired contracts panel appears with warning styling

**Precondition**: At least one contract with a past end date exists.

1. Open `http://localhost:5173` (Dashboard)
2. **Expected**: A panel labelled "Expired Contracts" is visible below or alongside the "Upcoming Renewals" panel
3. **Expected**: The panel has an amber/orange-tinted background or border (visually distinct from other panels)
4. **Expected**: The expired contract's name, end date, and "X days overdue" badge are visible

### Scenario 2 — Days overdue is correct

**Precondition**: One contract with `end_date = 2026-03-01` (today = 2026-06-05 → 96 days overdue).

1. Open the Dashboard
2. **Expected**: The badge on that contract reads "96 days overdue" (or the current count based on today's date)

### Scenario 3 — Clicking a contract navigates to its edit page

1. Click on the expired contract's row in the panel
2. **Expected**: Browser navigates to `/contracts/<id>/edit`
3. **Expected**: The contract edit form loads with the correct contract data

### Scenario 4 — Empty state has no warning styling

**Precondition**: No contracts with a past end date.

1. Ensure all contracts have a future or null end date (or delete the test contract)
2. Reload the Dashboard
3. **Expected**: The expired contracts panel either shows a neutral "No expired contracts." message in non-amber styling, or is hidden entirely
4. **Expected**: No amber background is displayed

### Scenario 5 — Anonymization toggle is respected

**Precondition**: At least one expired contract exists; anonymization toggle is ON.

1. Click the name anonymization toggle in the layout
2. **Expected**: The contract name in the expired contracts panel is replaced with a fantasy name
3. Toggle back OFF
4. **Expected**: The real contract name reappears

### Scenario 6 — LIFETIME contracts are not shown

**Precondition**: Insert a contract with `billing_interval = 'LIFETIME'` and a past `end_date`.

1. Reload the Dashboard
2. **Expected**: The LIFETIME contract does NOT appear in the expired contracts panel

### Scenario 7 — API response shape

```bash
curl http://localhost:3000/api/dashboard | jq '.expiredContracts'
```

**Expected output** (with one expired contract):
```json
[
  {
    "id": "...",
    "name": "Expired Gym Membership",
    "category": "OTHER",
    "endDate": "2026-03-01",
    "daysOverdue": 96
  }
]
```

---

## Running Tests

```bash
# Backend unit tests (includes DashboardService tests)
pnpm --filter backend test

# Backend integration tests
pnpm --filter backend test:integration

# Frontend unit tests (includes ExpiredContracts component)
pnpm --filter frontend test

# End-to-end tests (dashboard spec)
pnpm --filter frontend test:e2e
```

All test suites must pass with zero failures before the feature is considered complete.

---

## References

- API contract: [contracts/dashboard-api.md](contracts/dashboard-api.md)
- Data model: [data-model.md](data-model.md)
- Spec: [spec.md](spec.md)
