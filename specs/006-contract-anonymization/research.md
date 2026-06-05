# Research: Contract Anonymization

**Feature**: 006-contract-anonymization | **Date**: 2026-06-05

## Decision 1: Database Migration Strategy

**Decision**: Add `anonymize INTEGER NOT NULL DEFAULT 0` to `contracts` table via the existing `runMigrations` pattern in `packages/backend/src/db/client.ts`.

**Rationale**: The project uses `PRAGMA table_info(contracts)` column-presence checks (not a versioned migration table) for additive migrations. The pattern is already used twice — for `amount`/`billing_interval` and for `start_date`/`details`/`service_url`/`cancellation_period_*`. Following the same pattern keeps the migration system consistent with zero new infrastructure.

**Implementation**: Add a third guard block in `runMigrations`:
```ts
const hasAnonymize = instance
  .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
  .all()
  .some((col) => col.name === 'anonymize');
if (!hasAnonymize) {
  instance.exec(`ALTER TABLE contracts ADD COLUMN anonymize INTEGER NOT NULL DEFAULT 0`);
}
```
Also add `anonymize INTEGER NOT NULL DEFAULT 0` to `schema.sql` so fresh databases include it.

**Alternatives considered**: A versioned migration table (e.g., `schema_migrations`) — rejected as YAGNI; the existing pattern is sufficient for a personal-use app.

---

## Decision 2: Fantasy Name Assignment Algorithm

**Decision**: Deterministic character-code hash of the contract `id` (UUID string) modulo the fantasy name list length.

**Rationale**: The assignment must be stable across toggle cycles, page refreshes, and server restarts, without storing an assignment in the database (YAGNI). A hash of the immutable `id` field guarantees stability. The hash function is intentionally simple — sum of char codes — since collision distribution quality is irrelevant at < 100 contracts.

```ts
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h += id.charCodeAt(i);
  return h;
}
export function getFantasyName(id: string, names: readonly string[]): string {
  return names[hashId(id) % names.length];
}
```

**Alternatives considered**:
- Sequential index by display order — rejected because order changes when contracts are added/deleted, breaking stability.
- Store assignment in DB — rejected as over-engineered (YAGNI) for a display-only concern.
- Random assignment stored in `localStorage` — rejected because it breaks on data cleared or different browsers.

---

## Decision 3: Flip Animation Approach

**Decision**: Per-row React state (`isFlipping: boolean`) + CSS `@keyframes` that animate `scaleX` from 1 → 0 → 1 (horizontal flip illusion). Text swap happens at the midpoint via a `setTimeout` for half the animation duration.

**Rationale**: Pure CSS + React state — no animation library needed (YAGNI). The `scaleX` approach is simpler and more reliable cross-browser than `rotateY` (which requires `perspective` on a parent). Total duration: 400ms (200ms to collapse + 200ms to expand).

**Mechanic**:
1. Parent passes `isAnonymized` to `ContractTable`.
2. `ContractTable` watches `isAnonymized` via `useEffect` — on change, sets `isFlipping = true` for all rows simultaneously.
3. CSS class `name-flipping` applies `animation: nameFlip 400ms ease-in-out`.
4. `@keyframes nameFlip` goes `scaleX(1) → scaleX(0) → scaleX(1)`.
5. After 200ms (midpoint), displayed text swaps via `setTimeout`.
6. After 400ms, `isFlipping = false` (animation class removed).
7. On page load with anonymization already active: no animation, text renders directly as fantasy name.

**Alternatives considered**:
- CSS `rotateY` card flip — requires `perspective` on a parent element, more complex markup.
- Framer Motion / React Spring — rejected (YAGNI, adds a new dependency).
- CSS `opacity` fade only — less visually interesting; user specifically requested a flip.

---

## Decision 4: Global Toggle State Storage

**Decision**: `localStorage` key `pcm-anonymize` (value `"1"` when active, removed/absent when inactive).

**Rationale**: Mirrors the existing `pcm-lang` pattern used for language persistence in `packages/frontend/src/i18n/index.ts`. No server state needed; anonymization is a pure view concern.

**Alternatives considered**: `sessionStorage` — rejected because the spec requires persistence across page refreshes within the same session. `localStorage` provides cross-session persistence, which is actually better than sessionStorage for this use case.

---

## Decision 5: Per-Contract Anonymize Field in Shared Types

**Decision**: Add `anonymize: boolean` to `Contract` interface in `packages/shared/src/types/contract.ts` and `z.boolean().default(false)` to `ContractSchema` in `packages/shared/src/schemas/contract.ts`. Include it optionally in `CreateContractBodySchema` and `UpdateContractBodySchema`.

**Rationale**: The shared package is the single source of truth for API contract types. Adding it here propagates correctly to both the backend `ContractRow` mapping and the frontend form.

**Alternatives considered**: Frontend-only flag without backend persistence — rejected because per-contract anonymization must survive page refreshes and session restarts (FR-012 in spec).

---

## Decision 6: `ContractRow` Interface Update

**Decision**: Add `anonymize: number` (SQLite stores booleans as integers) to `ContractRow` in `packages/backend/src/db/client.ts`. Map `row.anonymize !== 0` to `boolean` in `rowToContract`.

**Rationale**: Consistent with how SQLite INTEGER maps to TypeScript boolean throughout the codebase pattern.
