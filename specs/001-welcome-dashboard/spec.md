# Feature Specification: Welcome Dashboard

**Feature Branch**: `001-welcome-dashboard`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "create a welcome page that shows some overview statistics based on the existing contracts, e.g. current total active spending per month, amount of contracts per type and similar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Spending Overview (Priority: P1)

When a user opens the application, they land on the welcome dashboard and immediately see their
total active monthly spending across all contracts, along with a breakdown of that spending.

**Why this priority**: This is the single most valuable piece of financial insight — knowing how
much you are committed to spending each month is the primary reason to manage contracts.

**Independent Test**: Can be tested end-to-end by seeding the system with a set of known contracts
and verifying that the displayed monthly total matches the expected sum of active contract values.

**Acceptance Scenarios**:

1. **Given** the user has active contracts with known monthly costs, **When** they open the
   welcome dashboard, **Then** they see the correct total monthly spending figure prominently
   displayed.
2. **Given** the user has no active contracts, **When** they open the welcome dashboard, **Then**
   the spending total shows zero and an encouraging empty-state message is displayed.
3. **Given** the user has contracts in multiple currencies, **When** they view the dashboard,
   **Then** the dashboard displays all values in a single currency; contracts entered in a
   different currency are out of scope and not supported in this version.

---

### User Story 2 - Contracts by Category (Priority: P2)

The user can see a summary of how many contracts they have per category/type (e.g., Utilities,
Subscriptions, Insurance, Housing, Other), giving a quick sense of where their commitments lie.

**Why this priority**: Knowing spending by category reveals patterns that the total alone does
not — it answers "what kind of things am I paying for?"

**Independent Test**: Seed the system with contracts of different categories and verify the
count and label for each category appear correctly on the dashboard.

**Acceptance Scenarios**:

1. **Given** contracts exist across multiple categories, **When** the user views the dashboard,
   **Then** each category is shown with its contract count and combined monthly cost.
2. **Given** all contracts belong to a single category, **When** the user views the dashboard,
   **Then** only that one category is displayed (no empty categories shown).

---

### User Story 3 - Upcoming Renewals & Expirations (Priority: P3)

The user can see which contracts are due to renew or expire within the next 30 days, so they can
take action before being automatically renewed or caught off guard by an expiry.

**Why this priority**: Timely awareness of upcoming renewals is a core safety net for the user;
however, it requires contract end-date data to be captured, which may not exist in early versions.

**Independent Test**: Seed contracts with expiry dates at various distances from today and verify
the dashboard shows only those within the 30-day window, sorted soonest first.

**Acceptance Scenarios**:

1. **Given** contracts with expiry dates within 30 days exist, **When** the user views the
   dashboard, **Then** those contracts are listed with their name, category, and days remaining.
2. **Given** no contracts expire within 30 days, **When** the user views the dashboard, **Then**
   the renewals section shows an empty-state message ("No renewals due soon").

---

### Edge Cases

- What happens when there are no contracts at all? (Empty state for every section)
- What if a contract's monthly value is missing or zero? (Treat as zero contribution to totals)
- What if a contract is marked inactive mid-month? (Only active contracts contribute to totals)
- What if the dashboard data is being loaded? (A loading state is shown before data arrives)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the total combined monthly cost of all currently active
  contracts on the dashboard.
- **FR-002**: The system MUST display the number of active contracts grouped by category, with
  the combined monthly cost per category.
- **FR-003**: The system MUST list contracts whose end date falls within the next 30 days,
  sorted by end date ascending.
- **FR-004**: The system MUST display an appropriate empty-state message for each section when
  no relevant contracts exist.
- **FR-005**: Dashboard data MUST reflect the current state of contracts at the time of page
  load (no manual refresh required by the user to see up-to-date data on first visit).
- **FR-006**: The dashboard MUST be the default landing page when the application is opened.

### Key Entities

- **Contract**: A binding agreement with at least a name, category, monthly cost, status
  (active/inactive), and optional end date.
- **Category**: A label classifying the contract type (e.g., Utilities, Subscriptions,
  Insurance, Housing, Other). Categories are predefined.
- **Monthly Cost**: The recurring cost of a contract expressed as a monthly amount regardless
  of the actual billing cycle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with 10 or more contracts can read all key dashboard figures within
  5 seconds of the page loading.
- **SC-002**: The total monthly spending figure is accurate to within the precision of the
  stored contract values (no rounding errors introduced by display logic).
- **SC-003**: All three dashboard sections (spending total, contracts by category, upcoming
  renewals) are visible without scrolling on a standard desktop viewport (1280×800 or larger).
- **SC-004**: 90% of first-time users can understand the purpose of each dashboard section
  without additional explanation or tooltips.

## Assumptions

- The application is single-user (personal use); no authentication or multi-tenancy is in scope
  for this feature.
- All monetary values are stored and displayed in a single currency; multi-currency conversion
  is out of scope for this initial version (addressed by the clarification marker in US1).
- A "month" for spending calculations means a calendar month; contracts with non-monthly billing
  cycles (e.g., annual, weekly) have their cost normalised to a monthly equivalent at data-entry
  time.
- Categories are a fixed predefined list; the ability to create custom categories is out of scope.
- The welcome dashboard is read-only; no contract creation or editing occurs from this page.
- Contract data already exists in a backend data store; this feature covers display only, not
  data ingestion.
