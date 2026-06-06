# Data Model: Contract Export and Import

This feature introduces **no database schema changes**. All new types are frontend-only
structures that exist transiently during an export or import session.

---

## Existing Entity: Contract

Canonical definition: `packages/shared/src/types/contract.ts` and
`packages/shared/src/schemas/contract.ts`

### Export — JSON Representation

Array of `ContractData` objects, identical in shape to the `GET /api/contracts` response:

```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "Netflix",
    "category": "SUBSCRIPTIONS",
    "amount": 15.99,
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "startDate": "2023-01-15",
    "endDate": null,
    "details": null,
    "serviceUrl": "https://netflix.com",
    "cancellationPeriod": { "value": 1, "unit": "MONTHS" },
    "anonymize": false,
    "createdAt": "2023-01-15T10:00:00.000Z",
    "updatedAt": "2024-06-01T08:30:00.000Z"
  }
]
```

### Export — Excel (Flat) Representation

One row per contract with these column headers (in order):

| Column Header | Type | Notes |
|---|---|---|
| `id` | string (UUID) | |
| `name` | string | |
| `category` | string | UTILITIES \| SUBSCRIPTIONS \| INSURANCE \| HOUSING \| OTHER |
| `amount` | number | |
| `billingInterval` | string | WEEKLY \| MONTHLY \| QUARTERLY \| YEARLY \| LIFETIME |
| `status` | string | ACTIVE \| INACTIVE |
| `startDate` | string | YYYY-MM-DD, or empty |
| `endDate` | string | YYYY-MM-DD, or empty |
| `details` | string | or empty |
| `serviceUrl` | string | or empty |
| `cancellationPeriod.value` | number | integer, or empty |
| `cancellationPeriod.unit` | string | DAYS \| WEEKS \| MONTHS \| YEARS, or empty |
| `anonymize` | boolean | TRUE \| FALSE |
| `createdAt` | string | ISO datetime |
| `updatedAt` | string | ISO datetime |

### Import — Fields Accepted

The import flow constructs a `CreateContractBody` for each row. Accepted fields:

| Field | Required | Source |
|---|---|---|
| `name` | yes | mapped column |
| `category` | yes | mapped column (must be uppercase enum value) |
| `amount` | yes | mapped column (parsed as number) |
| `billingInterval` | yes | mapped column (must be uppercase enum value) |
| `status` | no | mapped column, defaults to `ACTIVE` |
| `startDate` | no | mapped column (YYYY-MM-DD) |
| `endDate` | no | mapped column (YYYY-MM-DD) |
| `details` | no | mapped column |
| `serviceUrl` | no | mapped column (must parse as valid URL if present) |
| `cancellationPeriod.value` | no | mapped column, combined with unit |
| `cancellationPeriod.unit` | no | mapped column, combined with value |
| `anonymize` | no | mapped column (true/false/1/0/yes/no) |
| `id`, `createdAt`, `updatedAt` | — | **always ignored** (system-generated) |

---

## New Frontend-Only Types

Located in `packages/frontend/src/utils/columnMapping.ts` and
`packages/frontend/src/services/importParsing.ts`.

### `TargetField`

The set of database fields a source column can be mapped to:

```typescript
export type TargetField =
  | 'name'
  | 'category'
  | 'amount'
  | 'billingInterval'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'details'
  | 'serviceUrl'
  | 'cancellationPeriod.value'
  | 'cancellationPeriod.unit'
  | 'anonymize';
```

### `ColumnMapping`

One entry per column header found in the import file:

```typescript
export interface ColumnMapping {
  sourceColumn: string;            // exact header string from the file
  targetField: TargetField | null; // null = unmapped (requires user action or skip)
  confidence: number;              // 0.0–1.0 (synonym match = 1.0, none = 0.0)
}
```

### `ParsedImportFile`

Result of reading and parsing the uploaded file:

```typescript
export interface ParsedImportFile {
  columns: string[];                          // all unique column headers
  rows: Array<Record<string, string>>;        // raw cell values coerced to string
  warnings: string[];                         // e.g., "Multiple sheets detected; using first"
}
```

### `ImportResult`

Aggregated outcome returned after all API calls complete:

```typescript
export interface ImportResult {
  total: number;
  created: number;
  failed: Array<{
    rowIndex: number;   // 1-based row number as it appeared in the file
    message: string;    // human-readable error (validation failure or API error)
  }>;
}
```

---

## Import State Machine

```
Idle
 │  user selects file
 ▼
Parsing
 │  ParsedImportFile produced
 ▼
MappingReview                  ←──── user changes mapping (ColumnMapping[])
 │  user confirms; all required fields mapped
 ▼
Importing (per-row API calls)
 │  all calls complete
 ▼
Done (ImportResult displayed)
```

Transitions back to Idle when user clicks "Import another file" or navigates away.
