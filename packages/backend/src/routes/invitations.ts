import type { FastifyInstance } from 'fastify';
import {
  SendInvitationBodySchema,
  AcceptInvitationBodySchema,
  InvitationSchema,
} from '@pcm/shared';
import { z } from 'zod';
import { InvitationService, DuplicateAccountError } from '../services/invitation.service.js';
import { UserService } from '../services/user.service.js';
import { MailerError } from '../services/mailer.service.js';
import { toSessionUser } from '../services/auth.service.js';

const TokenParams = z.object({ token: z.string() });

function forbidden(reply: import('fastify').FastifyReply) {
  return reply.status(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Administrator access required',
  });
}

export async function invitationRoutes(fastify: FastifyInstance): Promise<void> {
  const invitationService = new InvitationService(fastify.db);
  const userService = new UserService(fastify.db);

  fastify.post('/api/invitations', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const body = SendInvitationBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    let invitation;
    try {
      invitation = invitationService.create(body.data.email, request.user.id);
    } catch (err) {
      if (err instanceof DuplicateAccountError) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: err.message,
        });
      }
      throw err;
    }

    try {
      if (!fastify.mailer) throw new Error('SMTP not configured');
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/invitations/${invitation.token}`;
      await fastify.mailer.sendInvitationEmail(invitation.email, link, invitation.expiresAt);
    } catch (_err) {
      fastify.db.prepare(`DELETE FROM invitations WHERE token = ?`).run(invitation.token);
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Invitation could not be sent. Please check the email address and try again.',
      });
    }

    return reply.status(201).send(InvitationSchema.parse(invitation));
  });

  fastify.get('/api/invitations', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);
    return reply.send(invitationService.list().map((inv) => InvitationSchema.parse(inv)));
  });

  fastify.delete('/api/invitations/:token', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const result = invitationService.cancel(params.data.token);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Invitation not found' });
    }
    if (result === 'not-pending') {
      return reply
        .status(409)
        .send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Invitation is not currently pending',
        });
    }
    return reply.status(204).send();
  });

  fastify.post('/api/invitations/:token/resend', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const result = invitationService.resend(params.data.token, request.user.id);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Invitation not found' });
    }
    if (result === 'not-pending') {
      return reply
        .status(409)
        .send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Invitation is not currently pending',
        });
    }

    const invitation = result;
    try {
      if (!fastify.mailer) throw new Error('SMTP not configured');
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/invitations/${invitation.token}`;
      await fastify.mailer.sendInvitationEmail(invitation.email, link, invitation.expiresAt);
    } catch (_err) {
      fastify.db.prepare(`DELETE FROM invitations WHERE token = ?`).run(invitation.token);
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Invitation could not be sent. Please check the email address and try again.',
      });
    }

    return reply.status(201).send(InvitationSchema.parse(invitation));
  });

  fastify.post('/api/invitations/:token/accept', async (request, reply) => {
    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const body = AcceptInvitationBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Password does not meet requirements',
      });
    }

    const validation = invitationService.validateToken(params.data.token);
    if (validation.outcome === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: "This invitation link isn't valid" });
    }
    if (validation.outcome === 'already-accepted') {
      return reply
        .status(410)
        .send({ statusCode: 410, error: 'Gone', message: 'This link has already been used' });
    }
    if (validation.outcome === 'expired') {
      return reply
        .status(410)
        .send({
          statusCode: 410,
          error: 'Gone',
          message: 'This link has expired, ask the administrator for a new one',
        });
    }
    if (validation.outcome === 'no-longer-valid') {
      return reply
        .status(410)
        .send({
          statusCode: 410,
          error: 'Gone',
          message: 'This invitation is no longer valid, ask the administrator for a new one',
        });
    }

    const acceptAndActivate = fastify.db.transaction(() => {
      const userRow = userService.activateFromInvitation(validation.email, body.data.password);
      invitationService.accept(params.data.token, userRow.id);
      const session = fastify.auth.createSession(userRow.id);
      return { userRow, session };
    });

    const { userRow, session } = acceptAndActivate();

    reply.setCookie('session_id', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env['NODE_ENV'] === 'production',
    });

    return reply.status(200).send(toSessionUser(userRow));
  });
}
