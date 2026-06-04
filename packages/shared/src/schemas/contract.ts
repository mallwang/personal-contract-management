import { z } from 'zod';
import { Category, ContractStatus } from '../types/contract.js';

const CategoryEnum = z.enum([
  Category.UTILITIES,
  Category.SUBSCRIPTIONS,
  Category.INSURANCE,
  Category.HOUSING,
  Category.OTHER,
]);

const StatusEnum = z.enum([ContractStatus.ACTIVE, ContractStatus.INACTIVE]);

export const ContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  monthlyAmount: z.number().nonnegative(),
  status: StatusEnum,
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ContractListResponseSchema = z.array(ContractSchema);

export const CreateContractBodySchema = z.object({
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  monthlyAmount: z.number().nonnegative(),
  status: StatusEnum.default(ContractStatus.ACTIVE),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const UpdateContractBodySchema = CreateContractBodySchema.partial();

export type ContractData = z.infer<typeof ContractSchema>;
export type ContractListResponse = z.infer<typeof ContractListResponseSchema>;
export type CreateContractBody = z.infer<typeof CreateContractBodySchema>;
export type UpdateContractBody = z.infer<typeof UpdateContractBodySchema>;
