# Feature Specification: Multi-User Support

**Feature Branch**: `013-multi-user-support`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Now as I have a ready application hosted via docker on my Diskstation and I can access it via a subdomain with https, I think about to extend the application to support multi-user, e.g. all the family members."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Family member signs in to a personal account (Priority: P1)

A family member opens the application at its public web address and signs in with their own
account credentials, landing on a dashboard that shows their own contracts. Previously the
application had no concept of separate users; now each person can identify themselves before
seeing or changing any data — their own, and only their own.

**Why this priority**: Authentication is the foundation of multi-user support — without it,
anyone who reaches the public subdomain could view or edit the family's financial/contract data.
This is also the minimum needed to make the app safe to expose on the internet at all.

**Independent Test**: Can be fully tested by creating two separate accounts, signing in as each
one in turn, and confirming each lands in the application under their own identity (e.g., their
name is shown in the header) without needing any other multi-user feature to exist.

**Acceptance Scenarios**:

1. **Given** the application is freshly deployed with no accounts yet, **When** the first
   administrator sets up their account, **Then** they can sign in and reach the dashboard.
2. **Given** a family member has a valid account, **When** they enter their correct credentials
   on the sign-in page, **Then** they are granted access to the application.
3. **Given** a family member enters incorrect credentials, **When** they submit the sign-in
   form, **Then** they see a clear error message and remain unauthenticated.
4. **Given** a signed-in user is inactive for an extended period, **When** their session expires,
   **Then** they are required to sign in again before continuing to use the application.
5. **Given** an unauthenticated visitor, **When** they try to open any page of the application,
   **Then** they are redirected to the sign-in page instead of seeing any contract data.

---

### User Story 2 - Each family member keeps their own private contracts (Priority: P2)

Once signed in, a family member sees and manages only their own contracts — additions, edits,
and deletions they make are visible solely to them. The shared application instance behaves like
separate personal filing cabinets that happen to live behind the same web address: one person's
gym membership or car insurance never appears in another person's list, dashboard, or exports.

**Why this priority**: Keeping financial/contractual data private by default is the safer,
more conservative choice for a household where members may have entirely separate financial
lives (e.g., a teenager's own subscriptions, one partner's personal commitments) — and it avoids
ever exposing one person's data to another by accident. It depends on User Story 1 (accounts
must exist before data can be scoped to an individual).

**Independent Test**: Can be fully tested by signing in as two different family members, creating
a contract as one of them, then signing in as the other and confirming that contract does not
appear anywhere — not in the list, dashboard summaries, or exports.

**Acceptance Scenarios**:

1. **Given** family member A creates a new contract, **When** family member B opens their
   contracts list, dashboard, or exports, **Then** B does not see the contract A created.
2. **Given** family member A edits or deletes one of their own contracts, **When** family member
   B views their own contracts, **Then** B's list and data are completely unaffected.
3. **Given** family member A is signed in, **When** they view dashboard summaries, totals, or
   renewal/expiry panels, **Then** every figure reflects only A's own contracts.
4. **Given** the existing single-user data created before this feature, **When** the application
   is upgraded to support multiple users, **Then** that existing data becomes the private
   contract list of one designated account (the initial administrator account) and is not
   visible to any other account (no data is lost, but it is not shared).

---

### User Story 3 - Administrator manages who has access to the household (Priority: P3)

A designated administrator (e.g., the person who set up the application) can add new family
members, remove people who should no longer have access (e.g., after a household change), and
see the current list of people with accounts — without needing to edit configuration files or
the database directly. (A more self-service, email-based invitation flow for onboarding is
planned as a follow-up enhancement; see Assumptions.)

**Why this priority**: Account lifecycle management is necessary for the feature to be usable
day-to-day (new family members joining, others leaving), but the application is still useful with
just Story 1 and 2 in place and a manually-provisioned set of accounts, so this can follow.

**Independent Test**: Can be fully tested by signing in as the administrator, creating a new
family member account through the application's interface, signing in as that new member, and
then having the administrator remove the account and confirming the removed member can no longer
sign in.

**Acceptance Scenarios**:

1. **Given** an administrator is signed in, **When** they create an account for a new family
   member, **Then** that person can subsequently sign in with the provided credentials (and can
   change their password afterward, per FR-018).
2. **Given** an administrator is signed in, **When** they view the list of accounts, **Then**
   they see every family member who currently has access.
3. **Given** an administrator removes a family member's account, **When** that person tries to
   sign in afterward, **Then** access is denied and their data is archived (not immediately
   deleted).
4. **Given** an administrator removed an account by mistake, **When** they reactivate it within
   the retention period, **Then** the person can sign in again and finds their original
   contracts intact.
5. **Given** a non-administrator family member, **When** they try to reach account-management
   features, **Then** they are not able to view or change other people's accounts.

---

### Edge Cases

- What happens when the very last administrator account would be removed or demoted, leaving
  nobody able to manage accounts? The system MUST prevent this so the household is never locked
  out of account management.
- How does the system handle a user trying to sign in to an account that has been removed while
  they had an active session? Their session MUST be invalidated and they MUST be required to
  sign in again (and denied, since the account no longer exists).
- What happens if two household members want to track the same real-world joint contract (e.g.,
  shared rent or a household internet plan)? Since contracts are private per account, each
  interested person must enter it independently in their own list — there is no built-in joint-
  ownership or sharing mechanism in this version (see Assumptions).
- What happens to the existing per-contract "anonymize" display setting (see
  [[feedback_anonymization_invariant]])? It continues to work exactly as before, but now purely
  within each user's own private view — there is no cross-user visibility to consider, since no
  one ever sees another person's contracts.
- What happens when someone repeatedly enters wrong credentials? The system MUST slow down or
  temporarily block further attempts to deter guessing, while still telling the legitimate user
  how to recover access.
- What happens to an archived (removed) account's data once its retention period elapses? The
  system MUST permanently delete it, so household storage does not grow unbounded with data for
  people who no longer use the application.
- What happens if an administrator removes an account and then wants to restore it before the
  retention period elapses (e.g., the removal was a mistake)? The system MUST allow an
  administrator to reactivate an archived account within the retention period, restoring the
  person's access to their original contracts.
- What happens if an administrator needs to help a family member with their contracts (e.g.,
  troubleshooting)? Administrators manage accounts only — they MUST NOT gain implicit access to
  other users' private contract data through their administrative role.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require every visitor to authenticate (sign in) before viewing or
  modifying any contract data; no contract data is reachable anonymously.
- **FR-002**: The system MUST support multiple distinct user accounts, each with its own
  credentials and identity (e.g., a display name).
- **FR-003**: The system MUST let a signed-in user end their session (sign out) on demand.
- **FR-004**: The system MUST automatically end inactive sessions after a reasonable period and
  require re-authentication.
- **FR-005**: The system MUST scope every contract to exactly one owning user account, and MUST
  ensure that a user can only view, create, edit, or delete contracts that they themselves own.
- **FR-006**: The system MUST ensure no user can view, edit, delete, export, or otherwise access
  another user's contracts under any circumstance — including via dashboards, summaries, search,
  exports/imports, or administrative functions. Account administration is strictly separate from
  contract data access.
- **FR-007**: The system MUST preserve all contract data that existed before this feature was
  introduced by assigning it to a single designated account (the initial administrator account
  created during the upgrade), so that data continues to exist as that account's private contract
  list with nothing lost or shared with other accounts.
- **FR-008**: The system MUST distinguish between at least two roles — an administrator role
  that can manage user accounts, and a standard member role that cannot — and MUST prevent
  standard members from accessing account-management capabilities. Holding the administrator
  role MUST NOT grant any additional access to other users' contract data.
- **FR-009**: The system MUST allow an administrator to create new accounts (issuing initial
  sign-in credentials directly to the new member outside the system, e.g., verbally or via an
  existing trusted channel), view the list of existing accounts, and remove (revoke access for)
  accounts — entirely through the application's own interface.
- **FR-010**: The system MUST prevent the removal or demotion of the last remaining administrator
  account, so the household always retains at least one person able to manage accounts.
- **FR-011**: The system MUST immediately invalidate a user's active session when their account
  is removed, so they lose access without needing to sign out themselves.
- **FR-012**: When an administrator removes a family member's account, the system MUST archive
  that account and its contracts rather than deleting them immediately — the data is retained in
  storage but becomes inaccessible to everyone (including administrators and other members) for
  a defined retention period, guarding against accidental removals while still ending the
  removed person's access immediately.
- **FR-013**: The system MUST allow an administrator to reactivate an archived account within its
  retention period, restoring that person's sign-in access and their original private contracts
  exactly as they were, and MUST permanently delete archived accounts and data once the retention
  period elapses.
- **FR-014**: The system MUST internally record which user account owns each contract (for
  access-control and data-integrity purposes), without displaying "created by" / "owned by"
  information in the user interface — since a user only ever sees their own contracts, such
  attribution would add no value and is unnecessary complexity.
- **FR-015**: The system MUST protect stored credentials using industry-standard practices (e.g.,
  salted password hashing) so that raw passwords are never stored or exposed.
- **FR-016**: The system MUST limit repeated failed sign-in attempts for an account (e.g.,
  temporary lockout or increasing delay) to deter credential-guessing attacks, given the
  application is now reachable from the public internet.
- **FR-017**: The system MUST continue to apply the existing anonymization behavior
  ([[feedback_anonymization_invariant]]) within each user's own private view exactly as it does
  today.
- **FR-018**: The system MUST let each signed-in user change their own password.

### Key Entities

- **User Account**: Represents one family member with access to the application. Holds an
  identity (display name, sign-in identifier such as a username or email), protected credentials,
  a role (administrator or standard member), and account status (active / removed). Owns a
  private collection of contracts that no other account can access.
- **Session**: Represents one period of authenticated access for a user on a device — created at
  sign-in, ended at sign-out, automatic expiry after inactivity, or administrator-driven removal
  of the underlying account.
- **Contract** *(existing entity, extended)*: A private contract record belonging to exactly one
  user account (its owner). Visible, editable, and deletable only by its owner — never by other
  household members, regardless of their role.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new family member can go from receiving their account credentials to actively
  viewing their own contracts in under 2 minutes.
- **SC-002**: 100% of contract data that existed prior to this feature remains accessible after
  the upgrade (as the designated account's private list), with zero records lost.
- **SC-003**: No contract data is viewable or editable by anyone who has not successfully signed
  in — verified by confirming that 100% of attempts to access contract pages or data while signed
  out are redirected to sign-in.
- **SC-004**: Zero instances of one user's contract data appearing anywhere in another user's
  views, dashboards, summaries, search results, or exports — verified by cross-account testing
  across every surface of the application.
- **SC-005**: An administrator can onboard a new family member or revoke a departed member's
  access in under 3 minutes using only the application's own interface, with no technical setup
  steps outside it.
- **SC-006**: Repeated incorrect sign-in attempts against a single account are slowed or blocked
  such that an attacker cannot feasibly guess a password through the sign-in form alone.

## Assumptions

- Archived (removed) accounts and their contracts are retained for 30 days before being
  permanently deleted, giving an administrator a reasonable window to reverse an accidental
  removal without keeping former members' personal data indefinitely.
- Contracts are strictly private to the account that owns them; this version includes no joint-
  ownership, sharing, or "view only" mechanism between household members. Anyone wanting a joint
  real-world contract (e.g., shared rent) reflected in their own list must enter it themselves —
  cross-account sharing is explicitly out of scope and may be considered as a future enhancement.
- The administrator who performs the Docker deployment is responsible for creating the very first
  account during initial setup; there is no public self-registration flow — new family members
  join only by being added by an existing administrator, since this remains a personal/family
  tool rather than a multi-tenant SaaS product.
- For this initial version, an administrator creates an account and conveys its initial sign-in
  credentials to the family member directly (e.g., verbally, via a message, or written down) —
  no automated email delivery is required to provision an account. **A self-service, email-based
  invitation flow (sending a verification link so invitees can set up their own account and
  password) is intentionally out of scope here and is planned as a separate, follow-up feature**
  that builds on top of the accounts and roles this feature establishes.
- Likewise, any other use of outbound email — such as notifying users about upcoming contract
  renewals — is unrelated to multi-user support (it would apply equally to a single-user setup)
  and is explicitly out of scope for this feature.
- Two roles are sufficient for a family context: administrator (manages accounts only — never
  other users' contract data) and standard member (manages their own contracts only). No finer-
  grained per-contract permissions are required for the initial version.
- The application is reachable over HTTPS on a subdomain as already set up by the user (per the
  existing [012-docker-packaging](../012-docker-packaging/) feature), so transport-level security
  is already in place; this feature focuses on application-level authentication and authorization.
- Password reset/recovery for forgotten credentials can be handled informally within the family
  (e.g., the administrator resets it for them) rather than requiring automated email-based
  password-reset flows, since this is a small, trusted household deployment.
- "Family members" are a small, fixed-size group (a handful of people), not a large or
  fluctuating user base — this informs that simple administrator-driven provisioning is
  sufficient and self-service registration is unnecessary.
