# Quickstart & Validation Guide: Contract CRUD

This guide describes how to validate the contract CRUD feature end-to-end after implementation.

## Prerequisites

- Node.js LTS and pnpm installed
- `pnpm install` run from the repo root
- SQLite database initialised: `pnpm --filter @pcm/backend db:migrate`
- (Optional) seed data: `pnpm --filter @pcm/backend db:seed`

---

## 1. Run the Test Suite

All tests must pass before the feature is considered complete (Constitution Principle I).

```bash
# Unit + integration tests (backend)
pnpm --filter @pcm/backend test

# Unit tests (frontend)
pnpm --filter @pcm/frontend test

# Type-check all packages
pnpm -r tsc --noEmit

# End-to-end tests (requires both servers running — see section 2 first)
pnpm --filter @pcm/frontend test:e2e
```

Expected outcome: all tests green, no TypeScript errors.

---

## 2. Start the Application

```bash
# Terminal 1 — backend
pnpm --filter @pcm/backend dev

# Terminal 2 — frontend
pnpm --filter @pcm/frontend dev
```

Frontend available at `http://localhost:5173`.
Backend available at `http://localhost:3000`.

---

## 3. Manual Validation Scenarios

### 3.1 View Contract List (User Story 1)

1. Open `http://localhost:5173/contracts`.
2. **Expected**: A list/table of all existing contracts is displayed, each showing name, category, monthly amount, status, and end date.
3. If no contracts exist: **Expected**: An empty-state message is shown (e.g., "No contracts yet. Add your first contract.").

### 3.2 Create a Contract (User Story 2)

1. On the contract list page, click "Add Contract".
2. **Expected**: Navigate to `/contracts/new` with a blank form.
3. Fill in: Name = "Test Contract", Category = "Subscriptions", Monthly Amount = 9.99, Status = "Active".
4. Submit the form.
5. **Expected**: Redirect to `/contracts`, new contract appears in the list.
6. Repeat, leaving "Name" blank and clicking Submit.
7. **Expected**: Validation error shown; no contract created.

### 3.3 Edit a Contract (User Story 3)

1. On the contract list, click the Edit action for "Test Contract".
2. **Expected**: Navigate to `/contracts/:id/edit` with the form pre-populated.
3. Change Monthly Amount to 12.99 and submit.
4. **Expected**: Redirect to `/contracts`, updated amount shown in the list.
5. Repeat, clearing the Name field and submitting.
6. **Expected**: Validation error shown; no update persisted.

### 3.4 Delete a Contract (User Story 4)

1. On the contract list, click the Delete action for "Test Contract".
2. **Expected**: Inline confirmation ("Confirm" / "Cancel") appears in that row.
3. Click "Cancel".
4. **Expected**: Confirmation dismissed; contract still in the list.
5. Click Delete again, then click "Confirm".
6. **Expected**: Contract removed from the list immediately.

### 3.5 Network Error Handling

1. Stop the backend server.
2. Attempt to create a contract via the form.
3. **Expected**: Error message displayed to the user; no silent failure.

---

## 4. API Smoke Tests (curl)

See [contracts/api.md](contracts/api.md) for full contract definitions.

```bash
# List contracts
curl http://localhost:3000/api/contracts

# Create a contract
curl -X POST http://localhost:3000/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"name":"Gym","category":"OTHER","monthlyAmount":30,"status":"ACTIVE"}'

# Update (replace :id with a real UUID from the list)
curl -X PUT http://localhost:3000/api/contracts/:id \
  -H "Content-Type: application/json" \
  -d '{"monthlyAmount":35}'

# Delete
curl -X DELETE http://localhost:3000/api/contracts/:id

# Expect 404 for unknown ID
curl -X DELETE http://localhost:3000/api/contracts/00000000-0000-0000-0000-000000000000
```

---

## 5. Success Criteria Checklist

| Criterion | How to verify |
|-----------|---------------|
| SC-001: Create in < 60s | Time the create flow manually |
| SC-002: Edit in < 30s | Time the edit flow manually |
| SC-003: Delete (inc. confirmation) in < 15s | Time the delete flow manually |
| SC-004: List loads in < 2s | Observe network tab or page load |
| SC-005: No silent failures | Test with backend stopped; error must be visible |
| SC-006: No delete without confirmation | Attempt delete and cancel; verify contract survives |
