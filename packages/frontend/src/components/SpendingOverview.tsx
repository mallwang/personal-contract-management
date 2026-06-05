import { TrendingUp, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';

interface SpendingOverviewProps {
  totalMonthlySpending: number;
}

export function SpendingOverview({ totalMonthlySpending }: SpendingOverviewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[--color-muted-foreground]">
          <span className="flex items-center gap-1">
            {t('dashboard.monthlySpending')}
            <span className="group relative inline-flex items-center">
              <button
                type="button"
                aria-label="Monthly spending calculation info"
                className="inline-flex items-center text-[--color-muted-foreground] hover:text-foreground focus:text-foreground focus:outline-none"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-64 rounded bg-foreground px-2.5 py-2 text-xs leading-relaxed text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {t('dashboard.monthlySpendingTooltip')}
              </span>
            </span>
          </span>
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-[--color-muted-foreground]" />
      </CardHeader>
      <CardContent>
        {totalMonthlySpending === 0 ? (
          <p className="spending-overview__empty text-sm text-[--color-muted-foreground]">
            {t('dashboard.noActiveContracts')}
          </p>
        ) : (
          <p className="spending-overview__total text-3xl font-bold tracking-tight">
            {formatCurrency(totalMonthlySpending)}
          </p>
        )}
        <p className="mt-1 text-xs text-[--color-muted-foreground]">
          {t('dashboard.acrossActiveContracts')}
        </p>
      </CardContent>
    </Card>
  );
}
