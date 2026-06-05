import { useTranslation } from 'react-i18next';

export function useLocaleFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale).format(new Date(iso));
  }

  return { formatCurrency, formatDate };
}
