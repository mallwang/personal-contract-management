# Research: Multilanguage Support

**Date**: 2026-06-05
**Branch**: `005-multilanguage-support`

---

## Decision 1: i18n Library

**Decision**: Use `react-i18next` + `i18next`

**Rationale**: `react-i18next` is the de-facto standard for React i18n. Its `useTranslation` hook integrates directly with React's rendering cycle, making language switching instant without page reload. It handles string interpolation (e.g., `{{count}} days remaining`), and it avoids reinventing plural forms, namespace support, and resource loading — all of which a custom Context solution would need to implement manually. At ~30 KB, the overhead is small relative to the existing dependency footprint (React DOM, TanStack Query, react-router-dom).

**Alternatives considered**:
- **Custom React Context + JSON**: Zero dependencies but requires implementing interpolation, plural rules, and locale persistence manually. Violates the spirit of YAGNI (more code written, not less).
- **Lingui**: Type-safe and optimised, but requires Babel transforms and is significantly more complex to set up with Vite.
- **Format.js / react-intl**: ICU message format is powerful but verbose for a 2-language personal app.

---

## Decision 2: Translation File Location

**Decision**: `packages/frontend/src/i18n/locales/en.json` and `packages/frontend/src/i18n/locales/de.json`

**Rationale**: Translations are a presentation-layer concern, not a domain concern. They belong in the frontend package, not in `@pcm/shared`. Keeping them co-located with the frontend source makes them easy to find and edit.

**Alternatives considered**:
- Placing translations in `@pcm/shared`: Would make the shared package aware of UI display decisions. Incorrect separation of concerns.
- Single translation file with nested language keys: Harder to diff per-language and harder to load lazily in the future.

---

## Decision 3: Locale-Aware Formatting

**Decision**: Use native `Intl.NumberFormat` and `Intl.DateTimeFormat` APIs, wrapped in a `useLocaleFormat` hook that reads the active i18next language.

**Rationale**: The browser's `Intl` APIs are built-in, require no additional dependencies, and support all standard locale conventions. `SpendingOverview` and `CategoryBreakdown` currently hardcode `'de-DE'` — these will be updated to use the active locale from the hook. `ContractTable` already uses `toLocaleString(undefined, ...)` which uses the browser's default locale; this will be updated to use the active app locale explicitly.

**Alternatives considered**:
- `i18next-icu` for ICU number/date formatting: Adds another plugin dependency; native `Intl` APIs are sufficient for dates and currencies.
- `date-fns` / `dayjs` with locale packs: Overkill; dates in this app are displayed as-is (ISO strings from the API) and only need locale-aware separators.

---

## Decision 4: Language Persistence

**Decision**: Store selected language in `localStorage` under the key `pcm-lang`. Read on i18next init; write on user selection.

**Rationale**: `localStorage` is synchronous, zero-setup, and appropriate for a personal-use desktop app. `i18next-browser-languagedetector` could automate this, but adding another plugin for a manual two-line operation is not YAGNI-compliant.

**Alternatives considered**:
- `i18next-browser-languagedetector`: Automates localStorage + navigator.language detection. Justified for multi-user or public apps, but overkill here.
- Cookie-based: Unnecessarily complex; cookies suit server-rendered apps where the locale must be available on the server.

---

## Decision 5: Shared `_LABELS` Maps

**Decision**: Keep `CATEGORY_LABELS`, `BILLING_INTERVAL_LABELS`, `CANCELLATION_PERIOD_UNIT_LABELS` in `@pcm/shared` unchanged. In the frontend, replace their usage with `t('category.UTILITIES')` etc. from i18next.

**Rationale**: The label maps in `@pcm/shared` may be used by the backend (e.g., for display in server-sent responses or future features). Removing them from shared would be a potentially breaking change. The frontend simply stops consuming them for display purposes. The maps remain as English constants available to any consumer.

**Alternatives considered**:
- Remove maps from shared: Cleaner, but breaks the shared package contract without clear benefit now.
- Make maps locale-aware: Couples shared to the i18n system; wrong layer.

---

## Decision 6: Shared Layout Component

**Decision**: Introduce a `Layout` component at `packages/frontend/src/components/Layout.tsx`. All routes in `main.tsx` are wrapped with `<Layout>`. The `Layout` renders the `LanguageSwitcher` in a fixed top-right position (or within a global header bar).

**Rationale**: The language switcher must be accessible from every page. Currently, each page has its own header but no shared chrome. Adding the switcher to every page header individually creates duplication and maintenance burden. A single Layout wrapper is the simplest solution.

**Alternatives considered**:
- Add switcher to each page's header: Duplicates code across 4+ pages; hard to maintain.
- Fixed/overlay element in `main.tsx` outside router: Works but visually awkward (floats over content, z-index management needed).

---

## UI Text Inventory

All static UI strings requiring translation (approx. 65 keys across 8 namespaces):

| Namespace | Count | Notes |
|-----------|-------|-------|
| `nav` | 5 | Navigation labels |
| `common` | 8 | Shared actions and states |
| `status` | 2 | Active / Inactive |
| `category` | 5 | Contract category labels |
| `billingInterval` | 5 | Billing frequency labels |
| `cancellationUnit` | 3 | Days / Weeks / Months |
| `dashboard` | 11 | Dashboard page strings |
| `contractList` | 9 | List page strings |
| `contractForm` | 13 | Form field labels, placeholders, errors |
| `contractNew` | 1 | Page title |
| `contractEdit` | 3 | Page title and error states |

**Total**: ~65 translation keys for both `en.json` and `de.json`.
