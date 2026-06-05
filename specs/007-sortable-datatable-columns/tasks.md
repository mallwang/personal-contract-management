# Tasks: Sortable Contract Table Columns

**Input**: Design documents from `specs/007-sortable-datatable-columns/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story. Constitution mandates TDD — test tasks MUST be written and confirmed failing before implementation tasks in the same story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different concerns, no shared-file conflicts)
- **[Story]**: Which user story the task belongs to

---

## Phase 1: Setup

**Purpose**: Confirm the current baseline is green before any changes are made.

- [ ] T001 Run existing `ContractTable` test suite and confirm all tests pass: `cd packages/frontend && pnpm test -- ContractTable`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Inline type definitions shared by both user stories. Both US1 and US2 depend on these types existing in the component file before any logic is added.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `SortColumn`, `SortDirection`, and `SortState` type definitions at the top of `packages/frontend/src/components/ContractTable.tsx` (above the `ContractTableProps` interface) per `specs/007-sortable-datatable-columns/data-model.md`
- [ ] T003 Add `sortState` / `setSortState` via `useState<SortState>` and a `sortedContracts` derived value (initially just `contracts` unchanged) inside `ContractTable` in `packages/frontend/src/components/ContractTable.tsx`; replace the `contracts.map(...)` in JSX with `sortedContracts.map(...)`

**Checkpoint**: Types defined, hook wired, existing tests still pass.

---

## Phase 3: User Story 1 — Sort Contracts by Column (Priority: P1) 🎯 MVP

**Goal**: Clicking a sortable column header reorders rows through a three-state cycle (asc → desc → unsorted). Amount column sorts by numeric value only.

**Independent Test**: `cd packages/frontend && pnpm test -- ContractTable` — all sort-behaviour tests in the new `ContractTable – sorting` describe block pass.

### Tests for User Story 1 ⚠️ Write FIRST — confirm they FAIL before implementing T007–T008

- [ ] T004 [US1] Add describe block `ContractTable – sorting` to `packages/frontend/tests/unit/ContractTable.test.tsx`; write failing test: clicking "Name" header once sorts rows A→Z
- [ ] T005 [P] [US1] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: clicking "Name" header twice sorts rows Z→A
- [ ] T006 [P] [US1] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: clicking "Name" header three times restores original order
- [ ] T007 [P] [US1] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: clicking "Amount" header sorts rows by numeric `contract.amount` ascending (row with lower amount appears first, regardless of billing interval)
- [ ] T008 [P] [US1] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: contract with `endDate: null` sorts last when "End Date" header clicked once (ascending), and first when clicked twice (descending)
- [ ] T009 [P] [US1] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: clicking a different sortable column resets direction to ascending on the new column

### Implementation for User Story 1

- [ ] T010 [US1] Implement the column comparator map and direction-aware sort in `packages/frontend/src/components/ContractTable.tsx`: replace the placeholder `contracts` in `sortedContracts` with a `[...contracts].sort(comparator)` call driven by `sortState`, using the comparators defined in `specs/007-sortable-datatable-columns/data-model.md`
- [ ] T011 [US1] Add `onClick` handlers to the five sortable `<th>` elements (Name, Category, Amount, Status, End Date) in `packages/frontend/src/components/ContractTable.tsx` that call `setSortState` with the three-state cycle logic from `specs/007-sortable-datatable-columns/data-model.md`; leave the Actions `<th>` without a handler

**Checkpoint**: All User Story 1 tests pass. Rows reorder correctly on header click; Actions column is inert.

---

## Phase 4: User Story 2 — Visual Sort Direction Indicator (Priority: P2)

**Goal**: The active sort column header shows an up/down arrow icon; unsorted sortable headers show a neutral double-chevron; the Actions header shows no icon.

**Independent Test**: `cd packages/frontend && pnpm test -- ContractTable` — all indicator tests in the new `ContractTable – sort indicators` describe block pass.

### Tests for User Story 2 ⚠️ Write FIRST — confirm they FAIL before implementing T015–T016

- [ ] T012 [US2] Add describe block `ContractTable – sort indicators` to `packages/frontend/tests/unit/ContractTable.test.tsx`; write failing test: when no sort is active, each sortable header contains an element with `aria-label="Sort"` (the neutral `ChevronsUpDown` icon)
- [ ] T013 [P] [US2] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: after clicking a sortable header once, that header contains an element with `aria-label="Sorted ascending"` (`ChevronUp` icon)
- [ ] T014 [P] [US2] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: after clicking the same sortable header twice, that header contains an element with `aria-label="Sorted descending"` (`ChevronDown` icon)
- [ ] T015 [P] [US2] Write failing test in `packages/frontend/tests/unit/ContractTable.test.tsx`: the Actions column header contains no sort icon (query for `aria-label="Sort"` inside the Actions `<th>` returns null)

### Implementation for User Story 2

- [ ] T016 [US2] Add `import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'` to `packages/frontend/src/components/ContractTable.tsx`
- [ ] T017 [US2] Render the appropriate lucide-react icon inside each sortable `<th>` in `packages/frontend/src/components/ContractTable.tsx`: `ChevronUp` (aria-label="Sorted ascending") when column is active+asc, `ChevronDown` (aria-label="Sorted descending") when active+desc, `ChevronsUpDown` (aria-label="Sort") otherwise; add `className="cursor-pointer select-none"` to sortable headers and keep the Actions `<th>` unchanged

**Checkpoint**: All User Story 2 tests pass. Icons appear and update correctly; Actions header has no icon.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the whole feature.

- [ ] T018 Run complete frontend test suite and confirm zero regressions: `cd packages/frontend && pnpm test`
- [ ] T019 Perform manual browser validation per `specs/007-sortable-datatable-columns/quickstart.md` (golden path + anonymization + edit/delete regression)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks both user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — tests written first (T004–T009), then implementation (T010–T011)
- **User Story 2 (Phase 4)**: Depends on User Story 1 being complete (icons depend on sort state being wired)
- **Polish (Phase 5)**: Depends on both user stories complete

### Within Each User Story

- All test tasks (T004–T009 for US1, T012–T015 for US2) MUST be written and confirmed **failing** before the implementation tasks in the same story
- Tests marked [P] within a story can be written in parallel (they cover distinct scenarios in the same test file)

### Parallel Opportunities

- T005, T006, T007, T008, T009 — all parallelisable (distinct test cases, same file, no shared state)
- T013, T014, T015 — all parallelisable (distinct indicator tests)

---

## Parallel Example: User Story 1 Tests

```bash
# After writing T004, write these concurrently (all in ContractTable.test.tsx):
T005 – Z→A sort test
T006 – restore-original-order test
T007 – amount numeric sort test
T008 – null endDate boundary test
T009 – column-switch reset test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline green)
2. Complete Phase 2: Foundational (types + wired hook)
3. Complete Phase 3: User Story 1 (sort logic)
4. **STOP and VALIDATE**: `pnpm test -- ContractTable` — all US1 tests pass
5. Sort is functional — ship if needed

### Incremental Delivery

1. Setup + Foundational → baseline confirmed, types in place
2. User Story 1 → clickable sort, correct row order (MVP)
3. User Story 2 → sort direction icons (polish)
4. Polish phase → full validation

---

## Notes

- All code changes are confined to two files: `packages/frontend/src/components/ContractTable.tsx` and `packages/frontend/tests/unit/ContractTable.test.tsx`
- No backend, shared package, or i18n changes are required
- `lucide-react` is already installed — no new dependency needed
- TDD is NON-NEGOTIABLE per constitution Principle I: every test must be confirmed failing before the implementation it covers is written
