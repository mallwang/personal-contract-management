# Research: Cancellation-Aware Renewals Panel

**Branch**: `010-cancellation-aware-renewals` | **Date**: 2026-06-06

## Decision: Application-Layer Date Arithmetic vs SQL Date Math

**Decision**: Calculate cancellation deadlines in TypeScript application code, not in SQL.

**Rationale**:
- SQLite's `DATE(end_date, '-3 months')` works for months/years but would require dynamic
  per-row expressions built with CASE statements and the contract's unit, making the SQL
  complex and hard to test in isolation.
- JavaScript's `Date.prototype.setMonth(n - value)` and `setFullYear(n - value)` correctly
  handle calendar edge cases (e.g., March 31 − 1 month = February 28/29).
- Calculating in TypeScript allows the deadline logic to be tested as a pure function
  in fast Vitest unit tests without a database.

**Alternatives considered**:
- **SQL CASE expression**: Rejected — complex dynamic string, hard to test, couples the
  calculation to the DB layer.
- **Computed column or view**: Rejected — SQLite computed columns don't support per-row
  dynamic arithmetic across different units; over-engineered for this scope.

---

## Decision: YEARS Unit — Enum Extension vs No Change

**Decision**: Add `YEARS` to the `CancellationPeriodUnit` enum and update the DB CHECK
constraint via a table-rebuild migration.

**Rationale**: The user explicitly requires year-based cancellation periods (e.g., "1 year
notice required"). The existing enum (DAYS, WEEKS, MONTHS) does not cover this. Year-based
arithmetic is straightforward with JavaScript's `Date.prototype.setFullYear`.

**Migration strategy**: Detect whether the existing `contracts` table's `CREATE TABLE`
statement in `sqlite_master` already includes `'YEARS'` in the constraint. If not, rebuild
the table with the updated constraint. This is the standard SQLite approach to modifying a
CHECK constraint, and data is preserved via `INSERT INTO new_table SELECT * FROM old_table`.

**Alternatives considered**:
- **Drop the CHECK constraint entirely**: Rejected — application-layer Zod validation
  already guards inserts, but keeping the DB constraint adds a safety net.
- **Introduce a new column**: Rejected — unnecessary complexity; the existing pair
  `(cancellation_period_value, cancellation_period_unit)` already models the domain.

---

## Decision: API Shape — Replace `daysRemaining` with `daysUntilCancellationDeadline`

**Decision**: Replace the `daysRemaining` field (days until `endDate`) with
`daysUntilCancellationDeadline` (days until `cancellationDeadline`; negative = overdue).
Add `cancellationDeadline` as an explicit date string. The `endDate` field is retained.

**Rationale**:
- `daysRemaining` counted days until the contract *ended*, which is not the actionable
  deadline for the user. The actionable deadline is when they must cancel.
- Allowing negative values (overdue) in a single field makes sorting straightforward
  (`ORDER BY daysUntilCancellationDeadline ASC` naturally surfaces the most urgent first)
  and avoids a separate boolean `isOverdue` field.
- The only consumer is the React `UpcomingRenewals` component within the same monorepo;
  the breaking change is contained and safe.

**Alternatives considered**:
- **Keep `daysRemaining`, add new fields alongside**: Rejected — confusing to have two
  "days" fields; violates the "minimum required" principle.
- **Separate `isOverdue` boolean + positive `daysCount`**: Rejected — two fields for one
  concept; the signed integer models the same information more cleanly.

---

## Decision: Filtering Window — Fetch-All + Application Filter vs SQL Pre-filter

**Decision**: Fetch all non-expired, non-LIFETIME contracts from the DB with their
cancellation period data, then apply the panel entry date filter in TypeScript.

**Rationale**:
- Because panel entry dates depend on per-contract cancellation period arithmetic, a
  SQL-only filter would require the same CASE expression complexity already rejected above.
- The total number of contracts for a personal-use tool is small (dozens to hundreds);
  fetching all non-expired contracts is not a performance concern.
- This approach keeps the SQL simple and the filtering logic testable as pure functions.

**Alternatives considered**:
- **Complex SQL pre-filter**: Rejected — same complexity reasons as date arithmetic above.
- **Stored computed column**: Rejected — not practical in SQLite without generated column
  support and adds schema complexity.

---

## Decision: Sorting Order

**Decision**: Sort upcoming renewals by `daysUntilCancellationDeadline` ascending
(smallest / most negative first), with alphabetical contract name as tiebreaker.

**Rationale**: Overdue contracts (negative values) sort above urgent-but-not-yet-overdue
contracts, which sort above contracts with more time remaining. This directly matches the
spec requirement: "most urgent first."

**Alternatives considered**:
- **Sort by `cancellationDeadline` date string ASC**: Equivalent result, but using the
  computed integer keeps the sort deterministic without date string comparison.
