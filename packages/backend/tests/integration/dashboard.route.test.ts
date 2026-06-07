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
    anonymize: number;
    cancellation_period_value: number | null;
    cancellation_period_unit: string | null;
  }> = {},
) {
  const row = {
    id: randomUUID(),
    user_id: ownerId,
    name: 'Test',
    category: 'SUBSCRIPTIONS',
    amount: 10.0,
    billing_interval: 'MONTHLY',
    status: 'ACTIVE',
    end_date: null,
    anonymize: 0,
    cancellation_period_value: null,
    cancellation_period_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  db.prepare(
    `INSERT INTO contracts (id, user_id, name, category, amount, billing_interval, status, end_date, anonymize, cancellation_period_value, cancellation_period_unit, created_at, updated_at)
     VALUES (@id, @user_id, @name, @category, @amount, @billing_interval, @status, @end_date, @anonymize, @cancellation_period_value, @cancellation_period_unit, @created_at, @updated_at)`,
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

  it('returns a valid DashboardResponse shape with empty data', async () => {
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    expect(res.statusCode).toBe(200);
    const body: unknown = res.json();
    expect(body).toMatchObject({
      totalMonthlySpending: 0,
      contractsByCategory: [],
      upcomingRenewals: [],
      expiredContracts: [],
    });
  });

  it('returns correct totalMonthlySpending for MONTHLY contracts (active only)', async () => {
    insertContract(db, ownerId, { amount: 100, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, ownerId, { amount: 50, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, ownerId, { amount: 999, billing_interval: 'MONTHLY', status: 'INACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(150, 2);
  });

  it('normalizes QUARTERLY contracts to monthly equivalent', async () => {
    // €30/quarter → €10/month
    insertContract(db, ownerId, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('normalizes YEARLY contracts to monthly equivalent', async () => {
    // €120/year → €10/month
    insertContract(db, ownerId, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('excludes LIFETIME contracts from totalMonthlySpending', async () => {
    insertContract(db, ownerId, { amount: 999, billing_interval: 'LIFETIME', status: 'ACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ totalMonthlySpending: number }>();
    expect(body.totalMonthlySpending).toBe(0);
  });

  it('returns contractsByCategory grouped by category with normalized totals', async () => {
    insertContract(db, ownerId, {
      category: 'HOUSING',
      amount: 1200,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, ownerId, {
      category: 'SUBSCRIPTIONS',
      amount: 15,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, ownerId, {
      category: 'SUBSCRIPTIONS',
      amount: 10,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
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

  it('returns upcomingRenewals for contracts in their action window (no cancellation period: 30-day default)', async () => {
    insertContract(db, ownerId, { name: 'Soon', end_date: daysFromNow(10), status: 'ACTIVE' });
    insertContract(db, ownerId, { name: 'Far', end_date: daysFromNow(60), status: 'ACTIVE' });
    insertContract(db, ownerId, { name: 'NoDate', end_date: null, status: 'ACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{
      upcomingRenewals: Array<{
        name: string;
        cancellationDeadline: string;
        daysUntilCancellationDeadline: number;
        endDate: string;
      }>;
    }>();
    expect(body.upcomingRenewals).toHaveLength(1);
    expect(body.upcomingRenewals[0]?.name).toBe('Soon');
    expect(body.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThanOrEqual(10);
    expect(body.upcomingRenewals[0]?.cancellationDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.upcomingRenewals[0]?.endDate).toBe(daysFromNow(10));
  });

  it('returns upcomingRenewals for contract with 3-month cancellation and 4-month end date', async () => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);
    const endDateStr = endDate.toISOString().slice(0, 10);
    insertContract(db, ownerId, {
      name: '3MonthCancellation',
      end_date: endDateStr,
      cancellation_period_value: 3,
      cancellation_period_unit: 'MONTHS',
    });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{
      upcomingRenewals: Array<{ name: string; daysUntilCancellationDeadline: number }>;
    }>();
    expect(body.upcomingRenewals).toHaveLength(1);
    expect(body.upcomingRenewals[0]?.name).toBe('3MonthCancellation');
    expect(body.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeGreaterThanOrEqual(25);
    expect(body.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThanOrEqual(35);
  });

  it('excludes LIFETIME contracts from upcomingRenewals even with imminent end_date', async () => {
    insertContract(db, ownerId, {
      name: 'Lifetime License',
      billing_interval: 'LIFETIME',
      end_date: daysFromNow(5),
      status: 'ACTIVE',
    });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ upcomingRenewals: Array<unknown> }>();
    expect(body.upcomingRenewals).toHaveLength(0);
  });

  it('returns expiredContracts for contracts with a past end_date', async () => {
    const pastDate = daysFromNow(-10);
    insertContract(db, ownerId, { name: 'Old Contract', end_date: pastDate, status: 'ACTIVE' });
    insertContract(db, ownerId, {
      name: 'Current Contract',
      end_date: daysFromNow(10),
      status: 'ACTIVE',
    });
    insertContract(db, ownerId, { name: 'No Date', end_date: null, status: 'ACTIVE' });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{
      expiredContracts: Array<{ name: string; daysOverdue: number; endDate: string }>;
    }>();
    expect(body.expiredContracts).toHaveLength(1);
    expect(body.expiredContracts[0]?.name).toBe('Old Contract');
    expect(body.expiredContracts[0]?.daysOverdue).toBe(10);
    expect(body.expiredContracts[0]?.endDate).toBe(pastDate);
  });

  it('excludes LIFETIME contracts from expiredContracts even with a past end_date', async () => {
    insertContract(db, ownerId, {
      name: 'Lifetime Old',
      billing_interval: 'LIFETIME',
      end_date: daysFromNow(-5),
      status: 'ACTIVE',
    });
    const res = await inject({ method: 'GET', url: '/api/dashboard' });
    const body = res.json<{ expiredContracts: Array<unknown> }>();
    expect(body.expiredContracts).toHaveLength(0);
  });
});

describe('Cross-account dashboard isolation', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let userA: string;
  let userB: string;
  let sessionA: string;
  let sessionB: string;

  function injectAs(sessionCookie: string, opts: InjectOptions) {
    return app.inject({ ...opts, cookies: { [SESSION_COOKIE_NAME]: sessionCookie } });
  }

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
    ({ userId: userA, sessionId: sessionA } = createAuthenticatedSession(db, {
      email: 'dash-a@example.test',
    }));
    ({ userId: userB, sessionId: sessionB } = createAuthenticatedSession(db, {
      email: 'dash-b@example.test',
    }));
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it("totalMonthlySpending and contractsByCategory reflect only the signed-in user's contracts", async () => {
    insertContract(db, userA, {
      name: 'A Subscription',
      category: 'SUBSCRIPTIONS',
      amount: 100,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, userB, {
      name: 'B Housing',
      category: 'HOUSING',
      amount: 1000,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });

    const resA = await injectAs(sessionA, { method: 'GET', url: '/api/dashboard' });
    const bodyA = resA.json<{
      totalMonthlySpending: number;
      contractsByCategory: Array<{ category: string; count: number }>;
    }>();
    expect(bodyA.totalMonthlySpending).toBeCloseTo(100, 2);
    expect(bodyA.contractsByCategory).toHaveLength(1);
    expect(bodyA.contractsByCategory[0]?.category).toBe('SUBSCRIPTIONS');

    const resB = await injectAs(sessionB, { method: 'GET', url: '/api/dashboard' });
    const bodyB = resB.json<{
      totalMonthlySpending: number;
      contractsByCategory: Array<{ category: string; count: number }>;
    }>();
    expect(bodyB.totalMonthlySpending).toBeCloseTo(1000, 2);
    expect(bodyB.contractsByCategory).toHaveLength(1);
    expect(bodyB.contractsByCategory[0]?.category).toBe('HOUSING');
  });

  it("upcomingRenewals and expiredContracts panels never include another user's contracts", async () => {
    insertContract(db, userA, {
      name: 'A Renewal',
      end_date: daysFromNow(10),
      status: 'ACTIVE',
    });
    insertContract(db, userA, {
      name: 'A Expired',
      end_date: daysFromNow(-10),
      status: 'ACTIVE',
    });
    insertContract(db, userB, {
      name: 'B Renewal',
      end_date: daysFromNow(5),
      status: 'ACTIVE',
    });
    insertContract(db, userB, {
      name: 'B Expired',
      end_date: daysFromNow(-5),
      status: 'ACTIVE',
    });

    const resA = await injectAs(sessionA, { method: 'GET', url: '/api/dashboard' });
    const bodyA = resA.json<{
      upcomingRenewals: Array<{ name: string }>;
      expiredContracts: Array<{ name: string }>;
    }>();
    expect(bodyA.upcomingRenewals.map((c) => c.name)).toEqual(['A Renewal']);
    expect(bodyA.expiredContracts.map((c) => c.name)).toEqual(['A Expired']);

    const resB = await injectAs(sessionB, { method: 'GET', url: '/api/dashboard' });
    const bodyB = resB.json<{
      upcomingRenewals: Array<{ name: string }>;
      expiredContracts: Array<{ name: string }>;
    }>();
    expect(bodyB.upcomingRenewals.map((c) => c.name)).toEqual(['B Renewal']);
    expect(bodyB.expiredContracts.map((c) => c.name)).toEqual(['B Expired']);
  });

  it("an account with no contracts sees an entirely empty dashboard regardless of other accounts' data", async () => {
    insertContract(db, userA, {
      name: 'A Only',
      amount: 500,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
      end_date: daysFromNow(10),
    });

    const resB = await injectAs(sessionB, { method: 'GET', url: '/api/dashboard' });
    const bodyB = resB.json<{
      totalMonthlySpending: number;
      contractsByCategory: Array<unknown>;
      upcomingRenewals: Array<unknown>;
      expiredContracts: Array<unknown>;
    }>();
    expect(bodyB).toMatchObject({
      totalMonthlySpending: 0,
      contractsByCategory: [],
      upcomingRenewals: [],
      expiredContracts: [],
    });
  });
});
