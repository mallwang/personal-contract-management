# API Contracts: Contract CRUD

Base path: `/api/contracts`

All request/response bodies use `Content-Type: application/json`.
All timestamps are ISO-8601 strings. Dates are `YYYY-MM-DD`.

---

## GET /api/contracts

Returns all contracts, sorted by name ascending.

### Response: 200 OK

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Netflix",
    "category": "SUBSCRIPTIONS",
    "monthlyAmount": 15.99,
    "status": "ACTIVE",
    "endDate": "2026-07-01",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
]
```

Returns an empty array `[]` when no contracts exist.

---

## POST /api/contracts

Creates a new contract. `id`, `createdAt`, and `updatedAt` are set by the server.

### Request Body

```json
{
  "name": "Netflix",
  "category": "SUBSCRIPTIONS",
  "monthlyAmount": 15.99,
  "status": "ACTIVE",
  "endDate": "2026-07-01"
}
```

| Field           | Required | Notes                                              |
|-----------------|----------|----------------------------------------------------|
| `name`          | Yes      | 1–200 characters                                   |
| `category`      | Yes      | One of: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER` |
| `monthlyAmount` | Yes      | Number ≥ 0                                         |
| `status`        | No       | Defaults to `ACTIVE`                               |
| `endDate`       | No       | `YYYY-MM-DD` format; omit or `null` for open-ended |

### Response: 201 Created

The full created contract object (same shape as list item above).

### Response: 400 Bad Request

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "name: Required"
}
```

---

## PUT /api/contracts/:id

Updates one or more fields of an existing contract. Only supplied fields are updated.

### Path Parameters

| Parameter | Description        |
|-----------|--------------------|
| `id`      | UUID of the contract |

### Request Body

All fields are optional; at least one must be present.

```json
{
  "monthlyAmount": 17.99,
  "status": "INACTIVE"
}
```

### Response: 200 OK

The full updated contract object.

### Response: 400 Bad Request

Returned when the request body is empty or a field value is invalid.

### Response: 404 Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Contract not found"
}
```

---

## DELETE /api/contracts/:id

Permanently deletes a contract.

### Path Parameters

| Parameter | Description        |
|-----------|--------------------|
| `id`      | UUID of the contract |

### Response: 204 No Content

Contract deleted successfully. Empty body.

### Response: 404 Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Contract not found"
}
```

---

## Error Shape

All error responses follow the same structure:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Human-readable description"
}
```
