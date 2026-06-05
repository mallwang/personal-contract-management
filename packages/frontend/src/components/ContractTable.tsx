import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ContractData } from '@pcm/shared';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';

interface ContractTableProps {
  contracts: ContractData[];
  onDelete: (id: string) => void;
}

export function ContractTable({ contracts, onDelete }: ContractTableProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <p className="py-8 text-center text-[--color-muted-foreground]">
        {t('contractList.noContracts')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[--color-muted-foreground]">
            <th className="py-2 pr-4 font-medium">{t('contractList.nameColumn')}</th>
            <th className="py-2 pr-4 font-medium">{t('contractList.categoryColumn')}</th>
            <th className="py-2 pr-4 font-medium text-right">{t('contractList.amountColumn')}</th>
            <th className="py-2 pr-4 font-medium">{t('contractList.statusColumn')}</th>
            <th className="py-2 pr-4 font-medium">{t('contractList.endDateColumn')}</th>
            <th className="py-2 font-medium">{t('contractList.actionsColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{contract.name}</td>
              <td className="py-2 pr-4">{t(`category.${contract.category}`)}</td>
              <td className="py-2 pr-4 text-right">
                {formatCurrency(contract.amount)}
                {' / '}
                {t(`billingInterval.${contract.billingInterval}`)}
              </td>
              <td className="py-2 pr-4">{t(`status.${contract.status}`)}</td>
              <td className="py-2 pr-4">{contract.endDate ?? t('common.noData')}</td>
              <td className="py-2">
                {pendingDeleteId === contract.id ? (
                  <span className="inline-flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(contract.id);
                        setPendingDeleteId(null);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      {t('common.confirm')}
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(null)}
                      className="text-[--color-muted-foreground] hover:underline"
                    >
                      {t('common.cancel')}
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex gap-3">
                    <Link to={`/contracts/${contract.id}/edit`} className="hover:underline">
                      {t('common.edit')}
                    </Link>
                    <button
                      onClick={() => setPendingDeleteId(contract.id)}
                      className="text-red-600 hover:underline"
                    >
                      {t('common.delete')}
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
