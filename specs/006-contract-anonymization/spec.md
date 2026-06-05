# Feature Specification: Contract Anonymization

**Feature Branch**: `006-contract-anonymization`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "I would like to allow users to anonymize some contract information when they show the dashboard to anyone. The main focus is on the contract names, both by allowing to anonymize a single contract in the edit and via a global anonymize option which anonymized all the entries in the datatable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Anonymization Toggle with Animation (Priority: P1)

A user is about to share their screen or show the dashboard to a colleague, friend, or family member. They want to hide all contract names at once without editing individual contracts, so they can discuss their financial commitments without revealing the specific service names. When they activate the toggle, a delightful flip animation reveals a fictional fantasy company name in place of each real contract name.

**Why this priority**: This is the primary, high-frequency use case. It delivers immediate privacy with a single interaction and the animation makes the feature feel polished rather than merely functional.

**Independent Test**: Can be fully tested by toggling the global anonymize button and verifying all contract names in the data table flip-animate to fictional fantasy company names. Delivers immediate screen-sharing privacy.

**Acceptance Scenarios**:

1. **Given** the dashboard is showing contracts with real names, **When** the user activates the global anonymization toggle, **Then** each contract name plays a flip animation and resolves to a fictional fantasy company name from the predefined list; all other fields remain visible.
2. **Given** the global anonymization toggle is active, **When** the user deactivates it, **Then** each contract name plays the flip animation in reverse and resolves back to the original name, with no data loss.
3. **Given** the global anonymization toggle is active, **When** the user navigates away and returns to the dashboard, **Then** the toggle state is preserved and fantasy names are shown without re-animating.
4. **Given** the global anonymization is active, **When** the page is refreshed, **Then** the anonymization state persists across the session and fantasy names are displayed immediately on load (no animation on load, only on toggle).
5. **Given** the global anonymization toggle is active and multiple contracts are displayed, **When** the toggle is activated, **Then** all contract name flip animations play simultaneously (or with a slight stagger for visual polish).

---

### User Story 2 - Per-Contract Anonymization Setting (Priority: P2)

A user has specific contracts they always want to keep hidden (e.g., a sensitive subscription) while showing others normally. They want to mark individual contracts as "always anonymize" so that those contracts always display a fantasy name, regardless of the global toggle state.

**Why this priority**: Gives users fine-grained control for permanently sensitive contracts. Enhances the global toggle by allowing persistent per-contract privacy settings, but requires the dashboard (P1) to work first.

**Independent Test**: Can be fully tested by editing a single contract, enabling its anonymization flag, saving, and verifying that contract always shows its assigned fantasy name on the dashboard — even when the global toggle is off.

**Acceptance Scenarios**:

1. **Given** a contract's edit form, **When** the user enables the "anonymize this contract" option and saves, **Then** that contract's name is displayed as its assigned fantasy company name on the dashboard at all times, including when the global toggle is off.
2. **Given** a contract with per-contract anonymization enabled, **When** the global toggle is also activated, **Then** the contract continues to show its fantasy name (no conflict — both settings produce the same result).
3. **Given** a contract with per-contract anonymization enabled, **When** the user edits the contract and disables the anonymization option and saves, **Then** the contract name is shown normally in the dashboard list (unless the global toggle is active).
4. **Given** any contract with anonymization active (per-contract or global), **When** the user opens that contract's edit or detail view, **Then** the real contract name is always shown — anonymization is list-view only.

---

### User Story 3 - Fantasy Name Assignment (Priority: P3)

Each contract that gets anonymized is assigned a fantasy company name from a curated static list. The assignment is stable — the same contract always gets the same fantasy name — so the user can still mentally track which placeholder corresponds to which real contract while sharing their screen.

**Why this priority**: Stable, consistent fantasy names reduce cognitive overhead for the user during screen sharing. Without stability, re-toggling would assign different names and confuse the user.

**Independent Test**: Can be tested by toggling anonymization on and off multiple times and verifying the same fantasy name is assigned to the same contract each time.

**Acceptance Scenarios**:

1. **Given** a contract has been assigned a fantasy name, **When** the user toggles anonymization off and then on again, **Then** the same fantasy name is shown for that contract.
2. **Given** the list of contracts exceeds the number of available fantasy names in the static list, **When** anonymization is activated, **Then** fantasy names are reused (cycling) or a fallback label is applied — no contract is left without a placeholder.
3. **Given** a new contract is added while the global anonymization toggle is active, **When** the dashboard refreshes, **Then** the new contract is assigned a fantasy name consistent with the assignment strategy.

---

### Edge Cases

- What happens when a contract has per-contract anonymization enabled and the global toggle is off — the contract MUST still appear anonymized with its assigned fantasy name.
- What happens when no contracts exist — the global toggle is present but effectively a no-op; no animation plays.
- What happens when the static fantasy name list is exhausted (more contracts than names) — names are reused in a cyclic fashion or a numbered suffix is appended (e.g., "Starfall Corp 2").
- Does anonymization affect exported data — assumed out of scope; exports use real names.
- The flip animation must not interfere with table sorting, filtering, or pagination interactions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST include a clearly visible global anonymization toggle that applies to all contracts simultaneously.
- **FR-002**: When the global anonymization toggle is activated, all contract names in the data table MUST play a flip animation and resolve to fictional fantasy company names from the predefined static list.
- **FR-003**: When the global anonymization toggle is deactivated, all contract names MUST play the flip animation in reverse and resolve back to their original names.
- **FR-004**: The flip animation MUST play on toggle action (on and off); it MUST NOT replay on page load when the toggle state is already active.
- **FR-005**: The global anonymization toggle state MUST persist across page refreshes within the same browser session.
- **FR-006**: The contract edit form MUST include a boolean option allowing users to permanently anonymize an individual contract's name on the dashboard list.
- **FR-007**: A contract with per-contract anonymization enabled MUST display its assigned fantasy name in the dashboard data table regardless of the global toggle state.
- **FR-008**: Fantasy name assignment MUST be stable: the same contract MUST always receive the same fantasy name across toggle cycles and page refreshes.
- **FR-009**: A curated static list of fictional fantasy company names MUST exist within the application; this list is the sole source of anonymization placeholders.
- **FR-010**: When the number of contracts exceeds the number of available fantasy names, the assignment strategy MUST handle overflow gracefully (cyclic reuse or numbered suffix) — no contract may be left without a placeholder.
- **FR-011**: Anonymization MUST apply only to the dashboard data table list view; real contract names MUST always be visible in contract edit and detail views.
- **FR-012**: The per-contract anonymization setting MUST be persisted as part of the contract record and survive session restarts.

### Key Entities

- **Contract**: Existing entity. Gains a new boolean attribute (`anonymize`) indicating whether the contract name should be permanently anonymized in list views.
- **Fantasy Name List**: A static, curated collection of fictional company names bundled with the application. Used exclusively as anonymization placeholders.
- **Anonymization Toggle State**: Session-level state (client-side) representing whether global anonymization is active. Overlays per-contract settings — if either is true, the contract appears anonymized.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can activate global anonymization from the dashboard in a single interaction (one click/tap), with all contract name flip animations completing within 800ms.
- **SC-002**: A user can mark a specific contract as permanently anonymized in under 30 seconds via the edit form.
- **SC-003**: Per-contract anonymization settings survive a full browser refresh and re-login with 100% reliability.
- **SC-004**: Global anonymization toggle state survives a page refresh within the same session with 100% reliability.
- **SC-005**: When anonymization is active, no real contract name is visible anywhere in the dashboard data table — zero leakage.
- **SC-006**: The same fantasy name is assigned to the same contract across 100% of toggle cycles without variation.
- **SC-007**: The flip animation plays without frame drops or layout shift on a standard laptop display with up to 50 contracts visible.

## Assumptions

- Anonymization applies only to the contract name field in the dashboard data table. Other fields (amount, billing interval, category, start date, etc.) remain fully visible.
- The static fantasy name list is defined and maintained within the application codebase (e.g., a JSON or TypeScript constant) — there is no external source or API.
- The fantasy name assignment algorithm uses a deterministic mapping (e.g., based on contract ID modulo list length) to ensure stability.
- The global toggle state is stored client-side (e.g., local storage or session storage) — no server round-trip required per toggle.
- Export functionality (if any) is out of scope; anonymization does not affect data exports in this feature.
- The edit/detail view always shows the real contract name to the owner — anonymization is a display-only concern for the list view.
- Only one user per instance (personal-use app) — no role-based or multi-user permission considerations needed.
- The flip animation is a visual "card flip" or similar effect where the text appears to rotate or scramble before settling on the new value; the exact animation style is a design decision for the plan phase.
