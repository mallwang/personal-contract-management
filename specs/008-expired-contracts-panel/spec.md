# Feature Specification: Expired Contracts Dashboard Panel

**Feature Branch**: `008-expired-contracts-panel`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "I would like to have another dashboard panel which shows the expired contracts, which its enddate is expired (before the current date). Those contracts should be displayed in a highlighted panel, similar like the upcoming renewals, but with a slightly warning background to indicate that those need user attention because they could be ran into auto-prolongation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Expired Contracts at a Glance (Priority: P1)

A user opens the dashboard and immediately sees all contracts that have already passed their end date displayed in a dedicated, visually distinct warning panel. The panel signals urgency so the user knows these contracts need attention — they may have entered auto-prolongation without the user realising.

**Why this priority**: This is the core value of the feature. Without this panel, expired contracts are invisible on the dashboard, which is the primary risk the feature addresses.

**Independent Test**: Can be fully tested by loading the dashboard with at least one expired contract in the system and verifying the panel renders with warning styling and lists the correct contracts.

**Acceptance Scenarios**:

1. **Given** the user has one or more contracts with an end date in the past, **When** they open the dashboard, **Then** a warning panel titled "Expired Contracts" (or equivalent) is visible and lists all contracts whose end date is before today's date.
2. **Given** the expired contracts panel is visible, **When** the user looks at it, **Then** it has a visually distinct warning background or border that clearly differentiates it from neutral dashboard panels.
3. **Given** a contract's end date is exactly today, **When** the dashboard loads, **Then** the contract does NOT appear in the expired panel (only strictly past dates qualify).
4. **Given** the user looks at the panel, **When** examining each contract entry, **Then** the contract name and end date are shown at minimum.

---

### User Story 2 - Navigate to Contract Detail from Expired Panel (Priority: P2)

A user sees an expired contract in the warning panel and clicks on it to navigate directly to that contract's detail or edit view, so they can take action (e.g., cancel, renew, or update the contract).

**Why this priority**: Visibility without actionability is of limited value. Users need a clear path from "I see this is expired" to "I can do something about it".

**Independent Test**: Can be fully tested by clicking a contract entry in the expired panel and verifying navigation to the correct contract.

**Acceptance Scenarios**:

1. **Given** the expired contracts panel is visible with at least one contract listed, **When** the user clicks on a contract entry, **Then** they are taken to the detail or management view for that specific contract.

---

### User Story 3 - Empty State When No Contracts Are Expired (Priority: P3)

When all contracts are current (no end dates in the past), the expired contracts panel either shows a friendly empty state message or is hidden entirely, so the dashboard does not appear broken.

**Why this priority**: A clean empty state avoids confusion and provides reassurance that the feature is working correctly rather than just being invisible.

**Independent Test**: Can be fully tested by ensuring no contracts have past end dates and verifying the dashboard handles this gracefully.

**Acceptance Scenarios**:

1. **Given** no contracts have a past end date, **When** the user opens the dashboard, **Then** the expired contracts panel either shows a clear empty state (e.g., "No expired contracts") or is not rendered at all — without breaking the dashboard layout.
2. **Given** the empty state is displayed, **When** the user views the panel, **Then** no warning styling implies urgency (empty state is neutral in tone).

---

### Edge Cases

- What happens when a contract has no end date set? → It does not appear in the expired panel (only contracts with an explicit past end date qualify).
- What happens when there are many expired contracts? → The panel scrolls or shows a capped list with a "view all" indicator, avoiding an infinitely tall panel.
- How does the system handle the date boundary at midnight? → "Expired" means the end date is strictly before today's calendar date (not a timestamp comparison), consistent with how upcoming renewals are calculated.
- What if the user's anonymization toggle is enabled? → Contract names follow the same anonymization rules applied across the application.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST display a dedicated "Expired Contracts" panel listing all contracts whose end date is strictly before the current calendar date.
- **FR-002**: The expired contracts panel MUST use a warning visual style (e.g., amber/orange tinted background or border) that is clearly distinguishable from the upcoming renewals panel and other dashboard components.
- **FR-003**: Each contract entry in the panel MUST display at minimum the contract name and end date.
- **FR-004**: Contracts without an end date MUST NOT appear in the expired contracts panel.
- **FR-005**: Clicking a contract entry in the panel MUST navigate the user to that contract's detail or edit view.
- **FR-006**: When no contracts are expired, the panel MUST display a neutral empty state message or be hidden — it MUST NOT display warning styling in the empty state.
- **FR-007**: The panel MUST respect the existing name anonymization toggle, applying the same masking rules as the rest of the application.
- **FR-008**: The panel layout and placement on the dashboard MUST be visually consistent with the existing upcoming renewals panel.
- **FR-009**: The panel MUST cap visible entries to avoid excessive height, providing a scroll or overflow indicator when the count exceeds a reasonable threshold.

### Key Entities

- **Contract**: The core entity; relevant attributes are name, end date, and identifier. The panel reads existing contract data — no new data is introduced by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All contracts with a past end date appear in the expired contracts panel within one dashboard load — 0% omission rate.
- **SC-002**: A user can identify which contracts are expired and requiring attention within 5 seconds of opening the dashboard, without any additional navigation.
- **SC-003**: The warning panel is visually distinct enough that 100% of users distinguish it from the upcoming renewals panel without any tooltip or explanation.
- **SC-004**: No contract with a future or absent end date appears in the expired panel — 0% false-positive rate.
- **SC-005**: The dashboard renders without errors or layout breakage regardless of whether zero or many contracts are expired.

## Assumptions

- The existing contract data model already includes an `endDate` field; this feature reads that field without modifying the schema.
- "Expired" is defined as `endDate < today` using calendar-day granularity (not timestamp), consistent with how the upcoming renewals calculation works.
- The visual warning style for the panel will use an amber/orange palette to differentiate it from the upcoming renewals panel, and will align with the existing design system already in use (shadcn/ui).
- The maximum number of visible entries before overflow/scroll is determined during implementation based on the dashboard layout — no specific cap is required by this spec.
- Navigation on contract entry click follows the same route already used elsewhere in the application (e.g., contract list or contract detail page).
- The feature is dashboard-only; no new filtering, sorting, or bulk-action capability for expired contracts is in scope for this version.
