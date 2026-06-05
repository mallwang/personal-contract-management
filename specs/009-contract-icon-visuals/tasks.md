# Tasks: Contract Icon Visuals

**Input**: Design documents from `specs/009-contract-icon-visuals/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**TDD**: Tests are **mandatory** per the project constitution (Principle I — NON-NEGOTIABLE). Every test task MUST be written and confirmed failing before its paired implementation task begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Tests are always written FIRST, confirmed failing, then implementation follows

---

## Phase 1: Setup

**Purpose**: Configure the logo.dev API token so it's available to the frontend at build time.

- [X] T001 Create `packages/frontend/.env` with `VITE_LOGO_DEV_TOKEN=pk_dTJBcEKxQgCQUZhio2o9Vw`
- [X] T002 [P] Create `packages/frontend/.env.example` with `VITE_LOGO_DEV_TOKEN=your_logo_dev_public_token_here` for documentation

**Checkpoint**: `.env` in place; `.env.example` tracked in git

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared infrastructure changes are required for this feature — it is a pure frontend visual enhancement. Phase 2 is skipped.

**Proceed directly to Phase 3.**

---

## Phase 3: User Story 1 — Category Icons in All Contract Views (Priority: P1) 🎯 MVP

**Goal**: Every contract row in the list and every contract detail view shows a distinct, recognisable Lucide icon matching its category. A fallback icon is shown for any unmapped category.

**Independent Test**: Navigate to `/contracts` with contracts of each category present — each row should show a visually distinct icon without any additional user action.

### Tests for User Story 1 ⚠️ TDD — Write and confirm FAILING before T004

- [X] T003 [US1] Write failing unit tests for `CategoryIcon` in `packages/frontend/src/components/CategoryIcon.test.tsx`:
  - renders `Zap` for UTILITIES
  - renders `Play` for SUBSCRIPTIONS
  - renders `Shield` for INSURANCE
  - renders `Home` for HOUSING
  - renders `FileText` for OTHER
  - renders `FileText` fallback for an unknown/future category value
  - applies `className` prop to the rendered icon
  - Confirm all tests FAIL (component does not exist yet) before proceeding to T004

### Implementation for User Story 1

- [X] T004 [US1] Implement `CategoryIcon` component in `packages/frontend/src/components/CategoryIcon.tsx` (depends on T003 failing)
  - Export `CATEGORY_ICON_MAP: Record<Category | 'DEFAULT', LucideIcon>`
  - Map UTILITIES→Zap, SUBSCRIPTIONS→Play, INSURANCE→Shield, HOUSING→Home, OTHER→FileText, DEFAULT→FileText
  - Accept `{ category: Category; className?: string }` props (fully typed, no implicit `any`)
  - Render the mapped icon, falling back to DEFAULT for unknown values
- [X] T005 [US1] Update category cell in `packages/frontend/src/components/ContractTable.tsx` to render `<CategoryIcon>` alongside the category label text (wrap cell content in a flex span with gap)

**Checkpoint**: `pnpm --filter frontend test` — all T003 tests pass. Navigate to `/contracts` to see category icons in every row.

---

## Phase 4: User Story 2 — Provider Logo Display (Priority: P2) + User Story 3 — Graceful Fallback (P1 within US2)

**Goal**: Every contract whose name can be resolved to a company shows its logo from logo.dev. Contracts that cannot be resolved, are anonymized, or are loading in an offline environment show a clean `Building2` fallback icon immediately. The form shows a live logo preview inline with the Name field label.

**Independent Test**: Open a contract named "Netflix" — it should display the Netflix logo. Open a contract named "LocalGym123" — it should display the `Building2` fallback without any broken-image indicator.

### Tests for User Story 2+3 ⚠️ TDD — Write and confirm FAILING before T008

- [X] T006 [US2] Write failing unit tests for `ProviderLogo` in `packages/frontend/src/components/ProviderLogo.test.tsx`:
  - `logoUrl("Netflix", false)` returns the correct `https://img.logo.dev/name/Netflix?token=...` URL
  - `logoUrl("", false)` returns `null`
  - `logoUrl("Netflix", true)` returns `null` (anonymization guard)
  - Component renders `<img>` with correct `src` when name is non-empty and not anonymized
  - Component renders `Building2` fallback icon when name is empty
  - Component renders `Building2` fallback icon when `isAnonymized` is `true`
  - Component renders `Building2` fallback icon after `img` `onError` fires (simulate via `fireEvent.error`)
  - Component renders `Building2` fallback when `isAnonymized` flips to `true` mid-render
  - Confirm all tests FAIL (component does not exist yet) before proceeding to T008

### Implementation for User Story 2+3

- [X] T007 [US2] Create `packages/frontend/src/components/ProviderLogo.tsx`:
  - Export pure `logoUrl(name: string, isAnonymized: boolean): string | null`
    - Returns `null` if `isAnonymized` or `name` is empty
    - Returns `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${import.meta.env.VITE_LOGO_DEV_TOKEN}`
  - Accept `{ name: string; isAnonymized?: boolean; size?: number; className?: string }` props (fully typed)
  - If `logoUrl` returns `null` → render `<Building2>` from lucide-react
  - Otherwise → render `<img src={logoUrl} alt="" onError={…} />` in a fixed-size container matching `size` prop
  - On `onError` → switch state to render `<Building2>` fallback (no layout shift; container size stays constant)
- [X] T008 [US2] Update name cell in `packages/frontend/src/components/ContractTable.tsx` to render `<ProviderLogo>` before the contract name text (depends on T005 being complete — same file)
  - Pass `name={contract.name}` and `isAnonymized={displayAnonymized || contract.anonymize}`
  - Wrap name cell content in a `flex items-center gap-2` span
- [X] T009 [US2] Update name field section in `packages/frontend/src/components/ContractForm.tsx` to render an inline `<ProviderLogo>` preview next to the Name field label
  - Show only when `values.name` is non-empty
  - Pass `name={values.name}` (no anonymization guard needed in the form — user is editing their own data)

**Checkpoint**: `pnpm --filter frontend test` — all T006 tests pass. Navigate to `/contracts`: known providers show logos, unknown providers show `Building2`. Edit a contract and watch the logo appear as you type the name.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and final cleanup.

- [X] T010 [P] Run full frontend test suite and confirm all tests green: `pnpm --filter frontend test`
- [X] T011 [P] Run E2E tests: `pnpm --filter frontend test:e2e` (5 pre-existing failures unrelated to this feature; 28 passed)
- [ ] T012 Run through all 6 validation scenarios in `specs/009-contract-icon-visuals/quickstart.md` manually and confirm expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001 and T002 are parallel
- **Phase 2**: Skipped
- **US1 (Phase 3)**: Depends on Phase 1 completion
  - T003 → T004 → T005 (strictly sequential: test first, implement, then integrate)
- **US2+US3 (Phase 4)**: Depends on Phase 3 completion (T005 must finish before T008 — same file)
  - T006 → T007 → T008 → T009 (strictly sequential within phase)
- **Polish (Phase 5)**: Depends on Phase 4 completion; T010 and T011 are parallel

### Within Each User Story

- Test task MUST be written first and confirmed failing
- Implementation follows test
- Integration into existing components follows implementation

### Parallel Opportunities

- T001 and T002 (Setup): parallel — different files
- T010 and T011 (Polish): parallel — different test runners
- T003 and T006: **NOT parallel** — T006 depends on T003+T004+T005 being complete first (ContractTable is modified in T005 and T008, requiring sequential access)

---

## Parallel Example: User Story 1

```bash
# US1 must run strictly sequentially per TDD:
T003 → confirm tests fail → T004 → T005
```

## Parallel Example: User Story 2+3

```bash
# US2+US3 must run strictly sequentially per TDD:
T006 → confirm tests fail → T007 → T008 → T009
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 3: US1 category icons (T003–T005)
3. **STOP and VALIDATE**: Every contract row shows a category icon
4. Ship if category icons alone are sufficient

### Incremental Delivery

1. Setup → US1 category icons → validate → ship (MVP)
2. US2+US3 provider logos + fallback → validate → ship
3. Polish → final sign-off

---

## Notes

- [P] tasks operate on different files with no dependencies
- TDD is NON-NEGOTIABLE per the project constitution — never skip the "confirm tests fail" step
- ContractTable.tsx is modified in both T005 (US1) and T008 (US2) — these MUST be sequential
- logo.dev handles unknown-company names natively; `onError` is only for network failure
- Anonymization guard: `ProviderLogo` must NEVER call logo.dev when `isAnonymized` is true
