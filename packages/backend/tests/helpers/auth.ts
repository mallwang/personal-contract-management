import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { hashPassword } from '../../src/services/password.js';
import { AuthService } from '../../src/services/auth.service.js';

export interface TestSession {
  userId: string;
  sessionId: string;
}

/** Inserts an ACTIVE user directly and opens a session for it — for authenticating route-test requests. */
export function createAuthenticatedSession(
  db: Database.Database,
  overrides: Partial<{ email: string; displayName: string; role: 'ADMIN' | 'MEMBER' }> = {},
): TestSession {
  const userId = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword('test-password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
  ).run(
    userId,
    overrides.email ?? `user-${userId}@example.test`,
    overrides.displayName ?? 'Test User',
    hash,
    salt,
    overrides.role ?? 'MEMBER',
    now,
    now,
  );
  const session = new AuthService(db).createSession(userId);
  return { userId, sessionId: session.id };
}
