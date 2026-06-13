import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { ContractForm } from '../../src/components/ContractForm.js';

function renderForm(props?: Partial<Parameters<typeof ContractForm>[0]>) {
  return render(
    <MantineProvider>
      <ContractForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
    </MantineProvider>,
  );
}

// Returns the combobox input for a Mantine Select by its accessible name.
// Mantine Select renders as a textbox with aria-haspopup, not explicit role="combobox".
function getCombobox(name: RegExp | string) {
  // getAllByRole includes hidden elements that getByRole might skip; filter by aria-haspopup
  return screen
    .getAllByRole('textbox', { name })
    .find((el) => el.getAttribute('aria-haspopup') !== null)!;
}

// Open a Mantine Select and click an option by display text
async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp | string,
  optionLabel: RegExp | string,
) {
  const combobox = getCombobox(name);
  await user.click(combobox);
  const option = await screen.findByRole('option', { name: optionLabel });
  await user.click(option);
}

describe('ContractForm – Mantine input style', () => {
  it('amount field has a visible EUR currency prefix when a value is set', () => {
    renderForm({ defaultValues: { amount: '100' } });
    // Mantine NumberInput with prefix="€" shows "€100" as the input value
    const amountInput = screen.getByLabelText(/^amount/i);
    expect(amountInput).toHaveDisplayValue(/€/);
  });

  it('name input is wrapped in a Mantine filled variant container', () => {
    renderForm();
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput.closest('[data-variant="filled"]')).not.toBeNull();
  });
});

describe('ContractForm – field rendering', () => {
  it('renders the name input', () => {
    renderForm();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('renders the amount input', () => {
    renderForm();
    expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
  });

  it('renders the billing interval select', () => {
    renderForm();
    expect(getCombobox(/billing interval/i)).toBeInTheDocument();
  });

  it('renders billing interval selector with all 5 options', async () => {
    const user = userEvent.setup();
    renderForm();
    const combobox = getCombobox(/billing interval/i);
    await user.click(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: /weekly/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /monthly/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /quarterly/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /yearly/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /lifetime/i })).toBeInTheDocument();
  });

  it('renders with provided default values', () => {
    renderForm({
      defaultValues: {
        name: 'Netflix',
        category: 'SUBSCRIPTIONS',
        amount: '15.99',
        billingInterval: 'QUARTERLY',
        status: 'ACTIVE',
        endDate: '2026-12-31',
      },
    });
    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount/i)).toHaveDisplayValue(/15\.99/);
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
    // Mantine Select shows the option LABEL (not value) in the combobox
    const billingCombobox = getCombobox(/billing interval/i);
    expect(billingCombobox).toHaveDisplayValue(/quarterly/i);
  });

  it('does not render a field labelled Monthly Amount', () => {
    renderForm();
    expect(screen.queryByLabelText(/monthly amount/i)).not.toBeInTheDocument();
  });
});

describe('ContractForm – validation', () => {
  it('shows a validation error and does not call onSubmit when name is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onSubmit with amount and billingInterval when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/name/i), 'Netflix');
    await user.clear(screen.getByLabelText(/^amount/i));
    await user.type(screen.getByLabelText(/^amount/i), '15.99');
    await selectOption(user, /billing interval/i, /yearly/i);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Netflix', amount: 15.99, billingInterval: 'YEARLY' }),
    );
  });

  it('does not include monthlyAmount in the submitted payload', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
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
    renderForm();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('renders the details textarea', () => {
    renderForm();
    expect(screen.getByLabelText(/details/i)).toBeInTheDocument();
  });

  it('renders the character counter showing 0/2000 by default', () => {
    renderForm();
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('updates the character counter as text is typed in details', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/details/i), 'Hello');
    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  it('renders the service URL input', () => {
    renderForm();
    expect(screen.getByLabelText(/service url/i)).toBeInTheDocument();
  });

  it('renders an anchor link when defaultValues.serviceUrl is a valid URL', () => {
    renderForm({ defaultValues: { serviceUrl: 'https://example.com' } });
    const link = screen.getByRole('link', { name: /https:\/\/example\.com/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render an anchor link when serviceUrl is empty', () => {
    renderForm();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the cancellation period number input', () => {
    renderForm();
    expect(screen.getByLabelText(/cancellation period/i)).toBeInTheDocument();
  });

  it('renders the cancellation period unit select with DAYS, WEEKS, MONTHS options', async () => {
    const user = userEvent.setup();
    renderForm();
    const unitCombobox = getCombobox(/cancellation unit/i);
    await user.click(unitCombobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: /days/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /weeks/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /months/i })).toBeInTheDocument();
  });
});

describe('ContractForm – new fields submission', () => {
  it('assembles cancellationPeriod object when value and unit are provided', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/name/i), 'Gym');
    await user.type(screen.getByLabelText(/^amount/i), '40');
    await user.type(screen.getByLabelText(/cancellation period/i), '30');
    await selectOption(user, /cancellation unit/i, /days/i);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.cancellationPeriod).toEqual({ value: 30, unit: 'DAYS' });
  });

  it('sends cancellationPeriod: null when value input is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
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
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.startDate).toBeNull();
  });

  it('includes serviceUrl when provided', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
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
    renderForm({ onCancel });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('ContractForm – anonymize field', () => {
  it('renders the anonymize checkbox', () => {
    renderForm();
    expect(screen.getByLabelText(/anonymize/i)).toBeInTheDocument();
  });

  it('anonymize checkbox is unchecked by default', () => {
    renderForm();
    const cb = screen.getByLabelText(/anonymize/i) as HTMLInputElement;
    expect(cb.checked).toBe(false);
  });

  it('pre-checks anonymize when defaultValues.anonymize=true', () => {
    renderForm({ defaultValues: { anonymize: true } });
    const cb = screen.getByLabelText(/anonymize/i) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('submits anonymize=false when unchecked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.anonymize).toBe(false);
  });

  it('submits anonymize=true when checked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });
    await user.type(screen.getByLabelText(/name/i), 'Test');
    await user.type(screen.getByLabelText(/^amount/i), '10');
    await user.click(screen.getByLabelText(/anonymize/i));
    await user.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.anonymize).toBe(true);
  });
});
