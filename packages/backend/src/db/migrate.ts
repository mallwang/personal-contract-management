import { createDb, runMigrations } from './client.js';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../../../data');
mkdirSync(dataDir, { recursive: true });
const db = createDb(join(dataDir, 'contracts.db'));
runMigrations(db);
console.log('Migrations applied.');
db.close();
