import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Account, CreateAccountBody, Role } from '@pcm/shared';
import {
  fetchAccounts,
  createAccount,
  archiveAccount,
  reactivateAccount,
  changeAccountRole,
} from '../services/users.js';

export const ACCOUNTS_QUERY_KEY = ['accounts'];

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccounts,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountBody) => createAccount(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useReactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

export function useChangeAccountRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => changeAccountRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}
