import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Title, Paper } from '@mantine/core';
import { ContractForm } from '../components/ContractForm.js';
import { useCreateContract } from '../services/contracts.js';

export function ContractNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createContract, isPending, error } = useCreateContract();

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Title order={2}>{t('contractNew.title')}</Title>
      <Paper withBorder radius="md" p="lg">
        <ContractForm
          onSubmit={(data) => createContract(data, { onSuccess: () => navigate('/contracts') })}
          onCancel={() => navigate('/contracts')}
          submitLabel={t('nav.addContract')}
          isPending={isPending}
          error={error instanceof Error ? error.message : null}
        />
      </Paper>
    </Stack>
  );
}
