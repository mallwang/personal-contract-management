---

description: "Task list for Welcome Dashboard feature"
---

# Tasks: Welcome Dashboard

**Input**: Design documents from `specs/001-welcome-dashboard/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Included — Constitution Principle I (Test-First) is NON-NEGOTIABLE. Tests MUST be
written and confirmed failing before the corresponding implementation task begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. The three stories (spending total, category breakdown, upcoming renewals)
all extend the same backend service incrementally.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths are included in every task description

## Path Conventions

- Shared types/schemas: `packages/shared/src/`
- Backend: `packages/backend/src/`, tests in `packages/backend/tests/`
- Frontend: `packages/frontend/src/`, tests in `packages/frontend/tests/`

---

## Phase 1: Setup

**Purpose**: Repository and workspace initialization — no code logic yet

- [x] T00 Initialize pnpm monorepo: create `pnpm-workspace.yaml` listing `packages/*` and root `package.json` with workspace scripts (`dev`, `build`, `test`, `lint`)
- [x] T00 [P] Scaffold `packages/shared`: create `packages/shared/package.json` (name `@pcm/shared`) and `packages/shared/tsconfig.json` (`strict: true`, ESM, no emit)
- [x] T00 [P] Scaffold `packages/backend`: create `packages/backend/package.json` (deps: fastify, @fastify/cors, @fastify/type-provider-zod, better-sqlite3, zod; devDeps: vitest, @types/better-sqlite3) and `packages/backend/tsconfig.json` (`strict: true`, ESM, `composite: true`)
- [x] T00 [P] Scaffold `packages/frontend`: create `packages/frontend/package.json` (deps: react, react-dom, @tanstack/react-query; devDeps: vite, @vitejs/plugin-react, vitest, @testing-library/react, @testing-library/user-event, jsdom, playwright) and `packages/frontend/tsconfig.json` (`strict: true`)
- [x] T00 [P] Configure ESLint + Prettier at repository root: create `.eslintrc.json` (typescript-eslint, react plugin) and `.prettierrc` shared by all packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, database, server bootstrap, and service/route shells that all user
stories depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Each task in this phase must be complete before any Phase 3+ task begins.

- [x] T00 Define `Category` and `ContractStatus` TypeScript enums in `packages/shared/src/types/contract.ts` — export both as `const` objects with `as const` (not TypeScript `enum` keyword to preserve ESM compatibility)
- [x] T00 Define Zod schemas `DashboardResponseSchema`, `CategorySummarySchema`, `UpcomingRenewalSchema` in `packages/shared/src/schemas/dashboard.ts`; export inferred TypeScript types alongside each schema (depends on T006)
- [x] T00 Write SQLite `CREATE TABLE contracts` statement in `packages/backend/src/db/schema.sql` matching the schema in `data-model.md`
- [x] T00 Implement database client in `packages/backend/src/db/client.ts`: better-sqlite3 connection singleton, `runMigrations()` (reads schema.sql), and `seedDatabase()` with the 8 sample contracts from `quickstart.md` (depends on T008)
- [x] T01 [P] Bootstrap Fastify server in `packages/backend/src/server.ts`: register `@fastify/cors`, `@fastify/type-provider-zod`, global error handler; export `buildServer()` factory for use in tests (depends on T003, T007)
- [x] T01 Register `GET /api/dashboard` route shell in `packages/backend/src/routes/dashboard.ts`: calls `DashboardService.getDashboardData()`, validates response against `DashboardResponseSchema`, returns result — no logic here (depends on T007, T010)
- [x] T01 Create `DashboardService` class in `packages/backend/src/services/dashboard.ts`: constructor accepts a better-sqlite3 `Database` instance; `getDashboardData()` returns a valid `DashboardResponse` with `totalMonthlySpending: 0`, `contractsByCategory: []`, `upcomingRenewals: []` (stub — filled in by each user story) (depends on T007, T009)
- [x] T01 Bootstrap React app in `packages/frontend/src/main.tsx`: mount `<App />` with `<QueryClientProvider>` wrapping; configure `QueryClient` with sensible defaults (staleTime 30s) (depends on T004)
- [x] T01 Create `Dashboard` page shell in `packages/frontend/src/pages/Dashboard.tsx`: calls `useDashboard()` hook, renders three placeholder `<section>` elements (one per user story panel); register as default route `"/"` (depends on T013)
- [x] T01 Implement `useDashboard()` TanStack Query hook in `packages/frontend/src/services/api.ts`: fetches `GET /api/dashboard`, parses response with `DashboardResponseSchema`, returns `UseQueryResult<DashboardResponse>` (depends on T007, T013)

**Checkpoint**: Run `pnpm --filter backend dev` and `curl http://localhost:3000/api/dashboard` — expect `{"totalMonthlySpending":0,"contractsByCategory":[],"upcomingRenewals":[]}` before any user story is started.

---

## Phase 3: User Story 1 — Spending Overview (Priority: P1) 🎯 MVP

**Goal**: User sees the correct total active monthly spending on the dashboard.

**Independent Test**: Seed the database, start both servers, open the browser — the spending
total must equal the sum of all ACTIVE contract `monthly_amount` values from the seed data
(€1,347.50 per `quickstart.md`).

### Tests for User Story 1 ⚠️ Write first — confirm FAILING before T017

- [x] T01 [P] [US1] Write unit test in `packages/backend/tests/unit/dashboard.service.test.ts`: assert `getDashboardData().totalMonthlySpending` equals sum of active contract amounts only (inactive excluded); covers zero-contract empty state
- [x] T01 [P] [US1] Write unit test in `packages/frontend/tests/unit/SpendingOverview.test.tsx`: assert component renders formatted amount; assert empty-state message when `totalMonthlySpending === 0`

### Implementation for User Story 1

- [x] T01 [US1] Implement `totalMonthlySpending` SQL aggregation in `DashboardService.getDashboardData()` in `packages/backend/src/services/dashboard.ts` — `SELECT COALESCE(SUM(monthly_amount),0) FROM contracts WHERE status='ACTIVE'` (makes T016 pass; depends on T012, T016)
- [x] T01 [US1] Implement `SpendingOverview` component in `packages/frontend/src/components/SpendingOverview.tsx`: accepts `totalMonthlySpending: number` prop; displays formatted currency value; displays empty-state text when zero (makes T018 pass; depends on T018)
- [x] T02 [US1] Wire `SpendingOverview` into `Dashboard` page in `packages/frontend/src/pages/Dashboard.tsx`: pass `data.totalMonthlySpending` from `useDashboard()` result (depends on T014, T015, T019)

**Checkpoint**: Seed DB → start backend + frontend → confirm €1,347.50 total is displayed. User Story 1 is independently deliverable at this point.

---

## Phase 4: User Story 2 — Contracts by Category (Priority: P2)

**Goal**: User sees a breakdown of active contracts grouped by category, with count and
combined monthly cost per category.

**Independent Test**: Seed the database — confirm three category rows appear (Housing,
Utilities, Subscriptions). Confirm the inactive "Old gym" contract does NOT create an OTHER row.

### Tests for User Story 2 ⚠️ Write first — confirm FAILING before T022

- [x] T02 [P] [US2] Write unit test in `packages/backend/tests/unit/dashboard.service.test.ts`: assert `getDashboardData().contractsByCategory` groups active contracts correctly; assert categories with no active contracts are excluded; covers empty state
- [x] T02 [P] [US2] Write unit test in `packages/frontend/tests/unit/CategoryBreakdown.test.tsx`: assert component renders one row per category with label, count, and formatted total; assert empty-state message when array is empty

### Implementation for User Story 2

- [x] T02 [US2] Implement `contractsByCategory` aggregation in `DashboardService.getDashboardData()` in `packages/backend/src/services/dashboard.ts` — `GROUP BY category WHERE status='ACTIVE'` query; map category value to display label using the Category type (makes T021 pass; depends on T017, T021)
- [x] T02 [US2] Implement `CategoryBreakdown` component in `packages/frontend/src/components/CategoryBreakdown.tsx`: accepts `contractsByCategory: CategorySummary[]` prop; renders table/list with label, count, and formatted monthly total; renders empty-state text when array is empty (makes T023 pass; depends on T023)
- [x] T02 [US2] Add `CategoryBreakdown` panel to `Dashboard` page in `packages/frontend/src/pages/Dashboard.tsx`: pass `data.contractsByCategory` from `useDashboard()` result (depends on T020, T024)

**Checkpoint**: Reload the dashboard — all three category rows (Housing, Utilities, Subscriptions) appear below the spending total. Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 — Upcoming Renewals (Priority: P3)

**Goal**: User sees contracts expiring within the next 30 days, sorted by end date ascending.

**Independent Test**: Seed the database — confirm only the Netflix contract (end date within
30 days) appears in the renewals section. Contracts without an end date must not appear.

### Tests for User Story 3 ⚠️ Write first — confirm FAILING before T027

- [x] T02 [P] [US3] Write unit test in `packages/backend/tests/unit/dashboard.service.test.ts`: assert `getDashboardData().upcomingRenewals` returns only contracts with `endDate` within 30 days; assert sorted ascending by `endDate`; assert `daysRemaining` is calculated correctly; covers empty state
- [x] T02 [P] [US3] Write unit test in `packages/frontend/tests/unit/UpcomingRenewals.test.tsx`: assert component renders contract name, category, end date, and days remaining; assert empty-state message ("No renewals due soon") when array is empty

### Implementation for User Story 3

- [x] T02 [US3] Implement `upcomingRenewals` query in `DashboardService.getDashboardData()` in `packages/backend/src/services/dashboard.ts` — SQL: `WHERE end_date IS NOT NULL AND end_date BETWEEN DATE('now') AND DATE('now','+30 days') ORDER BY end_date ASC`; compute `daysRemaining` in application code (makes T026 pass; depends on T022, T026)
- [x] T02 [US3] Implement `UpcomingRenewals` component in `packages/frontend/src/components/UpcomingRenewals.tsx`: accepts `upcomingRenewals: UpcomingRenewal[]` prop; renders list with name, category label, formatted end date, and days remaining badge; renders "No renewals due soon" when array is empty (makes T028 pass; depends on T028)
- [x] T030 [US3] Add `UpcomingRenewals` panel to `Dashboard` page in `packages/frontend/src/pages/Dashboard.tsx`: pass `data.upcomingRenewals` from `useDashboard()` result (depends on T025, T029)

**Checkpoint**: Reload the dashboard — all three panels visible. Netflix appears in renewals. All user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Loading/error states, full integration test, e2e coverage, and manual validation

- [x] T031 [P] Write integration test for `GET /api/dashboard` in `packages/backend/tests/integration/dashboard.route.test.ts`: spin up Fastify test server, insert known fixtures, call endpoint, assert full `DashboardResponse` shape including all three fields (depends on T027)
- [x] T032 [P] Write Playwright e2e test in `packages/frontend/tests/e2e/dashboard.spec.ts`: seed database, start both servers via `globalSetup`, navigate to `http://localhost:5173`, assert spending total, category rows, and Netflix renewal are all visible without scrolling at 1280×800 (depends on T030)
- [x] T033 Add loading skeleton and error message to `Dashboard` page in `packages/frontend/src/pages/Dashboard.tsx`: show loading state while `useDashboard().isLoading`; show user-friendly error message when `useDashboard().isError` (depends on T030)
- [ ] T034 Run `quickstart.md` validation end-to-end: execute all acceptance scenarios from `specs/001-welcome-dashboard/quickstart.md`, confirm each passes including the empty-state reset scenario

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; [P] tasks run in parallel
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories; T006→T007→T008→T009 sequential; T010, T011, T012, T013, T014, T015 can start after their own prerequisites
- **US1 (Phase 3)**: Depends on Foundational complete — T016 and T018 in parallel (write tests first); T017 after T016; T019 after T018; T020 after T019
- **US2 (Phase 4)**: Depends on US1 complete — T021 and T023 in parallel; T022 after T021; T024 after T023; T025 after T024
- **US3 (Phase 5)**: Depends on US2 complete — T026 and T028 in parallel; T027 after T026; T029 after T028; T030 after T029
- **Polish (Phase 6)**: T031 and T032 can run in parallel after Phase 5 complete; T033 after T030; T034 last

### Within Each User Story

```
Write tests (FAIL) → Implement (PASS) → Wire into page → Checkpoint
```

### Parallel Opportunities per Story

```bash
# US1 — write both tests in parallel:
Task T016: dashboard.service.test.ts (spending total)
Task T018: SpendingOverview.test.tsx

# US2 — write both tests in parallel:
Task T021: dashboard.service.test.ts (by-category)
Task T023: CategoryBreakdown.test.tsx

# US3 — write both tests in parallel:
Task T026: dashboard.service.test.ts (renewals)
Task T028: UpcomingRenewals.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (spending total)
4. **STOP and VALIDATE**: `curl /api/dashboard` returns correct total; browser shows €1,347.50
5. Ship / demo

### Incremental Delivery

1. Setup + Foundational → skeleton running
2. US1 → spending total visible → MVP
3. US2 → category breakdown added
4. US3 → upcoming renewals added
5. Polish → fully tested and validated

---

## Notes

- `[P]` tasks have no shared file dependencies with each other — safe to parallelize
- `[Story]` labels trace each task back to a specific user story for independent testing
- Tests MUST fail before the corresponding implementation task is started (Constitution I)
- Commit after each checkpoint to preserve independently working increments
- `daysRemaining` computed in application code (not SQL) for testability
