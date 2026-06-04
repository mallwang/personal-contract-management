import { createDb, runMigrations } from './client.js';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const now = new Date().toISOString();

const seeds = [
  { name: 'Rent', category: 'HOUSING', monthly_amount: 1200.0, status: 'ACTIVE', end_date: null },
  { name: 'Electricity', category: 'UTILITIES', monthly_amount: 55.0, status: 'ACTIVE', end_date: null },
  { name: 'Internet', category: 'UTILITIES', monthly_amount: 35.0, status: 'ACTIVE', end_date: null },
  { name: 'Netflix', category: 'SUBSCRIPTIONS', monthly_amount: 15.99, status: 'ACTIVE', end_date: addDays(15) },
  { name: 'Spotify', category: 'SUBSCRIPTIONS', monthly_amount: 10.99, status: 'ACTIVE', end_date: null },
  { name: 'GitHub Copilot', category: 'SUBSCRIPTIONS', monthly_amount: 19.0, status: 'ACTIVE', end_date: null },
  { name: 'Adobe CC', category: 'SUBSCRIPTIONS', monthly_amount: 11.52, status: 'ACTIVE', end_date: null },
  { name: 'Old gym', category: 'OTHER', monthly_amount: 30.0, status: 'INACTIVE', end_date: null },
];

function runSeed(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
    VALUES (@id, @name, @category, @monthly_amount, @status, @end_date, @created_at, @updated_at)
  `);
  const insertMany = db.transaction(() => {
    for (const row of seeds) {
      insert.run({ ...row, id: randomUUID(), created_at: now, updated_at: now });
    }
  });
  insertMany();
  console.log(`Seeded ${seeds.length} contracts.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dataDir = join(__dirname, '../../../../data');
  mkdirSync(dataDir, { recursive: true });
  const db = createDb(join(dataDir, 'contracts.db'));
  runMigrations(db);
  runSeed(db);
  db.close();
}

export { runSeed };
