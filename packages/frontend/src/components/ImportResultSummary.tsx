import { useTranslation } from 'react-i18next';
import { Stack, Alert, Text, List, Button, Code } from '@mantine/core';
import type { ImportResult } from '../utils/columnMapping.js';

interface ImportResultSummaryProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportResultSummary({ result, onReset }: ImportResultSummaryProps) {
  const { t } = useTranslation();
  const allOk = result.failed.length === 0;

  return (
    <Stack gap="md">
      <Alert color={allOk ? 'green' : 'orange'}>
        <Text fw={500} mb={4}>
          {t('import.result.summary', {
            total: result.total,
            created: result.created,
            failed: result.failed.length,
          })}
        </Text>
        <List size="sm">
          <List.Item>
            {t('import.result.total')}: <strong>{result.total}</strong>
          </List.Item>
          <List.Item c="green">
            {t('import.result.created')}: <strong>{result.created}</strong>
          </List.Item>
          {result.failed.length > 0 && (
            <List.Item c="red">
              {t('import.result.failed')}: <strong>{result.failed.length}</strong>
            </List.Item>
          )}
        </List>
      </Alert>

      {result.failed.length > 0 && (
        <div>
          <Text size="sm" fw={500} c="red" mb="xs">
            {t('import.result.errors')}
          </Text>
          <Stack gap={4}>
            {result.failed.map(({ rowIndex, message }) => (
              <Alert key={rowIndex} color="red" p="xs">
                <Code>
                  {t('import.result.row')} {rowIndex}:
                </Code>{' '}
                {message}
              </Alert>
            ))}
          </Stack>
        </div>
      )}

      <Button variant="default" onClick={onReset}>
        {t('import.result.importAnother')}
      </Button>
    </Stack>
  );
}
