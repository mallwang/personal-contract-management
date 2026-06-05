export const Category = {
  UTILITIES: 'UTILITIES',
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  INSURANCE: 'INSURANCE',
  HOUSING: 'HOUSING',
  OTHER: 'OTHER',
} as const;

export type Category = (typeof Category)[keyof typeof Category];

export const CATEGORY_LABELS: Record<Category, string> = {
  UTILITIES: 'Utilities',
  SUBSCRIPTIONS: 'Subscriptions',
  INSURANCE: 'Insurance',
  HOUSING: 'Housing',
  OTHER: 'Other',
};

export const ContractStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const CancellationPeriodUnit = {
  DAYS: 'DAYS',
  WEEKS: 'WEEKS',
  MONTHS: 'MONTHS',
} as const;

export type CancellationPeriodUnit =
  (typeof CancellationPeriodUnit)[keyof typeof CancellationPeriodUnit];

export const CANCELLATION_PERIOD_UNIT_LABELS: Record<CancellationPeriodUnit, string> = {
  DAYS: 'Days',
  WEEKS: 'Weeks',
  MONTHS: 'Months',
};

export const BillingInterval = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
  LIFETIME: 'LIFETIME',
} as const;

export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval];

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  LIFETIME: 'Lifetime',
};

export interface Contract {
  id: string;
  name: string;
  category: Category;
  amount: number;
  billingInterval: BillingInterval;
  status: ContractStatus;
  endDate: string | null;
  startDate: string | null;
  details: string | null;
  serviceUrl: string | null;
  cancellationPeriod: { value: number; unit: CancellationPeriodUnit } | null;
  anonymize: boolean;
  createdAt: string;
  updatedAt: string;
}
