import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Text } from '@mantine/core';
import { useCurrentUser } from '../hooks/useAuth.js';

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { t } = useTranslation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Text size="sm" c="dimmed">
          {t('common.loading')}
        </Text>
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
