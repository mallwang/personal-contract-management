import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

function insertContract(
  db: Database.Database,
  ownerId: string,
  overrides: Partial<{
    id: string;
    name: string;
    category: string;
    amount: number;
    billing_interval: string;
    status: string;
    end_date: string | null;
  }> = {},
) {
  const row = {
    id: randomUUID(),
    user_id: ownerId,
    name: 'Test Contract',
    category: 'SUBSCRIPTIONS',
    amount: 10.0,
    billing_interval: 'MONTHLY',
    status: 'ACTIVE',
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  db.prepare(
    `INSERT INTO contracts (id, user_id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
     VALUES (@id, @user_id, @name, @category, @amount, @billing_interval, @status, @end_date, @created_at, @updated_at)`,
  ).run(row);
  return row;
}

describe('GET /api/contracts', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;
  let ownerId: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: ownerId, sessionId: sessionCookie } = createAuthenticatedSession(db));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with empty array when no contracts exist', async () => {
    const res = await inject({ method: 'GET', url: '/api/contracts' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns all contracts with correct camelCase fields', async () => {
    insertContract(db, ownerId, {
      name: 'Netflix',
      amount: 15.99,
      billing_interval: 'MONTHLY',
      category: 'SUBSCRIPTIONS',
    });
    const res = await inject({ method: 'GET', url: '/api/contracts' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<Record<string, unknown>>>();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      name: 'Netflix',
      category: 'SUBSCRIPTIONS',
      amount: 15.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    expect(body[0]?.id).toBeTruthy();
    expect(body[0]?.createdAt).toBeTruthy();
    expect(body[0]?.updatedAt).toBeTruthy();
    expect(body[0]).not.toHaveProperty('monthlyAmount');
  });

  it('returns null for new fields on contracts that were created without them', async () => {
    insertContract(db, ownerId, { name: 'Legacy' });
    const res = await inject({ method: 'GET', url: '/api/contracts' });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<Record<string, unknown>>>();
    expect(body[0]?.startDate).toBeNull();
    expect(body[0]?.details).toBeNull();
    expect(body[0]?.serviceUrl).toBeNull();
    expect(body[0]?.cancellationPeriod).toBeNull();
  });

  it('returns contracts sorted by name ascending', async () => {
    insertContract(db, ownerId, { name: 'Zebra' });
    insertContract(db, ownerId, { name: 'Apple' });
    const res = await inject({ method: 'GET', url: '/api/contracts' });
    const body = res.json<Array<{ name: string }>>();
    expect(body[0]?.name).toBe('Apple');
    expect(body[1]?.name).toBe('Zebra');
  });
});

describe('POST /api/contracts', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;
  let ownerId: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: ownerId, sessionId: sessionCookie } = createAuthenticatedSession(db));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('creates a contract and returns 201 with full contract body', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Netflix',
        category: 'SUBSCRIPTIONS',
        amount: 15.99,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<Record<string, unknown>>();
    expect(body.name).toBe('Netflix');
    expect(body.amount).toBe(15.99);
    expect(body.billingInterval).toBe('MONTHLY');
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.endDate).toBeNull();
    expect(body).not.toHaveProperty('monthlyAmount');
  });

  it('creates a contract with QUARTERLY billing interval', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Adobe CC',
        category: 'SUBSCRIPTIONS',
        amount: 60,
        billingInterval: 'QUARTERLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<Record<string, unknown>>().billingInterval).toBe('QUARTERLY');
  });

  it('returns 400 when name is missing', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        category: 'SUBSCRIPTIONS',
        amount: 10,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when billingInterval is missing', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Bad', category: 'OTHER', amount: 10, status: 'ACTIVE' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Bad',
        category: 'OTHER',
        amount: -5,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when billingInterval is invalid', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Bad',
        category: 'OTHER',
        amount: 10,
        billingInterval: 'DAILY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when monthlyAmount is sent instead of amount', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Old Client', category: 'OTHER', monthlyAmount: 10, status: 'ACTIVE' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates a contract with all four new fields and returns them in the 201 response', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Spotify',
        category: 'SUBSCRIPTIONS',
        amount: 9.99,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
        startDate: '2024-03-01',
        details: 'Auto-renews annually',
        serviceUrl: 'https://spotify.com',
        cancellationPeriod: { value: 30, unit: 'DAYS' },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<Record<string, unknown>>();
    expect(body.startDate).toBe('2024-03-01');
    expect(body.details).toBe('Auto-renews annually');
    expect(body.serviceUrl).toBe('https://spotify.com');
    expect(body.cancellationPeriod).toEqual({ value: 30, unit: 'DAYS' });
  });

  it('creates a contract without new fields and returns null for each', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Basic',
        category: 'OTHER',
        amount: 5,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<Record<string, unknown>>();
    expect(body.startDate).toBeNull();
    expect(body.details).toBeNull();
    expect(body.serviceUrl).toBeNull();
    expect(body.cancellationPeriod).toBeNull();
  });

  it('returns 400 when serviceUrl is malformed', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Bad URL',
        category: 'OTHER',
        amount: 5,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
        serviceUrl: 'not-a-url',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when details exceeds 2000 characters', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Long Notes',
        category: 'OTHER',
        amount: 5,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
        details: 'x'.repeat(2001),
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when category is unknown', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Bad',
        category: 'INVALID',
        amount: 10,
        billingInterval: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/contracts/:id', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;
  let ownerId: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: ownerId, sessionId: sessionCookie } = createAuthenticatedSession(db));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('updates supplied fields and returns 200 with the full contract', async () => {
    const row = insertContract(db, ownerId, {
      name: 'Old Name',
      amount: 10,
      billing_interval: 'MONTHLY',
    });
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { name: 'New Name', amount: 20 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body.name).toBe('New Name');
    expect(body.amount).toBe(20);
    expect(body.billingInterval).toBe('MONTHLY');
    expect(body.category).toBe('SUBSCRIPTIONS');
  });

  it('updates billingInterval', async () => {
    const row = insertContract(db, ownerId, { billing_interval: 'MONTHLY' });
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { billingInterval: 'YEARLY' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>().billingInterval).toBe('YEARLY');
  });

  it('returns 404 when the contract does not exist', async () => {
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/00000000-0000-0000-0000-000000000000`,
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when body is empty', async () => {
    const row = insertContract(db, ownerId);
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('updates cancellationPeriod and returns the new value', async () => {
    const row = insertContract(db, ownerId);
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { cancellationPeriod: { value: 14, unit: 'WEEKS' } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>().cancellationPeriod).toEqual({
      value: 14,
      unit: 'WEEKS',
    });
  });

  it('clears cancellationPeriod when set to null', async () => {
    // First set it
    const row = insertContract(db, ownerId);
    await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { cancellationPeriod: { value: 30, unit: 'DAYS' } },
    });
    // Then clear it
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { cancellationPeriod: null },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>().cancellationPeriod).toBeNull();
  });

  it('returns 400 when serviceUrl in PUT is malformed', async () => {
    const row = insertContract(db, ownerId);
    const res = await inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { serviceUrl: 'not-a-url' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/contracts/:id', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;
  let ownerId: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: ownerId, sessionId: sessionCookie } = createAuthenticatedSession(db));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('deletes the contract and returns 204 with empty body', async () => {
    const row = insertContract(db, ownerId);
    const res = await inject({
      method: 'DELETE',
      url: `/api/contracts/${row.id}`,
    });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });

  it('returns 404 when the contract does not exist', async () => {
    const res = await inject({
      method: 'DELETE',
      url: `/api/contracts/00000000-0000-0000-0000-000000000000`,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('anonymize field – GET /api/contracts', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionCookie: string;
  let ownerId: string;

  function inject(opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: ownerId, sessionId: sessionCookie } = createAuthenticatedSession(db));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('GET response includes anonymize=false by default', async () => {
    await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Test', category: 'OTHER', amount: 1, billingInterval: 'MONTHLY' },
    });
    const res = await inject({ method: 'GET', url: '/api/contracts' });
    const body = res.json<Array<Record<string, unknown>>>();
    expect(body[0]).toHaveProperty('anonymize', false);
  });

  it('POST with anonymize=true stores and returns anonymize=true', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: {
        name: 'Secret',
        category: 'OTHER',
        amount: 5,
        billingInterval: 'MONTHLY',
        anonymize: true,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<Record<string, unknown>>()).toHaveProperty('anonymize', true);
  });

  it('PUT /api/contracts/:id patches anonymize field', async () => {
    const created = await inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Test', category: 'OTHER', amount: 1, billingInterval: 'MONTHLY' },
    });
    const id = created.json<Record<string, unknown>>().id as string;

    const updated = await inject({
      method: 'PUT',
      url: `/api/contracts/${id}`,
      payload: { anonymize: true },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json<Record<string, unknown>>()).toHaveProperty('anonymize', true);
  });
});

describe('Cross-account contract isolation', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let sessionA: string;
  let sessionB: string;
  let userA: string;
  let userB: string;

  function injectAs(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: userA, sessionId: sessionA } = createAuthenticatedSession(db, {
      email: 'a@example.test',
    }));
    ({ userId: userB, sessionId: sessionB } = createAuthenticatedSession(db, {
      email: 'b@example.test',
    }));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('GET /api/contracts never returns another user’s contracts', async () => {
    insertContract(db, userA, { name: 'A Contract' });
    insertContract(db, userB, { name: 'B Contract' });

    const asA = await injectAs(sessionA, { method: 'GET', url: '/api/contracts' });
    const bodyA = asA.json<Array<Record<string, unknown>>>();
    expect(bodyA.map((c) => c.name)).toEqual(['A Contract']);
    expect(bodyA.every((c) => !('user_id' in c) && !('userId' in c))).toBe(true);

    const asB = await injectAs(sessionB, { method: 'GET', url: '/api/contracts' });
    const bodyB = asB.json<Array<Record<string, unknown>>>();
    expect(bodyB.map((c) => c.name)).toEqual(['B Contract']);
  });

  it('POST /api/contracts stamps user_id with the authenticated user’s id', async () => {
    const res = await injectAs(sessionA, {
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Mine', category: 'OTHER', amount: 5, billingInterval: 'MONTHLY' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<Record<string, unknown>>();
    expect(body).not.toHaveProperty('user_id');
    expect(body).not.toHaveProperty('userId');

    const row = db.prepare(`SELECT user_id FROM contracts WHERE id = ?`).get(body.id as string) as {
      user_id: string;
    };
    expect(row.user_id).toBe(userA);

    const asB = await injectAs(sessionB, { method: 'GET', url: '/api/contracts' });
    expect(asB.json<Array<Record<string, unknown>>>()).toEqual([]);
  });

  it('GET/PUT/DELETE return 404 (not 403) for another user’s contract id', async () => {
    const contractOfA = insertContract(db, userA, { name: 'A Contract' });

    const putRes = await injectAs(sessionB, {
      method: 'PUT',
      url: `/api/contracts/${contractOfA.id}`,
      payload: { name: 'Hijacked' },
    });
    expect(putRes.statusCode).toBe(404);

    const deleteRes = await injectAs(sessionB, {
      method: 'DELETE',
      url: `/api/contracts/${contractOfA.id}`,
    });
    expect(deleteRes.statusCode).toBe(404);

    // Confirm the contract is untouched and still belongs to A
    const stillThere = db
      .prepare(`SELECT name, user_id FROM contracts WHERE id = ?`)
      .get(contractOfA.id) as {
      name: string;
      user_id: string;
    };
    expect(stillThere).toEqual({ name: 'A Contract', user_id: userA });
  });

  it('PUT /api/contracts/:id by the owner still succeeds (sanity check for the 404 mapping above)', async () => {
    const contract = insertContract(db, userA, { name: 'Old Name' });
    const res = await injectAs(sessionA, {
      method: 'PUT',
      url: `/api/contracts/${contract.id}`,
      payload: { name: 'New Name' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>().name).toBe('New Name');
  });
});
