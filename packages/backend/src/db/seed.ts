import { createDb, runMigrations } from './client.js';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEED_CREATED_AT = '2026-01-01T00:00:00.000Z';

const seeds = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Rent',          category: 'HOUSING',       amount: 1200.0, billing_interval: 'MONTHLY',   status: 'ACTIVE',   end_date: null },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Electricity',   category: 'UTILITIES',     amount:   55.0, billing_interval: 'MONTHLY',   status: 'ACTIVE',   end_date: null },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Internet',      category: 'UTILITIES',     amount:   35.0, billing_interval: 'MONTHLY',   status: 'ACTIVE',   end_date: null },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Netflix',       category: 'SUBSCRIPTIONS', amount:   15.99, billing_interval: 'MONTHLY',  status: 'ACTIVE',   end_date: () => addDays(15) },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Spotify',       category: 'SUBSCRIPTIONS', amount:   10.99, billing_interval: 'MONTHLY',  status: 'ACTIVE',   end_date: null },
  { id: '00000000-0000-0000-0000-000000000006', name: 'GitHub Copilot',category: 'SUBSCRIPTIONS', amount:   19.0,  billing_interval: 'MONTHLY',  status: 'ACTIVE',   end_date: null },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Adobe CC',      category: 'SUBSCRIPTIONS', amount:   46.08, billing_interval: 'QUARTERLY', status: 'ACTIVE',  end_date: null },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Old gym',       category: 'OTHER',         amount:   30.0, billing_interval: 'MONTHLY',   status: 'INACTIVE', end_date: null },
];

function runSeed(db: Database.Database, { force = false } = {}): void {
  const existing = (db.prepare(`SELECT COUNT(*) as n FROM contracts`).get() as { n: number }).n;
  if (existing > 0 && !force) {
    console.log(`Skipping seed: ${existing} contracts already exist. Use --force to override.`);
    return;
  }
  const upsert = db.prepare(`
    INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
    VALUES (@id, @name, @category, @amount, @billing_interval, @status, @end_date, @created_at, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name             = excluded.name,
      category         = excluded.category,
      amount           = excluded.amount,
      billing_interval = excluded.billing_interval,
      status           = excluded.status,
      end_date         = excluded.end_date,
      updated_at       = excluded.updated_at
  `);
  const upsertMany = db.transaction(() => {
    for (const row of seeds) {
      upsert.run({
        id: row.id,
        name: row.name,
        category: row.category,
        amount: row.amount,
        billing_interval: row.billing_interval,
        status: row.status,
        end_date: typeof row.end_date === 'function' ? row.end_date() : row.end_date,
        created_at: SEED_CREATED_AT,
        updated_at: new Date().toISOString(),
      });
    }
  });
  upsertMany();
  console.log(`Seeded ${seeds.length} contracts.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force');
  const dbPath = process.env['DATABASE_PATH'] ?? join(__dirname, '../../../../data/contracts.db');
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = createDb(dbPath);
  runMigrations(db);
  runSeed(db, { force });
  db.close();
}

export { runSeed };
