import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import i18n from 'i18next';
import { useLocaleFormat } from '../../../src/hooks/useLocaleFormat.js';

describe('useLocaleFormat', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('formatCurrency', () => {
    it('formats a number as EUR currency in English locale', () => {
      const { result } = renderHook(() => useLocaleFormat());
      const formatted = result.current.formatCurrency(1234.56);
      // English locale: thousands separator is comma, decimal is period
      expect(formatted).toMatch(/1[, ]?234[.,]56/);
      expect(formatted).toContain('€');
    });

    it('formats zero correctly', () => {
      const { result } = renderHook(() => useLocaleFormat());
      expect(result.current.formatCurrency(0)).toContain('€');
    });
  });

  describe('formatCurrency in German locale', () => {
    it('uses German number conventions when language is de', async () => {
      await i18n.changeLanguage('de');
      const { result } = renderHook(() => useLocaleFormat());
      const formatted = result.current.formatCurrency(1234.56);
      // German locale: decimal separator is comma
      expect(formatted).toContain(',');
      expect(formatted).toContain('€');
    });
  });
});
