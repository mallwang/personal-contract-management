import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractForm } from '../../src/components/ContractForm.js';

describe('ContractForm – field rendering', () => {
  it('renders all required fields including billing interval', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/billing interval/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('renders billing interval selector with all 5 options', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByLabelText(/billing interval/i);
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toContain('WEEKLY');
    expect(options).toContain('MONTHLY');
    expect(options).toContain('QUARTERLY');
    expect(options).toContain('YEARLY');
    expect(options).toContain('LIFETIME');
    expect(options).toHaveLength(5);
  });

  it('renders with provided default values', () => {
    render(
      <ContractForm
        defaultValues={{
          name: 'Netflix',
          category: 'SUBSCRIPTIONS',
          amount: '15.99',
          billingInterval: 'QUARTERLY',
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
    const intervalSelect = screen.getByLabelText(/billing interval/i) as HTMLSelectElement;
    expect(intervalSelect.value).toBe('QUARTERLY');
  });

  it('does not render a field labelled Monthly Amount', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText(/monthly amount/i)).not.toBeInTheDocument();
  });
});

describe('ContractForm – validation', () => {
  it('shows a validation error and does not call onSubmit when name is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onSubmit with amount and billingInterval when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Netflix');
    await user.clear(screen.getByLabelText(/^amount/i));
    await user.type(screen.getByLabelText(/^amount/i), '15.99');
    await user.selectOptions(screen.getByLabelText(/billing interval/i), 'YEARLY');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Netflix', amount: 15.99, billingInterval: 'YEARLY' }),
    );
  });

  it('does not include monthlyAmount in the submitted payload', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('monthlyAmount');
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
