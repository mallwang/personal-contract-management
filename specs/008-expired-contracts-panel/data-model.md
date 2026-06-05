# Data Model: Expired Contracts Dashboard Panel

## Overview

This feature introduces no new database tables or schema changes. It adds a new derived query over the existing `contracts` table and a new response entity in the shared type layer.

---

## New Entity: `ExpiredContract`

Lives in `packages/shared/src/schemas/dashboard.ts` alongside `UpcomingRenewal`.

| Field        | Type                    | Constraints                      | Description                                     |
|--------------|-------------------------|----------------------------------|-------------------------------------------------|
| `id`         | `string` (UUID)         | non-null, matches contract UUID  | Contract identifier; used for navigation link   |
| `name`       | `string`                | non-null                         | Contract display name (may be anonymised)        |
| `category`   | `Category` enum         | non-null                         | One of UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER |
| `endDate`    | `string` (YYYY-MM-DD)   | non-null, past date              | The contract's end date                          |
| `daysOverdue`| `number` (integer ≥ 1)  | non-null                         | Calendar days since the end date                 |

### Zod Schema (to be added)

```ts
export const ExpiredContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysOverdue: z.number().int().positive(),
});

export type ExpiredContract = z.infer<typeof ExpiredContractSchema>;
```

---

## Updated Entity: `DashboardResponse`

The existing `DashboardResponse` gains one new field:

| Field               | Type                   | Change |
|---------------------|------------------------|--------|
| `expiredContracts`  | `ExpiredContract[]`    | **New** |

All existing fields (`totalMonthlySpending`, `contractsByCategory`, `upcomingRenewals`) are unchanged.

---

## Database Query

No schema migration is needed. The backend adds a new private method to `DashboardService`:

```sql
SELECT id, name, category, end_date
FROM contracts
WHERE end_date IS NOT NULL
  AND billing_interval != 'LIFETIME'
  AND end_date < DATE('now')
ORDER BY end_date DESC
```

- **`end_date < DATE('now')`** — strictly past, never includes today.
- **`billing_interval != 'LIFETIME'`** — excluded for the same reason as in upcoming renewals.
- **No status filter** — a contract marked `INACTIVE` by the user still appears if its end date has passed; the user may have set it inactive without having cancelled properly.
- **`ORDER BY end_date DESC`** — most-recently-expired first; most likely to be actionable.

The `daysOverdue` value is computed in the service layer (same pattern as `daysRemaining` in `getUpcomingRenewals`):

```ts
const today = new Date();
today.setHours(0, 0, 0, 0);
const end = new Date(row.end_date);
end.setHours(0, 0, 0, 0);
const daysOverdue = Math.round((today.getTime() - end.getTime()) / 86_400_000);
```

---

## Relationships

```
contracts (existing table)
    │
    └─► DashboardService.getExpiredContracts()
            │
            └─► ExpiredContract[]  ─► DashboardResponse.expiredContracts
```

No new relationships, foreign keys, or join tables are introduced.
