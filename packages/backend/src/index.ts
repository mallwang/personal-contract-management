import { getDb, runMigrations, purgeExpiredArchivedAccounts } from './db/client.js';
import { buildServer } from './server.js';

const db = getDb(process.env['DATABASE_PATH']);
runMigrations(db);
purgeExpiredArchivedAccounts(db);

const server = await buildServer(db);
await server.listen({ port: parseInt(process.env['PORT'] ?? '3000'), host: '0.0.0.0' });
