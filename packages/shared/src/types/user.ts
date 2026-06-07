export const Role = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}
