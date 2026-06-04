# Implementation Plan: Contract Fields Enhancement

**Branch**: `004-contract-fields-enhancement` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-contract-fields-enhancement/spec.md`

## Summary

Extend the `Contract` entity with four new optional fields: `startDate`, `details`, `serviceUrl`, and `cancellationPeriod`. All fields are nullable — no existing workflow is blocked. Changes flow through the shared types/schemas layer, backend DB migration and service, and frontend form. The `ContractEdit` page serves as the "detail view" per the YAGNI principle (no new read-only detail route). All implementation follows Red-Green-Refactor: failing tests exist before any production code.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS, ESM modules (strict mode throughout)

**Primary Dependencies**:
- Shared: Zod (existing — adds `z.string().url()` and `z.string().max(2000)` validators)
- Backend: Fastify 5, better-sqlite3 (SQLite ≥ 3.35), @pcm/shared
- Frontend: React 18, TanStack Query 5, Zod, Tailwind CSS 4, @pcm/shared

**Storage**: SQLite via better-sqlite3 — five new nullable columns added to `contracts` via `ALTER TABLE ADD COLUMN`

**Testing**: Vitest (unit + integration), Playwright (e2e)

**Target Platform**: Desktop browser (Chrome/Chromium for Playwright)

**Project Type**: Full-stack web application (Fastify API + React SPA)

**Performance Goals**: Same as previous features — list loads in < 2 seconds, mutations < 500ms

**Constraints**: Single-user; no auth; `ALTER TABLE ADD COLUMN` for nullable columns requires no SQLite version beyond what better-sqlite3 already provides

**Scale/Scope**: Personal use; < 100 contracts

## Constitution Check

*GATE: Must pass before implementation. Re-checked after design.*

| Principle | Assessment | Status |
|-----------|------------|--------|
| I. Test-First | Every production code change (shared schemas, ContractRow, ContractService, routes, ContractForm, ContractEdit) has a corresponding failing test written before implementation. Migration is covered by updating the existing migration integration test. URL validation is tested via route integration tests. Character limit is tested at schema level and via form unit tests. | ✅ PASS |
| II. Type Safety | `CancellationPeriodUnit` is a typed const enum. `CancellationPeriodSchema` is a Zod object. `ContractRow` is extended with typed nullable fields. `cancellationPeriod` is assembled from two DB columns into `{ value: number; unit: CancellationPeriodUnit } \| null` by `rowToContract`. No `any` introduced. | ✅ PASS |
| III. Simplicity | No new abstraction layer. Cancellation period uses two flat DB columns (no JSON column, no new table). Migration adds columns in one block, detected by a single sentinel column check. Character counter is a computed `value.length` expression. Service URL link is an inline anchor, not a new component. No new npm dependencies. | ✅ PASS |

**No violations — Complexity Tracking section omitted.**

## Project Structure

### Documentation (this feature)

```text
specs/004-contract-fields-enhancement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output — updated API contract
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code Changes

```text
packages/shared/
└── src/
    ├── types/
    │   └── contract.ts        MODIFIED — add CancellationPeriodUnit const + type +
    │                                      CANCELLATION_PERIOD_UNIT_LABELS;
    │                                      extend Contract interface with startDate,
    │                                      details, serviceUrl, cancellationPeriod
    └── schemas/
        └── contract.ts        MODIFIED — add CancellationPeriodSchema;
                                           extend ContractSchema, CreateContractBodySchema,
                                           UpdateContractBodySchema with four new fields

packages/backend/
└── src/
    ├── db/
    │   ├── schema.sql         MODIFIED — add 5 new nullable columns to contracts table
    │   └── client.ts          MODIFIED — extend ContractRow type;
    │                                      add sentinel-based ALTER TABLE migration block
    └── services/
        └── contract.ts        MODIFIED — extend rowToContract, create INSERT, update SET
                                           to include all four new fields

packages/backend/tests/
├── unit/
│   ├── contract.service.test.ts   MODIFIED — add tests for new fields in create/update/list
│   └── migration.test.ts          MODIFIED — extend migration test to assert five new
│                                             columns exist after runMigrations on old schema
└── integration/
    └── contracts.route.test.ts    MODIFIED — add POST/PUT assertions for new fields;
                                               add URL validation rejection test;
                                               add details max-length rejection test

packages/frontend/
└── src/
    ├── components/
    │   └── ContractForm.tsx    MODIFIED — add startDate, details (with char counter),
    │                                      serviceUrl (with clickable link preview),
    │                                      cancellationPeriod (value + unit) fields;
    │                                      extend ContractFormValues and form state;
    │                                      assemble cancellationPeriod object for onSubmit
    └── pages/
        └── ContractEdit.tsx    MODIFIED — pass four new default values to ContractForm

packages/frontend/tests/
├── unit/
│   ├── ContractForm.test.tsx       MODIFIED — add tests for four new fields rendering,
│   │                                          char counter, URL validation feedback,
│   │                                          cancellation period assembly on submit
│   ├── ContractEdit.test.tsx       MODIFIED — update mock contract to include new fields;
│   │                                          assert new fields appear as pre-filled defaults
│   └── contracts.service.test.ts  MODIFIED — update mock ContractData shape to include
│                                             new fields with null values
└── e2e/
    └── contracts.spec.ts           MODIFIED — add create-with-new-fields flow;
                                               add URL validation rejection scenario;
                                               assert new fields survive edit round-trip
```

**Structure Decision**: No structural changes to the monorepo layout. All modifications follow the existing `packages/shared → packages/backend → packages/frontend` dependency chain.

## Implementation Sequence

Tasks follow Red-Green-Refactor and the shared → backend → frontend dependency order.

### Phase A — Shared types & schemas

1. **[TEST]** Update shared schema tests to assert:
   - `ContractSchema` requires and accepts `startDate` (nullable date string), `details` (nullable, max 2000), `serviceUrl` (nullable URL), `cancellationPeriod` (nullable object)
   - `CreateContractBodySchema` rejects `serviceUrl: "not-a-url"` and `details` > 2000 chars
   - `CancellationPeriodUnit` enum: all three values accepted, other values rejected

2. Add `CancellationPeriodUnit` const + type + `CANCELLATION_PERIOD_UNIT_LABELS` to `packages/shared/src/types/contract.ts`; extend `Contract` interface

3. Add `CancellationPeriodSchema` (Zod object with `value: z.number().int().positive()` + `unit: CancellationPeriodUnitSchema`) to `packages/shared/src/schemas/contract.ts`; extend `ContractSchema`, `CreateContractBodySchema`, `UpdateContractBodySchema`

4. Rebuild shared package; verify step-1 tests now pass

### Phase B — Backend DB migration

5. **[TEST]** Extend `migration.test.ts`: seed in-memory SQLite without new columns; call `runMigrations`; assert `start_date`, `details`, `service_url`, `cancellation_period_value`, `cancellation_period_unit` columns all exist and default to `NULL` on existing rows

6. Add five new nullable column definitions to `packages/backend/src/db/schema.sql`

7. Extend `runMigrations` in `client.ts`: after the existing `billing_interval` migration block, add a second block that checks for the absence of `start_date` via `PRAGMA table_info(contracts)` and runs five `ALTER TABLE contracts ADD COLUMN` statements

8. Extend `ContractRow` interface in `client.ts` with the five new fields (all `string | null` or `number | null`)

### Phase C — Backend ContractService

9. **[TEST]** Extend `contract.service.test.ts`:
   - Create with all four new fields populated — assert `rowToContract` maps them correctly
   - Create with all four new fields null — assert no error
   - Update an existing contract to set `serviceUrl` — assert updated value returned
   - Update to clear `cancellationPeriod` (send `null`) — assert both DB columns become NULL

10. Update `rowToContract` in `contract.ts` to map the five new DB columns; update `create` INSERT and `update` SET SQL to include all five columns

### Phase D — Backend route integration tests

11. **[TEST]** Extend `contracts.route.test.ts`:
    - `POST` with valid new fields → 201 response includes all four fields
    - `POST` with `serviceUrl: "not-a-url"` → 400
    - `POST` with `details` of 2001 characters → 400
    - `PUT` to update `cancellationPeriod` → 200 response shows new value
    - `GET` on contract created without new fields → response includes nulls for new fields

### Phase E — Frontend ContractForm

12. **[TEST]** Extend `ContractForm.test.tsx`:
    - All four new fields render in the form
    - Character counter displays remaining/used count for details field
    - Submitting with a valid `serviceUrl` includes it in the `onSubmit` payload
    - Submitting with non-empty `cancellationPeriodValue` + unit assembles `cancellationPeriod: { value, unit }` in payload
    - Submitting with empty `cancellationPeriodValue` sends `cancellationPeriod: null`

13. Extend `ContractFormValues` interface and form `useState` in `ContractForm.tsx` with:
    - `startDate: string`
    - `details: string`
    - `serviceUrl: string`
    - `cancellationPeriodValue: string`
    - `cancellationPeriodUnit: string` (default `'MONTHS'`)

14. Add the four new form fields to `ContractForm.tsx`:
    - **Start Date**: `<input type="date">` (optional label)
    - **Details**: `<textarea>` with live `{details.length}/2000` character counter; counter text turns red when ≥ 1900
    - **Service URL**: `<input type="url">` plus an anchor link shown below when value is non-empty and parses as a valid URL
    - **Cancellation Period**: a number `<input type="number" min="1">` alongside a `<select>` for unit using `CANCELLATION_PERIOD_UNIT_LABELS`

15. Update `handleSubmit` in `ContractForm.tsx`:
    - Include `startDate: values.startDate || null`
    - Include `details: values.details || null`
    - Include `serviceUrl: values.serviceUrl || null`
    - Assemble `cancellationPeriod`: `values.cancellationPeriodValue ? { value: parseInt(values.cancellationPeriodValue), unit: ... } : null`

### Phase F — Frontend pages

16. Update `ContractEdit.tsx` to pass new default values to `ContractForm`:
    - `startDate: contract.startDate ?? ''`
    - `details: contract.details ?? ''`
    - `serviceUrl: contract.serviceUrl ?? ''`
    - `cancellationPeriodValue: contract.cancellationPeriod ? String(contract.cancellationPeriod.value) : ''`
    - `cancellationPeriodUnit: contract.cancellationPeriod?.unit ?? 'MONTHS'`

17. **[TEST]** Extend `ContractEdit.test.tsx`: mock a contract that has all four new fields set; assert that the form renders them as pre-filled default values

### Phase G — Frontend service mock shape

18. **[TEST]** Update `contracts.service.test.ts`: extend mock `ContractData` objects to include `startDate: null, details: null, serviceUrl: null, cancellationPeriod: null`; verify no TypeScript errors

### Phase H — End-to-end

19. **[E2E]** Extend `contracts.spec.ts`:
    - Create contract with start date, details, URL, cancellation period → assert contract appears in list
    - Edit that contract → assert all four fields are pre-filled → save → no error
    - Enter `bad-url` in service URL → assert save is blocked with visible error
