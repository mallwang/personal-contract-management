import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations, purgeExpiredArchivedAccounts } from '../../src/db/client.js';
import { UserService } from '../../src/services/user.service.js';
import { hashPassword, verifyPassword } from '../../src/services/password.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{
    email: string;
    displayName: string;
    password: string;
    role: string;
    status: string;
    archivedAt: string | null;
  }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(overrides.password ?? 'right-password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, archived_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    overrides.displayName ?? 'Test User',
    hash,
    salt,
    overrides.role ?? 'MEMBER',
    overrides.status ?? 'ACTIVE',
    overrides.archivedAt ?? null,
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

describe('UserService – list/create', () => {
  let db: Database.Database;
  let service: UserService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new UserService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('list() returns every account, active and archived, in the public Account shape', () => {
    insertUser(db, { email: 'active@example.test' });
    insertUser(db, {
      email: 'archived@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    const accounts = service.list();
    expect(accounts).toHaveLength(2);
    const emails = accounts.map((a) => a.email);
    expect(emails).toContain('active@example.test');
    expect(emails).toContain('archived@example.test');
    for (const account of accounts) {
      expect(account).not.toHaveProperty('passwordHash');
      expect(account).not.toHaveProperty('password_hash');
    }
  });

  it('create() hashes the initial password with a fresh salt and returns the public account shape', () => {
    const result = service.create({
      email: 'newbie@example.test',
      displayName: 'Newbie',
      role: 'MEMBER',
      initialPassword: 'a-strong-password',
    });
    expect(result.outcome).toBe('created');
    if (result.outcome !== 'created') return;
    expect(result.account).toMatchObject({
      email: 'newbie@example.test',
      displayName: 'Newbie',
      role: 'MEMBER',
      status: 'ACTIVE',
    });

    const row = db
      .prepare<
        [string],
        { password_hash: string; password_salt: string }
      >(`SELECT password_hash, password_salt FROM users WHERE id = ?`)
      .get(result.account.id)!;
    expect(row.password_hash).not.toBe('a-strong-password');
    expect(verifyPassword('a-strong-password', row.password_hash, row.password_salt)).toBe(true);
  });

  it('create() returns duplicate when the email is already in use (active or archived)', () => {
    insertUser(db, { email: 'taken@example.test' });
    insertUser(db, {
      email: 'gone@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });

    expect(
      service.create({
        email: 'taken@example.test',
        displayName: 'X',
        role: 'MEMBER',
        initialPassword: 'password123',
      }).outcome,
    ).toBe('duplicate');
    expect(
      service.create({
        email: 'gone@example.test',
        displayName: 'X',
        role: 'MEMBER',
        initialPassword: 'password123',
      }).outcome,
    ).toBe('duplicate');
  });

  it('create() email matching is case-insensitive', () => {
    insertUser(db, { email: 'taken@example.test' });
    expect(
      service.create({
        email: 'TAKEN@Example.Test',
        displayName: 'X',
        role: 'MEMBER',
        initialPassword: 'password123',
      }).outcome,
    ).toBe('duplicate');
  });
});

describe('UserService – archive / reactivate', () => {
  let db: Database.Database;
  let service: UserService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new UserService(db);
  });

  afterEach(() => {
    db.close();
  });

  it("archive() sets status=ARCHIVED, stamps archived_at, and deletes the account's sessions", () => {
    insertUser(db, { email: 'admin@example.test', role: 'ADMIN' });
    const target = insertUser(db, { email: 'leaving@example.test' });
    db.prepare(
      `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      target.id,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
    );

    expect(service.archive(target.id)).toBe('archived');

    const row = db
      .prepare<
        [string],
        { status: string; archived_at: string | null }
      >(`SELECT status, archived_at FROM users WHERE id = ?`)
      .get(target.id)!;
    expect(row.status).toBe('ARCHIVED');
    expect(row.archived_at).toBeTruthy();

    const sessions = db
      .prepare<
        [string],
        { count: number }
      >(`SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?`)
      .get(target.id)!;
    expect(sessions.count).toBe(0);
  });

  it('archive() returns not-found for an unknown id', () => {
    expect(service.archive(randomUUID())).toBe('not-found');
  });

  it('archive() refuses to remove the last active administrator', () => {
    const admin = insertUser(db, { email: 'admin@example.test', role: 'ADMIN' });
    expect(service.archive(admin.id)).toBe('last-admin');
    const row = db
      .prepare<[string], { status: string }>(`SELECT status FROM users WHERE id = ?`)
      .get(admin.id)!;
    expect(row.status).toBe('ACTIVE');
  });

  it('archive() allows removing an administrator when another active admin remains', () => {
    insertUser(db, { email: 'admin-a@example.test', role: 'ADMIN' });
    const adminB = insertUser(db, { email: 'admin-b@example.test', role: 'ADMIN' });
    expect(service.archive(adminB.id)).toBe('archived');
  });

  it('reactivate() restores ACTIVE status, clears archived_at, and leaves contracts untouched', () => {
    const target = insertUser(db, { status: 'ARCHIVED', archivedAt: new Date().toISOString() });
    const now = new Date().toISOString();
    const contractId = randomUUID();
    db.prepare(
      `INSERT INTO contracts (id, user_id, name, category, amount, billing_interval, status, anonymize, created_at, updated_at)
       VALUES (?, ?, 'Kept', 'SUBSCRIPTIONS', 5, 'MONTHLY', 'ACTIVE', 0, ?, ?)`,
    ).run(contractId, target.id, now, now);

    expect(service.reactivate(target.id)).toBe('reactivated');

    const row = db
      .prepare<
        [string],
        { status: string; archived_at: string | null }
      >(`SELECT status, archived_at FROM users WHERE id = ?`)
      .get(target.id)!;
    expect(row.status).toBe('ACTIVE');
    expect(row.archived_at).toBeNull();

    const contract = db
      .prepare<[string], { id: string }>(`SELECT id FROM contracts WHERE user_id = ?`)
      .get(target.id);
    expect(contract?.id).toBe(contractId);
  });

  it('reactivate() returns not-found for an unknown id', () => {
    expect(service.reactivate(randomUUID())).toBe('not-found');
  });

  it('reactivate() returns not-archived for an already-active account', () => {
    const target = insertUser(db, { status: 'ACTIVE' });
    expect(service.reactivate(target.id)).toBe('not-archived');
  });
});

describe('UserService – role changes', () => {
  let db: Database.Database;
  let service: UserService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new UserService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('changeRole() updates the role', () => {
    insertUser(db, { email: 'admin@example.test', role: 'ADMIN' });
    const target = insertUser(db, { role: 'MEMBER' });
    expect(service.changeRole(target.id, 'ADMIN')).toBe('changed');
    const row = db
      .prepare<[string], { role: string }>(`SELECT role FROM users WHERE id = ?`)
      .get(target.id)!;
    expect(row.role).toBe('ADMIN');
  });

  it('changeRole() refuses to demote the last remaining active administrator', () => {
    const admin = insertUser(db, { role: 'ADMIN' });
    expect(service.changeRole(admin.id, 'MEMBER')).toBe('last-admin');
    const row = db
      .prepare<[string], { role: string }>(`SELECT role FROM users WHERE id = ?`)
      .get(admin.id)!;
    expect(row.role).toBe('ADMIN');
  });

  it('changeRole() allows demoting an admin when another active admin remains', () => {
    insertUser(db, { email: 'admin-a@example.test', role: 'ADMIN' });
    const adminB = insertUser(db, { email: 'admin-b@example.test', role: 'ADMIN' });
    expect(service.changeRole(adminB.id, 'MEMBER')).toBe('changed');
  });

  it('changeRole() returns not-found for an unknown id', () => {
    expect(service.changeRole(randomUUID(), 'ADMIN')).toBe('not-found');
  });

  it('the last-admin guard ignores archived administrators when counting active admins', () => {
    const activeAdmin = insertUser(db, { email: 'active-admin@example.test', role: 'ADMIN' });
    insertUser(db, {
      email: 'archived-admin@example.test',
      role: 'ADMIN',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    // Only one active admin remains — demoting them must still be refused.
    expect(service.changeRole(activeAdmin.id, 'MEMBER')).toBe('last-admin');
  });
});

describe('30-day retention purge (FR-012/FR-013, exercised via db/client)', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('purges accounts archived more than 30 days ago but keeps recently-archived ones', () => {
    const old = insertUser(db, {
      email: 'old@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recent = insertUser(db, {
      email: 'recent@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const deleted = purgeExpiredArchivedAccounts(db);
    expect(deleted).toBe(1);

    expect(db.prepare(`SELECT id FROM users WHERE id = ?`).get(old.id)).toBeUndefined();
    expect(db.prepare(`SELECT id FROM users WHERE id = ?`).get(recent.id)).toBeTruthy();
  });
});
