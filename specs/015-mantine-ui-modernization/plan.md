# Implementation Plan: Mantine UI Modernization

**Branch**: `015-mantine-ui-modernization` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-mantine-ui-modernization/spec.md`

## Summary

Replace all Tailwind CSS styling with Mantine UI components and CSS modules. The key structural change is introducing a Mantine AppShell with a segmented sidebar (NavbarSegmented pattern) that consolidates navigation, user identity, and settings (language picker + dark/light theme toggle). All major pages and components are migrated to the corresponding Mantine community component patterns specified in the spec. The sign-in page adopts the AuthenticationTitle pattern. No backend changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), React 18.3, Node.js LTS

**Primary Dependencies**:
- *Adding*: `@mantine/core` ^7.x, `@mantine/hooks` ^7.x, `postcss`, `postcss-preset-mantine`, `@tabler/icons-react`
- *Removing*: `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `class-variance-authority`, `clsx`, `@radix-ui/react-slot`
- *Keeping*: `@tanstack/react-query`, `react-router-dom`, `react-i18next`, `i18next`, `xlsx`, `lucide-react`

**Storage**: Browser `localStorage` for theme preference (via Mantine's `localStorageColorSchemeManager`) and language preference (existing `pcm-lang` key). No backend storage changes.

**Testing**: Vitest (unit, `@testing-library/react`), Playwright (e2e)

**Target Platform**: Modern desktop browser; responsive sidebar collapse for narrow viewports

**Project Type**: Web application (Vite + React SPA, pnpm monorepo)

**Performance Goals**: Standard web app expectations; no regressions in page load or interaction latency

**Constraints**: 
- All existing routes unchanged
- Backend API untouched
- Existing i18n keys reused (one new key for theme toggle label)
- No Tailwind class names in any frontend source file after migration

**Scale/Scope**: Frontend-only migration; ~20 component/page files, ~15 unit tests to update, ~0 new backend code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First (NON-NEGOTIABLE)

**Status**: COMPLIANT — with attention required

The migration replaces visual styling; existing unit tests cover component behaviour. Migrated components MUST retain their existing test coverage. For each new or significantly restructured component (AppShell/sidebar, ThemeToggle, etc.), failing tests MUST be written and confirmed to fail before the implementation changes are made.

Specific gates:
- `AppShell` / sidebar component: tests written first (nav links, active state, admin segment visibility, sign-out)
- `ThemeToggle`: test written first (toggle stores/restores preference, switches colour scheme)
- Any component with changed props or behaviour: corresponding test updated/written first

### II. Type Safety (NON-NEGOTIABLE)

**Status**: COMPLIANT

`tsconfig.json` already uses `strict: true`. All new Mantine component wrappers and CSS module imports MUST be fully typed. CSS module imports use `*.module.css` with TypeScript inference (Vite handles this natively).

### III. Simplicity (YAGNI)

**Status**: COMPLIANT

The migration installs only the packages required by the feature. `@mantine/form` is NOT added — the existing uncontrolled form pattern is preserved; form inputs are styled with Mantine components but do not adopt a new form library. No additional abstractions are introduced beyond what the Mantine community patterns provide.

## Project Structure

### Documentation (this feature)

```text
specs/015-mantine-ui-modernization/
├── plan.md              # This file
├── research.md          # Phase 0: Mantine setup, theming, patterns
├── data-model.md        # Phase 1: client-side state entities
├── quickstart.md        # Phase 1: validation guide
├── contracts/           # Phase 1: key component prop contracts
│   ├── AppShell.md
│   ├── ThemeToggle.md
│   └── LanguagePicker.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   ├── AppShell/           # New: Mantine AppShell + sidebar
│   │   │   ├── AppShell.tsx
│   │   │   ├── AppShell.module.css
│   │   │   ├── AppShell.test.tsx
│   │   │   ├── NavbarSegmented.tsx
│   │   │   ├── NavbarSegmented.module.css
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── ThemeToggle.test.tsx
│   │   │   └── LanguagePicker.tsx  # replaces LanguageSwitcher.tsx
│   │   ├── ContractTable.tsx       # migrated to Mantine Table
│   │   ├── ContractTable.module.css
│   │   ├── ContractForm.tsx        # migrated to Mantine inputs
│   │   ├── AnonymizationToggle.tsx # migrated to Mantine Switch
│   │   ├── SpendingOverview.tsx    # migrated to StatsSegments
│   │   └── [other components migrated in-place]
│   ├── pages/
│   │   ├── SignIn.tsx              # migrated to AuthenticationTitle
│   │   ├── Dashboard.tsx           # migrated to Mantine layout
│   │   ├── ContractList.tsx        # migrated
│   │   ├── AccountSettings.tsx     # migrated, adds SwitchesCard
│   │   └── admin/
│   │       └── AccountsAdmin.tsx   # migrated to UsersTable
│   ├── main.tsx                    # adds MantineProvider + ColorSchemeScript
│   └── index.css                   # replaces Tailwind import with Mantine styles
├── postcss.config.cjs              # New: postcss-preset-mantine config
└── vite.config.ts                  # remove tailwindcss plugin
```

**Structure Decision**: Frontend-only migration. Single `packages/frontend` package; no new packages created. New components live under `src/components/AppShell/` as a logical grouping; all other migrations are in-place within existing file paths.

## Complexity Tracking

No constitution violations. The feature does not add new abstractions beyond the Mantine community patterns; it removes the Tailwind/shadcn layer and replaces it with Mantine's built-in primitives.
