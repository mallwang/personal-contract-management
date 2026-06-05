import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContracts, useUpdateContract } from '../services/contracts.js';
import { ContractForm } from '../components/ContractForm.js';

export function ContractEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contracts, isLoading, isError } = useContracts();
  const { mutate: updateContract, isPending, error } = useUpdateContract();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-muted-foreground]">{t('common.loading')}</p>
      </div>
    );
  }

  if (isError || !contracts) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{t('contractEdit.loadError')}</p>
      </div>
    );
  }

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-muted-foreground]">{t('contractEdit.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-lg">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('contractEdit.title')}</h1>
          <p className="text-sm text-[--color-muted-foreground]">{contract.name}</p>
        </header>
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <ContractForm
            defaultValues={{
              name: contract.name,
              category: contract.category,
              amount: String(contract.amount),
              billingInterval: contract.billingInterval,
              status: contract.status,
              endDate: contract.endDate ?? '',
              startDate: contract.startDate ?? '',
              details: contract.details ?? '',
              serviceUrl: contract.serviceUrl ?? '',
              cancellationPeriodValue: contract.cancellationPeriod
                ? String(contract.cancellationPeriod.value)
                : '',
              cancellationPeriodUnit: contract.cancellationPeriod?.unit ?? 'MONTHS',
            }}
            onSubmit={(data) =>
              updateContract(
                { id: contract.id, body: data },
                { onSuccess: () => navigate('/contracts') },
              )
            }
            onCancel={() => navigate('/contracts')}
            submitLabel={t('contractEdit.saveChanges')}
            isPending={isPending}
            error={error instanceof Error ? error.message : null}
          />
        </div>
      </main>
    </div>
  );
}
