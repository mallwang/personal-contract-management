# Tasks: Contract Anonymization

**Input**: Design documents from `specs/006-contract-anonymization/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api-delta.md ✅ · quickstart.md ✅

**Tests**: Included per constitution requirement (Test-First, NON-NEGOTIABLE). All test tasks must be written and confirmed failing before corresponding implementation tasks.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label (US1 / US2 / US3); omitted for setup/foundational/polish phases
- Exact file paths are included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: CSS animation infrastructure required by the flip effect across all rows.

**⚠️ Note**: No new packages, no new env vars, no new project structure. The `packages/frontend/src/data/` directory is created implicitly by writing `fantasyNames.ts`.

- [x] T001 Add `@keyframes nameFlip` (scaleX 1→0→1) and `.animate-name-flip` CSS class to `packages/frontend/src/index.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared package type changes that block both US1 (hook needs full `ContractData`) and US2 (backend validation). Must complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `anonymize: boolean` to the `Contract` interface in `packages/shared/src/types/contract.ts`
- [x] T003 Add `anonymize: z.boolean().default(false)` to `ContractSchema` and optional `anonymize: z.boolean().optional()` to `CreateContractBodySchema` in `packages/shared/src/schemas/contract.ts` (depends on T002)

**Checkpoint**: Shared types updated — frontend hook and backend service can now reference `contract.anonymize`.

---

## Phase 3: User Story 1 — Global Anonymization Toggle with Animation (Priority: P1) 🎯 MVP

**Goal**: One-click global toggle on the Contracts page replaces all contract names with fictional fantasy company names, with a horizontal flip animation on toggle. State persists in `localStorage`.

**Independent Test**: Toggle the button — all contract names flip-animate to fantasy names. Toggle again — real names flip back. Refresh page — fantasy names persist without re-animating.

### Tests for User Story 1 ⚠️ Write first — confirm FAILING before implementing

- [x] T004 [P] [US1] Write failing unit tests for `getFantasyName(id, names)` — deterministic output, same ID always returns same name, cycling when list exhausted — in `packages/frontend/tests/unit/fantasyNames.test.ts` (new file)
- [x] T005 [P] [US1] Write failing unit tests for `useAnonymization` hook — initial state from localStorage, `toggleAnonymization` flips and persists, `getDisplayName` returns fantasy name when active and real name when inactive — in `packages/frontend/tests/unit/useAnonymization.test.ts` (new file)
- [x] T006 [P] [US1] Write failing unit tests for `AnonymizationToggle` component — renders button, calls `onToggle` on click, reflects `isActive` via aria-pressed or visual state — in `packages/frontend/tests/unit/AnonymizationToggle.test.tsx` (new file)
- [x] T007 [P] [US1] Write failing unit tests for updated `ContractTable` — when `isAnonymized=true` name cell shows fantasy name not real name; when `isAnonymized=false` shows real name; animation class applied on toggle — in `packages/frontend/tests/unit/ContractTable.test.tsx` (extend existing file)
- [x] T008 [P] [US1] Write failing E2E test for global toggle flow: activate toggle → all names show fantasy names → deactivate → real names restored → refresh → state persists — in `packages/frontend/tests/e2e/anonymization.spec.ts` (new file)

### Implementation for User Story 1

- [x] T009 [P] [US1] Create fantasy names static list (`readonly string[]`, ~50 fictional company names) and `getFantasyName(id: string, names: readonly string[]): string` (char-code hash modulo length) in `packages/frontend/src/data/fantasyNames.ts` (new file)
- [x] T010 [US1] Create `useAnonymization` hook: reads/writes `localStorage` key `pcm-anonymize`, exposes `isAnonymized: boolean`, `toggleAnonymization: () => void`, `getDisplayName: (contract: ContractData) => string` (checks both global state and `contract.anonymize`) in `packages/frontend/src/hooks/useAnonymization.ts` (new file; depends on T009, T002)
- [x] T011 [P] [US1] Create `AnonymizationToggle` component: button with translated label, `isActive` prop controls visual state (active/inactive appearance), calls `onToggle` callback on click in `packages/frontend/src/components/AnonymizationToggle.tsx` (new file)
- [x] T012 [US1] Update `ContractTable` to accept `isAnonymized: boolean` and `getDisplayName: (contract: ContractData) => string` props; add `isFlipping` state, `useEffect` watching `isAnonymized` that sets `isFlipping=true`, swaps `displayAnonymized` at 200ms midpoint via `setTimeout`, clears `isFlipping` at 400ms; name cell conditionally applies `.animate-name-flip` class in `packages/frontend/src/components/ContractTable.tsx` (extend existing; depends on T001)
- [x] T013 [US1] Update `ContractList` page to use `useAnonymization` hook, render `AnonymizationToggle` in the header, pass `isAnonymized` and `getDisplayName` to `ContractTable` in `packages/frontend/src/pages/ContractList.tsx` (extend existing; depends on T010, T011, T012)
- [x] T014 [P] [US1] Add anonymization i18n keys to `packages/frontend/src/i18n/locales/en.json` and `packages/frontend/src/i18n/locales/de.json`: `anonymization.showReal`, `anonymization.hideReal`, `anonymization.toggleAriaLabel`

**Checkpoint**: Global toggle fully functional — one click hides/shows all contract names with animation; state persists across refresh.

---

## Phase 4: User Story 2 — Per-Contract Anonymization Setting (Priority: P2)

**Goal**: Contract edit form includes an "Anonymize this contract" checkbox. Checked contracts always display a fantasy name in the list, regardless of the global toggle.

**Independent Test**: Edit a contract → enable anonymize → save → confirm that contract shows a fantasy name even when the global toggle is OFF. Edit again → disable → confirm real name returns.

### Tests for User Story 2 ⚠️ Write first — confirm FAILING before implementing

- [x] T015 [P] [US2] Write failing backend unit tests for contract service `anonymize` field: `create` stores field, `update` patches field, `list` maps field, `rowToContract` converts `0/1` to `boolean` — in `packages/backend/tests/unit/contract.service.test.ts` (extend existing file)
- [x] T016 [P] [US2] Write failing backend integration tests for `anonymize` field in contract routes: `POST /contracts` accepts and returns `anonymize`, `PUT /contracts/:id` patches `anonymize`, `GET /contracts` includes `anonymize` in response — in `packages/backend/tests/integration/contracts.route.test.ts` (extend existing file)
- [x] T017 [P] [US2] Write failing frontend unit tests for `ContractForm` with `anonymize` field: checkbox renders with correct label, defaults to `false`, passes `true` to `onSubmit` when checked, `defaultValues.anonymize=true` pre-checks the checkbox — in `packages/frontend/tests/unit/ContractForm.test.tsx` (extend existing file)
- [x] T018 [P] [US2] Write failing E2E test for per-contract flow: edit contract → check "Anonymize" → save → return to list → confirm that contract shows fantasy name with global toggle OFF → global toggle ON → still shows fantasy name → edit → uncheck → save → real name shown — in `packages/frontend/tests/e2e/anonymization.spec.ts` (extend existing file from T008)

### Implementation for User Story 2

- [x] T019 [US2] Add `anonymize: number` to `ContractRow` interface and add migration guard in `runMigrations`: check for column via `PRAGMA table_info`, run `ALTER TABLE contracts ADD COLUMN anonymize INTEGER NOT NULL DEFAULT 0` if absent — in `packages/backend/src/db/client.ts` (extend existing)
- [x] T020 [P] [US2] Add `anonymize INTEGER NOT NULL DEFAULT 0` column definition to `packages/backend/src/db/schema.sql` for fresh database creation (depends on T019 for context)
- [x] T021 [US2] Update `rowToContract` to map `row.anonymize !== 0` → `boolean`; update `create` INSERT and params to include `anonymize: body.anonymize ?? false`; update `update` to patch `anonymize` field in UPDATE statement — in `packages/backend/src/services/contract.ts` (extend existing; depends on T019, T002, T003)
- [x] T022 [US2] Add `anonymize: boolean` to `ContractFormValues`; add anonymize `<input type="checkbox">` field to form UI; include `anonymize: values.anonymize` in `onSubmit` call — in `packages/frontend/src/components/ContractForm.tsx` (extend existing; depends on T002)
- [x] T023 [US2] Pass `anonymize: contract.anonymize` in `defaultValues` to `ContractForm` — in `packages/frontend/src/pages/ContractEdit.tsx` (extend existing; depends on T022)
- [x] T024 [P] [US2] Add per-contract anonymize i18n keys to `packages/frontend/src/i18n/locales/en.json` and `packages/frontend/src/i18n/locales/de.json`: `contractForm.anonymizeLabel`, `contractForm.anonymizeHint`

**Checkpoint**: Per-contract anonymization fully functional — individual contracts stay hidden independently of global toggle; setting persists through backend DB.

---

## Phase 5: User Story 3 — Fantasy Name Stability (Priority: P3)

**Goal**: The `getFantasyName` function maps each contract ID to the same fantasy name every time — stable across toggle cycles, page refreshes, and contract list reorders.

**Independent Test**: Toggle anonymization off and back on multiple times — the same fantasy name appears for the same contract ID each time without variation.

### Tests for User Story 3 ⚠️ Write first — confirm FAILING before implementing

- [x] T025 [US3] Extend `packages/frontend/tests/unit/fantasyNames.test.ts` with stability assertions: same ID called 100× always returns same name; list of 200 contracts produces no undefined/empty results; different IDs produce acceptably varied distribution (not all same index)

### Implementation for User Story 3

No new production code required — the hash function implemented in T009 already satisfies stability. T025 may reveal edge cases requiring a fix to `packages/frontend/src/data/fantasyNames.ts`.

**Checkpoint**: Stability guarantee verified by tests — same fantasy name always assigned to same contract.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and i18n consistency check.

- [x] T026 [P] Run quickstart.md Scenario 1–4 manually against dev server to confirm all acceptance criteria pass
- [x] T027 [P] Run full type check across all packages: `pnpm typecheck` — zero errors expected
- [x] T028 Run complete test suite: `pnpm --filter backend test && pnpm --filter frontend test:unit && pnpm --filter frontend test:e2e` — all green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — primary MVP delivery
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with US1 after Phase 2
- **Phase 5 (US3)**: Depends on Phase 3 (uses same `fantasyNames.ts` file)
- **Phase 6 (Polish)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: After Phase 2 — no dependency on US1 (different files except i18n)
- **US3 (P3)**: After Phase 3 (extends fantasyNames.test.ts written in T004)

### Within Each User Story

- All test tasks [T004–T008, T015–T018] MUST be written and confirmed failing BEFORE any corresponding implementation
- `fantasyNames.ts` (T009) → `useAnonymization.ts` (T010) → `ContractList.tsx` (T013)
- `client.ts` migration (T019) → `contract.ts` service (T021)
- `ContractForm.tsx` (T022) → `ContractEdit.tsx` (T023)

---

## Parallel Opportunities

### Phase 3 (US1) — can run in parallel

```
T004 fantasyNames.test.ts    T005 useAnonymization.test.ts    T006 AnonymizationToggle.test.tsx
T007 ContractTable.test.tsx  T008 anonymization.spec.ts (E2E)

T009 fantasyNames.ts         T011 AnonymizationToggle.tsx      T014 i18n keys
```

### Phase 4 (US2) — can run in parallel

```
T015 contract.service.test.ts    T016 contracts.route.test.ts
T017 ContractForm.test.tsx       T018 anonymization.spec.ts (E2E)

T019+T020 DB migration           T024 i18n keys
```

### Cross-phase parallel (after Phase 2)

```
Developer A: Phase 3 (US1 — frontend toggle, animation, hook)
Developer B: Phase 4 (US2 — backend DB, service, form)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: CSS animation keyframe
2. Complete Phase 2: Shared types
3. Write US1 failing tests (T004–T008)
4. Implement US1 (T009–T014)
5. **STOP and VALIDATE**: Global toggle works end-to-end
6. Demo: screen-sharing privacy without per-contract control

### Incremental Delivery

1. Setup + Foundational → shared types ready
2. US1 → global toggle with animation (MVP — immediately useful for screen sharing)
3. US2 → per-contract persistent anonymization (adds fine-grained control)
4. US3 → stability test coverage (adds confidence guarantee)
5. Each step adds value without breaking the previous one

---

## Notes

- `[P]` tasks operate on different files — safe to assign or execute concurrently
- TDD is non-negotiable (constitution): every test task must fail before its implementation task runs
- The CSS keyframe (T001) must exist before `ContractTable` references the animation class (T012)
- Shared types (T002–T003) must be rebuilt (`pnpm build --filter shared`) before backend/frontend TypeScript picks them up
- The `useAnonymization` hook handles both global toggle AND per-contract flags — implementing T010 after T002 ensures it is US2-compatible from the start and requires no rework
