# Phase 0 Research: Email-Based Account Invitations

All items below were resolved during planning (no `NEEDS CLARIFICATION` markers remain in the
Technical Context). Each entry records the decision, why it was made, and what else was weighed.

## 1. Does this feature retire 013's "admin issues credentials directly" flow?

**Decision**: Yes — in the admin-facing UI. `AccountsAdmin.tsx`'s "create account with an initial
password" form is replaced by "send an invitation". The underlying `POST /api/users` route and
the bootstrap-admin-creation path (013's migration, which provisions the very first account on
upgrade — there is no one to send *that* account an invitation) are left in place and untouched.

**Rationale**: The spec is explicit that 014 "replaces that feature's simple
administrator-issued-credentials onboarding ... (its FR-009 / User Story 3)" (spec Input line,
Assumptions). User Story 1's acceptance criteria ("the administrator does not need to invent,
type, or hand over a password ... or take any step outside the application itself") describes a
*replacement* experience, not an additional option — offering both would leave the
password-handling weakness (FR-004's entire reason for existing) available as a footgun, and
would double the onboarding surface to test and document for a feature whose whole point is to
remove a step. The bootstrap-admin path is unaffected because it solves a different problem
(creating the *first* account, when no administrator yet exists to send an invitation) that 013
already specified and implemented; 014's spec doesn't ask to change it.

**Alternatives considered**:
- *Keep both flows side-by-side*: rejected — directly contradicts the spec's "replaces" framing
  and FR-004 ("MUST never generate, transmit, or display a password on the invitee's behalf");
  keeping a parallel admin-sets-password path would mean that guarantee only sometimes holds.
- *Remove `POST /api/users` entirely*: rejected — it (or an equivalent) is still needed for the
  bootstrap-admin account created during the 013 migration, which has no inviter.

## 2. Outbound email: library choice

**Decision**: `nodemailer` — a pure-JavaScript SMTP client with no native bindings, configured
via operator-supplied environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASSWORD`, `SMTP_FROM`).

**Rationale**: The codebase currently has *zero* outbound-email capability (confirmed: no
`smtp`/`mail`/`nodemailer` in any `package.json` or source file), and the spec's Assumptions
explicitly defer SMTP *configuration* to the deployment/operator while requiring the *application*
to actually send mail. `nodemailer` is the de facto standard Node SMTP client — actively
maintained, fully typed, ships a built-in stub transport for tests (see §5) — and hand-rolling
SMTP/MIME/encoding would be substantially more code, harder to get right (especially
internationalized headers and attachments-free-but-HTML+text multipart bodies), and far less
battle-tested for a one-shot "send a single templated email" need. It has no native bindings, so
it doesn't add to the Docker build complexity the way `better-sqlite3` already does (per 013's
research §2 reasoning about avoiding *additional* native deps).

**Alternatives considered**:
- *Hand-rolled `net`/`tls` SMTP client*: rejected — reinvents a well-understood wheel (SMTP
  handshake, AUTH mechanisms, MIME encoding, line-ending quirks) for a security- and
  correctness-sensitive feature; far more code to write and to keep correct than one dependency.
- *Transactional-email-provider SDK (e.g., a hosted API service)*: rejected — would require the
  household to sign up for and pay for a third-party service, contradicting the
  self-hosted/personal-tool nature established by [012-docker-packaging](../012-docker-packaging/)
  and the spec's framing of SMTP as something "the administrator configures as part of operating
  the deployment" (their own server, their own choice of provider).

## 3. Invitation token: format, entropy, and expiry window

**Decision**: Reuse the exact session-id pattern from `auth.service.ts` —
`randomBytes(32).toString('hex')` — as both the invitation's primary key and the unguessable
component of its email link (`https://<app>/invitations/<token>`). Expiry window: **7 days**
from creation, stored as an ISO-8601 `expires_at` (same convention as `sessions.expires_at`).

**Rationale**: 256 bits of entropy from `node:crypto`'s CSPRNG is already proven sufficient for
session tokens (which guard the same kind of access this feature ultimately grants); reusing it
needs no new primitive, no new review of "is this random enough", and keeps the single-use,
unguessable-link requirement (FR-006) resting on infrastructure already trusted for an equally
sensitive purpose. Seven days mirrors the spec's own Assumption ("on the order of a few days —
long enough for a family member to notice and act on the email without rushing, short enough that
a stale, unused link is not a long-lived loose end") and matches the existing
`SESSION_INACTIVITY_TIMEOUT_MS` constant's order of magnitude (also 7 days), so the codebase
already has one mental model for "a week is this app's default validity window".

**Alternatives considered**:
- *Short numeric/alphanumeric codes (e.g., 6-digit)*: rejected — designed for
  human-typed-while-on-the-phone flows; this feature is a clicked link, where a long opaque token
  costs the user nothing and is far harder to guess or enumerate.
- *JWT-encoded invitation tokens*: rejected — would introduce a new dependency and a new
  "stateless vs. stored" inconsistency right next to a `sessions` table that already solved this
  exact problem (store the token, look it up, mutate its status); the spec's single-use/supersede
  requirements (FR-006/FR-007) need a mutable server-side record regardless, so a stateless token
  format buys nothing.
- *30-day expiry (matching `SESSION_MAX_LIFETIME_MS`)*: rejected as too long for an
  unauthenticated, emailed credential — the spec's edge cases emphasize that a forwarded/shared
  link is single-use but *valid until claimed*; a shorter window reduces the time such a link
  could be intercepted and used by someone other than the intended recipient.

## 4. Where the public accept-invitation endpoint sits relative to the auth hook

**Decision**: Add `POST /api/invitations/:token/accept` to the same `onRequest` allowlist that
already exempts `POST /api/auth/sign-in` from the global "401 if no valid session" check
described in 013's `plan.md` §2 / `research.md` §6 — rather than building a parallel
unauthenticated route-registration mechanism.

**Rationale**: 013 already had to solve "this one route must be reachable while signed out";
the allowlist on the existing `onRequest` hook is exactly that mechanism, already tested, and
adding one more path to it is the smallest possible change. No new concept for the codebase to
carry.

**Alternatives considered**:
- *A second Fastify instance/plugin scope without the auth hook*: rejected — pure YAGNI; the
  existing hook already supports exemptions and this is one more entry in a list that already
  has one.

## 5. Testing outbound email without a real SMTP server

**Decision**: Inject a `nodemailer.Transporter`-shaped stub (or use `nodemailer`'s built-in
`jsonTransport: true`, which serializes the would-be message to JSON instead of sending it) into
`mailer.service.ts` in tests, exactly as `buildServer(createDb(':memory:'))` swaps the real
SQLite file for an in-memory database.

**Rationale**: Matches the existing test philosophy in this codebase — replace the real external
boundary (DB file → `:memory:`, real clock → injected/controlled time in session-expiry tests)
with a fast, deterministic in-process equivalent, and assert against *what would have been sent*
(recipient, subject, link contents) rather than against a real mail server. This lets the
Playwright e2e (research item, §6 of 013's plan style) capture the generated link from the stub
transport and drive the rest of the flow through the real UI — proving US1 → US2 end-to-end
without any network dependency or flaky external service in CI.

**Alternatives considered**:
- *Run a real local SMTP server (e.g., a containerized MailHog/Mailpit) in CI*: rejected —
  adds infrastructure and flakiness for a need the in-process stub already satisfies; would be
  the first "extra service" this otherwise dependency-light test suite has ever needed.
- *Mock at the HTTP layer*: not applicable — SMTP is not HTTP; this would mean reimplementing
  protocol-level mocking that `nodemailer`'s own stub transports already provide for free.

## 6. Email content language

**Decision**: The invitation email is sent in a single, fixed language — the application's
default UI language (matching whatever `i18next`'s configured fallback language is on the
frontend, e.g. the language the household primarily uses).

**Rationale**: There is no per-user language preference anywhere in the data model (the `users`
table has no `locale`/`language` column — confirmed by inspection of `schema.sql`), and the
recipient of an invitation email is, by definition, not yet a user the system has ever
interacted with — there is no signal to localize *to* even if the capability existed. Building
a language-detection or preference mechanism for a single transactional email template would be
exactly the kind of speculative complexity Principle III rules out. If the household is
bilingual enough that this becomes a real friction point, it can be revisited as a tiny,
well-scoped follow-up once there's an actual signal (e.g., once invitees have accounts and
language preferences of their own).

**Alternatives considered**:
- *Detect language from the sending administrator's current UI language*: rejected — conflates
  the sender's preference with the recipient's, which may well differ (e.g., an
  English-speaking parent inviting a child who prefers the household's other language).
- *Send a bilingual email (both languages in one message)*: rejected — adds visual clutter and
  template complexity for a one-off message whose entire job is "click this link", which reads
  identically regardless of which language's instructions surround it; not worth doubling the
  template's size and translation-maintenance burden.
