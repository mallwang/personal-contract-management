import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer } from '../../src/server.js';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

function insertContract(
  db: Database.Database,
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
    `INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
     VALUES (@id, @name, @category, @amount, @billing_interval, @status, @end_date, @created_at, @updated_at)`,
  ).run(row);
  return row;
}

describe('GET /api/contracts', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with empty array when no contracts exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/contracts' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns all contracts with correct camelCase fields', async () => {
    insertContract(db, {
      name: 'Netflix',
      amount: 15.99,
      billing_interval: 'MONTHLY',
      category: 'SUBSCRIPTIONS',
    });
    const res = await app.inject({ method: 'GET', url: '/api/contracts' });
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

  it('returns contracts sorted by name ascending', async () => {
    insertContract(db, { name: 'Zebra' });
    insertContract(db, { name: 'Apple' });
    const res = await app.inject({ method: 'GET', url: '/api/contracts' });
    const body = res.json<Array<{ name: string }>>();
    expect(body[0]?.name).toBe('Apple');
    expect(body[1]?.name).toBe('Zebra');
  });
});

describe('POST /api/contracts', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('creates a contract and returns 201 with full contract body', async () => {
    const res = await app.inject({
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
    const res = await app.inject({
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
    const res = await app.inject({
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
    const res = await app.inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Bad', category: 'OTHER', amount: 10, status: 'ACTIVE' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await app.inject({
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
    const res = await app.inject({
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
    const res = await app.inject({
      method: 'POST',
      url: '/api/contracts',
      payload: { name: 'Old Client', category: 'OTHER', monthlyAmount: 10, status: 'ACTIVE' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when category is unknown', async () => {
    const res = await app.inject({
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

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('updates supplied fields and returns 200 with the full contract', async () => {
    const row = insertContract(db, { name: 'Old Name', amount: 10, billing_interval: 'MONTHLY' });
    const res = await app.inject({
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
    const row = insertContract(db, { billing_interval: 'MONTHLY' });
    const res = await app.inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: { billingInterval: 'YEARLY' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<Record<string, unknown>>().billingInterval).toBe('YEARLY');
  });

  it('returns 404 when the contract does not exist', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/contracts/00000000-0000-0000-0000-000000000000`,
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when body is empty', async () => {
    const row = insertContract(db);
    const res = await app.inject({
      method: 'PUT',
      url: `/api/contracts/${row.id}`,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/contracts/:id', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('deletes the contract and returns 204 with empty body', async () => {
    const row = insertContract(db);
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/contracts/${row.id}`,
    });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });

  it('returns 404 when the contract does not exist', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/contracts/00000000-0000-0000-0000-000000000000`,
    });
    expect(res.statusCode).toBe(404);
  });
});
