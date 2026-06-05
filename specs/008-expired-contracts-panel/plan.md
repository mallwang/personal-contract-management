# Implementation Plan: Expired Contracts Dashboard Panel

**Branch**: `008-expired-contracts-panel` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-expired-contracts-panel/spec.md`

## Summary

Add a new "Expired Contracts" dashboard panel that lists all contracts whose end date has passed. The panel uses amber warning styling to draw attention to contracts that may have entered auto-prolongation. The feature extends the existing dashboard API response (`GET /api/dashboard`) with a new `expiredContracts` array, adds the corresponding shared type and Zod schema, and introduces a new `ExpiredContracts` React component on the frontend. No database schema changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), Node.js LTS

**Primary Dependencies**: Fastify (backend), React + Vite (frontend), better-sqlite3 (DB), Zod (validation), React Router v6, TanStack Query, react-i18next, Tailwind CSS, lucide-react, shadcn/ui (Card, Badge)

**Storage**: SQLite via better-sqlite3 — no schema migration needed

**Testing**: Vitest (unit + integration), Playwright (e2e)

**Target Platform**: Local web app (browser + Node.js server)

**Project Type**: Monorepo web application (pnpm workspaces: `backend`, `frontend`, `shared`)

**Performance Goals**: Standard — dashboard already loads within one API call; this adds one SQL query to the same endpoint

**Constraints**: No new database tables; no new API endpoints; extend existing `/api/dashboard` response

**Scale/Scope**: Personal-use tool; typically <100 contracts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ PASS | All implementation tasks include failing tests written first. New service method, component, and route changes each have corresponding test files. |
| II. Type Safety | ✅ PASS | `ExpiredContract` type and `ExpiredContractSchema` defined in shared package; propagated through backend service → API → frontend component. All fields explicitly typed. No `any`. |
| III. Simplicity (YAGNI) | ✅ PASS | No new routes, no new tables, no new abstractions. New query mirrors existing `getUpcomingRenewals()` pattern exactly. New component mirrors `UpcomingRenewals` structure. |

**Post-design re-check**: Design confirms all three principles hold. The implementation adds one private method, one Zod schema, one React component, and two i18n keys per language. No unnecessary abstraction.

## Project Structure

### Documentation (this feature)

```text
specs/008-expired-contracts-panel/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── dashboard-api.md # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
├── shared/
│   └── src/
│       └── schemas/
│           └── dashboard.ts          # Add ExpiredContractSchema + DashboardResponse update
│
├── backend/
│   ├── src/
│   │   └── services/
│   │       └── dashboard.ts          # Add getExpiredContracts() private method
│   └── tests/
│       ├── unit/
│       │   └── dashboard.service.test.ts   # Add expiredContracts test suite
│       └── integration/
│           └── dashboard.route.test.ts     # Update shape assertion + add expired tests
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ExpiredContracts.tsx         # New component (new file)
    │   ├── pages/
    │   │   └── Dashboard.tsx                # Import + render ExpiredContracts
    │   └── i18n/
    │       └── locales/
    │           ├── en.json                  # Add expiredContracts keys
    │           └── de.json                  # Add expiredContracts keys (German)
    └── tests/
        ├── unit/
        │   └── ExpiredContracts.test.tsx    # New unit test file
        └── e2e/
            └── dashboard.spec.ts            # Add expired panel e2e scenarios
```

## Implementation Steps

### Step 1 — Shared: `ExpiredContractSchema` and updated `DashboardResponseSchema`

**File**: `packages/shared/src/schemas/dashboard.ts`

1. Write failing type-level test (or unit test that imports and validates the schema shape) — test fails because `ExpiredContractSchema` does not exist yet.
2. Add `ExpiredContractSchema` Zod object with fields: `id` (UUID), `name` (string), `category` (CategoryEnum), `endDate` (YYYY-MM-DD regex), `daysOverdue` (positive integer).
3. Add `ExpiredContract` type export via `z.infer`.
4. Extend `DashboardResponseSchema` with `expiredContracts: z.array(ExpiredContractSchema)`.
5. Export `ExpiredContract` from `packages/shared/src/index.ts`.
6. Run `pnpm --filter shared build` to regenerate `dist/`.

### Step 2 — Backend: `getExpiredContracts()` in `DashboardService`

**File**: `packages/backend/src/services/dashboard.ts`

1. Write failing unit tests in `dashboard.service.test.ts` under a new `DashboardService – expiredContracts` describe block:
   - Returns `[]` when no contracts have a past end date
   - Returns contracts whose end date is before today
   - Excludes contracts with `end_date IS NULL`
   - Excludes `LIFETIME` billing interval contracts
   - Includes both `ACTIVE` and `INACTIVE` status contracts
   - Orders by `end_date DESC` (most-recently-expired first)
   - Computes `daysOverdue` correctly
2. Add `getExpiredContracts()` private method with the SQL query (see `data-model.md`).
3. Call it in `getDashboardData()` and include result as `expiredContracts` in the return object.
4. Run `pnpm --filter backend test` — all new tests pass, existing tests unchanged.

### Step 3 — Backend: Integration test update

**File**: `packages/backend/tests/integration/dashboard.route.test.ts`

1. Update the existing "returns a valid DashboardResponse shape with empty data" test to also assert `expiredContracts: []`.
2. Add a new integration test: "returns expiredContracts for contracts with a past end_date".
3. Add a new integration test: "excludes LIFETIME contracts from expiredContracts".
4. Run `pnpm --filter backend test` — all pass.

### Step 4 — Frontend: i18n keys

**Files**: `packages/frontend/src/i18n/locales/en.json`, `de.json`

Add to the `"dashboard"` section:

```json
"expiredContracts": "Expired Contracts",
"noExpiredContracts": "No expired contracts.",
"daysOverdue": "{{count}} days overdue"
```

German equivalents:

```json
"expiredContracts": "Abgelaufene Verträge",
"noExpiredContracts": "Keine abgelaufenen Verträge.",
"daysOverdue": "{{count}} Tage überfällig"
```

### Step 5 — Frontend: `ExpiredContracts` component

**File**: `packages/frontend/src/components/ExpiredContracts.tsx` (new file)

1. Write failing unit tests in `tests/unit/ExpiredContracts.test.tsx`:
   - Renders heading "Expired Contracts"
   - Renders each contract's name
   - Renders each contract's end date
   - Renders "X days overdue" badge for each entry
   - Renders empty-state message when array is empty; no amber styling on the card in empty state
   - Contract entries are wrapped in links that navigate to `/contracts/:id/edit`
   - Respects anonymization (name shown vs anonymised — if anonymisation logic is tested elsewhere, a basic render check suffices here)
2. Implement `ExpiredContracts` component:
   - Props: `expiredContracts: ExpiredContract[]`
   - Card with `border-amber-200 bg-amber-50` class when list is non-empty; no special class when empty
   - Header: title from `t('dashboard.expiredContracts')` + `AlertTriangle` icon (amber colour)
   - Empty state: neutral `<p>` with `t('dashboard.noExpiredContracts')`
   - List: `<ul>` of `<li>` items; each item wrapped in `<Link to={/contracts/${contract.id}/edit}>`
   - Each entry shows: contract name, category label, end date, and `<Badge variant="warning">{t('dashboard.daysOverdue', { count: contract.daysOverdue })}</Badge>`
   - List wrapper: `max-h-64 overflow-y-auto` to cap height

### Step 6 — Frontend: Dashboard page update

**File**: `packages/frontend/src/pages/Dashboard.tsx`

1. Import `ExpiredContracts` component.
2. Add a new `<section>` for expired contracts below the upcoming renewals section:
   ```tsx
   <section aria-label={t('dashboard.expiredContracts')} className="sm:col-span-3">
     <ExpiredContracts expiredContracts={data.expiredContracts} />
   </section>
   ```
3. The `data` object now includes `expiredContracts` from the updated `DashboardResponse` type — no additional fetching needed.

### Step 7 — Frontend: E2E tests

**File**: `packages/frontend/tests/e2e/dashboard.spec.ts`

Add E2E scenarios (see `quickstart.md` Scenarios 1–6) covering:
- Panel visible with warning styling when expired contracts exist
- Panel shows neutral/empty state when no expired contracts exist
- Clicking an entry navigates to the correct edit route

### Step 8 — Build and full test run

```bash
pnpm --filter shared build
pnpm --recursive test
pnpm lint
```

All tests pass, no lint errors.

## Complexity Tracking

> No constitution violations. This section is intentionally empty.
