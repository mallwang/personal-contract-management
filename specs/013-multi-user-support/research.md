# Phase 0 Research: Multi-User Support

All items below were resolved during planning (no `NEEDS CLARIFICATION` markers remain in the
Technical Context). Each entry records the decision, why it was made, and what else was weighed.

## 1. Session strategy: server-side sessions vs. stateless tokens (JWT)

**Decision**: Server-side sessions — a `sessions` table in the existing SQLite database, keyed
by a random opaque token delivered in an HTTP-only cookie via `@fastify/cookie`.

**Rationale**: FR-011 requires that removing a user's account *immediately* invalidates their
active session. Stateless JWTs cannot satisfy this without an additional server-side blocklist —
at which point you have reintroduced server-side state anyway, with more moving parts than just
storing the session directly. A `sessions` row also gives FR-004 (inactivity expiry) a trivial
implementation (`last_seen_at` vs. now) and FR-003 (sign-out) a one-row delete. Reusing the
existing SQLite database means no new infrastructure (no Redis, no separate session store).

**Alternatives considered**:
- *Stateless JWT in a cookie*: rejected — cannot be immediately revoked without a blocklist
  table, which is strictly more complex than a sessions table for the same outcome.
- *In-memory session store*: rejected — would not survive container restarts (the existing app
  already persists everything to a bind-mounted SQLite file per [012-docker-packaging](../012-docker-packaging/);
  losing all sessions on every restart would be a worse experience than the cost of one table).

## 2. Password hashing: built-in `crypto.scrypt` vs. `bcrypt`/`argon2`

**Decision**: Node's built-in `node:crypto` `scrypt` (via `scryptSync`/`scrypt`) with a random
per-user salt (`randomBytes`), compared with `timingSafeEqual`.

**Rationale**: `scrypt` is a memory-hard, industry-accepted password-hashing KDF available in
Node's standard library — satisfying FR-013/15 ("industry-standard practices … salted password
hashing") with **zero new dependencies**. The existing Docker build ([012-docker-packaging](../012-docker-packaging/))
already pays the cost of compiling one native module (`better-sqlite3`); adding `bcrypt` or
`argon2` (both ship native bindings, or pure-JS variants that are markedly slower) would add
build complexity and a security-sensitive third-party dependency for a capability the runtime
already provides safely.

**Alternatives considered**:
- *`bcrypt`*: rejected — native bindings duplicate the build complexity `better-sqlite3` already
  introduces, for a well-understood algorithm Node already ships an equivalent of.
- *`argon2`*: rejected for the same reason; also the most complex to install reliably in Alpine
  containers (musl libc issues are a known source of friction).
- *`bcryptjs` (pure JS)*: rejected — meaningfully slower and offers no advantage over `scrypt`,
  which is already in the runtime.

## 3. Brute-force mitigation (FR-014/16): dependency vs. inline counters

**Decision**: Two columns on `users` — `failed_attempts` (integer) and `locked_until`
(nullable timestamp) — checked and updated inline in the sign-in handler. On reaching a small
threshold (e.g., 5 failures), `locked_until` is set to a short, exponentially-growing future
time; sign-in attempts against a locked account are refused with a clear "try again later"
message regardless of whether the password is correct.

**Rationale**: The spec's own Assumptions establish this is a small, fixed household (a handful
of accounts) — not a public service needing IP-based global rate limiting. Per-account counters
directly satisfy FR-014/16/SC-006 ("an attacker cannot feasibly guess a password through the
sign-in form alone") with two extra columns and a few lines of logic, matching Principle III
(YAGNI): no new dependency, no shared infrastructure, no global state to reason about.

**Alternatives considered**:
- *`@fastify/rate-limit`*: rejected — solves a more general (IP-based, route-wide) problem than
  this spec requires, and would need careful tuning to avoid locking out a whole household behind
  one shared home IP address (a real risk for a family deployment).
- *External services (fail2ban, etc.)*: rejected — infrastructure outside the application's own
  interface, contradicting the spec's "entirely through the application's own interface" framing
  for account-related behavior, and outside this feature's deployment-agnostic scope.

## 4. Account archival & retention sweep (FR-012/13): scheduler vs. startup check

**Decision**: A purge check runs once at server startup (alongside the existing
`runMigrations(db)` call in `client.ts`/`index.ts`), permanently deleting any `ARCHIVED` user
whose `archived_at` is more than 30 days in the past (cascading to their contracts via
`ON DELETE CASCADE`).

**Rationale**: This is a personal/family server that is rarely restarted but always running for
long stretches; a startup-time sweep is sufficient to keep storage bounded (the Edge Cases note
this requirement) without introducing a scheduler/cron dependency. It mirrors the existing
`db/reset.ts`/`db/seed.ts` script pattern already used for one-shot DB maintenance operations,
keeping the codebase's idioms consistent (Principle III).

**Alternatives considered**:
- *`node-cron`/`setInterval` background job*: rejected — adds a persistent timer and a
  dependency for a cleanup that tolerates being "a bit late" by design (the spec only requires
  *eventual* deletion past the retention window, not exact-to-the-minute deletion).
- *Lazy deletion on next admin view*: rejected — would leave archived data lingering indefinitely
  if no admin opens the accounts page, contradicting the "storage does not grow unbounded" edge
  case.

## 5. Bootstrapping the first administrator account & migrating existing data (FR-007)

**Decision**: Extend the existing migration path in `client.ts`: when the `users` table is
created for the first time on an existing database (i.e., `contracts` already has rows but no
`users` exist), the migration creates one bootstrap administrator account and backfills every
existing `contracts.user_id` to that account's id. On a brand-new database, the same bootstrap
account is created empty, ready for the operator to set its credentials on first sign-in.

**Rationale**: This follows the exact pattern already used for the `monthly_amount` →
`amount`/`billing_interval` and other historical migrations in `runMigrations` — detect the old
shape, transform in place, keep going. It guarantees SC-002 (100% of pre-existing data retained
and accessible) with no manual operator steps beyond the one-time credential setup the spec's
Assumptions already call for ("the administrator … is responsible for creating the very first
account during initial setup").

**Alternatives considered**:
- *Require the operator to run a separate manual migration script*: rejected — adds an
  operational step beyond what [012-docker-packaging](../012-docker-packaging/) already promises
  ("starts in under 60s", no manual DB surgery), and risks data loss if skipped or mis-run.
- *Make `contracts.user_id` nullable and treat `NULL` as "unowned/legacy"*: rejected — would
  leave a permanent special case in every query (`WHERE user_id = ? OR user_id IS NULL`),
  violating Principle III and creating exactly the kind of "everyone can see the legacy data"
  ambiguity FR-006 forbids.

## 6. Where the auth check lives: per-route vs. global hook

**Decision**: A single `fastify.addHook('onRequest', ...)` registered once in `buildServer`,
short-circuiting with `401` for any `/api/*` request (other than the sign-in endpoint) that does
not resolve to a valid session/user, and decorating `request.user` for everything downstream.

**Rationale**: Matches the existing pattern in `server.ts` (CORS, error handler, and `db`
decoration are all registered once, globally, in `buildServer`). A single hook is the simplest
way to guarantee FR-001 ("no contract data is reachable anonymously") holds for every current
and future route without remembering to add a guard to each one individually — eliminating an
entire class of "forgot to protect this new route" bugs.

**Alternatives considered**:
- *Per-route `preHandler` guards*: rejected — easy to forget on new routes, and redundant given
  that *every* `/api/*` route in this application requires authentication (there is no public
  API surface to carve out).
