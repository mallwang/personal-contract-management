# Quickstart & Validation Guide: Multilanguage Support

**Date**: 2026-06-05
**Branch**: `005-multilanguage-support`

---

## Prerequisites

- `pnpm install` completed at the repo root (installs `i18next` and `react-i18next`)
- Backend running: `pnpm --filter backend dev`
- Frontend running: `pnpm --filter frontend dev` (default: http://localhost:5173)

---

## Automated Validation

### Unit tests

```bash
pnpm --filter frontend test
```

Expected results:
- **Translation catalogue completeness**: All 72 keys present in both `en.json` and `de.json`; no key exists in one file but not the other
- **`LanguageSwitcher` component**: Renders both language options; clicking each option calls i18next `changeLanguage` and writes the correct code to `localStorage`
- **`useLocaleFormat` hook**: Returns currency and date formatters bound to the active locale; switching locale changes formatted output

### End-to-end tests

```bash
pnpm --filter frontend test:e2e
```

Expected results:
- Language switcher is visible on Dashboard, Contract List, Add Contract, and Edit Contract pages
- Switching to German: all labels, headings, buttons, and table headers update without page reload; no form data is lost
- Switching back to English: all text reverts correctly
- After selecting German, refreshing the browser: the app loads in German

---

## Manual Validation Scenarios

### Scenario 1: Language switcher is always present

1. Open the app (http://localhost:5173)
2. Verify the language switcher control is visible on the Dashboard
3. Navigate to Contracts, Add Contract, and Edit Contract — confirm the switcher is visible on each

**Expected**: Switcher is present on all pages without any navigation or scroll required.

---

### Scenario 2: Instant switch — English to German (P1 story)

1. Ensure the app is displayed in English
2. Click the language switcher and select "Deutsch"
3. Observe the page **without reloading**

**Expected immediately (no reload)**:
- Page heading changes: "Dashboard" → "Dashboard" (same word), subtitle "Your contract overview" → German equivalent
- Navigate to Contracts: heading "Contracts" → German equivalent; column headers change; button "Add Contract" → German equivalent
- Open a contract form: all field labels, placeholders, and button labels update to German

---

### Scenario 3: Form state preserved during switch (P1 story)

1. Navigate to Add Contract
2. Type a contract name (e.g., "Netflix") in the Name field
3. Switch language to German
4. Verify the Name field still contains "Netflix"
5. Verify all form labels have changed to German

**Expected**: Entered data is preserved; only static labels change.

---

### Scenario 4: Locale-aware number formatting

1. Switch to German
2. View the Dashboard — Monthly Spending total
3. Observe the number format

**Expected in German**: Numbers use German conventions (comma as decimal separator, period as thousands separator) — e.g., "€1.234,56"

**Expected in English**: Numbers use English conventions — e.g., "€1,234.56"

---

### Scenario 5: Language preference persisted

1. Switch to German
2. Close the browser tab and reopen http://localhost:5173
3. Verify the app loads in German without any selection

**Expected**: App starts in German. The value `pcm-lang` in `localStorage` is `"de"`.

---

### Scenario 6: First-time user defaults to English

1. Open browser DevTools → Application → Local Storage → delete the `pcm-lang` key
2. Reload the page

**Expected**: App displays in English.

---

### Scenario 7: Missing translation fallback

*This scenario is verified by the automated completeness test. No manual step needed unless the test is skipped.*

The test confirms that every key in `en.json` exists in `de.json`. If a key were missing, i18next would fall back to the English value rather than showing a blank or raw key string.

---

## Key Files After Implementation

| File | Purpose |
|------|---------|
| `packages/frontend/src/i18n/index.ts` | i18next init |
| `packages/frontend/src/i18n/locales/en.json` | English catalogue (72 keys) |
| `packages/frontend/src/i18n/locales/de.json` | German catalogue (72 keys) |
| `packages/frontend/src/i18n/types.d.ts` | TypeScript key types |
| `packages/frontend/src/components/Layout.tsx` | Shared layout wrapper |
| `packages/frontend/src/components/LanguageSwitcher.tsx` | Language toggle |
| `packages/frontend/src/hooks/useLocaleFormat.ts` | Locale-aware formatters |

See [data-model.md](data-model.md) for the full list of modified files.
See [contracts/translation-key-schema.md](contracts/translation-key-schema.md) for the complete key catalogue.
