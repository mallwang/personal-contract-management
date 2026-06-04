# Implementation Plan: Flexible Billing Intervals

**Branch**: `003-flexible-billing-intervals` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-flexible-billing-intervals/spec.md`

## Summary

Replace the fixed `monthlyAmount` field on contracts with an `amount` + `billingInterval` pair, supporting five intervals: Weekly, Monthly, Quarterly, Yearly, and Lifetime. The dashboard normalizes all recurring amounts to monthly equivalents. Lifetime contracts are excluded from recurring totals and upcoming renewals. Existing contracts are automatically migrated (`monthlyAmount → amount`, `billingInterval = MONTHLY`). All changes follow the Red-Green-Refactor cycle — tests are written and verified to fail before any implementation code.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS, ESM modules (strict mode throughout)

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3 (SQLite ≥ 3.45), fastify-type-provider-zod, @pcm/shared
- Frontend: React 18, TanStack Query 5, Zod, Tailwind CSS 4, lucide-react, @pcm/shared

**Storage**: SQLite via better-sqlite3 — `contracts` table schema changes required; live-database migration via `ALTER TABLE`

**Testing**: Vitest (unit + integration), Playwright (e2e)

**Target Platform**: Desktop browser (Chrome/Chromium for Playwright)

**Project Type**: Full-stack web application (Fastify API + React SPA)

**Performance Goals**: Same as contract CRUD — list loads in < 2 seconds, mutations < 500ms

**Constraints**: Single-user; no auth; SQLite `ALTER TABLE DROP COLUMN` requires bundled SQLite ≥ 3.35 (satisfied by better-sqlite3 v9+)

**Scale/Scope**: Personal use; < 100 contracts

## Constitution Check

*GATE: Must pass before implementation. Re-checked after design.*

| Principle | Assessment | Status |
|-----------|------------|--------|
| I. Test-First | Every modified file (shared schemas, ContractService, DashboardService, routes, ContractForm, ContractTable) gets updated/new tests written first, verified to fail, then implementation added. The DB migration helper has an integration test against an in-memory SQLite database seeded with the old schema. | ✅ PASS |
| II. Type Safety | `BillingInterval` is a typed const enum. `BillingIntervalSchema` is a Zod enum that derives the TypeScript type. `ContractRow` is updated to replace `monthly_amount` with `amount` and `billing_interval`. No `any` introduced. All changed schemas re-export clean types. | ✅ PASS |
| III. Simplicity | No new abstraction layer added. Migration uses column-existence detection (one PRAGMA query) rather than a full versioned migration system. Normalization is a SQL CASE expression inline in the existing queries, not a separate utility. `BILLING_INTERVAL_LABELS` is a plain record lookup. No new npm dependencies. | ✅ PASS |

**No violations — Complexity Tracking section omitted.**

## Project Structure

### Documentation (this feature)

```text
specs/003-flexible-billing-intervals/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output — changed API fields
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code Changes

```text
packages/shared/
└── src/
    ├── types/
    │   └── contract.ts        MODIFIED — add BillingInterval const + type + BILLING_INTERVAL_LABELS;
    │                                      update Contract interface (remove monthlyAmount, add amount + billingInterval)
    └── schemas/
        └── contract.ts        MODIFIED — add BillingIntervalSchema; replace monthlyAmount with
                                           amount + billingInterval in ContractSchema,
                                           CreateContractBodySchema, UpdateContractBodySchema

packages/backend/
└── src/
    ├── db/
    │   ├── schema.sql         MODIFIED — replace monthly_amount with amount + billing_interval columns
    │   └── client.ts          MODIFIED — update ContractRow type; update runMigrations to apply
    │                                      ALTER TABLE patch when monthly_amount column detected
    └── services/
        ├── contract.ts        MODIFIED — update all SQL queries and rowToContract mapping
        └── dashboard.ts       MODIFIED — replace SUM(monthly_amount) with normalized CASE expression;
                                           add billing_interval != 'LIFETIME' filter to renewals query

packages/backend/tests/
├── unit/
│   ├── contract.service.test.ts      MODIFIED — update existing tests; add interval-specific tests
│   └── dashboard.service.test.ts     MODIFIED — add normalization tests for each interval
└── integration/
    ├── contracts.route.test.ts        MODIFIED — update body/response shape; add billingInterval cases
    └── dashboard.route.test.ts        MODIFIED — add normalization assertions

packages/frontend/
└── src/
    ├── components/
    │   ├── ContractForm.tsx    MODIFIED — replace monthlyAmount input with amount + billingInterval selector
    │   └── ContractTable.tsx   MODIFIED — update column header; display "€X.XX / Interval" using BILLING_INTERVAL_LABELS

packages/frontend/tests/
├── unit/
│   ├── ContractForm.test.tsx          MODIFIED — add interval selector tests
│   └── contracts.service.test.ts     MODIFIED — update mock data shape
└── e2e/
    ├── contracts.spec.ts              MODIFIED — update create/edit flows to include interval selection
    └── dashboard.spec.ts              MODIFIED — add normalization assertion
```

**Structure Decision**: No structural changes to the monorepo layout. All modifications follow the existing `packages/shared → packages/backend → packages/frontend` layering convention.

## Implementation Sequence

Tasks are ordered to respect TDD (tests first) and the shared → backend → frontend dependency chain.

### Phase A — Shared types & schemas

1. **[TEST]** Update schema tests to assert `BillingIntervalSchema` accepts all 5 values, rejects others; `ContractSchema` requires `amount` + `billingInterval`, rejects `monthlyAmount`
2. Add `BillingInterval` const enum and `BILLING_INTERVAL_LABELS` to `packages/shared/src/types/contract.ts`
3. Add `BillingIntervalSchema`; replace `monthlyAmount` with `amount` + `billingInterval` in `packages/shared/src/schemas/contract.ts`
4. Update `Contract` interface and exported types; rebuild shared package

### Phase B — Backend DB migration & ContractRow

5. **[TEST]** Write migration integration test: seed in-memory SQLite with old schema (monthly_amount), call `runMigrations`, assert columns `amount` and `billing_interval` exist, `monthly_amount` gone, data preserved
6. Update `schema.sql` with new column definitions
7. Update `runMigrations` in `client.ts` to detect `monthly_amount` via `PRAGMA table_info` and apply the ALTER TABLE patch if found
8. Update `ContractRow` type in `client.ts`

### Phase C — Backend service: ContractService

9. **[TEST]** Update `contract.service.test.ts`: replace all `monthlyAmount` references; add tests for creating contracts with each `billingInterval`
10. Update `ContractService` in `contract.ts`: update `rowToContract`, `create`, `update` SQL and parameter bindings

### Phase D — Backend service: DashboardService

11. **[TEST]** Update `dashboard.service.test.ts`: add test cases for WEEKLY/QUARTERLY/YEARLY normalization; add test that LIFETIME contracts contribute 0; add test that LIFETIME contracts do not appear in renewals
12. Update `DashboardService` in `dashboard.ts`: replace `SUM(monthly_amount)` with inline CASE normalization in both `getTotalMonthlySpending` and `getContractsByCategory`; add `billing_interval != 'LIFETIME'` filter to `getUpcomingRenewals`

### Phase E — Backend routes & integration tests

13. **[TEST]** Update `contracts.route.test.ts` and `dashboard.route.test.ts` with new field shapes
14. No route handler code changes needed (schemas drive validation; service handles logic)

### Phase F — Frontend

15. **[TEST]** Update `ContractForm.test.tsx`: assert interval selector renders with 5 options; assert form submits `amount` + `billingInterval`
16. Update `ContractForm.tsx`: rename `monthlyAmount` → `amount` in state; add `billingInterval` state field and `<select>` using `BILLING_INTERVAL_LABELS`; update validation message and `onSubmit` payload
17. **[TEST]** Update `ContractTable.test.tsx`: assert column header is "Amount / Interval" and cell renders "€X.XX / [Label]"
18. Update `ContractTable.tsx`: change column header; replace `contract.monthlyAmount` cell with `contract.amount` formatted as "€X.XX / [Label]"
19. **[TEST]** Update `contracts.service.test.ts`: update mock data shape
20. **[E2E]** Update `contracts.spec.ts`: add interval selection step to create/edit flows
21. **[E2E]** Update `dashboard.spec.ts`: add spending normalization assertion
