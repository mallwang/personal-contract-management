# Tasks: Multilanguage Support

**Input**: Design documents from `specs/005-multilanguage-support/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/translation-key-schema.md](contracts/translation-key-schema.md) · [quickstart.md](quickstart.md)

**Tests**: Included — project constitution mandates Test-First (TDD). Tests MUST be written and confirmed failing before any implementation task.

**Organization**: Tasks grouped by user story to enable independent, incremental delivery.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no task dependencies between them)
- **[Story]**: Which user story this task belongs to (US1 / US2 / US3)

---

## Phase 1: Setup

**Purpose**: Add dependencies and create the i18n directory structure.

- [ ] T001 Add `i18next` and `react-i18next` to dependencies in `packages/frontend/package.json` and run `pnpm install`
- [ ] T002 Create directory `packages/frontend/src/i18n/locales/` (create the full path including empty `en.json` and `de.json` placeholder files)
- [ ] T003 [P] Create TypeScript i18next resource type declaration in `packages/frontend/src/i18n/types.d.ts` — imports `en.json` and declares `CustomTypeOptions` with `defaultNS: 'translation'` and `resources: { translation: typeof en }` so all `t()` calls are type-checked at compile time

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Translation catalogues, i18next init, and app bootstrap — must be complete before any user story begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Phase 2 (TDD — write first, confirm they FAIL before continuing)

- [ ] T004 Write failing unit test for translation catalogue completeness in `packages/frontend/tests/i18n/catalogue.test.ts` — test imports both `en.json` and `de.json`, asserts every key present in `en.json` also exists in `de.json` and vice versa; use recursive key flattening to catch nested keys; test must fail (de.json is placeholder)

### Implementation for Phase 2

- [ ] T005 [P] Populate `packages/frontend/src/i18n/locales/en.json` with all 72 English translation keys as defined in `contracts/translation-key-schema.md` — organise into namespaces: `nav`, `common`, `status`, `category`, `billingInterval`, `cancellationUnit`, `dashboard`, `contractList`, `contractForm`, `contractNew`, `contractEdit`
- [ ] T006 [P] Populate `packages/frontend/src/i18n/locales/de.json` with all 72 German translations matching the exact same key structure as `en.json`; translate all strings to German; ensure `dashboard.daysRemaining` uses `{{count}} Tage verbleibend`
- [ ] T007 Implement i18next initialisation in `packages/frontend/src/i18n/index.ts` — import `i18next` and `react-i18next`, load both locale JSON files as resources, set `fallbackLng: 'en'`, `defaultNS: 'translation'`, `interpolation: { escapeValue: false }`; do NOT read localStorage yet (that is US2)
- [ ] T008 Import the i18n init module in `packages/frontend/src/main.tsx` as a side-effect import (`import './i18n/index.js'`) placed before the `createRoot` call so i18next is initialised before any component renders; verify `pnpm --filter frontend test` (T004) now passes

**Checkpoint**: `pnpm --filter frontend test` passes for T004. App can render with English strings (browser dev server shows English).

---

## Phase 3: User Story 1 — Switch Language Instantly (Priority: P1) 🎯 MVP

**Goal**: User can switch between English and German at any time and all UI text updates immediately without a page reload, with no loss of form data or navigation state.

**Independent Test**: Open the app, type text in the Add Contract form, switch language — all labels change to the other language instantly, typed text is preserved, no reload occurs.

### Tests for User Story 1 (TDD — write first, confirm they FAIL before continuing)

> **Write these tests FIRST and verify they FAIL before writing any implementation code.**

- [ ] T009 Write failing Playwright e2e test in `packages/frontend/tests/multilanguage.spec.ts` — cover: (a) switch EN→DE: heading text changes without `page.reload()`; (b) form state preserved: fill name field, switch language, assert field still has value; (c) switch DE→EN: text reverts; test must fail because LanguageSwitcher does not exist yet
- [ ] T010 [P] Write failing unit test for LanguageSwitcher component in `packages/frontend/tests/components/LanguageSwitcher.test.tsx` — assert component renders two options (English, Deutsch); assert clicking Deutsch calls `i18next.changeLanguage('de')`; mock i18next; test must fail because component does not exist
- [ ] T011 [P] Write failing unit test for `useLocaleFormat` hook in `packages/frontend/tests/hooks/useLocaleFormat.test.ts` — assert `formatCurrency(1234.56)` returns locale-appropriate string for `'en'` (comma thousands, period decimal) and for `'de'` (period thousands, comma decimal); mock `i18next.language`; test must fail because hook does not exist

### Implementation for User Story 1

- [ ] T012 Implement `useLocaleFormat` hook in `packages/frontend/src/hooks/useLocaleFormat.ts` — use `useTranslation` to get current language, return `{ formatCurrency(n: number): string, formatDate(iso: string): string }` backed by `new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' })` and `new Intl.DateTimeFormat(language)`; verify T011 passes
- [ ] T013 Implement `LanguageSwitcher` component in `packages/frontend/src/components/LanguageSwitcher.tsx` — renders a `<select>` or two `<button>` elements for `en` / `de`; on selection calls `i18next.changeLanguage(code)` (no localStorage yet); TypeScript type for language codes is `'en' | 'de'`; verify T010 passes
- [ ] T014 Implement `Layout` wrapper component in `packages/frontend/src/components/Layout.tsx` — renders `{children}` with `LanguageSwitcher` in a fixed or sticky position visible without scrolling; style to match existing TailwindCSS conventions
- [ ] T015 Wrap all routes with `<Layout>` in `packages/frontend/src/main.tsx` — `<Layout>` wraps the `<Routes>` block inside `<BrowserRouter>`; verify dev server shows the language switcher on every page
- [ ] T016 [P] Update `packages/frontend/src/pages/Dashboard.tsx` — replace all hardcoded strings with `t()` calls using keys from `dashboard.*` and `nav.*` namespaces; import `useTranslation` from `react-i18next`
- [ ] T017 [P] Update `packages/frontend/src/pages/ContractList.tsx` — replace all hardcoded strings with `t()` calls using `contractList.*` and `nav.*` keys
- [ ] T018 [P] Update `packages/frontend/src/pages/ContractNew.tsx` — replace page title and `submitLabel` prop with `t('contractNew.title')` and `t('nav.addContract')`
- [ ] T019 [P] Update `packages/frontend/src/pages/ContractEdit.tsx` — replace all hardcoded strings with `t()` calls using `contractEdit.*` keys; replace loading/error strings with `t('common.loading')` etc.
- [ ] T020 [P] Update `packages/frontend/src/components/ContractForm.tsx` — replace all field labels, placeholders, validation error strings, and button labels with `t()` calls using `contractForm.*` and `common.*` keys; replace `BILLING_INTERVAL_LABELS` select options with `t(\`billingInterval.${value}\`)`, `CATEGORY_LABELS` with `t(\`category.${value}\`)`, `CANCELLATION_PERIOD_UNIT_LABELS` with `t(\`cancellationUnit.${value}\`)`
- [ ] T021 [P] Update `packages/frontend/src/components/ContractTable.tsx` — replace all hardcoded column headers and action labels with `t()` calls using `contractList.*` and `common.*` keys; replace `BILLING_INTERVAL_LABELS[interval]` with `t(\`billingInterval.${interval}\`)`; replace `toLocaleString` for amount with `formatCurrency` from `useLocaleFormat`
- [ ] T022 [P] Update `packages/frontend/src/components/SpendingOverview.tsx` — remove the module-level hardcoded `new Intl.NumberFormat('de-DE', ...)` formatter; use `formatCurrency` from `useLocaleFormat` hook instead; replace hardcoded strings with `t()` calls using `dashboard.*` keys
- [ ] T023 [P] Update `packages/frontend/src/components/CategoryBreakdown.tsx` — remove the module-level hardcoded `new Intl.NumberFormat('de-DE', ...)` formatter; use `formatCurrency` from `useLocaleFormat`; replace hardcoded column headers with `t()` calls using `dashboard.*` keys
- [ ] T024 [P] Update `packages/frontend/src/components/UpcomingRenewals.tsx` — replace `CATEGORY_LABELS[renewal.category]` with `t(\`category.${renewal.category}\`)`; replace `dashboard.daysRemaining` badge text using `t('dashboard.daysRemaining', { count: renewal.daysRemaining })`; replace card title with `t('dashboard.upcomingRenewals')`; replace empty state string

**Checkpoint**: `pnpm --filter frontend test:e2e` passes T009. Manual test: open Add Contract, type a name, switch language — labels change, typed text preserved, no page reload.

---

## Phase 4: User Story 2 — Language Preference Persisted (Priority: P2)

**Goal**: The selected language survives browser close/reopen; first-time users default to English; invalid stored values fall back to English.

**Independent Test**: Select German, close and reopen the browser tab — the app loads in German without any interaction. Delete `pcm-lang` from localStorage and reload — app loads in English.

### Tests for User Story 2 (TDD — write first, confirm they FAIL before continuing)

> **Write these tests FIRST and verify they FAIL before writing any implementation code.**

- [ ] T025 Write failing Playwright test block in `packages/frontend/tests/multilanguage.spec.ts` — add test: switch to German, reload page (`page.reload()`), assert heading is in German; add test: set invalid `localStorage.setItem('pcm-lang', 'xx')`, reload, assert app loads in English; tests must fail because i18next init does not yet read localStorage
- [ ] T026 [P] Write failing unit test in `packages/frontend/tests/components/LanguageSwitcher.test.tsx` — add assertion: after clicking Deutsch, `localStorage.getItem('pcm-lang')` equals `'de'`; test must fail because LanguageSwitcher does not write to localStorage yet

### Implementation for User Story 2

- [ ] T027 Extend `packages/frontend/src/i18n/index.ts` — before calling `i18next.init`, read `localStorage.getItem('pcm-lang')`; validate it is `'en'` or `'de'` (the `Language` closed union); use valid value as `lng` option in i18next config, otherwise omit `lng` so i18next falls back to `'en'`; verify T025 persistence test passes
- [ ] T028 Extend `packages/frontend/src/components/LanguageSwitcher.tsx` — after calling `i18next.changeLanguage(code)`, call `localStorage.setItem('pcm-lang', code)`; verify T026 unit test passes

**Checkpoint**: `pnpm --filter frontend test:e2e` passes T025 blocks. Manual: select German, close tab, reopen — app starts in German. `localStorage` contains `pcm-lang: "de"`.

---

## Phase 5: User Story 3 — Language Selector Always Accessible (Priority: P3)

**Goal**: The language switcher is visible and interactive on every main page of the application.

**Independent Test**: Navigate to Dashboard, Contracts, Add Contract, and Edit Contract — language switcher is visible and functional on each without scrolling.

### Tests for User Story 3 (TDD — write first, confirm they FAIL before continuing)

> **Write these tests FIRST and verify they FAIL before writing any implementation code.**

- [ ] T029 Write failing Playwright test block in `packages/frontend/tests/multilanguage.spec.ts` — for each of the four main routes (`/`, `/contracts`, `/contracts/new`, and a valid `/contracts/:id/edit`), assert the language switcher element is visible (`expect(switcher).toBeVisible()`); if the switcher is already present from Phase 3, tests may pass immediately — confirm and mark complete

### Implementation for User Story 3

- [ ] T030 Audit `packages/frontend/src/components/Layout.tsx` — verify the `LanguageSwitcher` is rendered in a position that is visible without scrolling on all four main routes; if any viewport or z-index issue is found, fix it; run `pnpm --filter frontend test:e2e` to confirm T029 passes

**Checkpoint**: All three user stories are independently functional and verified by the Playwright suite.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks across all stories.

- [ ] T031 [P] Run `pnpm --filter frontend build` and confirm TypeScript strict compilation passes with zero errors — the typed i18n resources (T003) should catch any invalid translation key references
- [ ] T032 [P] Run `pnpm lint` across all modified frontend files and fix any ESLint/Prettier issues
- [ ] T033 Run `pnpm --filter frontend test` (Vitest unit tests) and confirm all pass: catalogue completeness (T004), LanguageSwitcher (T010/T026), useLocaleFormat (T011)
- [ ] T034 Run `pnpm --filter frontend test:e2e` (Playwright) and confirm all 7 quickstart.md scenarios pass end-to-end
- [ ] T035 [P] Manual smoke-test: open app in browser, verify currency formatting uses correct locale conventions in both languages (German: `€1.234,56`; English: `€1,234.56`) on the Dashboard spending card and category breakdown table

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — the MVP increment
- **Phase 4 (US2)**: Depends on Phase 3 (extends LanguageSwitcher and i18n init)
- **Phase 5 (US3)**: Depends on Phase 3 (extends the Playwright suite; Layout already present)
- **Phase 6 (Polish)**: Depends on all story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Extends US1 components (LanguageSwitcher, i18n init) — depends on US1
- **US3 (P3)**: Validates US1 Layout placement — depends on US1 for the Layout component

### Within Each Phase

- All tests marked `[P]` in their test group can be written in parallel (different files)
- All implementation tasks marked `[P]` can be executed in parallel (different files)
- Tests MUST be written and confirmed failing before any implementation task in the same phase
- T012 (useLocaleFormat) and T013 (LanguageSwitcher) can be written in parallel
- T016–T024 can all be executed in parallel after T012–T015 are complete

### Parallel Opportunities

```bash
# Phase 2 — catalogues can be written in parallel:
Task T005: en.json
Task T006: de.json

# Phase 3 — tests can be written in parallel:
Task T009: Playwright e2e test
Task T010: LanguageSwitcher unit test
Task T011: useLocaleFormat unit test

# Phase 3 — components and hooks can be written in parallel (T012, T013):
Task T012: useLocaleFormat hook
Task T013: LanguageSwitcher component

# Phase 3 — page/component updates after T015 all parallel:
Task T016: Dashboard.tsx
Task T017: ContractList.tsx
Task T018: ContractNew.tsx
Task T019: ContractEdit.tsx
Task T020: ContractForm.tsx
Task T021: ContractTable.tsx
Task T022: SpendingOverview.tsx
Task T023: CategoryBreakdown.tsx
Task T024: UpcomingRenewals.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational — translation files + i18next init)
3. Complete Phase 3 (US1 — instant switching, all pages translated, locale formatters)
4. **STOP and VALIDATE**: Run Playwright e2e suite and manual test from quickstart.md
5. Deploy/demo: language switching works instantly on all pages

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (i18next configured, catalogues complete)
2. Phase 3 (US1) → **MVP**: language switching works instantly (no persistence yet)
3. Phase 4 (US2) → Persistence: selected language survives reload
4. Phase 5 (US3) → Verified: switcher confirmed on every route
5. Phase 6 → Polished: clean build, lint, full test suite green

---

## Notes

- `[P]` = different files, no intra-group dependencies — can be parallelised
- `[Story]` label maps each task to a specific user story for traceability
- Constitution Principle I: every test in this list MUST be written and confirmed failing before its implementation tasks
- Commit after each checkpoint or logical group
- Stop at any checkpoint to validate the story independently
- The `en.json` type declaration (T003) will cause TypeScript to error if any `t('bad.key')` call is made — treat these as compile-time contract violations
