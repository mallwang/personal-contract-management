# Research: Contract CRUD

## Decision 1: Client-Side Routing Strategy

**Decision**: Add `react-router-dom` to the frontend package.

**Rationale**: The spec requires navigating between the dashboard and the contract list page. The current `main.tsx` renders a single `<Dashboard />` with no routing infrastructure. React Router is the standard, well-understood routing solution for React applications and is directly required to satisfy the navigation acceptance criteria. Simulating page navigation with a state toggle would produce hard-to-test, bookmark-unfriendly UI — not a simpler outcome, just a different kind of complexity.

**Alternatives considered**:
- State-based page toggle in `App` — rejected: no URL addressability, harder to test with Playwright, harder to navigate back from the contract list.
- TanStack Router — rejected: additional unfamiliar dependency where React Router covers the need exactly.

---

## Decision 2: Form Presentation (Create / Edit)

**Decision**: Dedicated form routes (`/contracts/new`, `/contracts/:id/edit`) rather than a modal overlay.

**Rationale**: With React Router already added, dedicated routes require zero additional dependencies (no dialog library), the form state lives naturally in URL, browser back-button works as expected, and Playwright tests can navigate directly to the form URL. This is the simpler outcome once routing exists.

**Alternatives considered**:
- Radix UI Dialog / AlertDialog — rejected: would require adding `@radix-ui/react-dialog` and `@radix-ui/react-alert-dialog`; two new packages for a personal tool with 2 routes is premature. A page-per-form achieves the same UX with zero extra dependencies.
- Inline form within the list page — rejected: increases component complexity without URL addressability.

---

## Decision 3: Delete Confirmation

**Decision**: Render a small inline confirmation UI (a `window.confirm()` call is the absolute minimum; an inline "Are you sure?" toggle in the table row is the next step up — use the inline toggle for testability).

**Rationale**: The spec requires explicit confirmation before deletion. `window.confirm()` is not testable with Playwright or `@testing-library`, which violates the TDD principle. An inline confirmation state (show Confirm/Cancel buttons in the row after clicking Delete) satisfies the requirement with zero new dependencies and is fully testable.

**Alternatives considered**:
- Radix UI AlertDialog — rejected: same reasoning as Decision 2; adds a package dependency for a single interaction.
- `window.confirm()` — rejected for testability reasons (see rationale).

---

## Decision 4: ID Generation

**Decision**: Generate UUIDs on the backend using `node:crypto` `randomUUID()`, consistent with the existing seed script.

**Rationale**: The schema already uses `TEXT PRIMARY KEY` for IDs. The seed demonstrates `randomUUID()` from the Node.js standard library. No additional package needed; generation on the backend prevents client-supplied IDs from being injected.

---

## Decision 5: Request/Response Validation (Backend)

**Decision**: Use `fastify-type-provider-zod` (already installed) with shared Zod schemas for route input validation and response serialization.

**Rationale**: `fastify-type-provider-zod` is already a declared dependency. Using it ensures request bodies and responses are validated at the HTTP boundary and typed end-to-end from shared schemas. This satisfies both the Type Safety and Simplicity principles.

---

## Decision 6: Shared Schema Location

**Decision**: Add `packages/shared/src/schemas/contract.ts` with Zod schemas for `Contract`, `CreateContractBody`, and `UpdateContractBody`. Export from `packages/shared/src/index.ts`.

**Rationale**: The dashboard feature already uses `@pcm/shared` for Zod schemas consumed by both frontend (runtime parse) and backend (route validation). Following the same pattern avoids duplication and keeps the type contract between backend and frontend in one place, which the constitution's Type Safety principle requires.
