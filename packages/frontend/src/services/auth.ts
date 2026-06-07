import {
  SessionUserSchema,
  type SessionUser,
  type SignInBody,
  type ChangePasswordBody,
} from '@pcm/shared';

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

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

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load current user'));
  return SessionUserSchema.parse(await res.json());
}

export async function signIn(body: SignInBody): Promise<SessionUser> {
  const res = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new AuthError(res.status, await readErrorMessage(res, 'Sign-in failed'));
  return SessionUserSchema.parse(await res.json());
}

export async function signOut(): Promise<void> {
  const res = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new AuthError(res.status, await readErrorMessage(res, 'Sign-out failed'));
}

export async function changePassword(body: ChangePasswordBody): Promise<void> {
  const res = await fetch('/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to change password'));
}
