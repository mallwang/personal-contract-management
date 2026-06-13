import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations } from '../../src/db/client.js';
import { InvitationService, DuplicateAccountError } from '../../src/services/invitation.service.js';
import { hashPassword } from '../../src/services/password.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{ email: string; status: string; archivedAt: string | null }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword('password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, archived_at, created_at, updated_at)
     VALUES (?, ?, 'Test', ?, ?, 'MEMBER', ?, ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    hash,
    salt,
    overrides.status ?? 'ACTIVE',
    overrides.archivedAt ?? null,
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

interface InvitationRow {
  token: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  invited_by: string;
}

describe('InvitationService – create', () => {
  let db: Database.Database;
  let service: InvitationService;
  let adminId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    const admin = insertUser(db, { email: 'admin@example.test' });
    adminId = admin.id;
    service = new InvitationService(db);
  });

  afterEach(() => db.close());

  it('creates a PENDING invitation with a 64-char hex token', () => {
    const inv = service.create('newbie@example.test', adminId);
    expect(inv.status).toBe('PENDING');
    expect(inv.token).toMatch(/^[0-9a-f]{64}$/);
    expect(inv.email).toBe('newbie@example.test');
  });

  it('sets expires_at to approximately 7 days from now', () => {
    const before = Date.now();
    const inv = service.create('newbie@example.test', adminId);
    const after = Date.now();
    const expires = new Date(inv.expiresAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expires).toBeLessThanOrEqual(after + sevenDays + 1000);
  });

  it('rejects with DuplicateAccountError when email has an active account (FR-008)', () => {
    insertUser(db, { email: 'existing@example.test', status: 'ACTIVE' });
    expect(() => service.create('existing@example.test', adminId)).toThrow(DuplicateAccountError);
  });

  it('rejects with DuplicateAccountError when email has an archived account (FR-008)', () => {
    insertUser(db, {
      email: 'archived@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    expect(() => service.create('archived@example.test', adminId)).toThrow(DuplicateAccountError);
  });

  it('supersedes an existing PENDING invitation for the same email (FR-007)', () => {
    const first = service.create('newbie@example.test', adminId);
    const second = service.create('newbie@example.test', adminId);

    const firstRow = db
      .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
      .get(first.token);
    expect(firstRow?.status).toBe('SUPERSEDED');
    expect(second.status).toBe('PENDING');
    expect(second.token).not.toBe(first.token);
  });

  it('supersede happens in the same transaction (atomically)', () => {
    service.create('newbie@example.test', adminId);
    service.create('newbie@example.test', adminId);
    const rows = db
      .prepare<[], InvitationRow>(`SELECT * FROM invitations WHERE email = 'newbie@example.test'`)
      .all();
    const pending = rows.filter((r) => r.status === 'PENDING');
    const superseded = rows.filter((r) => r.status === 'SUPERSEDED');
    expect(pending).toHaveLength(1);
    expect(superseded).toHaveLength(1);
  });
});

describe('InvitationService – list', () => {
  let db: Database.Database;
  let service: InvitationService;
  let adminId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    adminId = insertUser(db, { email: 'admin@example.test' }).id;
    service = new InvitationService(db);
  });

  afterEach(() => db.close());

  it('list() returns invitations with status and createdAt', () => {
    service.create('a@example.test', adminId);
    service.create('b@example.test', adminId);
    const list = service.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
    for (const inv of list) {
      expect(inv.status).toBeDefined();
      expect(inv.createdAt).toBeDefined();
    }
  });
});

describe('InvitationService – cancel', () => {
  let db: Database.Database;
  let service: InvitationService;
  let adminId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    adminId = insertUser(db, { email: 'admin@example.test' }).id;
    service = new InvitationService(db);
  });

  afterEach(() => db.close());

  it('cancel() sets status to CANCELLED for a PENDING invitation', () => {
    const inv = service.create('newbie@example.test', adminId);
    const result = service.cancel(inv.token);
    expect(result).toBe('cancelled');
    const row = db
      .prepare<[string], { status: string }>(`SELECT status FROM invitations WHERE token = ?`)
      .get(inv.token);
    expect(row?.status).toBe('CANCELLED');
  });

  it('cancel() returns not-found for an unknown token', () => {
    expect(service.cancel('nonexistent-token')).toBe('not-found');
  });

  it('cancel() returns not-pending for a non-PENDING invitation', () => {
    const inv = service.create('newbie@example.test', adminId);
    service.cancel(inv.token);
    expect(service.cancel(inv.token)).toBe('not-pending');
  });
});

describe('InvitationService – resend', () => {
  let db: Database.Database;
  let service: InvitationService;
  let adminId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    adminId = insertUser(db, { email: 'admin@example.test' }).id;
    service = new InvitationService(db);
  });

  afterEach(() => db.close());

  it('resend() supersedes the old invitation and returns a fresh PENDING one', () => {
    const orig = service.create('newbie@example.test', adminId);
    const fresh = service.resend(orig.token, adminId);
    expect(fresh).not.toBeNull();
    expect(fresh!.status).toBe('PENDING');
    expect(fresh!.token).not.toBe(orig.token);
    const origRow = db
      .prepare<[string], { status: string }>(`SELECT status FROM invitations WHERE token = ?`)
      .get(orig.token);
    expect(origRow?.status).toBe('SUPERSEDED');
  });

  it('resend() returns not-found for an unknown token', () => {
    expect(service.resend('no-such-token', adminId)).toBe('not-found');
  });

  it('resend() returns not-pending for a non-PENDING invitation', () => {
    const inv = service.create('newbie@example.test', adminId);
    service.cancel(inv.token);
    expect(service.resend(inv.token, adminId)).toBe('not-pending');
  });
});
