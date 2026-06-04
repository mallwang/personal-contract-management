# Data Model: Contract CRUD

## Existing Entity: Contract

The `Contract` entity is already defined in the shared package and persisted in the SQLite `contracts` table. No schema changes are required.

| Field           | Type             | Constraints                                              | Notes                             |
|-----------------|------------------|----------------------------------------------------------|-----------------------------------|
| `id`            | UUID string      | Primary key, immutable after creation                    | Generated server-side via `randomUUID()` |
| `name`          | string           | Required, max 200 chars                                  | Free-text contract label          |
| `category`      | Category enum    | Required, one of: UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER | Fixed set for this feature |
| `monthlyAmount` | number           | Required, ≥ 0                                            | Stored as REAL in SQLite          |
| `status`        | ContractStatus   | Required, one of: ACTIVE, INACTIVE                       | Default: ACTIVE                   |
| `endDate`       | ISO date string  | Optional (null = no fixed end date)                      | Format: `YYYY-MM-DD`              |
| `createdAt`     | ISO datetime     | Immutable, set on creation                               | Full ISO-8601 string              |
| `updatedAt`     | ISO datetime     | Updated on every edit                                    | Full ISO-8601 string              |

### SQLite Column Mapping

| TypeScript field  | SQLite column    |
|-------------------|------------------|
| `id`              | `id`             |
| `name`            | `name`           |
| `category`        | `category`       |
| `monthlyAmount`   | `monthly_amount` |
| `status`          | `status`         |
| `endDate`         | `end_date`       |
| `createdAt`       | `created_at`     |
| `updatedAt`       | `updated_at`     |

## New Shared Zod Schemas

### `ContractSchema`
Full representation of a contract, used for API responses and frontend parsing.

```
ContractSchema = {
  id:            z.string().uuid()
  name:          z.string().min(1).max(200)
  category:      z.enum([UTILITIES, SUBSCRIPTIONS, INSURANCE, HOUSING, OTHER])
  monthlyAmount: z.number().nonnegative()
  status:        z.enum([ACTIVE, INACTIVE])
  endDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
  createdAt:     z.string()
  updatedAt:     z.string()
}
```

### `CreateContractBodySchema`
Request body for `POST /api/contracts`. All fields except `endDate` are required.

```
CreateContractBodySchema = {
  name:          z.string().min(1).max(200)
  category:      z.enum([...])
  monthlyAmount: z.number().nonnegative()
  status:        z.enum([ACTIVE, INACTIVE])    — default ACTIVE
  endDate:       z.string().regex(...).nullable().optional()
}
```

### `UpdateContractBodySchema`
Request body for `PUT /api/contracts/:id`. Partial — all fields optional, at least one must be provided.

```
UpdateContractBodySchema = CreateContractBodySchema.partial()
```

## State Transitions

```
Contract status:
  ACTIVE ←→ INACTIVE   (user can toggle freely via edit)

Contract lifecycle:
  [created] → [active/inactive] → [deleted]
  Deleted records are permanently removed (no soft-delete).
```

## Validation Rules

| Rule | Source |
|------|--------|
| Name must not be empty | FR-004, DB constraint |
| Name max 200 characters | DB `CHECK(length(name) <= 200)` |
| Monthly amount must be ≥ 0 | FR-004, DB constraint |
| Category must be a known enum value | DB `CHECK(category IN (...))` |
| Status must be ACTIVE or INACTIVE | DB `CHECK(status IN (...))` |
| End date must be a valid ISO date if provided | Schema validation |
| ID must be a UUID | Schema + generated server-side |
