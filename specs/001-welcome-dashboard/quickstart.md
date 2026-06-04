# Quickstart: Welcome Dashboard

**Purpose**: Validate the welcome dashboard end-to-end after implementation.

## Prerequisites

- Node.js LTS (v22+)
- pnpm v9+

## Setup

```bash
pnpm install
pnpm --filter backend db:migrate   # create SQLite schema
pnpm --filter backend db:seed      # load sample contracts
```

The seed script creates:

| Contract | Category | Monthly | Status | End Date |
|----------|----------|---------|--------|----------|
| Rent | HOUSING | €1,200.00 | ACTIVE | — |
| Electricity | UTILITIES | €55.00 | ACTIVE | — |
| Internet | UTILITIES | €35.00 | ACTIVE | — |
| Netflix | SUBSCRIPTIONS | €15.99 | ACTIVE | 30 days from today |
| Spotify | SUBSCRIPTIONS | €10.99 | ACTIVE | — |
| GitHub Copilot | SUBSCRIPTIONS | €19.00 | ACTIVE | — |
| Adobe CC | SUBSCRIPTIONS | €11.52 | ACTIVE | — |
| Old gym | OTHER | €30.00 | INACTIVE | — |

Expected totals: **€1,347.50/month** active; **1 upcoming renewal** (Netflix).

## Run the Application

```bash
pnpm --filter backend dev    # API server → http://localhost:3000
pnpm --filter frontend dev   # Frontend  → http://localhost:5173
```

## Validate Each User Story

### US1 — Spending Overview

1. Open `http://localhost:5173`
2. Confirm the total monthly spending shows **€1,347.50**
3. Confirm the "Old gym" (INACTIVE) contract does NOT contribute to the total
4. Confirm the page fits within a 1280×800 viewport without scrolling

### US2 — Contracts by Category

1. Confirm four categories appear: Housing, Utilities, Subscriptions, Other
   - Wait — "Old gym" is INACTIVE, so OTHER should not appear
   - Confirm only Housing, Utilities, Subscriptions are listed
2. Confirm counts and totals match the seed data above

### US3 — Upcoming Renewals

1. Confirm Netflix appears in the renewals section with correct days remaining
2. Confirm contracts without an end date do NOT appear in renewals
3. To test empty state: temporarily update the Netflix end date to > 30 days away and reload;
   confirm "No renewals due soon" message appears

### Empty State

1. Remove all seed data: `pnpm --filter backend db:reset`
2. Reload the dashboard; confirm all three sections show their empty-state messages

## API Smoke Test

```bash
curl http://localhost:3000/api/dashboard | jq .
```

Verify the response matches the shape defined in [contracts/dashboard.md](contracts/dashboard.md).

## Run All Tests

```bash
pnpm test                           # unit + integration (all packages)
pnpm --filter frontend test:e2e     # Playwright e2e (requires running app)
```

All tests MUST pass before the feature is considered complete.
