import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser, SignInBody } from '@pcm/shared';
import { fetchCurrentUser, signIn, signOut } from '../services/auth';

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'];

export function useCurrentUser() {
  return useQuery<SessionUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SignInBody) => signIn(body),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.clear();
    },
  });
}
