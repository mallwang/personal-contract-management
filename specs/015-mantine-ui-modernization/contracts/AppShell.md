# Component Contract: AppShell (Sidebar Layout)

**Source**: `packages/frontend/src/components/AppShell/AppShell.tsx`

## Purpose

Wraps all authenticated pages. Renders the Mantine AppShell with a left sidebar (NavbarSegmented) and a main content area. Replaces the existing `Layout` component.

## Props

```ts
interface AppShellProps {
  children: React.ReactNode;
}
```

## Rendered structure

```
<MantineAppShell navbar={{ width: 300, breakpoint: 'sm' }}>
  <MantineAppShell.Navbar>
    <NavbarSegmented />
  </MantineAppShell.Navbar>
  <MantineAppShell.Main>
    {children}
    <FooterSimple />
  </MantineAppShell.Main>
</MantineAppShell>
```

## Behaviour

- Always visible on desktop (≥ `sm` breakpoint)
- Collapsible on mobile (hamburger toggle via `useDisclosure`)
- Renders children in the main content area
- Footer rendered at the bottom of main content

## Dependencies

- `NavbarSegmented` (sidebar content)
- `FooterSimple` (footer content)
- `@mantine/core`: `AppShell`, `Burger`
- `@mantine/hooks`: `useDisclosure`

## Tests (AppShell.test.tsx)

- Renders sidebar and children
- Sidebar contains Dashboard, Contracts, Account Settings links
- Admin segment hidden for regular users
- Admin segment visible for admin users
- Sign Out button triggers sign-out mutation and redirects
