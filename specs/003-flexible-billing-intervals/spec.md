# Feature Specification: Flexible Billing Intervals

**Feature Branch**: `003-flexible-billing-intervals`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "I would like to change the fixed monthly amount to allow the user to select the interval, to match more the reality. I personally have weekly, monthly, quarterly, yearly and lifetime subscriptions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Billing Interval on Contract (Priority: P1)

As a user managing my contracts, I want to specify both the amount I pay and how often I pay it (weekly, monthly, quarterly, yearly, or a one-time lifetime payment) so that my contracts accurately reflect real-world billing cycles.

**Why this priority**: This is the core of the feature — without the ability to choose an interval, nothing else works. It affects both creating new contracts and editing existing ones.

**Independent Test**: Can be tested by creating a new contract with a quarterly interval and a given amount, then verifying the stored contract reflects both values correctly.

**Acceptance Scenarios**:

1. **Given** a user is creating a new contract, **When** they enter the billing amount and select "Quarterly" as the interval, **Then** the contract is saved with the chosen amount and the quarterly interval.
2. **Given** a user is editing an existing contract that was previously set to monthly, **When** they change the interval to "Yearly" and update the amount, **Then** the contract is updated and displays the new interval and amount.
3. **Given** a user is creating a lifetime contract (one-time payment), **When** they select "Lifetime" as the interval, **Then** the contract is saved and displayed as a one-time cost, not a recurring charge.
4. **Given** a user opens the contract creation form, **When** they view the interval selector, **Then** all five intervals are available: Weekly, Monthly, Quarterly, Yearly, Lifetime.

---

### User Story 2 - View Normalized Spending Overview (Priority: P2)

As a user viewing my spending dashboard, I want all contract costs to be shown in a common unit (monthly equivalent) so that I can meaningfully compare and total subscriptions that bill on different cycles.

**Why this priority**: The dashboard's spending overview and category breakdown currently aggregate costs. Without normalization, the totals would be meaningless when intervals differ.

**Independent Test**: Can be tested by adding contracts with different intervals and verifying the dashboard's total spending figure equals the correct sum of monthly equivalents.

**Acceptance Scenarios**:

1. **Given** a user has a weekly contract for €10 and a yearly contract for €120, **When** they view the spending overview, **Then** the monthly total shows approximately €83 (€43.33 for weekly + €10 for yearly).
2. **Given** a user has a lifetime contract, **When** they view the spending overview, **Then** the lifetime contract contributes €0 to recurring monthly totals (it is excluded from recurring spend).
3. **Given** a user views any contract in a list or detail view, **When** the contract has a non-monthly interval, **Then** the billing information is shown as "€[amount] / [interval]" (e.g., "€49 / Quarterly") rather than a normalized figure.

---

### User Story 3 - Upcoming Renewals Respect Interval (Priority: P3)

As a user checking upcoming renewals, I want renewals to be calculated based on the actual billing interval so that I get accurate reminders for weekly, quarterly, and yearly contracts.

**Why this priority**: Renewal dates depend on the interval. A yearly contract renews far less often than a weekly one. Getting this wrong would show incorrect or misleading renewal alerts.

**Independent Test**: Can be tested by creating a quarterly contract with a start date and verifying the next renewal date appears correctly in the upcoming renewals list.

**Acceptance Scenarios**:

1. **Given** a quarterly contract with a known start date, **When** the user views upcoming renewals, **Then** the next renewal date is 3 months after the last billing date.
2. **Given** a lifetime contract, **When** the user views upcoming renewals, **Then** the lifetime contract does not appear in the renewals list (no recurring billing).
3. **Given** a weekly contract, **When** the user views upcoming renewals, **Then** the next renewal date is 7 days after the last billing date.

---

### Edge Cases

- What happens to existing contracts that only have a `monthlyAmount`? They are automatically migrated to `amount = monthlyAmount` with `interval = Monthly`.
- How is "Lifetime" handled in spending totals? Lifetime contracts are excluded from recurring monthly cost calculations.
- What if the user leaves the interval unselected? The interval field is required; the form prevents submission without a selection.
- How are weekly costs normalized to monthly? Using the factor 52/12 (approximately 4.333 weeks per month).
- Can a user change a lifetime contract to a recurring one (or vice versa)? Yes — the interval is editable at any time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to specify a billing interval when creating a contract, choosing from: Weekly, Monthly, Quarterly, Yearly, Lifetime.
- **FR-002**: Users MUST be able to specify a billing interval when editing an existing contract.
- **FR-003**: The billing interval field MUST be required; contracts cannot be saved without selecting an interval.
- **FR-004**: The billing amount field MUST remain required and represent the amount charged per selected interval.
- **FR-005**: Existing contracts previously stored with only a monthly amount MUST be automatically migrated to `amount = monthlyAmount` and `interval = Monthly` without data loss.
- **FR-006**: The spending overview on the dashboard MUST display totals using monthly-equivalent normalization across all recurring intervals (Weekly, Monthly, Quarterly, Yearly).
- **FR-007**: Lifetime contracts MUST be excluded from recurring monthly spending totals on the dashboard.
- **FR-008**: Contract list and detail views MUST display the billing information as "[amount] / [interval]" (e.g., "€49 / Quarterly").
- **FR-009**: Upcoming renewals MUST calculate the next renewal date based on the contract's billing interval.
- **FR-010**: Lifetime contracts MUST NOT appear in the upcoming renewals list.
- **FR-011**: The category breakdown on the dashboard MUST use the same monthly-equivalent normalization as the spending overview total.

### Key Entities

- **Contract**: Gains two fields replacing `monthlyAmount`:
  - `amount`: the cost per billing cycle (required, non-negative number)
  - `billingInterval`: the frequency of billing — one of `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`
- **BillingInterval**: An enumerated type with values: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five billing intervals (Weekly, Monthly, Quarterly, Yearly, Lifetime) are selectable when creating or editing any contract.
- **SC-002**: The dashboard spending total correctly reflects normalized monthly equivalents; a contract changed from monthly to yearly billing causes the monthly total to update accordingly.
- **SC-003**: All existing contracts are accessible and display correctly after the migration, with no data loss or manual intervention required.
- **SC-004**: A user can create, view, edit, and delete contracts for all five interval types within a single session without errors.
- **SC-005**: Upcoming renewals for weekly, quarterly, and yearly contracts show the correct next date based on the billing cycle.

## Assumptions

- The dashboard spending overview currently uses `monthlyAmount` to compute totals; this will be replaced by normalized monthly equivalents derived from `amount` + `billingInterval`.
- Weekly-to-monthly normalization uses the factor 52 ÷ 12 ≈ 4.333 weeks per month.
- Quarterly-to-monthly normalization uses the factor 1 ÷ 3.
- Yearly-to-monthly normalization uses the factor 1 ÷ 12.
- Lifetime is treated as a one-time sunk cost and excluded from all recurring totals.
- The existing SQLite `monthly_amount` column will be replaced (via migration) by `amount` and `billing_interval` columns; existing rows are migrated automatically.
- There is no multi-currency support in scope; all amounts are in the user's single configured currency.
- The feature applies to all contract categories equally; no category is restricted to specific intervals.
