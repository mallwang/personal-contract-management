import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Text, Stack, Title, Group, Button } from '@mantine/core';
import { useDashboard } from '../services/api.js';
import { SpendingOverview } from '../components/SpendingOverview.js';
import { UpcomingRenewals } from '../components/UpcomingRenewals.js';
import { ExpiredContracts } from '../components/ExpiredContracts.js';

export function Dashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <Center mih="60vh">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center mih="60vh">
        <Text c="red">{t('dashboard.loadError')}</Text>
      </Center>
    );
  }

  const top3Categories = data.contractsByCategory.slice(0, 3);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>{t('dashboard.title')}</Title>
          <Text size="sm" c="dimmed">
            {t('dashboard.subtitle')}
          </Text>
        </div>
        <Button component={Link} to="/contracts" variant="default" size="sm">
          {t('nav.manageContracts')}
        </Button>
      </Group>

      <section aria-label={t('dashboard.monthlySpending')}>
        <SpendingOverview
          totalMonthlySpending={data.totalMonthlySpending}
          contractsByCategory={top3Categories}
        />
      </section>

      <section aria-label={t('dashboard.upcomingRenewals')}>
        <UpcomingRenewals upcomingRenewals={data.upcomingRenewals} />
      </section>

      <section aria-label={t('dashboard.expiredContracts')}>
        <ExpiredContracts expiredContracts={data.expiredContracts} />
      </section>
    </Stack>
  );
}
