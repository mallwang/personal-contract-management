# Implementation Plan: Email-Based Account Invitations

**Branch**: `014-email-invitations` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/014-email-invitations/spec.md`

## Summary

Replace the admin-issued-credentials onboarding from [013-multi-user-support](../013-multi-user-support/)
(its FR-009 / User Story 3) with a self-service, email-based invitation flow. Concretely: add an
`invitations` table; add a `mailer` service that wraps `nodemailer` over operator-configured SMTP
(environment variables, mirroring the existing `DATABASE_PATH`/`PORT` convention); add admin-only
endpoints to send/list/cancel/resend invitations and a public, token-based endpoint for the
invitee to set their own password and activate their account; reuse the existing token-generation
(`randomBytes`, as already used for session ids) and password-hashing (`password.ts`)
infrastructure rather than building anything new for those concerns. On the frontend, extend
`AccountsAdmin.tsx` with an "invite by email" flow (replacing its "set an initial password"
form) and add a new public `AcceptInvitation.tsx` page (parallel to `SignIn.tsx`) for the
invitee's link-opening / password-setup experience.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 22 LTS (unchanged; matches [013-multi-user-support](../013-multi-user-support/plan.md))

**Primary Dependencies**: Fastify 5, `better-sqlite3` (existing — new `invitations` table),
`zod` (existing — new invitation schemas), `node:crypto` `randomBytes`/`scrypt` (existing —
reused as-is for invitation tokens and password hashing, see `password.ts`/`auth.service.ts`),
and **`nodemailer`** (NEW — pure-JS SMTP client with no native bindings; the de facto standard
for outbound email in Node, chosen over hand-rolling SMTP/MIME handling)

**Storage**: SQLite via `better-sqlite3` (existing). New `invitations` table: token (PK), target
`email`, `invited_by` (FK → `users`), `status` (`PENDING`/`ACCEPTED`/`CANCELLED`/`SUPERSEDED`),
`expires_at`, `created_at`, `accepted_at`. No changes to existing tables.

**Testing**: Vitest, following the existing `buildServer(createDb(':memory:'))` integration-test
pattern (`*.route.test.ts`) and `*.service.test.ts` unit-test pattern. `nodemailer` ships a
`jsonTransport` / a custom stub-transport object that satisfies its `Transporter` interface
without any network I/O — used to assert "an email was sent to X containing link Y" in tests the
same way the rest of the suite swaps real boundaries (DB, clock) for in-memory equivalents.
Playwright e2e extends the existing `packages/frontend/tests/e2e` suite.

**Target Platform**: Linux (Docker container behind the operator's HTTPS reverse proxy, per
[012-docker-packaging](../012-docker-packaging/))

**Project Type**: Web application monorepo — `packages/backend` (Fastify API), `packages/frontend`
(React/Vite SPA), `packages/shared` (Zod schemas/types). Unchanged from 013; no new packages.

**Performance Goals**: No new targets. Sending an invitation is a single indexed insert plus one
outbound SMTP call — inherently I/O-bound on the mail server, not a request-rate-sensitive path,
and bounded by "a handful of invitations at a time" per the spec's Assumptions.

**Constraints**: Requires the operator to configure outbound SMTP via environment variables
(extends the existing `docker-compose.yml` `environment:` block alongside `DATABASE_PATH`); the
system MUST clearly report failure at send time when that configuration is absent or the SMTP
server rejects the message (FR-010); invitation links MUST be single-use, time-limited, and
auto-superseding (FR-006/FR-007); no separate explicit email-verification step beyond using the
link (FR-003).

**Scale/Scope**: Same household scale as 013 (on the order of 2-6 accounts); at most a handful of
invitations outstanding at any time, sent one address at a time (per spec Assumptions — no bulk
invitations).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE) ✅

Failing integration/unit tests will be written before each corresponding implementation piece,
following the existing `buildServer(createDb(':memory:'))` route-test and `*.service.test.ts`
unit-test patterns established in 013:

- **Invitation routes** (`invitations.route.test.ts`): admin-only send/list/cancel/resend,
  non-admin forbidden, duplicate-account rejection (FR-008), resend-supersedes-prior (FR-007),
  send-failure reporting (FR-010); plus the public accept-invitation endpoint — success,
  already-used (FR-006), expired (FR-006), unknown-token cases.
- **Service unit tests**: invitation token generation/expiry/single-use/supersede logic
  (`invitation.service.test.ts`, mirroring `user.service.test.ts`'s archive/reactivate/retention
  patterns); mailer send/format/error-surfacing with an injected stub transport
  (`mailer.service.test.ts` — no real SMTP connection in tests, same "swap the boundary" approach
  as the rest of the suite).
- **One Playwright e2e** (`invitation-flow.spec.ts`, extending `multi-user-isolation.spec.ts`'s
  pattern): admin sends an invitation, the test captures the link from the stub mail transport,
  the invitee opens it, sets a password, and signs in — proving US1 + US2 end-to-end.

*Constitution compliant — tests precede implementation for every behavioral change.*

### Principle II — Type Safety (NON-NEGOTIABLE) ✅

- New Zod schemas in `@pcm/shared` (`schemas/invitation.ts`): `Invitation`,
  `SendInvitationBody`, `AcceptInvitationBody`, mirroring the existing `schemas/user.ts` pattern
  (snake_case DB rows ↔ camelCase API types via explicit mapping functions, as `rowToContract`/
  the existing user-row mapper already do).
- `nodemailer`'s own published TypeScript types cover the mailer boundary; `strict: true` and no
  `any` are retained throughout.

*Constitution compliant.*

### Principle III — Simplicity (YAGNI) ✅

- **No new auth mechanism**: invitation tokens reuse the exact `randomBytes(32).toString('hex')`
  pattern already used for session ids (`auth.service.ts`); password setting reuses
  `hashPassword`/`verifyPassword` from `password.ts` unchanged.
- **One new dependency** (`nodemailer`) is the minimum possible — there is currently *no*
  outbound-email capability anywhere in the codebase, and hand-rolling SMTP/MIME would be far
  more code and far less battle-tested than the standard library for this.
- **No template engine**: the feature sends exactly one kind of email (the invitation), so it is
  built as a plain template-literal string (subject + body) — pulling in Handlebars/MJML/etc.
  for a single fixed message would be premature abstraction.
- **No background job queue**: invitation emails are sent synchronously within the request
  handler. This directly satisfies the spec's "report failure to the administrator at the moment
  of sending" requirement (FR-010) — a queue would *hide* failures behind asynchronous retries,
  the opposite of what's specified, while adding infrastructure for a feature that sends at most
  a handful of emails total.
- **Existing direct-account-creation endpoint is retired from the admin UI**: per the spec's
  framing ("replaces that feature's simpler … onboarding approach"), `AccountsAdmin.tsx`'s
  "create with initial password" form is replaced by "send an invitation"; the underlying
  `POST /api/users` route and bootstrap-admin creation (still needed for the very first account,
  per 013) are unaffected. See `research.md` §1 for the full reasoning.

*No Complexity Tracking entries required — every addition is the minimal structure the spec's
requirements demand, reusing existing patterns rather than introducing new abstractions.*

## Project Structure

### Documentation (this feature)

```text
specs/014-email-invitations/
├── plan.md                          # This file
├── research.md                      # Phase 0 — onboarding-replacement, mailer, token, template decisions
├── data-model.md                    # Phase 1 — Invitation entity + state machine
├── quickstart.md                    # Phase 1 — validation guide
├── contracts/
│   └── api-contracts.md             # Phase 1 — new endpoint contracts
├── checklists/
│   └── requirements.md              # Spec quality checklist (already produced)
└── tasks.md                         # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code Changes

```text
# Shared schemas/types (new + extended)
packages/shared/src/schemas/invitation.ts      # NEW: Invitation, SendInvitationBody, AcceptInvitationBody
packages/shared/src/types/invitation.ts        # NEW: InvitationStatus enum
packages/shared/src/index.ts                   # MODIFIED: export new schemas/types

# Backend: data layer
packages/backend/src/db/schema.sql             # MODIFIED: add `invitations` table
packages/backend/src/db/client.ts              # MODIFIED: migration; expired/superseded sweep alongside existing archive-purge sweep

# Backend: services
packages/backend/src/services/mailer.service.ts      # NEW: SMTP transport from env config, send(invitation email)
packages/backend/src/services/invitation.service.ts  # NEW: create/list/cancel/resend/accept, token + expiry + supersede logic, last-admin-style guards reused from user.service patterns
packages/backend/src/services/user.service.ts        # MODIFIED: findByEmail (incl. archived) for FR-008 pre-flight check; activateFromInvitation
packages/backend/src/services/password.ts            # UNCHANGED — reused as-is (hashPassword/verifyPassword)

# Backend: routes & wiring
packages/backend/src/routes/invitations.ts     # NEW: admin-only POST/GET/DELETE /api/invitations[...], public POST /api/invitations/:token/accept
packages/backend/src/routes/users.ts           # MODIFIED: drop "create with initial password" from admin-facing flow (route itself may remain for bootstrap/tests)
packages/backend/src/server.ts                 # MODIFIED: register mailer plugin/decoration, add /api/invitations/:token/accept to the auth hook's public-route allowlist (alongside /api/auth/sign-in), invitation-sweep on startup
packages/backend/src/index.ts                  # MODIFIED: read SMTP_* env vars, construct mailer, pass to buildServer

# Frontend
packages/frontend/src/pages/AcceptInvitation.tsx      # NEW: public token-based "set your password" page
packages/frontend/src/pages/admin/AccountsAdmin.tsx   # MODIFIED: replace "create with password" form with "send invitation"; show pending invitations (status, sent-at, cancel/resend)
packages/frontend/src/hooks/useInvitations.ts         # NEW: send/list/cancel/resend mutations + queries
packages/frontend/src/services/invitations.ts         # NEW: fetch wrappers for /api/invitations/*
packages/frontend/src/main.tsx                         # MODIFIED: add public `/invitations/:token` route (outside RequireAuth)

# Tests
packages/backend/tests/integration/invitations.route.test.ts  # NEW
packages/backend/tests/unit/invitation.service.test.ts        # NEW
packages/backend/tests/unit/mailer.service.test.ts            # NEW
packages/backend/tests/unit/user.service.test.ts              # MODIFIED — add findByEmail/activateFromInvitation cases
packages/frontend/tests/e2e/invitation-flow.spec.ts           # NEW
```

**Structure Decision**: Web application layout (Option 2), unchanged from the existing monorepo
(`packages/backend`, `packages/frontend`, `packages/shared`). No new packages or services beyond
one library dependency (`nodemailer`) — invitations are implemented as an extension of the
existing accounts/auth layer (013) inside the same Fastify API, React SPA, and SQLite database.

## Implementation Approach

### 1. Data model: `invitations` table

One new table alongside `users`/`sessions`/`contracts` (see `data-model.md` for full DDL):
`token` (random opaque string, primary key — reusing the session-id generation pattern so it
doubles as the unguessable link component), `email`, `invited_by` (FK → `users.id`), `status`
(`PENDING`/`ACCEPTED`/`CANCELLED`/`SUPERSEDED`), `expires_at`, `created_at`, `accepted_at`.
Expired/superseded/cancelled rows are swept on startup alongside the existing archived-account
purge (FR-006/FR-007 housekeeping; mirrors 013's retention-sweep pattern in `client.ts`).

### 2. Mailer service (the one genuinely new capability)

`mailer.service.ts` wraps `nodemailer.createTransport(...)`, configured from `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` environment variables (same convention as
`DATABASE_PATH`/`PORT` in `index.ts` and `docker-compose.yml`). It exposes one method,
`sendInvitationEmail(to, link, expiresAt)`, built from a plain template-literal string (subject +
plain-text/HTML body containing the personal link and its expiry). If SMTP configuration is
missing or the send fails, it throws a typed error that the route handler turns into the
clear, immediate failure response required by FR-010 — nothing is queued or retried silently.

### 3. Invitation lifecycle

`invitation.service.ts` owns: generating a random single-use token (`randomBytes(32).toString('hex')`,
matching session-id entropy), setting `expires_at` to a fixed window (research.md §3), rejecting
sends to addresses with an existing active-or-archived account (FR-008, via a new
`user.service.findByEmail`), marking any prior `PENDING` invitation for the same email as
`SUPERSEDED` when a fresh one is sent (FR-007), and validating tokens at accept-time (rejecting
with a specific "already used" vs. "expired" message — FR-006).

### 4. Accept-invitation flow

A **public** route `POST /api/invitations/:token/accept` (added to the auth hook's allowlist next
to `/api/auth/sign-in`, per `research.md` §4) validates the token, hashes the chosen password
with the existing `password.ts` utilities, creates the `users` row with `status = 'ACTIVE'` in
one transaction, marks the invitation `ACCEPTED`, and signs the new user in immediately (creating
a session exactly as `auth.service.ts`'s sign-in does) — satisfying FR-004/FR-005 and US2's "is
immediately able to sign in".

### 5. Frontend integration

- `AccountsAdmin.tsx` gains an "invite by email" form (replacing "create with initial password")
  and a pending-invitations list (status, sent-at, cancel/resend actions per US1 scenarios 2-5),
  via new `useInvitations`/`services/invitations.ts` following the existing `useAuth`/`services/auth.ts`
  pattern.
- `AcceptInvitation.tsx` is a new **public** page at `/invitations/:token` (outside `RequireAuth`,
  parallel to `/sign-in`): shows the target email, a password-setup form, and the three terminal
  states from US2 scenarios 3-4 (already used / expired / success-and-signed-in).

## Complexity Tracking

*No entries — Constitution Check raised no unjustified violations. The single new dependency
(`nodemailer`) is the minimum required since no outbound-email capability exists anywhere in the
codebase today (see Technical Context and `research.md` §2).*
