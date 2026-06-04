import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBreakdown } from '../../src/components/CategoryBreakdown.js';
import type { CategorySummary } from '@pcm/shared';

const sampleData: CategorySummary[] = [
  { category: 'HOUSING', label: 'Housing', count: 1, monthlyTotal: 1200 },
  { category: 'SUBSCRIPTIONS', label: 'Subscriptions', count: 3, monthlyTotal: 45.5 },
];

describe('CategoryBreakdown', () => {
  it('renders a heading for the section', () => {
    render(<CategoryBreakdown contractsByCategory={sampleData} />);
    expect(screen.getByRole('heading', { name: /by category/i })).toBeInTheDocument();
  });

  it('renders one row per category', () => {
    render(<CategoryBreakdown contractsByCategory={sampleData} />);
    expect(screen.getByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
  });

  it('renders the count for each category', () => {
    render(<CategoryBreakdown contractsByCategory={sampleData} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the formatted monthly total for each category', () => {
    render(<CategoryBreakdown contractsByCategory={sampleData} />);
    expect(screen.getByText(/1[,.]?200/)).toBeInTheDocument();
  });

  it('renders an empty-state message when array is empty', () => {
    render(<CategoryBreakdown contractsByCategory={[]} />);
    expect(screen.getByText(/no active contracts/i)).toBeInTheDocument();
  });
});
