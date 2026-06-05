# Data Model: Multilanguage Support

**Date**: 2026-06-05
**Branch**: `005-multilanguage-support`

---

## Overview

This feature introduces no new database tables or backend models. All data is managed entirely in the frontend. The "data" in scope is:

1. The set of supported languages (static, compile-time)
2. The translation catalogue (static JSON files, loaded at app init)
3. The user's language preference (persisted in `localStorage`)

---

## Entities

### Language

Represents a supported display language.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `'en' \| 'de'` | IETF language tag, used as i18next language key and localStorage value |
| `label` | `string` | Display name shown in the language switcher (e.g., "English", "Deutsch") |

**Valid values**:
- `{ code: 'en', label: 'English' }`
- `{ code: 'de', label: 'Deutsch' }`

**Constraints**:
- The `code` field is a closed union; adding a new language requires updating this union and providing a corresponding translation file.
- `'en'` is the default fallback language.

---

### Translation Catalogue

A flat-ish key-value map of all UI strings for a given language. Structured as a nested JSON object organised by namespace.

**File locations**:
- `packages/frontend/src/i18n/locales/en.json` — English strings
- `packages/frontend/src/i18n/locales/de.json` — German strings

**Namespace structure**:

```
{
  "nav":              { ... }   // Navigation links
  "common":           { ... }   // Shared action labels and states
  "status":           { ... }   // Contract status labels
  "category":         { ... }   // Contract category labels (maps to Category enum values)
  "billingInterval":  { ... }   // Billing interval labels (maps to BillingInterval enum values)
  "cancellationUnit": { ... }   // Cancellation period unit labels
  "dashboard":        { ... }   // Dashboard page strings
  "contractList":     { ... }   // Contract list page strings
  "contractForm":     { ... }   // Form field labels, placeholders, validation messages
  "contractNew":      { ... }   // Add contract page strings
  "contractEdit":     { ... }   // Edit contract page strings
}
```

**Constraints**:
- Every key present in `en.json` MUST also be present in `de.json`.
- Missing keys fall back to the English value (i18next fallback behaviour).
- Keys that contain variable substitution use `{{variableName}}` syntax (e.g., `"{{count}} days remaining"`).
- Keys are typed via i18next's TypeScript resource declaration to catch missing key usage at compile time.

---

### Language Preference

The user's persisted language choice.

| Field | Type | Description |
|-------|------|-------------|
| `key` | `'pcm-lang'` | `localStorage` key |
| `value` | `'en' \| 'de'` | Stored language code |

**Lifecycle**:
- **Read**: On application startup, before i18next initialises. If absent or invalid, defaults to `'en'`.
- **Write**: When the user selects a new language via the `LanguageSwitcher` component.

**Validation**:
- On read, the stored value is checked against the set of supported language codes. An unrecognised value is discarded and replaced by the default.

---

## Frontend Module Additions

These are new source files introduced by this feature (not existing files modified):

| File | Role |
|------|------|
| `packages/frontend/src/i18n/index.ts` | i18next initialisation: loads locale files, sets fallback language, reads `localStorage` |
| `packages/frontend/src/i18n/locales/en.json` | English translation catalogue |
| `packages/frontend/src/i18n/locales/de.json` | German translation catalogue |
| `packages/frontend/src/components/Layout.tsx` | Shared layout wrapper; renders `LanguageSwitcher` |
| `packages/frontend/src/components/LanguageSwitcher.tsx` | Language toggle control; calls i18next `changeLanguage`, writes to `localStorage` |
| `packages/frontend/src/hooks/useLocaleFormat.ts` | Returns `Intl.NumberFormat` and `Intl.DateTimeFormat` instances bound to the active locale |

---

## Existing Files Modified

| File | Change |
|------|--------|
| `packages/frontend/src/main.tsx` | Wrap route tree with `<Layout>` |
| `packages/frontend/src/pages/Dashboard.tsx` | Replace hardcoded strings with `t()` calls |
| `packages/frontend/src/pages/ContractList.tsx` | Replace hardcoded strings with `t()` calls |
| `packages/frontend/src/pages/ContractNew.tsx` | Replace hardcoded strings with `t()` calls |
| `packages/frontend/src/pages/ContractEdit.tsx` | Replace hardcoded strings with `t()` calls |
| `packages/frontend/src/components/ContractForm.tsx` | Replace hardcoded strings with `t()` calls |
| `packages/frontend/src/components/ContractTable.tsx` | Replace hardcoded strings with `t()` calls; use `useLocaleFormat` for amount |
| `packages/frontend/src/components/SpendingOverview.tsx` | Replace hardcoded `'de-DE'` locale with `useLocaleFormat` |
| `packages/frontend/src/components/CategoryBreakdown.tsx` | Replace hardcoded `'de-DE'` locale with `useLocaleFormat` |
| `packages/frontend/src/components/UpcomingRenewals.tsx` | Replace `CATEGORY_LABELS` usage and hardcoded strings with `t()` calls |

**No backend files are modified.** No database migrations required.
