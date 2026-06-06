# Feature Specification: Cancellation-Aware Renewals Panel

**Feature Branch**: `010-cancellation-aware-renewals`

**Created**: 2026-06-06

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Contracts That Need Action Now (Priority: P1)

A user opens the dashboard and wants to know at a glance which contracts require their attention.
The upcoming renewals panel shows only contracts whose cancellation deadline is approaching —
calculated as the contract end date minus the cancellation period — with an additional 30-day grace
period to give the user enough time to react before the final deadline.

For example: a contract ending October 1 with a 3-month cancellation period has a cancellation
deadline of July 1. The system starts showing it in the panel on June 1 (30 days before the
cancellation deadline).

**Why this priority**: This is the core value of the panel. Without this logic, users may miss
their cancellation window and get locked into unwanted renewals.

**Independent Test**: Can be fully tested by viewing the dashboard with a set of contracts that
have varying cancellation periods (in days, months, or years) and end dates, and confirming the
panel shows exactly the contracts that fall within their action window.

**Acceptance Scenarios**:

1. **Given** a contract with a 3-month cancellation period ending October 1, **When** the current
   date is between June 1 and September 30, **Then** the contract appears in the upcoming renewals
   panel.
2. **Given** a contract with a 3-month cancellation period ending October 1, **When** the current
   date is before June 1, **Then** the contract does NOT appear in the upcoming renewals panel.
3. **Given** a contract with a 14-day cancellation period ending July 15, **When** the current
   date is between June 1 and July 14, **Then** the contract appears in the panel (entry date is
   14 days before July 15 minus 30-day grace = June 1).
4. **Given** a contract with a 1-year cancellation period ending December 31, **When** the current
   date is within the period starting 30 days before the cancellation deadline, **Then** the
   contract appears in the panel.
5. **Given** a contract with no cancellation period, **When** the current date is within 30 days
   of the contract end date, **Then** the contract appears in the panel (default display window).
6. **Given** a contract whose cancellation deadline has already passed, **When** the user views
   the dashboard, **Then** the contract still appears in the panel and is marked as overdue.

---

### User Story 2 - Understand Urgency at a Glance (Priority: P2)

A user can immediately tell how urgent each listed contract is. Each contract in the panel shows
the cancellation deadline and how many days remain until that deadline, so the user knows whether
they need to act today or still have weeks.

**Why this priority**: Showing contracts without deadline context gives the user a list but not
actionable information. Urgency helps users prioritize.

**Independent Test**: Can be fully tested by verifying each panel entry displays both the
cancellation deadline date and the number of days remaining (or days overdue), ordered from most
to least urgent.

**Acceptance Scenarios**:

1. **Given** a contract is in the panel, **When** the cancellation deadline is in the future,
   **Then** the entry shows the cancellation deadline date and the number of days remaining.
2. **Given** a contract is in the panel, **When** the cancellation deadline has already passed,
   **Then** the entry is visually highlighted as overdue and shows the number of days past the
   deadline.
3. **Given** multiple contracts in the panel, **When** the user views the panel, **Then** they
   are sorted with the most urgent (fewest days remaining or already overdue) at the top.

---

### User Story 3 - Distinguish Action Deadline from Contract End Date (Priority: P3)

A user can clearly see the difference between when they must act (cancellation deadline) and when
the contract actually expires, so they understand the consequences of missing the cancellation
window.

**Why this priority**: Users often confuse the cancellation window with the contract end date.
Showing both removes ambiguity and prevents costly mistakes.

**Independent Test**: Can be fully tested by verifying that each panel entry displays both the
cancellation deadline and the contract end date as distinct, clearly labelled values.

**Acceptance Scenarios**:

1. **Given** a contract in the panel, **When** the user views the entry, **Then** they can see
   both the cancellation deadline and the contract end date as separate, labelled fields.
2. **Given** a contract with a 3-month cancellation period, **When** the user views the entry,
   **Then** the displayed cancellation deadline is exactly 3 months before the end date.
3. **Given** a contract with a 90-day cancellation period, **When** the user views the entry,
   **Then** the displayed cancellation deadline is exactly 90 days before the end date.

---

### Edge Cases

- What happens when a contract has a cancellation period longer than the time remaining to
  the end date (i.e., the cancellation deadline is already in the past)?
  → The contract must still appear in the panel, marked as overdue.
- What happens when a contract has already ended?
  → It does not appear in the upcoming renewals panel (it belongs to the expired contracts panel).
- What happens when a contract has no cancellation period defined?
  → A default 30-day display window before the end date is used (contract appears 30 days before
  end date, and the cancellation deadline equals the end date).
- What happens when two contracts have the same cancellation deadline?
  → They are sorted secondarily by contract name alphabetically.
- What happens when there are no contracts in the action window?
  → The panel displays an empty state message indicating no contracts require attention right now.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST calculate each contract's cancellation deadline as:
  contract end date minus the contract's cancellation period. The cancellation period may be
  expressed in days, months, or years, and MUST be converted to an exact calendar date.
- **FR-002**: The system MUST calculate each contract's panel entry date as:
  cancellation deadline minus 30 days (the grace period).
- **FR-003**: A contract MUST appear in the upcoming renewals panel when the current date is
  on or after the panel entry date and the contract has not yet ended.
- **FR-004**: Contracts that have already ended MUST NOT appear in the upcoming renewals panel.
- **FR-005**: Contracts with no cancellation period defined MUST use a default display window
  of 30 days before the end date (the cancellation deadline equals the end date in this case).
- **FR-006**: Each contract entry in the panel MUST display the cancellation deadline date.
- **FR-007**: Each contract entry in the panel MUST display the number of days remaining until
  the cancellation deadline, or the number of days past it if already overdue.
- **FR-008**: Each contract entry in the panel MUST display the contract end date.
- **FR-009**: Contracts whose cancellation deadline has passed but whose end date has not
  MUST appear in the panel with a distinct overdue visual indicator.
- **FR-010**: Contracts in the panel MUST be sorted by cancellation deadline ascending
  (most urgent first), with alphabetical contract name as the tiebreaker.
- **FR-011**: When no contracts fall within the action window, the panel MUST display an
  empty state message.

### Key Entities

- **Contract**: Has an end date, an optional cancellation period (expressed as a quantity and
  a unit of days, months, or years), a name, and a status. The cancellation period defines how
  far in advance of the end date the user must act.
- **Cancellation Deadline**: Derived value — the date by which the user must cancel or act
  on a contract to avoid automatic renewal. Equals: end date minus cancellation period.
- **Panel Entry Date**: Derived value — the date from which a contract becomes visible in
  the upcoming renewals panel. Equals: cancellation deadline minus 30 days (grace period).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify all contracts requiring action without any additional
  navigation or filtering — visible directly on the dashboard panel.
- **SC-002**: The panel displays every contract whose panel entry date has been reached and
  whose end date has not yet passed, with zero omissions.
- **SC-003**: Users can determine the exact date by which they must act for each listed
  contract without leaving the dashboard.
- **SC-004**: Contracts are consistently ordered so the most urgent item is always first,
  regardless of how many contracts are in the panel.
- **SC-005**: The panel correctly handles contracts with cancellation periods expressed in
  days, months, or years, covering all realistic contract terms.

## Assumptions

- Cancellation periods are stored as a quantity paired with a unit (days, months, or years).
  All three units must be supported; fractional values within a unit are out of scope.
- The 30-day grace period is a fixed system constant and is not configurable per contract
  or per user in this version.
- Month-based cancellation periods are calculated using calendar months (e.g., 3 months
  before October 1 is July 1, regardless of the number of days in between).
- Year-based cancellation periods are calculated as calendar years (e.g., 1 year before
  October 1, 2027 is October 1, 2026).
- A contract is considered "ended" when its end date is in the past; no additional status
  flags are required.
- The existing expired contracts panel is a separate component and continues to handle
  contracts whose end date has passed; there is no overlap between the two panels.
- The panel is read-only in this feature — no inline actions (cancel, renew) are added.
- Contracts without an end date are out of scope for this panel and will not be shown.
