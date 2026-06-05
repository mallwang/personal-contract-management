# Implementation Plan: Multilanguage Support

**Branch**: `005-multilanguage-support` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-multilanguage-support/spec.md`

## Summary

Add English/German multilanguage support to the React frontend using `react-i18next`. Language switching is instant (no page reload, no form-state loss), with locale-aware number/currency formatting via native `Intl` APIs. The selected language is persisted in `localStorage`. A shared `Layout` component hosts the `LanguageSwitcher` control, making it accessible from every page. No backend changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS (ESM, `strict: true`)

**Primary Dependencies**:
- Existing: React 18, Vite 8, `react-router-dom` v7, `@tanstack/react-query` v5, TailwindCSS 4
- New: `i18next`, `react-i18next`

**Storage**: `localStorage` key `pcm-lang` (frontend only; no database changes)

**Testing**: Vitest (unit + component with `@testing-library/react`), Playwright (e2e)

**Target Platform**: Browser (modern, evergreen)

**Project Type**: Web application (frontend-only change)

**Performance Goals**: Language switch takes effect in under 200 ms (SC-001 from spec)

**Constraints**:
- No page reload on language switch (FR-003)
- No loss of form state on switch (FR-004)
- 100% of static UI strings translated — zero raw key strings visible (SC-002)

**Scale/Scope**: 2 languages (en, de); ~72 translation keys; 10 frontend files modified; 6 new files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

**Status: COMPLIANT (with required task ordering)**

Tests must be written before implementation code for every unit of work. The task breakdown (tasks.md) will enforce:

1. Write failing test for translation catalogue completeness before creating locale JSON files
2. Write failing component tests for `LanguageSwitcher` before implementing it
3. Write failing tests for `useLocaleFormat` hook before implementing it
4. Write failing Playwright e2e test for instant switching and persistence before updating any page

### Principle II — Type Safety (NON-NEGOTIABLE)

**Status: COMPLIANT**

- i18next TypeScript resource declaration (`types.d.ts`) makes translation key usage type-checked at compile time
- `Language` type defined as `'en' | 'de'` closed union
- `useLocaleFormat` returns typed formatter functions
- All new components and hooks are fully typed; no `any`

### Principle III — Simplicity / YAGNI

**Status: COMPLIANT**

- Only 2 languages added — no abstract "language registry" or plugin system
- `react-i18next` is chosen over a custom Context solution because it handles interpolation, plural rules, and resource loading with less total code than a bespoke implementation (see [research.md](research.md))
- No over-engineering: no lazy-loading of locale bundles (bundles are tiny, ~3 KB each), no ICU message format, no additional language-detection plugin
- `localStorage` persistence is handled manually in two lines rather than adding `i18next-browser-languagedetector`

## Project Structure

### Documentation (this feature)

```text
specs/005-multilanguage-support/
├── plan.md                              # This file
├── spec.md                              # Feature specification
├── research.md                          # Phase 0: library and approach decisions
├── data-model.md                        # Phase 1: entities and file inventory
├── quickstart.md                        # Phase 1: validation guide
├── contracts/
│   └── translation-key-schema.md        # Phase 1: canonical 72-key catalogue
└── tasks.md                             # Phase 2 output (created by /speckit-tasks)
```

### Source Code (frontend only)

```text
packages/frontend/
├── package.json                         # Add i18next, react-i18next dependencies
└── src/
    ├── i18n/
    │   ├── index.ts                     # NEW: i18next init (loads locales, sets fallback, reads localStorage)
    │   ├── types.d.ts                   # NEW: TypeScript key-type declaration
    │   └── locales/
    │       ├── en.json                  # NEW: 72-key English catalogue
    │       └── de.json                  # NEW: 72-key German catalogue
    ├── hooks/
    │   └── useLocaleFormat.ts           # NEW: Intl.NumberFormat + Intl.DateTimeFormat bound to active locale
    ├── components/
    │   ├── Layout.tsx                   # NEW: shared wrapper; renders LanguageSwitcher
    │   ├── LanguageSwitcher.tsx         # NEW: EN / DE toggle; calls i18next.changeLanguage + localStorage
    │   ├── ContractForm.tsx             # MODIFIED: t() for all labels, placeholders, errors
    │   ├── ContractTable.tsx            # MODIFIED: t() for headers/actions; useLocaleFormat for amounts
    │   ├── SpendingOverview.tsx         # MODIFIED: useLocaleFormat replaces hardcoded 'de-DE'
    │   ├── CategoryBreakdown.tsx        # MODIFIED: useLocaleFormat replaces hardcoded 'de-DE'
    │   └── UpcomingRenewals.tsx         # MODIFIED: t() for labels; t('category.X') replaces CATEGORY_LABELS
    ├── pages/
    │   ├── Dashboard.tsx                # MODIFIED: t() for all strings
    │   ├── ContractList.tsx             # MODIFIED: t() for all strings
    │   ├── ContractNew.tsx              # MODIFIED: t() for title and submitLabel
    │   └── ContractEdit.tsx             # MODIFIED: t() for all strings
    └── main.tsx                         # MODIFIED: wrap route tree with <Layout>

tests/ (Vitest unit)
    ├── i18n/
    │   └── catalogue.test.ts            # NEW: completeness — all 72 keys present in both locales
    ├── components/
    │   ├── LanguageSwitcher.test.tsx    # NEW: renders options; switching calls changeLanguage + localStorage
    │   └── Layout.test.tsx             # NEW: renders children + switcher
    └── hooks/
        └── useLocaleFormat.test.ts      # NEW: locale-specific number formatting assertions

tests/ (Playwright e2e)
    └── multilanguage.spec.ts            # NEW: instant switch, state preservation, persistence
```

**No backend files modified. No database migrations required.**

## Complexity Tracking

No Constitution Check violations. No entry required.
