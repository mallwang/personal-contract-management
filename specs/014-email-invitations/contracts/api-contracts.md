# Phase 1 API Contracts: Email-Based Account Invitations

New `/api/invitations/*` endpoints layered on top of 013's auth/account model. All routes
require an authenticated **administrator** session and follow the existing error-response
convention (`{ statusCode, error, message }`, see `routes/contracts.ts`/`routes/users.ts`)
**except** the single accept endpoint, which is explicitly **Public** (added to the auth hook's
allowlist alongside `POST /api/auth/sign-in`, per `research.md` §4 / `plan.md` §4).

Existing endpoints (`/api/auth/*`, `/api/users/*`, `/api/contracts*`, `/api/dashboard`) are
**unchanged** by this feature, with one exception noted at the bottom (the admin-facing
account-creation UI moves from `POST /api/users` to these new endpoints; the route itself stays).

## Sending and managing invitations — `/api/invitations/*` (admin-only)

Every route in this group additionally requires `request.user.role === 'ADMIN'`; non-admins
receive `403 { error: 'Forbidden', message: 'Administrator access required' }` — the exact
convention established by `/api/users/*` in 013.

### `POST /api/invitations`

Request body (`SendInvitationBodySchema`): `{ email: string }`

- `201`: invitation created and email dispatched; body
  `{ token, email, status: 'PENDING', createdAt, expiresAt }` — note the `token` is returned here
  so the admin UI *could* show/copy the link directly as a fallback (e.g., if the admin wants to
  hand it over some other way), though the primary path is "the invitee receives it by email"
- `400`: validation error (malformed email)
- `409` (Conflict): `email` already corresponds to an active or archived account (FR-008);
  message explains why, mirroring `POST /api/users`'s existing `409` for the same situation
- `502` (Bad Gateway): the invitation row was created, but the email could not be dispatched
  (SMTP misconfigured or the send failed) — the response makes this explicit and distinct from a
  generic `500`, satisfying FR-010 ("clearly report ... at the moment of sending"); the
  invitation is rolled back (not left in a half-sent limbo) so the admin can simply retry

### `GET /api/invitations`

- `200`: array of `{ token, email, status, createdAt, expiresAt, acceptedAt }` for every
  invitation that is currently meaningful to show — `PENDING` (including ones whose window has
  passed, displayed as "expired" per `data-model.md`'s computed-expiry note), `ACCEPTED`,
  `CANCELLED`, and `SUPERSEDED` rows not yet swept — so the admin can see "it is pending (and
  when it was sent)" (FR-009 / US1 scenario 2) as well as recent history

### `DELETE /api/invitations/:token`

- `204`: cancels a `PENDING` invitation — sets `status = 'CANCELLED'` (FR-009 / US1 scenario 4,
  "decided not to proceed")
- `404`: no such invitation
- `409` (Conflict): invitation is not currently `PENDING` (already accepted/cancelled/superseded
  — nothing to cancel); message explains its current status

### `POST /api/invitations/:token/resend`

- `201`: supersedes the existing invitation (`status = 'SUPERSEDED'`) and creates + sends a
  brand-new one to the same email in a single operation — the same "fresh invitation to the same
  address" path as `POST /api/invitations`, just pre-filled with the known address (FR-009 / US1
  scenario 5, "send a fresh invitation to the same address"); response shape identical to
  `POST /api/invitations`'s `201`
- `404`: no such invitation
- `502`: email dispatch failed (same semantics as `POST /api/invitations`'s `502`)

## Accepting an invitation — `POST /api/invitations/:token/accept` — **Public**

The one route in this feature reachable without an authenticated session — a person who has
*just* received an email cannot, by definition, already be signed in.

Request body (`AcceptInvitationBodySchema`): `{ password: string }`

- `200`: account created and activated (`status = 'ACTIVE'`, `role = 'MEMBER'`), invitation
  marked `ACCEPTED`, and a session is created and returned via the same `Set-Cookie` mechanism as
  `POST /api/auth/sign-in` — body `{ id, email, displayName, role }` (`displayName` defaults to
  the local part of the email address, e.g. `jane` from `jane@example.com`, since the spec's
  acceptance flow collects only a password, not a display name; the new member can change it
  later via 013's existing account-settings surface if one exists, or it remains a sensible
  default — this keeps US2's "choose a password and you're in" promise literal)
- `400`: chosen password does not meet the application's strength requirements (FR-006 edge
  case: "MUST see a clear, specific explanation ... without losing or invalidating their
  invitation link" — a `400` here does **not** consume the token; the invitee can simply retry)
- `404`: token does not correspond to any invitation — generic "this invitation link isn't valid"
  (does not distinguish "never existed" from other terminal states, to avoid telling a guesser
  anything useful about which tokens are "real but wrong")
- `410` (Gone): token corresponds to a real invitation that is `ACCEPTED` ("this link has already
  been used") or past its `expires_at` ("this link has expired, ask the administrator for a new
  one") — **distinct, specific messages** for each per FR-006's explicit "already used vs.
  expired" requirement; `CANCELLED`/`SUPERSEDED` invitations also resolve here with a neutral
  "this invitation is no longer valid, ask the administrator for a new one" (the invitee has no
  actionable distinction to make between "the admin cancelled it" and "the admin sent a newer
  one" — both mean "ask again")

## Existing endpoints — no change in shape, one change in role

`/api/auth/*`, `/api/contracts*`, `/api/dashboard`, and the existing `/api/users/*` routes
(`GET`, `POST`, `:id/archive`, `:id/reactivate`, `:id/role`) keep their exact request/response
shapes from 013 — **nothing about their contracts changes**.

The only behavioral shift is on the **frontend**: `AccountsAdmin.tsx` stops calling
`POST /api/users` (the "create with an initial password" form) as its primary onboarding action
and instead calls `POST /api/invitations` (per `plan.md` §1 / `research.md` §1). The
`POST /api/users` route itself remains exactly as 013 specified and implemented it — it continues
to exist for the bootstrap-admin path established by 013's migration, which has no inviter to act
through this new flow.
