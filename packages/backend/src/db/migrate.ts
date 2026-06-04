import { createDb, runMigrations } from './client.js';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env['DATABASE_PATH'] ?? join(__dirname, '../../../../data/contracts.db');
mkdirSync(dirname(dbPath), { recursive: true });
const db = createDb(dbPath);
runMigrations(db);
console.log('Migrations applied.');
db.close();
