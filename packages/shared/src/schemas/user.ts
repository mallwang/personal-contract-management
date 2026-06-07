import { z } from 'zod';
import { Role, AccountStatus } from '../types/user.js';

const RoleEnum = z.enum([Role.ADMIN, Role.MEMBER]);
const AccountStatusEnum = z.enum([AccountStatus.ACTIVE, AccountStatus.ARCHIVED]);

export const AccountSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: RoleEnum,
  status: AccountStatusEnum,
  createdAt: z.string(),
});

export const AccountListResponseSchema = z.array(AccountSchema);

export const CreateAccountBodySchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: RoleEnum,
  initialPassword: z.string().min(8).max(200),
});

export const ChangeRoleBodySchema = z.object({
  role: RoleEnum,
});

export type Account = z.infer<typeof AccountSchema>;
export type AccountListResponse = z.infer<typeof AccountListResponseSchema>;
export type CreateAccountBody = z.infer<typeof CreateAccountBodySchema>;
export type ChangeRoleBody = z.infer<typeof ChangeRoleBodySchema>;
