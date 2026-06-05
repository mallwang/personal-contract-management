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

describe('ContractForm – new fields rendering', () => {
  it('renders the start date input', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('renders the details textarea', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/details/i)).toBeInTheDocument();
  });

  it('renders the character counter showing 0/2000 by default', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('updates the character counter as text is typed in details', async () => {
    const user = userEvent.setup();
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/details/i), 'Hello');
    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  it('renders the service URL input', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/service url/i)).toBeInTheDocument();
  });

  it('renders an anchor link when defaultValues.serviceUrl is a valid URL', () => {
    render(
      <ContractForm
        defaultValues={{ serviceUrl: 'https://example.com' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /https:\/\/example\.com/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render an anchor link when serviceUrl is empty', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the cancellation period number input', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/cancellation period/i)).toBeInTheDocument();
  });

  it('renders the cancellation period unit select with DAYS, WEEKS, MONTHS options', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const select = screen.getByLabelText(/cancellation unit/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('DAYS');
    expect(options).toContain('WEEKS');
    expect(options).toContain('MONTHS');
  });
});

describe('ContractForm – new fields submission', () => {
  it('assembles cancellationPeriod object when value and unit are provided', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Gym');
    await user.type(screen.getByLabelText(/^amount/i), '40');
    await user.type(screen.getByLabelText(/cancellation period/i), '30');
    await user.selectOptions(screen.getByLabelText(/cancellation unit/i), 'DAYS');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.cancellationPeriod).toEqual({ value: 30, unit: 'DAYS' });
  });

  it('sends cancellationPeriod: null when value input is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.cancellationPeriod).toBeNull();
  });

  it('includes startDate as null when not set', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.startDate).toBeNull();
  });

  it('includes serviceUrl when provided', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.type(screen.getByLabelText(/service url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.serviceUrl).toBe('https://example.com');
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

describe('ContractForm – anonymize field', () => {
  it('renders the anonymize checkbox', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/anonymize/i)).toBeInTheDocument();
  });

  it('anonymize checkbox is unchecked by default', () => {
    render(<ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const cb = screen.getByLabelText(/anonymize/i) as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it('pre-checks anonymize when defaultValues.anonymize=true', () => {
    render(
      <ContractForm defaultValues={{ anonymize: true }} onSubmit={vi.fn()} onCancel={vi.fn()} />,
    );
    const cb = screen.getByLabelText(/anonymize/i) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('submits anonymize=false when unchecked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.anonymize).toBe(false);
  });

  it('submits anonymize=true when checked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContractForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByLabelText(/anonymize/i));
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.anonymize).toBe(true);
  });
});
