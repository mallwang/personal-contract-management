import { z } from 'zod';
import { Role } from '../types/user.js';

const RoleEnum = z.enum([Role.ADMIN, Role.MEMBER]);

export const SignInBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: RoleEnum,
});

export const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export type SignInBody = z.infer<typeof SignInBodySchema>;
export type SessionUser = z.infer<typeof SessionUserSchema>;
export type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;
