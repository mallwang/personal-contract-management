import type { UpcomingRenewal } from '@pcm/shared';
import { CATEGORY_LABELS } from '@pcm/shared';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Badge } from './ui/badge.js';

interface UpcomingRenewalsProps {
  upcomingRenewals: UpcomingRenewal[];
}

function urgencyVariant(days: number): 'warning' | 'secondary' {
  return days <= 7 ? 'warning' : 'secondary';
}

export function UpcomingRenewals({ upcomingRenewals }: UpcomingRenewalsProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>Upcoming Renewals</CardTitle>
        <CalendarClock className="h-4 w-4 text-[--color-muted-foreground]" />
      </CardHeader>
      <CardContent>
        {upcomingRenewals.length === 0 ? (
          <p className="upcoming-renewals__empty text-sm text-[--color-muted-foreground]">
            No renewals due soon.
          </p>
        ) : (
          <ul className="upcoming-renewals__list divide-y divide-[--color-border]">
            {upcomingRenewals.map((renewal) => (
              <li key={renewal.id} className="upcoming-renewals__item flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="upcoming-renewals__name font-medium">{renewal.name}</span>
                  <span className="upcoming-renewals__category text-xs text-[--color-muted-foreground]">
                    {CATEGORY_LABELS[renewal.category]}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="upcoming-renewals__date text-xs text-[--color-muted-foreground]">
                    {renewal.endDate}
                  </span>
                  <Badge variant={urgencyVariant(renewal.daysRemaining)}>
                    {renewal.daysRemaining} days remaining
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
