import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Checkbox,
  Button,
  Group,
  Stack,
  Alert,
  Text,
  Anchor,
} from '@mantine/core';
import { Category, ContractStatus, BillingInterval, CancellationPeriodUnit } from '@pcm/shared';
import type { CreateContractBody } from '@pcm/shared';
import { ProviderLogo } from './ProviderLogo.js';
import classes from './ContractForm.module.css';

interface ContractFormValues {
  name: string;
  category: string;
  amount: string | number;
  billingInterval: string;
  status: string;
  endDate: string;
  startDate: string;
  details: string;
  serviceUrl: string;
  cancellationPeriodValue: string | number;
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

    if (!String(values.name).trim()) {
      setValidationError(t('contractForm.nameRequired'));
      return;
    }
    const amount =
      typeof values.amount === 'number' ? values.amount : parseFloat(String(values.amount));
    if (isNaN(amount) || amount < 0) {
      setValidationError(t('contractForm.amountInvalid'));
      return;
    }

    const cancellationPeriodValueNum =
      values.cancellationPeriodValue !== '' ? Number(values.cancellationPeriodValue) : null;

    onSubmit({
      name: String(values.name).trim(),
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

  let serviceUrlLink: React.ReactNode = null;
  try {
    if (values.serviceUrl) {
      new URL(String(values.serviceUrl));
      serviceUrlLink = (
        <Anchor
          href={String(values.serviceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          size="xs"
          truncate="end"
        >
          {values.serviceUrl}
        </Anchor>
      );
    }
  } catch {
    // invalid URL — no link shown
  }

  const categoryOptions = Object.values(Category).map((value) => ({
    value,
    label: t(`category.${value}`),
  }));

  const billingIntervalOptions = Object.values(BillingInterval).map((value) => ({
    value,
    label: t(`billingInterval.${value}`),
  }));

  const statusOptions = [
    { value: ContractStatus.ACTIVE, label: t('status.ACTIVE') },
    { value: ContractStatus.INACTIVE, label: t('status.INACTIVE') },
  ];

  const cancellationUnitOptions = Object.values(CancellationPeriodUnit).map((value) => ({
    value,
    label: t(`cancellationUnit.${value}`),
  }));

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {(validationError ?? error) && (
          <Alert role="alert" color="red">
            {validationError ?? error}
          </Alert>
        )}

        <div>
          <Group gap="xs" mb={4}>
            <Text component="label" htmlFor="name" size="sm" fw={500}>
              {t('contractForm.nameLabel')}
            </Text>
            {values.name && <ProviderLogo name={String(values.name)} size={20} />}
          </Group>
          <TextInput
            id="name"
            variant="filled"
            value={String(values.name)}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder={t('contractForm.namePlaceholder')}
          />
        </div>

        <Select
          id="category"
          label={t('contractForm.categoryLabel')}
          variant="filled"
          data={categoryOptions}
          value={String(values.category)}
          onChange={(val) => setValues((v) => ({ ...v, category: val ?? Category.SUBSCRIPTIONS }))}
          allowDeselect={false}
        />

        <NumberInput
          id="amount"
          label={t('contractForm.amountLabel')}
          variant="filled"
          prefix="€"
          decimalScale={2}
          min={0}
          value={values.amount === '' ? '' : Number(values.amount)}
          onChange={(val) => setValues((v) => ({ ...v, amount: val }))}
          placeholder="0.00"
        />

        <Select
          id="billingInterval"
          label={t('contractForm.billingIntervalLabel')}
          variant="filled"
          data={billingIntervalOptions}
          value={String(values.billingInterval)}
          onChange={(val) =>
            setValues((v) => ({ ...v, billingInterval: val ?? BillingInterval.MONTHLY }))
          }
          allowDeselect={false}
        />

        <Select
          id="status"
          label={t('contractForm.statusLabel')}
          variant="filled"
          data={statusOptions}
          value={String(values.status)}
          onChange={(val) => setValues((v) => ({ ...v, status: val ?? ContractStatus.ACTIVE }))}
          allowDeselect={false}
        />

        <div className={classes.dateGrid}>
          <TextInput
            id="startDate"
            label={t('contractForm.startDateLabel')}
            variant="filled"
            type="date"
            value={String(values.startDate)}
            onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
          />
          <TextInput
            id="endDate"
            label={t('contractForm.endDateLabel')}
            variant="filled"
            type="date"
            value={String(values.endDate)}
            onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
          />
        </div>

        <div>
          <Textarea
            id="details"
            label={t('contractForm.detailsLabel')}
            variant="filled"
            value={String(values.details)}
            onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
            rows={3}
            maxLength={2000}
            placeholder={t('contractForm.detailsPlaceholder')}
          />
          <Text size="xs" ta="right" c={String(values.details).length >= 1900 ? 'red' : 'dimmed'}>
            {String(values.details).length}/2000
          </Text>
        </div>

        <div>
          <TextInput
            id="serviceUrl"
            label={t('contractForm.serviceUrlLabel')}
            variant="filled"
            type="url"
            value={String(values.serviceUrl)}
            onChange={(e) => setValues((v) => ({ ...v, serviceUrl: e.target.value }))}
            placeholder={t('contractForm.serviceUrlPlaceholder')}
          />
          {serviceUrlLink}
        </div>

        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('contractForm.cancellationPeriodLabel')}
          </Text>
          <div className={classes.cancellationRow}>
            <NumberInput
              id="cancellationPeriodValue"
              aria-label={t('contractForm.cancellationPeriodLabel')}
              variant="filled"
              min={1}
              value={
                values.cancellationPeriodValue === '' ? '' : Number(values.cancellationPeriodValue)
              }
              onChange={(val) => setValues((v) => ({ ...v, cancellationPeriodValue: val }))}
              placeholder="e.g. 30"
              className={classes.cancellationNumber}
            />
            <Select
              id="cancellationPeriodUnit"
              aria-label={t('contractForm.cancellationUnitAriaLabel')}
              variant="filled"
              data={cancellationUnitOptions}
              value={String(values.cancellationPeriodUnit)}
              onChange={(val) =>
                setValues((v) => ({ ...v, cancellationPeriodUnit: val ?? 'MONTHS' }))
              }
              allowDeselect={false}
              className={classes.cancellationUnit}
            />
          </div>
        </div>

        <Checkbox
          id="anonymize"
          label={t('anonymization.anonymizeContract')}
          description={t('anonymization.anonymizeContractHint')}
          checked={values.anonymize}
          onChange={(e) => setValues((v) => ({ ...v, anonymize: e.target.checked }))}
        />

        <Group gap="sm" pt="xs">
          <Button type="submit" loading={isPending}>
            {isPending ? t('common.saving') : (submitLabel ?? t('common.save'))}
          </Button>
          <Button type="button" variant="default" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
