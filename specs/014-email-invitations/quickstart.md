# Quickstart Validation Guide: Email-Based Account Invitations

**Feature**: 014-email-invitations
**Date**: 2026-06-07
**Validates**: All user stories and success criteria from [spec.md](spec.md)

---

## Prerequisites

- Repository checked out on the `014-email-invitations` branch, with
  [013-multi-user-support](../013-multi-user-support/) implemented and merged (this feature
  builds directly on its accounts/roles/sessions), dependencies installed (`pnpm install`)
- Backend dev server running against a fresh or existing dev database (`pnpm dev`), signed in as
  an administrator (see 013's quickstart Setup for bootstrap-account creation)
- **Outbound email**: in development, set `SMTP_HOST=` (empty/unset) or point `SMTP_*` env vars
  at a local catch-all SMTP server (e.g., a throwaway Mailpit/MailHog container) so sent
  invitation emails can be inspected without reaching real inboxes — see `research.md` §5 for
  why tests themselves use an injected stub transport rather than a real server. Either way, the
  scenarios below extract the invitation `token` directly from the API response (`POST
  /api/invitations` returns it), so a working SMTP setup is **not** required to walk through
  every scenario end-to-end — only to see the actual email rendering.

---

## Scenario 1 — Administrator sends an invitation by email (User Story 1, P1)

Signed in as the administrator (cookie jar `jar-a.txt`, per 013's quickstart conventions):

```bash
curl -s -b jar-a.txt -X POST http://localhost:3000/api/invitations \
  -H 'Content-Type: application/json' \
  -d '{"email":"newmember@example.test"}'
```

**Expected**: `201` with a JSON body `{ token, email: "newmember@example.test", status:
"PENDING", createdAt, expiresAt }`. If a working SMTP/catch-all is configured, an email
addressed to `newmember@example.test` arrives containing a personal link
(`http://<app>/invitations/<token>`) and an indication of how long it remains valid.

```bash
curl -s -b jar-a.txt http://localhost:3000/api/invitations | grep -c '"email":"newmember@example.test"'
```

**Expected**: prints `1` — the administrator can see the invitation is pending and roughly when
it was sent (US1 scenario 2).

**Validates**: FR-001, FR-002, FR-009, US1 scenarios 1–2, SC-001.

---

## Scenario 2 — Duplicate-account and resend/cancel handling (User Story 1, P1)

Still as the administrator:

```bash
# Inviting an address that already has an account is rejected up front
curl -s -o /dev/null -w '%{http_code}\n' -b jar-a.txt -X POST http://localhost:3000/api/invitations \
  -H 'Content-Type: application/json' -d '{"email":"member@example.test"}'   # an existing account's email

# Resending supersedes the prior invitation and issues a fresh one
curl -s -b jar-a.txt -X POST http://localhost:3000/api/invitations/<token-from-scenario-1>/resend | grep -o '"status":"[A-Z]*"'

# The original token no longer works once superseded (see Scenario 4)
# Cancelling a still-pending invitation
curl -s -o /dev/null -w '%{http_code}\n' -b jar-a.txt -X DELETE http://localhost:3000/api/invitations/<some-other-token>
```

**Expected**: `409` for the duplicate-account attempt (with a message explaining why); the
resend response shows `"status":"PENDING"` for the *new* token while the old one becomes
`SUPERSEDED`; cancellation returns `204`.

**Validates**: FR-007, FR-008, FR-009, US1 scenarios 3–5, SC-004.

---

## Scenario 3 — Invitee completes setup and is signed in (User Story 2, P1)

Using the `token` returned by Scenario 1's `POST /api/invitations` (no session/cookie required —
this endpoint is public):

```bash
curl -s -i -X POST http://localhost:3000/api/invitations/<token>/accept \
  -H 'Content-Type: application/json' \
  -d '{"password":"a-strong-passphrase-1"}'
```

**Expected**: `200`, a `Set-Cookie` session cookie (the invitee is signed in immediately — no
separate sign-in step), and a body `{ id, email: "newmember@example.test", displayName, role:
"MEMBER" }`. A follow-up `GET /api/auth/me` with that cookie returns the same identity, and
`GET /api/contracts` returns an empty list (a brand-new private contract collection — proving
this is a real, independent account per 013's isolation guarantees).

```bash
# The administrator never learns or sets this password — confirm the new member can sign in
# fresh, independently, with only the password they themselves chose:
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/auth/sign-in \
  -H 'Content-Type: application/json' -d '{"email":"newmember@example.test","password":"a-strong-passphrase-1"}'
```

**Expected**: `200` — signing in with the self-chosen password succeeds on a fresh session.

**Validates**: FR-003, FR-004, FR-005, FR-011, US2 scenarios 1–2, SC-002.

---

## Scenario 4 — Already-used and expired links are rejected with specific messages (Edge Cases / FR-006)

```bash
# Re-using the now-accepted token from Scenario 3
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/invitations/<token-from-scenario-3>/accept \
  -H 'Content-Type: application/json' -d '{"password":"another-passphrase-2"}'

# A token that was superseded in Scenario 2
curl -s -X POST http://localhost:3000/api/invitations/<superseded-token>/accept \
  -H 'Content-Type: application/json' -d '{"password":"another-passphrase-2"}'

# A token whose validity window has passed (advance the clock in a test/dev DB, or use a
# pre-seeded expired invitation row — see the invitation.service unit tests for the pattern)
curl -s -X POST http://localhost:3000/api/invitations/<expired-token>/accept \
  -H 'Content-Type: application/json' -d '{"password":"another-passphrase-2"}'
```

**Expected**: All three return `410 Gone`, each with a message specific to its situation
("already used" / "no longer valid, ask the administrator for a new one" / "expired, ask the
administrator for a new one") — and in every case, `GET /api/users` (as admin) shows **no** new
account was created or changed as a result.

**Validates**: FR-006, US2 scenarios 3–4, SC-003.

---

## Scenario 5 — Outbound-email failure is reported immediately (Edge Cases / FR-010)

With `SMTP_HOST` deliberately misconfigured (e.g., pointing at an unreachable host) or unset:

```bash
curl -s -i -b jar-a.txt -X POST http://localhost:3000/api/invitations \
  -H 'Content-Type: application/json' -d '{"email":"another@example.test"}'
```

**Expected**: `502 Bad Gateway` with a clear message that the invitation could not be sent — and
a follow-up `GET /api/invitations` shows **no** lingering `PENDING` row for `another@example.test`
(the failed attempt is rolled back, not left looking "sent" when it wasn't).

**Validates**: FR-010, Edge Cases ("application's outbound email capability is unavailable"),
SC-005.

---

## Cleanup

```bash
pnpm --filter backend db:reset
```
