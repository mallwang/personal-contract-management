# Data Model: Flexible Billing Intervals

## Modified Entity: Contract

The `Contract` entity in the shared package and SQLite `contracts` table is updated. The `monthlyAmount` / `monthly_amount` field is replaced by `amount` + `billingInterval` / `billing_interval`.

### TypeScript Interface (updated)

| Field             | Type              | Constraints                                                             | Notes                              |
|-------------------|-------------------|-------------------------------------------------------------------------|------------------------------------|
| `id`              | UUID string       | Primary key, immutable after creation                                   | Unchanged                          |
| `name`            | string            | Required, max 200 chars                                                 | Unchanged                          |
| `category`        | Category enum     | Required, one of: UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER  | Unchanged                          |
| `amount`          | number            | Required, ≥ 0                                                           | Replaces `monthlyAmount`           |
| `billingInterval` | BillingInterval   | Required, one of: WEEKLY, MONTHLY, QUARTERLY, YEARLY, LIFETIME         | **NEW**                            |
| `status`          | ContractStatus    | Required, one of: ACTIVE, INACTIVE; default ACTIVE                     | Unchanged                          |
| `endDate`         | ISO date string   | Optional (null = no fixed end date)                                     | Unchanged                          |
| `createdAt`       | ISO datetime      | Immutable, set on creation                                              | Unchanged                          |
| `updatedAt`       | ISO datetime      | Updated on every edit                                                   | Unchanged                          |

### New Type: BillingInterval

```
BillingInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME'
```

Display labels:
```
WEEKLY    → 'Weekly'
MONTHLY   → 'Monthly'
QUARTERLY → 'Quarterly'
YEARLY    → 'Yearly'
LIFETIME  → 'Lifetime'
```

### SQLite Column Mapping (updated)

| TypeScript field   | SQLite column      | Change                      |
|--------------------|--------------------|-----------------------------|
| `id`               | `id`               | Unchanged                   |
| `name`             | `name`             | Unchanged                   |
| `category`         | `category`         | Unchanged                   |
| `amount`           | `amount`           | **Replaces** `monthly_amount` |
| `billingInterval`  | `billing_interval` | **NEW**                     |
| `status`           | `status`           | Unchanged                   |
| `endDate`          | `end_date`         | Unchanged                   |
| `createdAt`        | `created_at`       | Unchanged                   |
| `updatedAt`        | `updated_at`       | Unchanged                   |

### Updated SQLite Schema (schema.sql — fresh databases)

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL CHECK(length(name) <= 200),
  category         TEXT NOT NULL CHECK(category IN (
                     'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
  amount           REAL NOT NULL CHECK(amount >= 0),
  billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
                     CHECK(billing_interval IN (
                       'WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK(status IN ('ACTIVE','INACTIVE')),
  end_date         TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
```

### Migration (existing databases)

Applied by `runMigrations` when `monthly_amount` column is detected:

```sql
ALTER TABLE contracts ADD COLUMN amount REAL NOT NULL DEFAULT 0.0;
ALTER TABLE contracts ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
  CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME'));
UPDATE contracts SET amount = monthly_amount;
ALTER TABLE contracts DROP COLUMN monthly_amount;
```

## Updated Shared Zod Schemas

### `BillingIntervalSchema` (new)

```
BillingIntervalSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'])
```

### `ContractSchema` (updated)

```
ContractSchema = {
  id:              z.string().uuid()
  name:            z.string().min(1).max(200)
  category:        z.enum([UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER])
  amount:          z.number().nonnegative()          ← replaces monthlyAmount
  billingInterval: BillingIntervalSchema             ← NEW
  status:          z.enum([ACTIVE, INACTIVE])
  endDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
  createdAt:       z.string()
  updatedAt:       z.string()
}
```

### `CreateContractBodySchema` (updated)

```
CreateContractBodySchema = {
  name:            z.string().min(1).max(200)
  category:        z.enum([...])
  amount:          z.number().nonnegative()          ← replaces monthlyAmount
  billingInterval: BillingIntervalSchema             ← NEW, required
  status:          z.enum([ACTIVE, INACTIVE])        — default ACTIVE
  endDate:         z.string().regex(...).nullable().optional()
}
```

### `UpdateContractBodySchema` (updated)

All fields of `CreateContractBodySchema` made partial — same as today.

## Dashboard Normalization

`DashboardService` continues to return `totalMonthlySpending` and per-category `monthlyTotal`. These are now computed as monthly equivalents using:

```
monthly_equivalent = amount × normalization_factor(billing_interval)
```

| billing_interval | factor       |
|-----------------|--------------|
| WEEKLY          | 52.0 / 12.0  |
| MONTHLY         | 1.0          |
| QUARTERLY       | 1.0 / 3.0    |
| YEARLY          | 1.0 / 12.0   |
| LIFETIME        | 0.0          |

LIFETIME contracts contribute €0 to all recurring spending totals.

## Upcoming Renewals

The `UpcomingRenewal` entity and `DashboardResponse` schema are **unchanged**. The SQL query gains a `billing_interval != 'LIFETIME'` filter so lifetime contracts do not appear in the renewals list.
