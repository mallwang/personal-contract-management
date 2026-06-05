---
description: "Task list for Expired Contracts Dashboard Panel"
---

# Tasks: Expired Contracts Dashboard Panel

**Input**: Design documents from `specs/008-expired-contracts-panel/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/dashboard-api.md ✅ quickstart.md ✅

**Tests**: Included — TDD is NON-NEGOTIABLE per project constitution (Principle I). All test tasks MUST be written and confirmed failing before the corresponding implementation task begins.

**Organization**: Tasks are grouped by user story. The foundational phase (shared type layer) blocks all user story work — it must complete first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (touches different files, no in-flight dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational — Shared Type Layer

**Purpose**: Establish the `ExpiredContract` type and extend `DashboardResponse`. Both the backend service and frontend component depend on this — no user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Phases 2–4 are blocked until this phase is complete and `pnpm --filter shared build` succeeds.

- [x] T001 Add `ExpiredContractSchema` Zod schema (id, name, category, endDate, daysOverdue) to `packages/shared/src/schemas/dashboard.ts`
- [x] T002 Extend `DashboardResponseSchema` with `expiredContracts: z.array(ExpiredContractSchema)` in `packages/shared/src/schemas/dashboard.ts`
- [x] T003 Export `ExpiredContract` type and `ExpiredContractSchema` from `packages/shared/src/index.ts`
- [x] T004 Rebuild shared package by running `pnpm --filter shared build` to regenerate `packages/shared/dist/`

**Checkpoint**: `pnpm --filter shared build` succeeds; `ExpiredContract` is importable from `@pcm/shared`

---

## Phase 2: User Story 1 — View Expired Contracts at a Glance (Priority: P1) 🎯 MVP

**Goal**: The dashboard shows a dedicated amber-styled panel listing all contracts whose end date is before today, with contract name, end date, and a "X days overdue" badge.

**Independent Test**: Load the dashboard with at least one contract with a past end date; confirm the "Expired Contracts" panel appears with amber background and lists the contract with correct overdue count.

### Tests for User Story 1 (write FIRST — confirm FAILING before T007)

- [x] T005 Write failing backend unit tests for `DashboardService.expiredContracts` in `packages/backend/tests/unit/dashboard.service.test.ts`:
  - Returns `[]` when no contracts have a past end date
  - Returns contracts whose `end_date` is strictly before today
  - Excludes contracts with `end_date IS NULL`
  - Excludes contracts with `billing_interval = 'LIFETIME'`
  - Includes both `ACTIVE` and `INACTIVE` status contracts
  - Orders by `end_date DESC` (most-recently-expired first)
  - Computes `daysOverdue` correctly (positive integer, calendar-day granularity)
- [x] T006 [P] Write failing frontend unit tests for `ExpiredContracts` component in `packages/frontend/tests/unit/ExpiredContracts.test.tsx`:
  - Renders a heading "Expired Contracts"
  - Renders the contract name for each entry
  - Renders the end date for each entry
  - Renders "X days overdue" badge for each entry

### Implementation for User Story 1

- [x] T007 Add `getExpiredContracts()` private method to `DashboardService` in `packages/backend/src/services/dashboard.ts` using SQL: `WHERE end_date IS NOT NULL AND billing_interval != 'LIFETIME' AND end_date < DATE('now') ORDER BY end_date DESC`; compute `daysOverdue` via `Math.round((today - end) / 86_400_000)`
- [x] T008 Add `expiredContracts: this.getExpiredContracts()` to the `getDashboardData()` return object in `packages/backend/src/services/dashboard.ts`
- [x] T009 [P] Add English i18n keys to `packages/frontend/src/i18n/locales/en.json` under `"dashboard"`: `expiredContracts`, `noExpiredContracts`, `daysOverdue`
- [x] T010 [P] Add German i18n keys to `packages/frontend/src/i18n/locales/de.json` under `"dashboard"`: `expiredContracts`, `noExpiredContracts`, `daysOverdue`
- [x] T011 Create `packages/frontend/src/components/ExpiredContracts.tsx`: `Card` with amber styling (`border-amber-200 bg-amber-50`) when list non-empty; `AlertTriangle` icon header; `<ul>` of entries showing name, category, end date, and `<Badge variant="warning">` for `daysOverdue`; list wrapper uses `max-h-64 overflow-y-auto`; neutral empty state when list is empty
- [x] T012 Import `ExpiredContracts` and add `<section aria-label={t('dashboard.expiredContracts')} className="sm:col-span-3">` with `<ExpiredContracts expiredContracts={data.expiredContracts} />` to `packages/frontend/src/pages/Dashboard.tsx` below the upcoming renewals section

**Checkpoint**: Dashboard renders expired contracts panel with amber background; `pnpm --filter backend test` passes all new unit tests

---

## Phase 3: User Story 2 — Navigate to Contract Detail from Expired Panel (Priority: P2)

**Goal**: Each expired contract entry in the panel is a clickable link that navigates to `/contracts/:id/edit`.

**Independent Test**: Click an entry in the expired contracts panel; browser navigates to `/contracts/<id>/edit` and the correct contract edit form loads.

### Tests for User Story 2 (write FIRST — confirm FAILING before T014)

- [x] T013 Add failing unit test to `packages/frontend/tests/unit/ExpiredContracts.test.tsx`: contract entries are rendered inside an element with an `href` pointing to `/contracts/<id>/edit`

### Implementation for User Story 2

- [x] T014 Wrap each expired contract `<li>` entry in `<Link to={/contracts/${contract.id}/edit}>` in `packages/frontend/src/components/ExpiredContracts.tsx` (React Router v6 `<Link>`)

**Checkpoint**: Clicking any entry in the expired panel routes to the contract edit page; T013 passes

---

## Phase 4: User Story 3 — Empty State When No Contracts Are Expired (Priority: P3)

**Goal**: When no contracts are expired, the panel shows a neutral (non-amber) empty state message. No warning styling is displayed when there is nothing actionable.

**Independent Test**: Ensure no contracts have a past end date; reload dashboard; confirm the panel shows "No expired contracts." without amber background or border.

### Tests for User Story 3 (write FIRST — confirm FAILING before T016)

- [x] T015 Add failing unit test to `packages/frontend/tests/unit/ExpiredContracts.test.tsx`: when `expiredContracts` prop is `[]`, the component renders the empty-state message and does NOT apply amber border/background classes to the card

### Implementation for User Story 3

- [x] T016 Make amber `Card` classes (`border-amber-200 bg-amber-50`) conditional on `expiredContracts.length > 0` in `packages/frontend/src/components/ExpiredContracts.tsx`; when empty, render a neutral `<Card>` with the `t('dashboard.noExpiredContracts')` message in muted text

**Checkpoint**: All three user story panels work correctly; `pnpm --filter frontend test` passes all unit tests

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Integration and e2e test coverage, final validation.

- [x] T017 Update the existing "returns a valid DashboardResponse shape with empty data" test to also assert `expiredContracts: []` in `packages/backend/tests/integration/dashboard.route.test.ts`
- [x] T018 [P] Add new integration tests for `expiredContracts` in `packages/backend/tests/integration/dashboard.route.test.ts`: (a) returns contracts with a past end date; (b) excludes LIFETIME contracts
- [x] T019 Add e2e tests for the expired contracts panel in `packages/frontend/tests/e2e/dashboard.spec.ts` per `quickstart.md` Scenarios 1–6: panel visible with amber styling when expired contract exists; neutral empty state when no expired contracts; click navigates to edit page; LIFETIME contracts excluded; anonymization toggle respected
- [x] T020 Run full build and test suite: `pnpm --filter shared build && pnpm --recursive test && pnpm lint` — confirm all 0 failures and 0 lint errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately; BLOCKS all subsequent phases
- **US1 (Phase 2)**: Depends on Phase 1 completion; T005 and T006 can start as soon as shared build succeeds; T007/T008 after T005 passes; T009/T010 can run in parallel with T007; T011 after T008 + T009/T010; T012 after T011
- **US2 (Phase 3)**: Depends on Phase 2 (T011 must exist); T013 written and failing before T014
- **US3 (Phase 4)**: Depends on Phase 2 (T011 must exist); T015 written and failing before T016
- **Polish (Phase 5)**: Depends on Phases 2–4 complete; T017/T018/T019 are independent of each other

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational — no dependency on US2 or US3
- **US2 (P2)**: Depends on US1's `ExpiredContracts.tsx` existing (T011) — modifies the same component file
- **US3 (P3)**: Depends on US1's `ExpiredContracts.tsx` existing (T011) — modifies the same component file
- US2 and US3 can be done in either order after US1 since they touch the same file but non-overlapping logic

### Within Each Phase (TDD order)

1. Write failing test → confirm it fails for the RIGHT reason
2. Implement the minimum code to make the test pass
3. Refactor while keeping tests green

---

## Parallel Opportunities

### Phase 1

- T001, T002, T003 must be sequential (T002 depends on T001; T003 depends on T001)
- T004 after T001–T003

### Phase 2

```
After Phase 1 completes:
  T005 (backend unit tests) ─────────────────────┐
  T006 (frontend unit tests) [P with T005] ──────┤
                                                  ▼
  T007 (getExpiredContracts impl) ───────── after T005 confirms fail
  T009 (EN i18n) [P with T007]
  T010 (DE i18n) [P with T007]
                                                  ▼
  T008 (wire into getDashboardData) ─── after T007
  T011 (ExpiredContracts component) ─── after T008 + T009 + T010
  T012 (Dashboard.tsx update) ────────── after T011
```

### Phase 5

```
T017, T018 [P] — different test cases in same file
T019 — independent (different file)
T020 — after T017, T018, T019
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1 (Foundational)
2. Complete Phase 2 (US1)
3. **STOP and VALIDATE** per `quickstart.md` Scenarios 1–2
4. Ship MVP — dashboard shows expired contracts with warning styling

### Incremental Delivery

1. Phase 1 + Phase 2 → Expired panel visible on dashboard (**MVP**)
2. Phase 3 → Entries are clickable, navigate to edit
3. Phase 4 → Empty state is clean and neutral
4. Phase 5 → Full test coverage and CI-ready

---

## Notes

- All test tasks must be written and **confirmed failing** before the corresponding implementation task
- `pnpm --filter shared build` must succeed after Phase 1 before any frontend or backend implementation
- After T011 (component created), T014 (US2) and T016 (US3) both modify `ExpiredContracts.tsx` — do not run them in parallel
- The amber styling classes (`border-amber-200 bg-amber-50`, `text-amber-600`) are in the Tailwind utility space already used by the `Badge` component — no new CSS required
- Refer to `quickstart.md` for manual validation steps after each checkpoint
