# API Contracts: Contract Export and Import

## No New Endpoints

This feature introduces no new backend API endpoints. All export logic runs client-side;
import uses the existing contract creation endpoint.

---

## Dependency: List Contracts (data source for export)

**`GET /api/contracts`**

Returns the full contract list used as the data source when generating export files.

Response: `200 OK`
```json
[ContractData, ...]
```

---

## Dependency: Create Contract (called once per import row)

**`POST /api/contracts`**

Called once for each valid row during an import. The import service constructs a
`CreateContractBody` from the mapped row data and posts it.

Request body:
```json
{
  "name": "string (required, max 200)",
  "category": "UTILITIES | SUBSCRIPTIONS | INSURANCE | HOUSING | OTHER (required)",
  "amount": "number >= 0 (required)",
  "billingInterval": "WEEKLY | MONTHLY | QUARTERLY | YEARLY | LIFETIME (required)",
  "status": "ACTIVE | INACTIVE (optional, default: ACTIVE)",
  "startDate": "YYYY-MM-DD | null (optional)",
  "endDate": "YYYY-MM-DD | null (optional)",
  "details": "string max 2000 | null (optional)",
  "serviceUrl": "URL | null (optional)",
  "cancellationPeriod": { "value": "integer > 0", "unit": "DAYS | WEEKS | MONTHS | YEARS" },
  "anonymize": "boolean (optional, default: false)"
}
```

Success: `201 Created` — `ContractData` body

Validation error: `400 Bad Request` — `{ statusCode: 400, error: "Bad Request", message: "..." }`

The import service captures both outcomes per row and aggregates them into an `ImportResult`.
