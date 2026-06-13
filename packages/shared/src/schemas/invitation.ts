import { z } from 'zod';
import { InvitationStatus } from '../types/invitation.js';

const InvitationStatusEnum = z.enum([
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
  InvitationStatus.CANCELLED,
  InvitationStatus.SUPERSEDED,
]);

export const InvitationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  status: InvitationStatusEnum,
  createdAt: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
});

export const SendInvitationBodySchema = z.object({
  email: z.string().email(),
});

export const AcceptInvitationBodySchema = z.object({
  password: z.string().min(8).max(200),
});

export type Invitation = z.infer<typeof InvitationSchema>;
export type SendInvitationBody = z.infer<typeof SendInvitationBodySchema>;
export type AcceptInvitationBody = z.infer<typeof AcceptInvitationBodySchema>;
