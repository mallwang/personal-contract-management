# Research: Mantine UI Modernization

**Phase 0 output for**: `015-mantine-ui-modernization`

## 1. Mantine v7 Installation

### Decision
Use Mantine v7 (latest stable: `^7.x`) — the current major version with CSS Layers support and native CSS variables.

### Required packages

```
@mantine/core        # Core components (Button, NavLink, Table, etc.)
@mantine/hooks       # Utility hooks (useLocalStorage, useDisclosure, etc.)
postcss              # Required by postcss-preset-mantine
postcss-preset-mantine  # Autoprefixer + Mantine-specific PostCSS transforms
```

Optional (NOT added per constitution Principle III):
- `@mantine/form` — not added; existing form pattern retained
- `@mantine/notifications` — not in spec
- `@mantine/dates` — not needed for date display

### Icon library
Mantine community patterns (`ui.mantine.dev`) use `@tabler/icons-react`. The project currently uses `lucide-react`. Since this is a migration, `@tabler/icons-react` is added alongside `lucide-react`; existing code can keep lucide-react icons, and new Mantine patterns use Tabler icons where needed. Both coexist without issue.

### Rationale
Mantine v7 uses native CSS custom properties rather than CSS-in-JS, making it compatible with Vite's default CSS pipeline. The `postcss-preset-mantine` plugin is required to process Mantine's CSS source correctly.

### Alternatives considered
- Mantine v6 (CSS-in-JS): rejected because v7's CSS-first approach aligns better with the CSS modules goal and avoids runtime style injection overhead.

---

## 2. Vite Configuration Changes

### Decision
Replace the `@tailwindcss/vite` plugin with a PostCSS config file. No Vite plugin is needed for Mantine.

```ts
// vite.config.ts — AFTER migration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],          // tailwindcss() removed
  resolve: { alias: { '@': '/src' } },
  server: { /* unchanged */ },
  test: { /* unchanged */ },
});
```

```js
// postcss.config.cjs — NEW FILE
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': { variables: { 'mantine-breakpoint-xs': '36em', /* ... */ } },
  },
};
```

Mantine's PostCSS preset requires `postcss-simple-vars` as well. Both are listed as peer dependencies of `postcss-preset-mantine`.

---

## 3. MantineProvider Setup

### Decision
Wrap the app in `<MantineProvider>` with a `colorSchemeManager` that reads/writes from `localStorage`.

```tsx
// main.tsx — AFTER migration
import '@mantine/core/styles.css';   // replaces @import "tailwindcss"
import { MantineProvider, createTheme } from '@mantine/core';
import { ColorSchemeScript, localStorageColorSchemeManager } from '@mantine/core';

const theme = createTheme({ /* project-level overrides if needed */ });
const colorSchemeManager = localStorageColorSchemeManager({ key: 'pcm-color-scheme' });

// Inside render:
<MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
  {/* app */}
</MantineProvider>
```

`index.css` retains only non-Tailwind global styles (e.g., the `@keyframes nameFlip` animation for anonymization); the `@import "tailwindcss"` line and all `@theme` block are removed.

---

## 4. Dark/Light Theme

### Decision
Use Mantine's built-in `localStorageColorSchemeManager` (key: `pcm-color-scheme`) + `useMantineColorScheme` hook in the `ThemeToggle` component.

```tsx
// ThemeToggle.tsx
import { useMantineColorScheme, ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <ActionIcon onClick={toggleColorScheme} variant="default" size="lg">
      {colorScheme === 'dark' ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
}
```

The `localStorageColorSchemeManager` automatically initialises from `localStorage` on mount and saves on change. System preference is used as the default when no key exists.

### Rationale
Avoids manual localStorage reads/writes for theme; Mantine manages this as first-class feature.

---

## 5. Tailwind Removal

### Packages to remove from `packages/frontend/package.json`

From `dependencies`:
- `tailwind-merge`
- `class-variance-authority`
- `clsx`
- `@radix-ui/react-slot`

From `devDependencies`:
- `tailwindcss`
- `@tailwindcss/vite`

### Files to delete / clean
- `packages/frontend/src/components/ui/` — shadcn/ui generated components (card.tsx, badge.tsx); replaced by Mantine equivalents
- All Tailwind `className="..."` strings in all `.tsx` files

### Rationale
These packages are coupling points to the Tailwind/shadcn ecosystem. Removing them enforces the "no Tailwind class names" success criterion and reduces dependency surface.

---

## 6. CSS Modules Approach

### Decision
New Mantine-specific components use `Component.module.css` files following Mantine's CSS variable naming. The Mantine community patterns ship with their own CSS module files; these are copied alongside the component source.

Pattern example:
```css
/* NavbarSegmented.module.css */
.navbar { height: 100%; padding: var(--mantine-spacing-md); }
.navbarMain { flex: 1; margin-top: var(--mantine-spacing-md); }
.link { /* ... */ }
.linkActive { background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6)); }
```

The `light-dark()` CSS function is Mantine v7's mechanism for dark/light conditional values — it replaces the `[data-mantine-color-scheme="dark"]` selector approach of v6.

---

## 7. Language Persistence

### Decision
No change to the existing mechanism. The `LanguageSwitcher` component already stores the selected language in `localStorage` under the key `pcm-lang` and calls `i18n.changeLanguage()`. The new `LanguagePicker` component (Mantine Language Picker pattern) replaces the current implementation but preserves the same localStorage key and i18next integration.

---

## 8. Mantine Community Patterns — Summary

These patterns from `ui.mantine.dev` are **copy-pasted TypeScript+CSS-module files**, not npm packages.

| Pattern | Key Mantine Components Used | CSS Module | Notes |
|---|---|---|---|
| NavbarSegmented | `AppShell.Navbar`, `NavLink`, `SegmentedControl`, `Group` | Yes | Two segments: "App" and "Admin" |
| StatsSegments | `Progress`, `Group`, `Text`, `Paper` | Yes | Total + per-segment bars |
| TableSort | `Table`, `UnstyledButton`, `Center`, `keys` util | Yes | Built-in sort state; wraps existing sort logic |
| AuthenticationTitle | `Title`, `Text`, `Paper`, `TextInput`, `PasswordInput`, `Button`, `Anchor` | Yes | No AppShell |
| FooterSimple | `Container`, `Group`, `Text`, `Anchor` | Yes | Static links |
| UsersTable | `Table`, `Avatar`, `Badge`, `Checkbox`, `ActionIcon` | Yes | Row-level actions |
| LanguagePicker | `Menu`, `Button`, `Image`/flag icons | Yes | Replaces LanguageSwitcher |
| PasswordStrength | `PasswordInput`, `Popover`, `Progress`, `Text` | No | Inline strength indicator |
| ContainedInputs | `TextInput`, `Select`, `NumberInput` with `variant="filled"` | Yes | Tooltip via Mantine `Tooltip` |
| CurrencyInput | `NumberInput` with `prefix="€"` | No | EUR locked |
| CustomSwitch | `Switch` with custom `thumbIcon` | No | Per-contract anonymization |
| SwitchesCard | `Card`, `Switch`, `Group`, `Text` | Yes | Global anonymization in AccountSettings |

---

## 9. Testing Strategy for Migration

### Decision
Existing Vitest unit tests cover component behaviour through rendered output and user interactions. The test strategy for the migration is:

1. **For each component being replaced**: Write a new test (or update the existing test) that asserts the post-migration behaviour **before** touching the implementation. Confirm the test fails.
2. **For new components** (AppShell, ThemeToggle, LanguagePicker): Write tests first asserting nav links render, active states work, theme toggle calls `toggleColorScheme`, etc.
3. **Playwright e2e**: The existing e2e suite is run after migration to detect visual and functional regressions.

Components with tests to migrate (all currently in `tests/unit/`):
- `AnonymizationToggle.test.tsx`
- `ContractTable.test.tsx`
- `SpendingOverview.test.tsx`
- `CategoryBreakdown.test.tsx`
- `LanguageSwitcher.test.tsx`

New test files to create:
- `AppShell.test.tsx` (sidebar nav, admin segment, sign-out)
- `ThemeToggle.test.tsx` (toggle behaviour, localStorage persistence)

### Rationale
TDD is non-negotiable per constitution Principle I. UI component migrations are particularly prone to silent behavioural regressions; keeping tests first ensures each migrated component still passes its acceptance criteria.
