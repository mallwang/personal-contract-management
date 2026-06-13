import { useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Group,
  Text,
  SegmentedControl,
  Stack,
  Tooltip,
  ActionIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFileText,
  IconUser,
  IconUsers,
  IconLogout,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { useCurrentUser, useSignOut } from '../../hooks/useAuth.js';
import { LanguagePicker } from './LanguagePicker.js';
import classes from './NavbarSegmented.module.css';

type Segment = 'app' | 'admin';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export function NavbarSegmented() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const { mutate: signOut, isPending } = useSignOut();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();
  const [segment, setSegment] = useState<Segment>('app');

  const appLinks: NavItem[] = [
    { label: t('nav.dashboard'), to: '/', icon: <IconLayoutDashboard size={18} /> },
    { label: t('nav.contracts'), to: '/contracts', icon: <IconFileText size={18} /> },
    { label: t('nav.accountSettings'), to: '/account', icon: <IconUser size={18} /> },
  ];

  const adminLinks: NavItem[] = [
    { label: t('nav.accounts'), to: '/admin/accounts', icon: <IconUsers size={18} /> },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const links = segment === 'app' ? appLinks : adminLinks;

  return (
    <div className={classes.navbar}>
      {user?.role === 'ADMIN' && (
        <SegmentedControl
          value={segment}
          onChange={(v) => setSegment(v as Segment)}
          data={[
            { label: 'App', value: 'app' },
            { label: 'Admin', value: 'admin' },
          ]}
          mb="md"
        />
      )}

      <div className={classes.navbarMain}>
        <Stack gap={4}>
          {links.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={[classes.link, isActive(item.to) ? classes.linkActive : ''].join(' ')}
            >
              {item.icon}
              <Text ml="xs" size="sm" fw={500}>
                {item.label}
              </Text>
            </RouterNavLink>
          ))}
        </Stack>
      </div>

      <div className={classes.settingsSection}>
        <Group justify="space-between" align="center">
          <LanguagePicker />
          <Tooltip
            label={colorScheme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
          >
            <ActionIcon
              onClick={toggleColorScheme}
              variant="default"
              size="lg"
              aria-label={colorScheme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <div className={classes.userSection}>
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500} truncate>
            {user?.displayName}
          </Text>
          <Tooltip label={t('auth.signOut')}>
            <ActionIcon
              variant="default"
              size="md"
              onClick={() => signOut()}
              disabled={isPending}
              aria-label={t('auth.signOut')}
            >
              <IconLogout size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
    </div>
  );
}
