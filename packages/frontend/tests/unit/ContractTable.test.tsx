import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ContractTable } from '../../src/components/ContractTable.js';
import type { ContractData } from '@pcm/shared';

const sampleContracts: ContractData[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Netflix',
    category: 'SUBSCRIPTIONS',
    amount: 15.99,
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    endDate: '2026-12-31',
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('ContractTable – data display', () => {
  it('renders a row for each contract', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('displays the amount and interval label for each contract', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/15\.99.*Monthly|Monthly.*15\.99/)).toBeInTheDocument();
    expect(screen.getByText(/1[,.]?200.*Monthly|Monthly.*1[,.]?200/)).toBeInTheDocument();
  });

  it('shows the interval label in the column header', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
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
    render(
      <MemoryRouter>
        <ContractTable contracts={quarterly} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/30.*Quarterly|Quarterly.*30/)).toBeInTheDocument();
  });

  it('displays the status for each contract', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('displays the end date when set', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
  });

  it('displays a dash when end date is null', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an empty-state message when no contracts are provided', () => {
    render(
      <MemoryRouter>
        <ContractTable contracts={[]} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no contracts yet/i)).toBeInTheDocument();
  });
});

describe('ContractTable – inline delete confirmation', () => {
  it('shows Confirm and Cancel buttons after clicking Delete', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('reverts to normal row state after clicking Cancel', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
  });

  it('calls onDelete with the correct id after clicking Confirm', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={onDelete} />
      </MemoryRouter>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith(sampleContracts[0]!.id);
  });

  it('does not affect other rows while one is in confirmation mode', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContractTable contracts={sampleContracts} onDelete={vi.fn()} />
      </MemoryRouter>,
    );
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);
    // Second row should still have its Delete button
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(1);
  });
});
