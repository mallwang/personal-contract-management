# Research: Expired Contracts Dashboard Panel

## Summary

All unknowns resolved from existing codebase analysis. No external research required — the feature is a pure extension of the established dashboard pattern.

---

## Decision 1: Expired Contract Data Shape

**Decision**: `ExpiredContract` carries `id`, `name`, `category`, `endDate`, and `daysOverdue` (positive integer).

**Rationale**: Mirrors `UpcomingRenewal` for consistency (`daysRemaining` → `daysOverdue`). The `daysOverdue` field avoids date arithmetic in the frontend, keeps the component stateless, and allows tests to assert exact values.

**Alternatives considered**:
- Omit `daysOverdue`, compute in the frontend — rejected: forces the frontend to know "today's date" which complicates unit testing.
- Add a `status` copy — rejected: YAGNI; the panel is for expired contracts only so status is always implied.

---

## Decision 2: SQL Filter for "Expired"

**Decision**: `end_date IS NOT NULL AND billing_interval != 'LIFETIME' AND end_date < DATE('now')` ordered `DESC` (most-recently-expired first).

**Rationale**: Matches the inverse of the upcoming-renewals query already in `DashboardService.getUpcomingRenewals()`. Excludes LIFETIME contracts (same logic as renewals). Descending order means the most actionable (recently expired) contracts appear at the top.

**Alternatives considered**:
- Ascending order (oldest-expired first) — rejected: oldest contracts are least likely to need immediate attention; most-recently-expired are more likely to have missed their cancellation window.
- Filter by `status = 'ACTIVE'` — rejected: an expired contract may already be set to `INACTIVE` by the user; the panel should still surface it if its end date has passed.

---

## Decision 3: Warning Visual Approach

**Decision**: Wrap the `ExpiredContracts` component in the existing `Card` component but add `className="border-amber-200 bg-amber-50"` to the Card root and use the `AlertTriangle` Lucide icon (amber-coloured) in the header.

**Rationale**: The design system already uses amber for the `warning` Badge variant (`bg-amber-100 text-amber-800`). Extending that palette to the card border/background creates a visually coherent warning signal without introducing new design tokens. `AlertTriangle` from `lucide-react` (already installed) communicates urgency unambiguously.

**Alternatives considered**:
- Red/destructive colour — rejected: "destructive" in the design system implies an action, not a state. Amber correctly signals "attention needed" without implying an error.
- Custom CSS variable — rejected: YAGNI; Tailwind amber utilities are already in use in the badge component.

---

## Decision 4: Navigation on Entry Click

**Decision**: Each contract entry in the panel is wrapped in a `<Link to={/contracts/${id}/edit}>` (React Router), consistent with how the contract table links to the edit page.

**Rationale**: `ContractEdit` is the only detail/action view for a contract. Routing to it directly is the lowest-friction path for the user to take action (e.g., cancel, update, or change status). This reuses the existing route `/contracts/:id/edit`.

**Alternatives considered**:
- Link to `/contracts` (list page) — rejected: requires a second click to find the specific contract.
- No navigation (display only) — rejected: contradicts FR-005.

---

## Decision 5: Empty State Behaviour

**Decision**: When `expiredContracts` is empty, render the Card in its normal (non-warning) style with a neutral muted text message. The warning amber styling only appears when there is at least one expired contract.

**Rationale**: Matches the `UpcomingRenewals` empty-state pattern and satisfies FR-006 (no warning styling for empty state). A user with no expired contracts should not see an amber panel.

**Alternatives considered**:
- Hide the panel entirely when empty — viable, but showing an empty state is more reassuring ("you have no expired contracts") and is consistent with `UpcomingRenewals`.

---

## Decision 6: Overflow / Entry Cap

**Decision**: No hard entry cap. The card scrolls naturally via browser layout. `max-h-64 overflow-y-auto` is applied to the list wrapper when there are entries, preventing an infinitely-tall panel on the dashboard.

**Rationale**: Simple and does not require pagination logic. Consistent with FR-009 ("cap visible entries to avoid excessive height"). The `max-h-64` value (16rem) is sufficient to show ~4-5 contracts comfortably before scrolling.

**Alternatives considered**:
- Hard cap of N entries with "view all" link — rejected: the "view all" destination (contract list) does not have an expired filter, making the link misleading. The scroll approach satisfies the spec without adding scope.
