import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ExpiredContracts } from '../../src/components/ExpiredContracts.js';
import type { ExpiredContract } from '@pcm/shared';

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

const STORAGE_KEY = 'pcm-anonymize';

const sampleData: ExpiredContract[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Old Gym Membership',
    category: 'OTHER',
    endDate: '2026-03-01',
    daysOverdue: 96,
    anonymize: false,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Expired Insurance',
    category: 'INSURANCE',
    endDate: '2026-04-15',
    daysOverdue: 51,
    anonymize: false,
  },
];

describe('ExpiredContracts', () => {
  it('renders a heading for the section', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
    expect(screen.getByRole('heading', { name: /expired contracts/i })).toBeInTheDocument();
  });

  it('renders the contract name for each entry', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
    expect(screen.getByText('Old Gym Membership')).toBeInTheDocument();
    expect(screen.getByText('Expired Insurance')).toBeInTheDocument();
  });

  it('renders the end date for each entry formatted for the active locale', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
    const fmt = (iso: string) =>
      new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(iso));
    expect(screen.getByText(fmt('2026-03-01'))).toBeInTheDocument();
    expect(screen.getByText(fmt('2026-04-15'))).toBeInTheDocument();
  });

  it('renders a days overdue badge for each entry', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
    expect(screen.getByText(/96 days overdue/i)).toBeInTheDocument();
    expect(screen.getByText(/51 days overdue/i)).toBeInTheDocument();
  });

  it('renders empty-state message when array is empty', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={[]} />);
    expect(screen.getByText(/no expired contracts/i)).toBeInTheDocument();
  });

  it('renders links to contract edit page for each entry', () => {
    renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/contracts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit');
    expect(hrefs).toContain('/contracts/b2c3d4e5-f6a7-8901-bcde-f12345678901/edit');
  });

  it('does not apply amber card classes when list is empty', () => {
    const { container } = renderWithRouter(<ExpiredContracts expiredContracts={[]} />);
    expect(container.firstChild).not.toHaveClass('border-amber-200');
    expect(container.firstChild).not.toHaveClass('bg-amber-50');
  });

  describe('anonymization', () => {
    afterEach(() => {
      localStorage.removeItem(STORAGE_KEY);
    });

    it('shows real name when global toggle is off and anonymize flag is false', () => {
      renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
      expect(screen.getByText('Old Gym Membership')).toBeInTheDocument();
    });

    it('hides real name when global toggle is on', () => {
      localStorage.setItem(STORAGE_KEY, '1');
      renderWithRouter(<ExpiredContracts expiredContracts={sampleData} />);
      expect(screen.queryByText('Old Gym Membership')).not.toBeInTheDocument();
    });

    it('hides real name for per-contract anonymize flag even when global toggle is off', () => {
      const withAnonymized: ExpiredContract[] = [
        { ...sampleData[0]!, anonymize: true },
        { ...sampleData[1]!, anonymize: false },
      ];
      renderWithRouter(<ExpiredContracts expiredContracts={withAnonymized} />);
      expect(screen.queryByText('Old Gym Membership')).not.toBeInTheDocument();
      expect(screen.getByText('Expired Insurance')).toBeInTheDocument();
    });
  });
});
