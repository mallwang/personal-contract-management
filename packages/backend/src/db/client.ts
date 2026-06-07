import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hashPassword, generateInitialPassword } from '../services/password.js';

const ARCHIVE_RETENTION_DAYS = 30;
// Must satisfy the shared Zod email schema (rejects TLD-less addresses like "admin@localhost"),
// otherwise the bootstrap account can never sign in and GET /api/users fails to serialize it.
const BOOTSTRAP_ADMIN_EMAIL = 'admin@localhost.local';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(
  dbPath = join(__dirname, '../../../../data/contracts.db'),
): Database.Database {
  if (!db) {
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function createDb(dbPath?: string): Database.Database {
  const instance = new Database(dbPath ?? ':memory:');
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  return instance;
}

export function runMigrations(instance: Database.Database): void {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  instance.exec(schema);

  // Migrate existing databases: replace monthly_amount with amount + billing_interval
  const hasOldColumn = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'monthly_amount');

  if (hasOldColumn) {
    instance.exec(`
      ALTER TABLE contracts ADD COLUMN amount REAL NOT NULL DEFAULT 0.0;
      ALTER TABLE contracts ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
        CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME'));
      UPDATE contracts SET amount = monthly_amount;
      ALTER TABLE contracts DROP COLUMN monthly_amount;
    `);
  }

  const hasNewFields = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'start_date');

  if (!hasNewFields) {
    instance.exec(`
      ALTER TABLE contracts ADD COLUMN start_date TEXT;
      ALTER TABLE contracts ADD COLUMN details TEXT CHECK(details IS NULL OR length(details) <= 2000);
      ALTER TABLE contracts ADD COLUMN service_url TEXT;
      ALTER TABLE contracts ADD COLUMN cancellation_period_value INTEGER;
      ALTER TABLE contracts ADD COLUMN cancellation_period_unit TEXT CHECK(
        cancellation_period_unit IS NULL
        OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS')
      );
    `);
  }

  const hasAnonymize = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'anonymize');

  if (!hasAnonymize) {
    instance.exec(`ALTER TABLE contracts ADD COLUMN anonymize INTEGER NOT NULL DEFAULT 0`);
  }

  const schemaRow = instance
    .prepare<
      [],
      { sql: string }
    >(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'contracts'`)
    .get();

  if (schemaRow && !schemaRow.sql.includes("'YEARS'")) {
    instance.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE contracts_new (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL CHECK(length(name) <= 200),
        category TEXT NOT NULL CHECK(category IN (
          'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
        amount REAL NOT NULL DEFAULT 0.0,
        billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
          CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
        status TEXT NOT NULL DEFAULT 'ACTIVE'
          CHECK(status IN ('ACTIVE','INACTIVE')),
        end_date TEXT,
        start_date TEXT,
        details TEXT CHECK(details IS NULL OR length(details) <= 2000),
        service_url TEXT,
        cancellation_period_value INTEGER,
        cancellation_period_unit TEXT CHECK(
          cancellation_period_unit IS NULL
          OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS','YEARS')
        ),
        anonymize INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO contracts_new
        (id, name, category, amount, billing_interval, status, end_date,
         start_date, details, service_url, cancellation_period_value,
         cancellation_period_unit, anonymize, created_at, updated_at)
      SELECT
        id, name, category, amount, billing_interval, status, end_date,
        start_date, details, service_url, cancellation_period_value,
        cancellation_period_unit, anonymize, created_at, updated_at
      FROM contracts;
      DROP TABLE contracts;
      ALTER TABLE contracts_new RENAME TO contracts;
      COMMIT;
    `);
  }

  // Multi-user support: add contracts.user_id when migrating a pre-existing database
  // (fresh databases already get the column from the CREATE TABLE statement above).
  const hasUserId = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'user_id');

  if (!hasUserId) {
    instance.exec(`ALTER TABLE contracts ADD COLUMN user_id TEXT REFERENCES users(id)`);
  }

  // Bootstrap the first administrator account if none exists yet — this both provisions
  // the very first account on a fresh deployment and, on an upgrade, gives pre-existing
  // contracts an owner to be backfilled to (FR-007/SC-002).
  const userCount = (
    instance.prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM users`).get() ?? { n: 0 }
  ).n;

  if (userCount === 0) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const initialPassword = generateInitialPassword();
    const { hash, salt } = hashPassword(initialPassword);
    instance
      .prepare(
        `INSERT INTO users
           (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
         VALUES (?, ?, 'Administrator', ?, ?, 'ADMIN', 'ACTIVE', ?, ?)`,
      )
      .run(id, BOOTSTRAP_ADMIN_EMAIL, hash, salt, now, now);

    instance.prepare(`UPDATE contracts SET user_id = ? WHERE user_id IS NULL`).run(id);

    console.log('============================================================');

    console.log(' Bootstrap administrator account created');

    console.log(` Email:    ${BOOTSTRAP_ADMIN_EMAIL}`);

    console.log(` Password: ${initialPassword}`);

    console.log(' Sign in and change this password immediately from Account Settings.');

    console.log('============================================================');
  }
}

/**
 * Permanently deletes archived accounts (and, via ON DELETE CASCADE, their sessions and
 * contracts) once their retention period has elapsed (FR-012/FR-013). Intended to run once
 * at server startup, alongside runMigrations — the household's storage tolerates "a bit late"
 * cleanup, so no scheduler is needed (see research.md §4).
 */
export function purgeExpiredArchivedAccounts(instance: Database.Database): number {
  const cutoff = new Date(Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = instance
    .prepare(
      `DELETE FROM users WHERE status = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_at < ?`,
    )
    .run(cutoff);
  return result.changes;
}

export interface ContractRow {
  id: string;
  name: string;
  category: string;
  amount: number;
  billing_interval: string;
  status: string;
  end_date: string | null;
  start_date: string | null;
  details: string | null;
  service_url: string | null;
  cancellation_period_value: number | null;
  cancellation_period_unit: string | null;
  anonymize: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  role: string;
  status: string;
  archived_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
}
