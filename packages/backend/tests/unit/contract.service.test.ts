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

describe('ContractService – new fields (create)', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('creates a contract with all four new fields populated and returns them', () => {
    const result = service.create({
      name: 'Spotify',
      category: 'SUBSCRIPTIONS',
      amount: 9.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      startDate: '2024-01-15',
      details: 'Annual subscription auto-renews',
      serviceUrl: 'https://spotify.com',
      cancellationPeriod: { value: 30, unit: 'DAYS' },
    });
    expect(result.startDate).toBe('2024-01-15');
    expect(result.details).toBe('Annual subscription auto-renews');
    expect(result.serviceUrl).toBe('https://spotify.com');
    expect(result.cancellationPeriod).toEqual({ value: 30, unit: 'DAYS' });
  });

  it('creates a contract with all four new fields null and succeeds without error', () => {
    const result = service.create({
      name: 'No Extras',
      category: 'OTHER',
      amount: 0,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    expect(result.startDate).toBeNull();
    expect(result.details).toBeNull();
    expect(result.serviceUrl).toBeNull();
    expect(result.cancellationPeriod).toBeNull();
  });

  it('returns null for cancellationPeriod when only one column is set', () => {
    const result = service.create({
      name: 'Partial',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    // Directly set only value without unit via raw SQL to simulate edge case
    db.prepare(`UPDATE contracts SET cancellation_period_value = 14 WHERE id = ?`).run(result.id);
    const listed = service.list().find((c) => c.id === result.id)!;
    expect(listed.cancellationPeriod).toBeNull();
  });
});

describe('ContractService – new fields (update)', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('updates serviceUrl and returns the updated value', () => {
    const created = service.create({
      name: 'Netflix',
      category: 'SUBSCRIPTIONS',
      amount: 15.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const updated = service.update(created.id, { serviceUrl: 'https://netflix.com' })!;
    expect(updated.serviceUrl).toBe('https://netflix.com');
  });

  it('clears cancellationPeriod when updated to null', () => {
    const created = service.create({
      name: 'Gym',
      category: 'OTHER',
      amount: 40,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      cancellationPeriod: { value: 14, unit: 'DAYS' },
    });
    expect(created.cancellationPeriod).toEqual({ value: 14, unit: 'DAYS' });
    const updated = service.update(created.id, { cancellationPeriod: null })!;
    expect(updated.cancellationPeriod).toBeNull();
  });
});

describe('ContractService – anonymize field', () => {
  let db: Database.Database;
  let service: ContractService;

  beforeEach(() => {
    db = makeDb();
    service = new ContractService(db);
  });

  it('create defaults anonymize to false when not provided', () => {
    const result = service.create({
      name: 'Netflix',
      category: 'SUBSCRIPTIONS',
      amount: 15.99,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
    });
    expect(result.anonymize).toBe(false);
  });

  it('create stores anonymize=true when provided', () => {
    const result = service.create({
      name: 'Secret Service',
      category: 'OTHER',
      amount: 5,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: true,
    });
    expect(result.anonymize).toBe(true);
  });

  it('list maps anonymize column to boolean', () => {
    service.create({
      name: 'Public',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: false,
    });
    service.create({
      name: 'Private',
      category: 'OTHER',
      amount: 2,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: true,
    });
    const results = service.list();
    const pub = results.find((c) => c.name === 'Public')!;
    const priv = results.find((c) => c.name === 'Private')!;
    expect(pub.anonymize).toBe(false);
    expect(priv.anonymize).toBe(true);
  });

  it('update patches anonymize from false to true', () => {
    const created = service.create({
      name: 'Test',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: false,
    });
    const updated = service.update(created.id, { anonymize: true })!;
    expect(updated.anonymize).toBe(true);
  });

  it('update patches anonymize from true to false', () => {
    const created = service.create({
      name: 'Test',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: true,
    });
    const updated = service.update(created.id, { anonymize: false })!;
    expect(updated.anonymize).toBe(false);
  });

  it('update preserves anonymize when not included in patch', () => {
    const created = service.create({
      name: 'Test',
      category: 'OTHER',
      amount: 1,
      billingInterval: 'MONTHLY',
      status: 'ACTIVE',
      anonymize: true,
    });
    const updated = service.update(created.id, { name: 'Updated Name' })!;
    expect(updated.anonymize).toBe(true);
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
