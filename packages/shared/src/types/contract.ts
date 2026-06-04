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

export interface Contract {
  id: string;
  name: string;
  category: Category;
  monthlyAmount: number;
  status: ContractStatus;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}
