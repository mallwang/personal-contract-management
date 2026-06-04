# API Contract: Contract Fields Enhancement

All existing endpoints are extended — no new routes are added.

---

## GET /api/contracts

Returns an array of contracts. The response shape gains four new optional fields on each contract object.

### Response body (200 OK) — changed fields only

```jsonc
[
  {
    "id": "...",
    // ... existing fields unchanged ...
    "startDate": "2025-01-15",        // YYYY-MM-DD string, or null
    "details": "Annual subscription…", // string ≤ 2000 chars, or null
    "serviceUrl": "https://example.com", // absolute URL string, or null
    "cancellationPeriod": {           // object, or null
      "value": 30,
      "unit": "DAYS"                  // "DAYS" | "WEEKS" | "MONTHS"
    }
  }
]
```

---

## POST /api/contracts

Creates a new contract. All four new fields are optional in the request body.

### Request body — new optional fields

```jsonc
{
  // ... existing required fields unchanged ...
  "startDate": "2025-01-15",          // optional; YYYY-MM-DD or null
  "details": "Renews automatically…", // optional; string ≤ 2000 chars or null
  "serviceUrl": "https://example.com",// optional; absolute URL or null
  "cancellationPeriod": {             // optional; object or null
    "value": 14,
    "unit": "DAYS"
  }
}
```

### Validation errors (400 Bad Request)

| Scenario | Error message |
|----------|---------------|
| `serviceUrl` is malformed | `"Invalid url"` |
| `details` exceeds 2000 chars | `"String must contain at most 2000 character(s)"` |
| `cancellationPeriod.value` ≤ 0 | `"Number must be greater than 0"` |
| `cancellationPeriod.unit` is invalid | `"Invalid enum value"` |

### Response body (201 Created)

Same shape as the `GET /api/contracts` item, including all four new fields (nulls for any not provided).

---

## PUT /api/contracts/:id

Updates an existing contract. All four new fields are optional in the request body (same as `POST`). Sending `null` explicitly clears a previously set value.

### Request body — new optional fields

Same as `POST /api/contracts` new fields. Each field is independently patchable — you may update only `details` without touching the other three.

### Clearing a field

```jsonc
{ "serviceUrl": null }   // clears the stored URL
```

### Response body (200 OK)

Same shape as the `GET /api/contracts` item.

---

## DELETE /api/contracts/:id

No changes. Returns 204 No Content on success.
