import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ContractListResponseSchema,
  ContractSchema,
  type ContractData,
  type CreateContractBody,
  type UpdateContractBody,
} from '@pcm/shared';

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async (): Promise<ContractData[]> => {
      const res = await fetch('/api/contracts');
      if (!res.ok) throw new Error('Failed to fetch contracts');
      return ContractListResponseSchema.parse(await res.json());
    },
    staleTime: 30_000,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateContractBody): Promise<ContractData> => {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create contract');
      return ContractSchema.parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateContractBody;
    }): Promise<ContractData> => {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update contract');
      return ContractSchema.parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contract');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
