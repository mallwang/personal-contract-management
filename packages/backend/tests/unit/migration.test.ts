import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import {
  runMigrations,
  purgeExpiredArchivedAccounts,
  createDb,
  type UserRow,
} from '../../src/db/client.js';
import { verifyPassword } from '../../src/services/password.js';

function columnNames(db: Database.Database, table: string): string[] {
  return db
    .prepare<[], { name: string }>(`PRAGMA table_info(${table})`)
    .all()
    .map((r) => r.name);
}

function makeOldSchemaDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // Create the pre-migration schema with monthly_amount
  db.exec(`
    CREATE TABLE contracts (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL CHECK(length(name) <= 200),
      category       TEXT NOT NULL CHECK(category IN (
                       'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
      monthly_amount REAL NOT NULL CHECK(monthly_amount >= 0),
      status         TEXT NOT NULL DEFAULT 'ACTIVE'
                       CHECK(status IN ('ACTIVE','INACTIVE')),
      end_date       TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );
  `);
  return db;
}

describe('runMigrations – fresh database', () => {
  it('creates contracts table with amount and billing_interval columns', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('amount');
    expect(cols).toContain('billing_interval');
    expect(cols).not.toContain('monthly_amount');
    db.close();
  });
});

describe('runMigrations – existing database with monthly_amount', () => {
  it('migrates monthly_amount to amount and billing_interval', () => {
    const db = makeOldSchemaDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
       VALUES (?, 'Netflix', 'SUBSCRIPTIONS', 15.99, 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('amount');
    expect(cols).toContain('billing_interval');
    expect(cols).not.toContain('monthly_amount');

    const row = db
      .prepare<
        [string],
        { amount: number; billing_interval: string }
      >(`SELECT amount, billing_interval FROM contracts WHERE id = ?`)
      .get(id)!;
    expect(row.amount).toBe(15.99);
    expect(row.billing_interval).toBe('MONTHLY');
    db.close();
  });

  it('preserves all existing rows after migration', () => {
    const db = makeOldSchemaDb();
    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      db.prepare(
        `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
         VALUES (?, ?, 'OTHER', 10, 'ACTIVE', null, ?, ?)`,
      ).run(crypto.randomUUID(), `Contract ${i}`, now, now);
    }

    runMigrations(db);

    const count = db.prepare<[], { n: number }>(`SELECT COUNT(*) as n FROM contracts`).get()!!.n;
    expect(count).toBe(3);
    db.close();
  });

  it('is idempotent — running migrations twice does not fail', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
    db.close();
  });
});

describe('runMigrations – new contract fields', () => {
  it('adds all five new columns to a fresh database', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('start_date');
    expect(cols).toContain('details');
    expect(cols).toContain('service_url');
    expect(cols).toContain('cancellation_period_value');
    expect(cols).toContain('cancellation_period_unit');
    db.close();
  });

  it('adds all five new columns to an existing database missing them', () => {
    const db = makeOldSchemaDb();
    // Insert a legacy row first (old schema has monthly_amount, not amount)
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
       VALUES (?, 'Legacy Contract', 'OTHER', 5.00, 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('start_date');
    expect(cols).toContain('details');
    expect(cols).toContain('service_url');
    expect(cols).toContain('cancellation_period_value');
    expect(cols).toContain('cancellation_period_unit');
    db.close();
  });

  it('existing rows have NULL for all five new columns after migration', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    // Create a schema without the new columns
    db.exec(`
      CREATE TABLE contracts (
        id               TEXT PRIMARY KEY,
        name             TEXT NOT NULL CHECK(length(name) <= 200),
        category         TEXT NOT NULL CHECK(category IN (
                           'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
        amount           REAL NOT NULL CHECK(amount >= 0),
        billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
                           CHECK(billing_interval IN (
                             'WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
        status           TEXT NOT NULL DEFAULT 'ACTIVE'
                           CHECK(status IN ('ACTIVE','INACTIVE')),
        end_date         TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );
    `);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
       VALUES (?, 'Old Contract', 'SUBSCRIPTIONS', 9.99, 'MONTHLY', 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const row = db
      .prepare<
        [string],
        {
          start_date: string | null;
          details: string | null;
          service_url: string | null;
          cancellation_period_value: number | null;
          cancellation_period_unit: string | null;
        }
      >(
        `SELECT start_date, details, service_url, cancellation_period_value, cancellation_period_unit
         FROM contracts WHERE id = ?`,
      )
      .get(id)!;
    expect(row.start_date).toBeNull();
    expect(row.details).toBeNull();
    expect(row.service_url).toBeNull();
    expect(row.cancellation_period_value).toBeNull();
    expect(row.cancellation_period_unit).toBeNull();
    db.close();
  });
});

describe('runMigrations – multi-user bootstrap (FR-007/SC-002)', () => {
  it('creates users/sessions tables and a contracts.user_id column on a fresh database', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    const tables = db
      .prepare<[], { name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .all()
      .map((r) => r.name);
    expect(tables).toContain('users');
    expect(tables).toContain('sessions');
    expect(columnNames(db, 'contracts')).toContain('user_id');
    db.close();
  });

  it('bootstraps exactly one ADMIN account on a fresh database, with a usable password', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    const users = db.prepare<[], UserRow>(`SELECT * FROM users`).all();
    expect(users).toHaveLength(1);
    expect(users[0]?.role).toBe('ADMIN');
    expect(users[0]?.status).toBe('ACTIVE');
    // The generated password is logged, never stored — only its hash/salt persist.
    expect(users[0]?.password_hash).not.toHaveLength(0);
    expect(
      verifyPassword('not-the-real-password', users[0]!.password_hash, users[0]!.password_salt),
    ).toBe(false);
    db.close();
  });

  it('backfills every pre-existing contract to the bootstrap administrator account', () => {
    const db = makeOldSchemaDb();
    const now = new Date().toISOString();
    const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    for (const id of ids) {
      db.prepare(
        `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
         VALUES (?, 'Pre-existing contract', 'OTHER', 10, 'ACTIVE', null, ?, ?)`,
      ).run(id, now, now);
    }

    runMigrations(db);

    const admin = db.prepare<[], UserRow>(`SELECT * FROM users WHERE role = 'ADMIN'`).get()!;
    const owners = db
      .prepare<[], { user_id: string | null }>(`SELECT user_id FROM contracts`)
      .all()
      .map((r) => r.user_id);
    expect(owners).toHaveLength(3);
    expect(owners.every((ownerId) => ownerId === admin.id)).toBe(true);
    db.close();
  });

  it('does not create a second bootstrap admin when one already exists (idempotent)', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    runMigrations(db);

    const count = db.prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM users`).get()!.n;
    expect(count).toBe(1);
    db.close();
  });
});

describe('purgeExpiredArchivedAccounts (FR-012/FR-013)', () => {
  function insertArchivedUser(db: Database.Database, archivedAt: string) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, archived_at, created_at, updated_at)
       VALUES (?, ?, 'Archived User', 'h', 's', 'MEMBER', 'ARCHIVED', ?, ?, ?)`,
    ).run(id, `${id}@example.test`, archivedAt, now, now);
    return id;
  }

  it('permanently deletes accounts archived more than 30 days ago', () => {
    const db = createDb(':memory:');
    runMigrations(db);
    const longAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const id = insertArchivedUser(db, longAgo);

    const deleted = purgeExpiredArchivedAccounts(db);

    expect(deleted).toBe(1);
    expect(db.prepare(`SELECT 1 FROM users WHERE id = ?`).get(id)).toBeUndefined();
    db.close();
  });

  it('retains accounts archived within the last 30 days', () => {
    const db = createDb(':memory:');
    runMigrations(db);
    const recently = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const id = insertArchivedUser(db, recently);

    const deleted = purgeExpiredArchivedAccounts(db);

    expect(deleted).toBe(0);
    expect(db.prepare(`SELECT 1 FROM users WHERE id = ?`).get(id)).toBeDefined();
    db.close();
  });
});
