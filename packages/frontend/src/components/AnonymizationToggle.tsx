import { useTranslation } from 'react-i18next';

interface AnonymizationToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function AnonymizationToggle({ isActive, onToggle }: AnonymizationToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      aria-label={t('anonymization.toggleAriaLabel')}
      className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'border-foreground bg-foreground text-background hover:opacity-90'
          : 'border-[--color-border] bg-background text-foreground hover:bg-[--color-muted]'
      }`}
    >
      {isActive ? t('anonymization.showReal') : t('anonymization.hideReal')}
    </button>
  );
}
