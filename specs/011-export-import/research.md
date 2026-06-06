# Research: Contract Export and Import

## Decision 1: Export Location — Client-Side vs Server-Side

**Decision**: Client-side export (browser generates the file)

**Rationale**: Contract data is already fetched and cached by the `useContracts()` React Query
hook on the contracts list page. The browser can generate both `.xlsx` and `.json` files directly
from that in-memory data and trigger a download via `URL.createObjectURL`. No additional network
round-trip is needed, and no new backend code is required.

**Alternatives considered**:
- **Server-side export endpoint** (`GET /api/contracts/export?format=xlsx`): Would require a new
  Fastify route, `xlsx` (or `exceljs`) added to the backend package, and new backend tests.
  Rejected: adds backend complexity with no user-facing benefit at personal-use scale (YAGNI).

---

## Decision 2: Excel Library

**Decision**: `xlsx` (SheetJS community edition, Apache-2.0 license)

**Rationale**: SheetJS is the de facto standard for `.xlsx` I/O in JavaScript. It works in
browsers and Node.js, supports both reading and writing `.xlsx` files, and is available as `xlsx`
on npm with bundled TypeScript types. The community edition is sufficient for this use case.

**Alternatives considered**:
- **`exceljs`** (MIT): Cleaner streaming API but significantly larger bundle size and primarily
  optimised for Node.js server-side use. Rejected: SheetJS has better documented browser support
  and smaller footprint for a client-side use case.
- **CSV download**: Simpler to implement but does not satisfy the `.xlsx` requirement in the spec.

---

## Decision 3: Import Architecture

**Decision**: Client-side file parsing + existing `POST /api/contracts` per row

**Rationale**: The import flow is fully achievable without new backend endpoints:
1. User uploads file → frontend parses it (SheetJS for `.xlsx`, `JSON.parse` for `.json`)
2. Frontend infers column→field mapping via synonym table (client-side)
3. User reviews/corrects mapping in UI
4. Frontend validates each row and calls existing `POST /api/contracts` per valid row
5. Frontend aggregates per-call results into an `ImportResult` summary

This reuses the existing contract creation API and avoids any new backend code.

**Alternatives considered**:
- **Batch POST endpoint** (`POST /api/contracts/bulk`): Would require a new Fastify route, a
  new request schema, and new backend tests. Rejected per YAGNI — sequential API calls to the
  existing endpoint are sufficient for ≤100 rows at personal-use scale.
- **Server-side file upload + processing**: Would require multipart form handling, temporary file
  storage, and server-side parsing. More complex; no user-facing benefit at this scale.

---

## Decision 4: Column Mapping Algorithm

**Decision**: Two-pass synonym table lookup with manual override fallback

**Algorithm**:
1. Normalise source column header: lowercase, trim whitespace, collapse multiple spaces
2. Look up the normalised value in the synonym table (exact match)
3. If matched → assign the target field with confidence = 1.0
4. If unmatched → `targetField = null` ("Unmapped" in UI); user must assign or skip manually

**Synonym table** (normalised source → target field):

| Normalised source variants | Target field |
|---|---|
| `name`, `contract name`, `title`, `label`, `service`, `service name` | `name` |
| `category`, `type`, `kind`, `group` | `category` |
| `amount`, `cost`, `price`, `fee`, `monthly cost`, `payment`, `value`, `charge` | `amount` |
| `billinginterval`, `billing interval`, `billing frequency`, `frequency`, `interval`, `payment cycle`, `period`, `billing period` | `billingInterval` |
| `status`, `state`, `active status`, `contract status` | `status` |
| `startdate`, `start date`, `start`, `begin`, `from`, `from date`, `contract start`, `start on` | `startDate` |
| `enddate`, `end date`, `end`, `until`, `expiry`, `expiration`, `to`, `to date`, `renewal date`, `contract end`, `valid until` | `endDate` |
| `details`, `notes`, `description`, `comments`, `note`, `additional info`, `memo` | `details` |
| `serviceurl`, `service url`, `url`, `website`, `link`, `web address`, `service link`, `homepage` | `serviceUrl` |
| `cancellationperiod.value`, `cancellation period value`, `notice period value`, `cancellation value`, `notice value`, `notice period` | `cancellationPeriod.value` |
| `cancellationperiod.unit`, `cancellation period unit`, `notice period unit`, `cancellation unit`, `notice unit` | `cancellationPeriod.unit` |
| `anonymize`, `anonymous`, `hide`, `private`, `hidden` | `anonymize` |
| `id`, `created at`, `createdat`, `updated at`, `updatedat` | *(system — auto-skip)* |

**Rationale**: A curated synonym table covers the realistic input space for this app's domain
(personal contract management) with zero false-positive risk. Full fuzzy matching (Levenshtein
distance) would require a threshold parameter, produce occasional wrong matches, and is harder
to unit-test exhaustively. Synonym table is deterministic, easier to extend, and straightforward
to test.

**Alternatives considered**:
- **Levenshtein / cosine similarity**: More automatic coverage of typos and unusual phrasing.
  Rejected: unpredictable false positives on short tokens (e.g., "to" matching "type"); harder
  to reason about in tests; not worth the complexity for a bounded, predictable domain.

---

## Decision 5: Flat Excel Structure for `cancellationPeriod`

**Decision**: Two separate columns — `cancellationPeriod.value` (integer) and
`cancellationPeriod.unit` (DAYS / WEEKS / MONTHS / YEARS)

**Rationale**: Excel requires a flat (non-nested) structure. Dot notation aligns with the
camelCase field naming used elsewhere and makes the column pair visually groupable. When both
columns are present in an import file, they are reassembled into a `{ value, unit }` object
before passing to the API. If only one is present or the other is empty, `cancellationPeriod`
is treated as `null`.

---

## Decision 6: Import Route

**Decision**: Dedicated page at `/contracts/import`

**Rationale**: The import flow spans multiple steps (file selection → mapping preview → confirmation
→ result summary) and has enough UI complexity to warrant its own page rather than a modal. A
dedicated route also allows users to navigate directly to it (e.g., from a bookmark or help doc)
and avoids bloating the `ContractList` component.

**Alternatives considered**:
- **Modal on ContractList page**: Simpler routing but the multi-step import UI would require
  complex modal state management. Rejected: a dedicated page is cleaner and easier to test
  end-to-end with Playwright.
