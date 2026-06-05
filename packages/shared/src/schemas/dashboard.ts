import { z } from 'zod';
import { Category } from '../types/contract.js';

const CategoryEnum = z.enum([
  Category.UTILITIES,
  Category.SUBSCRIPTIONS,
  Category.INSURANCE,
  Category.HOUSING,
  Category.OTHER,
]);

export const CategorySummarySchema = z.object({
  category: CategoryEnum,
  label: z.string(),
  count: z.number().int().nonnegative(),
  monthlyTotal: z.number().nonnegative(),
});

export const UpcomingRenewalSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysRemaining: z.number().int().nonnegative(),
});

export const ExpiredContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysOverdue: z.number().int().positive(),
  anonymize: z.boolean(),
});

export const DashboardResponseSchema = z.object({
  totalMonthlySpending: z.number().nonnegative(),
  contractsByCategory: z.array(CategorySummarySchema),
  upcomingRenewals: z.array(UpcomingRenewalSchema),
  expiredContracts: z.array(ExpiredContractSchema),
});

export type CategorySummary = z.infer<typeof CategorySummarySchema>;
export type UpcomingRenewal = z.infer<typeof UpcomingRenewalSchema>;
export type ExpiredContract = z.infer<typeof ExpiredContractSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
