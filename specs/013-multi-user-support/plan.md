# Implementation Plan: Multi-User Support

**Branch**: `013-multi-user-support` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-multi-user-support/spec.md`

## Summary

Turn the single-user application into a multi-user one where each family member signs in to
their own account and sees only their own private contracts. Concretely: add `users` and
`sessions` tables to the existing SQLite database; gate every `/api/*` route behind a
cookie-session auth check that resolves the current user; give the existing `contracts` table an
owning `user_id` column and scope every contract query by it; add admin-only account-management
endpoints/pages (create, list, archive, reactivate, remove); and add a sign-in page, auth
context, and route guards on the frontend. Existing pre-feature contract data is migrated to a
single bootstrap administrator account created on first run after the upgrade. Password hashing
uses Node's built-in `crypto.scrypt` and sessions are stored server-side in SQLite (rather than
stateless JWTs) specifically so that removing an account can immediately invalidate its sessions
(FR-011) — a hard requirement that stateless tokens cannot satisfy without an extra blocklist.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 22 LTS (matches the existing stack; see [012-docker-packaging](../012-docker-packaging/plan.md))

**Primary Dependencies**: Fastify 5, `@fastify/cookie` (new — minimal cookie parsing/signing), `better-sqlite3` 12 (existing, for the new `users`/`sessions` tables and the `contracts.user_id` column), `zod` (existing, for new auth/user schemas), Node's built-in `node:crypto` (`scrypt`, `randomUUID`, `timingSafeEqual`) for password hashing and token generation — deliberately **not** adding `bcrypt`/`argon2` (extra native bindings would complicate the existing Docker build for no real benefit at this scale)

**Storage**: SQLite via `better-sqlite3` (existing). New `users` table (credentials, role, status, archive metadata) and `sessions` table (server-side session records keyed by a random token, enabling immediate invalidation). `contracts` gains a `user_id TEXT NOT NULL REFERENCES users(id)` column, backfilled to a bootstrap admin account during migration.

**Testing**: Vitest (existing pattern: `buildServer(createDb(':memory:'))` integration tests per route file, `*.service.test.ts` unit tests); Playwright for one end-to-end multi-account isolation scenario (existing pattern under `packages/frontend/tests/e2e`)

**Target Platform**: Linux (Docker container behind the operator's HTTPS reverse proxy, per [012-docker-packaging](../012-docker-packaging/))

**Project Type**: Web application monorepo — `packages/backend` (Fastify API, extended with auth), `packages/frontend` (React/Vite SPA, extended with sign-in + account-management UI), `packages/shared` (extended with auth/user Zod schemas and types)

**Performance Goals**: No specific new targets; auth/session lookups are single indexed-PK SQLite reads and must not perceptibly slow down existing request latency (sub-millisecond overhead)

**Constraints**: No external identity provider or OAuth — self-contained credential storage appropriate for a small self-hosted household deployment; cookie-based sessions assume the HTTPS termination already established by [012-docker-packaging](../012-docker-packaging/) (cookies are marked `Secure`); a handful of fixed accounts, not a scalable multi-tenant system

**Scale/Scope**: Single household; on the order of 2–6 user accounts; no horizontal scaling or session-store clustering needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE) ✅

Failing integration/unit tests will be written before each corresponding implementation piece,
following the existing `buildServer(createDb(':memory:'))` route-test pattern and
`*.service.test.ts` unit-test pattern:

- **Auth routes** (`auth.route.test.ts`): sign-in success/failure, sign-out, session cookie
  issuance/expiry, lockout after repeated failures, redirect-to-sign-in for unauthenticated
  requests to any `/api/*` route.
- **User/account routes** (`users.route.test.ts`): admin-only create/list/archive/reactivate,
  non-admin forbidden, last-admin-cannot-be-removed guard, archived-account sign-in denial.
- **Contract isolation** (extends `contracts.route.test.ts`): user A's contracts are invisible
  to and unmodifiable by user B across list/get/create/update/delete/dashboard/export endpoints —
  this is the direct test of FR-005/FR-006/SC-004, the riskiest behavior in the feature.
- **Service unit tests**: password hashing/verification round-trip (`auth.service.test.ts`),
  session lifecycle and expiry (`session` helpers), lockout counters, archive/reactivate/
  retention-sweep logic (`user.service.test.ts`), and the `contracts.user_id` backfill migration
  (extends `migration.test.ts`).
- **One Playwright e2e** (`multi-user-isolation.spec.ts`): sign in as two seeded accounts in
  separate browser contexts and assert cross-account invisibility end-to-end through the UI.

*Constitution compliant — tests precede implementation for every behavioral change.*

### Principle II — Type Safety (NON-NEGOTIABLE) ✅

- New Zod schemas in `@pcm/shared` (`schemas/auth.ts`, `schemas/user.ts`) define `User`,
  `SignInBody`, `CreateAccountBody`, `ChangePasswordBody`, etc., mirroring the existing
  `schemas/contract.ts` pattern (snake_case DB rows ↔ camelCase API types via explicit mapping
  functions, as `rowToContract` already does).
- `FastifyRequest`/`FastifyInstance` are augmented via `declare module 'fastify'` (the same
  mechanism already used for `fastify.db`) to add a typed `request.user: AuthenticatedUser | null`.
- `strict: true` remains enabled; no `any`. Session tokens and password hashes are typed as
  branded `string` at the boundary and never logged.

*Constitution compliant.*

### Principle III — Simplicity (YAGNI) ✅

- **No new external services**: sessions and users live in the same SQLite database as
  everything else — no Redis, no separate auth provider, no ORM.
- **No new native dependencies**: password hashing uses `node:crypto`'s built-in `scrypt`
  (stdlib, already battle-tested, zero install footprint) instead of `bcrypt`/`argon2`.
- **Two flat roles** (`ADMIN` | `MEMBER`) as a single `role` column — no permissions framework,
  no per-resource ACL tables, matching the spec's explicit two-role assumption.
- **Lockout** is two columns on `users` (`failed_attempts`, `locked_until`) checked at sign-in —
  no separate rate-limiting middleware/dependency for what is, at most, a handful of accounts.
- **Archive/retention** reuses the existing migration-script pattern (`db/reset.ts` style) for a
  startup sweep rather than introducing a job queue or scheduler dependency.

*No Complexity Tracking entries required — every addition is the minimal structure the spec's
requirements demand, reusing existing patterns rather than introducing new abstractions.*

## Project Structure

### Documentation (this feature)

```text
specs/013-multi-user-support/
├── plan.md                          # This file
├── research.md                      # Phase 0 — session/hashing/lockout/archive decisions
├── data-model.md                    # Phase 1 — User, Session, Contract (extended) entities
├── quickstart.md                    # Phase 1 — validation guide
├── contracts/
│   └── api-contracts.md             # Phase 1 — new/changed endpoint contracts
├── checklists/
│   └── requirements.md              # Spec quality checklist (already produced)
└── tasks.md                         # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code Changes

```text
# Shared schemas/types (new + extended)
packages/shared/src/schemas/auth.ts            # NEW: SignInBody, SessionUser, ChangePasswordBody
packages/shared/src/schemas/user.ts            # NEW: User, CreateAccountBody, AccountListResponse
packages/shared/src/types/user.ts              # NEW: Role enum, AccountStatus enum
packages/shared/src/index.ts                   # MODIFIED: export new schemas/types

# Backend: data layer
packages/backend/src/db/schema.sql             # MODIFIED: add users, sessions tables; contracts.user_id
packages/backend/src/db/client.ts              # MODIFIED: migration — add user_id, backfill to bootstrap admin
packages/backend/src/db/seed.ts                # MODIFIED: seed a default admin account for dev/test

# Backend: services
packages/backend/src/services/auth.service.ts  # NEW: hash/verify password, session create/validate/destroy, lockout
packages/backend/src/services/user.service.ts  # NEW: account CRUD, archive/reactivate/purge, last-admin guard
packages/backend/src/services/contract.ts      # MODIFIED: every query scoped by ownerId (user_id)
packages/backend/src/services/dashboard.ts     # MODIFIED: scoped by ownerId

# Backend: routes & wiring
packages/backend/src/routes/auth.ts            # NEW: POST /api/auth/sign-in, /sign-out; GET /api/auth/me; POST /api/auth/password
packages/backend/src/routes/users.ts           # NEW: admin-only /api/users (list/create/archive/reactivate)
packages/backend/src/routes/contracts.ts       # MODIFIED: pass current user id into ContractService calls
packages/backend/src/routes/dashboard.ts       # MODIFIED: pass current user id into DashboardService calls
packages/backend/src/server.ts                 # MODIFIED: register cookie plugin, auth pre-handler (decorates request.user, 401s unauthenticated /api/* requests), session-retention sweep on startup

# Frontend
packages/frontend/src/pages/SignIn.tsx                # NEW: sign-in form
packages/frontend/src/pages/AccountSettings.tsx       # NEW: change-password form
packages/frontend/src/pages/admin/AccountsAdmin.tsx   # NEW: admin account list/create/archive/reactivate UI
packages/frontend/src/components/RequireAuth.tsx      # NEW: route guard — redirects to /sign-in if not authenticated
packages/frontend/src/components/RequireAdmin.tsx     # NEW: route guard — 403/redirect for non-admins
packages/frontend/src/hooks/useAuth.ts                # NEW: current-user query + sign-in/out mutations
packages/frontend/src/services/auth.ts                # NEW: fetch wrappers for /api/auth/*, /api/users/*
packages/frontend/src/main.tsx                        # MODIFIED: wrap app in auth provider/guards; add /sign-in, /account, /admin/accounts routes

# Tests
packages/backend/tests/integration/auth.route.test.ts        # NEW
packages/backend/tests/integration/users.route.test.ts       # NEW
packages/backend/tests/integration/contracts.route.test.ts   # MODIFIED — add cross-account isolation cases
packages/backend/tests/unit/auth.service.test.ts             # NEW
packages/backend/tests/unit/user.service.test.ts             # NEW
packages/backend/tests/unit/migration.test.ts                # MODIFIED — assert user_id backfill to bootstrap admin
packages/frontend/tests/e2e/multi-user-isolation.spec.ts     # NEW
```

**Structure Decision**: Web application layout (Option 2), unchanged from the existing monorepo
(`packages/backend`, `packages/frontend`, `packages/shared`). No new packages or services are
introduced — multi-user support is implemented as an auth layer and a data-scoping change inside
the existing Fastify API and React SPA, persisted in the existing SQLite database.

## Implementation Approach

### 1. Data model additions

Two new tables alongside the existing `contracts` table (see `data-model.md` for full DDL):

- **`users`**: `id`, `email`, `display_name`, `password_hash`, `password_salt`, `role`
  (`ADMIN`|`MEMBER`), `status` (`ACTIVE`|`ARCHIVED`), `archived_at`, `failed_attempts`,
  `locked_until`, `created_at`, `updated_at`.
- **`sessions`**: `id` (random token, primary key), `user_id` (FK), `created_at`,
  `last_seen_at`, `expires_at`. Server-side rows mean sign-out, expiry, and account-removal all
  reduce to a `DELETE`/lookup-miss — directly satisfying FR-003/FR-004/FR-011 without a token
  blocklist.
- **`contracts.user_id`**: new `NOT NULL` column with `FOREIGN KEY ... REFERENCES users(id)`,
  added via the existing `ALTER TABLE` migration pattern in `client.ts`. The migration creates
  (or reuses) one bootstrap admin account and backfills every pre-existing row's `user_id` to it
  — directly satisfying FR-007/SC-002.

### 2. Authentication & session handling

- `@fastify/cookie` issues an HTTP-only, `Secure`, `SameSite=Lax` session cookie carrying a
  random session token (via `randomUUID`/`randomBytes`, never the user id).
- A `fastify.addHook('onRequest', ...)` resolves the cookie → `sessions` row → `users` row,
  decorates `request.user`, and refreshes `last_seen_at`; requests to any `/api/*` route other
  than `/api/auth/sign-in` get a `401` if no valid, non-expired, non-archived user resolves —
  satisfying FR-001/FR-003/FR-004/SC-003.
- Passwords are hashed with `crypto.scrypt` plus a per-user random salt, compared with
  `crypto.timingSafeEqual` — satisfying FR-013(15 in spec numbering — protect stored credentials).
- Sign-in failures increment `failed_attempts`; on reaching a threshold, `locked_until` is set to
  an exponentially-growing future timestamp, and sign-in is refused (with a clear message) until
  it elapses — satisfying FR-014(16)/SC-006, without any new dependency.

### 3. Per-user contract isolation

`ContractService`/`DashboardService` constructors/methods take an `ownerId: string` and add
`WHERE user_id = ?` to every query (list, get, update, delete, dashboard aggregates, exports).
New contracts are created with `user_id = request.user.id`. Route handlers simply pass
`request.user.id` through — the auth hook guarantees it is always present and valid by the time
a route handler runs. This is the most safety-critical change (FR-005/FR-006/SC-004) and gets the
most thorough test coverage (cross-account isolation cases added to every existing contract/
dashboard route test, plus the dedicated Playwright e2e).

### 4. Roles & account lifecycle

- `role` is a flat enum column; an `onRequest`/`preHandler` guard on `/api/users/*` routes
  requires `request.user.role === 'ADMIN'`.
- Creating an account: admin supplies email + display name; the system generates an initial
  password (or the admin sets one) which is conveyed outside the app (per spec Assumptions —
  no email dependency in this feature).
- Removing an account sets `status = 'ARCHIVED'`, `archived_at = now`, and deletes its `sessions`
  rows (immediate invalidation, FR-011). A startup sweep (alongside the existing `runMigrations`
  call) permanently deletes archived accounts (and, via `ON DELETE CASCADE`, their contracts)
  once `archived_at` is more than 30 days in the past — satisfying FR-012/FR-013.
- A guard in `user.service.ts` refuses to archive or demote the last remaining `ACTIVE` `ADMIN`
  account — satisfying FR-010.

### 5. Frontend integration

- `useAuth()` wraps a `GET /api/auth/me` query (current user or `null`) and sign-in/sign-out
  mutations; `RequireAuth`/`RequireAdmin` wrap routes in `main.tsx`, redirecting to `/sign-in`
  (or showing a forbidden state) as appropriate.
- `SignIn.tsx` posts credentials to `/api/auth/sign-in`; `AccountSettings.tsx` posts to
  `/api/auth/password`; `AccountsAdmin.tsx` (admin-only route) lists/creates/archives/reactivates
  accounts via `/api/users/*`.
- All existing data-fetching hooks (`useDashboard`, contract queries) continue to call the same
  endpoints unchanged — isolation is enforced server-side and is transparent to the frontend.

## Complexity Tracking

*No entries — Constitution Check raised no unjustified violations (see Principle III above).*
