import { describe, it, expect } from 'vitest';
import en from '../../../src/i18n/locales/en.json';
import de from '../../../src/i18n/locales/de.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe('Translation catalogue completeness', () => {
  const enKeys = flattenKeys(en as Record<string, unknown>);
  const deKeys = flattenKeys(de as Record<string, unknown>);

  it('English catalogue has all required translation keys (non-empty)', () => {
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('every key in en.json exists in de.json', () => {
    const missingInDe = enKeys.filter((k) => !deKeys.includes(k));
    expect(missingInDe, `Keys in en but missing in de: ${missingInDe.join(', ')}`).toHaveLength(0);
  });

  it('every key in de.json exists in en.json', () => {
    const missingInEn = deKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn, `Keys in de but missing in en: ${missingInEn.join(', ')}`).toHaveLength(0);
  });
});
