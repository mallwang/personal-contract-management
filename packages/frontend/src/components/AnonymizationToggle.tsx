import { useTranslation } from 'react-i18next';
import { Switch } from '@mantine/core';

interface AnonymizationToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function AnonymizationToggle({ isActive, onToggle }: AnonymizationToggleProps) {
  const { t } = useTranslation();

  return (
    <Switch
      checked={isActive}
      onChange={onToggle}
      aria-label={t('anonymization.toggleAriaLabel')}
      label={isActive ? t('anonymization.showReal') : t('anonymization.hideReal')}
      size="sm"
    />
  );
}
