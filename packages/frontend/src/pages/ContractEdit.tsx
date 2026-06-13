import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Text, Alert, Stack, Title, Paper } from '@mantine/core';
import { useContracts, useUpdateContract } from '../services/contracts.js';
import { ContractForm } from '../components/ContractForm.js';

export function ContractEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contracts, isLoading, isError } = useContracts();
  const { mutate: updateContract, isPending, error } = useUpdateContract();

  if (isLoading) {
    return (
      <Center mih="40vh">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Center>
    );
  }

  if (isError || !contracts) {
    return (
      <Center mih="40vh">
        <Alert color="red">{t('contractEdit.loadError')}</Alert>
      </Center>
    );
  }

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <Center mih="40vh">
        <Text c="dimmed">{t('contractEdit.notFound')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <div>
        <Title order={2}>{t('contractEdit.title')}</Title>
        <Text size="sm" c="dimmed">
          {contract.name}
        </Text>
      </div>
      <Paper withBorder radius="md" p="lg">
        <ContractForm
          defaultValues={{
            name: contract.name,
            category: contract.category,
            amount: String(contract.amount),
            billingInterval: contract.billingInterval,
            status: contract.status,
            endDate: contract.endDate ?? '',
            startDate: contract.startDate ?? '',
            details: contract.details ?? '',
            serviceUrl: contract.serviceUrl ?? '',
            cancellationPeriodValue: contract.cancellationPeriod
              ? String(contract.cancellationPeriod.value)
              : '',
            cancellationPeriodUnit: contract.cancellationPeriod?.unit ?? 'MONTHS',
            anonymize: contract.anonymize,
          }}
          onSubmit={(data) =>
            updateContract(
              { id: contract.id, body: data },
              { onSuccess: () => navigate('/contracts') },
            )
          }
          onCancel={() => navigate('/contracts')}
          submitLabel={t('contractEdit.saveChanges')}
          isPending={isPending}
          error={error instanceof Error ? error.message : null}
        />
      </Paper>
    </Stack>
  );
}
