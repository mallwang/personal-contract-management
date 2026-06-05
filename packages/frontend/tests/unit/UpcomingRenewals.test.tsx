import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpcomingRenewals } from '../../src/components/UpcomingRenewals.js';
import type { UpcomingRenewal } from '@pcm/shared';

const sampleData: UpcomingRenewal[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Netflix',
    category: 'SUBSCRIPTIONS',
    endDate: '2026-06-19',
    daysRemaining: 15,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Adobe CC',
    category: 'SUBSCRIPTIONS',
    endDate: '2026-06-25',
    daysRemaining: 21,
  },
];

describe('UpcomingRenewals', () => {
  it('renders a heading for the section', () => {
    render(<UpcomingRenewals upcomingRenewals={sampleData} />);
    expect(screen.getByRole('heading', { name: /upcoming renewals/i })).toBeInTheDocument();
  });

  it('renders the contract name for each renewal', () => {
    render(<UpcomingRenewals upcomingRenewals={sampleData} />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Adobe CC')).toBeInTheDocument();
  });

  it('renders the days remaining for each contract', () => {
    render(<UpcomingRenewals upcomingRenewals={sampleData} />);
    expect(screen.getByText(/15 days/i)).toBeInTheDocument();
    expect(screen.getByText(/21 days/i)).toBeInTheDocument();
  });

  it('renders the end date for each contract formatted for the active locale', () => {
    render(<UpcomingRenewals upcomingRenewals={sampleData} />);
    const formatted = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-06-19'));
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it('renders empty-state message when array is empty', () => {
    render(<UpcomingRenewals upcomingRenewals={[]} />);
    expect(screen.getByText(/no renewals due soon/i)).toBeInTheDocument();
  });
});
