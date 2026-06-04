# Implementation Plan: Welcome Dashboard

**Branch**: `001-welcome-dashboard` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-welcome-dashboard/spec.md`

## Summary

Read-only dashboard page displaying three statistics panels: total active monthly spending,
active contracts grouped by category (count + combined cost), and contracts expiring within
30 days. The backend exposes a single aggregated `GET /api/dashboard` endpoint; the frontend
renders three panels on the default landing route. Single-user, single-currency, no
authentication required.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js LTS v22

**Primary Dependencies**:
- Backend: Fastify 5.x, better-sqlite3, zod, @fastify/type-provider-zod, @fastify/cors
- Frontend: React 18, Vite 5, TanStack Query v5
- Shared: zod (shared types and runtime validation schemas)
- Testing: Vitest 2.x, @testing-library/react, Playwright

**Storage**: SQLite via better-sqlite3 (file-based, no server process required)

**Testing**: Vitest (unit + integration), Playwright (end-to-end)

**Target Platform**: Desktop web browser — locally hosted at `http://localhost`

**Project Type**: Full-stack web application (Fastify API + React SPA, pnpm monorepo)

**Performance Goals**: Dashboard fully rendered in < 2 seconds on local network

**Constraints**: Single user, single currency (EUR), local-only, no authentication

**Scale/Scope**: Single user, ~100 contracts maximum

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Test-First | ✅ PASS | Vitest tests for service and route written before implementation; Playwright e2e tests written before frontend components; tasks.md enforces this order |
| II. Type Safety | ✅ PASS | TypeScript strict mode on all packages; Zod schemas in packages/shared; no type duplication between backend and frontend; no `any` permitted |
| III. Simplicity (YAGNI) | ✅ PASS | SQLite (no server); single aggregated endpoint; no auth/multi-tenancy; read-only dashboard; no custom categories |

No violations — Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-welcome-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── dashboard.md     # GET /api/dashboard contract
└── tasks.md             # Phase 2 output (not yet created)
```

### Source Code (repository root)

```text
packages/
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   └── contract.ts        # Category, ContractStatus, Contract types
│   │   └── schemas/
│   │       └── dashboard.ts       # Zod schemas: DashboardResponse, CategorySummary, UpcomingRenewal
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql         # SQLite CREATE TABLE statement
│   │   │   └── client.ts          # better-sqlite3 connection + typed query helpers
│   │   ├── services/
│   │   │   └── dashboard.ts       # Aggregation logic (spending total, by-category, renewals)
│   │   └── routes/
│   │       └── dashboard.ts       # GET /api/dashboard route handler
│   ├── tests/
│   │   ├── unit/
│   │   │   └── dashboard.service.test.ts
│   │   └── integration/
│   │       └── dashboard.route.test.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SpendingOverview.tsx
    │   │   ├── CategoryBreakdown.tsx
    │   │   └── UpcomingRenewals.tsx
    │   ├── pages/
    │   │   └── Dashboard.tsx      # Composes the three panels; default route "/"
    │   └── services/
    │       └── api.ts             # useDashboard() TanStack Query hook
    ├── tests/
    │   ├── unit/
    │   │   ├── SpendingOverview.test.tsx
    │   │   ├── CategoryBreakdown.test.tsx
    │   │   └── UpcomingRenewals.test.tsx
    │   └── e2e/
    │       └── dashboard.spec.ts  # Playwright end-to-end tests
    ├── package.json
    └── tsconfig.json

pnpm-workspace.yaml
package.json                       # Root package (scripts fan out to all packages)
```

**Structure Decision**: pnpm monorepo with `shared`, `backend`, and `frontend` packages.
The `shared` package is the single source of truth for types and Zod schemas, satisfying
Constitution Principle II. Each package has its own `tsconfig.json` with `strict: true`.
