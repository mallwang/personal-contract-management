import { describe, it, expect } from 'vitest';
import type { Transporter } from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import { MailerService, MailerError } from '../../src/services/mailer.service.js';

function makeStubTransport(failWith?: Error): Transporter<SentMessageInfo> {
  return {
    sendMail: failWith
      ? (_opts: unknown, cb: (err: Error | null, info: SentMessageInfo | null) => void) => {
          cb(failWith, null);
        }
      : (_opts: unknown, cb: (err: Error | null, info: SentMessageInfo) => void) => {
          cb(null, {
            messageId: 'stub-id',
            envelope: { from: '', to: [] },
            accepted: [],
            rejected: [],
            pending: [],
            response: '',
          });
        },
  } as unknown as Transporter<SentMessageInfo>;
}

describe('MailerService.sendInvitationEmail', () => {
  const from = 'noreply@example.test';
  const to = 'invitee@example.test';
  const link = 'https://app.example.test/invitations/abc123';
  const expiresAt = new Date('2026-06-20T12:00:00.000Z').toISOString();

  it('sends to the correct recipient with the link in body and subject', async () => {
    const captured: unknown[] = [];
    const transport = {
      sendMail: (opts: unknown, cb: (err: null, info: SentMessageInfo) => void) => {
        captured.push(opts);
        cb(null, {
          messageId: 'x',
          envelope: { from: '', to: [] },
          accepted: [],
          rejected: [],
          pending: [],
          response: '',
        });
      },
    } as unknown as Transporter<SentMessageInfo>;

    const mailer = new MailerService({ transport, from });
    await mailer.sendInvitationEmail(to, link, expiresAt);

    expect(captured).toHaveLength(1);
    const msg = captured[0] as { to: string; subject: string; text: string; html: string };
    expect(msg.to).toBe(to);
    expect(msg.subject).toBeTruthy();
    expect(msg.text).toContain(link);
    expect(msg.html).toContain(link);
  });

  it('includes expiry information in the email body', async () => {
    const captured: unknown[] = [];
    const transport = {
      sendMail: (opts: unknown, cb: (err: null, info: SentMessageInfo) => void) => {
        captured.push(opts);
        cb(null, {
          messageId: 'x',
          envelope: { from: '', to: [] },
          accepted: [],
          rejected: [],
          pending: [],
          response: '',
        });
      },
    } as unknown as Transporter<SentMessageInfo>;

    const mailer = new MailerService({ transport, from });
    await mailer.sendInvitationEmail(to, link, expiresAt);

    const msg = captured[0] as { text: string; html: string };
    expect(msg.text).toContain('2026-06-20');
    expect(msg.html).toContain('2026-06-20');
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendInvitationEmail(to, link, expiresAt)).rejects.toBeInstanceOf(
      MailerError,
    );
  });

  it('throws MailerError when SMTP config is missing', async () => {
    expect(
      () =>
        new MailerService({ transport: null as unknown as Transporter<SentMessageInfo>, from: '' }),
    ).toThrow(MailerError);
  });
});
