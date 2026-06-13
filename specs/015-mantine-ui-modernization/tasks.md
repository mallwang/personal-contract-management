# Tasks: Mantine UI Modernization

**Input**: Design documents from `specs/015-mantine-ui-modernization/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**TDD Policy**: Per project constitution — tests MUST be written and confirmed to FAIL before any implementation code is committed. This applies to every new or migrated component.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup (Mantine Installation & Tailwind Removal Prep)

**Purpose**: Add Mantine to the project and remove Tailwind from the build pipeline. Mantine and Tailwind can coexist temporarily during the migration; Tailwind class names are fully removed in the Polish phase.

- [X] T001 Add `@mantine/core`, `@mantine/hooks`, `@tabler/icons-react`, `postcss`, `postcss-preset-mantine`, `postcss-simple-vars` to `packages/frontend/package.json` dependencies (run `pnpm install`)
- [X] T002 Remove `@tailwindcss/vite` from `devDependencies` and `tailwindcss`, `tailwind-merge`, `class-variance-authority`, `clsx`, `@radix-ui/react-slot` from `dependencies` in `packages/frontend/package.json`
- [X] T003 Remove the `tailwindcss()` plugin call from `packages/frontend/vite.config.ts` (keep the `react()` plugin and all other config unchanged)
- [X] T004 Create `packages/frontend/postcss.config.cjs` with `postcss-preset-mantine` and `postcss-simple-vars` plugins
- [X] T005 Replace `@import "tailwindcss"` and the `@theme` block in `packages/frontend/src/index.css` with `@import "@mantine/core/styles.css"` (retain only non-Tailwind global rules such as `@keyframes nameFlip`)
- [X] T006 Wrap the app in `<MantineProvider>` with `localStorageColorSchemeManager({ key: 'pcm-color-scheme' })` and a `<ColorSchemeScript>` in `packages/frontend/src/main.tsx`

**Checkpoint**: `pnpm --filter frontend dev` starts without errors. Mantine CSS variables are loaded in the browser. The app may look unstyled until components are migrated.

---

## Phase 2: Foundational (AppShell Structure)

**Purpose**: Core AppShell layout that ALL sidebar-dependent user stories (US1–US4, US11) depend on. Must be complete before those stories can be implemented.

**⚠️ CRITICAL**: US1, US2, US3, US4, and US11 cannot be implemented until this phase is complete.

- [X] T007 Write failing tests for `AppShell` in `packages/frontend/tests/unit/AppShell.test.tsx` asserting: sidebar renders, nav links exist, children render in main area — confirm tests FAIL before proceeding
- [X] T008 Create `packages/frontend/src/components/AppShell/AppShell.tsx` implementing the Mantine `AppShell` wrapper with `AppShell.Navbar` and `AppShell.Main` slots; mount `NavbarSegmented` in the navbar slot and render `children` + `FooterSimple` in the main slot
- [X] T009 [P] Create `packages/frontend/src/components/AppShell/AppShell.module.css` with layout styles using Mantine CSS variables
- [X] T010 Create placeholder `packages/frontend/src/components/AppShell/NavbarSegmented.tsx` (renders static sidebar shell with no links yet — filled in US1)
- [X] T011 Create placeholder `packages/frontend/src/components/AppShell/FooterSimple.tsx` (renders empty footer — filled in US11)
- [X] T012 Replace the `<Layout>` component with `<AppShell>` in `packages/frontend/src/main.tsx` for the authenticated route tree; remove `packages/frontend/src/components/Layout.tsx`

**Checkpoint**: App loads. Mantine AppShell renders with an empty sidebar and footer. All existing routes navigate correctly. Unit tests in `AppShell.test.tsx` pass.

---

## Phase 3: User Story 1 — Sidebar Navigation (Priority: P1) 🎯 MVP

**Goal**: All primary navigation links (Dashboard, Contracts, Account Settings) are accessible from the sidebar's first segment. The active link is visually highlighted.

**Independent Test**: Open the app → verify sidebar links navigate correctly and active link is highlighted. No Admin segment present for regular users.

### Tests — US1

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T013 Extend `packages/frontend/tests/unit/AppShell.test.tsx` with failing assertions: first segment contains Dashboard, Contracts, Account Settings links; clicking each link navigates to the correct route; active link has active styling

### Implementation — US1

- [X] T014 [US1] Implement `NavbarSegmented` first segment in `packages/frontend/src/components/AppShell/NavbarSegmented.tsx` using `NavLink` components for Dashboard (`/`), Contracts (`/contracts`), Account Settings (`/account`); use `react-router-dom` `useLocation` to detect and apply active state
- [X] T015 [US1] Create `packages/frontend/src/components/AppShell/NavbarSegmented.module.css` with link active state styles using `light-dark()` CSS function and Mantine CSS variables

**Checkpoint**: Sidebar shows first segment with three nav links. Clicking any link navigates correctly. Active link is highlighted. All T013 tests pass.

---

## Phase 4: User Story 2 — Admin Segment (Priority: P2)

**Goal**: Admin users see a second "Admin" segment in the sidebar containing the Accounts link. Regular users see only the first segment.

**Independent Test**: Sign in as admin → Admin segment visible with Accounts link. Sign in as regular user → no Admin segment.

### Tests — US2

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T016 Extend `packages/frontend/tests/unit/AppShell.test.tsx` with failing assertions: admin user sees second segment with Accounts link; regular user does not see second segment

### Implementation — US2

- [X] T017 [US2] Add `useCurrentUser` hook to `NavbarSegmented` in `packages/frontend/src/components/AppShell/NavbarSegmented.tsx`; conditionally render second "Admin" segment with Accounts (`/admin/accounts`) `NavLink` when `user.role === 'ADMIN'`

**Checkpoint**: Admin users see the Admin segment. Regular users do not. T016 tests pass.

---

## Phase 5: User Story 3 — Settings Panel in Sidebar (Priority: P3)

**Goal**: A Settings area at the bottom of the sidebar provides a language picker and a dark/light theme toggle. Both preferences persist across page reloads.

**Independent Test**: Toggle theme → immediate switch + persists after reload. Change language → immediate switch + persists after reload.

### Tests — US3

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T018 Write failing tests for `ThemeToggle` in `packages/frontend/tests/unit/ThemeToggle.test.tsx`: renders moon icon in light mode, sun icon in dark mode, click calls `toggleColorScheme`
- [X] T019 Write failing tests for `LanguagePicker` in `packages/frontend/tests/unit/LanguagePicker.test.tsx` (migrated from `LanguageSwitcher.test.tsx`): renders current language, click on another language calls `i18n.changeLanguage`, writes `pcm-lang` to localStorage

### Implementation — US3

- [X] T020 [P] [US3] Implement `ThemeToggle` in `packages/frontend/src/components/AppShell/ThemeToggle.tsx` using `useMantineColorScheme`, `ActionIcon`, `Tooltip` from `@mantine/core` and `IconSun`/`IconMoon` from `@tabler/icons-react`
- [X] T021 [P] [US3] Implement `LanguagePicker` in `packages/frontend/src/components/AppShell/LanguagePicker.tsx` using Mantine `Menu` and `UnstyledButton`; preserve existing `pcm-lang` localStorage key and `i18n.changeLanguage()` call; delete `packages/frontend/src/components/LanguageSwitcher.tsx`
- [X] T022 [US3] Add Settings area (containing `ThemeToggle` and `LanguagePicker`) to the bottom of `NavbarSegmented` in `packages/frontend/src/components/AppShell/NavbarSegmented.tsx`

**Checkpoint**: Settings area visible in sidebar. Theme toggle and language picker work immediately without reload. Preferences persist. T018 and T019 tests pass.

---

## Phase 6: User Story 4 — Sign Out & Account Access from Sidebar (Priority: P4)

**Goal**: The signed-in user's display name and a Sign Out button are in the sidebar. Sign Out works correctly.

**Independent Test**: Verify display name shown in sidebar; click Sign Out → redirected to `/sign-in`.

### Tests — US4

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T023 Extend `packages/frontend/tests/unit/AppShell.test.tsx` with failing assertions: user display name shown; Sign Out button triggers sign-out mutation; redirect to `/sign-in`

### Implementation — US4

- [X] T024 [US4] Add user display name and Sign Out button to `NavbarSegmented` in `packages/frontend/src/components/AppShell/NavbarSegmented.tsx` using `useCurrentUser` and `useSignOut` hooks (same as removed `Layout.tsx`); wire Sign Out to `signOut()` mutation

**Checkpoint**: User display name visible. Sign Out button works. T023 tests pass.

---

## Phase 7: User Story 5 — Dashboard Spending Overview (Priority: P5)

**Goal**: Dashboard shows a Stats Segments widget with total monthly spending and top three category spendings.

**Independent Test**: Open Dashboard with contracts → stats widget shows total + up to 3 category breakdowns.

**Note**: This phase can proceed in parallel with Phase 3–6 as it does not depend on the AppShell navigation.

### Tests — US5

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T025 Update `packages/frontend/tests/unit/SpendingOverview.test.tsx` with failing assertions for the new StatsSegments layout: total spending displayed; category segments rendered (up to 3); zero-contract empty state shows

### Implementation — US5

- [X] T026 [P] [US5] Rewrite `packages/frontend/src/components/SpendingOverview.tsx` using Mantine `Progress`, `Group`, `Text`, `Paper` to implement the Stats Segments pattern; accept `totalMonthlySpending` and `contractsByCategory` (top 3) as props; add `SpendingOverview.module.css`
- [X] T027 [US5] Update `packages/frontend/src/pages/Dashboard.tsx` to pass `contractsByCategory` (sliced to top 3 by `monthlyTotal`) to the updated `SpendingOverview` component; remove the separate `CategoryBreakdown` component call (merged into SpendingOverview); delete `packages/frontend/src/components/CategoryBreakdown.tsx`

**Checkpoint**: Dashboard stats widget renders total spending and top 3 categories. Zero-contract empty state works. T025 tests pass.

---

## Phase 8: User Story 6 — Sortable Contract Table (Priority: P6)

**Goal**: Contract list page shows a Mantine Table Sort pattern table with sticky header and provider logo column.

**Independent Test**: Navigate to Contracts → click column headers to sort; scroll to verify sticky header; provider logos shown.

### Tests — US6

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T028 Update `packages/frontend/tests/unit/ContractTable.test.tsx` with failing assertions for Mantine Table pattern: column sort toggle works, provider logo cell renders, sticky header attribute present

### Implementation — US6

- [X] T029 [US6] Rewrite `packages/frontend/src/components/ContractTable.tsx` using Mantine `Table`, `Table.Thead`, `Table.Th`, `Table.Tbody`, `Table.Tr`, `Table.Td`, `UnstyledButton`, `Center` implementing the Table Sort pattern; retain existing sort logic (`sortState`, `handleSort`); add `stickyHeader` prop to `<Table>`; add `ContractTable.module.css`
- [X] T030 [P] [US6] Remove `lucide-react` sort icons from `ContractTable.tsx`; replace with Tabler `IconChevronUp`, `IconChevronDown`, `IconSelector` from `@tabler/icons-react`
- [X] T031 [US6] Update `packages/frontend/src/pages/ContractList.tsx` to use Mantine layout components (`Container`, `Group`, `Title`, `Button`, `Stack`) replacing Tailwind classes; replace `AnonymizationToggle` button with Mantine `Switch` (per-contract handled in T036)

**Checkpoint**: Contract table renders with sticky header and sortable columns. Provider logos shown. T028 tests pass.

---

## Phase 9: User Story 7 — Contract Anonymization Controls (Priority: P7)

**Goal**: Per-contract anonymization uses Mantine Custom Switch pattern. Global anonymization in Account Settings uses Mantine Switches Card pattern.

**Independent Test**: Toggle per-contract switch → only that contract anonymised. Toggle global switch in Account Settings → all contracts anonymised.

### Tests — US7

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T032 Update `packages/frontend/tests/unit/AnonymizationToggle.test.tsx` with failing assertions for Mantine `Switch` element: `aria-checked` state, click toggles, accessible label present

### Implementation — US7

- [X] T033 [P] [US7] Rewrite `packages/frontend/src/components/AnonymizationToggle.tsx` using Mantine `Switch` with `thumbIcon` (Custom Switch pattern); preserve `isActive` and `onToggle` props and existing `aria-label`
- [X] T034 [US7] Update `packages/frontend/src/pages/AccountSettings.tsx`: add global anonymization Switches Card section using Mantine `Card`, `Switch`, `Group`, `Text` (Switches Card pattern); wire to existing `useAnonymization` hook's global toggle

**Checkpoint**: Per-contract switch works. Global anonymization card in Account Settings works. T032 tests pass.

---

## Phase 10: User Story 8 — Contract Form Inputs (Priority: P8)

**Goal**: Create/edit contract form uses Mantine Contained Inputs with tooltips; amount field uses Currency Input (EUR); password fields use Password Strength input.

**Independent Test**: Open New Contract form → contained input fields with tooltip on hover; EUR amount formatting; enter password → strength indicator shown.

### Tests — US8

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T035 Update `packages/frontend/tests/unit/ContractForm.test.tsx` with failing assertions for Mantine inputs: `TextInput` variant="filled" rendered, tooltip renders on focus, amount field displays EUR prefix, required field validation present

### Implementation — US8

- [X] T036 [US8] Rewrite `packages/frontend/src/components/ContractForm.tsx` using Mantine `TextInput`, `Select`, `NumberInput` (variant="filled" for contained style) and `Tooltip` wrapping each field label; use `NumberInput` with `prefix="€"` and `decimalScale={2}` for the amount field; add `ContractForm.module.css`
- [X] T037 [P] [US8] Implement Password Strength input in `packages/frontend/src/pages/AccountSettings.tsx`: replace `<input type="password">` with Mantine `PasswordInput` and a `Popover`-based strength indicator (Password Strength pattern) using `useDisclosure` from `@mantine/hooks`
- [X] T038 [P] [US8] Implement Password Strength input in `packages/frontend/src/pages/SignIn.tsx` (password field only — full SignIn page migration in US10)

**Checkpoint**: Contract form uses contained inputs with tooltips and EUR formatting. Password fields show strength indicator. T035 tests pass.

---

## Phase 11: User Story 9 — User Management Table (Priority: P9)

**Goal**: Admin Accounts page displays users using the Mantine Users Table pattern.

**Independent Test**: Sign in as admin → Accounts page shows users in Users Table layout with row actions.

### Tests — US9

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T039 Write failing tests in `packages/frontend/tests/unit/AccountsAdmin.test.tsx`: user rows render with display name, email, role badge; action buttons (invite, archive, reactivate) are present per row

### Implementation — US9

- [X] T040 [US9] Rewrite `packages/frontend/src/pages/admin/AccountsAdmin.tsx` using Mantine `Table`, `Avatar`, `Badge`, `Group`, `ActionIcon`, `Button` (Users Table pattern); preserve all existing mutations (`useArchiveAccount`, `useReactivateAccount`, `useChangeAccountRole`, `useSendInvitation`); add `AccountsAdmin.module.css`

**Checkpoint**: Accounts admin page shows users in Users Table style. Actions work as before. T039 tests pass.

---

## Phase 12: User Story 10 — Mantine Sign-In Page (Priority: P10)

**Goal**: Sign-in page uses Authentication Title layout. No sidebar. Password field uses Password Strength pattern.

**Independent Test**: Navigate to `/sign-in` → centred form shown without sidebar; invalid credentials → inline error; valid credentials → redirected to Dashboard.

### Tests — US10

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T041 Update `packages/frontend/tests/unit/SignIn.test.tsx` (or create if absent) with failing assertions: form renders without sidebar wrapper, email and password fields present, error message renders on failed login

### Implementation — US10

- [X] T042 [US10] Rewrite `packages/frontend/src/pages/SignIn.tsx` using Mantine `Title`, `Text`, `Paper`, `TextInput`, `PasswordInput`, `Button`, `Anchor`, `Container`, `Center` (Authentication Title pattern); retain existing `useSignIn` mutation and error handling; ensure no `<AppShell>` wrapper present; add `SignIn.module.css`
- [X] T043 [P] [US10] Similarly update `packages/frontend/src/pages/AcceptInvitation.tsx` to use Mantine form components (`TextInput`, `PasswordInput`, `Button`, `Paper`, `Title`) without sidebar wrapper; retain existing invitation acceptance mutation

**Checkpoint**: Sign-in page renders Authentication Title layout. Invalid credentials show inline error. Successful login shows Dashboard with sidebar. T041 tests pass.

---

## Phase 13: User Story 11 — Application Footer (Priority: P11)

**Goal**: All authenticated pages display a simple footer at the bottom of the main content area.

**Independent Test**: Navigate to any authenticated page → footer visible at bottom of main content.

### Tests — US11

> **Write these tests FIRST, confirm they FAIL before implementing**

- [X] T044 Extend `packages/frontend/tests/unit/AppShell.test.tsx` with failing assertion: footer element rendered within `AppShell.Main`

### Implementation — US11

- [X] T045 [US11] Implement `FooterSimple` in `packages/frontend/src/components/AppShell/FooterSimple.tsx` using Mantine `Container`, `Group`, `Text` (Footer Simple pattern) with application name and current year; add `FooterSimple.module.css`

**Checkpoint**: Footer appears on all authenticated pages. T044 tests pass.

---

## Phase 14: Polish & Tailwind Cleanup

**Purpose**: Remove all remaining Tailwind dependencies and class names. Remove shadcn/ui components. Verify zero regressions.

- [X] T046 Delete `packages/frontend/src/components/ui/` directory (shadcn/ui `card.tsx`, `badge.tsx`); update any remaining imports in components that haven't been migrated yet
- [X] T047 [P] Audit all `.tsx` files in `packages/frontend/src/` for remaining Tailwind utility classes (`className="flex items-center ..."`) and replace each with Mantine component props or CSS module classes — run `grep -rn "className=\"" src/ | grep -v "module"` to find candidates
- [X] T048 [P] Remove `tailwind-merge`, `class-variance-authority`, `clsx`, `@radix-ui/react-slot` from `packages/frontend/package.json` if not already removed in T002; run `pnpm install`
- [X] T049 Migrate `packages/frontend/src/pages/Dashboard.tsx` remaining Tailwind layout classes to Mantine `Container`, `Grid`, `Stack` components
- [X] T050 Migrate `packages/frontend/src/pages/ContractList.tsx` remaining Tailwind layout classes to Mantine layout components
- [X] T051 Migrate `packages/frontend/src/pages/ContractNew.tsx` and `packages/frontend/src/pages/ContractEdit.tsx` remaining Tailwind layout classes to Mantine layout components
- [X] T052 Migrate `packages/frontend/src/pages/ContractImport.tsx` and `packages/frontend/src/components/ImportResultSummary.tsx` remaining Tailwind classes to Mantine components
- [X] T053 Migrate remaining components (`ExportMenu.tsx`, `UpcomingRenewals.tsx`, `ExpiredContracts.tsx`, `ProviderLogo.tsx`, `CategoryIcon.tsx`, `ColumnMappingTable.tsx`) from Tailwind classes to Mantine components; update corresponding unit tests
- [X] T054 Run `pnpm --filter frontend test` — all unit tests must pass
- [ ] T055 Run `pnpm --filter frontend test:e2e` — all Playwright tests must pass
- [X] T056 Run final Tailwind audit: `grep -rn "className=\"" packages/frontend/src/` — verify zero Tailwind utility class strings remain

**Checkpoint**: All tests pass. No Tailwind class names remain. App runs cleanly with only Mantine CSS.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS US1, US2, US3, US4, US11
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (needs sidebar shell)
- **Phase 5 (US3)**: Depends on Phase 3 (settings go in sidebar)
- **Phase 6 (US4)**: Depends on Phase 3 (user area goes in sidebar)
- **Phase 7 (US5)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 8 (US6)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 9 (US7)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 10 (US8)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 11 (US9)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 12 (US10)**: Depends on Phase 1 only — can run in parallel with Phase 3+
- **Phase 13 (US11)**: Depends on Phase 2 (AppShell must exist)
- **Phase 14 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational AppShell)
        ├── Phase 3 (US1: Sidebar Nav) ← MVP
        │     ├── Phase 4 (US2: Admin Segment)
        │     ├── Phase 5 (US3: Settings)
        │     └── Phase 6 (US4: Sign Out)
        └── Phase 13 (US11: Footer)
Phase 1 → Phase 7  (US5: Dashboard Stats)  ← independent
Phase 1 → Phase 8  (US6: Contract Table)   ← independent
Phase 1 → Phase 9  (US7: Anonymization)    ← independent
Phase 1 → Phase 10 (US8: Form Inputs)      ← independent
Phase 1 → Phase 11 (US9: Admin Table)      ← independent
Phase 1 → Phase 12 (US10: Sign-In)         ← independent
```

### Parallel Opportunities Within Each Phase

**Phase 1**: T001–T006 are sequential (each step depends on the previous)

**Phase 2**: T009 (CSS) can run in parallel with T010 (TSX placeholder)

**Phase 5 (US3)**: T020 (ThemeToggle) and T021 (LanguagePicker) can run in parallel

**Phase 7 (US5)**: T026 can run as soon as T025 tests written

**Phase 8 (US6)**: T030 (icon swap) can run in parallel with T029 (Table rewrite)

**Phase 10 (US8)**: T037 (AccountSettings password) and T038 (SignIn password) can run in parallel

**Phase 12 (US10)**: T042 (SignIn) and T043 (AcceptInvitation) can run in parallel

**Phase 14**: T047 (audit), T048 (package removal), T053 (remaining components) can run in parallel

---

## Parallel Example: Phase 1 → independent story phases

```
After Phase 2 completes:

Thread A: Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 13 (US11)
Thread B: Phase 7 (US5) + Phase 8 (US6) + Phase 9 (US7)
Thread C: Phase 10 (US8) + Phase 11 (US9) + Phase 12 (US10)

All threads converge at Phase 14 (Polish)
```

---

## Implementation Strategy

### MVP First (User Stories 1–4 + Foundational)

1. Complete Phase 1: Setup (Mantine installed, Tailwind build removed)
2. Complete Phase 2: Foundational (AppShell shell)
3. Complete Phase 3: US1 (Sidebar with nav links)
4. Complete Phase 4: US2 (Admin segment)
5. Complete Phase 5: US3 (Settings: language + theme)
6. Complete Phase 6: US4 (Sign Out)
7. **STOP and VALIDATE**: Sidebar is fully functional. App is navigable. Theme and language work.
8. Continue with Phases 7–13 in priority order (or in parallel)

### Incremental Delivery

1. Setup + Foundational → AppShell exists (empty sidebar)
2. US1 + US2 + US3 + US4 → Sidebar fully functional (MVP)
3. US5 → Dashboard stats modernised
4. US6 → Contract table modernised
5. US7 → Anonymization controls modernised
6. US8 → Form inputs modernised
7. US9 → Admin table modernised
8. US10 → Sign-in page modernised
9. US11 → Footer added
10. Phase 14 → All Tailwind removed, fully clean

---

## Notes

- [P] tasks = different files, no shared dependencies — safe to run in parallel
- [Story] label maps each task to a specific user story for traceability
- **TDD is non-negotiable**: every test task MUST fail before the paired implementation task is started
- Commit after each logical group (preferably after each story phase checkpoint)
- Stop at each checkpoint to run `pnpm --filter frontend test` before proceeding
- Use `pnpm --filter frontend dev` to visually verify the feature in the browser at each checkpoint
- Tailwind classes may remain in unmigrated components until Phase 14 — this is intentional and temporary
