---

description: "Task list for implementing 014-email-invitations"
---

# Tasks: Email-Based Account Invitations

**Input**: Design documents from `/specs/014-email-invitations/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-contracts.md](contracts/api-contracts.md),
[quickstart.md](quickstart.md)

**Tests**: Included and REQUIRED — the project constitution's Principle I (Test-First,
NON-NEGOTIABLE) mandates failing tests before implementation code for every behavioral change;
this is also explicitly planned in `plan.md`'s Constitution Check.

**Organization**: Tasks are grouped by user story (both P1) to enable independent implementation
and testing of each story, per `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact and relative to the repository root

## Path Conventions

Web application monorepo (per `plan.md`'s Structure Decision): `packages/backend/src`,
`packages/backend/tests`, `packages/frontend/src`, `packages/frontend/tests`,
`packages/shared/src`.

---

## Phase 1: Setup

**Purpose**: Add the one new dependency this feature requires

- [X] T001 Add `nodemailer` and `@types/nodemailer` to `packages/backend/package.json`
      dependencies/devDependencies and run `pnpm install` (per `plan.md` Technical Context /
      `research.md` §2 — the only new dependency this feature introduces)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared data model and types both user stories build on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add the `invitations` table (`token`, `email`, `invited_by`, `status`,
      `expires_at`, `created_at`, `accepted_at`) and `idx_invitations_email` index to
      `packages/backend/src/db/schema.sql`, exactly per the DDL in `data-model.md` (uppercase
      `CHECK` enums, `TEXT` timestamps, `FOREIGN KEY ... REFERENCES users(id) ON DELETE CASCADE`
      — matching the existing `users`/`sessions` table style; no `ALTER TABLE` migration is
      needed since this is a brand-new table picked up by `runMigrations`'s `schema.sql` exec)
- [X] T003 [P] Add `InvitationStatus` enum to `packages/shared/src/types/invitation.ts` and
      `InvitationSchema`, `SendInvitationBodySchema`, `AcceptInvitationBodySchema` (with inferred
      `Invitation`/`SendInvitationBody`/`AcceptInvitationBody` types) to
      `packages/shared/src/schemas/invitation.ts`, mirroring the snake_case-row /
      camelCase-API-type pattern of `packages/shared/src/schemas/user.ts`; export both new
      modules from `packages/shared/src/index.ts`

**Checkpoint**: Foundation ready — both user stories can now be implemented (and tested)
independently.

---

## Phase 3: User Story 1 - Administrator invites a new family member by email (Priority: P1)

**Goal**: An administrator can send an invitation to an email address entirely through the app
(no invented passwords, no steps outside the app), see which invitations are pending and when
they were sent, and cancel or resend them — with clear, immediate errors for duplicate accounts
or undeliverable email.

**Independent Test**: Sign in as an administrator, enter a test email address into the invite
form, and confirm an email arrives at that address containing a usable link — without needing
the recipient side of the flow (User Story 2) to be exercised at all (per `spec.md`).

### Tests for User Story 1 ⚠️

> Write these tests FIRST; confirm they FAIL for the right reason before writing implementation
> code (Constitution Principle I).

- [X] T004 [P] [US1] Write failing unit tests for `sendInvitationEmail` — correct
      recipient/subject/link/expiry rendering, and a typed error thrown (not silently swallowed)
      when the injected stub transport reports a send failure — using an injected
      `nodemailer`-shaped stub transport (no real SMTP connection), in
      `packages/backend/tests/unit/mailer.service.test.ts`
- [X] T005 [P] [US1] Write failing unit tests for invitation creation/list/cancel/resend in
      `packages/backend/tests/unit/invitation.service.test.ts`: token generation/format/entropy,
      7-day `expires_at` computation, duplicate-account rejection (FR-008), "resend supersedes
      the prior pending invitation for the same email" (FR-007), cancel-only-when-pending,
      list-includes-status-and-sent-at
- [X] T006 [P] [US1] Write failing integration tests for the admin-only invitation routes
      (`POST/GET/DELETE /api/invitations`, `POST /api/invitations/:token/resend`) in
      `packages/backend/tests/integration/invitations.route.test.ts`, following the
      `buildServer(createDb(':memory:'))` pattern from `users.route.test.ts`: 201 on send with
      injected stub mailer, 409 on duplicate-account, 502 (and no lingering `PENDING` row) on
      mailer-failure, 403 for non-admin, 204/404/409 for cancel, 201/404/502 for resend
- [X] T007 [P] [US1] Write failing unit tests for `findByEmail(email, { includeArchived })` —
      returns active accounts, returns archived accounts when requested, returns nothing for
      unknown addresses — in `packages/backend/tests/unit/user.service.test.ts`

### Implementation for User Story 1

- [X] T008 [P] [US1] Implement `packages/backend/src/services/mailer.service.ts`: wraps
      `nodemailer.createTransport(...)` configured from `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
      `SMTP_PASSWORD`/`SMTP_FROM`, accepts an injectable transport (for tests), and exposes
      `sendInvitationEmail(to, link, expiresAt)` built from a plain template-literal
      subject/plain-text/HTML body containing the link and its expiry; throws a typed error on
      missing config or send failure (no silent queueing/retrying — FR-010) (makes T004 pass)
- [X] T009 [P] [US1] Add `findByEmail(email, options?: { includeArchived?: boolean })` to
      `packages/backend/src/services/user.service.ts`, querying by `email COLLATE NOCASE` and
      including `ARCHIVED` rows only when requested (makes T007 pass)
- [X] T010 [US1] Implement `packages/backend/src/services/invitation.service.ts`: `create(email,
      invitedBy)` (token via `randomBytes(32).toString('hex')` — same generation as
      `sessions.id`; `expires_at` = now + 7 days; pre-flight `findByEmail` check → reject with a
      duplicate-account error (FR-008); supersede any existing `PENDING` row for the same email
      in the same transaction (FR-007)), `list()`, `cancel(token)`, `resend(token)` (depends on:
      T002, T003, T005, T008, T009; makes T005 pass)
- [X] T011 [US1] Read `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` from
      `process.env` and construct the mailer in `packages/backend/src/index.ts` (same convention
      as the existing `DATABASE_PATH`/`PORT` reads); pass it into `buildServer` and decorate the
      Fastify instance with it in `packages/backend/src/server.ts` (depends on: T008)
- [X] T012 [US1] Implement admin-only routes in `packages/backend/src/routes/invitations.ts` —
      `POST /api/invitations` (201/400/409/502 per `contracts/api-contracts.md`),
      `GET /api/invitations` (200, array incl. status/createdAt/expiresAt),
      `DELETE /api/invitations/:token` (204/404/409),
      `POST /api/invitations/:token/resend` (201/404/502) — guarded by
      `request.user.role === 'ADMIN'` exactly like `routes/users.ts`; register the router in
      `server.ts` (depends on: T010, T011, T006; makes T006 pass)
- [X] T013 [P] [US1] Add `sendInvitation`, `listInvitations`, `cancelInvitation`,
      `resendInvitation` fetch wrappers (typed against the new shared schemas) in
      `packages/frontend/src/services/invitations.ts`, mirroring
      `packages/frontend/src/services/auth.ts`'s wrapper style
- [X] T014 [US1] Add `useInvitations` hook (list query + send/cancel/resend mutations with
      query-cache invalidation) in `packages/frontend/src/hooks/useInvitations.ts`, mirroring
      `packages/frontend/src/hooks/useAuth.ts` (depends on: T013)
- [X] T015 [US1] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, replace the
      "create account with an initial password" form with an "invite by email" form (single
      email field, clear duplicate/send-failure error display) and a pending-invitations list
      showing status, sent-at, and cancel/resend actions (US1 acceptance scenarios 2–5) (depends
      on: T014)

**Checkpoint**: User Story 1 is fully functional and independently testable — an administrator
can send, view, cancel, and resend invitations, with clear errors for every edge case in
`spec.md`'s Edge Cases for the sending side.

---

## Phase 4: User Story 2 - Invited family member sets up their own account (Priority: P1)

**Goal**: A person who received an invitation link can open it, see which email it's for, choose
their own password, and land signed in — with specific, friendly messages for already-used and
expired links, and without ever losing their place if their first password attempt is too weak.

**Independent Test**: Using a previously-issued (or freshly seeded — e.g., a row inserted
directly via the test DB helper, bypassing User Story 1's send path entirely) invitation token,
complete the verify-and-set-password steps and sign in with the chosen password — without needing
to also exercise the administrator's sending flow (per `spec.md`).

### Tests for User Story 2 ⚠️

> Write these tests FIRST; confirm they FAIL for the right reason before writing implementation
> code (Constitution Principle I).

- [X] T016 [P] [US2] Extend `packages/backend/tests/unit/invitation.service.test.ts` with failing
      tests for `accept(token, ...)`'s validation: unknown token, already-`ACCEPTED` token
      (distinct "already used" outcome), expired `PENDING` token (distinct "expired" outcome —
      compare `now` to `expires_at`, no stored `EXPIRED` status per `data-model.md`), and
      `CANCELLED`/`SUPERSEDED` tokens (neutral "no longer valid" outcome) — each must be
      distinguishable by the caller (FR-006)
- [X] T017 [P] [US2] Extend `packages/backend/tests/unit/user.service.test.ts` with failing tests
      for `activateFromInvitation(email, password)`: creates exactly one `users` row with
      `status = 'ACTIVE'`, `role = 'MEMBER'`, a `displayName` derived from the email's local part,
      and a hash/salt produced via the existing `password.ts` utilities (no plaintext password
      stored or logged)
- [X] T018 [P] [US2] Extend `packages/backend/tests/integration/invitations.route.test.ts` with
      failing tests for the public `POST /api/invitations/:token/accept` endpoint: 200 with
      `Set-Cookie` + identity body and **no session/cookie required to call it**, 400 for a
      too-weak password (token remains usable afterward — FR-006 edge case), 404 for an unknown
      token, and 410 with the three *distinct* messages (already used / expired / no longer
      valid) — and assert no `users` row is created or changed in any rejection case (SC-003)

### Implementation for User Story 2

- [X] T019 [US2] Add `accept(token, password)` to `invitation.service.ts`: looks up the token,
      classifies it (unknown / already-accepted / expired-by-`expires_at` / cancelled-or-superseded
      / valid-and-pending), and on success marks the row `ACCEPTED` with `accepted_at = now` in
      the same transaction that creates the account (depends on: T010, T016; makes the
      service-level part of T016 pass)
- [X] T020 [US2] Add `activateFromInvitation(email, password)` to `user.service.ts`: hashes the
      password via `hashPassword` from `password.ts` (unchanged, reused as-is), and inserts a
      `users` row with `status = 'ACTIVE'`, `role = 'MEMBER'` (depends on: T009, T017; makes T017
      pass)
- [X] T021 [US2] Add `/api/invitations/:token/accept` to the existing `onRequest` auth hook's
      public-route allowlist in `packages/backend/src/server.ts`, alongside
      `POST /api/auth/sign-in` (per `research.md` §4 — reusing the exemption mechanism 013
      already built and tested, not a new concept)
- [X] T022 [US2] Implement the public route `POST /api/invitations/:token/accept` in
      `packages/backend/src/routes/invitations.ts`: validates the body against
      `AcceptInvitationBodySchema` (400 on weak password without consuming the token), calls
      `invitation.service.accept` + `user.service.activateFromInvitation` in one transaction,
      creates a session exactly as `auth.service`'s sign-in does, sets the session cookie, and
      returns `{ id, email, displayName, role }` with the response codes from
      `contracts/api-contracts.md` (200/400/404/410) (depends on: T019, T020, T021, T018; makes
      T018 pass)
- [X] T023 [P] [US2] Add an `acceptInvitation(token, password)` fetch wrapper to
      `packages/frontend/src/services/invitations.ts`
- [X] T024 [US2] Implement the public `packages/frontend/src/pages/AcceptInvitation.tsx` page:
      reads `:token` from the route, shows the target email, a password-and-confirm form with
      strength feedback, and the three terminal states from US2 acceptance scenarios 3–4
      (already used / expired / success-and-signed-in) (depends on: T023)
- [X] T025 [US2] Add the public route `/invitations/:token` (outside `RequireAuth`, parallel to
      `/sign-in`) in `packages/frontend/src/main.tsx` (depends on: T024)

**Checkpoint**: User Story 2 is fully functional and independently testable — a freshly seeded
invitation can be completed end-to-end into a signed-in account, and every terminal-link state
shows its own clear message.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Ties the two stories together end-to-end and finishes operational concerns that
don't belong to either story alone

- [X] T026 [P] Write the Playwright e2e `packages/frontend/tests/e2e/invitation-flow.spec.ts`
      (extending the `multi-user-isolation.spec.ts` pattern from 013): admin sends an invitation,
      the test captures the link from the injected stub mail transport, the invitee opens it,
      sets a password, and signs in — proving US1 → US2 end-to-end (depends on: T015 and T024,
      i.e. both stories complete)
- [X] T027 [P] Document `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` in the
      `environment:` block of `docker-compose.yml` and the deployment docs established by
      [012-docker-packaging](../012-docker-packaging/), alongside the existing `DATABASE_PATH`
      entry
- [X] T028 [P] Add a startup sweep that permanently deletes long-stale terminal
      (`ACCEPTED`/`CANCELLED`/`SUPERSEDED`) and expired-`PENDING` invitation rows, called
      alongside the existing `purgeExpiredArchivedAccounts` in `packages/backend/src/index.ts`,
      implemented in `packages/backend/src/db/client.ts` (storage hygiene per `data-model.md`'s
      notes — mirrors 013's archived-account purge pattern; not required by any FR, purely
      housekeeping)
- [X] T029 Run every scenario in `quickstart.md` against a local dev build end-to-end (incl.
      Scenario 5's deliberately-misconfigured-SMTP case) and confirm each "Expected" outcome,
      as the final acceptance pass for the whole feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS both user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only — independently testable on its own
- **User Story 2 (Phase 4)**: Depends on Foundational only (its independent test seeds an
  invitation row directly, bypassing US1's send path) — independently testable on its own, and
  may proceed in parallel with US1 if staffed
- **Polish (Phase 5)**: T026 (e2e) needs both stories complete; T027/T028 are independent of both
  stories and can start as soon as Foundational is done; T029 needs everything complete

### Within Each User Story

- Tests written and failing before implementation (Constitution Principle I)
- Services before routes; routes before frontend wiring; frontend services/hooks before pages
- Story checkpoint reached only when its independent test (per `spec.md`) passes end-to-end

### Parallel Opportunities

- T002 and T003 (Foundational) — different files, no shared dependency
- T004, T005, T006, T007 (US1 tests) — four different test files
- T008 and T009 (US1 implementation) — different service files, neither depends on the other
- T013 (US1 frontend service wrapper) can start as soon as T003's shared schemas exist, in
  parallel with backend route work
- T016, T017, T018 (US2 tests) — three different test files (two of them extending US1's files,
  but additive, not conflicting)
- T023 (US2 frontend service wrapper) in parallel with backend service/route work
- T026, T027, T028 (Polish) — independent files and concerns

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (write-first, per Constitution Principle I):
Task: "Write failing unit tests for sendInvitationEmail in packages/backend/tests/unit/mailer.service.test.ts"
Task: "Write failing unit tests for invitation creation/list/cancel/resend in packages/backend/tests/unit/invitation.service.test.ts"
Task: "Write failing integration tests for admin invitation routes in packages/backend/tests/integration/invitations.route.test.ts"
Task: "Write failing unit tests for findByEmail in packages/backend/tests/unit/user.service.test.ts"

# Once their respective tests exist, launch the two independent service implementations together:
Task: "Implement mailer.service.ts in packages/backend/src/services/mailer.service.ts"
Task: "Add findByEmail to packages/backend/src/services/user.service.ts"
```

## Parallel Example: User Story 2

```bash
# Launch all US2 tests together:
Task: "Extend invitation.service.test.ts with accept/token-validation cases"
Task: "Extend user.service.test.ts with activateFromInvitation cases"
Task: "Extend invitations.route.test.ts with public accept-endpoint cases"
```

---

## Implementation Strategy

### MVP Scope: Both User Stories Together

Unlike features where US1 alone is a viable MVP, `spec.md` is explicit that these two stories
"are equally foundational ... both are needed for a usable end-to-end flow, and are listed
separately only because each can be independently exercised and verified." Sending an invitation
that nobody can complete (US1 without US2), or being able to complete a link that nothing can
ever produce (US2 without US1), delivers no real value on its own. **The MVP is US1 + US2
together** — though, as the Independent Test sections above show, each can be implemented and
verified in isolation first (US2 by seeding an invitation row directly), which is exactly what
makes the two-phase structure useful: build and prove each half, then connect them.

1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Complete Phase 3 (US1) and Phase 4 (US2) — in either order, or in parallel if staffed; each
   reaches its own checkpoint independently
3. Complete Phase 5 (Polish), starting with T026's end-to-end e2e — this is the first point at
   which the *complete* feature (not just each half) is provably working
4. **STOP and VALIDATE**: walk through every `quickstart.md` scenario (T029)
5. Deploy/demo

### Parallel Team Strategy

With two developers: one takes US1 (Phase 3) and the other US2 (Phase 4) immediately after
Foundational completes — they touch almost entirely disjoint files (`mailer.service.ts`/admin
routes/`AccountsAdmin.tsx` vs. the `accept` path/public route/`AcceptInvitation.tsx`), with the
only intersection being `invitation.service.ts` and `invitations.route.test.ts`/
`invitations.route.ts` (additive functions in the same files — coordinate via the task order
above, US1's `create`/`list`/`cancel`/`resend` first, US2's `accept` appended after). Both
converge for T026's e2e and T029's quickstart pass.

---

## Notes

- [P] tasks touch different files and have no incomplete-task dependencies between them
- [Story] labels (US1/US2) trace every phase-3/4 task back to `spec.md`'s prioritized stories
- Commit after each task or logical group, per the project's existing workflow
- Stop at either story's checkpoint to validate it independently before proceeding
- `invitation.service.ts` and `invitations.route.ts`/`invitations.route.test.ts` are each touched
  by both stories (additive functions/route handlers) — this is intentional (both stories
  describe one coherent lifecycle) and is sequenced, not parallelized, in the task list above
