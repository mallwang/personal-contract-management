import { z } from 'zod';
import {
  Category,
  ContractStatus,
  BillingInterval,
  CancellationPeriodUnit,
} from '../types/contract.js';

const CategoryEnum = z.enum([
  Category.UTILITIES,
  Category.SUBSCRIPTIONS,
  Category.INSURANCE,
  Category.HOUSING,
  Category.OTHER,
]);

const StatusEnum = z.enum([ContractStatus.ACTIVE, ContractStatus.INACTIVE]);

export const CancellationPeriodUnitSchema = z.enum([
  CancellationPeriodUnit.DAYS,
  CancellationPeriodUnit.WEEKS,
  CancellationPeriodUnit.MONTHS,
]);

export const CancellationPeriodSchema = z.object({
  value: z.number().int().positive(),
  unit: CancellationPeriodUnitSchema,
});

export const BillingIntervalSchema = z.enum([
  BillingInterval.WEEKLY,
  BillingInterval.MONTHLY,
  BillingInterval.QUARTERLY,
  BillingInterval.YEARLY,
  BillingInterval.LIFETIME,
]);

export const ContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  amount: z.number().nonnegative(),
  billingInterval: BillingIntervalSchema,
  status: StatusEnum,
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  details: z.string().max(2000).nullable(),
  serviceUrl: z.string().url().nullable(),
  cancellationPeriod: CancellationPeriodSchema.nullable(),
  anonymize: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ContractListResponseSchema = z.array(ContractSchema);

export const CreateContractBodySchema = z.object({
  name: z.string().min(1).max(200),
  category: CategoryEnum,
  amount: z.number().nonnegative(),
  billingInterval: BillingIntervalSchema,
  status: StatusEnum.default(ContractStatus.ACTIVE),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  details: z.string().max(2000).nullable().optional(),
  serviceUrl: z.string().url().nullable().optional(),
  cancellationPeriod: CancellationPeriodSchema.nullable().optional(),
  anonymize: z.boolean().optional(),
});

export const UpdateContractBodySchema = CreateContractBodySchema.partial();

export type ContractData = z.infer<typeof ContractSchema>;
export type ContractListResponse = z.infer<typeof ContractListResponseSchema>;
export type CreateContractBody = z.infer<typeof CreateContractBodySchema>;
export type UpdateContractBody = z.infer<typeof UpdateContractBodySchema>;
