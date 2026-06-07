import type { FastifyInstance } from 'fastify';
import { SignInBodySchema, ChangePasswordBodySchema, SessionUserSchema } from '@pcm/shared';
import { SESSION_COOKIE_NAME, toSessionUser } from '../server.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/auth/sign-in', async (request, reply) => {
    const body = SignInBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = fastify.auth.signIn(body.data.email, body.data.password);

    if (result.outcome === 'invalid') {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    if (result.outcome === 'locked') {
      return reply.status(423).send({
        statusCode: 423,
        error: 'Locked',
        message: `Too many failed attempts. Try again after ${result.retryAt}.`,
      });
    }

    reply.setCookie(SESSION_COOKIE_NAME, result.session.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(result.session.expires_at),
    });
    return reply.status(200).send(SessionUserSchema.parse(toSessionUser(result.user)));
  });

  fastify.post('/api/auth/sign-out', async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      fastify.auth.destroySession(sessionId);
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return reply.status(204).send();
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    return reply.send(SessionUserSchema.parse(request.user));
  });

  fastify.post('/api/auth/password', async (request, reply) => {
    const body = ChangePasswordBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const userId = request.user!.id;
    const changed = fastify.auth.changePassword(
      userId,
      body.data.currentPassword,
      body.data.newPassword,
    );
    if (!changed) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      });
    }

    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      fastify.auth.destroyOtherSessions(userId, sessionId);
    }
    return reply.status(204).send();
  });
}
