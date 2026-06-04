# Data Model: Contract Fields Enhancement

## Updated Entity: Contract

The `Contract` entity gains four optional attributes. All are nullable — absence of a value is valid for any contract.

### Full Field Inventory

| Field                 | Type                              | Nullable | Description |
|-----------------------|-----------------------------------|----------|-------------|
| `id`                  | `string` (UUID)                   | No       | Primary key |
| `name`                | `string` (1–200 chars)            | No       | Contract name |
| `category`            | `Category` enum                   | No       | Service category |
| `amount`              | `number` (≥ 0)                    | No       | Billing amount |
| `billingInterval`     | `BillingInterval` enum            | No       | Billing frequency |
| `status`              | `ContractStatus` enum             | No       | Active / Inactive |
| `endDate`             | `string` (YYYY-MM-DD) \| `null`   | Yes      | Contract end date |
| **`startDate`**       | `string` (YYYY-MM-DD) \| `null`   | Yes      | Service start date |
| **`details`**         | `string` (0–2000 chars) \| `null` | Yes      | Free-text notes |
| **`serviceUrl`**      | `string` (URL) \| `null`          | Yes      | Provider website URL |
| **`cancellationPeriod`** | `CancellationPeriod \| null`   | Yes      | Required notice period |
| `createdAt`           | `string` (ISO 8601)               | No       | Record creation timestamp |
| `updatedAt`           | `string` (ISO 8601)               | No       | Last update timestamp |

New fields are **bold**.

---

## New Type: CancellationPeriod

A structured duration representing the notice period required to cancel a contract.

```
CancellationPeriod {
  value : integer (≥ 1)
  unit  : CancellationPeriodUnit
}

CancellationPeriodUnit = DAYS | WEEKS | MONTHS
```

**Labels** (for UI display):

| Value    | Label    |
|----------|----------|
| `DAYS`   | Days     |
| `WEEKS`  | Weeks    |
| `MONTHS` | Months   |

---

## Validation Rules

| Field              | Rule |
|--------------------|------|
| `startDate`        | Must match `YYYY-MM-DD` format if provided. Future dates are allowed. |
| `details`          | Maximum 2,000 characters. Plain text only. |
| `serviceUrl`       | Must be a well-formed absolute URL (scheme + host required, e.g., `https://example.com`). Partial or relative URLs are rejected. |
| `cancellationPeriod.value` | Positive integer (≥ 1). |
| `cancellationPeriod.unit`  | One of `DAYS`, `WEEKS`, `MONTHS`. |
| Partial `cancellationPeriod` | If either `value` or `unit` is provided without the other, the record is invalid. Both must be present or the field is `null`. |

---

## Database Schema (SQLite)

New columns added to the `contracts` table:

```sql
start_date                TEXT,
details                   TEXT CHECK(details IS NULL OR length(details) <= 2000),
service_url               TEXT,
cancellation_period_value INTEGER,
cancellation_period_unit  TEXT CHECK(
  cancellation_period_unit IS NULL
  OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS')
)
```

### Column → TypeScript Field Mapping

| DB Column                    | TypeScript Field                     |
|------------------------------|--------------------------------------|
| `start_date`                 | `startDate`                          |
| `details`                    | `details`                            |
| `service_url`                | `serviceUrl`                         |
| `cancellation_period_value`  | `cancellationPeriod.value`           |
| `cancellation_period_unit`   | `cancellationPeriod.unit`            |

Assembly rule: `cancellationPeriod` is `null` when either DB column is `NULL`; otherwise `{ value, unit }`.

---

## State Transitions

No new state machines. All four fields are mutable on any `PUT /api/contracts/:id` call. Setting a field to `null` (or omitting it) removes the stored value.
