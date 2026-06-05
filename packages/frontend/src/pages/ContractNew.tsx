import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContractForm } from '../components/ContractForm.js';
import { useCreateContract } from '../services/contracts.js';

export function ContractNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createContract, isPending, error } = useCreateContract();

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-lg">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('contractNew.title')}</h1>
        </header>
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <ContractForm
            onSubmit={(data) => createContract(data, { onSuccess: () => navigate('/contracts') })}
            onCancel={() => navigate('/contracts')}
            submitLabel={t('nav.addContract')}
            isPending={isPending}
            error={error instanceof Error ? error.message : null}
          />
        </div>
      </main>
    </div>
  );
}
