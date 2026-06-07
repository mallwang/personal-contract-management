import {
  AccountSchema,
  AccountListResponseSchema,
  type Account,
  type CreateAccountBody,
  type Role,
} from '@pcm/shared';
import { AuthError } from './auth.js';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json: unknown = await res.json();
    if (json && typeof json === 'object' && 'message' in json && typeof json.message === 'string') {
      return json.message;
    }
  } catch {
    // ignore — fall through to the generic message
  }
  return fallback;
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/users', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load accounts'));
  return AccountListResponseSchema.parse(await res.json());
}

export async function createAccount(body: CreateAccountBody): Promise<Account> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to create account'));
  return AccountSchema.parse(await res.json());
}

export async function archiveAccount(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}/archive`, { method: 'POST', credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to archive account'));
}

export async function reactivateAccount(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}/reactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to reactivate account'));
}

export async function changeAccountRole(id: string, role: Role): Promise<void> {
  const res = await fetch(`/api/users/${id}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to change account role'));
}
