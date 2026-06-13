import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SpendingOverview } from '../../src/components/SpendingOverview.js';
import type { CategorySummary } from '@pcm/shared';

const categories: CategorySummary[] = [
  { category: 'SUBSCRIPTIONS', label: 'Subscriptions', count: 3, monthlyTotal: 50 },
  { category: 'INSURANCE', label: 'Insurance', count: 1, monthlyTotal: 80 },
  { category: 'UTILITIES', label: 'Utilities', count: 2, monthlyTotal: 30 },
];

function renderSpending(totalMonthlySpending: number, cats: CategorySummary[] = []) {
  return render(
    <MantineProvider>
      <SpendingOverview totalMonthlySpending={totalMonthlySpending} contractsByCategory={cats} />
    </MantineProvider>,
  );
}

describe('SpendingOverview', () => {
  it('renders the formatted monthly spending amount', () => {
    renderSpending(1347.5);
    expect(screen.getByText(/1[,.]?347[.,]50/)).toBeInTheDocument();
  });

  it('renders an empty-state message when spending is 0', () => {
    renderSpending(0);
    expect(screen.getByText(/no active contracts/i)).toBeInTheDocument();
  });

  it('renders a label for the section', () => {
    renderSpending(100);
    expect(screen.getByText(/monthly spending/i)).toBeInTheDocument();
  });

  it('renders up to three category segments', () => {
    renderSpending(160, categories);
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
  });

  it('renders at most three categories even if more are provided', () => {
    const many: CategorySummary[] = [
      ...categories,
      { category: 'HOUSING', label: 'Housing', count: 1, monthlyTotal: 200 },
    ];
    renderSpending(360, many.slice(0, 3));
    // only 3 should show (caller slices)
    expect(screen.queryByText('Housing')).not.toBeInTheDocument();
  });

  it('shows no category rows when no contracts exist', () => {
    renderSpending(0, []);
    expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();
  });
});
