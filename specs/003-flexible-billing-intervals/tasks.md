# Tasks: Flexible Billing Intervals

**Input**: Design documents from `specs/003-flexible-billing-intervals/`

**Prerequisites**: [plan.md](plan.md) | [spec.md](spec.md) | [research.md](research.md) | [data-model.md](data-model.md) | [contracts/api.md](contracts/api.md)

**Tests**: Included — project constitution mandates Test-First (TDD) for all production code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1 / US2 / US3)

---

## Phase 1: Setup (Shared Types & Schemas)

**Purpose**: Update the shared package types and Zod schemas. Everything else depends on the new type shapes.

**⚠️ CRITICAL**: Shared package must be rebuilt after this phase before backend/frontend work begins.

- [x] T001 Write failing tests in `packages/backend/tests/unit/contract.service.test.ts` asserting that `ContractData` has `amount` + `billingInterval` (not `monthlyAmount`) — verify tests FAIL before proceeding
- [x] T002 Add `BillingInterval` const enum (`WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`) and `BILLING_INTERVAL_LABELS` record to `packages/shared/src/types/contract.ts`
- [x] T003 Update `Contract` interface in `packages/shared/src/types/contract.ts`: remove `monthlyAmount`, add `amount: number` and `billingInterval: BillingInterval`
- [x] T004 Add `BillingIntervalSchema = z.enum([...])` to `packages/shared/src/schemas/contract.ts`
- [x] T005 Replace `monthlyAmount` with `amount` + `billingInterval` in `ContractSchema`, `CreateContractBodySchema`, and `UpdateContractBodySchema` in `packages/shared/src/schemas/contract.ts`; update exported types (`ContractData`, `CreateContractBody`, `UpdateContractBody`)
- [x] T006 Rebuild shared package: `pnpm --filter @pcm/shared build` — confirm zero type errors

**Checkpoint**: `@pcm/shared` exports `BillingInterval`, `BILLING_INTERVAL_LABELS`, and updated contract schemas. Backend and frontend compilation will fail until their code is updated (expected — Phase 2+ fixes this).

---

## Phase 2: Foundational (DB Migration & ContractRow)

**Purpose**: Migrate the SQLite schema so both fresh databases and existing databases have `amount` + `billing_interval` columns. This unblocks all service-layer work.

**⚠️ CRITICAL**: No service implementation can begin until this phase is complete.

- [x] T007 Write a failing integration test in `packages/backend/tests/integration/contracts.route.test.ts` (or a new `packages/backend/tests/unit/migration.test.ts`) that: creates an in-memory DB with the OLD schema (containing `monthly_amount`), calls `runMigrations`, then asserts `monthly_amount` column is gone and `amount` + `billing_interval` columns exist with correct data — verify test FAILS before proceeding
- [x] T008 Update `packages/backend/src/db/schema.sql`: replace `monthly_amount REAL NOT NULL CHECK(monthly_amount >= 0)` with `amount REAL NOT NULL CHECK(amount >= 0)` and `billing_interval TEXT NOT NULL DEFAULT 'MONTHLY' CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME'))`
- [x] T009 Update `runMigrations` in `packages/backend/src/db/client.ts`: after `instance.exec(schema)`, add a migration block that uses `PRAGMA table_info('contracts')` to detect `monthly_amount`; if found, run the four ALTER TABLE statements (`ADD COLUMN amount`, `ADD COLUMN billing_interval`, `UPDATE SET amount = monthly_amount`, `DROP COLUMN monthly_amount`)
- [x] T010 Update `ContractRow` interface in `packages/backend/src/db/client.ts`: replace `monthly_amount: number` with `amount: number` and `billing_interval: string`
- [x] T011 Run `pnpm --filter @pcm/backend test` — migration test should now pass; all other backend tests will fail (expected — fixed in Phase 3+)

**Checkpoint**: DB migration works for both fresh and existing databases. `ContractRow` type matches the new column layout.

---

## Phase 3: User Story 1 — Set Billing Interval on Contract (Priority: P1) 🎯 MVP

**Goal**: Users can create and edit contracts with any of the five billing intervals. The contract list displays amount and interval. Existing contracts are unaffected after migration.

**Independent Test**: Create a contract via `POST /api/contracts` with `billingInterval: "QUARTERLY"` and `amount: 30`; verify the response contains those fields and no `monthlyAmount`. Edit it to `YEARLY`; verify the update is reflected.

### Tests for User Story 1

> **Write these tests FIRST, verify they FAIL, then implement**

- [x] T012 [P] [US1] Update `packages/backend/tests/unit/contract.service.test.ts`: replace all `monthlyAmount` field references with `amount` + `billingInterval`; add test cases for creating/updating contracts with each of the 5 intervals — verify tests FAIL
- [x] T013 [P] [US1] Update `packages/backend/tests/integration/contracts.route.test.ts`: update request bodies and response assertions (remove `monthlyAmount`, add `amount` + `billingInterval`); add a test that `POST` with `monthlyAmount` returns 400 — verify tests FAIL
- [x] T014 [P] [US1] Update `packages/frontend/tests/unit/ContractForm.test.tsx`: add test asserting the billing interval `<select>` renders with 5 options; update submit assertion to pass `amount` + `billingInterval` — verify tests FAIL
- [x] T015 [P] [US1] Update `packages/frontend/tests/unit/contracts.service.test.ts`: replace mock contract data shape (`monthlyAmount` → `amount` + `billingInterval`) — verify tests FAIL

### Implementation for User Story 1

- [x] T016 [US1] Update `rowToContract` in `packages/backend/src/services/contract.ts`: map `row.amount` → `amount` and `row.billing_interval` → `billingInterval`; remove `monthlyAmount`
- [x] T017 [US1] Update `create` method in `packages/backend/src/services/contract.ts`: replace `monthly_amount` with `amount` and `billing_interval` in the INSERT SQL and parameter binding
- [x] T018 [US1] Update `update` method in `packages/backend/src/services/contract.ts`: replace `monthly_amount` references with `amount` and `billing_interval` in the UPDATE SQL, parameter binding, and fallback spread
- [x] T019 [P] [US1] Update `packages/frontend/src/components/ContractForm.tsx`: rename `monthlyAmount` state field to `amount`; add `billingInterval` state field (default `MONTHLY`); replace the monthly amount `<input>` label with "Amount *"; add a `<select id="billingInterval">` using `BILLING_INTERVAL_LABELS` from `@pcm/shared`; update `onSubmit` payload and validation message
- [x] T020 [P] [US1] Update `packages/frontend/src/components/ContractTable.tsx`: change column header from "Monthly" to "Amount / Interval"; replace `contract.monthlyAmount.toLocaleString(...)` cell with `€${contract.amount.toFixed(2)} / ${BILLING_INTERVAL_LABELS[contract.billingInterval]}`
- [x] T021 [US1] Update `packages/frontend/tests/e2e/contracts.spec.ts`: add a step to select a billing interval in the create/edit form flows; update any assertions that reference `monthlyAmount` display text
- [x] T022 [US1] Run `pnpm --filter @pcm/backend test` and `pnpm --filter @pcm/frontend test` — all Phase 3 tests should now pass

**Checkpoint**: `POST /api/contracts` accepts `amount` + `billingInterval`; contract list shows "€X.XX / Interval"; unit and integration tests green for US1.

---

## Phase 4: User Story 2 — Normalized Spending Overview (Priority: P2)

**Goal**: The dashboard's monthly spending total and per-category breakdown correctly normalize all contract amounts to monthly equivalents. A €120/year contract contributes €10/month. A Lifetime contract contributes €0.

**Independent Test**: Seed two active contracts — `€30 / QUARTERLY` and `€120 / YEARLY`. Dashboard `totalMonthlySpending` should equal `30 × (1/3) + 120 × (1/12) = 10 + 10 = 20`.

### Tests for User Story 2

> **Write these tests FIRST, verify they FAIL, then implement**

- [x] T023 [P] [US2] Update `packages/backend/tests/unit/dashboard.service.test.ts`: add test cases for each normalization factor — WEEKLY `amount=52` → monthly `≈4.33×52/1 ≈ 18.67` (actually `52 × 52/12`), QUARTERLY `amount=30` → `10`, YEARLY `amount=120` → `10`, LIFETIME `amount=999` → `0`; add test that LIFETIME contract is excluded from `totalMonthlySpending` — verify tests FAIL
- [x] T024 [P] [US2] Update `packages/backend/tests/integration/dashboard.route.test.ts`: add test that seeds contracts with different intervals and asserts correct normalized total in the response — verify tests FAIL

### Implementation for User Story 2

- [x] T025 [US2] Update `getTotalMonthlySpending` in `packages/backend/src/services/dashboard.ts`: replace `SUM(monthly_amount)` with `SUM(amount * CASE billing_interval WHEN 'WEEKLY' THEN 52.0/12.0 WHEN 'MONTHLY' THEN 1.0 WHEN 'QUARTERLY' THEN 1.0/3.0 WHEN 'YEARLY' THEN 1.0/12.0 ELSE 0.0 END)`
- [x] T026 [US2] Update `getContractsByCategory` in `packages/backend/src/services/dashboard.ts`: replace `SUM(monthly_amount) AS monthly_total` with the same CASE normalization expression
- [x] T027 [US2] Update `packages/frontend/tests/e2e/dashboard.spec.ts`: add an assertion verifying the spending total changes correctly when a non-monthly contract is added
- [x] T028 [US2] Run `pnpm --filter @pcm/backend test` — all Phase 4 tests should now pass

**Checkpoint**: Dashboard API returns correctly normalized `totalMonthlySpending` and per-category `monthlyTotal`. Lifetime contracts contribute €0. Frontend dashboard components are unchanged (they consume the pre-normalized value from the API).

---

## Phase 5: User Story 3 — Upcoming Renewals Respect Interval (Priority: P3)

**Goal**: Lifetime contracts do not appear in the upcoming renewals list, regardless of their `endDate`.

**Independent Test**: Create an active Lifetime contract with an `endDate` set 7 days from today. Verify it does NOT appear in the `upcomingRenewals` array from `GET /api/dashboard`.

### Tests for User Story 3

> **Write these tests FIRST, verify they FAIL, then implement**

- [x] T029 [P] [US3] Add test to `packages/backend/tests/unit/dashboard.service.test.ts`: seed a LIFETIME contract with `endDate` within 30 days; assert it is absent from `getUpcomingRenewals()` result — verify test FAILS
- [x] T030 [P] [US3] Add test to `packages/backend/tests/integration/dashboard.route.test.ts`: verify LIFETIME contract with imminent `endDate` is absent from `upcomingRenewals` in the response — verify test FAILS

### Implementation for User Story 3

- [x] T031 [US3] Update `getUpcomingRenewals` SQL in `packages/backend/src/services/dashboard.ts`: add `AND billing_interval != 'LIFETIME'` to the WHERE clause
- [x] T032 [US3] Run `pnpm --filter @pcm/backend test` — all Phase 5 tests should now pass

**Checkpoint**: Lifetime contracts never appear in upcoming renewals. All three user stories are fully functional.

---

## Phase 6: Polish & Validation

**Purpose**: Full suite validation, type-check, and end-to-end confirmation.

- [x] T033 [P] Run full type-check across all packages: `pnpm tsc --noEmit` (from repo root or per-package) — zero errors required
- [x] T034 [P] Run complete backend test suite: `pnpm --filter @pcm/backend test` — all tests green
- [x] T035 [P] Run complete frontend unit test suite: `pnpm --filter @pcm/frontend test` — all tests green
- [x] T036 Run Playwright end-to-end suite: `pnpm --filter @pcm/frontend test:e2e` — all flows pass
- [x] T037 Start dev stack (`pnpm dev`) and manually walk through all scenarios in [quickstart.md](quickstart.md) — verify all 8 key validation scenarios pass
- [x] T038 Run database migration against a copy of a real database (or seeded DB) and confirm existing contracts appear correctly in the UI with `amount` + `billingInterval = Monthly`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Shared)**: No dependencies — start immediately
- **Phase 2 (DB Migration)**: Depends on Phase 1 completion — BLOCKS all service work
- **Phase 3 (US1)**: Depends on Phase 2 — implements CRUD interval support
- **Phase 4 (US2)**: Depends on Phase 2 — implements dashboard normalization (can run in parallel with Phase 3 on different files)
- **Phase 5 (US3)**: Depends on Phase 2 — adds LIFETIME renewal filter (depends on Phase 4 DashboardService changes)
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no dependency on US2 or US3
- **US2 (P2)**: Depends on Phase 2 only — no dependency on US1 or US3
- **US3 (P3)**: Depends on Phase 4 (DashboardService) — the LIFETIME filter is added to the same service

### Within Each Phase: TDD Order

1. Write test(s) — verify they FAIL
2. Implement production code
3. Verify tests PASS
4. Proceed to next task

---

## Parallel Opportunities

### Phase 3 + Phase 4 (after Phase 2 completes)

US1 (ContractService, frontend) and US2 (DashboardService normalization) touch different files:

```
Parallel track A (US1):
  T012 contract.service.test.ts
  T013 contracts.route.test.ts
  T014 ContractForm.test.tsx
  T015 contracts.service.test.ts
  → T016 ContractService (depends on T012)
  → T017 ContractForm.tsx (depends on T014)
  → T018 ContractTable.tsx (depends on T014)

Parallel track B (US2):
  T023 dashboard.service.test.ts
  T024 dashboard.route.test.ts
  → T025 DashboardService normalization (depends on T023)
```

### Within US1: Tests can run in parallel

```
T012 contract.service.test.ts  ─┐
T013 contracts.route.test.ts   ─┤ all write different files
T014 ContractForm.test.tsx      ─┤ → run in parallel
T015 contracts.service.test.ts ─┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (shared types)
2. Complete Phase 2 (DB migration)
3. Complete Phase 3 (US1 — contract CRUD with intervals)
4. **STOP and VALIDATE**: Contracts can be created with all 5 intervals; table shows correct display
5. US2 + US3 can follow without breaking US1

### Incremental Delivery

1. Phase 1 + 2 → shared types and DB ready
2. Phase 3 → contract form + table updated → **US1 deliverable**
3. Phase 4 → dashboard totals normalized → **US2 deliverable**
4. Phase 5 → LIFETIME excluded from renewals → **US3 deliverable**
5. Phase 6 → full validation

---

## Notes

- `[P]` tasks touch different files — safe to run in parallel within the same phase
- TDD is non-negotiable (constitution Principle I) — every `[TEST]` task must produce a FAILING test before the corresponding implementation task runs
- The shared package rebuild (T006) is a hard prerequisite — TypeScript compilation of backend and frontend will fail until `@pcm/shared` is rebuilt
- The migration (T007–T011) must succeed before any service-layer test can pass — run `pnpm --filter @pcm/backend test` after T011 to confirm migration test passes
- `BILLING_INTERVAL_LABELS` from `@pcm/shared` is used in both the frontend form and table — import from the shared package, do not duplicate
