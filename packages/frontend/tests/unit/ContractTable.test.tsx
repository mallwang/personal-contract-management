import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ContractTable } from '../../src/components/ContractTable.js';
import type { ContractData } from '@pcm/shared';

function renderTable(
  contracts: ContractData[],
  extra?: Partial<Parameters<typeof ContractTable>[0]>,
) {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <ContractTable contracts={contracts} onDelete={vi.fn()} {...extra} />
      </MemoryRouter>
    </MantineProvider>,
  );
}

const sampleContracts: ContractData[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Netflix',
    category: 'SUBSCRIPTIONS',
    amount: 15.99,
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    endDate: '2026-12-31',
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Rent',
    category: 'HOUSING',
    amount: 1200,
    billingInterval: 'MONTHLY',
    status: 'INACTIVE',
    endDate: null,
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('ContractTable – data display', () => {
  it('renders a row for each contract', () => {
    renderTable(sampleContracts);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('displays the amount and interval label for each contract', () => {
    renderTable(sampleContracts);
    expect(screen.getByText(/15\.99.*Monthly|Monthly.*15\.99/)).toBeInTheDocument();
    expect(screen.getByText(/1[,.]?200.*Monthly|Monthly.*1[,.]?200/)).toBeInTheDocument();
  });

  it('shows the interval label in the column header', () => {
    renderTable(sampleContracts);
    expect(screen.getByText(/amount.*interval/i)).toBeInTheDocument();
  });

  it('displays Quarterly label for a quarterly contract', () => {
    const quarterly: ContractData[] = [
      {
        ...sampleContracts[0]!,
        amount: 30,
        billingInterval: 'QUARTERLY',
      },
    ];
    renderTable(quarterly);
    expect(screen.getByText(/30.*Quarterly|Quarterly.*30/)).toBeInTheDocument();
  });

  it('displays the status for each contract', () => {
    renderTable(sampleContracts);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays the end date formatted for the active locale', () => {
    renderTable(sampleContracts);
    const formatted = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-12-31'));
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it('displays a dash when end date is null', () => {
    renderTable(sampleContracts);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an empty-state message when no contracts are provided', () => {
    renderTable([]);
    expect(screen.getByText(/no contracts yet/i)).toBeInTheDocument();
  });

  it('table uses Mantine Table component (has data-with-table-border attribute)', () => {
    renderTable(sampleContracts);
    expect(screen.getByRole('table')).toHaveAttribute('data-with-table-border');
  });
});

describe('ContractTable – anonymization', () => {
  const getDisplayName = (c: ContractData) => `Fantasy-${c.id.slice(0, 4)}`;

  it('shows real names when isAnonymized=false', () => {
    renderTable(sampleContracts, { isAnonymized: false, getDisplayName });
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('shows fantasy names when isAnonymized=true', () => {
    renderTable(sampleContracts, { isAnonymized: true, getDisplayName });
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    expect(screen.queryByText('Rent')).not.toBeInTheDocument();
    expect(screen.getByText(getDisplayName(sampleContracts[0]!))).toBeInTheDocument();
    expect(screen.getByText(getDisplayName(sampleContracts[1]!))).toBeInTheDocument();
  });

  it('works without optional anonymization props (backwards compat)', () => {
    renderTable(sampleContracts);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });
});

describe('ContractTable – inline delete confirmation', () => {
  it('shows Confirm and Cancel buttons after clicking Delete', async () => {
    const user = userEvent.setup();
    renderTable(sampleContracts);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('reverts to normal row state after clicking Cancel', async () => {
    const user = userEvent.setup();
    renderTable(sampleContracts);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
  });

  it('calls onDelete with the correct id after clicking Confirm', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderTable(sampleContracts, { onDelete });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith(sampleContracts[0]!.id);
  });

  it('does not affect other rows while one is in confirmation mode', async () => {
    const user = userEvent.setup();
    renderTable(sampleContracts);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    // Second row should still have its Delete button
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
  });
});

// Shared test data: original order is Zebra, Apple, Mango
// so sorted order will always differ from original, making sort observable.
const sortContracts: ContractData[] = [
  {
    id: 'sort-1',
    name: 'Zebra',
    category: 'UTILITIES',
    amount: 500,
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    endDate: '2027-06-01',
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sort-2',
    name: 'Apple',
    category: 'SUBSCRIPTIONS',
    amount: 10,
    billingInterval: 'YEARLY',
    status: 'INACTIVE',
    endDate: null,
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sort-3',
    name: 'Mango',
    category: 'HOUSING',
    amount: 1200,
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    endDate: '2026-01-01',
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('ContractTable – sorting', () => {
  it('clicking Name header once sorts rows A→Z', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    await user.click(screen.getByRole('columnheader', { name: /^name/i }));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Zebra');
  });

  it('clicking Name header twice sorts rows Z→A', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    const nameHeader = screen.getByRole('columnheader', { name: /^name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zebra');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Apple');
  });

  it('clicking Name header three times returns to default name-asc order', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    const nameHeader = screen.getByRole('columnheader', { name: /^name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    await user.click(nameHeader);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Zebra');
  });

  it('clicking Amount header sorts rows by numeric amount ascending', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    await user.click(screen.getByRole('columnheader', { name: /^amount/i }));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple'); // 10
    expect(rows[2]).toHaveTextContent('Zebra'); // 500
    expect(rows[3]).toHaveTextContent('Mango'); // 1200
  });

  it('null endDate sorts last ascending and first descending', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    const endDateHeader = screen.getByRole('columnheader', { name: /^end date/i });
    await user.click(endDateHeader);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Mango'); // 2026-01-01 — earliest
    expect(rows[3]).toHaveTextContent('Apple'); // null → last
    await user.click(endDateHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple'); // null → first
    expect(rows[3]).toHaveTextContent('Mango'); // 2026-01-01 — latest real date
  });

  it('clicking a different column resets sort to ascending on the new column', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    await user.click(screen.getByRole('columnheader', { name: /^name/i }));
    // Category asc: HOUSING < SUBSCRIPTIONS < UTILITIES
    await user.click(screen.getByRole('columnheader', { name: /^category/i }));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Mango'); // HOUSING
    expect(rows[2]).toHaveTextContent('Apple'); // SUBSCRIPTIONS
    expect(rows[3]).toHaveTextContent('Zebra'); // UTILITIES
  });
});

describe('ContractTable – sort indicators', () => {
  it('when no sort is active, each sortable header shows a neutral sort icon', () => {
    renderTable(sortContracts);
    const sortableHeaders = ['name', 'category', 'amount', 'status', 'end date'];
    for (const name of sortableHeaders) {
      const header = screen.getByRole('columnheader', { name: new RegExp(`^${name}`, 'i') });
      expect(within(header).getByRole('img', { name: 'Sort' })).toBeInTheDocument();
    }
  });

  it('after clicking a sortable header once, that header shows an ascending icon', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    const nameHeader = screen.getByRole('columnheader', { name: /^name/i });
    await user.click(nameHeader);
    expect(within(nameHeader).getByRole('img', { name: 'Sorted ascending' })).toBeInTheDocument();
  });

  it('after clicking a sortable header twice, that header shows a descending icon', async () => {
    const user = userEvent.setup();
    renderTable(sortContracts);
    const nameHeader = screen.getByRole('columnheader', { name: /^name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    expect(within(nameHeader).getByRole('img', { name: 'Sorted descending' })).toBeInTheDocument();
  });

  it('the Actions column header contains no sort icon', () => {
    renderTable(sortContracts);
    const actionsHeader = screen.getByRole('columnheader', { name: /^actions/i });
    expect(within(actionsHeader).queryByRole('img', { name: 'Sort' })).not.toBeInTheDocument();
  });
});
