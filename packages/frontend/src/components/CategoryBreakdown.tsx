import { useTranslation } from 'react-i18next';
import type { CategorySummary } from '@pcm/shared';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';

interface CategoryBreakdownProps {
  contractsByCategory: CategorySummary[];
}

export function CategoryBreakdown({ contractsByCategory }: CategoryBreakdownProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.byCategory')}</CardTitle>
      </CardHeader>
      <CardContent>
        {contractsByCategory.length === 0 ? (
          <p className="category-breakdown__empty text-sm text-[--color-muted-foreground]">
            {t('dashboard.noCategoryContracts')}
          </p>
        ) : (
          <table className="category-breakdown__table w-full text-sm">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th
                  scope="col"
                  className="pb-2 text-left font-medium text-[--color-muted-foreground]"
                >
                  {t('dashboard.categoryColumn')}
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-medium text-[--color-muted-foreground]"
                >
                  {t('dashboard.contractsColumn')}
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right font-medium text-[--color-muted-foreground]"
                >
                  {t('dashboard.monthlyTotalColumn')}
                </th>
              </tr>
            </thead>
            <tbody>
              {contractsByCategory.map((row) => (
                <tr key={row.category} className="border-b border-[--color-border] last:border-0">
                  <td className="py-3 font-medium">{row.label}</td>
                  <td className="py-3 text-center text-[--color-muted-foreground]">{row.count}</td>
                  <td className="py-3 text-right font-semibold">
                    {formatCurrency(row.monthlyTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
