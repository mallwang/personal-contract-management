import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import { MailerError } from '../../src/services/mailer.service.js';

function makeStubMailer(failWith?: Error): MailerService {
  return {
    sendInvitationEmail: failWith
      ? async () => {
          throw new MailerError(failWith.message);
        }
      : async () => {
          /* no-op */
        },
  } as unknown as MailerService;
}

async function setup(mailer?: MailerService) {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db, { mailer: mailer ?? makeStubMailer() });
  await app.ready();
  const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
  const member = createAuthenticatedSession(db, { role: 'MEMBER', email: 'member@example.test' });
  return { db, app, adminCookie: admin.sessionId, memberCookie: member.sessionId };
}

describe('POST /api/invitations', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  function inject(sessionCookie: string | null, opts: InjectOptions) {
    if (sessionCookie === null) return app.inject(opts);
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    ({ db, app, adminCookie, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 201 with invitation data when mailer succeeds', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'newbie@example.test' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ token: string; email: string; status: string }>();
    expect(body.email).toBe('newbie@example.test');
    expect(body.status).toBe('PENDING');
    expect(body.token).toBeTruthy();
  });

  it('returns 400 for a malformed email', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when email already has an account', async () => {
    const res = await inject(adminCookie, {
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'member@example.test' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 502 and rolls back when mailer fails (no lingering PENDING row)', async () => {
    const {
      db: failDb,
      app: failApp,
      adminCookie: failAdmin,
    } = await setup(makeStubMailer(new Error('SMTP error')));
    try {
      const res = await failApp.inject({
        method: 'POST',
        url: '/api/invitations',
        payload: { email: 'fail@example.test' },
        cookies: { [SESSION_COOKIE_NAME]: failAdmin },
      });
      expect(res.statusCode).toBe(502);
      const count = failDb
        .prepare<
          [],
          { n: number }
        >(`SELECT COUNT(*) AS n FROM invitations WHERE email = 'fail@example.test'`)
        .get()!;
      expect(count.n).toBe(0);
    } finally {
      await failApp.close();
      failDb.close();
    }
  });

  it('returns 403 for a non-admin', async () => {
    const res = await inject(memberCookie, {
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'newbie@example.test' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/invitations', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with array including status and createdAt for admin', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'x@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/invitations',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ email: string; status: string; createdAt: string }>>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]?.status).toBeDefined();
    expect(body[0]?.createdAt).toBeDefined();
  });

  it('returns 403 for non-admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/invitations',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('DELETE /api/invitations/:token', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204 and cancels a PENDING invitation', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'cancel@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const token = create.json<{ token: string }>().token;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/invitations/${token}`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/invitations/no-such-token',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when invitation is not PENDING', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'cancel2@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const token = create.json<{ token: string }>().token;
    await app.inject({
      method: 'DELETE',
      url: `/api/invitations/${token}`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const res2 = await app.inject({
      method: 'DELETE',
      url: `/api/invitations/${token}`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res2.statusCode).toBe(409);
  });

  it('returns 403 for non-admin', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/invitations/${randomUUID()}`,
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/invitations/:token/resend', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 201 with a fresh invitation and supersedes the old one', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'resend@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const token = create.json<{ token: string }>().token;

    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/resend`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ token: string; status: string }>();
    expect(body.status).toBe('PENDING');
    expect(body.token).not.toBe(token);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/invitations/no-such-token/resend',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 502 when mailer fails on resend', async () => {
    const { app: failApp, adminCookie: failAdmin, db: failDb } = await setup(makeStubMailer());
    const create = await failApp.inject({
      method: 'POST',
      url: '/api/invitations',
      payload: { email: 'resend-fail@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: failAdmin },
    });
    const token = create.json<{ token: string }>().token;
    await failApp.close();
    failDb.close();

    const {
      app: failApp2,
      adminCookie: failAdmin2,
      db: failDb2,
    } = await setup(makeStubMailer(new Error('SMTP error')));
    try {
      const existing = failDb2
        .prepare(`SELECT token FROM invitations WHERE email = 'resend-fail@example.test'`)
        .get() as { token: string } | undefined;
      if (!existing) {
        failDb2
          .prepare(
            `INSERT INTO invitations (token, email, invited_by, status, expires_at, created_at)
             VALUES (?, 'resend-fail@example.test', (SELECT id FROM users WHERE role='ADMIN' LIMIT 1), 'PENDING', ?, ?)`,
          )
          .run(token, new Date(Date.now() + 7 * 86400000).toISOString(), new Date().toISOString());
      }
      const res = await failApp2.inject({
        method: 'POST',
        url: `/api/invitations/${token}/resend`,
        cookies: { [SESSION_COOKIE_NAME]: failAdmin2 },
      });
      expect(res.statusCode).toBe(502);
    } finally {
      await failApp2.close();
      failDb2.close();
    }
  });
});

describe('POST /api/invitations/:token/accept (public)', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  function insertPendingInvitation(
    email: string,
    options: { expired?: boolean; status?: string } = {},
  ) {
    const token = 'test-token-' + randomUUID();
    const adminRow = db
      .prepare<[], { id: string }>(`SELECT id FROM users WHERE role='ADMIN' LIMIT 1`)
      .get()!;
    const expiresAt = options.expired
      ? new Date(Date.now() - 1000).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();
    db.prepare(
      `INSERT INTO invitations (token, email, invited_by, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      token,
      email,
      adminRow.id,
      options.status ?? 'PENDING',
      expiresAt,
      new Date().toISOString(),
    );
    return token;
  }

  it('returns 200 with Set-Cookie and user identity when token is valid', async () => {
    const token = insertPendingInvitation('newmember@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeTruthy();
    const body = res.json<{ email: string; role: string }>();
    expect(body.email).toBe('newmember@example.test');
    expect(body.role).toBe('MEMBER');
  });

  it('does not require an authenticated session (public route)', async () => {
    const token = insertPendingInvitation('nologin@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 for a too-weak password and does not consume the token', async () => {
    const token = insertPendingInvitation('weak@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/accept`,
      payload: { password: 'short' },
    });
    expect(res.statusCode).toBe(400);
    const row = db
      .prepare<[string], { status: string }>(`SELECT status FROM invitations WHERE token = ?`)
      .get(token);
    expect(row?.status).toBe('PENDING');
    const userCount = db
      .prepare<
        [],
        { n: number }
      >(`SELECT COUNT(*) AS n FROM users WHERE email = 'weak@example.test'`)
      .get()!;
    expect(userCount.n).toBe(0);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/invitations/nonexistent-token/accept',
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 410 with "already used" message for an ACCEPTED token', async () => {
    const token = insertPendingInvitation('alreadyused@example.test', { status: 'ACCEPTED' });
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(410);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('already');
  });

  it('returns 410 with "expired" message for a PENDING but expired token', async () => {
    const token = insertPendingInvitation('expired@example.test', { expired: true });
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${token}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(410);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('expired');
  });

  it('returns 410 with "no longer valid" message for CANCELLED/SUPERSEDED tokens', async () => {
    const cancelled = insertPendingInvitation('cancelled@example.test', { status: 'CANCELLED' });
    const res = await app.inject({
      method: 'POST',
      url: `/api/invitations/${cancelled}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(410);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('no longer valid');
  });

  it('creates no user row in any rejection case (SC-003)', async () => {
    const token1 = insertPendingInvitation('sc003a@example.test', { status: 'ACCEPTED' });
    const token2 = insertPendingInvitation('sc003b@example.test', { expired: true });
    await app.inject({
      method: 'POST',
      url: `/api/invitations/${token1}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    await app.inject({
      method: 'POST',
      url: `/api/invitations/${token2}/accept`,
      payload: { password: 'a-strong-passphrase-1' },
    });
    for (const email of ['sc003a@example.test', 'sc003b@example.test']) {
      const count = db
        .prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM users WHERE email = ?`)
        .get(email)!;
      expect(count.n).toBe(0);
    }
  });
});
