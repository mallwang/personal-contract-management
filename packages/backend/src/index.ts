import { getDb, runMigrations } from './db/client.js';
import { buildServer } from './server.js';

const db = getDb();
runMigrations(db);

const server = await buildServer(db);
await server.listen({ port: 3000, host: '0.0.0.0' });
