# Tasks: Contract CRUD

**Input**: Design documents from `specs/002-contract-crud/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [data-model.md](data-model.md) · [contracts/api.md](contracts/api.md) · [research.md](research.md)

**Tests**: Included — constitution Principle I (TDD) is NON-NEGOTIABLE; all production code requires tests written and confirmed failing before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (touches different files)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Add the one new dependency (`react-router-dom`) before any code is written.

- [X] T001 Add `react-router-dom` and `@types/react-router-dom` to `packages/frontend/package.json` via `pnpm --filter @pcm/frontend add react-router-dom` then `pnpm --filter @pcm/frontend add -D @types/react-router-dom`; run `pnpm install` from repo root to update lockfile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Zod schemas and the backend `ContractService` are consumed by every user story. Nothing else can be implemented until this phase is complete.

**⚠️ CRITICAL**: All user story work is blocked until this phase passes.

- [X] T002 [P] Create `packages/shared/src/schemas/contract.ts` — define and export `ContractSchema`, `CreateContractBodySchema`, `UpdateContractBodySchema`, `ContractListResponseSchema`, and their inferred TypeScript types (`Contract`, `CreateContractBody`, `UpdateContractBody`)
- [X] T003 Export all new types and schemas from `packages/shared/src/index.ts` (`ContractSchema`, `ContractListResponseSchema`, `CreateContractBodySchema`, `UpdateContractBodySchema`, and their inferred types)
- [X] T004 [P] Write failing tests in `packages/backend/tests/unit/contract.service.test.ts` — cover: `list()` returns all rows sorted by name; `create()` inserts a row and returns the full contract with generated UUID; `update()` modifies only supplied fields and updates `updatedAt`; `update()` throws 404 when ID not found; `delete()` removes the row; `delete()` throws 404 when ID not found (use in-memory SQLite via `createDb()` + `runMigrations()`)
- [X] T005 Implement `packages/backend/src/services/contract.ts` — `ContractService` class with `list()`, `create(body: CreateContractBody)`, `update(id: string, body: UpdateContractBody)`, and `delete(id: string)` methods; follow the same constructor pattern as `DashboardService`; use `randomUUID()` from `node:crypto` for IDs; throw Fastify `createError(404, 'Contract not found')` when row absent

**Checkpoint**: `pnpm --filter @pcm/backend test` passes — service unit tests all green.

---

## Phase 3: User Story 1 — View Contract List (P1) 🎯 MVP

**Goal**: User can open `/contracts` and see all their contracts displayed with name, category, monthly amount, status, and end date. Empty state shown when no contracts exist.

**Independent Test**: Navigate to `/contracts` with seeded data — all fields visible; run with empty DB — empty-state message shown.

### Tests (write first — confirm failing before implementing)

- [X] T006 [P] [US1] Add GET `/api/contracts` describe block to `packages/backend/tests/integration/contracts.route.test.ts` — test: returns `200 []` when table empty; returns `200` array with all contract fields when rows exist; array is sorted by name ascending
- [X] T009 [P] [US1] Write `packages/frontend/tests/unit/ContractTable.test.tsx` — test: renders one row per contract; each row shows name, category, formatted monthly amount, status badge, and end date (or "—" when null); renders empty-state message when contracts array is empty
- [X] T011 [P] [US1] Write `useContracts` tests in `packages/frontend/tests/unit/contracts.service.test.ts` — mock `fetch` to return a valid contract array; assert hook returns data after loading; mock a non-ok response and assert error state

### Implementation

- [X] T007 [US1] Create `packages/backend/src/routes/contracts.ts` — implement GET `/api/contracts` route using `fastify-type-provider-zod`; response schema: `ContractListResponseSchema`; delegate to `new ContractService(fastify.db).list()`
- [X] T008 [US1] Register `contractRoutes` in `packages/backend/src/server.ts` (import and `await fastify.register(contractRoutes)` alongside `dashboardRoutes`)
- [X] T010 [US1] Implement `packages/frontend/src/components/ContractTable.tsx` — renders a `<table>` with columns: Name, Category, Monthly Amount, Status, End Date, Actions; empty-state row when `contracts` prop is empty; Actions column renders empty for now (cells reserved for US2–US4)
- [X] T012 [US1] Implement `useContracts` in `packages/frontend/src/services/contracts.ts` — `useQuery` with `queryKey: ['contracts']`, `queryFn` fetches `/api/contracts` and parses with `ContractListResponseSchema`
- [X] T013 [US1] Implement `packages/frontend/src/pages/ContractList.tsx` — calls `useContracts()`; renders loading skeleton, error message, or `<ContractTable contracts={data} />` accordingly
- [X] T014 [US1] Update `packages/frontend/src/main.tsx` — wrap in `<BrowserRouter>`, add `<Routes>`: `"/"` → `<Dashboard />`, `"/contracts"` → `<ContractList />`
- [X] T015 [US1] Add a "Manage Contracts" `<Link to="/contracts">` in `packages/frontend/src/pages/Dashboard.tsx` (place alongside or below the existing dashboard widgets)

**Checkpoint**: `GET /api/contracts` returns data; navigating to `/contracts` displays the table. `pnpm --filter @pcm/backend test` and `pnpm --filter @pcm/frontend test` both pass.

---

## Phase 4: User Story 2 — Create a Contract (P2)

**Goal**: User can click "Add Contract", fill in the form at `/contracts/new`, submit, and see the new contract in the list.

**Independent Test**: Create a new contract via the form — it appears in the list at `/contracts` immediately without a page reload.

### Tests (write first — confirm failing before implementing)

- [X] T016 [P] [US2] Add POST `/api/contracts` tests to `packages/backend/tests/integration/contracts.route.test.ts` — test: `201` with full contract body returned on valid input; `400` when `name` is missing; `400` when `monthlyAmount` is negative; `400` when `category` is an unknown value
- [X] T018 [P] [US2] Write `packages/frontend/tests/unit/ContractForm.test.tsx` — test: all fields render (name, category, monthlyAmount, status, endDate); submitting with empty name shows validation error and does not call `onSubmit`; submitting with valid data calls `onSubmit` with correct payload; clicking Cancel calls `onCancel`
- [X] T020 [P] [US2] Add `useCreateContract` tests to `packages/frontend/tests/unit/contracts.service.test.ts` — mock `fetch` for POST; assert mutation calls POST with correct body; assert `['contracts']` query is invalidated on success

### Implementation

- [X] T017 [US2] Add POST `/api/contracts` route to `packages/backend/src/routes/contracts.ts` — body schema: `CreateContractBodySchema`; response schema: `ContractSchema`; delegate to `ContractService.create()`; return `reply.status(201).send(contract)`
- [X] T019 [US2] Implement `packages/frontend/src/components/ContractForm.tsx` — controlled form with fields: name (text, required), category (select, required), monthlyAmount (number, required, ≥ 0), status (select, defaults to ACTIVE), endDate (date, optional); props: `defaultValues?`, `onSubmit(data)`, `onCancel()`; client-side required-field validation before calling `onSubmit`
- [X] T021 [US2] Implement `useCreateContract` in `packages/frontend/src/services/contracts.ts` — `useMutation` POSTing to `/api/contracts`; `onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['contracts'] })`
- [X] T022 [US2] Implement `packages/frontend/src/pages/ContractNew.tsx` — renders `<ContractForm onSubmit={...} onCancel={...} />`; on submit calls `createContract` mutation then navigates to `/contracts` via `useNavigate()`; on cancel navigates to `/contracts`
- [X] T023 [US2] Add `/contracts/new` route in `packages/frontend/src/main.tsx`; add "Add Contract" `<Link to="/contracts/new">` button in `packages/frontend/src/pages/ContractList.tsx` (rendered above the table)

**Checkpoint**: Full create flow works end-to-end. All backend and frontend unit/integration tests pass.

---

## Phase 5: User Story 3 — Edit a Contract (P3)

**Goal**: User can click Edit on any row, update fields at `/contracts/:id/edit`, and see the changes reflected in the list.

**Independent Test**: Edit a contract's monthly amount — updated value visible in list on return.

### Tests (write first — confirm failing before implementing)

- [X] T024 [P] [US3] Add PUT `/api/contracts/:id` tests to `packages/backend/tests/integration/contracts.route.test.ts` — test: `200` with updated contract on valid partial body; `404` when ID does not exist; `400` when body is empty object `{}`
- [X] T026 [P] [US3] Add `useUpdateContract` tests to `packages/frontend/tests/unit/contracts.service.test.ts` — mock `fetch` for PUT; assert mutation calls `PUT /api/contracts/:id` with correct body; assert `['contracts']` is invalidated on success
- [X] T028 [P] [US3] Write `packages/frontend/tests/unit/ContractEdit.test.tsx` — test: form is pre-populated with the contract's current values (looked up from the cached contracts list); submitting calls `useUpdateContract` and navigates to `/contracts`; cancel navigates back without updating

### Implementation

- [X] T025 [US3] Add PUT `/api/contracts/:id` route to `packages/backend/src/routes/contracts.ts` — params schema: `z.object({ id: z.string().uuid() })`; body schema: `UpdateContractBodySchema`; return 400 if body is empty; delegate to `ContractService.update(id, body)`; returns updated contract
- [X] T027 [US3] Implement `useUpdateContract` in `packages/frontend/src/services/contracts.ts` — `useMutation` calling `PUT /api/contracts/:id`; invalidates `['contracts']` on success
- [X] T029 [US3] Implement `packages/frontend/src/pages/ContractEdit.tsx` — reads `:id` from `useParams()`; sources the contract from `useContracts()` data by ID; renders `<ContractForm defaultValues={contract} onSubmit={...} onCancel={...} />`; on submit calls `updateContract` mutation then navigates to `/contracts`
- [X] T030 [US3] Add `/contracts/:id/edit` route in `packages/frontend/src/main.tsx`; add an Edit `<Link to={/contracts/${id}/edit}>` button in the Actions cell of `packages/frontend/src/components/ContractTable.tsx`

**Checkpoint**: Edit flow works end-to-end. Navigate to `/contracts/:id/edit`, change a field, verify list updates.

---

## Phase 6: User Story 4 — Delete a Contract (P4)

**Goal**: User can click Delete on a row, confirm in an inline prompt, and the contract is permanently removed from the list.

**Independent Test**: Delete a contract using Confirm — it disappears from the list. Click Delete then Cancel — contract remains.

### Tests (write first — confirm failing before implementing)

- [X] T031 [P] [US4] Add DELETE `/api/contracts/:id` tests to `packages/backend/tests/integration/contracts.route.test.ts` — test: `204` with empty body on success; `404` when ID does not exist
- [X] T033 [P] [US4] Add `useDeleteContract` tests to `packages/frontend/tests/unit/contracts.service.test.ts` — mock `fetch` for DELETE; assert mutation calls `DELETE /api/contracts/:id`; assert `['contracts']` is invalidated on success
- [X] T034 [P] [US4] Add inline delete confirmation tests to `packages/frontend/tests/unit/ContractTable.test.tsx` — test: clicking Delete sets that row into confirmation mode (shows Confirm/Cancel); clicking Cancel reverts row to normal; clicking Confirm calls `onDelete(id)`; other rows remain unaffected while one is in confirmation mode

### Implementation

- [X] T032 [US4] Add DELETE `/api/contracts/:id` route to `packages/backend/src/routes/contracts.ts` — delegate to `ContractService.delete(id)`; return `reply.status(204).send()`
- [X] T035 [US4] Implement `useDeleteContract` in `packages/frontend/src/services/contracts.ts` — `useMutation` calling `DELETE /api/contracts/:id`; invalidates `['contracts']` on success
- [X] T036 [US4] Add inline delete confirmation to `packages/frontend/src/components/ContractTable.tsx` — add `pendingDeleteId: string | null` state; when Delete clicked: set `pendingDeleteId = id`; render Confirm + Cancel buttons for that row; Confirm calls `onDelete(id)` prop and clears state; Cancel clears state; pass `onDelete` as prop from `ContractList.tsx` (which wires it to `useDeleteContract` mutation)
- [X] T037 [US4] Wire `useDeleteContract` mutation into `packages/frontend/src/pages/ContractList.tsx` and pass `onDelete` to `<ContractTable />`

**Checkpoint**: All four CRUD stories are independently functional. Full backend + frontend test suites pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end tests covering complete user journeys; error visibility; final validation.

- [X] T038 [P] Implement `packages/frontend/tests/e2e/contracts.spec.ts` — Playwright suite: (1) navigate to `/contracts`, verify list renders; (2) create a contract via form, verify it appears; (3) edit the contract, verify updated value; (4) delete with Cancel, verify survives; (5) delete with Confirm, verify gone; (6) stop backend, attempt create, verify error message displayed
- [X] T039 [P] Add visible error messages for failed mutations in `packages/frontend/src/pages/ContractList.tsx`, `packages/frontend/src/pages/ContractNew.tsx`, and `packages/frontend/src/pages/ContractEdit.tsx` — display the error from `useMutation` result when a create/update/delete call fails (satisfies SC-005: no silent failures)
- [X] T040 Run quickstart.md manual validation: start both servers, execute all scenarios in sections 3.1–3.5, confirm all six success criteria (SC-001 through SC-006) pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 completion (ContractTable and routing must exist)
- **Phase 5 (US3)**: Depends on Phase 4 completion (ContractForm must exist)
- **Phase 6 (US4)**: Depends on Phase 3 completion (ContractTable must exist — can run in parallel with US2/US3 backend work)
- **Phase 7 (Polish)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Foundational complete → can start
- **US2 (P2)**: US1 complete (needs ContractTable Actions column and routing infrastructure)
- **US3 (P3)**: US2 complete (needs ContractForm component)
- **US4 (P4)**: US1 complete (needs ContractTable) — backend tasks T031–T032 can run in parallel with US2/US3

### Within Each User Story

- Tests **MUST** be written first and confirmed failing before any implementation task in that story begins
- Backend route tasks within a story depend on the service (Phase 2) being complete
- Frontend hook tasks are independent of backend tasks within a story (different packages)
- Page component tasks depend on the hook and component tasks in the same story

### Parallel Opportunities

Within Phase 2: T002 (shared schema file) and T004 (service test) can run in parallel  
Within Phase 3: T006 (backend test), T009 (component test), T011 (hook test) can all run in parallel  
Within Phase 4: T016 (backend test), T018 (form test), T020 (hook test) can all run in parallel  
Within Phase 5: T024 (backend test), T026 (hook test), T028 (page test) can all run in parallel  
Within Phase 6: T031 (backend test), T033 (hook test), T034 (table test) can all run in parallel  
Within Phase 7: T038 (e2e) and T039 (error display) can run in parallel  

---

## Parallel Example: Phase 3 (User Story 1)

```
# Launch all three test tasks simultaneously:
Task T006: "Add GET /api/contracts tests to packages/backend/tests/integration/contracts.route.test.ts"
Task T009: "Write packages/frontend/tests/unit/ContractTable.test.tsx"
Task T011: "Write useContracts tests in packages/frontend/tests/unit/contracts.service.test.ts"

# Only after all three tests are written and confirmed failing:
Task T007: "Implement GET /api/contracts in packages/backend/src/routes/contracts.ts"
Task T010: "Implement packages/frontend/src/components/ContractTable.tsx"   [P with T007]
Task T012: "Implement useContracts in packages/frontend/src/services/contracts.ts"  [P with T007, T010]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T005)
3. Complete Phase 3: User Story 1 (T006–T015)
4. **STOP and VALIDATE**: Visit `/contracts`, confirm list renders with seeded data and empty state works
5. Backend + frontend tests pass — demo-able MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → read-only list page working → validate → demo
3. Add US2 → create flow working → validate → demo
4. Add US3 → edit flow working → validate → demo
5. Add US4 → delete flow working → validate → demo
6. Polish + e2e tests → production-ready

---

## Notes

- `[P]` tasks touch different files and have no shared state — safe to run concurrently
- TDD order within each story: write test → confirm it fails → implement → confirm it passes
- Each story's backend route tests all live in one growing file (`contracts.route.test.ts`) — add describe blocks per story phase
- `ContractForm` is introduced in US2 and reused unchanged in US3 — no duplication
- `ContractTable` gains capabilities incrementally: data display (US1) → edit button (US3) → delete confirmation (US4)
- Avoid modifying the same file simultaneously in parallel tasks — the [P] markers account for this
