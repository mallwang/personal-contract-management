# Research: Flexible Billing Intervals

## Decision 1: Database Schema Migration Strategy

**Decision**: Use column-existence detection via `PRAGMA table_info` to detect whether the old `monthly_amount` column is present, and apply an `ALTER TABLE` patch in `runMigrations` if it is.

**Rationale**: The project has a single `schema.sql` file run idempotently. Introducing a full versioned migration system (e.g., numbered SQL files + `user_version` pragma) would be premature for a one-off column rename. Instead, `runMigrations` gains a post-schema step that:
1. Checks if `monthly_amount` exists in the `contracts` table
2. If yes: adds `amount` and `billing_interval` columns, copies data, drops `monthly_amount`
3. If no: no-op (fresh database already has the correct schema)

This is the simplest change that handles both fresh installs and live databases without data loss.

**SQLite compatibility**: `ALTER TABLE DROP COLUMN` requires SQLite ≥ 3.35.0 (March 2021). `better-sqlite3` v9+ bundles SQLite ≥ 3.45.0, so this is safe.

**Migration SQL** (applied only when `monthly_amount` column detected):
```sql
ALTER TABLE contracts ADD COLUMN amount REAL NOT NULL DEFAULT 0.0;
ALTER TABLE contracts ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
  CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME'));
UPDATE contracts SET amount = monthly_amount;
ALTER TABLE contracts DROP COLUMN monthly_amount;
```

**Alternatives considered**:
- Versioned migration files + `user_version` pragma — more robust for multiple future migrations but over-engineered for a single-developer personal tool with one structural change.
- Recreate-table approach — not needed since DROP COLUMN is available.

---

## Decision 2: Monthly Normalization Factors

**Decision**: Normalize all recurring billing amounts to a monthly equivalent using these factors:

| Interval  | Factor (× amount) | Derivation |
|-----------|-------------------|------------|
| WEEKLY    | 52 ÷ 12 ≈ 4.3333 | 52 weeks per year ÷ 12 months |
| MONTHLY   | 1.0               | Identity |
| QUARTERLY | 1 ÷ 3 ≈ 0.3333   | 1 quarter ÷ 3 months |
| YEARLY    | 1 ÷ 12 ≈ 0.0833  | 1 year ÷ 12 months |
| LIFETIME  | 0.0               | One-time cost, excluded from recurring totals |

**Rationale**: Monthly equivalent is the most useful common unit for comparing personal subscriptions. The dashboard already uses `totalMonthlySpending` and `monthlyTotal` (per category) — these semantics stay the same; only the computation changes.

**SQL expression** (used in DashboardService queries):
```sql
amount * CASE billing_interval
  WHEN 'WEEKLY'    THEN 52.0/12.0
  WHEN 'MONTHLY'   THEN 1.0
  WHEN 'QUARTERLY' THEN 1.0/3.0
  WHEN 'YEARLY'    THEN 1.0/12.0
  ELSE 0.0
END
```

**Alternatives considered**: Yearly normalization — also common, but the existing dashboard field is named `totalMonthlySpending`, keeping it monthly avoids a breaking rename across UI and API.

---

## Decision 3: Upcoming Renewals and Billing Intervals

**Decision**: Keep the existing `end_date`-based renewal logic (contracts expiring within 30 days appear as upcoming renewals). Add a `billing_interval != 'LIFETIME'` filter to satisfy FR-010. Document that interval-based next-billing-date calculation (FR-009) is deferred.

**Rationale**: FR-009 requires computing the next billing date from a start/anchor date plus the interval. The feature spec's Key Entities section does not introduce a `startDate` field — only `amount` and `billingInterval`. Implementing FR-009 fully would require a schema addition (`startDate`) not in scope for this feature. The `end_date` field already serves as the renewal anchor for contracts that have one.

**Deferred scope**: A follow-up feature can add `startDate` and replace the `end_date`-based renewal lookup with an interval projection from `startDate`. For this iteration, the renewals list simply excludes LIFETIME contracts.

**Impact on spec acceptance scenarios**: User Story 3, Scenario 1 ("quarterly contract with a known start date") is partially addressed — the contract can now have a quarterly interval, and its `end_date` reflects when it renews. The automatic calculation from a start date remains deferred.

---

## Decision 4: ContractRow Type Update

**Decision**: Update `ContractRow` in `packages/backend/src/db/client.ts` to replace `monthly_amount: number` with `amount: number` and `billing_interval: string`.

**Rationale**: `ContractRow` is the direct mapping from SQLite column names to TypeScript. After the migration, the columns are `amount` and `billing_interval`. All downstream code (ContractService, DashboardService) maps from this type.

---

## Decision 5: Frontend Display of Billing Amount

**Decision**: Display billing information in the contract table as `€X.XX / Interval` (e.g., `€49.00 / Quarterly`) using a label map for interval display names.

**Rationale**: Matches the spec requirement (FR-008) and the user's stated expectation. The column header changes from "Monthly" to "Amount / Interval" to reflect the new semantics.

**Interval display labels**:
```
WEEKLY    → Weekly
MONTHLY   → Monthly
QUARTERLY → Quarterly
YEARLY    → Yearly
LIFETIME  → Lifetime
```
