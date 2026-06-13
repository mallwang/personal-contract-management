import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type Database from 'better-sqlite3';
import type { SessionUser } from '@pcm/shared';
import { dashboardRoutes } from './routes/dashboard.js';
import { contractRoutes } from './routes/contracts.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { invitationRoutes } from './routes/invitations.js';
import { AuthService, SESSION_COOKIE_NAME, toSessionUser } from './services/auth.service.js';
import type { MailerService } from './services/mailer.service.js';

export { SESSION_COOKIE_NAME, toSessionUser };

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
    auth: AuthService;
    mailer: MailerService | undefined;
  }
  interface FastifyRequest {
    user: SessionUser | null;
  }
}

const PUBLIC_ROUTES: Array<(method: string, path: string) => boolean> = [
  (m, p) => m === 'POST' && p === '/api/auth/sign-in',
  (m, p) => m === 'POST' && /^\/api\/invitations\/[^/]+\/accept$/.test(p),
];

function isPublicRoute(method: string, url: string): boolean {
  const path = url.split('?')[0] ?? '';
  return PUBLIC_ROUTES.some((fn) => fn(method, path));
}

export async function buildServer(
  db: Database.Database,
  options: { staticDir?: string; mailer?: MailerService } = {},
): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: true });
  await fastify.register(cookie);

  fastify.decorate('db', db);
  const authService = new AuthService(db);
  fastify.decorate('auth', authService);
  if (options.mailer) {
    fastify.decorate('mailer', options.mailer);
  }

  fastify.addHook('onRequest', async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    const resolvedUser = sessionId ? authService.resolveSession(sessionId) : null;
    request.user = resolvedUser ? toSessionUser(resolvedUser) : null;

    const path = request.url.split('?')[0] ?? '';
    if (path.startsWith('/api/') && !isPublicRoute(request.method, request.url) && !request.user) {
      await reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
  });

  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.name,
      message: error.message,
    });
  });

  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(contractRoutes);
  await fastify.register(invitationRoutes);

  const staticDir =
    options.staticDir ??
    (process.env['NODE_ENV'] === 'production'
      ? join(dirname(fileURLToPath(import.meta.url)), 'public')
      : undefined);

  if (staticDir) {
    await fastify.register(fastifyStatic, { root: staticDir, prefix: '/' });
    fastify.setNotFoundHandler((_request, reply) => {
      void reply.sendFile('index.html');
    });
  }

  return fastify;
}
