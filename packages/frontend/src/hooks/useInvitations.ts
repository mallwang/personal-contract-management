import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Invitation, SendInvitationBody } from '@pcm/shared';
import {
  listInvitations,
  sendInvitation,
  cancelInvitation,
  resendInvitation,
} from '../services/invitations.js';

export const INVITATIONS_QUERY_KEY = ['invitations'];

export function useInvitations() {
  return useQuery<Invitation[]>({
    queryKey: INVITATIONS_QUERY_KEY,
    queryFn: listInvitations,
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendInvitationBody) => sendInvitation(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => cancelInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => resendInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}
