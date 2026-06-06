# API Contract: Dashboard Endpoint

**Endpoint**: `GET /api/dashboard`

**Breaking change in this feature**: The `upcomingRenewals` array items change shape.
`daysRemaining` is removed; `cancellationDeadline` and `daysUntilCancellationDeadline` are added.

---

## Response Schema

```typescript
DashboardResponse {
  totalMonthlySpending: number             // unchanged
  contractsByCategory: CategorySummary[]   // unchanged
  upcomingRenewals: UpcomingRenewal[]      // shape changes (see below)
  expiredContracts: ExpiredContract[]      // unchanged
}
```

---

## UpcomingRenewal Item (updated)

```typescript
UpcomingRenewal {
  id:                               string   // UUID
  name:                             string
  category:                         'UTILITIES' | 'SUBSCRIPTIONS' | 'INSURANCE' | 'HOUSING' | 'OTHER'
  endDate:                          string   // YYYY-MM-DD — contract end date
  cancellationDeadline:             string   // YYYY-MM-DD — last date to act (endDate − cancellationPeriod)
  daysUntilCancellationDeadline:    number   // integer; negative = deadline already passed (overdue)
}
```

---

## Example Response Payload

```json
{
  "totalMonthlySpending": 157.50,
  "contractsByCategory": [ ... ],
  "upcomingRenewals": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Home Insurance",
      "category": "INSURANCE",
      "endDate": "2026-10-01",
      "cancellationDeadline": "2026-07-01",
      "daysUntilCancellationDeadline": -5
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Streaming Service",
      "category": "SUBSCRIPTIONS",
      "endDate": "2026-07-15",
      "cancellationDeadline": "2026-07-01",
      "daysUntilCancellationDeadline": 25
    }
  ],
  "expiredContracts": [ ... ]
}
```

---

## Filtering Logic

The response includes only contracts that satisfy **both** conditions:

1. **Panel entry date reached**: `today >= cancellationDeadline − 30 days`
2. **Contract not yet ended**: `today < endDate`

Contracts with no `cancellationPeriod` use `endDate` as the `cancellationDeadline`
(panel entry is 30 days before end date — matching the previous behaviour for such contracts).

LIFETIME billing-interval contracts are excluded.

---

## Sorting

Items are ordered by `daysUntilCancellationDeadline` ascending (most negative first),
with `name` alphabetically as tiebreaker. Overdue contracts therefore always appear before
upcoming ones.

---

## Validation (Zod)

The shared `UpcomingRenewalSchema` enforces:

```typescript
z.object({
  id:                            z.string().uuid(),
  name:                          z.string(),
  category:                      CategoryEnum,
  endDate:                       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cancellationDeadline:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysUntilCancellationDeadline: z.number().int(),
})
```

---

## Unchanged API Surfaces

All other endpoints are unaffected by this feature.
