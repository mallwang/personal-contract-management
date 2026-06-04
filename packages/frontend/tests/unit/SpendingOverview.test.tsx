import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpendingOverview } from '../../src/components/SpendingOverview.js';

describe('SpendingOverview', () => {
  it('renders the formatted monthly spending amount', () => {
    render(<SpendingOverview totalMonthlySpending={1347.5} />);
    expect(screen.getByText(/1[,.]?347[.,]50/)).toBeInTheDocument();
  });

  it('renders an empty-state message when spending is 0', () => {
    render(<SpendingOverview totalMonthlySpending={0} />);
    expect(screen.getByText(/no active contracts/i)).toBeInTheDocument();
  });

  it('renders a heading for the section', () => {
    render(<SpendingOverview totalMonthlySpending={100} />);
    expect(screen.getByRole('heading', { name: /monthly spending/i })).toBeInTheDocument();
  });
});
