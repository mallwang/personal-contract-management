# Data Model: Welcome Dashboard

**Feature**: 001-welcome-dashboard

## Entities

### Contract

The core entity. Represents a single personal contract commitment.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string (UUID v4) | PRIMARY KEY, NOT NULL | Generated at creation |
| name | string | NOT NULL, max 200 chars | Display name (e.g. "Netflix") |
| category | Category | NOT NULL | See Category enum below |
| monthlyAmount | number (decimal ≥ 0) | NOT NULL | Always stored as monthly equivalent |
| status | ContractStatus | NOT NULL, default: ACTIVE | Active contracts contribute to totals |
| endDate | string (ISO date) \| null | OPTIONAL | Renewal/expiry date; null = open-ended |
| createdAt | string (ISO 8601) | NOT NULL | Set once at creation |
| updatedAt | string (ISO 8601) | NOT NULL | Updated on every write |

### Category (Enum)

Fixed predefined set — custom categories are out of scope for this version.

| Value | Display Label |
|-------|---------------|
| UTILITIES | Utilities |
| SUBSCRIPTIONS | Subscriptions |
| INSURANCE | Insurance |
| HOUSING | Housing |
| OTHER | Other |

### ContractStatus (Enum)

| Value | Meaning |
|-------|---------|
| ACTIVE | Contract is live; included in all spending totals |
| INACTIVE | Contract is cancelled or expired; excluded from all totals |

## SQLite Schema

```sql
CREATE TABLE contracts (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK(length(name) <= 200),
  category       TEXT NOT NULL CHECK(category IN (
                   'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
  monthly_amount REAL NOT NULL CHECK(monthly_amount >= 0),
  status         TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK(status IN ('ACTIVE','INACTIVE')),
  end_date       TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
```

## Dashboard Aggregation Rules

### Total Monthly Spending

```sql
SELECT COALESCE(SUM(monthly_amount), 0)
FROM contracts
WHERE status = 'ACTIVE';
```

### Contracts by Category

```sql
SELECT category,
       COUNT(*)            AS count,
       SUM(monthly_amount) AS monthly_total
FROM contracts
WHERE status = 'ACTIVE'
GROUP BY category
ORDER BY monthly_total DESC;
```

Categories with zero active contracts are excluded from the result.

### Upcoming Renewals

```sql
SELECT id, name, category, end_date
FROM contracts
WHERE end_date IS NOT NULL
  AND end_date >= DATE('now')
  AND end_date <= DATE('now', '+30 days')
ORDER BY end_date ASC;
```

`daysRemaining` is computed in application code as the calendar days between today and `end_date`.

## Validation Invariants

- `monthlyAmount` of 0 is valid — a free/trial contract still exists as a record.
- `INACTIVE` contracts are excluded from spending totals but CAN appear in upcoming renewals
  if their `endDate` falls within 30 days (the user may still need to act on them).
- `endDate` must be a valid ISO date (`YYYY-MM-DD`); the backend rejects malformed values.
