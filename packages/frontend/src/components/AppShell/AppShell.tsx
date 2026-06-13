import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Burger, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavbarSegmented } from './NavbarSegmented.js';
import { FooterSimple } from './FooterSimple.js';
import classes from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  return (
    <MantineAppShell
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }}
      padding="md"
    >
      <MantineAppShell.Navbar className={classes.navbar}>
        <NavbarSegmented />
      </MantineAppShell.Navbar>

      <MantineAppShell.Header hiddenFrom="sm" className={classes.header}>
        <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" />
      </MantineAppShell.Header>

      <MantineAppShell.Main className={classes.main}>
        <Box className={classes.content}>{children}</Box>
        <FooterSimple />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
