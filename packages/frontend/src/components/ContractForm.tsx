import { useState } from 'react';
import { Category, ContractStatus, CATEGORY_LABELS } from '@pcm/shared';
import type { CreateContractBody } from '@pcm/shared';

interface ContractFormValues {
  name: string;
  category: string;
  monthlyAmount: string;
  status: string;
  endDate: string;
}

interface ContractFormProps {
  defaultValues?: Partial<ContractFormValues>;
  onSubmit: (data: CreateContractBody) => void;
  onCancel: () => void;
  submitLabel?: string;
  error?: string | null;
  isPending?: boolean;
}

export function ContractForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  error,
  isPending,
}: ContractFormProps) {
  const [values, setValues] = useState<ContractFormValues>({
    name: defaultValues?.name ?? '',
    category: defaultValues?.category ?? Category.SUBSCRIPTIONS,
    monthlyAmount: defaultValues?.monthlyAmount ?? '',
    status: defaultValues?.status ?? ContractStatus.ACTIVE,
    endDate: defaultValues?.endDate ?? '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!values.name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    const amount = parseFloat(values.monthlyAmount);
    if (isNaN(amount) || amount < 0) {
      setValidationError('Monthly amount must be a non-negative number.');
      return;
    }

    onSubmit({
      name: values.name.trim(),
      category: values.category as CreateContractBody['category'],
      monthlyAmount: amount,
      status: values.status as CreateContractBody['status'],
      endDate: values.endDate || null,
    });
  }

  function field(
    id: string,
    label: string,
    input: React.ReactNode,
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {input}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {(validationError ?? error) && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {validationError ?? error}
        </p>
      )}

      {field(
        'name',
        'Name *',
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="e.g. Netflix"
        />,
      )}

      {field(
        'category',
        'Category *',
        <select
          id="category"
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>,
      )}

      {field(
        'monthlyAmount',
        'Monthly Amount *',
        <input
          id="monthlyAmount"
          type="number"
          min="0"
          step="0.01"
          value={values.monthlyAmount}
          onChange={(e) => setValues((v) => ({ ...v, monthlyAmount: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="0.00"
        />,
      )}

      {field(
        'status',
        'Status *',
        <select
          id="status"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value={ContractStatus.ACTIVE}>Active</option>
          <option value={ContractStatus.INACTIVE}>Inactive</option>
        </select>,
      )}

      {field(
        'endDate',
        'End Date',
        <input
          id="endDate"
          type="date"
          value={values.endDate}
          onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        />,
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-1.5 text-sm hover:bg-[--color-muted]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
