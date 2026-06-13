import {
  InvitationSchema,
  type Invitation,
  type SendInvitationBody,
  type SessionUser,
  SessionUserSchema,
} from '@pcm/shared';
import { AuthError } from './auth.js';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json: unknown = await res.json();
    if (json && typeof json === 'object' && 'message' in json && typeof json.message === 'string') {
      return json.message;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function sendInvitation(body: SendInvitationBody): Promise<Invitation> {
  const res = await fetch('/api/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to send invitation'));
  return InvitationSchema.parse(await res.json());
}

export async function listInvitations(): Promise<Invitation[]> {
  const res = await fetch('/api/invitations', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load invitations'));
  const json = (await res.json()) as unknown[];
  return json.map((item) => InvitationSchema.parse(item));
}

export async function cancelInvitation(token: string): Promise<void> {
  const res = await fetch(`/api/invitations/${token}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to cancel invitation'));
}

export async function resendInvitation(token: string): Promise<Invitation> {
  const res = await fetch(`/api/invitations/${token}/resend`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to resend invitation'));
  return InvitationSchema.parse(await res.json());
}

export async function acceptInvitation(token: string, password: string): Promise<SessionUser> {
  const res = await fetch(`/api/invitations/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to accept invitation'));
  return SessionUserSchema.parse(await res.json());
}
