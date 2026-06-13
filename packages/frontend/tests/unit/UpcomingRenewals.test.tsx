import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { UpcomingRenewals } from '../../src/components/UpcomingRenewals.js';
import type { UpcomingRenewal } from '@pcm/shared';

const sampleData: UpcomingRenewal[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Netflix',
    category: 'SUBSCRIPTIONS',
    endDate: '2026-06-19',
    cancellationDeadline: '2026-06-12',
    daysUntilCancellationDeadline: 6,
    anonymize: false,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Adobe CC',
    category: 'SUBSCRIPTIONS',
    endDate: '2026-07-25',
    cancellationDeadline: '2026-06-25',
    daysUntilCancellationDeadline: 19,
    anonymize: false,
  },
];

const overdueData: UpcomingRenewal[] = [
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Home Insurance',
    category: 'INSURANCE',
    endDate: '2026-08-01',
    cancellationDeadline: '2026-05-01',
    daysUntilCancellationDeadline: -36,
    anonymize: false,
  },
];

describe('UpcomingRenewals', () => {
  it('renders a heading for the section', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    expect(screen.getByRole('heading', { name: /upcoming renewals/i })).toBeInTheDocument();
  });

  it('renders the contract name for each renewal', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Adobe CC')).toBeInTheDocument();
  });

  it('renders days remaining badge for contracts with positive daysUntilCancellationDeadline', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    expect(screen.getByText(/6 days remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/19 days remaining/i)).toBeInTheDocument();
  });

  it('renders an overdue badge for contracts with negative daysUntilCancellationDeadline', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={overdueData} />
      </MantineProvider>,
    );
    expect(screen.getByText(/36 days overdue/i)).toBeInTheDocument();
  });

  it('renders "Cancel by" label for each contract', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    expect(screen.getAllByText(/cancel by/i).length).toBeGreaterThan(0);
  });

  it('renders "Ends" label for each contract', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    expect(screen.getAllByText(/ends/i).length).toBeGreaterThan(0);
  });

  it('renders the cancellation deadline date formatted for the active locale', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={sampleData} />
      </MantineProvider>,
    );
    const formatted = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-06-12'));
    expect(screen.getByText(new RegExp(formatted.replace(/[/.]/g, '\\$&')))).toBeInTheDocument();
  });

  it('renders empty-state message when array is empty', () => {
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={[]} />
      </MantineProvider>,
    );
    expect(screen.getByText(/no renewals due soon/i)).toBeInTheDocument();
  });

  it('hides real name and shows a fantasy name when contract anonymize is true', () => {
    const anonymizedData: UpcomingRenewal[] = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Netflix',
        category: 'SUBSCRIPTIONS',
        endDate: '2026-06-19',
        cancellationDeadline: '2026-06-12',
        daysUntilCancellationDeadline: 6,
        anonymize: true,
      },
    ];
    render(
      <MantineProvider>
        <UpcomingRenewals upcomingRenewals={anonymizedData} />
      </MantineProvider>,
    );
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
  });
});
