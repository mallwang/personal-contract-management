# Data Model: Contract Anonymization

**Feature**: 006-contract-anonymization | **Date**: 2026-06-05

## Entity: Contract (updated)

The existing `Contract` entity gains one new field:

| Field | Type | Storage | Default | Description |
|-------|------|---------|---------|-------------|
| `anonymize` | `boolean` | SQLite `INTEGER NOT NULL DEFAULT 0` | `false` | When `true`, this contract's name is always shown as a fantasy name in the dashboard list, regardless of the global toggle |

All other fields are unchanged. See [spec.md](spec.md) for full entity description.

### Shared Type Change

```ts
// packages/shared/src/types/contract.ts
export interface Contract {
  // ... existing fields ...
  anonymize: boolean;   // NEW
}
```

### Zod Schema Change

```ts
// packages/shared/src/schemas/contract.ts — ContractSchema
anonymize: z.boolean().default(false),   // NEW

// CreateContractBodySchema — optional on create (defaults to false)
anonymize: z.boolean().optional(),

// UpdateContractBodySchema — inherited via .partial()
```

### ContractRow Change (backend internal)

```ts
// packages/backend/src/db/client.ts
export interface ContractRow {
  // ... existing fields ...
  anonymize: number;   // SQLite INTEGER (0 or 1)
}
```

### DB Migration

Applied in `runMigrations` via column-presence guard (see [research.md](research.md)):

```sql
ALTER TABLE contracts ADD COLUMN anonymize INTEGER NOT NULL DEFAULT 0;
```

Also added to `schema.sql` for fresh database creation.

---

## Entity: Anonymization State (client-only)

Not stored in the database. Lives in `localStorage` and React state.

| Key | Storage | Value | Description |
|-----|---------|-------|-------------|
| `pcm-anonymize` | `localStorage` | `"1"` or absent | Global anonymization toggle state |

---

## Entity: Fantasy Name List (static)

A readonly constant bundled in the frontend. Not stored in any database or remote source.

| Property | Value |
|----------|-------|
| Location | `packages/frontend/src/data/fantasyNames.ts` |
| Type | `readonly string[]` |
| Size | ~50 fictional company names |
| Assignment | Deterministic hash of contract `id` modulo list length — see [research.md](research.md) |

### Name Assignment Rules

- Same contract `id` always produces the same fantasy name (stable across toggles and refreshes)
- When list is exhausted (more contracts than names), names cycle (modulo wraps)
- The real contract name is never replaced in edit/detail views — only in the list view

---

## Validation Rules (new)

| Field | Rule |
|-------|------|
| `anonymize` | Must be a boolean. Optional on create (defaults to `false`). No impact on other field validation. |
