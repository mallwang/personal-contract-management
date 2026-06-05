# API Contract: Dashboard Endpoint

**Endpoint**: `GET /api/dashboard`
**Handler**: `packages/backend/src/routes/dashboard.ts`
**Schema source**: `packages/shared/src/schemas/dashboard.ts`

---

## Response Shape (updated)

```json
{
  "totalMonthlySpending": 0.0,
  "contractsByCategory": [...],
  "upcomingRenewals": [...],
  "expiredContracts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Old Gym Membership",
      "category": "OTHER",
      "endDate": "2026-04-15",
      "daysOverdue": 51
    }
  ]
}
```

---

## New Field: `expiredContracts`

| Property      | Type     | Description |
|---------------|----------|-------------|
| `id`          | string (UUID) | Contract identifier |
| `name`        | string   | Contract name (anonymised if toggle active) |
| `category`    | string (enum) | One of: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER` |
| `endDate`     | string   | ISO date `YYYY-MM-DD`; strictly in the past |
| `daysOverdue` | integer ≥ 1 | Calendar days since the end date |

**Ordering**: Descending by `endDate` (most recently expired first).

**Filtering**:
- Only contracts with a non-null `end_date` that is `< DATE('now')`.
- `LIFETIME` billing interval contracts are excluded.
- No status filter (both `ACTIVE` and `INACTIVE` contracts are included if their end date has passed).

---

## Unchanged Fields

| Field                  | Change  |
|------------------------|---------|
| `totalMonthlySpending` | No change |
| `contractsByCategory`  | No change |
| `upcomingRenewals`     | No change |

---

## Validation

The existing `DashboardResponseSchema` in `packages/shared/src/schemas/dashboard.ts` is extended:

```ts
export const DashboardResponseSchema = z.object({
  totalMonthlySpending: z.number().nonnegative(),
  contractsByCategory: z.array(CategorySummarySchema),
  upcomingRenewals: z.array(UpcomingRenewalSchema),
  expiredContracts: z.array(ExpiredContractSchema),   // new
});
```

The frontend `fetchDashboard()` function in `packages/frontend/src/services/api.ts` parses the response through this schema — no changes to the fetch function itself are needed beyond the schema update in the shared package.
