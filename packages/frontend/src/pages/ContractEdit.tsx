import { useNavigate, useParams } from 'react-router-dom';
import { useContracts, useUpdateContract } from '../services/contracts.js';
import { ContractForm } from '../components/ContractForm.js';

export function ContractEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contracts, isLoading, isError } = useContracts();
  const { mutate: updateContract, isPending, error } = useUpdateContract();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-muted-foreground]">Loading…</p>
      </div>
    );
  }

  if (isError || !contracts) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load contracts.</p>
      </div>
    );
  }

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[--color-muted-foreground]">Contract not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-lg">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Edit Contract</h1>
          <p className="text-sm text-[--color-muted-foreground]">{contract.name}</p>
        </header>
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <ContractForm
            defaultValues={{
              name: contract.name,
              category: contract.category,
              monthlyAmount: String(contract.monthlyAmount),
              status: contract.status,
              endDate: contract.endDate ?? '',
            }}
            onSubmit={(data) =>
              updateContract(
                { id: contract.id, body: data },
                { onSuccess: () => navigate('/contracts') },
              )
            }
            onCancel={() => navigate('/contracts')}
            submitLabel="Save Changes"
            isPending={isPending}
            error={error instanceof Error ? error.message : null}
          />
        </div>
      </main>
    </div>
  );
}
