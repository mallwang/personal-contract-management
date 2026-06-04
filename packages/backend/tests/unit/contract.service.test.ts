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
    const row = insertContract(db, { name: 'Netflix', monthly_amount: 15.99, end_date: '2026-12-31' });
    const result = service.list();
    expect(result).toHaveLength(1);
    const contract = result[0]!;
    expect(contract.id).toBe(row.id);
    expect(contract.monthlyAmount).toBe(15.99);
    expect(contract.endDate).toBe('2026-12-31');
    expect(contract.createdAt).toBeTruthy();
    expect(contract.updatedAt).toBeTruthy();
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
      monthlyAmount: 15.99,
      status: 'ACTIVE',
    });
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(result.name).toBe('Netflix');
    expect(result.monthlyAmount).toBe(15.99);
    expect(result.endDate).toBeNull();
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  it('persists the contract so it appears in list()', () => {
    service.create({ name: 'Gym', category: 'OTHER', monthlyAmount: 30, status: 'ACTIVE' });
    expect(service.list()).toHaveLength(1);
  });

  it('stores endDate when provided', () => {
    const result = service.create({
      name: 'Lease',
      category: 'HOUSING',
      monthlyAmount: 1200,
      status: 'ACTIVE',
      endDate: '2027-01-01',
    });
    expect(result.endDate).toBe('2027-01-01');
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
      monthlyAmount: 10,
      status: 'ACTIVE',
    });
    const updated = service.update(created.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.category).toBe('OTHER');
    expect(updated.monthlyAmount).toBe(10);
  });

  it('updates updatedAt timestamp', () => {
    // Insert with a known past timestamp so the comparison is reliable
    const row = insertContract(db, { updated_at: '2000-01-01T00:00:00.000Z' } as Parameters<typeof insertContract>[1]);
    const updated = service.update(row.id, { monthlyAmount: 99 });
    expect(updated!.updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
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
      monthlyAmount: 1,
      status: 'ACTIVE',
    });
    service.delete(created.id);
    expect(service.list()).toHaveLength(0);
  });

  it('returns false when the contract does not exist', () => {
    expect(service.delete('00000000-0000-0000-0000-000000000000')).toBe(false);
  });
});
