import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractForm } from '../../src/components/ContractForm.js';

describe('ContractForm – field rendering', () => {
  it('renders all required fields', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('renders with provided default values', () => {
    render(
      <ContractForm
        defaultValues={{
          name: 'Netflix',
          category: 'SUBSCRIPTIONS',
          monthlyAmount: '15.99',
          status: 'ACTIVE',
          endDate: '2026-12-31',
        }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
  });
});

describe('ContractForm – validation', () => {
  it('shows a validation error and does not call onSubmit when name is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    // Fill in amount but leave name blank
    await user.type(screen.getByLabelText(/monthly amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Netflix');
    await user.clear(screen.getByLabelText(/monthly amount/i));
    await user.type(screen.getByLabelText(/monthly amount/i), '15.99');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Netflix', monthlyAmount: 15.99 }),
    );
  });
});

describe('ContractForm – cancel', () => {
  it('calls onCancel when the Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
