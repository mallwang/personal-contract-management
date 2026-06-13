# Component Contract: ThemeToggle

**Source**: `packages/frontend/src/components/AppShell/ThemeToggle.tsx`

## Purpose

Renders a single toggle button (sun/moon icon) in the sidebar Settings section. Clicking it switches between dark and light colour schemes. Reads/writes via Mantine's `useMantineColorScheme` hook; persistence is handled automatically by `localStorageColorSchemeManager`.

## Props

None (reads from Mantine context).

## Behaviour

- Displays sun icon when current scheme is `dark`; moon icon when `light`
- On click: calls `toggleColorScheme()`; Mantine updates the scheme and writes to `localStorage` key `pcm-color-scheme`
- On app load: `localStorageColorSchemeManager` initialises the scheme from `localStorage`; falls back to OS preference if key absent

## Dependencies

- `@mantine/core`: `useMantineColorScheme`, `ActionIcon`, `Tooltip`
- `@tabler/icons-react`: `IconSun`, `IconMoon`

## Tests (ThemeToggle.test.tsx)

- Renders moon icon when current scheme is `light`
- Renders sun icon when current scheme is `dark`
- Click calls `toggleColorScheme`
