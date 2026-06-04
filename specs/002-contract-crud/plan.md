# Implementation Plan: Contract CRUD

**Branch**: `002-contract-crud` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-contract-crud/spec.md`

## Summary

Add a contract list page at `/contracts` where the user can view, create, edit, and delete contracts. The backend exposes four new REST endpoints (`GET`, `POST`, `PUT`, `DELETE` on `/api/contracts`). The frontend adds React Router for navigation and a set of new pages/components backed by TanStack Query mutations. All new code is fully typed via shared Zod schemas and covered by unit, integration, and end-to-end tests written before implementation.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS, ESM modules (strict mode throughout)

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3, fastify-type-provider-zod, @pcm/shared
- Frontend: React 18, react-router-dom (new), TanStack Query 5, Zod, Tailwind CSS 4, lucide-react, @pcm/shared

**Storage**: SQLite via better-sqlite3 — existing `contracts` table, no schema migration needed

**Testing**: Vitest (unit + integration), Playwright (e2e)

**Target Platform**: Desktop browser (Chrome/Chromium for Playwright)

**Project Type**: Full-stack web application (Fastify API + React SPA)

**Performance Goals**: List page loads in < 2 seconds (SC-004); mutations return in < 500ms under normal conditions

**Constraints**: Single-user; no auth; no soft-delete; fixed category enum

**Scale/Scope**: Personal use; < 100 contracts expected

## Constitution Check

*GATE: Must pass before implementation. Re-checked after design.*

| Principle | Assessment | Status |
|-----------|------------|--------|
| I. Test-First | All new backend service methods and route handlers have unit/integration tests written first. All new frontend components have unit tests written first. Playwright e2e covers full user flows. | ✅ PASS |
| II. Type Safety | All new TypeScript is under `strict: true`. Shared Zod schemas derive all types. No `any` or untyped parameters. `fastify-type-provider-zod` enforces types at the HTTP boundary. `react-router-dom` types installed. | ✅ PASS |
| III. Simplicity | No abstractions beyond what the 4 CRUD operations require. Routing added because it is directly required (not speculative). Inline delete confirmation instead of a dialog library. Page-based forms instead of a modal library. No repository pattern — direct DB access in service layer, consistent with DashboardService. | ✅ PASS |

**No violations — Complexity Tracking section omitted.**

## Project Structure

### Documentation (this feature)

```text
specs/002-contract-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output — REST contract definitions
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code Changes

```text
packages/shared/
└── src/
    ├── schemas/
    │   └── contract.ts   (NEW — ContractSchema, CreateContractBodySchema, UpdateContractBodySchema)
    └── index.ts          (MODIFIED — export new schemas and types)

packages/backend/
└── src/
    ├── services/
    │   └── contract.ts   (NEW — ContractService: list, create, update, delete)
    ├── routes/
    │   └── contracts.ts  (NEW — GET/POST /api/contracts, PUT/DELETE /api/contracts/:id)
    └── server.ts         (MODIFIED — register contractRoutes)

packages/backend/tests/
├── unit/
│   └── contract.service.test.ts     (NEW)
└── integration/
    └── contracts.route.test.ts      (NEW)

packages/frontend/
└── src/
    ├── pages/
    │   ├── ContractList.tsx          (NEW — /contracts route)
    │   ├── ContractNew.tsx           (NEW — /contracts/new route)
    │   └── ContractEdit.tsx          (NEW — /contracts/:id/edit route)
    ├── components/
    │   ├── ContractTable.tsx         (NEW — table + inline delete confirmation)
    │   └── ContractForm.tsx          (NEW — shared create/edit form)
    ├── services/
    │   └── contracts.ts             (NEW — useContracts, useCreateContract, useUpdateContract, useDeleteContract)
    └── main.tsx                     (MODIFIED — add BrowserRouter + Route definitions)

packages/frontend/tests/
├── unit/
│   ├── ContractTable.test.tsx       (NEW)
│   ├── ContractForm.test.tsx        (NEW)
│   └── contracts.service.test.ts   (NEW — query/mutation hook tests with msw or mock fetch)
└── e2e/
    └── contracts.spec.ts            (NEW — Playwright: list, create, edit, delete flows)
```

**Structure Decision**: Web application layout (Option 2 from template) already in use. All additions follow the established `pages/`, `components/`, `services/` conventions of the frontend and `routes/`, `services/` conventions of the backend.

## Implementation Sequence

Tasks are ordered to respect the TDD constraint (tests first) and dependency order (shared → backend → frontend).

### Phase A — Shared schemas (no dependencies)

1. Write shared schema tests (ContractSchema, CreateContractBodySchema, UpdateContractBodySchema parse/reject behaviour)
2. Implement `packages/shared/src/schemas/contract.ts`
3. Export from `packages/shared/src/index.ts`

### Phase B — Backend service (depends on Phase A)

4. Write `ContractService` unit tests (list, create, update, delete — using in-memory SQLite)
5. Implement `packages/backend/src/services/contract.ts`

### Phase C — Backend routes (depends on Phase B)

6. Write contract route integration tests (all 4 endpoints including 404 paths)
7. Implement `packages/backend/src/routes/contracts.ts`
8. Register `contractRoutes` in `server.ts`

### Phase D — Frontend API hooks (depends on Phase A)

9. Write hook unit tests (`useContracts`, mutations — mock fetch)
10. Implement `packages/frontend/src/services/contracts.ts`

### Phase E — Frontend components (depends on Phase D)

11. Write `ContractTable` unit tests (renders rows, shows empty state, inline confirm flow)
12. Implement `ContractTable.tsx`
13. Write `ContractForm` unit tests (renders fields, shows validation errors, calls onSubmit)
14. Implement `ContractForm.tsx`

### Phase F — Pages & routing (depends on Phase E)

15. Write `ContractList`, `ContractNew`, `ContractEdit` page unit tests
16. Implement the three page components
17. Add `react-router-dom` dependency to `@pcm/frontend`
18. Update `main.tsx` — wrap in `<BrowserRouter>`, add routes for `/`, `/contracts`, `/contracts/new`, `/contracts/:id/edit`
19. Add navigation link from Dashboard to Contracts list

### Phase G — End-to-end tests (depends on Phase F, full stack running)

20. Implement `contracts.spec.ts` Playwright suite covering all four user stories and the delete-cancel edge case

## Key Design Notes

### ContractService pattern
Follow `DashboardService` exactly: constructor accepts `Database.Database`, no static methods, direct SQL queries (no ORM). The `list()` method returns `Contract[]` sorted by `name ASC`. `create()` sets `id = randomUUID()`, `createdAt = updatedAt = new Date().toISOString()`. `update()` sets `updatedAt` only. `delete()` throws a typed 404 error if the row does not exist.

### Route validation
Use `fastify-type-provider-zod` type provider (already configured in the project). Attach `CreateContractBodySchema` to the POST body and `UpdateContractBodySchema` to the PUT body. Fastify's built-in error handler (already in `server.ts`) returns 400 with the Zod error message on validation failure.

### Frontend data fetching
Use the same TanStack Query pattern as `useDashboard`: `queryKey: ['contracts']`, `queryFn` fetches `/api/contracts`, parses with `ContractListResponseSchema`. Mutations call `queryClient.invalidateQueries({ queryKey: ['contracts'] })` on success so the list refreshes automatically.

### Navigation
`main.tsx` currently renders `<Dashboard />` directly. After this feature, it renders `<BrowserRouter><Routes>…</Routes></BrowserRouter>`. The Dashboard route stays at `/`. A "Manage Contracts" link in the Dashboard navigates to `/contracts`.

### Inline delete confirmation
`ContractTable` tracks a `pendingDeleteId: string | null` state. When Delete is clicked for a row, that row's ID is set as `pendingDeleteId`. The row renders "Confirm / Cancel" buttons instead of the normal action buttons. Confirming calls the `useDeleteContract` mutation and clears `pendingDeleteId`. Cancelling just clears `pendingDeleteId`.
