import type { CategorySummary } from '@pcm/shared';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';

interface CategoryBreakdownProps {
  contractsByCategory: CategorySummary[];
}

const fmt = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function CategoryBreakdown({ contractsByCategory }: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By Category</CardTitle>
      </CardHeader>
      <CardContent>
        {contractsByCategory.length === 0 ? (
          <p className="category-breakdown__empty text-sm text-[--color-muted-foreground]">
            No active contracts.
          </p>
        ) : (
          <table className="category-breakdown__table w-full text-sm">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th
                  scope="col"
                  className="pb-2 text-left font-medium text-[--color-muted-foreground]"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="pb-2 text-center font-medium text-[--color-muted-foreground]"
                >
                  Contracts
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right font-medium text-[--color-muted-foreground]"
                >
                  Monthly Total
                </th>
              </tr>
            </thead>
            <tbody>
              {contractsByCategory.map((row) => (
                <tr key={row.category} className="border-b border-[--color-border] last:border-0">
                  <td className="py-3 font-medium">{row.label}</td>
                  <td className="py-3 text-center text-[--color-muted-foreground]">{row.count}</td>
                  <td className="py-3 text-right font-semibold">{fmt.format(row.monthlyTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
