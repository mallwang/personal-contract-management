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

  describe('formatDate', () => {
    it('formats an ISO date string in English locale (MM/DD/YYYY)', () => {
      const { result } = renderHook(() => useLocaleFormat());
      const formatted = result.current.formatDate('2026-05-27');
      // English locale with 2-digit padding: 05/27/2026
      expect(formatted).toMatch(/05[\/.]27[\/.]2026|27[\/.]05[\/.]2026/);
      expect(formatted).toContain('2026');
      expect(formatted).not.toBe('2026-05-27');
    });

    it('formats an ISO date string in German locale (DD.MM.YYYY)', async () => {
      await i18n.changeLanguage('de');
      const { result } = renderHook(() => useLocaleFormat());
      const formatted = result.current.formatDate('2026-05-27');
      // German locale with 2-digit padding: 27.05.2026
      expect(formatted).toBe('27.05.2026');
    });
  });
});
