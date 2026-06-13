import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Group, Title, Button, Alert, Center, Text, Paper } from '@mantine/core';
import { useContracts, useDeleteContract } from '../services/contracts.js';
import { ContractTable } from '../components/ContractTable.js';
import { AnonymizationToggle } from '../components/AnonymizationToggle.js';
import { ExportMenu } from '../components/ExportMenu.js';
import { useAnonymization } from '../hooks/useAnonymization.js';

export function ContractList() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useContracts();
  const { mutate: deleteContract, error: deleteError } = useDeleteContract();
  const { isAnonymized, toggleAnonymization, getDisplayName } = useAnonymization();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>{t('contractList.title')}</Title>
        <Group gap="xs">
          <AnonymizationToggle isActive={isAnonymized} onToggle={toggleAnonymization} />
          {data && <ExportMenu contracts={data} />}
          <Button component={Link} to="/contracts/import" variant="default" size="sm">
            {t('import.linkLabel')}
          </Button>
          <Button component={Link} to="/contracts/new" size="sm">
            {t('nav.addContract')}
          </Button>
        </Group>
      </Group>

      {deleteError && <Alert color="red">{t('contractList.deleteError')}</Alert>}

      {isLoading && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}

      {isError && (
        <Alert color="red">
          {t('contractList.loadError')} {error instanceof Error ? error.message : ''}
        </Alert>
      )}

      {data && (
        <Paper withBorder>
          <ContractTable
            contracts={data}
            onDelete={(id) => deleteContract(id)}
            isAnonymized={isAnonymized}
            getDisplayName={getDisplayName}
          />
        </Paper>
      )}
    </Stack>
  );
}
