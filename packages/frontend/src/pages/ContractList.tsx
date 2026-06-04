import { Link } from 'react-router-dom';
import { useContracts, useDeleteContract } from '../services/contracts.js';
import { ContractTable } from '../components/ContractTable.js';

export function ContractList() {
  const { data, isLoading, isError, error } = useContracts();
  const { mutate: deleteContract, error: deleteError } = useDeleteContract();

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
            <p className="text-sm text-[--color-muted-foreground]">
              <Link to="/" className="hover:underline">
                ← Dashboard
              </Link>
            </p>
          </div>
          <Link
            to="/contracts/new"
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Add Contract
          </Link>
        </header>

        {deleteError && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to delete contract. Please try again.
          </p>
        )}

        {isLoading && (
          <p className="py-8 text-center text-[--color-muted-foreground]">Loading…</p>
        )}

        {isError && (
          <p className="py-8 text-center text-red-600">
            Failed to load contracts.{' '}
            {error instanceof Error ? error.message : 'Please refresh the page.'}
          </p>
        )}

        {data && (
          <div className="rounded-lg bg-background p-4 shadow-sm">
            <ContractTable contracts={data} onDelete={(id) => deleteContract(id)} />
          </div>
        )}
      </main>
    </div>
  );
}
