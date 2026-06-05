# API Contract Delta: Contract Anonymization

**Feature**: 006-contract-anonymization | **Date**: 2026-06-05

This document describes only the changes to existing API contracts. Unchanged endpoints are omitted.

---

## `GET /contracts`

**Response shape change**: Each contract object in the array gains the `anonymize` field.

```json
// Before
{
  "id": "...",
  "name": "Netflix",
  ...
}

// After
{
  "id": "...",
  "name": "Netflix",
  "anonymize": false,   // NEW — boolean
  ...
}
```

---

## `POST /contracts`

**Request body change**: `anonymize` is now an optional boolean field.

```json
// Request body (new optional field)
{
  "name": "Netflix",
  "category": "SUBSCRIPTIONS",
  "amount": 9.99,
  "billingInterval": "MONTHLY",
  "anonymize": true    // NEW — optional, defaults to false
}
```

**Response**: Same as `GET /contracts` item shape (includes `anonymize`).

---

## `PUT /contracts/:id`

**Request body change**: `anonymize` is now an optional boolean field (partial update, per existing `UpdateContractBodySchema.partial()` behaviour).

```json
// Partial update — only anonymize
{
  "anonymize": true    // NEW — optional boolean
}
```

**Response**: Same as `GET /contracts` item shape (includes `anonymize`).

---

## Unchanged Endpoints

- `GET /dashboard` — not affected (dashboard data does not include contract names directly)
- `DELETE /contracts/:id` — not affected

---

## No New Endpoints

The global anonymization toggle is entirely client-side (`localStorage`). No API endpoint is added or required for toggling global anonymization state.
