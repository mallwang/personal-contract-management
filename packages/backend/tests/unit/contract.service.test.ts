import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { ContractService } from '../../src/services/contract.js';

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

describe('ContractService – list', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('returns empty array when no contracts exist', () => {
    expect(service.list()).toEqual([]);
  });

  it('returns all contracts sorted by name ascending', () => {
    insertContract(db, { name: 'Zebra' });
    insertContract(db, { name: 'Apple' });
    insertContract(db, { name: 'Mango' });
    const result = service.list();
    expect(result.map((c) => c.name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('maps snake_case columns to camelCase fields', () => {
    const row = insertContract(db, {
      name: 'Netflix',
      amount: 15.99,
      billing_interval: 'MONTHLY',
      end_date: '2026-12-31',
    });
    const result = service.list();
    expect(result).toHaveLength(1);
    const contract = result[0]!;
    expect(contract.id).toBe(row.id);
    expect(contract.amount).toBe(15.99);
    expect(contract.billingInterval).toBe('MONTHLY');
    expect(contract.endDate).toBe('2026-12-31');
    expect(contract.createdAt).toBeTruthy();
    expect(contract.updatedAt).toBeTruthy();
  });

  it('does not include a monthlyAmount field', () => {
    insertContract(db, { name: 'Test' });
    const contract = service.list()[0]!;
    expect((contract as unknown as Record<string, unknown>)['monthlyAmount']).toBeUndefined();
  });
});

describe('ContractService – create', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('inserts a new contract and returns it with a generated UUID', () => {
    const result = service.create({
      name: 'Netflix',
      category: 'SUBSCRIPTIONS',
      amount: 15.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(result.name).toBe('Netflix');
    expect(result.amount).toBe(15.99);
    expect(result.billingInterval).toBe('MONTHLY');
    expect(result.endDate).toBeNull();
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  it('persists the contract so it appears in list()', () => {
    service.create({
      name: 'Gym',
      category: 'OTHER',
      amount: 30,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    expect(service.list()).toHaveLength(1);
  });

  it('stores endDate when provided', () => {
    const result = service.create({
      name: 'Lease',
      category: 'HOUSING',
      amount: 1200,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      endDate: '2027-01-01',
    });
    expect(result.endDate).toBe('2027-01-01');
  });

  it('creates a contract with WEEKLY billing interval', () => {
    const result = service.create({
      name: 'Weekly Service',
      category: 'OTHER',
      amount: 5,
      billingInterval: 'WEEKLY',
      status: 'ACTIVE',
    });
    expect(result.billingInterval).toBe('WEEKLY');
    expect(result.amount).toBe(5);
  });

  it('creates a contract with QUARTERLY billing interval', () => {
    const result = service.create({
      name: 'Adobe CC',
      category: 'SUBSCRIPTIONS',
      amount: 60,
      billingInterval: 'QUARTERLY',
      status: 'ACTIVE',
    });
    expect(result.billingInterval).toBe('QUARTERLY');
  });

  it('creates a contract with YEARLY billing interval', () => {
    const result = service.create({
      name: 'AWS',
      category: 'SUBSCRIPTIONS',
      amount: 120,
      billingInterval: 'YEARLY',
      status: 'ACTIVE',
    });
    expect(result.billingInterval).toBe('YEARLY');
  });

  it('creates a contract with LIFETIME billing interval', () => {
    const result = service.create({
      name: 'One-time Software',
      category: 'OTHER',
      amount: 299,
      billingInterval: 'LIFETIME',
      status: 'ACTIVE',
    });
    expect(result.billingInterval).toBe('LIFETIME');
  });
});

describe('ContractService – update', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('updates only the supplied fields and returns the full contract', () => {
    const created = service.create({
      name: 'Old Name',
      category: 'OTHER',
      amount: 10,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const updated = service.update(created.id, { name: 'New Name' })!;
    expect(updated.name).toBe('New Name');
    expect(updated.category).toBe('OTHER');
    expect(updated.amount).toBe(10);
    expect(updated.billingInterval).toBe('MONTHLY');
  });

  it('updates billing interval', () => {
    const created = service.create({
      name: 'Spotify',
      category: 'SUBSCRIPTIONS',
      amount: 10,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const updated = service.update(created.id, { billingInterval: 'YEARLY' })!;
    expect(updated.billingInterval).toBe('YEARLY');
  });

  it('updates updatedAt timestamp', () => {
    const row = insertContract(db, { updated_at: '2000-01-01T00:00:00.000Z' } as Parameters<
      typeof insertContract
    >[1]);
    const updated = service.update(row.id, { amount: 99 })!;
    expect(updated.updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('returns null when the contract does not exist', () => {
    expect(service.update('00000000-0000-0000-0000-000000000000', { name: 'X' })).toBeNull();
  });
});

describe('ContractService – delete', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('removes the contract from the database', () => {
    const created = service.create({
      name: 'To Delete',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    service.delete(created.id);
    expect(service.list()).toHaveLength(0);
  });

  it('returns false when the contract does not exist', () => {
    expect(service.delete('00000000-0000-0000-0000-000000000000')).toBe(false);
  });
});
