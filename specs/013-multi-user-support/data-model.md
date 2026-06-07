# Phase 1 Data Model: Multi-User Support

Two new tables and one column addition to the existing schema (`packages/backend/src/db/schema.sql`),
following the same style (uppercase `CHECK` enums, `TEXT` UUIDs, ISO-8601 `TEXT` timestamps) as
the existing `contracts` table.

## `users`

Represents one family member account (maps to spec entity **User Account**).

| Column            | Type    | Constraints                                                  | Notes |
|-------------------|---------|--------------------------------------------------------------|-------|
| `id`              | TEXT    | PRIMARY KEY                                                  | UUID, generated like `contracts.id` |
| `email`           | TEXT    | NOT NULL, UNIQUE, `CHECK(length(email) <= 320)`              | Sign-in identifier |
| `display_name`    | TEXT    | NOT NULL, `CHECK(length(display_name) <= 100)`               | Shown in the UI header |
| `password_hash`   | TEXT    | NOT NULL                                                     | `scrypt` derived key, hex/base64 |
| `password_salt`   | TEXT    | NOT NULL                                                     | Random per-user salt, hex/base64 |
| `role`            | TEXT    | NOT NULL DEFAULT `'MEMBER'`, `CHECK(role IN ('ADMIN','MEMBER'))` | FR-008 |
| `status`          | TEXT    | NOT NULL DEFAULT `'ACTIVE'`, `CHECK(status IN ('ACTIVE','ARCHIVED'))` | FR-012 |
| `archived_at`     | TEXT    | NULLABLE                                                     | Set when archived; drives the 30-day purge sweep |
| `failed_attempts` | INTEGER | NOT NULL DEFAULT 0                                           | Reset to 0 on successful sign-in |
| `locked_until`    | TEXT    | NULLABLE                                                     | Sign-in refused while `now < locked_until` |
| `created_at`      | TEXT    | NOT NULL                                                     | ISO-8601, like `contracts.created_at` |
| `updated_at`      | TEXT    | NOT NULL                                                     | ISO-8601 |

**Validation rules** (enforced in `user.service.ts` + Zod schemas, mirroring `ContractSchema`):
- `email`: valid email format, case-insensitively unique.
- `display_name`: 1–100 characters.
- Password (pre-hash, at creation/change time): minimum length and basic strength requirements
  (exact policy documented alongside `ChangePasswordBodySchema`); never stored or logged in
  plaintext — only `password_hash`/`password_salt` persist.

**State transitions** (`status`):
```
ACTIVE  --[admin removes account]-->  ARCHIVED (archived_at = now, sessions deleted)
ARCHIVED --[admin reactivates within 30 days]--> ACTIVE (archived_at = NULL)
ARCHIVED --[> 30 days since archived_at, on startup sweep]--> permanently deleted (cascades to contracts/sessions)
```

**Invariant enforced in `user.service.ts`** (FR-010): an operation that would leave zero
`ACTIVE` rows with `role = 'ADMIN'` (archiving the last admin, or demoting the last admin to
`MEMBER`) is rejected before being applied.

## `sessions`

Represents one authenticated session (maps to spec entity **Session**).

| Column         | Type | Constraints                                              | Notes |
|----------------|------|----------------------------------------------------------|-------|
| `id`           | TEXT | PRIMARY KEY                                              | Random opaque token (≥256 bits), the cookie value |
| `user_id`      | TEXT | NOT NULL, `REFERENCES users(id) ON DELETE CASCADE`       | Owning account |
| `created_at`   | TEXT | NOT NULL                                                 | ISO-8601 |
| `last_seen_at` | TEXT | NOT NULL                                                 | Refreshed on each authenticated request; basis for inactivity expiry (FR-004) |
| `expires_at`   | TEXT | NOT NULL                                                 | Absolute cap, refreshed alongside `last_seen_at` up to a maximum lifetime |

**Validation / lifecycle rules**:
- A session is valid only while `now < expires_at` AND `now - last_seen_at < <inactivity timeout>`
  AND its `users` row has `status = 'ACTIVE'`. The auth hook deletes (and treats as
  unauthenticated) any session failing these checks — this is what makes FR-004 and FR-011
  ("immediately invalidate … when their account is removed") simple `DELETE`/lookup-miss
  operations rather than special cases.
- Sign-out (FR-003) deletes the row by `id`.
- `ON DELETE CASCADE` from `users` means archiving or deleting an account removes its sessions
  automatically — no separate cleanup step needed.

## `contracts` (extended)

One new column on the existing table (maps to spec entity **Contract**, "existing entity,
extended"):

| Column    | Type | Constraints                                              | Notes |
|-----------|------|----------------------------------------------------------|-------|
| `user_id` | TEXT | NOT NULL, `REFERENCES users(id) ON DELETE CASCADE`       | Owning account — the sole basis for every access-control check (FR-005/FR-006) |

**Migration note**: added via `ALTER TABLE contracts ADD COLUMN user_id TEXT REFERENCES users(id)`
in the existing `runMigrations` step-detection style, then backfilled to the bootstrap
administrator account's id for every pre-existing row (see `research.md` §5), then the `NOT NULL`
constraint is enforced going forward by application-level validation (SQLite's `ALTER TABLE`
cannot retroactively add a `NOT NULL` constraint to a populated column in one step — the existing
migration code already works around equivalent situations by rebuilding the table, e.g. the
`cancellation_period_unit` enum migration).

**No other changes to `contracts`**: per FR-014 (internal-only ownership, no UI attribution),
`user_id` is never serialized into `ContractSchema`/API responses — it is purely a server-side
filter key, kept out of `rowToContract` and the shared Zod contract schema entirely.

## Relationships

```
users (1) ──< (many) sessions        [ON DELETE CASCADE]
users (1) ──< (many) contracts       [ON DELETE CASCADE, via user_id]
```

No other entities or relationships are introduced. `Invitation` (mentioned in earlier drafts of
this spec) was split out into [014-email-invitations](../014-email-invitations/) and is
explicitly **not** part of this feature's data model — account creation here uses directly
admin-issued credentials (see spec Assumptions and FR-009).
