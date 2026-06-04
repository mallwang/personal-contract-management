import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';

interface SpendingOverviewProps {
  totalMonthlySpending: number;
}

const fmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function SpendingOverview({ totalMonthlySpending }: SpendingOverviewProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[--color-muted-foreground]">
          Monthly Spending
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-[--color-muted-foreground]" />
      </CardHeader>
      <CardContent>
        {totalMonthlySpending === 0 ? (
          <p className="spending-overview__empty text-sm text-[--color-muted-foreground]">
            No active contracts yet.
          </p>
        ) : (
          <p className="spending-overview__total text-3xl font-bold tracking-tight">
            {fmt.format(totalMonthlySpending)}
          </p>
        )}
        <p className="mt-1 text-xs text-[--color-muted-foreground]">across all active contracts</p>
      </CardContent>
    </Card>
  );
}
