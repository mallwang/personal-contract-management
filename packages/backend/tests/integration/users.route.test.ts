import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { hashPassword } from '../../src/services/password.js';
import { createAuthenticatedSession } from '../helpers/auth.js';

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

describe('GET /api/users', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  function inject(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    app = await buildServer(db);
    await app.ready();
    adminCookie = createAuthenticatedSession(db, {
      role: 'ADMIN',
      email: 'admin@example.test',
    }).sessionId;
    memberCookie = createAuthenticatedSession(db, {
      role: 'MEMBER',
      email: 'member@example.test',
    }).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with every account (active and archived) for an admin', async () => {
    insertUser(db, {
      email: 'archived@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    const res = await inject(adminCookie, { method: 'GET', url: '/api/users' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ email: string; status: string }>>();
    const emails = body.map((u) => u.email);
    expect(emails).toContain('admin@example.test');
    expect(emails).toContain('member@example.test');
    expect(emails).toContain('archived@example.test');
    const archived = body.find((u) => u.email === 'archived@example.test');
    expect(archived?.status).toBe('ARCHIVED');
  });

  it('returns 403 for a non-admin', async () => {
    const res = await inject(memberCookie, { method: 'GET', url: '/api/users' });
    expect(res.statusCode).toBe(403);
    const body = res.json<{ error: string; message: string }>();
    expect(body.error).toBe('Forbidden');
    expect(body.message.toLowerCase()).toContain('administrator');
  });
});

describe('POST /api/users', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  function inject(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    app = await buildServer(db);
    await app.ready();
    adminCookie = createAuthenticatedSession(db, {
      role: 'ADMIN',
      email: 'admin@example.test',
    }).sessionId;
    memberCookie = createAuthenticatedSession(db, {
      role: 'MEMBER',
      email: 'member@example.test',
    }).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 201 and creates an active account with a hashed password', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'newbie@example.test',
        displayName: 'Newbie',
        role: 'MEMBER',
        initialPassword: 'a-strong-password',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{
      id: string;
      email: string;
      displayName: string;
      role: string;
      status: string;
    }>();
    expect(body).toMatchObject({
      email: 'newbie@example.test',
      displayName: 'Newbie',
      role: 'MEMBER',
      status: 'ACTIVE',
    });
    expect(body).not.toHaveProperty('initialPassword');
    expect(body).not.toHaveProperty('passwordHash');

    const row = db
      .prepare<
        [string],
        { password_hash: string; password_salt: string }
      >(`SELECT password_hash, password_salt FROM users WHERE id = ?`)
      .get(body.id);
    expect(row?.password_hash).not.toBe('a-strong-password');
    expect(row?.password_salt).toBeTruthy();
  });

  it('returns 400 for an invalid body (bad email, blank display name, weak password)', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/users',
      payload: { email: 'not-an-email', displayName: '', role: 'MEMBER', initialPassword: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when the email is already in use by an active account', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'member@example.test',
        displayName: 'Duplicate',
        role: 'MEMBER',
        initialPassword: 'a-strong-password',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 409 when the email is already in use by an archived account', async () => {
    insertUser(db, {
      email: 'gone@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'gone@example.test',
        displayName: 'Duplicate',
        role: 'MEMBER',
        initialPassword: 'a-strong-password',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 403 for a non-admin', async () => {
    const res = await inject(memberCookie, {
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'newbie@example.test',
        displayName: 'Newbie',
        role: 'MEMBER',
        initialPassword: 'a-strong-password',
      },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/users/:id/archive', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let adminId: string;
  let memberCookie: string;

  function inject(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    app = await buildServer(db);
    await app.ready();
    const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
    adminCookie = admin.sessionId;
    adminId = admin.userId;
    memberCookie = createAuthenticatedSession(db, {
      role: 'MEMBER',
      email: 'member@example.test',
    }).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it("returns 204, sets status=ARCHIVED with archived_at, and deletes the account's sessions", async () => {
    const target = insertUser(db, { email: 'leaving@example.test' });
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), target.id, now, now, now);

    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${target.id}/archive`,
    });
    expect(res.statusCode).toBe(204);

    const row = db
      .prepare<
        [string],
        { status: string; archived_at: string | null }
      >(`SELECT status, archived_at FROM users WHERE id = ?`)
      .get(target.id);
    expect(row?.status).toBe('ARCHIVED');
    expect(row?.archived_at).toBeTruthy();

    const sessionCount = db
      .prepare<
        [string],
        { count: number }
      >(`SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?`)
      .get(target.id);
    expect(sessionCount?.count).toBe(0);
  });

  it('returns 404 for an unknown account id', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${randomUUID()}/archive`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when archiving would remove the last active administrator', async () => {
    const res = await inject(adminCookie, { method: 'POST', url: `/api/users/${adminId}/archive` });
    expect(res.statusCode).toBe(409);
    const row = db
      .prepare<[string], { status: string }>(`SELECT status FROM users WHERE id = ?`)
      .get(adminId);
    expect(row?.status).toBe('ACTIVE');
  });

  it('returns 403 for a non-admin', async () => {
    const target = insertUser(db);
    const res = await inject(memberCookie, {
      method: 'POST',
      url: `/api/users/${target.id}/archive`,
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/users/:id/reactivate', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;

  function inject(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    app = await buildServer(db);
    await app.ready();
    adminCookie = createAuthenticatedSession(db, {
      role: 'ADMIN',
      email: 'admin@example.test',
    }).sessionId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204, restores status=ACTIVE, clears archived_at, and keeps original contracts intact', async () => {
    const target = insertUser(db, { status: 'ARCHIVED', archivedAt: new Date().toISOString() });
    const now = new Date().toISOString();
    const contractId = randomUUID();
    db.prepare(
      `INSERT INTO contracts (id, user_id, name, category, amount, billing_interval, status, anonymize, created_at, updated_at)
       VALUES (?, ?, 'Kept Contract', 'SUBSCRIPTIONS', 9.99, 'MONTHLY', 'ACTIVE', 0, ?, ?)`,
    ).run(contractId, target.id, now, now);

    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${target.id}/reactivate`,
    });
    expect(res.statusCode).toBe(204);

    const row = db
      .prepare<
        [string],
        { status: string; archived_at: string | null }
      >(`SELECT status, archived_at FROM users WHERE id = ?`)
      .get(target.id);
    expect(row?.status).toBe('ACTIVE');
    expect(row?.archived_at).toBeNull();

    const contract = db
      .prepare<
        [string],
        { id: string; name: string }
      >(`SELECT id, name FROM contracts WHERE user_id = ?`)
      .get(target.id);
    expect(contract).toMatchObject({ id: contractId, name: 'Kept Contract' });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${randomUUID()}/reactivate`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when the account is not currently archived', async () => {
    const target = insertUser(db, { status: 'ACTIVE' });
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${target.id}/reactivate`,
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/users/:id/role', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let adminId: string;

  function inject(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    app = await buildServer(db);
    await app.ready();
    const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
    adminCookie = admin.sessionId;
    adminId = admin.userId;
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204 and changes the role', async () => {
    const target = insertUser(db, { role: 'MEMBER' });
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${target.id}/role`,
      payload: { role: 'ADMIN' },
    });
    expect(res.statusCode).toBe(204);
    const row = db
      .prepare<[string], { role: string }>(`SELECT role FROM users WHERE id = ?`)
      .get(target.id);
    expect(row?.role).toBe('ADMIN');
  });

  it('returns 409 when demoting the last remaining active administrator', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${adminId}/role`,
      payload: { role: 'MEMBER' },
    });
    expect(res.statusCode).toBe(409);
    const row = db
      .prepare<[string], { role: string }>(`SELECT role FROM users WHERE id = ?`)
      .get(adminId);
    expect(row?.role).toBe('ADMIN');
  });

  it('allows demoting an admin when another active admin remains', async () => {
    const secondAdmin = insertUser(db, { role: 'ADMIN', email: 'second-admin@example.test' });
    const res = await inject(adminCookie, {
      method: 'POST',
      url: `/api/users/${secondAdmin.id}/role`,
      payload: { role: 'MEMBER' },
    });
    expect(res.statusCode).toBe(204);
  });
});
