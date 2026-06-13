# Feature Specification: Email-Based Account Invitations

**Feature Branch**: `014-email-invitations`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "For the authentication, I plan to connect some SMTP server and send emails to the users. One for the new account creation or invitation by the family administrator, with direct links to the application, using a verify email flow." (Split out from [013-multi-user-support](../013-multi-user-support/), which establishes accounts, roles, and per-user data isolation; this feature replaces that feature's simple administrator-issued-credentials onboarding with a self-service, email-based invitation flow. Renewal-notification emails — also mentioned by the user — are a distinct, unrelated capability and are explicitly out of scope here; see Assumptions.)

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Administrator invites a new family member by email (Priority: P1)

An administrator who wants to give a family member access enters that person's email address
into the application. The system sends an email containing a personal link; the administrator
does not need to invent, type, or hand over a password, write down a username, or take any step
outside the application itself.

**Why this priority**: This is the half of the flow the administrator directly experiences and
controls — without it, there is no self-service invitation to test or build on. It depends on
the account/role foundation already established by [013-multi-user-support](../013-multi-user-support/).

**Independent Test**: Can be fully tested by signing in as an administrator, entering a test
email address into the invite form, and confirming an email arrives at that address containing a
usable link — without needing the recipient side of the flow to be exercised yet.

**Acceptance Scenarios**:

1. **Given** an administrator is signed in, **When** they enter a family member's email address
   and send an invitation, **Then** an email is sent to that address containing a personal link
   to set up an account.
2. **Given** an administrator views the accounts/invitations area, **When** an invitation is
   still awaiting acceptance, **Then** they can see that it is pending (and when it was sent).
3. **Given** an administrator enters an email address that already has an active or archived
   account, **When** they try to send an invitation to it, **Then** the system tells them so
   instead of creating a confusing duplicate.
4. **Given** an invitation is pending, **When** the administrator decides not to proceed (e.g.,
   it was sent to the wrong address), **Then** they can cancel it before it is accepted.
5. **Given** an invitation was sent some time ago and never accepted, **When** the administrator
   wants to try again, **Then** they can send a fresh invitation to the same address.

---

### User Story 2 - Invited family member sets up their own account (Priority: P1)

A family member who received an invitation email opens the link, proves they control that email
address simply by having received and clicked it, chooses their own password, and is immediately
able to sign in — without ever being told a password by anyone else.

**Why this priority**: This is the other half of the same flow and the actual point of the
feature — the invitee's experience of going from "received an email" to "have a working account
with a password only they know." Without it, sending invitations would lead nowhere. It is
equally foundational as Story 1; both are needed for a usable end-to-end flow, and are listed
separately only because each can be independently exercised and verified.

**Independent Test**: Can be fully tested by using a previously-issued (or freshly seeded)
invitation link, completing the verify-and-set-password steps, and then signing in with the
chosen password — without needing to also exercise the administrator's sending flow in the same
test run.

**Acceptance Scenarios**:

1. **Given** a family member receives an invitation email, **When** they open the link inside
   it, **Then** they land on a page that confirms which email address the invitation was for and
   lets them choose a password.
2. **Given** an invitee is on that page, **When** they choose and confirm a password meeting the
   application's password requirements, **Then** their account becomes active and they are
   signed in (or can immediately sign in).
3. **Given** an invitation link has already been used to complete setup, **When** anyone opens
   that same link again, **Then** they see a clear message that it has already been used, with
   no account created or changed as a result.
4. **Given** an invitation link is older than its validity window, **When** someone opens it,
   **Then** they see a clear message that it has expired and that they should ask the
   administrator for a new invitation.

---

### Edge Cases

- What happens if the invitation email cannot be delivered (e.g., mistyped address, the
  recipient's mail provider rejects it, the application's outbound email service is down)? The
  administrator MUST be able to see that the invitation is still pending and resend or cancel it
  — no one should be silently stuck waiting on an email that will never arrive, and the
  administrator MUST get some indication that something may be wrong.
- What happens if someone forwards or otherwise shares an invitation link with somebody else
  before using it? Whoever completes the verification step first claims the account; the system
  MUST treat the link as single-use so the invitation cannot be completed twice.
- What happens if an administrator sends a second invitation to an address that already has one
  pending? The system MUST avoid leaving multiple simultaneously-valid links for the same
  address — sending a fresh invitation MUST invalidate any earlier pending one for that address.
- What happens if the chosen password does not meet the application's requirements? The invitee
  MUST see a clear, specific explanation of what is required and be able to correct it without
  losing or invalidating their invitation link.
- What happens if the application's outbound email capability is unavailable or misconfigured at
  the time an administrator tries to send an invitation? The system MUST clearly report the
  failure to the administrator at the time of sending, rather than silently accepting a request
  it cannot fulfill.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let an administrator send an invitation by entering a single email
  address, entirely through the application's own interface.
- **FR-002**: When an invitation is sent, the system MUST deliver an email to that address
  containing a unique, personal link that leads back into the application.
- **FR-003**: The system MUST treat opening and completing an invitation link as proof that the
  recipient controls that email address — no separate, additional email-confirmation step is
  required beyond successfully using the link.
- **FR-004**: The system MUST let the invitee choose their own password as part of completing
  the invitation, and MUST never generate, transmit, or display a password on the invitee's
  behalf — the administrator never learns or sets the invitee's password.
- **FR-005**: The system MUST activate the resulting account only once the invitee has completed
  the link-based setup; no usable account may exist from an invitation that has not been
  completed.
- **FR-006**: Each invitation link MUST be single-use and time-limited: the system MUST reject
  attempts to reuse a completed link or open one past its validity window, in both cases showing
  a clear, specific explanation (already used vs. expired) rather than a generic error.
- **FR-007**: Sending a new invitation to an email address that already has a pending invitation
  MUST invalidate the previous one, so at most one valid link exists per address at a time.
- **FR-008**: The system MUST prevent an administrator from creating a new invitation for an
  email address that already corresponds to an active or archived account, and MUST inform the
  administrator why.
- **FR-009**: The system MUST let an administrator see, for each pending invitation, that it is
  pending and roughly when it was sent, and MUST let them cancel a pending invitation or send a
  replacement at will.
- **FR-010**: The system MUST clearly report to the administrator, at the moment of sending,
  when an invitation cannot be created or its email cannot be dispatched — rather than silently
  accepting a request that will not result in a delivered invitation.
- **FR-011**: The system MUST apply the same password-protection standards to invitee-chosen
  passwords (e.g., salted hashing, minimum strength requirements) as apply to any other account
  credential in the application.

### Key Entities

- **Invitation**: Represents an administrator's pending offer of access to a specific email
  address. Holds the target email address, a unique single-use link/token, an expiry time, and a
  status (pending, accepted, expired, cancelled, superseded). On successful completion it
  results in a new, active User Account (as defined by [013-multi-user-support](../013-multi-user-support/));
  otherwise it lapses, is superseded by a newer invitation to the same address, or is cancelled —
  in all of those cases producing no account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can send an invitation using only an email address, in well under
  a minute, without needing to invent or communicate any credentials themselves.
- **SC-002**: An invited family member can go from opening the invitation email to actively
  signed in to the application in under 5 minutes, with no help from the administrator beyond
  having sent the invitation.
- **SC-003**: 100% of invitation links that are expired, already used, cancelled, or superseded
  are rejected with a clear, specific explanation and never result in an account being created or
  changed — verified by deliberately attempting each of those situations.
- **SC-004**: 100% of attempts to invite an email address that already has an account are caught
  before any email is sent, with the administrator clearly informed why.
- **SC-005**: When the application cannot deliver an invitation (e.g., outbound email failure),
  100% of such attempts are reported to the administrator at the time they happen, with zero
  invitations left in a state that looks "sent" when it was not.

## Assumptions

- This feature depends on, and is meant to be implemented after,
  [013-multi-user-support](../013-multi-user-support/) — it replaces that feature's simpler
  "administrator issues initial credentials directly" onboarding approach (its FR-009 / User
  Story 3) with this self-service, link-based flow. All other aspects of 013 (authentication,
  per-user contract isolation, roles, account archival, etc.) remain unchanged and are assumed
  to already exist.
- The deployment provides the application with a working capability to send outbound email
  (e.g., via an SMTP server the administrator configures as part of operating the deployment,
  similar in spirit to the existing [012-docker-packaging](../012-docker-packaging/) setup
  steps). Configuring that capability is an infrastructure/deployment concern outside this
  feature's scope, but the feature depends on it being available and must behave clearly (per
  the Edge Cases and FR-010) when it is not.
- Invitation links remain valid for a limited, defined window (e.g., on the order of a few days)
  — long enough for a family member to notice and act on the email without rushing, short enough
  that a stale, unused link is not a long-lived loose end.
- Invitations are sent one address at a time by the administrator; bulk/batch invitation of many
  people at once is not required for a small household and is out of scope.
- An invitee is assumed to access their invitation email and click its link from the same device
  or browser context they intend to use the application from going forward; no special
  cross-device handoff is required.
- Sending other kinds of email — for example, notifying users about upcoming contract renewals —
  is a distinct capability that would apply equally to a single-user setup, is unrelated to
  account invitations, and is therefore explicitly out of scope here; it may reuse the same
  outbound-email capability this feature establishes, but would warrant its own specification
  (covering timing, frequency, opt-out, etc.).
