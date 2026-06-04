import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { DashboardService } from '../../src/services/dashboard.js';

function makeDb(): Database.Database {
  const db = createDb(':memory:');
  runMigrations(db);
  return db;
}

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
    id: crypto.randomUUID(),
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

// ──────────────────────────────────────────────────────────────────────────────
// Total Monthly Spending
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – totalMonthlySpending', () => {
  let db: Database.Database;
  let service: DashboardService;

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns 0 when there are no contracts', () => {
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });

  it('sums MONTHLY amounts of active contracts only', () => {
    insertContract(db, { amount: 100, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 50, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 999, billing_interval: 'MONTHLY', status: 'INACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(150, 2);
  });

  it('normalizes WEEKLY amount to monthly equivalent (×52/12)', () => {
    // 12 per week × 52/12 = 52 per month
    insertContract(db, { amount: 12, billing_interval: 'WEEKLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(12 * (52 / 12), 2);
  });

  it('normalizes QUARTERLY amount to monthly equivalent (×1/3)', () => {
    // 30 per quarter = 10 per month
    insertContract(db, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('normalizes YEARLY amount to monthly equivalent (×1/12)', () => {
    // 120 per year = 10 per month
    insertContract(db, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('contributes 0 for LIFETIME contracts (excluded from recurring totals)', () => {
    insertContract(db, { amount: 999, billing_interval: 'LIFETIME', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });

  it('combines multiple intervals correctly', () => {
    // QUARTERLY €30 → €10/mo, YEARLY €120 → €10/mo, total = €20
    insertContract(db, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    insertContract(db, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(20, 2);
  });

  it('treats a contract with amount 0 as zero contribution', () => {
    insertContract(db, { amount: 0, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Contracts by Category
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – contractsByCategory', () => {
  let db: Database.Database;
  let service: DashboardService;

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns empty array when there are no active contracts', () => {
    insertContract(db, { status: 'INACTIVE', category: 'HOUSING' });
    const result = service.getDashboardData();
    expect(result.contractsByCategory).toEqual([]);
  });

  it('groups active contracts by category with correct count and normalized total', () => {
    // 2 subscriptions: €10/mo + €30/quarter → €10+€10 = €20/mo
    insertContract(db, { category: 'SUBSCRIPTIONS', amount: 10, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { category: 'SUBSCRIPTIONS', amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    insertContract(db, { category: 'HOUSING', amount: 1000, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { category: 'HOUSING', amount: 999, billing_interval: 'MONTHLY', status: 'INACTIVE' });
    const result = service.getDashboardData();
    const subs = result.contractsByCategory.find((c) => c.category === 'SUBSCRIPTIONS');
    const housing = result.contractsByCategory.find((c) => c.category === 'HOUSING');
    expect(subs).toBeDefined();
    expect(subs?.count).toBe(2);
    expect(subs?.monthlyTotal).toBeCloseTo(20, 2);
    expect(housing).toBeDefined();
    expect(housing?.count).toBe(1);
    expect(housing?.monthlyTotal).toBe(1000);
  });

  it('excludes LIFETIME contracts from category monthly totals', () => {
    insertContract(db, { category: 'OTHER', amount: 999, billing_interval: 'LIFETIME', status: 'ACTIVE' });
    insertContract(db, { category: 'OTHER', amount: 20, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    const other = result.contractsByCategory.find((c) => c.category === 'OTHER');
    expect(other?.monthlyTotal).toBeCloseTo(20, 2);
    expect(other?.count).toBe(2);
  });

  it('excludes categories that have no active contracts', () => {
    insertContract(db, { category: 'OTHER', status: 'INACTIVE' });
    const result = service.getDashboardData();
    const other = result.contractsByCategory.find((c) => c.category === 'OTHER');
    expect(other).toBeUndefined();
  });

  it('includes the human-readable label for each category', () => {
    insertContract(db, { category: 'UTILITIES', status: 'ACTIVE', amount: 50, billing_interval: 'MONTHLY' });
    const result = service.getDashboardData();
    const utilities = result.contractsByCategory.find((c) => c.category === 'UTILITIES');
    expect(utilities?.label).toBe('Utilities');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Upcoming Renewals
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – upcomingRenewals', () => {
  let db: Database.Database;
  let service: DashboardService;

  function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns empty array when no contracts have an end_date', () => {
    insertContract(db, { end_date: null, status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toEqual([]);
  });

  it('returns contracts whose end_date is within 30 days', () => {
    insertContract(db, { name: 'Soon', end_date: daysFromNow(10), status: 'ACTIVE' });
    insertContract(db, { name: 'Far', end_date: daysFromNow(60), status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    expect(result.upcomingRenewals[0]?.name).toBe('Soon');
  });

  it('sorts renewals ascending by end_date', () => {
    insertContract(db, { name: 'Later', end_date: daysFromNow(25), status: 'ACTIVE' });
    insertContract(db, { name: 'Sooner', end_date: daysFromNow(5), status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.name).toBe('Sooner');
    expect(result.upcomingRenewals[1]?.name).toBe('Later');
  });

  it('computes daysRemaining correctly', () => {
    insertContract(db, { name: 'In7Days', end_date: daysFromNow(7), status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.daysRemaining).toBe(7);
  });

  it('includes contracts regardless of status if end_date is within 30 days', () => {
    insertContract(db, { name: 'Inactive but soon', end_date: daysFromNow(3), status: 'INACTIVE' });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
  });

  it('excludes LIFETIME contracts from upcoming renewals even with imminent end_date', () => {
    insertContract(db, {
      name: 'Lifetime Soon',
      billing_interval: 'LIFETIME',
      end_date: daysFromNow(7),
      status: 'ACTIVE',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });
});
