import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  AccountSchema,
  AccountListResponseSchema,
  CreateAccountBodySchema,
  ChangeRoleBodySchema,
} from '@pcm/shared';
import { UserService } from '../services/user.service.js';

const IdParams = z.object({ id: z.string().uuid() });

function forbidden(reply: import('fastify').FastifyReply) {
  return reply.status(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Administrator access required',
  });
}

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') {
      return forbidden(reply);
    }
  });

  fastify.get('/api/users', async (request, reply) => {
    const service = new UserService(fastify.db);
    return reply.send(AccountListResponseSchema.parse(service.list()));
  });

  fastify.post('/api/users', async (request, reply) => {
    const body = CreateAccountBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const service = new UserService(fastify.db);
    const result = service.create(body.data);
    if (result.outcome === 'duplicate') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email is already in use by another account',
      });
    }
    return reply.status(201).send(AccountSchema.parse(result.account));
  });

  fastify.post('/api/users/:id/archive', async (request, reply) => {
    const params = IdParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid ID' });
    }

    const service = new UserService(fastify.db);
    const result = service.archive(params.data.id);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Account not found' });
    }
    if (result === 'last-admin') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Cannot remove the last active administrator',
      });
    }
    return reply.status(204).send();
  });

  fastify.post('/api/users/:id/reactivate', async (request, reply) => {
    const params = IdParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid ID' });
    }

    const service = new UserService(fastify.db);
    const result = service.reactivate(params.data.id);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Account not found' });
    }
    if (result === 'not-archived') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Account is not currently archived',
      });
    }
    return reply.status(204).send();
  });

  fastify.post('/api/users/:id/role', async (request, reply) => {
    const params = IdParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid ID' });
    }
    const body = ChangeRoleBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const service = new UserService(fastify.db);
    const result = service.changeRole(params.data.id, body.data.role);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Account not found' });
    }
    if (result === 'last-admin') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Cannot demote the last active administrator',
      });
    }
    return reply.status(204).send();
  });
}
