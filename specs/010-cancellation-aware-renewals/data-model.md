# Data Model: Cancellation-Aware Renewals Panel

**Branch**: `010-cancellation-aware-renewals` | **Date**: 2026-06-06

## Changed: CancellationPeriodUnit Enum

**Location**: `packages/shared/src/types/contract.ts`

| Unit    | Already exists | Change |
|---------|---------------|--------|
| DAYS    | ✅ Yes         | No change |
| WEEKS   | ✅ Yes         | No change |
| MONTHS  | ✅ Yes         | No change |
| YEARS   | ❌ No          | **Add** |

The Zod schema `CancellationPeriodUnitSchema` in `packages/shared/src/schemas/contract.ts`
must also be extended to include `'YEARS'`.

---

## Changed: DB Schema — `cancellation_period_unit` CHECK Constraint

**Location**: `packages/backend/src/db/client.ts` → `runMigrations()`

**Current constraint**:
```sql
cancellation_period_unit TEXT CHECK(
  cancellation_period_unit IS NULL
  OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS')
)
```

**Updated constraint**:
```sql
cancellation_period_unit TEXT CHECK(
  cancellation_period_unit IS NULL
  OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS','YEARS')
)
```

**Migration approach** (detect-and-rebuild):
1. Query `sqlite_master` for the `contracts` table's `CREATE TABLE` statement.
2. If it does not contain the string `'YEARS'`, execute a table rebuild:
   - Create `contracts_new` with the updated CHECK constraint (identical schema otherwise).
   - `INSERT INTO contracts_new SELECT * FROM contracts;`
   - `DROP TABLE contracts;`
   - `ALTER TABLE contracts_new RENAME TO contracts;`
3. If `'YEARS'` is already present, skip (idempotent).

---

## Changed: UpcomingRenewal — API Response Shape

**Location**: `packages/shared/src/schemas/dashboard.ts`

### Current shape

```typescript
UpcomingRenewal {
  id: string (UUID)
  name: string
  category: Category
  endDate: string          // YYYY-MM-DD — contract end date
  daysRemaining: number    // non-negative integer, days until endDate
}
```

### New shape

```typescript
UpcomingRenewal {
  id: string (UUID)
  name: string
  category: Category
  endDate: string                        // YYYY-MM-DD — contract end date (unchanged)
  cancellationDeadline: string           // YYYY-MM-DD — endDate minus cancellationPeriod
  daysUntilCancellationDeadline: number  // signed integer: negative = overdue
}
```

**Breaking change**: `daysRemaining` is removed. The only consumer is
`packages/frontend/src/components/UpcomingRenewals.tsx`.

---

## Derived Values — Calculation Rules

All calculations happen in TypeScript application code (see `research.md`).

### Cancellation Deadline

```
if contract.cancellationPeriod is null:
  cancellationDeadline = endDate            // deadline equals end date

else:
  cancellationDeadline = endDate − cancellationPeriod
  
  Where subtraction uses calendar-accurate JavaScript Date methods:
    DAYS  → date.setDate(date.getDate() - value)
    WEEKS → date.setDate(date.getDate() - value * 7)
    MONTHS→ date.setMonth(date.getMonth() - value)   // handles Feb rollover
    YEARS → date.setFullYear(date.getFullYear() - value)
```

### Panel Entry Date (visibility threshold)

```
panelEntryDate = cancellationDeadline − 30 days
```

### Visibility Rule

A contract appears in the upcoming renewals panel when:
```
today >= panelEntryDate   AND   today < endDate
```

i.e., the contract's cancellation window has opened but the contract has not yet ended.

### daysUntilCancellationDeadline

```
daysUntilCancellationDeadline = Math.round(
  (cancellationDeadline.getTime() − today.getTime()) / 86_400_000
)
```

Negative values mean the cancellation deadline is already past (overdue).

---

## Unchanged Entities

- `Contract` entity: no structural changes (the existing `cancellationPeriod` field already
  stores `{ value, unit }` — only `unit` enum gains YEARS).
- `ExpiredContract` response shape: unchanged.
- `DashboardResponse` shape: unchanged (still has `upcomingRenewals` array).
- All other DB columns: unchanged.
