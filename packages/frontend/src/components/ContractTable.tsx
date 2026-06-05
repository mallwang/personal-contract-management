import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { ContractData } from '@pcm/shared';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';

type SortColumn = 'name' | 'category' | 'amount' | 'status' | 'endDate';
type SortDirection = 'asc' | 'desc';

interface SortState {
  column: SortColumn | null;
  direction: SortDirection | null;
}

interface ContractTableProps {
  contracts: ContractData[];
  onDelete: (id: string) => void;
  isAnonymized?: boolean;
  getDisplayName?: (contract: ContractData) => string;
}

export function ContractTable({
  contracts,
  onDelete,
  isAnonymized = false,
  getDisplayName,
}: ContractTableProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });

  const sortedContracts = (() => {
    const col = sortState.column ?? 'name';
    const dir = sortState.direction === 'desc' ? -1 : 1;
    return [...contracts].sort((a, b) => {
      switch (col) {
        case 'name':
          return dir * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'category':
          return dir * a.category.localeCompare(b.category);
        case 'amount':
          return dir * (a.amount - b.amount);
        case 'status':
          return dir * a.status.localeCompare(b.status);
        case 'endDate':
          return dir * (a.endDate ?? '9999-99-99').localeCompare(b.endDate ?? '9999-99-99');
      }
    });
  })();

  function handleSort(col: SortColumn) {
    setSortState((prev) => {
      if (prev.column !== col) return { column: col, direction: 'asc' };
      if (prev.direction === 'asc') return { column: col, direction: 'desc' };
      return { column: null, direction: null };
    });
  }

  function SortIcon({ col }: { col: SortColumn }) {
    if (sortState.column === col) {
      return sortState.direction === 'asc' ? (
        <ChevronUp role="img" aria-label="Sorted ascending" className="inline-block ml-1 h-3 w-3" />
      ) : (
        <ChevronDown
          role="img"
          aria-label="Sorted descending"
          className="inline-block ml-1 h-3 w-3"
        />
      );
    }
    return (
      <ChevronsUpDown
        role="img"
        aria-label="Sort"
        className="inline-block ml-1 h-3 w-3 opacity-40"
      />
    );
  }

  const [displayAnonymized, setDisplayAnonymized] = useState(isAnonymized);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevAnonymized = useRef(isAnonymized);

  useEffect(() => {
    if (prevAnonymized.current === isAnonymized) return;
    prevAnonymized.current = isAnonymized;

    setIsFlipping(true);
    const swapTimer = setTimeout(() => {
      setDisplayAnonymized(isAnonymized);
    }, 200);
    const endTimer = setTimeout(() => {
      setIsFlipping(false);
    }, 400);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
    };
  }, [isAnonymized]);

  function resolveName(contract: ContractData): string {
    if (displayAnonymized || contract.anonymize) {
      return getDisplayName ? getDisplayName(contract) : contract.name;
    }
    return contract.name;
  }

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
            <th
              className="py-2 pr-4 font-medium cursor-pointer select-none"
              onClick={() => handleSort('name')}
            >
              {t('contractList.nameColumn')}
              <SortIcon col="name" />
            </th>
            <th
              className="py-2 pr-4 font-medium cursor-pointer select-none"
              onClick={() => handleSort('category')}
            >
              {t('contractList.categoryColumn')}
              <SortIcon col="category" />
            </th>
            <th
              className="py-2 pr-4 font-medium text-right cursor-pointer select-none"
              onClick={() => handleSort('amount')}
            >
              {t('contractList.amountColumn')}
              <SortIcon col="amount" />
            </th>
            <th
              className="py-2 pr-4 font-medium cursor-pointer select-none"
              onClick={() => handleSort('status')}
            >
              {t('contractList.statusColumn')}
              <SortIcon col="status" />
            </th>
            <th
              className="py-2 pr-4 font-medium cursor-pointer select-none"
              onClick={() => handleSort('endDate')}
            >
              {t('contractList.endDateColumn')}
              <SortIcon col="endDate" />
            </th>
            <th className="py-2 font-medium">{t('contractList.actionsColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedContracts.map((contract) => (
            <tr key={contract.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">
                <span className={isFlipping ? 'animate-name-flip' : undefined}>
                  {resolveName(contract)}
                </span>
              </td>
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
