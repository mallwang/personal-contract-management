import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ContractData } from '@pcm/shared';

interface ContractTableProps {
  contracts: ContractData[];
  onDelete: (id: string) => void;
}

export function ContractTable({ contracts, onDelete }: ContractTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <p className="py-8 text-center text-[--color-muted-foreground]">
        No contracts yet. Add your first contract above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[--color-muted-foreground]">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 pr-4 font-medium text-right">Monthly</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">End Date</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{contract.name}</td>
              <td className="py-2 pr-4 capitalize">{contract.category}</td>
              <td className="py-2 pr-4 text-right">
                {contract.monthlyAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="py-2 pr-4">{contract.status}</td>
              <td className="py-2 pr-4">{contract.endDate ?? '—'}</td>
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
                      Confirm
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(null)}
                      className="text-[--color-muted-foreground] hover:underline"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex gap-3">
                    <Link
                      to={`/contracts/${contract.id}/edit`}
                      className="hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setPendingDeleteId(contract.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
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
