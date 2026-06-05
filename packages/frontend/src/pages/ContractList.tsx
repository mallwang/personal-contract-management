import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContracts, useDeleteContract } from '../services/contracts.js';
import { ContractTable } from '../components/ContractTable.js';
import { AnonymizationToggle } from '../components/AnonymizationToggle.js';
import { useAnonymization } from '../hooks/useAnonymization.js';

export function ContractList() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useContracts();
  const { mutate: deleteContract, error: deleteError } = useDeleteContract();
  const { isAnonymized, toggleAnonymization, getDisplayName } = useAnonymization();

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('contractList.title')}</h1>
            <p className="text-sm text-[--color-muted-foreground]">
              <Link to="/" className="hover:underline">
                {t('nav.backToDashboard')}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnonymizationToggle isActive={isAnonymized} onToggle={toggleAnonymization} />
            <Link
              to="/contracts/new"
              className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              {t('nav.addContract')}
            </Link>
          </div>
        </header>

        {deleteError && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t('contractList.deleteError')}
          </p>
        )}

        {isLoading && (
          <p className="py-8 text-center text-[--color-muted-foreground]">{t('common.loading')}</p>
        )}

        {isError && (
          <p className="py-8 text-center text-red-600">
            {t('contractList.loadError')} {error instanceof Error ? error.message : ''}
          </p>
        )}

        {data && (
          <div className="rounded-lg bg-background p-4 shadow-sm">
            <ContractTable
              contracts={data}
              onDelete={(id) => deleteContract(id)}
              isAnonymized={isAnonymized}
              getDisplayName={getDisplayName}
            />
          </div>
        )}
      </main>
    </div>
  );
}
