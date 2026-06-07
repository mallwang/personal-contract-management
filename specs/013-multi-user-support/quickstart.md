# Quickstart Validation Guide: Multi-User Support

**Feature**: 013-multi-user-support
**Date**: 2026-06-07
**Validates**: All user stories and success criteria from [spec.md](spec.md)

---

## Prerequisites

- Repository checked out on the `013-multi-user-support` branch, dependencies installed
  (`pnpm install`)
- Backend dev server running against a fresh or existing dev database (`pnpm dev`, per the
  existing project setup)
- Two test accounts available — see Setup below

---

## Setup — Bootstrap accounts

```bash
# Run migrations against a fresh dev DB (creates the bootstrap administrator account
# and, if upgrading an existing DB, assigns all pre-existing contracts to it)
pnpm --filter backend db:migrate

# Seed a second, non-admin account for cross-account isolation testing
pnpm --filter backend db:seed
```

**Expected**: Migration logs show the bootstrap administrator account id; the seed script
reports a second `MEMBER` account with known test credentials (e.g.
`member@example.test` / a printed temporary password).

---

## Scenario 1 — Sign-in is required to see anything (User Story 1, P1)

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/contracts
```

**Expected**: `401`. Opening `http://localhost:3000/` (or any deep link, e.g. `/contracts/new`)
in a browser without a session redirects to `/sign-in` rather than showing any contract data.

```bash
curl -s -i -X POST http://localhost:3000/api/auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"<bootstrap-admin-email>","password":"<bootstrap-admin-password>"}'
```

**Expected**: `200`, a `Set-Cookie` header with an HTTP-only session cookie, and a JSON body
`{ id, email, displayName, role: "ADMIN" }`. Re-running `GET /api/contracts` with that cookie
returns `200` and the migrated, pre-existing contract list.

**Validates**: FR-001, FR-002, US1 scenarios 1–5, SC-003.

---

## Scenario 2 — Each account sees only its own contracts (User Story 2, P2)

In two separate browser sessions (or `curl` sessions with separate cookie jars):

```bash
# Session A: sign in as the bootstrap administrator, create a contract
curl -s -c jar-a.txt -X POST http://localhost:3000/api/auth/sign-in -H 'Content-Type: application/json' \
  -d '{"email":"<admin-email>","password":"<admin-password>"}'
curl -s -b jar-a.txt -X POST http://localhost:3000/api/contracts -H 'Content-Type: application/json' \
  -d '{"name":"Admin-only gym membership","category":"SUBSCRIPTIONS","amount":29.99,"billingInterval":"MONTHLY"}'

# Session B: sign in as the seeded member account
curl -s -c jar-b.txt -X POST http://localhost:3000/api/auth/sign-in -H 'Content-Type: application/json' \
  -d '{"email":"member@example.test","password":"<member-password>"}'
curl -s -b jar-b.txt http://localhost:3000/api/contracts | grep -c "Admin-only gym membership"
```

**Expected**: The last command prints `0` — the member account's contract list, dashboard, and
exports never contain the administrator's "Admin-only gym membership" contract, and vice versa.
Repeat for dashboard (`GET /api/dashboard`) and export endpoints.

**Validates**: FR-005, FR-006, US2 scenarios 1–4, SC-002, SC-004.

---

## Scenario 3 — Administrator manages accounts (User Story 3, P3)

Signed in as the administrator (cookie jar `jar-a.txt`):

```bash
# Create a new account
curl -s -b jar-a.txt -X POST http://localhost:3000/api/users -H 'Content-Type: application/json' \
  -d '{"email":"newmember@example.test","displayName":"New Member","role":"MEMBER","initialPassword":"Temp-Pass-1234"}'

# List accounts — the new member should appear
curl -s -b jar-a.txt http://localhost:3000/api/users | grep -c "newmember@example.test"

# Archive (remove) it
curl -s -o /dev/null -w '%{http_code}\n' -b jar-a.txt -X POST \
  http://localhost:3000/api/users/<new-member-id>/archive

# The removed member can no longer sign in
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/auth/sign-in \
  -H 'Content-Type: application/json' -d '{"email":"newmember@example.test","password":"Temp-Pass-1234"}'

# Reactivate within the retention window
curl -s -o /dev/null -w '%{http_code}\n' -b jar-a.txt -X POST \
  http://localhost:3000/api/users/<new-member-id>/reactivate

# The member can sign in again with their original contracts intact
curl -s -X POST http://localhost:3000/api/auth/sign-in -H 'Content-Type: application/json' \
  -d '{"email":"newmember@example.test","password":"Temp-Pass-1234"}'
```

**Expected**: `201` then `200`/grep finds `1`/`204`/`401`(sign-in denied)/`204`/`200`(sign-in
succeeds again) in order. A non-admin account attempting any `/api/users/*` route receives `403`.

**Validates**: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, US3 scenarios 1–5, SC-005.

---

## Scenario 4 — Lockout after repeated failures (Edge case / FR-014/16)

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/auth/sign-in \
    -H 'Content-Type: application/json' -d '{"email":"member@example.test","password":"wrong-password"}'
done
```

**Expected**: The first several attempts return `401`; after the configured threshold, responses
switch to `423 Locked` — even if the *correct* password is then supplied — until the lockout
window elapses.

**Validates**: FR-014/16, SC-006.

---

## Scenario 5 — Pre-existing data survives the upgrade (FR-007/SC-002)

Run against a copy of a pre-013 database (one created and populated before this feature existed):

```bash
pnpm --filter backend db:migrate
```

**Expected**: Migration logs show the bootstrap administrator account being created and every
pre-existing contract row being assigned to it. Signing in as that bootstrap administrator shows
100% of the previously-existing contracts, with zero records lost; signing in as any other newly
created account shows none of them.

**Validates**: FR-007, US2 scenario 4, SC-002.

---

## Cleanup

```bash
pnpm --filter backend db:reset
```
