# Component Contract: LanguagePicker

**Source**: `packages/frontend/src/components/AppShell/LanguagePicker.tsx`

## Purpose

Renders a language picker dropdown in the sidebar Settings section, based on the Mantine Language Picker community pattern. Replaces the existing `LanguageSwitcher` component.

## Props

None (reads from i18next context).

## Supported Languages

| Code | Label |
|------|-------|
| `en` | English |
| `de` | Deutsch |

## Behaviour

- Displays the currently selected language (code + label) as a button
- Clicking opens a Mantine `Menu` with all available languages listed
- Selecting a language calls `i18n.changeLanguage(code)` and writes `localStorage.setItem('pcm-lang', code)`
- On app load, i18next reads `pcm-lang` from localStorage (via the `languageDetector` plugin already configured)

## Dependencies

- `@mantine/core`: `Menu`, `UnstyledButton`, `Group`, `Text`
- `react-i18next`: `useTranslation`

## Tests

Covered by migrated `LanguageSwitcher.test.tsx` (renamed to `LanguagePicker.test.tsx`):
- Renders current language
- Click on another language calls `i18n.changeLanguage`
- Language is written to localStorage
