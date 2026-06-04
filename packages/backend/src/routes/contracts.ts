import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  ContractListResponseSchema,
  ContractSchema,
  CreateContractBodySchema,
  UpdateContractBodySchema,
} from '@pcm/shared';
import { ContractService } from '../services/contract.js';

const IdParams = z.object({ id: z.string().uuid() });

export async function contractRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/contracts', async (_request, reply) => {
    const service = new ContractService(fastify.db);
    const contracts = service.list();
    return reply.send(ContractListResponseSchema.parse(contracts));
  });

  fastify.post('/api/contracts', async (request, reply) => {
    const body = CreateContractBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }
    const service = new ContractService(fastify.db);
    const contract = service.create(body.data);
    return reply.status(201).send(ContractSchema.parse(contract));
  });

  fastify.put('/api/contracts/:id', async (request, reply) => {
    const params = IdParams.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid ID' });
    }

    const rawBody = request.body as Record<string, unknown>;
    if (!rawBody || Object.keys(rawBody).length === 0) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request body must not be empty',
      });
    }

    const body = UpdateContractBodySchema.safeParse(rawBody);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const service = new ContractService(fastify.db);
    const updated = service.update(params.data.id, body.data);
    if (!updated) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Contract not found' });
    }
    return reply.send(ContractSchema.parse(updated));
  });

  fastify.delete('/api/contracts/:id', async (request, reply) => {
    const params = IdParams.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid ID' });
    }
    const service = new ContractService(fastify.db);
    const deleted = service.delete(params.data.id);
    if (!deleted) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Contract not found' });
    }
    return reply.status(204).send();
  });
}
