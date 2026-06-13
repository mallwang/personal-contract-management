import nodemailer, { type Transporter, type SentMessageInfo } from 'nodemailer';

export class MailerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailerError';
  }
}

export interface MailerOptions {
  transport: Transporter<SentMessageInfo>;
  from: string;
}

export class MailerService {
  private readonly transport: Transporter<SentMessageInfo>;
  private readonly from: string;

  constructor(opts: MailerOptions) {
    if (!opts.transport || !opts.from) {
      throw new MailerError('SMTP configuration is missing (SMTP_HOST, SMTP_FROM required)');
    }
    this.transport = opts.transport;
    this.from = opts.from;
  }

  static fromEnv(): MailerService {
    const host = process.env['SMTP_HOST'];
    const port = parseInt(process.env['SMTP_PORT'] ?? '587');
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASSWORD'];
    const from = process.env['SMTP_FROM'] ?? '';

    if (!host || !from) {
      throw new MailerError('SMTP configuration is missing (SMTP_HOST, SMTP_FROM required)');
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    return new MailerService({ transport, from });
  }

  async sendInvitationEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = "You've been invited";
    const text = `You've been invited to join the app.\n\nClick the link below to set up your account:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not expect this invitation, you can ignore this email.`;
    const html = `<p>You've been invited to join the app.</p><p>Click the link below to set up your account:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not expect this invitation, you can ignore this email.</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }
}
