import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ExpiredContract } from '@pcm/shared';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Badge } from './ui/badge.js';
import { cn } from '../lib/utils.js';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import { getFantasyName, FANTASY_NAMES } from '../data/fantasyNames.js';

interface ExpiredContractsProps {
  expiredContracts: ExpiredContract[];
}

export function ExpiredContracts({ expiredContracts }: ExpiredContractsProps) {
  const { t } = useTranslation();
  const { isAnonymized } = useAnonymization();
  const { formatDate } = useLocaleFormat();
  const hasExpired = expiredContracts.length > 0;

  function resolveName(contract: ExpiredContract): string {
    if (isAnonymized || contract.anonymize) {
      return getFantasyName(contract.id, FANTASY_NAMES);
    }
    return contract.name;
  }

  return (
    <Card className={cn(hasExpired && 'border-amber-200 bg-amber-50')}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{t('dashboard.expiredContracts')}</CardTitle>
        <AlertTriangle
          className={cn(
            'h-4 w-4',
            hasExpired ? 'text-amber-500' : 'text-[--color-muted-foreground]',
          )}
        />
      </CardHeader>
      <CardContent>
        {!hasExpired ? (
          <p className="expired-contracts__empty text-sm text-[--color-muted-foreground]">
            {t('dashboard.noExpiredContracts')}
          </p>
        ) : (
          <ul className="expired-contracts__list max-h-64 divide-y divide-[--color-border] overflow-y-auto">
            {expiredContracts.map((contract) => (
              <li key={contract.id} className="expired-contracts__item first:pt-0 last:pb-0">
                <Link
                  to={`/contracts/${contract.id}/edit`}
                  className="flex items-center justify-between py-3 hover:opacity-80"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="expired-contracts__name font-medium">
                      {resolveName(contract)}
                    </span>
                    <span className="expired-contracts__category text-xs text-[--color-muted-foreground]">
                      {t(`category.${contract.category}`)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="expired-contracts__date text-xs text-[--color-muted-foreground]">
                      {formatDate(contract.endDate)}
                    </span>
                    <Badge variant="warning">
                      {t('dashboard.daysOverdue', { count: contract.daysOverdue })}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
