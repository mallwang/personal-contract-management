import { useNavigate } from 'react-router-dom';
import { ContractForm } from '../components/ContractForm.js';
import { useCreateContract } from '../services/contracts.js';

export function ContractNew() {
  const navigate = useNavigate();
  const { mutate: createContract, isPending, error } = useCreateContract();

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-lg">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Add Contract</h1>
        </header>
        <div className="rounded-lg bg-background p-6 shadow-sm">
          <ContractForm
            onSubmit={(data) => createContract(data, { onSuccess: () => navigate('/contracts') })}
            onCancel={() => navigate('/contracts')}
            submitLabel="Add Contract"
            isPending={isPending}
            error={error instanceof Error ? error.message : null}
          />
        </div>
      </main>
    </div>
  );
}
