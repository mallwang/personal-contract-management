# Phase 1 Data Model: Email-Based Account Invitations

One new table added to the existing schema (`packages/backend/src/db/schema.sql`), following the
same style (uppercase `CHECK` enums, `TEXT` UUIDs/tokens, ISO-8601 `TEXT` timestamps) as the
existing `users`/`sessions`/`contracts` tables introduced or extended by 013. No existing table
changes.

## `invitations`

Represents one administrator's pending offer of access to a specific email address (maps to spec
entity **Invitation**).

| Column         | Type | Constraints                                                          | Notes |
|----------------|------|----------------------------------------------------------------------|-------|
| `token`        | TEXT | PRIMARY KEY                                                          | Random opaque value, `randomBytes(32).toString('hex')` — same generation as `sessions.id` (research.md §3); doubles as the unguessable link component, e.g. `/invitations/<token>` |
| `email`        | TEXT | NOT NULL, `CHECK(length(email) <= 320)`                              | Target address; validated as an email by `SendInvitationBodySchema` before insertion |
| `invited_by`   | TEXT | NOT NULL, `REFERENCES users(id) ON DELETE CASCADE`                   | The administrator who sent it (for audit/"who invited whom"; not surfaced to the invitee) |
| `status`       | TEXT | NOT NULL DEFAULT `'PENDING'`, `CHECK(status IN ('PENDING','ACCEPTED','CANCELLED','SUPERSEDED'))` | Drives FR-006/FR-007 |
| `expires_at`   | TEXT | NOT NULL                                                             | ISO-8601; `created_at` + 7 days (research.md §3) |
| `created_at`   | TEXT | NOT NULL                                                             | ISO-8601, like `users.created_at` |
| `accepted_at`  | TEXT | NULLABLE                                                             | Set when status transitions to `ACCEPTED`; basis for the admin-visible "pending since" / history view |

**Indexes**: `CREATE INDEX idx_invitations_email ON invitations(email)` — supports the FR-007
"find any existing `PENDING` invitation for this email to supersede" lookup and the admin
list/filter view, mirroring how `users.email` is the natural lookup key for sign-in.

**Validation rules** (enforced in `invitation.service.ts` + Zod schemas, mirroring
`user.service.ts`/`AccountSchema`):
- `email`: valid email format (Zod `.email()`), checked against `users` (active *or* archived,
  via the new `user.service.findByEmail`) before an invitation may be created — FR-008.
- `token`: generated server-side only; never accepted as client input on creation, only echoed
  back in the link contained in the email.
- `expires_at`: always `created_at` + the fixed 7-day window (research.md §3); not
  administrator-configurable (keeps the feature's surface — and what there is to test — minimal,
  per Constitution Principle III).

**State transitions** (`status`):

```
                 ┌────────────────────────────────────────────┐
                 │                                            │
   (admin sends) │                                            ▼
        ────► PENDING ──[invitee completes setup]──────► ACCEPTED  (terminal; accepted_at = now)
                 │  │
                 │  └──[admin cancels]────────────────► CANCELLED  (terminal)
                 │
                 └──[admin sends a fresh invite to the same email]──► SUPERSEDED  (terminal)

   PENDING ──[now > expires_at, checked at accept-time]──► treated as expired
                                                           (status stays PENDING; rejection is
                                                            based on the expires_at comparison,
                                                            not a separate EXPIRED status — see
                                                            Notes below)
```

**Notes on the `status` enum and "expired"**:
- The spec's Key Entities section lists `expired` as one of an invitation's possible states, but
  expiry is a *computed* condition (`now > expires_at`), not an event the system needs to record
  — unlike cancellation, supersession, or acceptance, which are things someone or something
  *does*. Modeling it as a stored status would require a sweep to transition rows the instant
  they expire, purely so a column says what a comparison already tells you. The accept-time check
  (FR-006: "reject ... opening one past its validity window ... showing a clear, specific
  explanation") compares `now` to `expires_at` directly; the admin-facing list (FR-009: "see ...
  that it is pending and roughly when it was sent") can derive and display "expired" the same way
  for any `PENDING` row whose window has passed, without a stored value ever needing to be
  "wrong" between the moment it expires and the moment a sweep would have caught up. A startup
  sweep still permanently removes long-stale `PENDING`-but-expired (and terminal) rows for
  storage hygiene (mirroring 013's archived-account purge), but that is housekeeping, not a
  state the application logic branches on.
- `CANCELLED` and `SUPERSEDED` *are* stored explicitly because they are the direct, recordable
  result of an administrator action (FR-007/FR-009 "cancel ... or send a replacement at will")
  and the spec requires the admin to be able to see that history-ish distinction (an invitation
  that was deliberately withdrawn vs. one that was replaced by a newer attempt to the same
  address) — information a pure `now`-comparison could never reconstruct after the fact.

**Invariant enforced in `invitation.service.ts`** (FR-007): creating a new invitation for an
email address that already has a `PENDING` row first transitions that row to `SUPERSEDED` in the
same transaction — "at most one valid link exists per address at a time" is a property of the
write path, not something callers must remember to check.

## `users` (referenced, unchanged)

The successful acceptance path (`POST /api/invitations/:token/accept`) creates exactly one new
`users` row — using the existing `users` schema and `password.ts`/`hashPassword` utilities from
013 completely unchanged — with `status = 'ACTIVE'` directly (no intermediate "pending account"
state; per FR-005, "no usable account may exist from an invitation that has not been completed",
so the row simply doesn't exist until the moment it's already complete) and `role = 'MEMBER'`
(invitations are how an administrator brings in *family members*; promoting someone to `ADMIN`
remains a separate, explicit administrator action via 013's existing role-management endpoint —
keeping the invitation's blast radius minimal and auditable).

**New lookup added to `user.service.ts`**: `findByEmail(email, { includeArchived: true })` —
needed by FR-008's pre-flight check ("already corresponds to an active or archived account");
013 only ever needed to look users up by `id` (admin actions) or via the sign-in query (which
already filters to `status = 'ACTIVE'` and therefore can't answer "does *any* account, active or
archived, use this email").
