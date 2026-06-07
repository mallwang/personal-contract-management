import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations } from '../../src/db/client.js';
import { AuthService, SESSION_INACTIVITY_TIMEOUT_MS } from '../../src/services/auth.service.js';
import { hashPassword, verifyPassword } from '../../src/services/password.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{
    email: string;
    displayName: string;
    password: string;
    role: string;
    status: string;
  }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(overrides.password ?? 'correct-horse-battery-staple');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    overrides.displayName ?? 'Test User',
    hash,
    salt,
    overrides.role ?? 'MEMBER',
    overrides.status ?? 'ACTIVE',
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

describe('password hashing round-trip', () => {
  it('produces a different salt and hash for the same password each time', () => {
    const a = hashPassword('hunter2');
    const b = hashPassword('hunter2');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('verifies a correct password against its stored hash/salt', () => {
    const { hash, salt } = hashPassword('hunter2');
    expect(verifyPassword('hunter2', hash, salt)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const { hash, salt } = hashPassword('hunter2');
    expect(verifyPassword('wrong-password', hash, salt)).toBe(false);
  });

  it('never stores the plaintext password', () => {
    const { hash, salt } = hashPassword('hunter2');
    expect(hash).not.toContain('hunter2');
    expect(salt).not.toContain('hunter2');
  });
});

describe('AuthService – sign-in and lockout', () => {
  let db: Database.Database;
  let auth: AuthService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    auth = new AuthService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('returns success and a session for correct credentials', () => {
    const { email } = insertUser(db, { password: 'right-pass' });
    const result = auth.signIn(email, 'right-pass');
    expect(result.outcome).toBe('success');
    if (result.outcome === 'success') {
      expect(result.session.id).toBeTruthy();
      expect(result.session.user_id).toBe(result.user.id);
    }
  });

  it('returns invalid for a wrong password without revealing which field was wrong', () => {
    const { email } = insertUser(db, { password: 'right-pass' });
    const result = auth.signIn(email, 'wrong-pass');
    expect(result).toEqual({ outcome: 'invalid' });
  });

  it('returns invalid for an unknown email', () => {
    const result = auth.signIn('nobody@example.test', 'whatever');
    expect(result).toEqual({ outcome: 'invalid' });
  });

  it('locks the account after repeated failures and refuses even the correct password while locked', () => {
    const { email } = insertUser(db, { password: 'right-pass' });
    for (let i = 0; i < 5; i++) {
      auth.signIn(email, 'wrong-pass');
    }
    const lockedResult = auth.signIn(email, 'right-pass');
    expect(lockedResult.outcome).toBe('locked');
  });

  it('resets the failure counter after a successful sign-in', () => {
    const { email } = insertUser(db, { password: 'right-pass' });
    auth.signIn(email, 'wrong-pass');
    auth.signIn(email, 'wrong-pass');
    auth.signIn(email, 'right-pass');
    const row = db
      .prepare<
        [string],
        { failed_attempts: number }
      >(`SELECT failed_attempts FROM users WHERE email = ?`)
      .get(email)!;
    expect(row.failed_attempts).toBe(0);
  });
});

describe('AuthService – session lifecycle', () => {
  let db: Database.Database;
  let auth: AuthService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    auth = new AuthService(db);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    db.close();
  });

  it('creates a session and resolves it back to the owning user', () => {
    const { id: userId } = insertUser(db);
    const session = auth.createSession(userId);
    const resolved = auth.resolveSession(session.id);
    expect(resolved?.id).toBe(userId);
  });

  it('refreshes last_seen_at on each successful resolution', () => {
    const { id: userId } = insertUser(db);
    const session = auth.createSession(userId);
    const before = db
      .prepare<[string], { last_seen_at: string }>(`SELECT last_seen_at FROM sessions WHERE id = ?`)
      .get(session.id)!;

    vi.advanceTimersByTime(60_000);
    auth.resolveSession(session.id);

    const after = db
      .prepare<[string], { last_seen_at: string }>(`SELECT last_seen_at FROM sessions WHERE id = ?`)
      .get(session.id)!;
    expect(new Date(after.last_seen_at).getTime()).toBeGreaterThan(
      new Date(before.last_seen_at).getTime(),
    );
  });

  it('expires (and deletes) a session that has been inactive too long', () => {
    const { id: userId } = insertUser(db);
    const session = auth.createSession(userId);

    vi.advanceTimersByTime(SESSION_INACTIVITY_TIMEOUT_MS + 60_000);
    const resolved = auth.resolveSession(session.id);

    expect(resolved).toBeNull();
    const row = db.prepare(`SELECT 1 FROM sessions WHERE id = ?`).get(session.id);
    expect(row).toBeUndefined();
  });

  it('returns null and deletes the row for an unknown session id', () => {
    expect(auth.resolveSession('does-not-exist')).toBeNull();
  });

  it('destroySession removes the row by id (sign-out)', () => {
    const { id: userId } = insertUser(db);
    const session = auth.createSession(userId);
    auth.destroySession(session.id);
    expect(auth.resolveSession(session.id)).toBeNull();
  });

  it('treats sessions of archived accounts as invalid', () => {
    const { id: userId } = insertUser(db, { status: 'ACTIVE' });
    const session = auth.createSession(userId);
    db.prepare(`UPDATE users SET status = 'ARCHIVED' WHERE id = ?`).run(userId);

    expect(auth.resolveSession(session.id)).toBeNull();
  });
});

describe('AuthService – change password', () => {
  let db: Database.Database;
  let auth: AuthService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    auth = new AuthService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('changes the password when the current password matches', () => {
    const { id: userId, email } = insertUser(db, { password: 'old-pass' });
    expect(auth.changePassword(userId, 'old-pass', 'new-pass-123')).toBe(true);
    expect(auth.signIn(email, 'new-pass-123').outcome).toBe('success');
    expect(auth.signIn(email, 'old-pass').outcome).toBe('invalid');
  });

  it('refuses to change the password when the current password is wrong', () => {
    const { id: userId } = insertUser(db, { password: 'old-pass' });
    expect(auth.changePassword(userId, 'wrong-current', 'new-pass-123')).toBe(false);
  });
});
