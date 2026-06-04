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
    name: 'Test',
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
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('GET /api/dashboard', () => {
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

  it('returns a valid DashboardResponse shape with empty data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(res.statusCode).toBe(200);
    const body: unknown = res.json();
    expect(body).toMatchObject({
      totalMonthlySpending: 0,
      contractsByCategory: [],
      upcomingRenewals: [],
    });
  });

  it('returns correct totalMonthlySpending for MONTHLY contracts (active only)', async () => {
    insertContract(db, { amount: 100, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 50, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 999, billing_interval: 'MONTHLY', status: 'INACTIVE' });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(150, 2);
  });

  it('normalizes QUARTERLY contracts to monthly equivalent', async () => {
    // €30/quarter → €10/month
    insertContract(db, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('normalizes YEARLY contracts to monthly equivalent', async () => {
    // €120/year → €10/month
    insertContract(db, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('excludes LIFETIME contracts from totalMonthlySpending', async () => {
    insertContract(db, { amount: 999, billing_interval: 'LIFETIME', status: 'ACTIVE' });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBe(0);
  });

  it('returns contractsByCategory grouped by category with normalized totals', async () => {
    insertContract(db, {
      category: 'HOUSING',
      amount: 1200,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'SUBSCRIPTIONS',
      amount: 15,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'SUBSCRIPTIONS',
      amount: 10,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{
      contractsByCategory: Array<{
        category: string;
        count: number;
        monthlyTotal: number;
        label: string;
      }>;
    }>();
    const housing = body.contractsByCategory.find((c) => c.category === 'HOUSING');
    const subs = body.contractsByCategory.find((c) => c.category === 'SUBSCRIPTIONS');
    expect(housing?.count).toBe(1);
    expect(housing?.monthlyTotal).toBe(1200);
    expect(housing?.label).toBe('Housing');
    expect(subs?.count).toBe(2);
    expect(subs?.monthlyTotal).toBeCloseTo(25, 2);
  });

  it('returns upcomingRenewals for contracts expiring within 30 days', async () => {
    insertContract(db, { name: 'Soon', end_date: daysFromNow(10), status: 'ACTIVE' });
    insertContract(db, { name: 'Far', end_date: daysFromNow(60), status: 'ACTIVE' });
    insertContract(db, { name: 'NoDate', end_date: null, status: 'ACTIVE' });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ upcomingRenewals: Array<{ name: string; daysRemaining: number }> }>();
    expect(body.upcomingRenewals).toHaveLength(1);
    expect(body.upcomingRenewals[0]?.name).toBe('Soon');
    expect(body.upcomingRenewals[0]?.daysRemaining).toBeLessThanOrEqual(10);
  });

  it('excludes LIFETIME contracts from upcomingRenewals even with imminent end_date', async () => {
    insertContract(db, {
      name: 'Lifetime License',
      billing_interval: 'LIFETIME',
      end_date: daysFromNow(5),
      status: 'ACTIVE',
    });
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ upcomingRenewals: Array<unknown> }>();
    expect(body.upcomingRenewals).toHaveLength(0);
  });
});
