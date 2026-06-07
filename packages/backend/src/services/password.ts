import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export interface PasswordHash {
  hash: string;
  salt: string;
}

export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/** Generates a random initial password for newly bootstrapped/created accounts. */
export function generateInitialPassword(): string {
  return randomBytes(12).toString('base64url');
}
