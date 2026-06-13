# Data Model: Mantine UI Modernization

**Phase 1 output for**: `015-mantine-ui-modernization`

This is a frontend-only migration. No new backend entities, database tables, or API contracts are introduced. The data model section documents the **client-side state** entities introduced by the Mantine migration.

---

## Client-Side State Entities

### ThemePreference

Persisted by Mantine's `localStorageColorSchemeManager` under `localStorage` key `pcm-color-scheme`.

| Field | Type | Values | Notes |
|---|---|---|---|
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `light`, `dark`, `auto` | `auto` defers to OS system preference |

**State transitions**:
- On first visit (key absent): defaults to `'auto'` (OS preference)
- On `toggleColorScheme()`: cycles `light ↔ dark`
- On app load: `localStorageColorSchemeManager` reads the key and sets the initial scheme

**Validation**: Mantine validates internally; no custom validation required.

---

### LanguagePreference

Persisted by the existing `LanguageSwitcher` / new `LanguagePicker` component under `localStorage` key `pcm-lang`.

| Field | Type | Values | Notes |
|---|---|---|---|
| `language` | `'en' \| 'de'` | `en`, `de` | Matches existing i18n resource keys |

**State transitions**:
- On first visit (key absent): i18next uses browser `navigator.language`, falling back to `'en'`
- On language selection: `i18n.changeLanguage(code)` called; `localStorage.setItem('pcm-lang', code)` written

**Validation**: Language code must match a loaded i18next resource; currently `'en'` or `'de'`.

---

## Existing Backend Entities (unchanged)

The following entities are served by the existing API and are **not modified** by this feature:

- **ContractData** — `@pcm/shared` — contract records with `name`, `amount`, `category`, `status`, `endDate`, `provider`, `anonymize`
- **CategorySummary** — `@pcm/shared` — `{ category, label, count, monthlyTotal }`
- **DashboardData** — `@pcm/shared` — `{ totalMonthlySpending, contractsByCategory, upcomingRenewals, expiredContracts }`
- **User** — `@pcm/shared` — `{ id, displayName, email, role }`

All existing API endpoints and response shapes are unchanged.

---

## Component State Summary

New component state introduced (React `useState` / Mantine hooks):

| Component | State | Type | Scope |
|---|---|---|---|
| `NavbarSegmented` | `section` | `'main' \| 'admin'` | Local: active segment selection |
| `ContractTable` | `sortBy`, `reverseSortDirection` | `keyof ContractData \| null`, `boolean` | Local: Mantine TableSort pattern |
| `PasswordStrength` | `value`, `popoverOpened` | `string`, `boolean` | Local: password input field |
| `ThemeToggle` | *(via `useMantineColorScheme`)* | Mantine-managed | Global: in MantineProvider context |
| `LanguagePicker` | *(via `i18n.language`)* | string | Global: in i18next context |
