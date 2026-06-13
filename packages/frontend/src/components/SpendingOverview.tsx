import { useTranslation } from 'react-i18next';
import { Paper, Text, Progress, Group, Box } from '@mantine/core';
import type { CategorySummary } from '@pcm/shared';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import classes from './SpendingOverview.module.css';

const SEGMENT_COLORS = ['blue', 'cyan', 'teal'] as const;

interface SpendingOverviewProps {
  totalMonthlySpending: number;
  contractsByCategory: CategorySummary[];
}

export function SpendingOverview({
  totalMonthlySpending,
  contractsByCategory,
}: SpendingOverviewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();

  const segments = contractsByCategory.map((cat, i) => ({
    ...cat,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    pct: totalMonthlySpending > 0 ? (cat.monthlyTotal / totalMonthlySpending) * 100 : 0,
  }));

  return (
    <Paper withBorder radius="md" p="md">
      <Text className={classes.label}>{t('dashboard.monthlySpending')}</Text>

      {totalMonthlySpending === 0 ? (
        <Text mt="xs" size="sm" c="dimmed">
          {t('dashboard.noActiveContracts')}
        </Text>
      ) : (
        <Text className={classes.total}>{formatCurrency(totalMonthlySpending)}</Text>
      )}

      <Text className={classes.description}>{t('dashboard.acrossActiveContracts')}</Text>

      {segments.length > 0 && (
        <>
          <Progress.Root size={8} mt="sm">
            {segments.map((seg) => (
              <Progress.Section key={seg.category} value={seg.pct} color={seg.color} />
            ))}
          </Progress.Root>

          <Box mt="sm">
            {segments.map((seg) => (
              <Group
                key={seg.category}
                justify="space-between"
                mt={4}
                className={classes.segmentRow}
              >
                <Group gap={6}>
                  <Box
                    w={12}
                    h={12}
                    style={{
                      borderRadius: 2,
                      backgroundColor: `var(--mantine-color-${seg.color}-6)`,
                    }}
                  />
                  <Text className={classes.segmentLabel}>{seg.label}</Text>
                </Group>
                <Text className={classes.segmentAmount}>{formatCurrency(seg.monthlyTotal)}</Text>
              </Group>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}
