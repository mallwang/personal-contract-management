# Research: Contract Fields Enhancement

## Cancellation Period Storage Strategy

**Decision**: Two flat columns in SQLite (`cancellation_period_value INTEGER`, `cancellation_period_unit TEXT`) assembled into a typed `{ value, unit }` object by `rowToContract`.

**Rationale**: The feature spec marks cancellation period as informational — no queries, filters, or calculations use it. Two flat columns are the simplest normalized approach, avoid JSON parsing, remain queryable if needed later, and follow the existing column-per-attribute convention already used by `billing_interval`.

**Alternatives considered**:
- Single JSON column (`cancellation_period TEXT` storing `'{"value":30,"unit":"MONTHS"}'`): rejected — requires JSON parsing in service layer and can't be constrained by SQL `CHECK`.
- Single formatted string (`"30 DAYS"`): rejected — requires string parsing to reconstruct the typed object.

---

## URL Validation

**Decision**: Use Zod's built-in `z.string().url()` for service URL validation in `CreateContractBodySchema` / `UpdateContractBodySchema`. Frontend mirrors this with the same Zod schema (shared package import) plus a `<input type="url">` HTML hint.

**Rationale**: Zod's `url()` validator checks for absolute, well-formed URLs (scheme + host required). Already used in the project for other string validations. No new dependency.

**Alternatives considered**:
- Custom regex: rejected — Zod's validator is well-tested and covers edge cases; no reason to reimplement.
- Browser `URL` constructor: rejected — would require additional service-layer code; Zod on the schema boundary is the project's existing pattern.

---

## Character Limit Enforcement (Details Field)

**Decision**: Enforce the 2,000-character limit at three layers: SQL `CHECK` constraint, Zod schema (`z.string().max(2000)`), and frontend live character counter.

**Rationale**: Defence-in-depth — DB constraint prevents corrupt writes from outside the app; Zod validation produces a user-readable error from the API; frontend counter gives immediate feedback without a round-trip.

**Alternatives considered**:
- DB constraint only: rejected — fails silently in the UI without the Zod layer.
- Frontend only: rejected — doesn't protect the API from direct calls.

---

## Migration Approach

**Decision**: Detect missing columns via `PRAGMA table_info(contracts)` checking for `start_date`. If absent, run five `ALTER TABLE ADD COLUMN` statements (all nullable, no DEFAULT enforcement beyond `NULL`).

**Rationale**: Matches the pattern already established in `runMigrations` for the `billing_interval` migration. SQLite supports `ALTER TABLE ADD COLUMN` for nullable columns without table rewrites. Checking a single sentinel column (`start_date`) suffices — the five columns are always added together.

**Alternatives considered**:
- Full versioned migration system (e.g., numbered migration files): rejected — constitution Principle III prohibits abstractions not yet needed; the current single-function migration has worked well.
- Separate migration function per column: rejected — unnecessarily verbose; all four fields are part of one atomic feature.

---

## "Contract Detail View" Interpretation

**Decision**: Use the existing `ContractEdit` page as the display surface for new fields. No new read-only detail page is introduced.

**Rationale**: The project currently has no dedicated read-only detail route (`/contracts/:id`). Adding one would be scope beyond what the feature spec justifies. All four new fields are visible and accessible through the edit form, which already acts as the "detail view" in the current UX. The spec's FR-007 (clickable service URL) is satisfied by rendering the URL as a link adjacent to the URL input when a valid value is present. YAGNI (Constitution Principle III).

**Alternatives considered**:
- New read-only `/contracts/:id` route: rejected — doubles the surface area, adds a new page component, and is not required to meet any acceptance scenario.
