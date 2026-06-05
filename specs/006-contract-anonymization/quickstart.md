# Quickstart Validation Guide: Contract Anonymization

**Feature**: 006-contract-anonymization | **Date**: 2026-06-05

## Prerequisites

- `pnpm install` completed at repo root
- Database migrated: `pnpm --filter backend migrate`
- Dev server running: `pnpm dev` (starts backend on port 3001, frontend on port 5173)

---

## Scenario 1: Global Anonymization Toggle

**Goal**: Verify that activating the global toggle replaces all contract names with fantasy names and plays a flip animation.

1. Navigate to `http://localhost:5173/contracts`
2. Confirm at least two contracts are listed with their real names
3. Locate the anonymization toggle button in the page header
4. Click the toggle — observe:
   - All contract name cells play a horizontal flip animation (~400ms)
   - After animation, each name shows a fictional fantasy company name
   - All other columns (category, amount, status, end date) are unchanged
5. Click the toggle again — observe:
   - Flip animation plays in reverse direction
   - Original contract names are restored
6. Activate the toggle, then refresh the page — observe:
   - No animation on load
   - Fantasy names are shown immediately (toggle state persisted)
7. Deactivate the toggle, then refresh — observe:
   - Real names are shown immediately

**Expected outcome**: SC-001 (single interaction, animation completes < 800ms), SC-004 (state persists across refresh), SC-005 (no real name visible when active)

---

## Scenario 2: Per-Contract Anonymization

**Goal**: Verify that marking a contract as always-anonymized keeps it hidden regardless of the global toggle.

1. Navigate to `/contracts`
2. Click "Edit" on a contract (e.g., "Netflix")
3. Find the "Anonymize this contract" checkbox — enable it and save
4. Return to `/contracts` — observe:
   - "Netflix" now shows a fantasy name even though the global toggle is OFF
5. Activate the global toggle — observe:
   - The already-anonymized contract continues to show its fantasy name (no conflict)
6. Deactivate the global toggle — observe:
   - The per-contract anonymized entry still shows a fantasy name
7. Edit the contract again, uncheck "Anonymize this contract", save
8. Return to `/contracts` — observe:
   - The contract now shows its real name (global toggle is off)

**Expected outcome**: FR-006, FR-007, SC-002 (completed in < 30 seconds), SC-003 (persists across refresh)

---

## Scenario 3: Fantasy Name Stability

**Goal**: Verify that the same fantasy name is always assigned to the same contract.

1. Note the fantasy name shown for contract "Netflix" with global toggle active
2. Toggle off and on again — observe the same fantasy name appears for "Netflix"
3. Refresh the page with toggle active — observe the same fantasy name again

**Expected outcome**: SC-006 (100% stable assignment)

---

## Scenario 4: Real Name Always Visible in Edit View

**Goal**: Verify that the edit form always shows the real contract name.

1. Activate the global toggle (all names anonymized)
2. Click "Edit" on any contract — observe:
   - The edit form shows the real contract name in the "Name" field, not the fantasy name

**Expected outcome**: FR-011 (anonymization is list-view only)

---

## Test Suite Validation

Run before marking the feature complete:

```bash
# Backend unit + integration tests
pnpm --filter backend test

# Frontend unit tests
pnpm --filter frontend test:unit

# E2E tests (requires running dev servers)
pnpm --filter frontend test:e2e --grep anonymization
```

All tests must pass with no type errors (`pnpm typecheck`).

---

## Key Files Reference

| What | Where |
|------|-------|
| Fantasy names list | `packages/frontend/src/data/fantasyNames.ts` |
| Anonymization hook | `packages/frontend/src/hooks/useAnonymization.ts` |
| Toggle button component | `packages/frontend/src/components/AnonymizationToggle.tsx` |
| ContractTable (animated) | `packages/frontend/src/components/ContractTable.tsx` |
| ContractForm (anonymize checkbox) | `packages/frontend/src/components/ContractForm.tsx` |
| DB migration guard | `packages/backend/src/db/client.ts` → `runMigrations` |
| Shared type | `packages/shared/src/types/contract.ts` |
| API contract delta | [contracts/api-delta.md](contracts/api-delta.md) |
| Data model | [data-model.md](data-model.md) |
