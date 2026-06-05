import { useTranslation } from 'react-i18next';
import type { UpcomingRenewal } from '@pcm/shared';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Badge } from './ui/badge.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';

interface UpcomingRenewalsProps {
  upcomingRenewals: UpcomingRenewal[];
}

function urgencyVariant(days: number): 'warning' | 'secondary' {
  return days <= 7 ? 'warning' : 'secondary';
}

export function UpcomingRenewals({ upcomingRenewals }: UpcomingRenewalsProps) {
  const { t } = useTranslation();
  const { formatDate } = useLocaleFormat();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{t('dashboard.upcomingRenewals')}</CardTitle>
        <CalendarClock className="h-4 w-4 text-[--color-muted-foreground]" />
      </CardHeader>
      <CardContent>
        {upcomingRenewals.length === 0 ? (
          <p className="upcoming-renewals__empty text-sm text-[--color-muted-foreground]">
            {t('dashboard.noRenewals')}
          </p>
        ) : (
          <ul className="upcoming-renewals__list divide-y divide-[--color-border]">
            {upcomingRenewals.map((renewal) => (
              <li
                key={renewal.id}
                className="upcoming-renewals__item flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="upcoming-renewals__name font-medium">{renewal.name}</span>
                  <span className="upcoming-renewals__category text-xs text-[--color-muted-foreground]">
                    {t(`category.${renewal.category}`)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="upcoming-renewals__date text-xs text-[--color-muted-foreground]">
                    {formatDate(renewal.endDate)}
                  </span>
                  <Badge variant={urgencyVariant(renewal.daysRemaining)}>
                    {t('dashboard.daysRemaining', { count: renewal.daysRemaining })}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
