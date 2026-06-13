import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Stack, Title, Text, Paper, Alert, Button, Group, Center, Anchor } from '@mantine/core';
import type { ColumnMapping, ImportResult } from '../utils/columnMapping.js';
import { inferMappings, isMappingComplete } from '../utils/columnMapping.js';
import { parseJsonFile, parseExcelFile, runImport } from '../services/importParsing.js';
import type { ParsedImportFile } from '../services/importParsing.js';
import { ColumnMappingTable } from '../components/ColumnMappingTable.js';
import { ImportResultSummary } from '../components/ImportResultSummary.js';
import { useCreateContract } from '../services/contracts.js';
import classes from './ContractImport.module.css';

type Stage = 'idle' | 'parsing' | 'mapping' | 'importing' | 'done';

export function ContractImport() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { mutateAsync: createContract } = useCreateContract();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStage('parsing');

    try {
      let result: ParsedImportFile;
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        result = await parseJsonFile(file);
      } else {
        result = await parseExcelFile(file);
      }
      setParsed(result);
      setMappings(inferMappings(result.columns));
      setStage('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.parseError'));
      setStage('idle');
    }
  }

  async function handleConfirm() {
    if (!parsed || !isMappingComplete(mappings)) return;
    setStage('importing');
    const result = await runImport(parsed.rows, mappings, (body) => createContract(body));
    setImportResult(result);
    setStage('done');
  }

  function handleReset() {
    setStage('idle');
    setError(null);
    setParsed(null);
    setMappings([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const canConfirm = stage === 'mapping' && isMappingComplete(mappings);

  return (
    <Stack gap="lg" maw={900} mx="auto">
      <div>
        <Title order={2}>{t('import.title')}</Title>
        <Anchor component={Link} to="/contracts" size="sm">
          {t('nav.backToContracts')}
        </Anchor>
      </div>

      {stage === 'idle' && (
        <Paper withBorder radius="md" p="lg">
          {error && (
            <Alert color="red" mb="md">
              {error}
            </Alert>
          )}
          <label className={classes.dropZone}>
            <Upload size={32} color="var(--mantine-color-dimmed)" />
            <Text size="sm" fw={500}>
              {t('import.uploadLabel')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('import.uploadHint')}
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xlsx"
              className={classes.fileInput}
              aria-label={t('import.fileInputLabel')}
              onChange={handleFileChange}
            />
          </label>
        </Paper>
      )}

      {stage === 'parsing' && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}

      {stage === 'mapping' && parsed && (
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            {parsed.warnings.map((w) => (
              <Alert key={w} color="yellow">
                {w}
              </Alert>
            ))}
            <Text size="sm" c="dimmed">
              {t('import.mappingHint', { count: parsed.rows.length })}
            </Text>
            <ColumnMappingTable mappings={mappings} onChange={setMappings} />
            <Group gap="sm" align="center">
              <Button onClick={() => void handleConfirm()} disabled={!canConfirm}>
                {t('common.confirm')}
              </Button>
              <Button variant="default" onClick={handleReset}>
                {t('common.cancel')}
              </Button>
              {!canConfirm && (
                <Text size="xs" c="red">
                  {t('import.requiredFieldsMissing')}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>
      )}

      {stage === 'importing' && (
        <Center py="xl">
          <Text c="dimmed">{t('import.importing')}</Text>
        </Center>
      )}

      {stage === 'done' && importResult && (
        <Paper withBorder radius="md" p="lg">
          <ImportResultSummary result={importResult} onReset={handleReset} />
        </Paper>
      )}
    </Stack>
  );
}
