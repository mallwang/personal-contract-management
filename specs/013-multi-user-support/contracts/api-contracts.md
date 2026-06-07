# Phase 1 API Contracts: Multi-User Support

New and changed `/api/*` endpoints. Existing response shapes for `/api/contracts*` and
`/api/dashboard` (documented in earlier features) are unchanged in *content* — only their
*scope* changes (each now returns only the signed-in user's data). All endpoints below require
an authenticated session unless marked **Public**, enforced by the global `onRequest` auth hook
described in `plan.md` §2 / `research.md` §6.

Error responses follow the existing convention seen in `routes/contracts.ts`:
`{ statusCode, error, message }`.

## Authentication — `/api/auth/*`

### `POST /api/auth/sign-in` — **Public**

Request body (`SignInBodySchema`): `{ email: string, password: string }`

- `200`: sets an HTTP-only `Secure` session cookie; body `{ id, email, displayName, role }`
  (the same shape as `GET /api/auth/me`, never includes credentials or `user_id`-style internals)
- `400`: malformed body (missing/invalid email or password field)
- `401`: wrong email/password — generic "Invalid email or password" message (does not reveal
  which field was wrong, to avoid account enumeration)
- `423` (Locked): account temporarily locked after repeated failures (FR-014/16); message
  indicates roughly when to retry, without confirming whether the account exists

### `POST /api/auth/sign-out`

- `204`: deletes the current session row and clears the cookie (FR-003)

### `GET /api/auth/me`

- `200`: `{ id, email, displayName, role }` for the current session
- `401`: no valid session (this is the shape the frontend's `useAuth` polls to determine
  signed-in state — a `401` here means "show the sign-in page")

### `POST /api/auth/password`

Request body (`ChangePasswordBodySchema`): `{ currentPassword: string, newPassword: string }`

- `204`: password changed (re-hashed with a fresh salt); current session remains valid, all
  *other* sessions for this account are invalidated (standard "changing your password signs out
  your other devices" behavior)
- `400`: new password does not meet strength requirements
- `401`: `currentPassword` does not match

## Account management — `/api/users/*` (admin-only)

Every route in this group additionally requires `request.user.role === 'ADMIN'`; non-admins
receive `403 { error: 'Forbidden', message: 'Administrator access required' }`.

### `GET /api/users`

- `200`: `AccountListResponseSchema` — array of `{ id, email, displayName, role, status, createdAt }`
  for every account (active and archived), so the admin can see "every family member who
  currently has access" (US3 scenario 2) including pending-purge archived accounts

### `POST /api/users`

Request body (`CreateAccountBodySchema`): `{ email, displayName, role, initialPassword }`

- `201`: created account `{ id, email, displayName, role, status: 'ACTIVE', createdAt }`
- `400`: validation error (bad email, blank display name, weak initial password, invalid role)
- `409`: email already in use by an active or archived account

### `POST /api/users/:id/archive`

- `204`: sets `status = 'ARCHIVED'`, `archived_at = now`, deletes all of that user's `sessions`
  rows (FR-011/FR-012 — immediate sign-out + start of the 30-day retention window)
- `404`: no such account
- `409` (Conflict): would remove the last active administrator (FR-010); message explains why

### `POST /api/users/:id/reactivate`

- `204`: sets `status = 'ACTIVE'`, `archived_at = NULL` — restores sign-in access and the
  account's original contracts intact (FR-013, US3 scenario 4)
- `404`: no such account, or the account has already been permanently purged (past the 30-day
  window) — same `404` either way, since from the caller's perspective both mean "nothing here
  to reactivate"
- `409`: account is not currently archived (nothing to reactivate)

### `POST /api/users/:id/role`

Request body: `{ role: 'ADMIN' | 'MEMBER' }`

- `204`: role changed
- `409`: would demote the last remaining active administrator (FR-010)

## Existing endpoints — scope change only

`/api/contracts*` (`GET`/`POST`/`PUT`/`DELETE`) and `/api/dashboard` keep their existing request/
response shapes (`ContractSchema`, `DashboardResponseSchema`, etc. — unchanged, per FR-014's
"no ownership attribution in the UI/API responses"). The only change is that every query they
trigger is now implicitly filtered to `WHERE user_id = request.user.id`:

- `GET /api/contracts` returns only the signed-in user's contracts
- `POST /api/contracts` stamps the new row with `user_id = request.user.id`
- `GET/PUT/DELETE /api/contracts/:id` return `404 Not Found` (not `403`) for another user's
  contract id — this deliberately avoids confirming that a given id *exists but belongs to
  someone else*, which would itself leak information across accounts (directly serving
  FR-006/SC-004's "zero instances of one user's data appearing … under any circumstance")
- `GET /api/dashboard` aggregates only the signed-in user's contracts

## Unauthenticated access — global behavior

Any request to `/api/*` (other than `POST /api/auth/sign-in`) without a valid, non-expired,
non-archived session receives:

- `401 { statusCode: 401, error: 'Unauthorized', message: 'Authentication required' }`

satisfying FR-001/SC-003 ("100% of attempts to access contract pages or data while signed out
are redirected to sign-in" — the frontend's route guards turn this `401` into the redirect).
