import type { FastifyInstance } from 'fastify';
import { DashboardService } from '../services/dashboard.js';

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/dashboard', async (request, reply) => {
    const service = new DashboardService(fastify.db);
    const data = service.getDashboardData(request.user!.id);
    return reply.send(data);
  });
}
