import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(dbPath = join(__dirname, '../../../../data/contracts.db')): Database.Database {
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
}

export interface ContractRow {
  id: string;
  name: string;
  category: string;
  monthly_amount: number;
  status: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}
