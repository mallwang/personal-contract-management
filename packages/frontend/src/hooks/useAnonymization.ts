import { useState } from 'react';
import type { ContractData } from '@pcm/shared';
import { FANTASY_NAMES, getFantasyName } from '../data/fantasyNames.js';

const STORAGE_KEY = 'pcm-anonymize';

export function useAnonymization() {
  const [isAnonymized, setIsAnonymized] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );

  function toggleAnonymization() {
    setIsAnonymized((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }

  function getDisplayName(contract: ContractData): string {
    if (isAnonymized || contract.anonymize) {
      return getFantasyName(contract.id, FANTASY_NAMES);
    }
    return contract.name;
  }

  return { isAnonymized, toggleAnonymization, getDisplayName };
}
