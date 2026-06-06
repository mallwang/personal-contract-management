# Quickstart: Validating Cancellation-Aware Renewals

**Branch**: `010-cancellation-aware-renewals`

## Prerequisites

- Node.js LTS installed; pnpm available
- Running from the repo root
- Backend on port 3001; frontend on port 5174 (default dev config)

## Start the Application

```bash
pnpm --filter @pcm/backend run dev   # Terminal 1
pnpm --filter @pcm/frontend run dev  # Terminal 2
```

## Validation Scenarios

### Scenario 1: Contract with 3-month cancellation period appears early (P1 – core logic)

**Setup**: Create a contract via the UI or API with:
- End date: 4 months from today
- Cancellation period: 3 months

**Expected**: The contract appears immediately in the Upcoming Renewals panel.

**Verify**:
- Panel shows the contract name
- "Cancel by" date is 3 months before the end date (1 month from today)
- "Ends" date is 4 months from today
- Days remaining count is approximately 30 (the grace period buffer)

**Why it should appear**: `cancellationDeadline = endDate − 3 months ≈ 1 month from today`.
`panelEntryDate = cancellationDeadline − 30 days ≈ today`. Condition met.

---

### Scenario 2: Contract with 3-month cancellation period does NOT appear too early

**Setup**: Create a contract with:
- End date: 6 months from today
- Cancellation period: 3 months

**Expected**: The contract does NOT appear in the panel.

**Why it should not appear**: `cancellationDeadline = endDate − 3 months = 3 months from today`.
`panelEntryDate = cancellationDeadline − 30 days ≈ 2 months from today`. Not yet reached.

---

### Scenario 3: Contract with no cancellation period — default 30-day window

**Setup**: Create a contract with:
- End date: 20 days from today
- No cancellation period set

**Expected**: The contract appears in the panel (within the default 30-day window).

- `cancellationDeadline = endDate` (same date)
- `panelEntryDate = endDate − 30 days ≈ 10 days ago`
- Contract is visible; days shown ≈ 20

---

### Scenario 4: Overdue cancellation deadline — overdue indicator visible (P2 – urgency)

**Setup**: Create a contract with:
- End date: 2 months from today
- Cancellation period: 3 months

**Expected**: The contract appears in the panel with an overdue indicator.

**Why overdue**: `cancellationDeadline = endDate − 3 months ≈ 1 month ago` (already passed).
`panelEntryDate ≈ 61 days ago`. Condition met; `daysUntilCancellationDeadline` is negative.

- Badge should be styled distinctly (e.g. destructive/red)
- Days display should read "X days overdue" or show a negative/overdue count

---

### Scenario 5: Cancellation deadline and end date both visible (P3 – clarity)

**Setup**: Use any contract visible in the panel.

**Expected**: Each panel entry shows two dates:
- Cancel by: (cancellation deadline, distinct label)
- Ends: (contract end date, distinct label)

These must be different labels pointing to different dates for any contract with a
non-zero cancellation period.

---

### Scenario 6: Sorting — most urgent first

**Setup**: Ensure two contracts are visible in the panel, one overdue and one not yet overdue.

**Expected**: The overdue contract appears above the non-overdue one, regardless of end date.

---

### Scenario 7: YEARS unit — 1-year cancellation period

**Setup**: Create a contract with:
- End date: 13 months from today
- Cancellation period: 1 year

**Expected**: The contract appears in the panel (entry date ≈ 30 days ago).

- `cancellationDeadline = endDate − 1 year ≈ 1 month from today`
- `panelEntryDate ≈ 1 month from today − 30 days ≈ today`

---

### Scenario 8: Empty state

**Setup**: Ensure all contracts have either already ended or have cancellation deadlines
more than 30 days in the future.

**Expected**: The panel shows the empty-state message (e.g. "No renewals due soon.").

---

## Running Automated Tests

```bash
# Unit + integration tests (backend)
pnpm --filter @pcm/backend run test

# E2E tests
pnpm --filter @pcm/frontend run test:e2e
```

All tests must pass before the feature is considered complete.
