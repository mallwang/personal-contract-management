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
    monthly_amount: number;
    status: string;
    end_date: string | null;
  }> = {},
) {
  const row = {
    id: crypto.randomUUID(),
    name: 'Test Contract',
    category: 'SUBSCRIPTIONS',
    monthly_amount: 10.0,
    status: 'ACTIVE',
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  db.prepare(
    `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
     VALUES (@id, @name, @category, @monthly_amount, @status, @end_date, @created_at, @updated_at)`,
  ).run(row);
  return row;
}

// ──────────────────────────────────────────────────────────────────────────────
// US1 — Total Monthly Spending
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

  it('sums monthly amounts of active contracts only', () => {
    insertContract(db, { monthly_amount: 100, status: 'ACTIVE' });
    insertContract(db, { monthly_amount: 50, status: 'ACTIVE' });
    insertContract(db, { monthly_amount: 999, status: 'INACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(150, 2);
  });

  it('treats a contract with monthly_amount 0 as zero contribution', () => {
    insertContract(db, { monthly_amount: 0, status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// US2 — Contracts by Category (tests written here to extend service in US2)
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

  it('groups active contracts by category with correct count and total', () => {
    insertContract(db, { category: 'SUBSCRIPTIONS', monthly_amount: 10, status: 'ACTIVE' });
    insertContract(db, { category: 'SUBSCRIPTIONS', monthly_amount: 20, status: 'ACTIVE' });
    insertContract(db, { category: 'HOUSING', monthly_amount: 1000, status: 'ACTIVE' });
    insertContract(db, { category: 'HOUSING', monthly_amount: 999, status: 'INACTIVE' });
    const result = service.getDashboardData();
    const subs = result.contractsByCategory.find((c) => c.category === 'SUBSCRIPTIONS');
    const housing = result.contractsByCategory.find((c) => c.category === 'HOUSING');
    expect(subs).toBeDefined();
    expect(subs?.count).toBe(2);
    expect(subs?.monthlyTotal).toBeCloseTo(30, 2);
    expect(housing).toBeDefined();
    expect(housing?.count).toBe(1);
    expect(housing?.monthlyTotal).toBe(1000);
  });

  it('excludes categories that have no active contracts', () => {
    insertContract(db, { category: 'OTHER', status: 'INACTIVE' });
    const result = service.getDashboardData();
    const other = result.contractsByCategory.find((c) => c.category === 'OTHER');
    expect(other).toBeUndefined();
  });

  it('includes the human-readable label for each category', () => {
    insertContract(db, { category: 'UTILITIES', status: 'ACTIVE', monthly_amount: 50 });
    const result = service.getDashboardData();
    const utilities = result.contractsByCategory.find((c) => c.category === 'UTILITIES');
    expect(utilities?.label).toBe('Utilities');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// US3 — Upcoming Renewals (tests written here to extend service in US3)
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
});
