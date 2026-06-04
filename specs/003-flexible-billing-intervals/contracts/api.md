# API Contract: Flexible Billing Intervals

This document describes only the **changed** fields relative to the existing contract CRUD API (`specs/002-contract-crud/contracts/api.md`). All unchanged endpoints, response codes, and fields are omitted.

## Changed Field: `monthlyAmount` → `amount` + `billingInterval`

Across all contract endpoints, the `monthlyAmount` field is removed and replaced by two new required fields.

### Field Reference

| Field             | Type   | Constraints                                              |
|-------------------|--------|----------------------------------------------------------|
| `amount`          | number | ≥ 0; represents cost per billing cycle                  |
| `billingInterval` | string | One of: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME` |

---

## `GET /api/contracts` — List Contracts

### Response (200) — changed fields per contract object

```json
{
  "id": "...",
  "name": "Netflix",
  "category": "SUBSCRIPTIONS",
  "amount": 49.00,
  "billingInterval": "QUARTERLY",
  "status": "ACTIVE",
  "endDate": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Removed**: `monthlyAmount`
**Added**: `amount`, `billingInterval`

---

## `POST /api/contracts` — Create Contract

### Request Body — changed fields

```json
{
  "name": "Adobe Creative Cloud",
  "category": "SUBSCRIPTIONS",
  "amount": 599.00,
  "billingInterval": "YEARLY",
  "status": "ACTIVE",
  "endDate": null
}
```

**Removed**: `monthlyAmount` (required)
**Added**: `amount` (required, ≥ 0), `billingInterval` (required, one of the five values)

### Validation Errors (400)

- `amount` missing or negative → 400
- `billingInterval` missing or not one of the allowed values → 400

---

## `PUT /api/contracts/:id` — Update Contract

### Request Body — changed fields

All fields remain optional (partial update). Same replacements as POST:
- `monthlyAmount` removed
- `amount` and `billingInterval` added (both optional individually, both validated when present)

---

## `GET /api/dashboard` — Dashboard Summary

No structural changes to the response schema. `totalMonthlySpending` and per-category `monthlyTotal` values are now computed as monthly equivalents normalized from `amount × factor(billingInterval)`. The field names and types are unchanged.

### Normalization applied server-side

| billingInterval | Monthly factor |
|----------------|----------------|
| WEEKLY         | ×4.333 (52÷12) |
| MONTHLY        | ×1.0           |
| QUARTERLY      | ×0.333 (1÷3)   |
| YEARLY         | ×0.083 (1÷12)  |
| LIFETIME       | ×0.0 (excluded)|

Callers receive a pre-normalized `totalMonthlySpending` value — no client-side math required.
