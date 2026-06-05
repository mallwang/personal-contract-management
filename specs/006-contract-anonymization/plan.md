# Implementation Plan: Contract Anonymization

**Branch**: `006-contract-anonymization` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-contract-anonymization/spec.md`

## Summary

Add privacy protection for the contract dashboard via two complementary mechanisms: a global anonymization toggle (one-click, persisted to `localStorage`) that replaces all contract names with fictional fantasy company names using a flip animation, and a per-contract `anonymize` boolean field (persisted to SQLite) that keeps specific contracts permanently hidden. The feature requires a DB migration, shared type/schema updates, a backend CRUD change, a new frontend hook, a fantasy name data file, a toggle UI component, and updates to the contract table and edit form.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js LTS (ESM)

**Primary Dependencies**: Fastify (backend), React + React Router + i18next (frontend), Zod (validation), better-sqlite3 (database), Vitest (unit/integration tests), Playwright (e2e tests)

**Storage**: SQLite via better-sqlite3; new `anonymize` column added via migration

**Testing**: Vitest for unit and integration tests; Playwright for E2E

**Target Platform**: Browser (Vite SPA) + local Node.js server

**Project Type**: Monorepo web application (pnpm workspaces) — `packages/shared`, `packages/backend`, `packages/frontend`

**Performance Goals**: All contract name flip animations complete within 800ms on a standard laptop

**Constraints**: No new packages unless strictly necessary; global toggle state is client-only (no API round-trip)

**Scale/Scope**: Personal-use, single user, typically < 100 contracts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Assessment | Action |
|-----------|------------|--------|
| **I. Test-First** | All new production code requires failing tests before implementation. New units: `useAnonymization` hook, `AnonymizationToggle` component, `ContractTable` anonymization rendering, `ContractForm` `anonymize` checkbox, backend service mapping, migration. | Tests must be written first. E2E Playwright tests added for both global and per-contract flows. |
| **II. Type Safety** | `anonymize: boolean` must be added to the shared `Contract` interface and `ContractSchema`. Zod schema must validate it. All new code fully typed — no `any`. | Type addition in `packages/shared` propagates to backend and frontend via workspace references. |
| **III. Simplicity (YAGNI)** | No abstraction beyond minimum needed. Fantasy names = a typed `readonly string[]` constant. Global toggle = a single custom hook wrapping `localStorage`. Animation = pure CSS `@keyframes` + a React state boolean per row. No animation library needed. | No additional abstraction layers. |

**Constitution Check Result**: ✅ PASS — no violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/006-contract-anonymization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-delta.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (changes to existing repository)

```text
packages/shared/src/
├── types/contract.ts          # Add anonymize: boolean to Contract interface
└── schemas/contract.ts        # Add anonymize field to ContractSchema, CreateContractBodySchema, UpdateContractBodySchema

packages/backend/src/
├── db/
│   └── schema.sql             # Add anonymize column (migration — see research.md)
└── services/
    └── contract.ts            # Map anonymize in SELECT / INSERT / UPDATE

packages/frontend/src/
├── data/
│   └── fantasyNames.ts        # New — static readonly string[] of fantasy company names
├── hooks/
│   ├── useAnonymization.ts    # New — global toggle state + stable name mapping
│   └── useLocaleFormat.ts     # Unchanged
├── components/
│   ├── AnonymizationToggle.tsx  # New — toggle button for global anonymization
│   ├── ContractTable.tsx        # Updated — accepts isAnonymized + animates name cells
│   └── ContractForm.tsx         # Updated — adds anonymize checkbox field
└── i18n/locales/
    ├── en.json                # Add anonymization-related translation keys
    └── de.json                # German equivalents

packages/frontend/tests/
├── unit/
│   ├── useAnonymization.test.ts      # New
│   ├── AnonymizationToggle.test.tsx  # New
│   └── ContractTable.test.tsx        # Extended — anonymization rendering
└── e2e/
    └── anonymization.spec.ts         # New — global toggle + per-contract E2E
```

**Structure Decision**: Web application layout (Option 2). No new packages needed; the fantasy names file and hook are minimal additions to the existing frontend package.

## Complexity Tracking

> No constitution violations — section intentionally empty.
