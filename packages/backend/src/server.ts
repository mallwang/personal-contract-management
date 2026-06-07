import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type Database from 'better-sqlite3';
import { dashboardRoutes } from './routes/dashboard.js';
import { contractRoutes } from './routes/contracts.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}

export async function buildServer(
  db: Database.Database,
  options: { staticDir?: string } = {},
): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: true });

  fastify.decorate('db', db);

  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.name,
      message: error.message,
    });
  });

  await fastify.register(dashboardRoutes);
  await fastify.register(contractRoutes);

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
