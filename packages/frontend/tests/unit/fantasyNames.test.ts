import { describe, it, expect } from 'vitest';
import { getFantasyName, FANTASY_NAMES } from '../../src/data/fantasyNames.js';

describe('getFantasyName', () => {
  it('returns a non-empty string for any UUID-like id', () => {
    const result = getFantasyName('a1b2c3d4-e5f6-7890-abcd-ef1234567890', FANTASY_NAMES);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the same name for the same id on repeated calls', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const first = getFantasyName(id, FANTASY_NAMES);
    const second = getFantasyName(id, FANTASY_NAMES);
    const third = getFantasyName(id, FANTASY_NAMES);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('returns different names for different ids (distribution check)', () => {
    const ids = [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      'c3d4e5f6-a7b8-9012-cdef-123456789012',
      'd4e5f6a7-b8c9-0123-defa-234567890123',
      'e5f6a7b8-c9d0-1234-efab-345678901234',
    ];
    const names = ids.map((id) => getFantasyName(id, FANTASY_NAMES));
    const unique = new Set(names);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('cycles gracefully when contract count exceeds list length', () => {
    const shortList = ['Alpha Corp', 'Beta Ltd', 'Gamma Inc'];
    const ids = Array.from({ length: 9 }, (_, i) => `id-${i}`);
    const results = ids.map((id) => getFantasyName(id, shortList));
    results.forEach((name) => {
      expect(shortList).toContain(name);
      expect(name).toBeTruthy();
    });
  });

  it('returns a result from the list for 200 unique ids', () => {
    const ids = Array.from({ length: 200 }, (_, i) => `${i}-fake-uuid-${i * 7}`);
    ids.forEach((id) => {
      const name = getFantasyName(id, FANTASY_NAMES);
      expect(FANTASY_NAMES).toContain(name);
    });
  });

  it('FANTASY_NAMES has at least 30 entries', () => {
    expect(FANTASY_NAMES.length).toBeGreaterThanOrEqual(30);
  });
});

describe('getFantasyName – stability across toggling (US3)', () => {
  it('returns the identical name across 100 consecutive calls for the same id', () => {
    const id = 'stable-id-12345';
    const first = getFantasyName(id, FANTASY_NAMES);
    for (let i = 0; i < 99; i++) {
      expect(getFantasyName(id, FANTASY_NAMES)).toBe(first);
    }
  });

  it('all 200 unique ids produce a defined, non-empty name from the list', () => {
    for (let i = 0; i < 200; i++) {
      const id = `test-contract-${i}-padding-${i * 13}`;
      const name = getFantasyName(id, FANTASY_NAMES);
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
      expect(FANTASY_NAMES).toContain(name);
    }
  });

  it('produces multiple distinct names across 50 different ids (not all identical)', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `contract-${i}-uuid-${i * 17}`);
    const names = new Set(ids.map((id) => getFantasyName(id, FANTASY_NAMES)));
    expect(names.size).toBeGreaterThan(3);
  });
});
