# Feature Specification: Contract List & CRUD

**Feature Branch**: `002-contract-crud`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "add a contract list page where users can create, edit, and delete contracts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Contract List (Priority: P1)

The user navigates to the contract list page and sees all their contracts displayed in a table or list. Each contract shows its name, category, monthly cost, status, and renewal date. The list is the central hub for managing personal contracts.

**Why this priority**: Without a visible list of contracts, no other CRUD action is meaningful. The list page is the foundation that makes all other stories deliverable.

**Independent Test**: Can be fully tested by navigating to the contract list page and verifying contracts are displayed with all relevant fields, delivering a read-only overview of all contracts.

**Acceptance Scenarios**:

1. **Given** the user has existing contracts, **When** they open the contract list page, **Then** each contract's name, category, monthly amount, status, and end date are displayed.
2. **Given** no contracts exist, **When** the user opens the contract list page, **Then** an empty-state message is shown inviting the user to create their first contract.
3. **Given** contracts exist, **When** the user views the list, **Then** contracts are sorted in a consistent and predictable order (e.g., by name ascending).

---

### User Story 2 - Create a Contract (Priority: P2)

The user opens a form (modal or dedicated page) and enters the details of a new contract. On submission the contract is saved and immediately appears in the contract list.

**Why this priority**: Creating contracts is the entry point for all contract data. Without this, the list is empty and the application has no value.

**Independent Test**: Can be fully tested by filling in the create form and confirming the new contract appears in the list, delivering the ability to capture contract data.

**Acceptance Scenarios**:

1. **Given** the contract list is open, **When** the user activates the "Add Contract" action, **Then** a form is presented with fields for name, category, monthly amount, status, and end date.
2. **Given** the create form is open, **When** the user submits valid data, **Then** the contract is saved and appears in the list without a full page reload.
3. **Given** the create form is open, **When** the user submits with a missing required field (name or monthly amount), **Then** a validation error is displayed and no contract is created.
4. **Given** the create form is open, **When** the user cancels, **Then** no contract is created and the list is unchanged.

---

### User Story 3 - Edit a Contract (Priority: P3)

The user selects an existing contract from the list and edits its details. The updated values are saved and immediately reflected in the list.

**Why this priority**: Contract details change over time (price increases, status changes). Editing is essential for keeping data accurate, but requires the list and create story to be in place first.

**Independent Test**: Can be fully tested by editing an existing contract's fields and confirming the updated values are shown in the list, delivering accurate contract records.

**Acceptance Scenarios**:

1. **Given** a contract exists in the list, **When** the user activates the edit action for that contract, **Then** a pre-populated form opens with the contract's current values.
2. **Given** the edit form is open, **When** the user changes one or more fields and submits, **Then** the contract is updated and the new values are reflected in the list.
3. **Given** the edit form is open, **When** the user submits with a required field cleared, **Then** a validation error is shown and the contract is not updated.
4. **Given** the edit form is open, **When** the user cancels, **Then** the contract remains unchanged.

---

### User Story 4 - Delete a Contract (Priority: P4)

The user removes a contract from the list. The system asks for confirmation before permanently deleting the record.

**Why this priority**: Deletion is important for housekeeping but is destructive. It is lower priority than create and edit, and a confirmation step protects against accidental data loss.

**Independent Test**: Can be fully tested by deleting an existing contract and confirming it no longer appears in the list, delivering clean data management.

**Acceptance Scenarios**:

1. **Given** a contract exists in the list, **When** the user activates the delete action, **Then** a confirmation prompt is shown before any deletion occurs.
2. **Given** the confirmation prompt is shown, **When** the user confirms, **Then** the contract is permanently removed and no longer appears in the list.
3. **Given** the confirmation prompt is shown, **When** the user cancels, **Then** the contract is not deleted and remains in the list.

---

### Edge Cases

- What happens when two contracts have the same name?
  The system accepts duplicate names (no uniqueness constraint on name); the user is responsible for naming clarity.
- How does the system handle a network error during save or delete?
  An error message is displayed to the user; no partial or inconsistent state is persisted.
- What happens if the end date is set in the past?
  The form accepts past end dates without warning — historical contracts are valid records.
- What happens when monthly amount is zero?
  Zero is a valid amount (e.g., free-tier subscriptions). The form accepts it.
- What happens if the user rapidly clicks "Delete" multiple times?
  The system prevents duplicate requests; only one deletion is processed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST provide a dedicated contract list page accessible from the main navigation.
- **FR-002**: The contract list MUST display each contract's name, category, monthly amount, status, and end date.
- **FR-003**: The contract list MUST show a clear empty-state message when no contracts exist.
- **FR-004**: Users MUST be able to create a new contract by providing: name (required), category (required), monthly amount (required, non-negative number), status (required), and end date (optional).
- **FR-005**: The system MUST validate all required fields before saving a contract and display field-level error messages on validation failure.
- **FR-006**: Users MUST be able to edit any field of an existing contract using a pre-populated form.
- **FR-007**: Users MUST be able to delete a contract, and the system MUST require explicit confirmation before deletion.
- **FR-008**: All create, edit, and delete operations MUST update the contract list immediately upon success, without requiring a full page reload.
- **FR-009**: The contract list page MUST be reachable from the existing welcome dashboard (e.g., via navigation link or dashboard widget action).

### Key Entities

- **Contract**: Represents a single recurring commitment. Key attributes: name (text), category (one of Utilities / Subscriptions / Insurance / Housing / Other), monthly amount (non-negative currency value), status (Active / Inactive), end date (optional date), creation timestamp, last-updated timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new contract from start to finish in under 60 seconds.
- **SC-002**: A user can locate, edit, and save a change to an existing contract in under 30 seconds.
- **SC-003**: A user can delete a contract (including confirmation) in under 15 seconds.
- **SC-004**: The contract list loads and displays all existing contracts in under 2 seconds under normal conditions.
- **SC-005**: 100% of create, edit, and delete actions either succeed visibly or present a clear error message — no silent failures.
- **SC-006**: Accidental deletion is prevented: zero contracts are deleted without an explicit confirmation step.

## Assumptions

- The application is single-user (no multi-tenancy, no per-user access control required for this feature).
- Navigation between the dashboard and the contract list page is already supported by the routing infrastructure.
- Currency is displayed without conversion — the monthly amount is a plain number stored and shown in the user's default currency.
- The category list (Utilities, Subscriptions, Insurance, Housing, Other) is fixed for this feature; extensibility is out of scope.
- Mobile-specific UI optimisation is out of scope for this feature; the page is expected to be usable on desktop viewport sizes.
- The existing Contract type definition in the shared package captures all required fields; no new fields are needed for this feature.