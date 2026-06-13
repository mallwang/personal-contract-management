# Feature Specification: Mantine UI Modernization

**Feature Branch**: `015-mantine-ui-modernization`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "We would like to modernize the application UI and decided to go with Mantine UI (https://ui.mantine.dev/). We want to replace Tailwind with Mantine CSS modules and use a basic layout consisting with a app shell with a sidebar and put all navigation under the sidebar elements. Additionally, the user settings (language, dark/light themeing) should go into a settings sidebare element."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sidebar Navigation (Priority: P1)

A user opens the application and sees a segmented sidebar along the left edge of the screen using the Mantine Navbar Segmented pattern. The first segment contains all regular navigation links (Dashboard, Contracts, Account Settings). The user clicks a sidebar link to move between sections without any full-page reload. The currently active link is visually highlighted.

**Why this priority**: Navigation is foundational; the entire application is unusable without it, and the sidebar replaces the existing top-right navigation bar entirely.

**Independent Test**: Open the application, verify the sidebar is present with its first segment, click each navigation link, and confirm the correct page loads with the active link highlighted.

**Acceptance Scenarios**:

1. **Given** a signed-in user on any application page, **When** they view the left side of the screen, **Then** a sidebar is visible containing links to Dashboard, Contracts, and Account Settings.
2. **Given** a user on the Dashboard page, **When** they click "Contracts" in the sidebar, **Then** the Contracts page loads and the Contracts link is marked as active.
3. **Given** any page in the application, **When** the user navigates via the sidebar, **Then** the currently active section is visually highlighted in the sidebar.

---

### User Story 2 - Admin Segment in Sidebar (Priority: P2)

An admin user sees a second segment in the sidebar labelled "Admin". This segment contains admin-only links such as user management. A regular (non-admin) user sees only the first segment.

**Why this priority**: Admin functionality must be segregated and invisible to regular users; the segmented sidebar pattern makes this structurally clear.

**Independent Test**: Sign in as an admin, verify the second segment and its links appear; sign in as a regular user, verify only the first segment is shown.

**Acceptance Scenarios**:

1. **Given** a signed-in admin user, **When** they view the sidebar, **Then** a second "Admin" segment is visible below the first segment.
2. **Given** the Admin segment is visible, **When** the admin clicks the Accounts link, **Then** the Accounts admin page loads and the link is marked as active.
3. **Given** a signed-in regular (non-admin) user, **When** they view the sidebar, **Then** no Admin segment is shown and no admin links are accessible.

---

### User Story 3 - Settings Panel in Sidebar (Priority: P3)

A user locates a Settings section at the bottom of the sidebar. They can change the display language using the Mantine Language Picker and toggle between dark and light visual themes without reloading the application. Both preferences persist across sessions.

**Why this priority**: Language and theme preferences affect every screen; always-accessible sidebar controls are a core usability improvement.

**Independent Test**: Use the Settings area to toggle the theme and change the language; verify both take effect immediately and persist across a page reload.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they view the sidebar, **Then** a Settings area is visible below all navigation segments, containing a language picker and a theme toggle.
2. **Given** the Settings area is visible, **When** the user selects a different language via the language picker, **Then** the entire application interface switches to that language immediately without a page reload.
3. **Given** the Settings area is visible, **When** the user clicks the dark/light theme toggle, **Then** the application switches to the selected theme immediately without a page reload.
4. **Given** the user has selected a theme or language, **When** they reload the application, **Then** the previously selected preference is still active.

---

### User Story 4 - Sign Out and Account Access from Sidebar (Priority: P4)

The currently signed-in user's display name and a Sign Out button are accessible from the sidebar. The user can also navigate to Account Settings via the first navigation segment.

**Why this priority**: These controls currently live in the top-right bar that is being removed; they must be migrated to the sidebar to preserve all existing functionality.

**Independent Test**: Verify the user's display name is shown in the sidebar; click Sign Out and confirm redirect to the sign-in page.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they view the sidebar, **Then** their display name is shown.
2. **Given** a signed-in user, **When** they click Sign Out in the sidebar, **Then** they are signed out and redirected to the sign-in page.

---

### User Story 5 - Dashboard Spending Overview (Priority: P5)

A user views the Dashboard and sees a Mantine Stats Segments widget displaying their total monthly spending plus a breakdown of the top three spending categories. The widget replaces the existing spending summary in a visually clearer format.

**Why this priority**: The spending overview is a primary information widget on the Dashboard; migrating it to the Mantine Stats Segments pattern improves clarity and consistency.

**Independent Test**: Open the Dashboard, verify the stats widget shows a total spending figure and up to three category-level spending bars/segments with category names and amounts.

**Acceptance Scenarios**:

1. **Given** a signed-in user with contracts on the Dashboard, **When** they view the spending stats widget, **Then** total monthly spending and the top three category spendings are shown.
2. **Given** a user with fewer than three contract categories, **When** they view the stats widget, **Then** only the existing categories are shown (no empty placeholders).

---

### User Story 6 - Sortable Contract Table (Priority: P6)

A user navigating to the Contracts page sees a sortable table built on the Mantine Table Sort pattern. The table has a sticky header, provider logos displayed in the icon column, and supports clicking on column headers to sort by that column.

**Why this priority**: A sortable, visually enriched contract table is a major usability improvement for users managing many contracts.

**Independent Test**: Navigate to Contracts, click column headers to verify sorting, scroll down to verify the header remains sticky, and confirm provider logos appear in the logo column.

**Acceptance Scenarios**:

1. **Given** a user on the Contracts page, **When** they click a column header, **Then** the table rows sort by that column (toggling ascending/descending on repeated clicks).
2. **Given** a user scrolling down a long contract list, **When** they scroll past the first visible row, **Then** the table header remains visible (sticky).
3. **Given** a contract with a known provider, **When** the user views the contract row, **Then** the provider logo is displayed in the logo column.

---

### User Story 7 - Contract Anonymization Controls (Priority: P7)

A user can toggle anonymization for a single contract using a styled custom switch control inline in the contract list or form. In the Account Settings page, a global anonymization toggle using the Mantine Switches Card pattern controls visibility of all contract names at once.

**Why this priority**: Anonymization is an existing feature; migrating its controls to the new Mantine patterns ensures visual consistency and preserves the feature's usability.

**Independent Test**: Toggle the per-contract switch on a contract and verify only that contract's name is anonymised; toggle the global switch in Account Settings and verify all contract names respond immediately.

**Acceptance Scenarios**:

1. **Given** a user viewing the contract list or form, **When** they toggle the custom switch for a specific contract, **Then** only that contract's name is anonymised (or de-anonymised).
2. **Given** a user on the Account Settings page, **When** they toggle the global anonymization switch in the Switches Card, **Then** all contract names are anonymised (or de-anonymised) throughout the application.

---

### User Story 8 - Contract Form Inputs (Priority: P8)

When creating or editing a contract, all text and numeric fields use the Mantine Contained Inputs style with tooltip labels for guidance. The amount field uses the Mantine Currency Input (locked to EUR). Password fields across the application use the Mantine Password Strength input with a strength indicator.

**Why this priority**: Consistent, high-quality form inputs reduce user errors and reinforce the modernised design system.

**Independent Test**: Open the new/edit contract form; verify input fields use the contained style with tooltips on hover; enter a value in the amount field and verify EUR currency formatting; enter a password in any password field and verify a strength indicator is shown.

**Acceptance Scenarios**:

1. **Given** a user on the new or edit contract form, **When** they hover over an input field label, **Then** a tooltip with guidance text is shown.
2. **Given** a user entering an amount, **When** they type in the amount field, **Then** the field displays the value formatted as EUR currency.
3. **Given** a user entering a password (sign-in or account settings), **When** they type in the password field, **Then** a password strength indicator is shown.

---

### User Story 9 - User Management Table (Priority: P9)

An admin user on the Accounts admin page sees user accounts displayed in the Mantine Users Table pattern, with each row showing account details and available actions (e.g., invite, deactivate).

**Why this priority**: The admin user management view benefits from the richer row layout the Users Table pattern provides, improving readability for admins.

**Independent Test**: Sign in as admin, navigate to Admin > Accounts, verify user rows are displayed in the Users Table style.

**Acceptance Scenarios**:

1. **Given** an admin user on the Accounts page, **When** they view the user list, **Then** each user is shown in a row using the Mantine Users Table pattern.
2. **Given** an admin user on the Accounts page, **When** they interact with a user row's action controls, **Then** the relevant action (invite, manage) is triggered.

---

### User Story 10 - Mantine-Styled Sign-In Page (Priority: P10)

An unauthenticated user is presented with a polished sign-in page using the Mantine UI Authentication Title layout, without a sidebar, visually consistent with the rest of the modernised application.

**Why this priority**: The sign-in page is the application's entry point; it should share the same design language as the authenticated shell.

**Independent Test**: Navigate to `/sign-in` as an unauthenticated user and verify the Mantine authentication form renders without a sidebar.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they are redirected to the sign-in page, **Then** the page displays a centred authentication form styled with the Mantine UI Authentication Title pattern, without a sidebar.
2. **Given** the sign-in page, **When** the user submits valid credentials, **Then** they are redirected to the Dashboard with the sidebar layout visible.
3. **Given** the sign-in page, **When** the user submits invalid credentials, **Then** an inline error message is displayed within the form.

---

### User Story 11 - Application Footer (Priority: P11)

All authenticated pages display a simple footer at the bottom of the content area using the Mantine Footer Simple pattern.

**Why this priority**: A consistent footer completes the app shell layout and provides a standard place for application metadata (e.g., version, copyright).

**Independent Test**: Navigate to any authenticated page and verify the footer is present at the bottom of the content area.

**Acceptance Scenarios**:

1. **Given** any authenticated page, **When** the user views the bottom of the content area, **Then** a footer styled with the Mantine Footer Simple pattern is visible.

---

### Edge Cases

- What happens to the sidebar on a narrow screen or small viewport? (Sidebar collapses or overlays; content remains accessible.)
- What happens if the user has a system-level dark-mode preference set? (System preference is used as the default theme on first visit before the user sets an explicit preference.)
- What happens when a contract has no provider logo available? (The logo cell in the contract table shows a fallback placeholder icon.)
- What happens when the user has zero contracts? (The Dashboard stats widget shows zero values; the contract table shows an empty-state message.)

## Requirements *(mandatory)*

### Functional Requirements

**Layout & Navigation**

- **FR-001**: The application MUST display a persistent sidebar using the Mantine Navbar Segmented pattern for all authenticated pages.
- **FR-002**: The sidebar's first segment MUST include navigation entries for: Dashboard, Contracts, and Account Settings.
- **FR-003**: The sidebar MUST display a second "Admin" segment containing the Accounts link only when the signed-in user has the admin role; this segment MUST NOT be visible to non-admin users.
- **FR-004**: The sidebar MUST visually indicate the currently active navigation item across all segments.
- **FR-005**: The sidebar MUST display the signed-in user's display name and a Sign Out button.
- **FR-006**: All authenticated pages MUST include a footer using the Mantine Footer Simple pattern.

**Settings**

- **FR-007**: The sidebar MUST include a Settings area (below all navigation segments) with a language picker (Mantine Language Picker pattern) and a dark/light theme toggle.
- **FR-008**: Changing the language MUST update the entire application interface immediately without a page reload.
- **FR-009**: Toggling the theme MUST switch the application between dark and light modes immediately without a page reload.
- **FR-010**: The selected theme MUST be persisted and restored on subsequent visits or page reloads.
- **FR-011**: The selected language MUST be persisted and restored on subsequent visits or page reloads.

**Dashboard**

- **FR-012**: The Dashboard MUST display a spending stats widget using the Mantine Stats Segments pattern showing total spending and the top three category-level spendings.

**Contract Table**

- **FR-013**: The Contracts page MUST display a sortable table using the Mantine Table Sort pattern with a sticky header.
- **FR-014**: Each contract row in the table MUST display the provider logo; rows for providers without a logo MUST show a fallback placeholder.
- **FR-015**: Clicking a column header MUST sort the table by that column, toggling ascending/descending order on repeated clicks.

**Contract Form**

- **FR-016**: All text and select input fields in the contract create/edit form MUST use the Mantine Contained Inputs style.
- **FR-017**: Each input field in the contract form MUST display a tooltip with guidance text on hover, using the Mantine Input Tooltip pattern.
- **FR-018**: The amount input field MUST use the Mantine Currency Input pattern, locked to EUR.

**Anonymization**

- **FR-019**: The per-contract anonymization control MUST use the Mantine Custom Switch pattern in the contract list and form.
- **FR-020**: The global anonymization control in Account Settings MUST use the Mantine Switches Card pattern.

**Password**

- **FR-021**: All password input fields across the application (sign-in, account settings) MUST use the Mantine Password Strength input pattern with a strength indicator.

**User Management (Admin)**

- **FR-022**: The Accounts admin page MUST display users using the Mantine Users Table pattern.

**Sign-In & Public Pages**

- **FR-023**: The sign-in page MUST be redesigned using the Mantine UI Authentication Title layout and MUST NOT include the sidebar.
- **FR-024**: The invitation acceptance page MUST be styled consistently with Mantine UI and MUST NOT include the sidebar.

**Migration**

- **FR-025**: All visual styling previously provided by Tailwind CSS MUST be replaced by equivalent styles using Mantine UI components and Mantine CSS modules.
- **FR-026**: The application MUST be visually consistent and free of functional regressions after the migration.

### Key Entities

- **Sidebar**: The persistent lateral navigation panel built on the Mantine Navbar Segmented pattern, containing one or two navigation segments, a user identity/sign-out area, and a Settings section.
- **Navigation Segment**: A labelled group of related navigation links within the sidebar. The first segment serves all users; the second "Admin" segment is exclusively for admin users.
- **Settings Section**: A distinct area within the sidebar (below all segments) containing the language picker and theme toggle.
- **Theme Preference**: A per-user setting with two values (dark, light) that controls the application's colour scheme. Defaults to the system preference on first visit.
- **Language Preference**: A per-user setting that controls the display language across all application text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All application sections (Dashboard, Contracts, Account Settings, Admin) are reachable exclusively through sidebar navigation—no top navigation bar remains.
- **SC-002**: A user can switch the display language in under 3 interactions and the change takes effect without a page reload.
- **SC-003**: A user can toggle the theme in under 2 interactions and the change takes effect without a page reload.
- **SC-004**: The selected theme and language are correctly restored on every page reload with zero additional user actions.
- **SC-005**: No Tailwind CSS class names remain in any frontend source file after the migration.
- **SC-006**: All existing end-to-end user journeys (contract creation, editing, import, export, account management, invitation acceptance) complete successfully after the migration with no functional regressions.
- **SC-007**: The sign-in page renders the Mantine UI Authentication Title layout and passes functional sign-in and error-display tests.
- **SC-008**: The Admin sidebar segment is visible to admin users and completely absent for regular users.
- **SC-009**: The contract table supports column sorting and the header remains visible when scrolling a list of 20 or more contracts.
- **SC-010**: The Dashboard stats widget correctly shows total spending and up to three category breakdowns for users with at least one contract.

## Assumptions

- The sidebar follows the Mantine UI Navbar Segmented pattern; the first segment holds general navigation and the second (admin-only) holds admin navigation.
- The sign-in page follows the Mantine UI Authentication Title pattern; the invitation acceptance page is styled with Mantine UI but without a sidebar.
- All page-level and component-level Mantine UI pattern choices are pre-decided as listed in this specification and do not require further clarification:
  - Footer: Footer Simple
  - User management: Users Table
  - Contract overview (Dashboard): Stats Segments (total + top 3 categories)
  - Contract table: Table Sort (sticky header, provider logo column)
  - Language picker: Language Picker
  - Password inputs: Password Strength
  - Form inputs: Contained Inputs with Input Tooltip
  - Amount input: Currency Input (EUR, not selectable)
  - Per-contract anonymization: Custom Switch
  - Global anonymization (Account Settings): Switches Card
- The dark/light theme toggle is a global application-level preference, not per-contract or per-page.
- Theme preference is stored in the browser (e.g., local storage) so it is device-specific; it is not synchronised to the server.
- Language preference storage follows the same mechanism already used by the existing language switcher component.
- The sidebar is always visible on desktop viewports; on mobile/narrow viewports a standard responsive collapse behaviour is acceptable.
- The existing routing structure (/, /contracts, /contracts/new, /contracts/:id/edit, /contracts/import, /account, /admin/accounts) is preserved unchanged.
- Existing i18n translation keys are reused; the only anticipated new key is a label for the dark/light theme toggle.
- The currency for the amount input is locked to EUR and is not user-selectable.
