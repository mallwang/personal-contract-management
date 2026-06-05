import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Category, ContractStatus, BillingInterval, CancellationPeriodUnit } from '@pcm/shared';
import type { CreateContractBody } from '@pcm/shared';

interface ContractFormValues {
  name: string;
  category: string;
  amount: string;
  billingInterval: string;
  status: string;
  endDate: string;
  startDate: string;
  details: string;
  serviceUrl: string;
  cancellationPeriodValue: string;
  cancellationPeriodUnit: string;
  anonymize: boolean;
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
  submitLabel,
  error,
  isPending,
}: ContractFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ContractFormValues>({
    name: defaultValues?.name ?? '',
    category: defaultValues?.category ?? Category.SUBSCRIPTIONS,
    amount: defaultValues?.amount ?? '',
    billingInterval: defaultValues?.billingInterval ?? BillingInterval.MONTHLY,
    status: defaultValues?.status ?? ContractStatus.ACTIVE,
    endDate: defaultValues?.endDate ?? '',
    startDate: defaultValues?.startDate ?? '',
    details: defaultValues?.details ?? '',
    serviceUrl: defaultValues?.serviceUrl ?? '',
    cancellationPeriodValue: defaultValues?.cancellationPeriodValue ?? '',
    cancellationPeriodUnit: defaultValues?.cancellationPeriodUnit ?? 'MONTHS',
    anonymize: defaultValues?.anonymize ?? false,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!values.name.trim()) {
      setValidationError(t('contractForm.nameRequired'));
      return;
    }
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount < 0) {
      setValidationError(t('contractForm.amountInvalid'));
      return;
    }

    const cancellationPeriodValueNum = values.cancellationPeriodValue
      ? parseInt(values.cancellationPeriodValue, 10)
      : null;

    onSubmit({
      name: values.name.trim(),
      category: values.category as CreateContractBody['category'],
      amount,
      billingInterval: values.billingInterval as CreateContractBody['billingInterval'],
      status: values.status as CreateContractBody['status'],
      endDate: values.endDate || null,
      startDate: values.startDate || null,
      details: values.details || null,
      serviceUrl: values.serviceUrl || null,
      cancellationPeriod:
        cancellationPeriodValueNum !== null
          ? {
              value: cancellationPeriodValueNum,
              unit: values.cancellationPeriodUnit as CancellationPeriodUnit,
            }
          : null,
      anonymize: values.anonymize,
    });
  }

  function field(id: string, label: string, input: React.ReactNode) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {input}
      </div>
    );
  }

  let serviceUrlLink: React.ReactNode = null;
  try {
    if (values.serviceUrl) {
      new URL(values.serviceUrl);
      serviceUrlLink = (
        <a
          href={values.serviceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-blue-600 hover:underline"
        >
          {values.serviceUrl}
        </a>
      );
    }
  } catch {
    // invalid URL — no link shown
  }

  const categories = Object.values(Category);
  const billingIntervals = Object.values(BillingInterval);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {(validationError ?? error) && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {validationError ?? error}
        </p>
      )}

      {field(
        'name',
        t('contractForm.nameLabel'),
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder={t('contractForm.namePlaceholder')}
        />,
      )}

      {field(
        'category',
        t('contractForm.categoryLabel'),
        <select
          id="category"
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {categories.map((value) => (
            <option key={value} value={value}>
              {t(`category.${value}`)}
            </option>
          ))}
        </select>,
      )}

      {field(
        'amount',
        t('contractForm.amountLabel'),
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={values.amount}
          onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder="0.00"
        />,
      )}

      {field(
        'billingInterval',
        t('contractForm.billingIntervalLabel'),
        <select
          id="billingInterval"
          value={values.billingInterval}
          onChange={(e) => setValues((v) => ({ ...v, billingInterval: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          {billingIntervals.map((value) => (
            <option key={value} value={value}>
              {t(`billingInterval.${value}`)}
            </option>
          ))}
        </select>,
      )}

      {field(
        'status',
        t('contractForm.statusLabel'),
        <select
          id="status"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value={ContractStatus.ACTIVE}>{t('status.ACTIVE')}</option>
          <option value={ContractStatus.INACTIVE}>{t('status.INACTIVE')}</option>
        </select>,
      )}

      <div className="grid grid-cols-2 gap-3">
        {field(
          'startDate',
          t('contractForm.startDateLabel'),
          <input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
            className="rounded border px-3 py-1.5 text-sm"
          />,
        )}
        {field(
          'endDate',
          t('contractForm.endDateLabel'),
          <input
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
            className="rounded border px-3 py-1.5 text-sm"
          />,
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="details" className="text-sm font-medium">
          {t('contractForm.detailsLabel')}
        </label>
        <textarea
          id="details"
          value={values.details}
          onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          rows={3}
          maxLength={2000}
          placeholder={t('contractForm.detailsPlaceholder')}
        />
        <span
          className={`text-right text-xs ${values.details.length >= 1900 ? 'text-red-600' : 'text-[--color-muted-foreground]'}`}
        >
          {values.details.length}/2000
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="serviceUrl" className="text-sm font-medium">
          {t('contractForm.serviceUrlLabel')}
        </label>
        <input
          id="serviceUrl"
          type="url"
          value={values.serviceUrl}
          onChange={(e) => setValues((v) => ({ ...v, serviceUrl: e.target.value }))}
          className="rounded border px-3 py-1.5 text-sm"
          placeholder={t('contractForm.serviceUrlPlaceholder')}
        />
        {serviceUrlLink}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cancellationPeriodValue" className="text-sm font-medium">
          {t('contractForm.cancellationPeriodLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="cancellationPeriodValue"
            type="number"
            min="1"
            value={values.cancellationPeriodValue}
            onChange={(e) => setValues((v) => ({ ...v, cancellationPeriodValue: e.target.value }))}
            className="w-24 rounded border px-3 py-1.5 text-sm"
            placeholder="e.g. 30"
          />
          <select
            id="cancellationPeriodUnit"
            aria-label={t('contractForm.cancellationUnitAriaLabel')}
            value={values.cancellationPeriodUnit}
            onChange={(e) => setValues((v) => ({ ...v, cancellationPeriodUnit: e.target.value }))}
            className="rounded border px-3 py-1.5 text-sm"
          >
            {Object.values(CancellationPeriodUnit).map((value) => (
              <option key={value} value={value}>
                {t(`cancellationUnit.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-start gap-2 pt-1">
        <input
          id="anonymize"
          type="checkbox"
          checked={values.anonymize}
          onChange={(e) => setValues((v) => ({ ...v, anonymize: e.target.checked }))}
          className="mt-0.5 h-4 w-4 rounded border"
        />
        <div className="flex flex-col gap-0.5">
          <label htmlFor="anonymize" className="cursor-pointer text-sm font-medium">
            {t('anonymization.anonymizeContract')}
          </label>
          <span className="text-xs text-[--color-muted-foreground]">
            {t('anonymization.anonymizeContractHint')}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? t('common.saving') : (submitLabel ?? t('common.save'))}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-1.5 text-sm hover:bg-[--color-muted]"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
