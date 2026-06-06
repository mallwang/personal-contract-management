# Tasks: Cancellation-Aware Renewals Panel

**Input**: Design documents from `specs/010-cancellation-aware-renewals/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅ · quickstart.md ✅

**Tests**: TDD is constitutionally mandatory for this project — test tasks precede every
implementation task. Tests must be confirmed failing before implementation begins.

**Organization**: Tasks grouped by user story phase to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no conflicting changes)
- **[Story]**: User story this task belongs to ([US1], [US2], [US3])

---

## Phase 1: Setup

**Purpose**: Establish baseline before making changes.

- [ ] T001 Run `pnpm tsc --noEmit` across all packages and note any pre-existing errors that are not part of this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type and schema changes that every subsequent phase depends on. Must
be fully complete before any user story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. `pnpm tsc --noEmit`
will report downstream errors (frontend component, backend service) after T004 — that is
expected and resolved in later phases.

- [ ] T002 Add `YEARS: 'YEARS'` to `CancellationPeriodUnit` and `'Years'` to `CANCELLATION_PERIOD_UNIT_LABELS` in `packages/shared/src/types/contract.ts`
- [ ] T003 [P] Add `CancellationPeriodUnit.YEARS` to `CancellationPeriodUnitSchema` in `packages/shared/src/schemas/contract.ts`
- [ ] T004 [P] Add `"YEARS": "Years"` under `cancellationUnit` in `packages/frontend/src/i18n/locales/en.json` and `"YEARS": "Jahre"` in `packages/frontend/src/i18n/locales/de.json`
- [ ] T005 Replace `daysRemaining: z.number().int().nonnegative()` with `cancellationDeadline: z.string().regex(...)` and `daysUntilCancellationDeadline: z.number().int()` in `UpcomingRenewalSchema` in `packages/shared/src/schemas/dashboard.ts`; update derived `UpcomingRenewal` type export
- [ ] T006 [P] Add YEARS migration step to `runMigrations()` in `packages/backend/src/db/client.ts`: query `sqlite_master` for `contracts` table SQL; if `'YEARS'` not in constraint, rebuild table with updated `CHECK(cancellation_period_unit IS NULL OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS','YEARS'))`

**Checkpoint**: Foundational types updated. Backend tests will fail (expected — `getUpcomingRenewals` still returns old shape). User story phases can now begin.

---

## Phase 3: User Story 1 — Contracts Filtered by Cancellation Period (Priority: P1) 🎯 MVP

**Goal**: The dashboard panel shows only contracts whose panel entry date has been reached
(`cancellationDeadline − 30 days ≤ today < endDate`), sorted by urgency. The API returns
`cancellationDeadline` and `daysUntilCancellationDeadline` for each entry.

**Independent Test**: Create contracts with different cancellation periods and end dates
(as in quickstart.md scenarios 1–2, 7); confirm panel includes or excludes them correctly
and the new fields appear in `GET /api/dashboard`.

### Tests — Write FIRST, confirm failing before implementing T010–T011

- [ ] T007 [US1] Extend `insertContract` helper in `packages/backend/tests/unit/dashboard.service.test.ts` to accept `cancellation_period_value: number | null` and `cancellation_period_unit: string | null` overrides; rewrite the `DashboardService – upcomingRenewals` test suite with these failing cases:
  - Contract with 3-month cancellation, end date 4 months out → included
  - Contract with 3-month cancellation, end date 6 months out → excluded
  - Contract with no cancellation period, end date 20 days out → included (default window)
  - Contract with no cancellation period, end date 40 days out → excluded
  - Contract with overdue cancellation deadline (end date future) → included with negative `daysUntilCancellationDeadline`
  - Contract with 14-day cancellation, end date 44 days out → included (entry date = today)
  - Contract with YEARS unit (1 year), end date 13 months out → included
  - Two contracts: sort by `daysUntilCancellationDeadline` ascending; name as tiebreaker
  - LIFETIME contract excluded regardless of end date
  - Already-ended contract excluded
- [ ] T008 [P] [US1] Extend `insertContract` helper in `packages/backend/tests/integration/dashboard.route.test.ts` to accept `cancellation_period_value` and `cancellation_period_unit`; update `upcomingRenewals` test assertions to expect `cancellationDeadline` and `daysUntilCancellationDeadline` (remove `daysRemaining` assertions); add a test: contract with 3-month cancellation + 4-month end date is included in response

### Implementation

- [ ] T009 [US1] Implement pure helper `computeCancellationDeadline(endDate: Date, period: { value: number; unit: CancellationPeriodUnit } | null): Date` in `packages/backend/src/services/dashboard.ts` — returns `endDate` if period is null; subtracts calendar-accurately for DAYS/WEEKS/MONTHS/YEARS
- [ ] T010 [US1] Rewrite `getUpcomingRenewals()` in `packages/backend/src/services/dashboard.ts`: (1) SELECT all non-LIFETIME contracts with non-null future `end_date`, including `cancellation_period_value` + `cancellation_period_unit`; (2) compute `cancellationDeadline` and `panelEntryDate` per row via `computeCancellationDeadline`; (3) filter `today >= panelEntryDate`; (4) compute `daysUntilCancellationDeadline`; (5) sort ascending by `daysUntilCancellationDeadline` then `name`; (6) return new `UpcomingRenewal` shape
- [ ] T011 [US1] Run `pnpm --filter @pcm/backend run test`; confirm all unit and integration tests pass green

**Checkpoint**: Backend fully functional. `GET /api/dashboard` returns new `UpcomingRenewal` shape.
Frontend component will have TypeScript errors until Phase 4 — expected.

---

## Phase 4: User Story 2 — Urgency Display (Priority: P2)

**Goal**: Each panel entry shows the number of days until the cancellation deadline (or days
overdue if negative). Overdue entries are visually distinct with a destructive badge.

**Independent Test**: With a contract whose cancellation deadline is in the past (quickstart
scenario 4), confirm the panel entry shows an overdue badge in a distinct (red/destructive)
style and displays the overdue day count.

### Tests — Write FIRST, confirm failing before implementing T015

- [ ] T012 [US2] Add failing E2E test to `packages/frontend/tests/e2e/dashboard.spec.ts`: given an API response where `daysUntilCancellationDeadline` is negative, the panel entry renders an overdue badge with destructive styling (e.g. check for a CSS class or `data-testid` indicating overdue state) and shows a days-overdue count

### Implementation

- [ ] T013 [P] [US2] Add i18n keys to `packages/frontend/src/i18n/locales/en.json` under `dashboard`: `"cancelBy"`, `"endsOn"`, `"dueToday"`, `"daysOverdue"` (e.g. `"{{count}} days overdue"`)
- [ ] T014 [P] [US2] Add German equivalents for the same keys in `packages/frontend/src/i18n/locales/de.json`
- [ ] T015 [US2] Update `packages/frontend/src/components/UpcomingRenewals.tsx`: (1) consume new `UpcomingRenewal` shape (`cancellationDeadline`, `daysUntilCancellationDeadline`); (2) update `urgencyVariant` — destructive when `< 0`, warning when `<= 7`, secondary otherwise; (3) update badge text — use `daysOverdue` key when negative, `dueToday` when 0, `daysRemaining` when positive

**Checkpoint**: Urgency badges render correctly for all three states (overdue, due-today, remaining).

---

## Phase 5: User Story 3 — Distinct Date Labels (Priority: P3)

**Goal**: Each panel entry clearly shows both the cancellation deadline ("Cancel by") and the
contract end date ("Ends") as separate, labelled fields.

**Independent Test**: Any contract in the panel shows two distinct date rows with different labels;
they display different dates for contracts with a non-zero cancellation period.

### Tests — Write FIRST, confirm failing before implementing T018

- [ ] T016 [US3] Add failing E2E test to `packages/frontend/tests/e2e/dashboard.spec.ts`: a panel entry for a contract with a cancellation period shows a "Cancel by" labelled date and an "Ends" labelled date; verify both are visible and different

### Implementation

- [ ] T017 [US3] Update `packages/frontend/src/components/UpcomingRenewals.tsx`: replace the single date display with two labelled rows — `t('dashboard.cancelBy')` + formatted `cancellationDeadline` and `t('dashboard.endsOn')` + formatted `endDate`; remove any remaining `daysRemaining` usage
- [ ] T018 [US3] Run `pnpm --filter @pcm/frontend run test:e2e`; confirm US2 and US3 E2E tests pass green

**Checkpoint**: All three user stories fully functional and independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification pass across the full stack.

- [ ] T019 [P] Run `pnpm tsc --noEmit` across all packages; resolve any remaining type errors
- [ ] T020 [P] Run complete test suite: `pnpm --filter @pcm/backend run test` and `pnpm --filter @pcm/frontend run test:e2e`; confirm fully green
- [ ] T021 Manually validate quickstart.md scenarios 1–8 against the running application

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — no dependency on US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 — technically independent of Phase 3 (different
  files: frontend only), but US2 tests need the backend shape from US1 for meaningful E2E
- **Phase 5 (US3)**: Depends on Phase 4 (same component file)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Backend — independent; can start as soon as Phase 2 is done
- **US2 (P2)**: Frontend — depends on Phase 2 (new schema type); integrates with US1 backend
- **US3 (P3)**: Frontend — depends on Phase 4 (same component); implement after US2

### Within Each Phase

- All tasks labelled `[P]` operate on different files and can run in parallel
- Tests (T007–T008, T012, T016) MUST be written and CONFIRMED FAILING before implementation
- T009 (helper) before T010 (service that uses it)
- T013–T014 (i18n) before T015 (component that reads those keys)

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
T002 (types/contract.ts)          ←─ run in parallel
T003 (schemas/contract.ts)        ←─ run in parallel
T004 (i18n YEARS label)           ←─ run in parallel
T006 (DB migration)               ←─ run in parallel
T005 (dashboard schema)           ←─ after T002 if YEARS type is imported; otherwise also parallel
```

### Phase 3 (US1) — Tests

```
T007 (unit test suite)       ←─ sequential (same file)
T008 (integration tests)     ←─ parallel with T007 (different file)
```

### Phase 4 (US2) — i18n

```
T013 (en.json)    ←─ run in parallel
T014 (de.json)    ←─ run in parallel
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Baseline check
2. Complete Phase 2: Foundational types + schema
3. Complete Phase 3: US1 backend logic + tests
4. **STOP AND VALIDATE**: `GET /api/dashboard` returns correct `upcomingRenewals` shape
5. Ship or continue to US2/US3

### Incremental Delivery

1. Phase 2 → shared types ready
2. Phase 3 → backend correct (MVP API complete)
3. Phase 4 → urgency badges in panel
4. Phase 5 → both date labels visible
5. Phase 6 → clean full test pass

---

## Notes

- All tasks have exact file paths — no additional lookup required
- `[P]` tasks operate on distinct files — safe to run concurrently
- Constitution Principle I (Test-First) is mandatory: do not skip TDD steps
- The `daysRemaining` field is removed from the API; the only consumer is
  `UpcomingRenewals.tsx` — update it before running the frontend type checker
- SQLite table rebuild (T006) preserves all existing data — safe for production DB
- German translations (T014) are required for the language toggle to work correctly
