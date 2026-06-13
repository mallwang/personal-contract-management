import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Menu, Button } from '@mantine/core';
import type { ContractData } from '@pcm/shared';
import { exportToJson, exportToExcel } from '../services/export.js';

interface ExportMenuProps {
  contracts: ContractData[];
}

export function ExportMenu({ contracts }: ExportMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <Button variant="default" leftSection={<Download size={14} />} size="sm">
          {t('export.buttonLabel')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => exportToJson(contracts)}>{t('export.toJson')}</Menu.Item>
        <Menu.Item onClick={() => exportToExcel(contracts)}>{t('export.toExcel')}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
