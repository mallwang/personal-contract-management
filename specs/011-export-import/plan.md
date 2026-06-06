# Implementation Plan: Contract Export and Import

**Branch**: `011-export-import` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)

## Summary

Export all contracts to Excel (`.xlsx`) or JSON using exact database field names, and import
contracts from files with flexible column name mapping and a user-facing mapping preview.
Export is handled entirely client-side by transforming the React Query contract cache into a
downloadable file. Import parses the uploaded file in the browser, infers a column-to-field
mapping via a synonym table, shows a confirmation UI, then creates each contract through the
existing `POST /api/contracts` endpoint — no new backend code required.

## Technical Context

**Language/Version**: TypeScript 5.5, strict mode, ESM modules

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3, zod — **no new backend deps**
- Frontend: React 18, React Query 5, Tailwind CSS v4, React Router v7
- New: `xlsx` (SheetJS community edition, Apache-2.0) — added to `@pcm/frontend` only

**Storage**: SQLite via better-sqlite3 — **no schema changes**

**Testing**: Vitest (unit + integration), Playwright (e2e)

**Target Platform**: Web app — pnpm monorepo (`@pcm/backend`, `@pcm/frontend`, `@pcm/shared`)

**Performance Goals**: Export <5 s for 500 contracts; mapping inference <1 s for 100-column file

**Constraints**: File upload capped at 5 MB; import is create-only (no updates to existing rows)

**Scale/Scope**: Personal use — ≤500 contracts; no concurrent multi-user concerns

## Constitution Check

### Principle I — Test-First (NON-NEGOTIABLE)

Failing tests must exist before any implementation code is committed:

- `columnMapping.test.ts`: synonym table lookups and normalization edge cases
- `exportService.test.ts`: flat Excel row construction, JSON serialization, `cancellationPeriod` handling
- `importParsing.test.ts`: raw file parsing, row extraction, warning generation
- `exportImport.spec.ts` (Playwright): full round-trip export→import flow, mapping override, partial import failure

**Gate: PASS** — constitution-required TDD cycle will be enforced per task.

### Principle II — Type Safety (NON-NEGOTIABLE)

All new types (`TargetField`, `ColumnMapping`, `ParsedImportFile`, `ImportResult`) are fully
typed TypeScript interfaces with no implicit `any`. The `xlsx` library ships its own types; no
`@ts-ignore` suppressions are anticipated. Excel cell values from SheetJS are typed as `unknown`
and must be explicitly narrowed to `string` before use.

**Gate: PASS**

### Principle III — Simplicity / YAGNI (NON-NEGOTIABLE)

- No new backend endpoints: export uses the existing `GET /api/contracts` data already in the
  React Query cache; import calls the existing `POST /api/contracts` once per row.
- No shared package changes: all new types are frontend-only transient UI concepts.
- No batch endpoint: sequential API calls are sufficient for ≤100-row personal use files.
- No fuzzy (Levenshtein) matching: a curated synonym table covers the realistic input space
  with zero false-positive risk and is simpler to maintain and test.

**Gate: PASS** — No constitution violations; Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/011-export-import/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Types and representations
├── quickstart.md        # End-to-end validation guide
├── contracts/           # Existing endpoint dependencies (no new endpoints)
└── tasks.md             # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── pages/
│   └── ContractImport.tsx           # Import wizard: upload → mapping → result
├── components/
│   ├── ExportMenu.tsx               # Export dropdown (Excel / JSON)
│   ├── ColumnMappingTable.tsx       # Editable mapping preview table
│   └── ImportResultSummary.tsx      # Post-import success/failure summary
├── services/
│   ├── export.ts                    # Contract data → .xlsx / .json file download
│   └── importParsing.ts             # File → ParsedImportFile + ColumnMapping[]
└── utils/
    └── columnMapping.ts             # Synonym table + mapping algorithm + types

packages/frontend/tests/
├── unit/
│   ├── columnMapping.test.ts
│   ├── exportService.test.ts
│   └── importParsing.test.ts
└── e2e/
    └── exportImport.spec.ts

packages/backend/    # No changes
packages/shared/     # No changes
```

**Structure Decision**: Frontend-only feature following the existing web-app monorepo layout.
All new files live under `packages/frontend/`. No backend or shared package modifications.
