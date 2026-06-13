# Quickstart Validation Guide: Mantine UI Modernization

**Phase 1 output for**: `015-mantine-ui-modernization`

## Prerequisites

- pnpm installed, `pnpm install` run from repo root
- Backend running: `pnpm --filter backend dev` (default port 3000)
- Frontend running: `pnpm --filter frontend dev` (default port 5173)
- At least one user account exists (create via existing sign-in flow or seeded DB)
- At least one admin account exists

## Setup

```bash
# From repo root
pnpm install
pnpm dev   # starts both backend and frontend concurrently
```

Open http://localhost:5173 in a browser.

---

## Validation Scenarios

### SC-001 — Sidebar Navigation

1. Sign in with a regular user account.
2. Verify a sidebar is visible on the left.
3. Click **Dashboard** → dashboard page loads; Dashboard link is highlighted.
4. Click **Contracts** → contracts page loads; Contracts link is highlighted.
5. Click **Account Settings** → account settings page loads.
6. Verify no Admin segment is visible.

**Pass**: All links navigate correctly and the active link is highlighted.

---

### SC-002 — Admin Segment Visible Only for Admins

1. Sign out and sign in with an admin account.
2. Verify the sidebar shows a second segment labelled "Admin".
3. Click **Accounts** → admin accounts page loads.
4. Sign out and sign in with a regular user.
5. Verify no Admin segment is shown.

**Pass**: Admin segment is shown only for admin users.

---

### SC-003 — Theme Toggle

1. Locate the Settings area at the bottom of the sidebar.
2. Click the dark/light theme toggle.
3. Verify the application switches to the other colour scheme immediately.
4. Reload the page — verify the scheme is still the same.
5. Open the browser's DevTools → Application → Local Storage.
6. Verify key `pcm-color-scheme` is set to `'dark'` or `'light'`.

**Pass**: Theme switches immediately and persists after reload.

---

### SC-004 — Language Picker

1. Locate the language picker in the sidebar Settings area.
2. Select **Deutsch**.
3. Verify all UI text switches to German immediately (no reload).
4. Reload the page — verify German is still active.
5. Switch back to **English** and verify.

**Pass**: Language switches immediately and persists after reload.

---

### SC-005 — Sign Out

1. Click Sign Out in the sidebar.
2. Verify you are redirected to `/sign-in`.

**Pass**: Redirected to sign-in page.

---

### SC-006 — Sign-In Page Layout

1. Navigate to http://localhost:5173/sign-in while signed out.
2. Verify a centred authentication form is shown (no sidebar).
3. Enter invalid credentials → verify an inline error message appears.
4. Enter valid credentials → verify redirect to Dashboard with sidebar.

**Pass**: Authentication Title layout shown; error displayed inline; successful login shows sidebar.

---

### SC-007 — Dashboard Stats Widget

1. Sign in and navigate to Dashboard.
2. Verify a spending stats widget shows total monthly spending.
3. Verify up to three category-level spending segments are shown.
4. If fewer than three categories exist, verify no empty segment placeholders are shown.

**Pass**: Stats Segments widget renders correctly with real data.

---

### SC-008 — Contract Table Sort & Sticky Header

1. Navigate to Contracts (with at least 5+ contracts for scrolling).
2. Click the **Name** column header → rows sort alphabetically.
3. Click again → rows sort in reverse.
4. Scroll down past the first row → verify the table header remains visible (sticky).
5. Verify the provider logo column shows logos (or placeholder) for each row.

**Pass**: Sort works; header is sticky; logos are shown.

---

### SC-009 — Contract Form Inputs

1. Navigate to Contracts → New Contract.
2. Hover over any input field label → verify a tooltip appears with guidance text.
3. Enter a value in the Amount field → verify EUR formatting is applied.
4. Verify fields use the contained (filled) input style.

**Pass**: Contained inputs with tooltips; EUR currency formatting.

---

### SC-010 — Password Strength

1. Navigate to Account Settings → change password form.
2. Start typing in the New Password field.
3. Verify a password strength indicator is shown below/alongside the field.

**Pass**: Strength indicator renders and updates as password is typed.

---

### SC-011 — Anonymization Controls

1. On the Contracts page, find the per-contract anonymization switch.
2. Toggle it for one contract → verify only that contract's name is anonymised.
3. Navigate to Account Settings.
4. Toggle the global anonymization switch in the Switches Card.
5. Navigate back to Contracts → verify all contract names are anonymised.

**Pass**: Per-contract and global anonymization controls work as before, with new Mantine styling.

---

### SC-012 — Admin User Management Table

1. Sign in as admin → navigate to Admin > Accounts.
2. Verify user rows are displayed using the Mantine Users Table pattern.
3. Verify action controls (invite, etc.) are present on each row.

**Pass**: Users Table pattern renders correctly.

---

### SC-013 — No Tailwind Classes Remain

Run from `packages/frontend/`:

```bash
grep -rn "className=\"" src/ | grep -v "\.module\.css" | head -20
```

Manually verify that any `className` attributes found use only Mantine CSS module imports (e.g. `styles.navbar`), not Tailwind utility classes (e.g. `"flex items-center"`).

Alternatively:
```bash
# Should return no results if migration is complete
grep -rn "class-variance-authority\|tailwind-merge\|@tailwindcss" src/ packages/
```

**Pass**: No Tailwind utility classes or Tailwind-ecosystem imports in any source file.

---

### SC-014 — Full Regression (Unit Tests)

```bash
cd packages/frontend
pnpm test
```

**Pass**: All unit tests pass.

---

### SC-015 — Full Regression (E2E Tests)

```bash
cd packages/frontend
pnpm test:e2e
```

**Pass**: All existing Playwright tests pass with no modification to test assertions.

---

## Footer

Each authenticated page should show a simple footer at the bottom of the main content area. Scroll to the bottom of the Dashboard, Contracts, and Account Settings pages to verify.
