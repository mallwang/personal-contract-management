# Research: Welcome Dashboard

**Feature**: 001-welcome-dashboard
**Date**: 2026-06-04

## Storage: SQLite via better-sqlite3

**Decision**: Use `better-sqlite3` for synchronous SQLite access directly (no ORM).

**Rationale**: Single-user personal app with no concurrency requirements. File-based storage
is portable and zero-infrastructure. The synchronous API fits Node.js's single-threaded model
without async overhead. Raw SQL is sufficient for the five or fewer queries this feature needs.

**Alternatives considered**:
- PostgreSQL: Rejected — requires a running server process; overkill for one user
- Prisma ORM: Rejected — heavy code-generation step, violates Simplicity principle
- Drizzle ORM: Rejected — type-safe but adds an abstraction layer not needed at this query volume
- JSON file storage: Rejected — no query capability; aggregations require full file loads

## Frontend State Management: TanStack Query (React Query v5)

**Decision**: TanStack Query v5 for all server-state fetching on the frontend.

**Rationale**: Dashboard is a pure read scenario. TanStack Query handles loading, error, and
success states with minimal boilerplate and provides automatic background refetch. No
client-side mutable state exists, so Zustand/Redux would be unnecessary complexity.

**Alternatives considered**:
- `useState` + `useEffect`: Rejected — manual fetch lifecycle adds boilerplate and is
  error-prone (race conditions, missing cleanup)
- SWR: Compatible; TanStack Query chosen for stronger TypeScript generics support
- Zustand: Rejected — suited to client state, not server-fetched data

## Validation / Type Sharing: Zod

**Decision**: Zod schemas defined in `packages/shared`, imported by both backend and frontend.

**Rationale**: Single source of truth satisfies Constitution Principle II (Type Safety: shared
types must not be duplicated). Zod integrates natively with Fastify via
`@fastify/type-provider-zod`, giving request/response validation at the route level for free.

**Alternatives considered**:
- TypeScript interfaces only: Rejected — no runtime validation; backend cannot enforce shapes
- io-ts: Rejected — verbose, steeper learning curve than Zod for equivalent type safety

## API Design: Single Aggregated Endpoint

**Decision**: One `GET /api/dashboard` endpoint returns all three panels in a single response.

**Rationale**: All three dashboard panels are always rendered together. Three separate requests
would add network round-trips with no benefit for this use-case. Aggregating ~100 contracts
server-side is negligible. Aligns with Simplicity principle.

**Alternatives considered**:
- Three separate endpoints: Rejected — no independent loading states justify the extra routes
- GraphQL: Rejected — significant setup cost for a single query; violates Simplicity principle

## Testing Strategy: Vitest + Playwright

**Decision**: Vitest for unit/integration tests (backend and frontend); Playwright for e2e.

**Rationale**: Vitest has first-class Vite integration (sub-100ms frontend test startup),
runs identically for Node.js backend code, and is the de-facto standard in the Vite ecosystem.
Playwright is the reliable, cross-browser e2e standard. Both integrate cleanly with pnpm
workspaces.

## Monorepo Layout: pnpm Workspaces

**Decision**: Three packages — `shared`, `backend`, `frontend` — under `packages/`.

**Rationale**: Shared types and Zod schemas must live in one place (Constitution Principle II).
pnpm workspaces provide symlink-based cross-package imports with no publishing step. Root-level
scripts (`pnpm test`, `pnpm dev`) fan out to all packages.
