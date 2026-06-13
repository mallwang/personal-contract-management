import 'dotenv/config';
import {
  getDb,
  runMigrations,
  purgeExpiredArchivedAccounts,
  purgeStaleInvitations,
} from './db/client.js';
import { buildServer } from './server.js';
import { MailerService } from './services/mailer.service.js';

const db = getDb(process.env['DATABASE_PATH']);
runMigrations(db);
purgeExpiredArchivedAccounts(db);
purgeStaleInvitations(db);

let mailer: MailerService | undefined;
try {
  mailer = MailerService.fromEnv();
} catch {
  console.warn('SMTP not configured — invitations will fail at send time');
}

const server = await buildServer(db, { mailer });
await server.listen({ port: parseInt(process.env['PORT'] ?? '3000'), host: '0.0.0.0' });
